/**
 * A standalone pricing page.
 *
 * Three sections in the order that answers a buyer's questions as they
 * occur: what does it cost, what do I get for the difference, and what
 * happens if I change my mind.
 *
 * The FAQ is pricing-specific rather than general — a pricing page's FAQ
 * exists to remove the last purchase objection, and generic "what browsers
 * do you support" answers waste the only attention the visitor will give it.
 */

import * as React from 'react'
import { PricingTiers } from '@/lib/blocks/sources/pricing-tiers'
import { ComparisonTable } from '@/lib/blocks/sources/comparison-table'
import { FaqAccordion } from '@/lib/blocks/sources/faq-accordion'

const PRICING_FAQ = [
  {
    question: 'Can I change plan later?',
    answer:
      'Any time, in both directions. Upgrades take effect immediately and are prorated; downgrades apply at the end of the current period so you keep what you paid for.',
  },
  {
    question: 'What happens when I hit a limit?',
    answer:
      'Nothing breaks. We email you at 80% and again at 100%, and usage above the limit is billed at the listed overage rate rather than being cut off mid-request.',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      'Within 30 days, in full, no questions asked. After that we will prorate the unused portion of an annual plan if you ask.',
  },
  {
    question: 'Is there a discount for annual billing?',
    answer:
      'Two months free — that is the 20% you see on the toggle. Annual plans are invoiced and can be paid by bank transfer.',
  },
  {
    question: 'Do you have startup or nonprofit pricing?',
    answer:
      'Yes to both. Email us with a sentence about what you are building and we will sort it out — we have never said no to a nonprofit.',
  },
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-3xl px-6 pb-4 pt-20 text-center">
        <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
          Pricing that scales with you, not ahead of you
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
          Start free and stay free until it is worth paying for. Every plan
          includes the full library — the tiers differ on scale and support,
          never on quality.
        </p>
      </section>

      <PricingTiers heading="" subheading="" />

      <ComparisonTable
        heading="What the tiers actually change"
        subheading="Every line, side by side."
      />

      <FaqAccordion
        items={PRICING_FAQ}
        heading="Before you decide"
        subheading="The questions people ask right before they buy."
      />

      {/* Closing reassurance — the last objection is usually risk, not price. */}
      <section className="mx-auto w-full max-w-3xl px-6 pb-20 text-center">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-8">
          <h2 className="text-lg font-bold tracking-tight">
            Still not sure which plan?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Start on Free. You will know within a week whether you need more,
            and upgrading takes one click with no migration.
          </p>
          <a
            href="/signup"
            className="mt-5 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create a free account
          </a>
        </div>
      </section>
    </main>
  )
}
