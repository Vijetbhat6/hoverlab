/**
 * GET  /api/sync/brand-presets  → { brands: SavedBrand[] }
 * PUT  /api/sync/brand-presets  body { brands: SavedBrand[] } → { brands }
 *
 * Auth AND a Pro licence required — the gate and its 402 are in
 * `billing/require-pro.ts`.
 *
 * Note what is NOT gated: the ten curated presets and the hue/chroma
 * sliders stay free, because recolouring the catalog is how you evaluate an
 * effect against your own palette. What Pro buys is keeping the colour —
 * naming it, and having it follow the account rather than the browser. See
 * `lib/brand-library.ts` for why the line is drawn there.
 */

import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { requirePro } from '@/lib/billing/require-pro'
import { getSavedBrands, replaceSavedBrands } from '@/lib/firebase/brand-library'
import {
  BRAND_LIBRARY_LIMITS,
  sanitizeSavedBrand,
  sortSavedBrands,
  type SavedBrand,
} from '@/lib/brand-library'

export const runtime = 'nodejs'

async function handleGet() {
  const gate = await requirePro('Saved brand presets')
  if ('response' in gate) return gate.response

  return NextResponse.json({ brands: await getSavedBrands(gate.userId) })
}

async function handlePut(req: Request) {
  const gate = await requirePro('Saved brand presets')
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

  const byId = new Map<string, SavedBrand>()
  for (const raw of brands) {
    const clean = sanitizeSavedBrand(raw)
    if (!clean) continue
    byId.set(clean.id, clean)
    if (byId.size >= BRAND_LIBRARY_LIMITS.perAccount) break
  }

  const clean = sortSavedBrands([...byId.values()])
  await replaceSavedBrands(gate.userId, clean)

  return NextResponse.json({ brands: clean })
}

export const GET = withJsonErrors('sync/brand-presets', handleGet)
export const PUT = withJsonErrors('sync/brand-presets', handlePut)
