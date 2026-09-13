/**
 * The about page, in the order that answers the question actually being asked.
 *
 *   narrative   why the company exists, with the numbers inside the prose
 *   timeline    what has happened, so "new" or "established" is checkable
 *   team        who these people are
 *   customers   who already believed it
 *   cta         the way in
 *
 * The judgement call: **no hero.** An about page reached from a footer link
 * has already sold the product — the reader is checking whether the company
 * is real. A hero repeats the pitch they have just read and delays the only
 * thing they came for, which is evidence. `stats-narrative` opens instead,
 * because it is a paragraph with numbers in it rather than a headline.
 *
 * The numbers are deliberately unremarkable. A five-year-old company with
 * forty people and a flat retention figure is the shape most companies are,
 * and a template whose placeholder claims 400% growth teaches everyone who
 * fills it in to overclaim.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { StatsNarrative } from '@/lib/blocks/sources/stats-narrative'
import { StatsTimeline } from '@/lib/blocks/sources/stats-timeline'
import { TeamGrid } from '@/lib/blocks/sources/team-grid'
import { LogoCloud } from '@/lib/blocks/sources/logo-cloud'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterMega } from '@/lib/blocks/sources/footer-mega'

const STATS = [
  { value: '41', label: 'People across nine countries', source: 'January 2026' },
  { value: '94%', label: 'Net revenue retention', source: 'Trailing twelve months' },
  { value: '3.1y', label: 'Median tenure', source: 'Excluding founders' },
  { value: '0', label: 'Funding rounds raised', source: 'Revenue-funded since 2021' },
]

const MILESTONES = [
  {
    period: '2019',
    value: '1',
    label: 'customer',
    note: 'A script on one laptop, solving the founders’ own reconciliation problem. The first customer was the accountant who saw it over a shoulder.',
  },
  {
    period: '2021',
    value: '6',
    label: 'people',
    note: 'Support and engineering hired in the same month — answering the questions and fixing what causes them is one job split across two desks.',
  },
  {
    period: '2023',
    value: '3',
    label: 'integrations built by customers',
    note: 'All three were written against a private endpoint we had not documented. Publishing the API was mostly writing it down and apologising.',
  },
  {
    period: '2025',
    value: '0',
    label: 'rounds raised',
    note: 'SOC 2 Type II landed the same year, paid for out of revenue. That is the part we are prouder of.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="About" ctaLabel="Talk to us" ctaHref="#story" />

      <main>
        <div id="story">
          <StatsNarrative
            eyebrow="About Acme"
            heading="We built the thing we could not buy"
            body="Every finance team we knew was reconciling two systems by hand on the last Friday of the month. The tools that claimed to fix it assumed you had an engineer spare. We did not, and neither did they — so the product’s first constraint was that it had to work for someone with no engineer, and it still is."
            stats={STATS}
            ctaLabel="Read the engineering notes"
            ctaHref="#story"
          />
        </div>

        <StatsTimeline
          eyebrow="How we got here"
          heading="Six years, in the order they happened"
          milestones={MILESTONES}
        />

        <TeamGrid
          heading="The people you will actually deal with"
          intro="Support is not a tier-one queue — the person who answers is the person who can change the thing you are asking about."
        />

        <LogoCloud caption="Reconciling with Acme since 2021" />

        <CtaSplitPanel
          heading="Still deciding whether we are real?"
          supporting="Ask for a reference. We will give you a customer in your industry who has been with us long enough to have complaints."
          primaryLabel="Request a reference"
          secondaryLabel="Read the changelog"
        />
      </main>

      <FooterMega
        brand="Acme"
        tagline="Reconciliation for finance teams who would rather close the month than chase it."
      />
    </div>
  )
}
