'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth-provider'
import { track } from '@/lib/analytics'
import { PLANS, type PlanId } from '@/lib/billing/plans'

/**
 * Start a Polar checkout for a plan.
 *
 * Signed-out users are sent to /signup with a `?next=` back to pricing —
 * checkout requires an account so the webhook has a user to attach the
 * entitlement to. That redirect is also the moment most signups happen,
 * which is why `checkout_started` fires before it: the funnel needs to
 * show attempts that never reached Polar, not just ones that did.
 */
export function useCheckout() {
  const router = useRouter()
  const { user } = useAuth()
  const [pendingPlan, setPendingPlan] = React.useState<PlanId | null>(null)

  const startCheckout = React.useCallback(
    async (planId: PlanId, seats = 1) => {
      if (planId === 'free') {
        router.push('/signup')
        return
      }

      const plan = PLANS[planId]
      track('checkout_started', { plan: planId, interval: plan.interval })

      if (!user) {
        router.push(`/signup?redirect=${encodeURIComponent('/#pricing')}`)
        return
      }

      setPendingPlan(planId)
      try {
        const res = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ plan: planId, seats }),
        })
        const data = (await res.json()) as { url?: string; error?: string }

        if (!res.ok || !data.url) {
          toast.error('Could not start checkout', {
            description: data.error ?? 'Please try again in a moment.',
          })
          return
        }

        // Hand off to Polar's hosted checkout.
        window.location.href = data.url
      } catch (err) {
        console.error('[checkout] failed:', err)
        toast.error('Could not start checkout', {
          description: 'Check your connection and try again.',
        })
      } finally {
        setPendingPlan(null)
      }
    },
    [router, user],
  )

  return { startCheckout, pendingPlan }
}
