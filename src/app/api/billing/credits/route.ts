import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getEntitlements, FREE_ENTITLEMENTS } from '@/lib/billing/entitlements'
import {
  getCreditState,
  CREDIT_PACKS,
  FREE_DAILY_ACTIONS,
} from '@/lib/billing/credits'
import { withJsonErrors } from '@/lib/route-errors'

/**
 * The current user's AI credit balance, and what a top-up costs.
 *
 * GET → { balance, allowance, purchased, monthlyAllowance, freeRemaining,
 *         renewsAt, freeDaily, packs }
 *
 * Display only. Every generation re-checks and spends server-side, so a
 * client that edits this response gets a nicer number and no more calls.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withJsonErrors('api/billing/credits', async () => {
  const packs = CREDIT_PACKS.map((pack) => ({
    id: pack.id,
    name: pack.name,
    credits: pack.credits,
    priceCents: pack.priceCents,
    priceInrPaise: pack.priceInrPaise,
    purchasable: pack.polarProductId !== null,
  }))

  const session = await getSession()
  if (!session) {
    return NextResponse.json({
      balance: 0,
      allowance: 0,
      purchased: 0,
      monthlyAllowance: 0,
      // An anonymous visitor has used none of today's free actions because
      // they cannot make any — /api/ai/variant needs a session to meter
      // against. Reported as the full allowance so the UI can say what
      // signing in is worth rather than showing a zero.
      freeRemaining: FREE_DAILY_ACTIONS,
      renewsAt: null,
      freeDaily: FREE_DAILY_ACTIONS,
      packs,
      signedIn: false,
    })
  }

  const ent = await getEntitlements(session.uid).catch(() => FREE_ENTITLEMENTS)
  const state = await getCreditState(session.uid, ent)

  return NextResponse.json(
    { ...state, freeDaily: FREE_DAILY_ACTIONS, packs, signedIn: true },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
})
