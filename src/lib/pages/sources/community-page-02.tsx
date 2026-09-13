/**
 * The community page, take 02 — the calendar is the community.
 *
 *   next        the next event, bookable in the first screen
 *   month       everything else, as a month
 *   hosts       who runs them, because people come back for people
 *   channels    the always-on doors, demoted to a strip
 *
 * Take 01 treats community as a set of doors — Slack, forum, GitHub — with
 * member counts and reply times on each, on the sound reasoning that "join
 * our community" with no number reads as an invitation into an empty room.
 *
 * That layout assumes the community is a place. For a lot of products it is
 * not; it is a schedule. Office hours every Thursday, a monthly user group,
 * a quarterly workshop — and for those, a doors-first page buries the only
 * thing with a deadline attached. Someone who lands here on Tuesday should
 * be able to book Thursday without scrolling.
 *
 * So the calendar leads and the channels are demoted to a strip at the
 * bottom. The chat link is still there because people want it; it is simply
 * no longer the pitch, since an idle Slack is a worse first impression than
 * a half-full calendar.
 *
 * `team-grid` is here for a reason that reads as sentimental and is not:
 * recurring events are attended for the host, and a calendar of events with
 * no faces attached converts far worse than one where the same three names
 * appear every week.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroBooking } from '@/lib/blocks/sources/hero-booking'
import { CalendarMonth } from '@/lib/blocks/sources/calendar-month'
import { TeamGrid } from '@/lib/blocks/sources/team-grid'
import { CommunityBand } from '@/lib/blocks/sources/community-band'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const NEXT_SLOTS = [
  { weekday: 'Thu', day: '15', slots: 6 },
  { weekday: 'Thu', day: '22', slots: 11 },
  { weekday: 'Thu', day: '29', slots: 12 },
  { weekday: 'Thu', day: '05', slots: 12 },
]

const MONTH_EVENTS: Record<string, { label: string; calendar: 'product' | 'design' | 'personal' }[]> = {
  '2026-01-15': [{ label: 'Office hours — rule writing', calendar: 'product' }],
  '2026-01-20': [{ label: 'User group — Amsterdam', calendar: 'design' }],
  '2026-01-22': [{ label: 'Office hours — rule writing', calendar: 'product' }],
  '2026-01-27': [{ label: 'Workshop: multi-entity close', calendar: 'personal' }],
  '2026-01-29': [{ label: 'Office hours — rule writing', calendar: 'product' }],
  '2026-02-03': [{ label: 'Month-end clinic (close week)', calendar: 'personal' }],
  '2026-02-05': [{ label: 'Office hours — rule writing', calendar: 'product' }],
  '2026-02-12': [
    { label: 'Office hours — rule writing', calendar: 'product' },
    { label: 'User group — Lisbon', calendar: 'design' },
  ],
}

const CHANNELS = [
  {
    label: 'Slack',
    description: 'Quiet on purpose. Roughly forty messages a week, most of them in #rules, and a founder reads all of them.',
    href: '#',
    meta: '1,240 members · ~3h median reply',
  },
  {
    label: 'Forum',
    description: 'Where the long answers live, because a Slack answer is gone in a fortnight and a forum thread still ranks two years later.',
    href: '#',
    meta: '890 threads · searchable',
  },
  {
    label: 'GitHub',
    description: 'The SDKs and the rule-syntax spec. Issues here get triaged by the engineer who owns that area, not by a bot.',
    href: '#',
    meta: '17 repos · 2-day triage',
  },
  {
    label: 'Monthly digest',
    description: 'For people who will not install another chat app, which is most finance teams. One email, the good threads, nothing else.',
    href: '#',
    meta: '4,100 subscribers',
  },
]

export default function CommunityPage02() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Community" ctaLabel="Book office hours" ctaHref="#community-page-02-calendar" />

      <main>
        {/*
          The only thing on this page with a deadline goes first. Someone
          landing on a Tuesday should be able to book Thursday without
          scrolling past four chat links.
        */}
        <HeroBooking
          eyebrow="Office hours — every Thursday, 15:00 UTC"
          heading="Bring a rule that will not match"
          subheading="Forty-five minutes, twelve seats, screen sharing encouraged. An engineer who works on the matching engine is in every session, and most of them are spent on one person's actual ledger rather than on slides."
          submitLabel="Take a seat"
          days={NEXT_SLOTS}
        />

        <div id="community-page-02-calendar" className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-2 text-2xl font-bold tracking-tight">Everything else this month</h2>
          <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
            Office hours weekly, a user group monthly, and a clinic during
            close week that exists because nobody wants to learn a new tool on
            the second of the month. Eight events, all free, none of them a
            product demo.
          </p>
          <CalendarMonth events={MONTH_EVENTS} />
        </div>

        {/*
          Not sentimental: recurring events are attended for the host, and a
          calendar with no faces attached converts markedly worse than one
          where the same three names show up every week.
        */}
        <TeamGrid
          heading="Who runs them"
          intro="The same three people every week, which is the entire reason anyone comes back. If you have been to office hours twice you have already met all of them."
        />

        <CommunityBand
          heading="The always-on doors"
          subheading="Still here, just not the pitch — an idle Slack is a worse first impression than a half-full calendar. Counts and reply times are current as of this month."
          links={CHANNELS}
        />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
