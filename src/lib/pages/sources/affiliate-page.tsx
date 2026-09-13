/**
 * The affiliate / partner programme page.
 *
 *   terms       what is paid, for how long, with what cookie window
 *   calculator  what that means for your numbers
 *   payouts     the four rows that are the actual contract
 *   apply       the application
 *   faq         the questions that decide whether someone bothers
 *
 * The calculator is the page. Every affiliate page states a percentage and a
 * window; almost none let the reader put their own audience size in and see a
 * number. "25% recurring for 12 months" requires the reader to do arithmetic
 * with an ARPU they do not know, and most of them will not — so the page
 * converts on faith or not at all.
 *
 * The terms are stated before the application rather than after. An affiliate
 * programme that makes you apply to find out the rate is a programme whose
 * rate is bad, and everyone reading has learned that.
 *
 * The cookie window and the attribution rule are in the FAQ because they are
 * where affiliate programmes actually get disputed: last-click versus
 * first-click decides who gets paid when a reader sees your review in March
 * and buys through a Google ad in June.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { StatsBand } from '@/lib/blocks/sources/stats-band'
import { PricingUsageCalculator } from '@/lib/blocks/sources/pricing-usage-calculator'
import { FeatureRows } from '@/lib/blocks/sources/feature-rows'
import { MultiStepForm } from '@/lib/blocks/sources/multi-step-form'
import { FaqAccordion } from '@/lib/blocks/sources/faq-accordion'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const TERMS = [
  { value: '25%', label: 'Of every payment', caption: 'Not just the first one' },
  { value: '12 mo', label: 'Recurring', caption: 'Per referred account' },
  { value: '90 days', label: 'Cookie window', caption: 'First click wins' },
  { value: 'Net 30', label: 'Paid monthly', caption: 'From £50, no upper cap' },
]

const RULES = [
  {
    eyebrow: 'Attribution',
    title: 'First click, ninety days, and we do not bid against you',
    body: 'If a reader finds you in March and buys in June, you are paid. We also do not run paid search on our own brand terms in a way that outbids partners, which is the practice that quietly kills most programmes.',
    bullets: ['First-click attribution', '90-day window', 'No brand-term outbidding by us'],
  },
  {
    eyebrow: 'What is not allowed',
    title: 'Three rules, and they are the usual three',
    body: 'No bidding on our trademarks, no coupon-injection extensions, and no unmarked reviews. Everything else — comparison posts that rank us second, critical reviews, honest lists — is fine and we would rather have it.',
    bullets: ['No trademark bidding', 'No coupon extensions', 'Disclosure required by law and by us'],
  },
  {
    eyebrow: 'When it stops',
    title: 'Twelve months per account, and you keep the tail',
    body: 'Commission runs twelve months from each referred account’s first payment. Leaving the programme does not cancel commission already accruing — you keep the tail on everyone already referred.',
    bullets: ['12 months from first payment', 'Tail survives leaving', 'No clawback after 60 days'],
  },
]

const AFFILIATE_FAQ = [
  {
    question: 'Do I need an audience of a particular size?',
    answer:
      'No minimum. The smallest active partner sends about four accounts a year and is paid for all four. There is no tier system and no volume bonus, so the rate is the same for everyone.',
  },
  {
    question: 'Can I write a critical review?',
    answer:
      'Yes, and it will not affect your status. A comparison that puts us second is more useful to your readers than one that does not, and a programme that punishes honesty produces reviews nobody believes.',
  },
  {
    question: 'What counts as a qualified referral?',
    answer:
      'A paid account that stays past the 60-day refund window. Free-tier signups do not pay out, which is stated here rather than discovered at the first payout.',
  },
  {
    question: 'How do I see what I have earned?',
    answer:
      'A dashboard with clicks, signups, conversions and pending commission, updated hourly. Referral-level detail is anonymised — you see that an account converted, not who they are.',
  },
]

export default function AffiliatePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Partners" ctaLabel="Apply" ctaHref="#payouts" />

      <main>
        <StatsBand stats={TERMS} />

        <PricingUsageCalculator
          heading="What that is worth on your numbers"
          subheading="Move the slider to the number of paying accounts you think you would send in a year. The figure is twelve months of commission at the current average account value."
          unitLabel="referred accounts"
          ctaLabel="Apply to the programme"
          ctaHref="#payouts"
        />

        <FeatureRows
          heading="The terms, before you apply"
          subheading="A programme that makes you apply to find out the rate is a programme whose rate is bad."
          rows={RULES}
        />

        <div id="payouts">
          <MultiStepForm
            heading="Apply"
            steps={['About you', 'Your audience', 'Payout details']}
            submitLabel="Send application"
            successMessage="Received. We review applications weekly and reply either way — a rejection comes with the reason."
          />
        </div>

        <FaqAccordion
          heading="Before you apply"
          subheading="Including the two that decide most disputes: attribution and what counts as qualified."
          items={AFFILIATE_FAQ}
        />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
