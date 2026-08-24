/**
 * GET  /api/sync/collections  → { collections: Collection[] }
 * PUT  /api/sync/collections  body { collections: Collection[] } → { collections }
 *
 * Auth AND a Pro licence required. Replaces the whole set on PUT, matching
 * the favorites and bundle routes.
 *
 * This is the one place in the product where a paywall is actually a wall.
 * Everything else Pro sells is either a licence (unenforceable by
 * construction — see `billing/plans.ts`) or a client-side transform of
 * public CSS (`lib/export`, where the honest limits are written down).
 * Collections are server-held state, so the check here is the feature: a
 * free account cannot store one, and there is no local mode to fall back to.
 *
 * The gate itself lives in `billing/require-pro.ts`, shared with the saved
 * brand library — including why a free account gets 402 rather than 403.
 */

import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { requirePro } from '@/lib/billing/require-pro'
import { getCollections, replaceCollections } from '@/lib/firebase/collections'
import {
  COLLECTION_LIMITS,
  sanitizeCollection,
  sortCollections,
  type Collection,
} from '@/lib/collections'

export const runtime = 'nodejs'

async function handleGet() {
  const gate = await requirePro('Private collections')
  if ('response' in gate) return gate.response

  return NextResponse.json({ collections: await getCollections(gate.userId) })
}

async function handlePut(req: Request) {
  const gate = await requirePro('Private collections')
  if ('response' in gate) return gate.response

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { collections } = (body ?? {}) as { collections?: unknown }
  if (!Array.isArray(collections)) {
    return NextResponse.json(
      { error: '`collections` must be an array.' },
      { status: 400 },
    )
  }

  // Dedupe by id, last write wins — the same shape as the bundle route, and
  // it means a client that somehow sends a collection twice stores one.
  const byId = new Map<string, Collection>()
  for (const raw of collections) {
    const clean = sanitizeCollection(raw)
    if (!clean) continue
    byId.set(clean.id, clean)
    if (byId.size >= COLLECTION_LIMITS.perAccount) break
  }

  const clean = sortCollections([...byId.values()])
  await replaceCollections(gate.userId, clean)

  return NextResponse.json({ collections: clean })
}

export const GET = withJsonErrors('sync/collections', handleGet)
export const PUT = withJsonErrors('sync/collections', handlePut)
