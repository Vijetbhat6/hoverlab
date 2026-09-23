import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { sequenceForSource, type Sequence } from './sequences'

/**
 * The mailing list's double opt-in, as a state machine with no I/O.
 *
 * ── WHY DOUBLE OPT-IN AT ALL ───────────────────────────────────────────
 *
 * Until this existed, typing an address into the form put it on the list.
 * Anybody could type anybody else's address: a stranger's, an ex's, a
 * journalist's. The list then mailed people who never asked, under a
 * consent record ("consentedTo", "consentedAt") that was true only of
 * whoever pressed the button — a false record of consent about a third
 * party, which is the one thing that field is supposed to be evidence
 * against. Double opt-in makes the record true: the address is mailed a link
 * that only its owner can follow, and only following it counts.
 *
 * ── THE STATES ─────────────────────────────────────────────────────────
 *
 *   pending        Submitted, not yet confirmed. Receives NOTHING except
 *                  the one confirmation email.
 *   confirmed      Followed the link. The ONLY state that receives the
 *                  digest or a sequence. See `canReceiveMail`.
 *   unsubscribed   Opted out. Never mailed again unless they re-submit and
 *                  re-confirm.
 *   (legacy)       Rows written before this existed carry status
 *                  'subscribed' or no status at all. They never confirmed
 *                  anything, so they count as UNCONFIRMED and are not
 *                  mailed. `scripts/send-pending-confirmations.mts` can ask
 *                  them to confirm.
 *
 * ── TOKENS ─────────────────────────────────────────────────────────────
 *
 * 32 random bytes, base64url. Only a SHA-256 of the token is stored, so a
 * copy of the collection cannot be used to confirm anybody. That has one
 * consequence worth stating: the raw token exists only at the moment a
 * confirmation is issued. It cannot be re-read later, so "send it again"
 * means minting a new one (which supersedes the old), and a subscriber row
 * written while no mail transport is configured has NO token at all — there
 * is nothing to email and nobody to email it to. The sender mints one when
 * it actually sends.
 *
 * Tokens expire after seven days. Long enough for a person who does not
 * check a newsletter address daily, short enough that a forwarded old email
 * is not a permanent key.
 *
 * This module is pure — it imports `node:crypto` and the sequence copy, which
 * is plain data — so the script that sends pending confirmations and the route that receives them can share it
 * without dragging in the Firestore SDK, and so every transition is testable
 * without a database.
 */

export type SubscriberStatus = 'pending' | 'confirmed' | 'unsubscribed'

/** The fields of a subscriber row the state machine reads. Times are epoch ms. */
export interface SubscriberRow {
  status?: string
  confirmTokenHash?: string
  confirmTokenExpiresAt?: number
  confirmationSentAt?: number
}

export const CONFIRM_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

/**
 * How long before a pending address may be sent another confirmation.
 *
 * Without it, resubmitting the same address is a button that emails its
 * owner as often as anyone likes. The per-IP limit bounds one client; this
 * bounds the ADDRESS, whoever is pressing.
 */
export const RESEND_COOLDOWN_MS = 10 * 60 * 1000

/* ------------------------------------------------------------------ *
 *  Tokens
 * ------------------------------------------------------------------ */

export interface IssuedToken {
  /** Goes in the email link and nowhere else. Never stored. */
  token: string
  /** What is stored. */
  hash: string
  /** Epoch ms. */
  expiresAt: number
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Mint a confirmation token. `now` is a parameter so expiry is testable. */
export function issueToken(now: number = Date.now()): IssuedToken {
  const token = randomBytes(32).toString('base64url')
  return { token, hash: hashToken(token), expiresAt: now + CONFIRM_TOKEN_TTL_MS }
}

/** A well-formed token, checked before any database is asked about it. */
export function looksLikeToken(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value)
}

/**
 * Does `presented` match the stored hash?
 *
 * Constant-time on the digest. The lookup that finds a row is already by
 * hash equality in the database, so this is belt and braces — but it is
 * the function a reader will look for to see that a token is verified as
 * a token and not merely as a string that happened to be found.
 */
