/**
 * The team page — who we are, as distinct from who we are hiring.
 *
 *   team        the faces
 *   stats       the shape of the company, in four numbers
 *   how we work the three commitments that are checkable
 *   cta         the way in
 *
 * The distinction from `careers-page` is the whole reason this exists as a
 * second page rather than a section: a candidate wants openings and an
 * interview process, and a *buyer* wants to know whether the company will
 * still be here in two years and who will pick up the phone. Merging them
 * produces a page where the buyer scrolls past a job board and the candidate
 * scrolls past a retention figure.
 *
 * "How we work" is three rows and not six, and each one is a claim that could
 * be falsified — a support rota that names engineers, a written decision log,
 * a four-hour overlap. Values pages fail because "we value transparency"
 * cannot be wrong.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { TeamGrid } from '@/lib/blocks/sources/team-grid'
import { StatsBand } from '@/lib/blocks/sources/stats-band'
import { FeatureRows } from '@/lib/blocks/sources/feature-rows'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const SHAPE = [
  { value: '41', label: 'People' },
  { value: '9', label: 'Countries' },
  { value: '4h', label: 'Daily overlap' },
  { value: '3.1y', label: 'Median tenure' },
]

const HOW_WE_WORK = [
  {
    eyebrow: 'Support',
    title: 'Engineers take the rota',
    body: 'Every engineer does one support day a fortnight. It is the cheapest way we have found to keep the bug that annoys forty people from losing to the feature that impresses one.',
    bullets: ['One day a fortnight, named on the rota', 'No tier-one script', 'Fixes ship the same week'],
  },
  {
    eyebrow: 'Decisions',
    title: 'Written down before they are made',
    body: 'Anything that changes the product or the roadmap starts as a document with the alternatives in it. Meetings are for disagreeing with the document, not for hearing it read out.',
    bullets: ['Decision log, searchable', 'Alternatives recorded, not just the winner', 'Reversals noted on the original'],
  },
  {
    eyebrow: 'Hours',
    title: 'Async by default, overlapping by agreement',
    body: 'Nine time zones only works if the four hours everyone shares are spent on the things that genuinely need a conversation. Everything else is a document and a day to read it.',
    bullets: ['Four-hour shared window', 'No recurring meeting without an agenda', 'Two in-person weeks a year, company-paid'],
  },
]

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Team" ctaLabel="See openings" ctaHref="#people" />

      <main>
        <div id="people">
          <TeamGrid
            heading="Forty-one people, and no account managers"
            intro="The company is small enough that the person who answers your question is usually the person who built the thing you are asking about. That is a deliberate ceiling, not a stage we are growing out of."
          />
        </div>

        <StatsBand stats={SHAPE} />

        <FeatureRows
          heading="How we work, in the parts you can check"
          subheading="Three commitments with a shape you could hold us to. Everything else is a poster."
          rows={HOW_WE_WORK}
        />

        <CtaSplitPanel
          heading="Want to work here?"
          supporting="Openings are on the careers page. If none of them fit, the speculative note is read by a person and answered either way."
          primaryLabel="See open roles"
          secondaryLabel="Write speculatively"
        />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
