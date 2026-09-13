/**
 * The team page, take 02 — the one that is really a recruiting page.
 *
 *   pitch       what it is like to work here, stated as a trade
 *   shape       the company in four numbers a candidate actually asks about
 *   people      who you would be working with
 *   roles       the open list, with salary bands on every row
 *   apply       the way in, including the speculative one
 *
 * Take 01 is a customer's team page: faces, four numbers, three working
 * commitments. It answers "who am I buying from".
 *
 * This one answers "what would it be like to work here", which is a
 * different page wearing the same title — and the one most companies
 * actually need, because /team gets linked from job posts far more often
 * than from a sales deck. The tell is the ordering: take 01 opens on faces,
 * because a buyer is checking these people exist. A candidate has already
 * accepted that they exist and wants to know what the job costs them, so
 * this take opens on the trade and puts the faces third.
 *
 * `stats-narrative` is reused from take 01 of the *about* page rather than
 * `stats-band`, because the numbers a candidate cares about need a sentence
 * around them. "Nineteen people" means nothing; "nineteen people and no
 * middle management, which means no promotion path" means quite a lot, and
 * one of those two sentences loses us candidates who would have been
 * unhappy.
 *
 * Salary bands are on every row on purpose. A board with three bands and
 * one "competitive" teaches the reader that the fourth is the bad one.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroSplit } from '@/lib/blocks/sources/hero-split'
import { StatsNarrative } from '@/lib/blocks/sources/stats-narrative'
import { TeamGrid } from '@/lib/blocks/sources/team-grid'
import { JobListingBoard } from '@/lib/blocks/sources/job-listing-board'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterMega } from '@/lib/blocks/sources/footer-mega'

const SHAPE = [
  { value: '19', label: 'People, total', source: 'January 2026' },
  { value: '0', label: 'Layers between you and a founder', source: 'And no plan to add one' },
  { value: '4', label: 'Time zones, all within UTC±3', source: 'Deliberately narrow' },
  { value: '1 in 10', label: 'Working days spent on support', source: 'Everyone, including founders' },
]

const DEPARTMENTS = [
  {
    name: 'Engineering',
    openings: [
      {
        title: 'Backend engineer, ledger',
        location: 'Lisbon or remote (UTC±3)',
        remote: true,
        type: 'Full-time',
        salary: '€78k–€96k',
      },
      {
        title: 'Engineer, integrations',
        location: 'Lisbon or remote (UTC±3)',
        remote: true,
        type: 'Full-time',
        salary: '€70k–€88k',
      },
    ],
  },
  {
    name: 'Support',
    openings: [
      {
        title: 'Support engineer (accounting background)',
        location: 'Remote (UTC±3)',
        remote: true,
        type: 'Full-time',
        salary: '€52k–€64k',
      },
    ],
  },
  {
    name: 'Operations',
    openings: [
      {
        title: 'Finance and operations lead',
        location: 'Lisbon, two days a week in office',
        type: 'Full-time',
        salary: '€64k–€76k',
      },
    ],
  },
]

export default function TeamPage02() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Team" ctaLabel="See open roles" ctaHref="#team-page-02-roles" />

      <main>
        <HeroSplit
          eyebrow="Working at Acme"
          heading="Nineteen people, no managers, and a support day every fortnight"
          subheading="That last part is not a perk and we do not present it as one. Every engineer here spends roughly one day in ten answering customers, which is the single biggest reason our roadmap is any good and the single commonest reason someone turns us down."
          primaryLabel="See the four open roles"
          primaryHref="#team-page-02-roles"
          secondaryLabel="Meet the team"
          secondaryHref="#team-page-02-people"
          bullets={[
            'Salary bands published on every role, no negotiation ladder',
            'Four-day week, Fridays off, not a trial',
            'No on-call except during month-end close, which is paid',
          ]}
        />

        <StatsNarrative
          eyebrow="The shape of the company"
          heading="The numbers a candidate actually asks in the third interview"
          body="A flat company of nineteen has no promotion path, and we would rather you learn that here than in your second year. What it has instead is scope: the person who takes the ledger role owns the ledger, including what it does not do. If you want a title that changes every eighteen months, this is a bad place to want that."
          stats={SHAPE}
          ctaLabel="Read the engineering handbook"
          ctaHref="#team-page-02-roles"
        />

        <div id="team-page-02-people">
          <TeamGrid
            heading="Who you would actually be working with"
            intro="Small enough that this is the whole company, not a leadership page. If you join engineering, you will have worked directly with everyone on this list inside a month."
          />
        </div>

        <div id="team-page-02-roles">
          <JobListingBoard
            heading="Open roles"
            intro="Four, with a band on every one. We do not negotiate up from the bottom of the band — the offer is made at the number the interviews supported, and it is the same number regardless of what you are paid now."
            departments={DEPARTMENTS}
            speculativeEmail="hiring@acme.example"
          />
        </div>

        <CtaSplitPanel
          heading="None of these, but still interested?"
          supporting="We open roughly one role a quarter and we read speculative applications before we write the job post. Several of the people above arrived that way."
          primaryLabel="Send a speculative application"
          secondaryLabel="Read how we interview"
        />
      </main>

      <FooterMega
        brand="Acme"
        tagline="Nineteen people, no managers, and a support day every fortnight. Four roles open."
      />
    </div>
  )
}
