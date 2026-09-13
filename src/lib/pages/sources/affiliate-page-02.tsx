/**
 * The affiliate page, take 02 — proof before arithmetic.
 *
 *   earnings    what the programme actually pays, as the headline
 *   partners    four people already doing it, with numbers
 *   tiers       the commission ladder, priced like a plan
 *   rules       what gets you removed, stated before you apply
 *   apply       a real conversation, not a signup
 *
 * Take 01 leads with terms and a calculator: the reader moves a slider, sees
 * a number, and applies. That is the right page for a self-serve programme
 * with thousands of small affiliates, where the whole funnel has to run
 * without a human.
 *
 * A calculator is also the easiest thing on a page to disbelieve. It shows
 * what you *could* earn from inputs the reader chooses, which makes it
 * arithmetic rather than evidence, and any affiliate who has been burned
 * once reads it that way.
 *
 * This take inverts it for a small, curated programme: lead with what four
 * named partners actually earned last quarter, then show the ladder, then
 * ask for an application that a person reads. No slider anywhere — if the
 * numbers are real you do not need one, and if they are not, a slider is how
 * you hide it.
 *
 * The section take 01 has no equivalent for is `rules`: the four behaviours
 * that get an affiliate removed, published before the application rather
 * than in a terms document afterwards. Brand bidding and coupon-site
 * arbitrage are where these programmes actually go wrong, and a page that
 * only discovers that at payout time has recruited the wrong people on
 * purpose.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroMetrics } from '@/lib/blocks/sources/hero-metrics'
import { TestimonialGrid } from '@/lib/blocks/sources/testimonial-grid'
import { PricingTiers } from '@/lib/blocks/sources/pricing-tiers'
import { FaqAccordion } from '@/lib/blocks/sources/faq-accordion'
import { ContactSalesForm } from '@/lib/blocks/sources/contact-sales-form'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const HEADLINE = [
  { value: '€2,140', label: 'Median partner, last quarter' },
  { value: '€11,800', label: 'Top partner, same quarter' },
  { value: '24 mo', label: 'Commission duration' },
  { value: '31', label: 'Active partners, total' },
]

const PARTNERS = [
  {
    quote: 'I write one newsletter a month for finance controllers. Two referrals a quarter, both of which stuck, and the twenty-four month tail means last year’s referrals are still paying this year. It is not a business. It is a good lunch every week.',
    name: 'Marta Nowak',
    role: 'Newsletter — 4,200 subscribers · €1,340/quarter',
    rating: 5,
  },
  {
    quote: 'Fractional CFO work. I recommend them to roughly one client in four, and only the multi-entity ones. The programme pays me either way, but the reason I stay is that I have never had to apologise for the recommendation.',
    name: 'Owen Brady',
    role: 'Fractional CFO · €4,900/quarter',
    rating: 5,
  },
  {
    quote: 'Honestly below what I hoped. My audience is small-business bookkeepers and most of them have three entities, where Acme is the expensive option. That is my targeting problem, not theirs, and they told me it would happen on the application call.',
    name: 'Sasha Ivanova',
    role: 'YouTube — 18k subscribers · €310/quarter',
    rating: 3,
  },
  {
    quote: 'The implementation partner tier is the one worth having. I get a lower commission and a much higher conversion rate, because I am the one doing the migration afterwards.',
    name: 'Hendrik Vos',
    role: 'Implementation partner · €11,800/quarter',
    rating: 5,
  },
]

const TIERS = [
  {
    name: 'Referral',
    monthly: 20,
    description: 'The default tier. You send a link, we do everything else.',
    features: [
      '20% of first-year revenue',
      '24-month cookie window',
      'Paid monthly, €50 minimum',
      'Dashboard with per-link attribution',
      'No exclusivity, no minimum volume',
    ],
  },
  {
    name: 'Advocate',
    monthly: 30,
    description: 'For partners past €5,000 in lifetime commission. Applied automatically.',
    features: [
      '30% of first-year revenue',
      'Plus 10% of year two',
      'Co-written case study if you want one',
      'Direct line to a named person here',
      'Early access to the roadmap themes',
    ],
    featured: true,
  },
  {
    name: 'Implementation',
    monthly: 15,
    description: 'For consultants who run the migration themselves. Lower rate, much higher conversion.',
    features: [
      '15% of first-year revenue',
      'Plus the implementation fee, which you keep in full',
      'Sandbox workspaces for your clients',
      'Named in the partner directory',
      'Certification, two days, free',
    ],
  },
]

const RULES = [
  {
    question: 'Bidding on our brand name in paid search',
    answer:
      'Immediate removal and forfeited commission. This is the single commonest reason a partnership ends, and it is not a grey area — if you bid on "Acme" or any close variant, the account closes. We would rather say this before you apply than after a payout.',
  },
  {
    question: 'Coupon and deal-aggregator sites',
    answer:
      'Not accepted. The traffic converts but it converts people who were already buying, and every one of those is a commission we pay for nothing. There is no version of this where we say yes.',
  },
  {
    question: 'Claiming things we do not do',
    answer:
      'If a referral arrives believing we are SOC 2 Type II or that we self-host, they churn in month two and we both lose. Say what we actually do. The comparison page is deliberately honest so that you can point at it.',
  },
  {
    question: 'Undisclosed affiliate relationships',
    answer:
      'Disclose it. Legally required in most of the markets our partners operate in, and separately it is the thing that makes the recommendation worth anything.',
  },
  {
    question: 'What if a referral cancels?',
    answer:
      'Commission is clawed back within the first sixty days and not after. Around one in nine does, which is the same rate as our direct signups.',
  },
  {
    question: 'When do you actually pay?',
    answer:
      'Monthly, on the 15th, for the month before, once the balance is over €50. Bank transfer or PayPal. We have never missed one and if we do, say so publicly.',
  },
]

export default function AffiliatePage02() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Partners" ctaLabel="Apply" ctaHref="#affiliate-page-02-apply" />

      <main>
        <HeroMetrics
          eyebrow="Partner programme"
          heading="Thirty-one partners, and here is what they actually made"
          subheading="No calculator on this page. A slider shows what you could earn from numbers you picked yourself, which is arithmetic rather than evidence — these four figures are last quarter's, including the median rather than only the top."
          primaryLabel="Apply to join"
          primaryHref="#affiliate-page-02-apply"
          secondaryLabel="See the commission tiers"
          secondaryHref="#affiliate-page-02-tiers"
          metrics={HEADLINE}
        />

        {/*
          Four partners, and one of them earning badly. A testimonial wall
          where every number is good is the same claim as a calculator: it
          describes the best case and lets the reader assume it is typical.
        */}
        <TestimonialGrid
          heading="Four partners, including one for whom this is not working"
          subheading="Sasha's row is here on purpose. Her audience is three-entity bookkeepers, where we are the expensive option, and no programme page that omits that case is telling you how the programme works."
          testimonials={PARTNERS}
        />

        <div id="affiliate-page-02-tiers">
          <PricingTiers
            heading="The commission ladder"
            subheading="Percentages rather than prices — the number under each name is the share of first-year revenue, not a monthly fee. Advocate is applied automatically; you do not have to ask."
            plans={TIERS}
            currency="%"
          />
        </div>

        {/*
          The section take 01 has no equivalent for. Brand bidding and coupon
          arbitrage are where these programmes actually break, and finding
          that out at payout time means the wrong people were recruited on
          purpose.
        */}
        <FaqAccordion
          heading="What gets you removed, before you apply"
          subheading="Four behaviours and two payment questions. The first two are the ones that end partnerships, and both are stated as absolutes because they are."
          items={RULES}
        />

        <div id="affiliate-page-02-apply">
          <ContactSalesForm
            heading="Apply"
            intro="A person reads this, usually within two days, and the reply either says yes or says which part of your audience we think is a poor fit. Thirty-one partners out of about ninety applications, and we tell the other fifty-nine why."
            submitLabel="Send the application"
          />
        </div>
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
