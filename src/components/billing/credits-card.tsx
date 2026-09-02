'use client'

/**
 * <CreditsCard> — the credit balance, and what to do when it runs low.
 *
 * Sits below the plan tiers rather than among them, because credits are
 * not a tier. They used to be one — Pro+, $9/month — and this card used to
 * sell it. They are inside the licence now (`includedCredits` in
 * billing/plans.ts), so the card reports a balance and points at Pro or a
 * top-up pack rather than at a second subscription.
 *
 * Three states in one card — no allowance, subscribed, and out — because
 * they are the same question ("what can I generate?") answered with
 * different numbers, and splitting them into separate cards would put the
 * balance somewhere different depending on what you had bought.
 */

import * as React from 'react'
import { Loader2, Sparkles, Zap } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useCheckout } from '@/hooks/use-checkout'
import { useEntitlements } from '@/hooks/use-entitlements'
import { usePricing } from '@/hooks/use-pricing'
import { PLANS, formatPrice, formatPriceInr } from '@/lib/billing/plans'

interface Pack {
  id: string
  name: string
  credits: number
  priceCents: number
  purchasable: boolean
}

interface CreditsResponse {
  balance: number
  allowance: number
  purchased: number
  monthlyAllowance: number
  freeRemaining: number
  freeDaily: number
  renewsAt: string | null
  packs: Pack[]
  signedIn: boolean
}

export function CreditsCard() {
  const { entitlements } = useEntitlements()
  const { startCheckout, pendingPlan } = useCheckout()
  const { currency } = usePricing()
  const [state, setState] = React.useState<CreditsResponse | null>(null)
  const [buying, setBuying] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    fetch('/api/billing/credits')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CreditsResponse | null) => {
        if (!cancelled && data) setState(data)
      })
      .catch(() => {
        // Leave it null and render nothing: an account page that shows a
        // broken balance is worse than one that shows no balance.
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function buyPack(packId: string) {
    if (buying) return
    setBuying(packId)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack: packId }),
      })
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        toast.error(data.error ?? 'Could not start checkout.')
        return
      }
      window.location.href = data.url
    } finally {
      setBuying(null)
    }
  }

  if (!state) return null

  const hasAllowance = state.monthlyAllowance > 0

  /*
   * The Pro+ upsell that used to sit here is gone: credits ship inside the
   * licence now (`includedCredits` in billing/plans.ts), so the answer to
   * "I want more credits" is Pro, or a top-up pack, not a second
   * subscription. `isPurchasable` already refuses a `plus` checkout, so
   * leaving the button would have offered a plan the API declines.
   *
   * What replaces it is an upgrade prompt for accounts with no licence,
   * pointing at the thing that grants both the credits and everything else.
   */
  const proCredits = PLANS.pro.includedCredits ?? 0
  const proPrice =
    currency === 'INR' ? formatPriceInr(PLANS.pro.priceCents) : formatPrice(PLANS.pro.priceCents)

  return (
    <Card className="mt-6 border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap aria-hidden className="h-4 w-4 text-primary" />
          AI credits
        </CardTitle>
        <CardDescription>
          {hasAllowance ? (
            <>
              {state.balance.toLocaleString('en-US')} credits available —{' '}
              {state.allowance.toLocaleString('en-US')} from this month&apos;s
              allowance
              {state.purchased > 0 && (
                <> and {state.purchased.toLocaleString('en-US')} bought</>
              )}
              .
            </>
          ) : (
            <>
              {state.freeRemaining} of {state.freeDaily} free generations left
              today
              {state.purchased > 0 && (
                <>, plus {state.purchased.toLocaleString('en-US')} bought credits</>
              )}
              . Everything else on Hoverlab is free and unmetered — this is the
              only thing that costs anything to run.
            </>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {!entitlements?.canUseProFeatures && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/40 p-3">
            <div className="text-sm">
              <p className="font-medium">Pro — {proPrice} once</p>
              <p className="text-muted-foreground">
                Includes {proCredits.toLocaleString('en-US')} credits that never
                expire, plus the commercial licence and everything else on the
                plan. No subscription.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => startCheckout('pro')}
              disabled={pendingPlan === 'pro'}
            >
              {pendingPlan === 'pro' ? (
                <Loader2 aria-hidden className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles aria-hidden className="mr-1.5 h-3.5 w-3.5" />
              )}
              Get Pro
            </Button>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium">Top up</p>
          {/*
            "Monthly allowance" only applies to a Team seat now — Pro and
            Studio grant their credits once, into this same never-expiring
            bucket. Saying it unconditionally would tell a Pro customer they
            have an allowance they do not have.
          */}
          <p className="mb-3 text-xs text-muted-foreground">
            One-time packs. They never expire
            {hasAllowance
              ? ', and they are spent only after your monthly allowance runs out.'
              : ', and they sit alongside the credits included with your licence.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {state.packs.map((pack) => (
              <Button
                key={pack.id}
                size="sm"
                variant="outline"
                disabled={!pack.purchasable || buying !== null}
                onClick={() => buyPack(pack.id)}
              >
                {buying === pack.id && (
                  <Loader2 aria-hidden className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                {pack.name} — {formatPrice(pack.priceCents)}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
