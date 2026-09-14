/**
 * The conference home page — one event, one date, one decision.
 *
 *   bar        the deadline, because ticket pricing is a clock
 *   hero       what it is, when, where, and the four numbers
 *   sample     the programme, abridged — the real reason people come
 *   speakers   who is talking
 *   sponsors   who paid for it
 *   tickets    the three types, as a comparison and not a plan picker
 *   answers    the logistics questions that stop a purchase
 *
 * AN EVENT PAGE IS A COUNTDOWN, and that is the thing that makes the genre
 * different from every other marketing page in this catalog. A SaaS landing
 * page sells something that will still be there next month; this one sells
 * something that stops existing on a date, at a price that steps up twice
 * before then. So the deadline is the first element on the page, in
 * <AnnouncementBar>, above the hero rather than inside it.
 *
 * THE PROGRAMME EXTRACT SITS ABOVE THE SPEAKERS, which is the opposite of
 * how most conference sites order it. Names sell tickets only to people who
 * already know the names; sessions sell tickets to everyone else, and the
 * second group is much larger. <EventAgendaGrid> is shown here abridged to
 * one morning, with the full two days on /programme — enough to prove the
 * programme exists and is specific, not so much that the page becomes the
 * schedule.
 *
 * <ComparisonTable> FOR TICKETS, NOT <PricingTiers>. Pricing tiers carry a
 * monthly/yearly toggle that cannot be turned off, and a conference ticket
 * is bought once. The columns are ticket types and the rows are what each
 * one lets you through the door for, which is also how the question is
 * actually asked: "does the standard ticket include the workshops".
 *
 * Anchors are prefixed `ev-`.
 */

import * as React from 'react'
import { AnnouncementBar } from '@/lib/blocks/sources/announcement-bar'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroMetrics } from '@/lib/blocks/sources/hero-metrics'
import { EventAgendaGrid } from '@/lib/blocks/sources/event-agenda-grid'
import { TeamGrid } from '@/lib/blocks/sources/team-grid'
import { LogoGrid } from '@/lib/blocks/sources/logo-grid'
import { ComparisonTable } from '@/lib/blocks/sources/comparison-table'
import { FaqTwoColumn } from '@/lib/blocks/sources/faq-two-column'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const FACTS = [
  { value: '14–15 May', label: 'Two days, Berlin' },
  { value: '3', label: 'Tracks, no keynote clashes' },
  { value: '420', label: 'Tickets, and that is the cap' },
  { value: '€260', label: 'Early bird, until 28 Feb' },
]

/* One morning only. The full two days live on /programme. */
const MORNING = [
  {
    start: '08:30',
    end: '09:30',
    sessions: [{ title: 'Registration and coffee', kind: 'break' as const, room: 'Foyer' }],
  },
  {
    start: '09:30',
    end: '10:15',
    sessions: [
      {
        title: 'What we got wrong about build tooling, twice',
        speaker: 'Aisling Moreau',
        room: 'Great Hall',
        kind: 'keynote' as const,
        href: '#',
      },
    ],
  },
  {
    start: '10:30',
    end: '11:10',
    sessions: [
      {
        title: 'Deleting the cache layer and getting faster',
        track: 'Platform',
        speaker: 'Tobias Renner',
        room: 'Room A',
        href: '#',
      },
      {
        title: 'Type-safe forms without a runtime',
        track: 'Interface',
        speaker: 'Priya Ramanathan',
        room: 'Room B',
        href: '#',
      },
      {
        title: 'How we run a design review that people want to attend',
        track: 'Practice',
        speaker: 'Marcus Oyelaran',
        room: 'Room C',
        href: '#',
      },
    ],
  },
]

const SPEAKERS = [
  {
    name: 'Aisling Moreau',
    role: 'Principal engineer, Northwind',
    bio: 'Opening keynote. Ten years of build tooling, told as the two times she was confidently wrong about it.',
    initials: 'AM',
  },
  {
    name: 'Tobias Renner',
    role: 'Staff engineer, Contoso',
    bio: 'On removing a caching layer and getting faster, with the profiler output and the argument that preceded it.',
    initials: 'TR',
  },
  {
    name: 'Priya Ramanathan',
    role: 'Independent',
    bio: 'Type-safe forms with no runtime library, and a workshop on accessible components from first principles.',
    initials: 'PR',
  },
  {
    name: 'Marcus Oyelaran',
    role: 'Design director, Umbra',
    bio: 'Design reviews people actually attend, and what changed when they stopped being a gate.',
    initials: 'MO',
  },
  {
    name: 'Hana Lindqvist',
    role: 'Database engineer, Vandelay',
    bio: 'Five years of one monorepo and the Postgres bill that came with it, assessed honestly.',
    initials: 'HL',
  },
  {
    name: 'Dev Kaur',
    role: 'Accessibility lead, Aperture',
    bio: 'Animation that survives prefers-reduced-motion, and why the fallback is usually the better design.',
    initials: 'DK',
  },
]

const TICKET_ROWS = [
  { feature: 'Price until 28 February', values: ['€180', '€260', '€420'] },
  { feature: 'Price from 1 March', values: ['€180', '€340', '€520'] },
  { feature: 'Both conference days', values: [true, true, true] },
  { feature: 'Talk recordings, published within two weeks', values: [true, true, true] },
  { feature: 'Lunch and the Thursday party', values: [false, true, true] },
  { feature: 'Hands-on workshops (limited to 24 seats each)', values: [false, false, true] },
  { feature: 'Speakers’ dinner on the Wednesday', values: [false, false, true] },
  { feature: 'Transferable to a colleague', values: [true, true, true] },
  { feature: 'Refundable until 1 April', values: [true, true, true] },
]

