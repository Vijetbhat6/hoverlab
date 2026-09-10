/**
 * Changing a plan, including downwards.
 *
 * `billing-page` shows what someone is on. This is the screen where they
 * change it, and the reason it is a separate page is the third block.
 *
 * Almost every billing UI ships the upgrade path and treats cancellation as
 * a support ticket. That asymmetry is the design: make leaving annoying
 * enough and some fraction stays. It also produces chargebacks, one-star
 * reviews, and — since June 2025 in the EU and under the FTC's click-to-
 * cancel rule in the US — a regulatory problem, because cancellation is
 * required to be no harder than signing up.
 *
 *   picker      a native radiogroup with the current plan disabled and the
 *               prorated charge announced as the selection changes, so the
 *               number is known before the button is pressed
 *   cancel      the exact date access ends, what breaks, one honest
 *               alternative offered once
 *   confirm     the irreversible step, stated as what it does
 *
 * The one honest alternative is the line worth defending. Offering a pause
 * or a downgrade at the moment of cancellation is legitimate and often what
 * the person actually wanted. Offering four of them, each behind its own
 * click, is a retention funnel wearing a helpfulness costume — and the
 * difference between the two is entirely in the count.
 */

import * as React from 'react'
import { PricingPlanPicker } from '@/lib/blocks/sources/pricing-plan-picker'
import { SubscriptionCancelFlow } from '@/lib/blocks/sources/subscription-cancel-flow'
import { ConfirmDialog } from '@/lib/blocks/sources/confirm-dialog'

export default function PlanChangePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-5xl px-6 pb-2 pt-12">
        <h1 className="text-2xl font-bold tracking-tight">Change plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Both directions, with the charge shown before the button and the
          end date shown before the cancellation.
        </p>
      </section>

      <PricingPlanPicker />

      {/* As easy to leave as it was to arrive. */}
      <SubscriptionCancelFlow />
      <ConfirmDialog />
    </main>
  )
}