export function tokenMatches(presented: string, storedHash: string | undefined): boolean {
  if (!storedHash) return false
  const a = Buffer.from(hashToken(presented), 'hex')
  const b = Buffer.from(storedHash, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

/* ------------------------------------------------------------------ *
 *  Status
 * ------------------------------------------------------------------ */

/** A row's status, with every pre-double-opt-in shape folded into 'legacy'. */
export function statusOf(row: SubscriberRow | null | undefined): SubscriberStatus | 'legacy' {
  const status = row?.status
  return status === 'pending' || status === 'confirmed' || status === 'unsubscribed'
    ? status
    : 'legacy'
}

/**
 * May this row be mailed a digest or a sequence email?
 *
 * The single answer every sender must use. Only `confirmed` qualifies —
 * not `pending`, not `unsubscribed`, and not the legacy rows with no status,
 * which is the case a careless `status !== 'unsubscribed'` filter would
 * get wrong.
 */
export function canReceiveMail(row: SubscriberRow | null | undefined): boolean {
  return statusOf(row) === 'confirmed'
}

/**
 * The sequence a subscriber may be enrolled into — or null.
 *
 * `sequenceForSource` alone answers "which sequence does this signup
 * source map to", which is a property of the SOURCE and says nothing about
 * whether the person has agreed to be mailed. Any sender that walks the list
 * and enrols people must ask this instead, so an unconfirmed address can
 * never reach a sequence by way of a source that happens to have one.
 */
export function sequenceForSubscriber(
  row: (SubscriberRow & { source?: string }) | null | undefined,
): Sequence | null {
  if (!row || !canReceiveMail(row)) return null
  return sequenceForSource(row.source ?? '')
}

/* ------------------------------------------------------------------ *
 *  Transitions
 * ------------------------------------------------------------------ */

export type SubscribeAction =
  /** Nothing to write and nothing to send. */
  | { kind: 'noop' }
  /** Write the row as pending; email a confirmation if `send`. */
  | { kind: 'pending'; send: boolean }

/**
 * What submitting an address does, given what is already on file.
 *
 *   new                   → pending, send
 *   legacy                → pending, send (they never confirmed)
 *   unsubscribed          → pending, send. Someone re-entering an address
 *                           that opted out must confirm again: otherwise a
 *                           stranger could re-subscribe a person who left.
 *   pending               → stays pending; send again only after the
 *                           cooldown, or if nothing was ever sent
 *   confirmed             → noop. Never demoted by a re-submission, and never
 *                           re-mailed — which keeps the HTTP answer identical
 *                           to the others, so the form is not an oracle for
 *                           "is this address on the list".
 *
 * `mailConfigured: false` yields `send: false` everywhere: the row is still
 * recorded as pending (the consent request stands) and honestly marked as
 * not yet mailed.
 */
export function decideSubscribe(
  row: SubscriberRow | null,
  now: number,
  mailConfigured: boolean,
): SubscribeAction {
  const status = statusOf(row)
  if (row && status === 'confirmed') return { kind: 'noop' }

  if (row && status === 'pending') {
    const last = row.confirmationSentAt
    const coolingDown = typeof last === 'number' && now - last < RESEND_COOLDOWN_MS
    return { kind: 'pending', send: mailConfigured && !coolingDown }
  }

  return { kind: 'pending', send: mailConfigured }
}

export type ConfirmOutcome =
  | 'confirmed'
  | 'already-confirmed'
  /** No row has this token — wrong, mistyped, or superseded by a newer one. */
  | 'invalid'
  | 'expired'
  /** They opted out after asking to join; the link must not undo that. */
  | 'unsubscribed'

/**
 * What following a confirmation link does to the row it belongs to.
 *
 * `row` is the row the token's hash was found on (null when none was).
 * Order matters: an already-confirmed row answers "already confirmed" even
 * past the expiry, because a person who clicks twice, or whose mail client
 * pre-fetched the link, should be told they are fine rather than that the
 * link has expired.
 */
export function decideConfirm(
  row: SubscriberRow | null,
  presented: string,
  now: number,
): ConfirmOutcome {
  if (!row || !tokenMatches(presented, row.confirmTokenHash)) return 'invalid'

  const status = statusOf(row)
  if (status === 'confirmed') return 'already-confirmed'
  if (status === 'unsubscribed') return 'unsubscribed'

  const expiresAt = row.confirmTokenExpiresAt
  if (typeof expiresAt !== 'number' || now > expiresAt) return 'expired'

  return 'confirmed'
}
