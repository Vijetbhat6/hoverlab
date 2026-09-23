import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { ARTIFACT_LEVELS, type ArtifactLevel } from '@/lib/artifact-types'
import { COLLECTION_LIMITS } from '@/lib/collections'

/**
 * Public share links for a private collection — the rules, with no I/O.
 *
 * A collection is private by construction: `/api/sync/collections` is
 * Pro-gated and the data lives under `users/{uid}`. A share link is the
 * owner deliberately opening ONE collection to anyone holding a URL, and it
 * has to be exactly that and nothing wider. Three decisions follow.
 *
 * ── THE TOKEN IS THE CAPABILITY ────────────────────────────────────────
 *
 * `/c/<token>` is unguessable — 24 bytes from `crypto.randomBytes`, 32
 * base64url characters, 192 bits — and is NOT the collection's document id.
 * That id is a client-generated UUID that also appears in the owner's own
 * requests and in Firestore paths; a link derived from it would tie the
 * public URL to an identifier that is not secret and could not be revoked
 * without destroying the collection. The token exists only for sharing:
 * revoking deletes it, and a new share mints a different one.
 *
 * The public lookup is keyed by a SHA-256 of the token, so the document id in
 * Firestore paths and logs is not itself a working URL.
 *
 * ── THE PAYLOAD IS A WHITELIST ─────────────────────────────────────────
 *
 * `toPublicShare` builds the public view by naming the fields it wants, never
 * by removing the ones it does not: the collection's name, and for each item
 * the LEVEL and ID. Everything else about the artifact — its name, category,
 * preview — is looked up from the public catalog when the page renders, so a
 * name typed into the owner's collection document cannot surface on a
 * public page. The owner's uid, email and display name are not in the
 * collection document in the first place and are not carried anywhere near
 * this view; `collection-share.test.ts` builds a hostile input and asserts
 * none of it comes through.
 *
 * The collection's description is also left out. It is a private note ("for
 * the Northwind pitch") and sharing a list of artifacts is not consent to
 * publish the note.
 *
 * ── LIFECYCLE ──────────────────────────────────────────────────────────
 *
 *   create   idempotent: a collection with a live link gets the SAME link
 *            back, so pressing the button twice cannot mint two.
 *   resolve  token -> the owner's uid and collection id, SERVER-SIDE ONLY,
 *            or null. Never sent to a browser.
 *   revoke   deletes the token; the old URL answers 404 on the next request.
 *
 * Pure functions over a `ShareStore` interface so the whole lifecycle,
 * including revocation, is testable without Firestore.
 */

/* ------------------------------------------------------------------ *
 *  Tokens
 * ------------------------------------------------------------------ */

/** 24 random bytes -> 32 base64url characters. */
export function newShareToken(): string {
  return randomBytes(24).toString('base64url')
}

const TOKEN_RE = /^[A-Za-z0-9_-]{32}$/

/**
 * A well-formed token, checked BEFORE any database is asked about it.
 * Scanners hit `/c/<anything>` constantly; a malformed one is answered 404
 * without a Firestore read.
 */
export function looksLikeShareToken(value: unknown): value is string {
  return typeof value === 'string' && TOKEN_RE.test(value)
}

/** What the public lookup document is keyed by. */
export function shareKey(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Constant-time comparison of two tokens. */
export function sameToken(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/* ------------------------------------------------------------------ *
 *  Store + lifecycle
 * ------------------------------------------------------------------ */

/** A collection id that is safe to use inside a document path. */
export function isSafeCollectionId(id: unknown): id is string {
  return (
    typeof id === 'string' &&
    id.length > 0 &&
    id.length <= 64 &&
    /^[A-Za-z0-9_-]+$/.test(id) &&
    !id.startsWith('__')
  )
}

export interface OwnedShare {
  token: string
  /** Epoch ms. */
  createdAt: number
}

export interface SharedTarget {
  uid: string
  collectionId: string
}

export interface ShareStore {
  /** The live share on this collection, if any. */
  getOwned(uid: string, collectionId: string): Promise<OwnedShare | null>
  /**
   * Record a share, atomically: if the collection already has one, return
   * THAT one and write nothing. `created` says which happened.
   */
  create(
    uid: string,
    collectionId: string,
    share: OwnedShare,
  ): Promise<OwnedShare & { created: boolean }>
  /** Delete the share (both records). True when there was one. */
  remove(uid: string, collectionId: string): Promise<boolean>
  /** The public lookup: hash of a token -> what it opens. */
  lookup(key: string): Promise<SharedTarget | null>
}

export async function createShare(
  store: ShareStore,
  uid: string,
  collectionId: string,
  now: number = Date.now(),
  mint: () => string = newShareToken,
): Promise<OwnedShare & { created: boolean }> {
  if (!isSafeCollectionId(collectionId)) throw new Error('invalid collection id')
  const existing = await store.getOwned(uid, collectionId)
  if (existing) return { ...existing, created: false }
  return store.create(uid, collectionId, { token: mint(), createdAt: now })
}

export async function revokeShare(
  store: ShareStore,
  uid: string,
  collectionId: string,
): Promise<boolean> {
  if (!isSafeCollectionId(collectionId)) return false
  return store.remove(uid, collectionId)
}

/**
 * The owner and collection a token opens, or null.
 *
 * Null for a malformed token, an unknown one and a revoked one alike — the
 * caller answers all three with the same 404, so nothing distinguishes "never
 * existed" from "was shared and stopped".
 */
export async function resolveShare(
  store: ShareStore,
  token: unknown,
): Promise<SharedTarget | null> {
  if (!looksLikeShareToken(token)) return null
  return store.lookup(shareKey(token))
}

/* ------------------------------------------------------------------ *
 *  The public view
 * ------------------------------------------------------------------ */

export interface PublicShareItem {
  level: ArtifactLevel
  id: string
}

/** Everything a public page may know about a collection. */
export interface PublicShare {
  name: string
  items: PublicShareItem[]
}

/**
 * Build the public view of a collection by naming what is allowed through.
 *
 * `raw` is whatever came out of the owner's document. Only `name` and each
 * item's `level` and `id` are read; nothing else is copied, so a field added
 * to the collection document tomorrow is private until somebody decides
 * otherwise here. An item with an unknown level falls back to `effect`, the
 * same default `levelOf` gives everywhere; a duplicate is dropped.
 */
export function toPublicShare(raw: unknown): PublicShare | null {
  if (!raw || typeof raw !== 'object') return null
  const source = raw as { name?: unknown; items?: unknown }

  const name = typeof source.name === 'string' ? source.name.trim() : ''
  if (!name) return null

  const items: PublicShareItem[] = []
  const seen = new Set<string>()
  if (Array.isArray(source.items)) {
    for (const entry of source.items) {
      if (!entry || typeof entry !== 'object') continue
      const item = entry as { id?: unknown; level?: unknown }
      if (typeof item.id !== 'string' || !item.id) continue
      const level =
        ARTIFACT_LEVELS.find((l) => l === item.level) ?? ('effect' as ArtifactLevel)
      const key = `${level}:${item.id}`
      if (seen.has(key)) continue
      seen.add(key)
      items.push({ level, id: item.id })
      if (items.length >= COLLECTION_LIMITS.itemsPerCollection) break
    }
  }

  return { name: name.slice(0, COLLECTION_LIMITS.nameLength), items }
}