const LOGISTICS = [
  {
    question: 'What is the community ticket and who is it for?',
    answer:
      'It is the same two days at €180, for students, people between jobs, and anyone whose employer is not paying. Nobody is asked to prove any of that — you tick a box. We hold 80 of them and they are funded by the sponsor tiers, not by the other ticket types.',
  },
  {
    question: 'Are the talks recorded, and are they free afterwards?',
    answer:
      'All of them, published to the public within two weeks, no login and no paywall. Workshops are not recorded because the value is in the room and a camera changes how people ask questions.',
  },
  {
    question: 'Can I get a refund if I cannot come?',
    answer:
      'Full refund until 1 April, no reason needed. After that the ticket is transferable to anyone else right up to the morning of the event — change the name in your order and that is the whole process.',
  },
  {
    question: 'What does "no keynote clashes" mean?',
    answer:
      'Three tracks run in parallel, but the two keynotes and the closing panel run alone with nothing scheduled against them. Nobody should have to choose between the talk everybody will discuss and one they specifically came for.',
  },
  {
    question: 'How accessible is the venue?',
    answer:
      'Step-free throughout, including the stage. Live captions on every talk in the Great Hall and Room A, a quiet room open both days, and hearing loops in all three rooms. Email us before you book if you need something not listed here and we will answer before you pay.',
  },
  {
    question: 'Is there a code of conduct and is it enforced?',
    answer:
      'Yes, and yes — it is linked in the footer, it names the three people on the response team, and they are at the event both days with a phone number printed on every badge. It has been used twice in four years and both reports resulted in action.',
  },
]

export default function EventLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar
        badge="Early bird"
        message="€260 until 28 February — the price steps up to €340 at midnight CET, and there are 420 tickets in total."
        ctaLabel="Book a ticket"
        ctaHref="#ev-tickets"
        storageKey="hl-event-earlybird"
      />

      <NavbarSimple
        brand="Frontier"
        links={[
          { label: 'Programme', href: '#ev-programme' },
          { label: 'Speakers', href: '#ev-speakers' },
          { label: 'Tickets', href: '#ev-tickets' },
          { label: 'Venue', href: '#ev-answers' },
        ]}
        activeLabel="Programme"
        ctaLabel="Book a ticket"
        ctaHref="#ev-tickets"
      />

      <main>
        <HeroMetrics
          eyebrow="Berlin · 14–15 May 2026"
          heading="Two days on the parts of building software nobody demos"
          subheading="Three tracks on platform, interface and practice, for people who ship and maintain the same system. No vendor pitches, no panels about the future of work, and every talk published free within a fortnight."
          metrics={FACTS}
          primaryLabel="Book a ticket"
          primaryHref="#ev-tickets"
          secondaryLabel="Read the programme"
          secondaryHref="#ev-programme"
        />

        <div id="ev-programme">
          <EventAgendaGrid
            heading="Thursday morning, as an example"
            dayLabel="Thursday 14 May · the full two days are on the programme page"
            timeZoneLabel="All times CEST (Berlin)"
            slots={MORNING}
          />
        </div>

        <div id="ev-speakers">
          <TeamGrid
            heading="Speaking this year"
            intro="Eighteen talks across two days; six of them are here. Everyone speaking has shipped and maintained the thing they are describing — we do not take submissions about work somebody else did."
            members={SPEAKERS}
          />
        </div>

        <LogoGrid
          caption="Funded by six sponsors, none of whom get a stage slot"
          footnote="Sponsorship pays for the community tickets, the captions and the recordings. It does not buy a talk — every session on the programme went through the same review, and three sponsors submitted and were turned down this year."
        />

        <div id="ev-tickets">
          <ComparisonTable
            heading="Three tickets"
            subheading="One price, paid once, and the same two days in all three. The differences are lunch, the workshops and the dinner — there is no version of this event where you see fewer talks."
            columns={['Community', 'Standard', 'Workshop']}
            rows={TICKET_ROWS}
            highlightColumn={1}
          />
        </div>

        <div id="ev-answers">
          <FaqTwoColumn
            heading="Before you book"
            subheading="The logistics that decide whether a ticket is usable, answered properly rather than in a line each."
            items={LOGISTICS}
            helpTitle="Something not covered?"
            helpBody="Two of us read this inbox and we answer before you pay, not after. Access requirements especially — ask first."
            helpCtaLabel="Email the organisers"
          />
        </div>

        <CtaSplitPanel
          heading="420 tickets, and 190 have gone"
          supporting="The early-bird price holds until the end of February. After that it steps up once, and it does not step back down."
          primaryLabel="Book a ticket"
          primaryHref="#ev-tickets"
          secondaryLabel="Get the programme by email"
          reassurance={[
            { text: 'Full refund until 1 April, no reason needed' },
            { text: 'Transferable to a colleague right up to the morning' },
            { text: 'Every talk published free within two weeks' },
          ]}
        />
      </main>

      <FooterMinimal
        brand="Frontier"
        links={[
          { label: 'Programme', href: '#ev-programme' },
          { label: 'Code of conduct', href: '#' },
          { label: 'Accessibility', href: '#ev-answers' },
          { label: 'Past years', href: '#' },
        ]}
        socials={[{ label: 'GitHub', href: '#', icon: 'github' }]}
      />
    </div>
  )
}
