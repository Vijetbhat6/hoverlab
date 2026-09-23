/**
 * GET    /api/sync/collections/share?collectionId=…  → { shared, path? }
 * POST   /api/sync/collections/share  body { collectionId } → { shared: true, path }
 * DELETE /api/sync/collections/share  body { collectionId } → { shared: false }
 *
 * The owner's controls for a public share link on one private collection.
 * The public side is `/c/<token>` (app/c/[token]/page.tsx), which needs no
 * account and calls none of this.
 *
 * WHO MAY DO WHAT
 *
 *   POST     Pro. Creating a share is the Pro feature, and this is where it
 *            is enforced — the same wall as the collections themselves
 *            (`billing/require-pro.ts`). A free account gets 402.
 *   GET      Any signed-in owner. Reads the state of a share; gates nothing.
 *   DELETE   Any signed-in owner, Pro or not. Revoking must never be behind
 *            a paywall: somebody whose licence lapsed must still be able to
 *            take down a link they made while it was active, immediately.
 *
 * The share is scoped to the CALLER. Every store call takes the session's
 * uid, never one from the request, so one account cannot create, read or
 * revoke another's share by guessing a collection id.
 *
 * POST refuses a collection the server has not stored yet. Collections are
 * pushed on a debounce (`hooks/use-collections.ts`), so a brand-new one can
 * exist in the browser for a second before it exists here, and a link to a
 * collection that 404s would be worse than a short wait. The client is told
 * to try again (409).
 *
 * The response carries a PATH, not an origin: the client knows its own, and
 * building an absolute URL here would depend on NEXT_PUBLIC_SITE_URL being
 * right on every deployment.
 *
 * `Cache-Control: no-store` throughout — a revoked link must not be served
 * back to its owner from a cache.
 */

import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { requirePro } from '@/lib/billing/require-pro'
import { getCurrentUser } from '@/lib/session'
import { isAdminConfigured } from '@/lib/firebase/admin'
import {
  collectionExists,
  firestoreShareStore,
} from '@/lib/firebase/collection-shares'
import { createShare, isSafeCollectionId, revokeShare } from '@/lib/collection-share'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'no-store' }

const sharePath = (token: string) => `/c/${token}`

async function readCollectionId(req: Request): Promise<string | null> {
  const fromQuery = new URL(req.url).searchParams.get('collectionId')
  if (fromQuery) return isSafeCollectionId(fromQuery) ? fromQuery : null
  const body = (await req.json().catch(() => null)) as { collectionId?: unknown } | null
  return isSafeCollectionId(body?.collectionId) ? body.collectionId : null
}

const badId = () =>
  NextResponse.json(
    { error: 'A valid collectionId is required.' },
    { status: 400, headers: NO_STORE },
  )

async function handleGet(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const collectionId = await readCollectionId(req)
  if (!collectionId) return badId()

  const owned = await firestoreShareStore.getOwned(user.id, collectionId)
  return NextResponse.json(
    owned ? { shared: true, path: sharePath(owned.token) } : { shared: false },
    { headers: NO_STORE },
  )
}

async function handlePost(req: Request) {
  const gate = await requirePro('Sharing a collection')
  if ('response' in gate) return gate.response

  const collectionId = await readCollectionId(req)
  if (!collectionId) return badId()

  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: 'Sharing is not configured on this deployment.' },
      { status: 503, headers: NO_STORE },
    )
  }

  if (!(await collectionExists(gate.userId, collectionId))) {
    return NextResponse.json(
      {
        error:
          'That collection has not finished saving yet. Give it a moment and try again.',
      },
      { status: 409, headers: NO_STORE },
    )
  }

  const share = await createShare(firestoreShareStore, gate.userId, collectionId)
  return NextResponse.json(
    { shared: true, path: sharePath(share.token) },
    { status: share.created ? 201 : 200, headers: NO_STORE },
  )
}

async function handleDelete(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const collectionId = await readCollectionId(req)
  if (!collectionId) return badId()

  // Idempotent: revoking a collection that was never shared is the same
  // answer as revoking one that was.
  await revokeShare(firestoreShareStore, user.id, collectionId)
  return NextResponse.json({ shared: false }, { headers: NO_STORE })
}

export const GET = withJsonErrors('sync/collections/share', handleGet)
export const POST = withJsonErrors('sync/collections/share', handlePost)
export const DELETE = withJsonErrors('sync/collections/share', handleDelete)
