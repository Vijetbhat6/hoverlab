/**
 * The services page, take 02 — one productised engagement, one price.
 *
 *   anchor      the price, in the hero, before anything else
 *   what        what you get, as tabs rather than a wall
 *   when        the week-by-week schedule, so "six weeks" is checkable
 *   price       the same number again, itemised
 *   proof       one client who bought exactly this
 *   objections  why it is fixed-price, and when it is the wrong shape
 *
 * Take 01 sells consulting the usual way: three engagements named by
 * situation, a comparison table, and a call to scope it. That is right when
 * the work genuinely varies — when the honest answer to "how much" is "it
 * depends", a page that pretends otherwise costs you the deals where it
 * doesn't fit.
 *
 * This take is for the opposite business: a productised service, where the
 * work has been done forty times and the variance is small enough to
 * swallow. The whole layout follows from that. `hero-price-anchor` puts the
 * number in the first screen, which is the one thing take 01 deliberately
 * withholds, and everything after it exists to justify a figure the reader
 * has already seen.
 *
 * There is no `booking-scheduler` here, which is the sharpest difference.
 * Take 01 ends on a call because the price requires a conversation. If the
 * price is on the page, a mandatory call before purchase is friction that
 * reads as a bait-and-switch — so this page ends on a form and treats the
 * call as optional.
 *
 * The objection list names when this is the wrong shape, because a fixed
 * price attracts the clients it does not fit, and finding that out in week
 * three is expensive for both sides.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroPriceAnchor } from '@/lib/blocks/sources/hero-price-anchor'
import { FeatureTabs } from '@/lib/blocks/sources/feature-tabs'
import { StatsTimeline } from '@/lib/blocks/sources/stats-timeline'
import { PricingSingle } from '@/lib/blocks/sources/pricing-single'
import { TestimonialSpotlight } from '@/lib/blocks/sources/testimonial-spotlight'
import { FaqObjectionList } from '@/lib/blocks/sources/faq-objection-list'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const SCHEDULE = [
  {
    period: 'Week 1',
    value: '2',
    label: 'workshops',
    note: 'Your close, mapped as it actually runs rather than as it is documented. Half a day of your controller, and it is the only week that needs meaningful time from you.',
  },
  {
    period: 'Weeks 2–3',
    value: '1',
    label: 'ledger connected',
    note: 'We build the connection and the first rule set against a full historic month. You do nothing this fortnight; we send a Friday note either way.',
  },
  {
    period: 'Week 4',
    value: '60–75%',
    label: 'auto-match, typically',
    note: 'The uncomfortable week. The number is below what your spreadsheet achieves and it is supposed to be — this is the week we hand over the rule editor.',
  },
  {
    period: 'Weeks 5–6',
    value: '90%+',
    label: 'auto-match, target',
    note: 'Your team writes the domain rules; we write the structural ones. Handover, runbook, and one live close with us watching. If we miss 90 percent, week seven is free.',
  },
]

const INCLUDES = [
  'Two discovery workshops and a written map of the close as it runs today',
  'Ledger connection built and tested against a full historic month',
  'Rule set to 90% auto-match, or week seven at no charge',
  'Runbook written for three named people, not one',
  'One supervised live close',
  'Thirty days of direct Slack access afterwards',
]

const OBJECTIONS = [
  {
    id: 'fixed',
    label: 'Why is this fixed-price when everyone else scopes it?',
    detail:
      'Because we have run it forty-one times and the variance is now small enough that we can carry it. The two engagements that overran in the last year cost us a combined nine days, which is cheaper than the sales cycle a bespoke quote requires.',
    tone: 'positive' as const,
    status: 'Deliberate',
  },
  {
    id: 'wrong-fit',
    label: 'When is this the wrong engagement?',
    detail:
      'Above roughly twenty entities, or if your ledger is on-premise, or if the close involves a bespoke consolidation tool someone built internally. In all three cases the fixed price stops being honest and we will quote you instead — which is slower and which we will tell you on the first call.',
    tone: 'critical' as const,
    status: 'Say so early',
  },
  {
    id: 'guarantee',
    label: 'What does the 90% guarantee actually cost you?',
    detail:
      'Week seven free, and week eight if needed. We have paid it out four times in forty-one engagements. It is not a rhetorical guarantee and there is no clause about "client-provided data quality" that lets us out of it.',
    tone: 'neutral' as const,
    status: '4 of 41',
  },
  {
    id: 'after',
    label: 'What happens after the thirty days?',
    detail:
      'Nothing automatic. There is no retainer to decline and we do not enrol you in one. If you want ongoing help it is a separate conversation you have to start.',
    tone: 'neutral' as const,
    status: 'No retainer',
  },
]

export default function ServicesPage02() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Services" ctaLabel="Book the engagement" ctaHref="#services-page-02-price" />

      <main>
        <HeroPriceAnchor
          eyebrow="Close Automation Sprint"
          heading="Six weeks, fixed price, 90% auto-match or week seven is free"
          subheading="One engagement, run forty-one times. We put the number in the first screen because a productised service that hides its price is just consulting with extra steps."
          price="€24,000"
          priceNote="Fixed. Not a starting point, not a range, and not subject to a scoping call."
          primaryLabel="See what is included"
          primaryHref="#services-page-02-price"
          includes={[
            'Six weeks, elapsed',
            'Roughly 10 hours of your team, total',
            '90% auto-match target, guaranteed',
          ]}
          guarantee="Miss 90% and week seven costs nothing. Paid out 4 times in 41 engagements."
        />

        <FeatureTabs
          heading="What the six weeks contain"
          subheading="Tabs rather than a list, because the three audiences for this page — controller, CFO, and the engineer who will inherit it — each need a different third of it."
        />

        <StatsTimeline
          eyebrow="The schedule"
          heading="Week by week, including the bad one"
          milestones={SCHEDULE}
        />

        <div id="services-page-02-price">
          <PricingSingle
            planName="Close Automation Sprint"
            price="€24,000"
            cadence="one-off"
            heading="The whole engagement, itemised"
            subheading="No implementation fee stacked on top, no per-entity charge, no separate line for the runbook."
            features={INCLUDES}
            ctaLabel="Start the engagement"
            ctaHref="#services-page-02-price"
            note="50% on signature, 50% after the supervised close. A call first is available and not required."
          />
        </div>

        <TestimonialSpotlight
          quote="We had two bespoke quotes at roughly the same number, both of which needed three more meetings to firm up. The fixed price was not cheaper. It was six weeks earlier, because there was nothing left to negotiate."
          name="Tobias Lund"
          role="CFO"
          company="Northwind Logistics"
          stats={[
            { value: '6 wks', label: 'Signature to supervised close' },
            { value: '0', label: 'Scoping calls required' },
          ]}
        />

        <FaqObjectionList
          heading="Before you book it"
          intro="Including the paragraph naming when this engagement is the wrong shape, which is the one worth reading if you are above twenty entities."
          rows={OBJECTIONS}
        />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
