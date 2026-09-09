/**
 * What the account has consumed, and what happens when it runs out.
 *
 * A usage screen is a meter and, almost always, nothing else. The meter
 * answers "how much have I used" and leaves the two questions that
 * actually bring someone here: am I about to be charged, and what happens
 * at the line.
 *
 * So the page runs in the order those questions arrive. The overage notice
 * is first because it is the only part that is time-critical — a warning
 * below the fold is a warning that arrives with the invoice. The meters
 * come second, the credit balance third, and the limits table last.
 *
 * The obvious wrong answer is meter-first with the consequences on a
 * linked pricing page. Someone reading a usage screen is already worried;
 * sending them to marketing for the answer is where the support email is
 * written.
 *
 * The limits panel is the part most products never build, and it is the
 * one that makes the rest safe to read: a soft limit and a hard limit look
 * identical on a progress bar.
 */

import * as React from 'react'
import { UsageOverageNotice } from '@/lib/blocks/sources/usage-overage-notice'
import { UsageMeterPanel } from '@/lib/blocks/sources/usage-meter-panel'
import { BillingCreditBalance } from '@/lib/blocks/sources/billing-credit-balance'
import { PlanLimitsList } from '@/lib/blocks/sources/plan-limits-list'

export default function UsagePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-5xl px-6 pb-2 pt-12">
        <h1 className="text-2xl font-bold tracking-tight">Usage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This billing period, with what happens at each limit rather than
          only how close you are to it.
        </p>
      </section>

      {/*
        Time-critical first — see the note above.

        The notice is pointed at Bandwidth deliberately, because that is
        the quota the meter panel below already shows over its limit
        (128 of 100 GB). Left on its own defaults the two blocks disagreed
        on the same screen — the notice said API requests were 140% over
        while the meter said they were at 84% — which reads as a bug in the
        product rather than as two components with independent demo data.
        Composing blocks means reconciling their examples.
      */}
      <UsageOverageNotice
        metricLabel="Bandwidth"
        included={100}
        used={128}
        unit="GB"
        ratePerUnit={0.09}
        rateUnitSize={1}
      />
      <UsageMeterPanel />
      <BillingCreditBalance />
      <PlanLimitsList />
    </main>
  )
}
