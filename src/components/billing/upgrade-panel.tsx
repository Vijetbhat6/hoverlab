'use client'

/**
 * <UpgradePanel> — the buy surface for signed-in users, on /account.
 *
 * Until this existed the only way to pay was the landing page's pricing
 * section: someone who signed up, or who came back a week later, had no
 * route to a checkout from inside the product.
 *
 * It deliberately renders <PricingTiers> — the same section the landing
 * page shows — rather than a compact variant of its own. A second pricing
 * UI is a second thing to keep truthful: two sets of tier copy, two sets of
 * feature lists, two places to update when a price moves. Customers also
 * compare plans the same way whether or not they happen to be signed in, so
 * the smaller layout was making the decision harder for no gain. That
 * component reads entitlements itself, so a tier this account already holds
 * says so instead of offering to sell it again.
 *
 * What lives here is the part that only makes sense post-login: Polar's
 * post-checkout return, which lands on /account?checkout=success and which
 * nothing was reading.
 *
 * Nothing here grants access. Checkout opens a Polar page; the entitlement
 * is written by /api/billing/webhook after Polar confirms payment.
 */

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PricingTiers } from '@/components/landing/pricing-tiers'
import { useEntitlements } from '@/hooks/use-entitlements'
import { track } from '@/lib/analytics'
import { PLANS, parsePlanId, type PlanId } from '@/lib/billing/plans'

/** How long to wait for the webhook before telling the user to sit tight. */
const CONFIRM_TIMEOUT_MS = 24_000
const CONFIRM_INTERVAL_MS = 2_000

/**
 * Poll entitlements until a completed purchase shows up.
 *
 * The success redirect is cosmetic: it races Polar's webhook, which is what
 * actually grants access. Landing on a page that still says "Free" after
 * paying reads as a failed payment, so this waits for the grant rather than
 * reporting whatever state happens to be visible on arrival.
 */
function useCheckoutReturn(
  refresh: () => Promise<{ plan: PlanId } | null>,
  hasPaidPlan: boolean,
) {
  const router = useRouter()
  const params = useSearchParams()
  const [confirming, setConfirming] = React.useState(false)

  const succeeded = params.get('checkout') === 'success'
  const boughtPlan = parsePlanId(params.get('plan'))
  const boughtSeats = Math.max(Number(params.get('seats')) || 1, 1)

  // Kept in a ref so the polling effect doesn't restart on every refresh
  // identity change — restarting would stretch the timeout indefinitely.
  const refreshRef = React.useRef(refresh)
  React.useEffect(() => {
    refreshRef.current = refresh
  }, [refresh])

  React.useEffect(() => {
    if (!succeeded) return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const startedAt = Date.now()
    setConfirming(true)

    /** Drop the query params so a reload doesn't replay this. */
    const settle = () => {
      if (cancelled) return
      setConfirming(false)
      router.replace('/account#billing')
    }

    const poll = async () => {
      const value = await refreshRef.current()
      if (cancelled) return

      if (value && value.plan !== 'free') {
        const plan = boughtPlan && boughtPlan !== 'free' ? boughtPlan : value.plan
        const catalogPlan = PLANS[plan]
        track('purchase_completed', {
          plan,
          interval: catalogPlan.interval,
          // Client-reported and advisory: the webhook records the amount
          // Polar actually charged, which is what any revenue figure should
          // be read from. This exists to close the funnel, not to count money.
          amount_cents:
            catalogPlan.priceCents * (catalogPlan.perSeat ? boughtSeats : 1),
        })
        toast.success(`You're on ${catalogPlan.name}.`, {
          description: 'Thanks for buying — everything is unlocked on this account.',
        })
        settle()
        return
      }

      if (Date.now() - startedAt >= CONFIRM_TIMEOUT_MS) {
        toast.info('Payment received.', {
          description:
            'Your plan will appear here within a few minutes. Refresh if it doesn’t.',
        })
        settle()
        return
      }

      timer = setTimeout(poll, CONFIRM_INTERVAL_MS)
    }

    poll()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
    // Intentionally keyed only on arrival. `refresh` is read through a ref
    // and the return params are fixed for the life of the visit; re-running
    // on an identity change would start a second polling chain and stretch
    // the timeout indefinitely.
  }, [succeeded])

  // Someone who already holds a paid plan and lands here again (bookmark,
  // back button) shouldn't be shown a spinner.
  return confirming && !hasPaidPlan
}

/** Card shell for the states where there are no tiers to show yet. */
function PanelMessage({
  title,
  children,
  action,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <Card id="billing" className="mt-6 scroll-mt-24 border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          {children}
        </CardDescription>
      </CardHeader>
      {action ? <CardContent>{action}</CardContent> : null}
    </Card>
  )
}

export function UpgradePanel() {
  const { entitlements, loading, error, refresh } = useEntitlements()
  const hasPaidPlan = !!entitlements && entitlements.plan !== 'free'
  const confirming = useCheckoutReturn(refresh, hasPaidPlan)

  if (loading || confirming) {
    return (
      <PanelMessage title="Plan">
        <Loader2 className="h-4 w-4 animate-spin" />
        {confirming ? 'Confirming your purchase…' : 'Checking your plan…'}
      </PanelMessage>
    )
  }

  /*
    No tiers while we don't know what this account already holds. Pro is a
    one-time license, and showing "Buy Pro" to an owner whose entitlements
    simply failed to load invites a second purchase of something they cannot
    use twice.
  */
  if (error) {
    return (
      <PanelMessage
        title="Plan"
        action={
          <Button variant="outline" onClick={() => refresh()}>
            Try again
          </Button>
        }
      >
        We couldn&apos;t load your plan just now, so upgrade options are hidden
        — buying again would be a risk if you already own Pro.
      </PanelMessage>
    )
  }

  return (
    <div id="billing" className="scroll-mt-24">
      {/*
        The section carries its own vertical rhythm and max width for the
        landing page. Inside the narrower account column that reads as a
        large gap above the tiers, so the top padding is pulled back — the
        tiers themselves are untouched.
      */}
      <PricingTiers className="px-0 pb-0 pt-6 sm:px-0 sm:pt-8" />
    </div>
  )
}
