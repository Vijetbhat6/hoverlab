import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { requireTeam } from '@/lib/billing/require-team'
import {
  getSharedBrands,
  replaceSharedBrands,
} from '@/lib/firebase/team-brand-library'
import {
  BRAND_LIBRARY_LIMITS,
  sanitizeSavedBrand,
  sortSavedBrands,
  type SavedBrand,
} from '@/lib/brand-library'

/**
 * GET  /api/team/brand-presets → { brands: SharedBrand[] }
 * PUT  /api/team/brand-presets   body { brands } → { brands }
 *
 * The workspace's shared brand library — the first Team differentiator
 * that is not a promise. See `lib/firebase/team-brand-library.ts` for why
 * this one and not the other three.
 *
 * Every member may write, not just the owner. A shared palette that only
 * one person can edit is a palette that goes stale the week they go on
 * holiday, and the failure mode of the permissive version — someone
 * renames a colour — is trivially reversible where the restrictive one
 * blocks the team.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'private, no-store' }

export const GET = withJsonErrors('team/brand-presets', async () => {
  const gate = await requireTeam('The shared brand library')
  if ('response' in gate) return gate.response

  return NextResponse.json(
    { brands: await getSharedBrands(gate.teamId) },
    { headers: NO_STORE },
  )
})

export const PUT = withJsonErrors('team/brand-presets', async (req: Request) => {
  const gate = await requireTeam('The shared brand library')
  if ('response' in gate) return gate.response

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { brands } = (body ?? {}) as { brands?: unknown }
  if (!Array.isArray(brands)) {
    return NextResponse.json({ error: '`brands` must be an array.' }, { status: 400 })
  }

  // Same de-duplication and cap as the personal library. A shared library
  // is not a bigger library — fifty named colours is already past the point
  // where anyone can find the one they want.
  const byId = new Map<string, SavedBrand>()
  for (const raw of brands) {
    const clean = sanitizeSavedBrand(raw)
    if (!clean) continue
    byId.set(clean.id, clean)
    if (byId.size >= BRAND_LIBRARY_LIMITS.perAccount) break
  }

  const clean = sortSavedBrands([...byId.values()])
  await replaceSharedBrands(gate.teamId, clean, gate.userId)

  return NextResponse.json(
    { brands: await getSharedBrands(gate.teamId) },
    { headers: NO_STORE },
  )
})
