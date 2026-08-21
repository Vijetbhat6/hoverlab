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
 * A free account gets 402, not 403. The distinction matters to the client —
 * 403 reads as "you may never", which would be wrong, and the panel needs to
 * know it should render an upgrade prompt rather than an error.
 */

import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { getCurrentUser } from '@/lib/session'
import { getEntitlements } from '@/lib/billing/entitlements'
import { getCollections, replaceCollections } from '@/lib/firebase/collections'
import {
  COLLECTION_LIMITS,
  sanitizeCollection,
  sortCollections,
  type Collection,
} from '@/lib/collections'

export const runtime = 'nodejs'

/**
 * Built per call, not hoisted to a module constant: a Response body is a
 * stream that can be read once, so a shared instance would serve an empty
 * body to the second request that hit it.
 */
function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
}

/**
 * Resolve the caller, or the response that should be returned instead.
 *
 * Returned rather than thrown so both handlers share one code path and
 * neither can forget the entitlement half of the check.
 */
async function requirePro(): Promise<
  { userId: string } | { response: NextResponse }
> {
  const user = await getCurrentUser()
  if (!user) return { response: unauthorized() }

  const ent = await getEntitlements(user.id)
  if (!ent.canUseProFeatures) {
    return {
      response: NextResponse.json(
        {
          error: 'Private collections are part of Pro.',
          upgrade: '/#pricing',
        },
        { status: 402 },
      ),
    }
  }

  return { userId: user.id }
}

async function handleGet() {
  const gate = await requirePro()
  if ('response' in gate) return gate.response

  return NextResponse.json({ collections: await getCollections(gate.userId) })
}

async function handlePut(req: Request) {
  const gate = await requirePro()
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
