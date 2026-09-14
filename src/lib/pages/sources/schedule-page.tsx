/**
 * /programme — both conference days, in full.
 *
 *   thursday   day one, three tracks
 *   friday     day two, three tracks
 *   answers    how to read a grid with three things in every slot
 *
 * TWO <EventAgendaGrid>s, NOT ONE WITH A DAY SWITCHER. A tab control would
 * be the obvious interactive choice and it is the wrong one here for three
 * reasons: the page is the artefact people print and pin to a wall, a tab
 * hides half of it from find-in-page, and a delegate comparing "am I free
 * on Friday afternoon" wants both days in one scroll. Two grids also means
 * the page works with JavaScript off, which matters at a conference where
 * everyone is on the same overloaded wifi.
 *
 * Each grid gets a distinct `heading` and `dayLabel`, which is load-bearing
 * rather than cosmetic: <EventAgendaGrid> derives its `aria-labelledby`
 * target by hashing those two strings, so two grids with identical headings
 * would emit the same id twice and the second day would be announced with
 * the first day's heading. This is the duplicate-id trap that the catalog
 * hits whenever a block appears twice, solved from the caller's side
 * because the caller is the only one who knows they differ.
 *
 * NO NAVBAR CTA TO "BOOK". The person reading a full programme has either
 * already bought a ticket or is deciding on content, and both are better
 * served by the schedule being uninterrupted. The ticket link is in the nav
 * like any other route.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { EventAgendaGrid } from '@/lib/blocks/sources/event-agenda-grid'
import { FaqAccordion } from '@/lib/blocks/sources/faq-accordion'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const THURSDAY = [
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
      { title: 'Deleting the cache layer and getting faster', track: 'Platform', speaker: 'Tobias Renner', room: 'Room A', href: '#' },
      { title: 'Type-safe forms without a runtime', track: 'Interface', speaker: 'Priya Ramanathan', room: 'Room B', href: '#' },
      { title: 'How we run a design review that people want to attend', track: 'Practice', speaker: 'Marcus Oyelaran', room: 'Room C', href: '#' },
    ],
  },
  {
    start: '11:20',
    end: '12:00',
    sessions: [
      { title: 'Postgres is still the answer, and here is the bill', track: 'Platform', speaker: 'Hana Lindqvist', room: 'Room A', href: '#' },
      { title: 'Animation that survives prefers-reduced-motion', track: 'Interface', speaker: 'Dev Kaur', room: 'Room B', href: '#' },
      { title: 'Estimating badly, on purpose', track: 'Practice', speaker: 'Ruth Okonjo', room: 'Room C', href: '#' },
    ],
  },
  {
    start: '12:00',
    end: '13:30',
    sessions: [{ title: 'Lunch, and the unconference board opens', kind: 'break' as const, room: 'Foyer' }],
  },
  {
    start: '13:30',
    end: '15:00',
    sessions: [
      { title: 'Workshop: profiling a slow page down to the frame', track: 'Platform', speaker: 'Tobias Renner', room: 'Lab 1', kind: 'workshop' as const, href: '#' },
      { title: 'Workshop: accessible components from first principles', track: 'Interface', speaker: 'Priya Ramanathan', room: 'Lab 2', kind: 'workshop' as const, href: '#' },
      { title: 'Open space: hiring without take-home tests', track: 'Practice', room: 'Room C', href: '#' },
    ],
  },
  {
    start: '15:20',
    end: '16:00',
    sessions: [
      { title: 'Five years of one monorepo, honestly assessed', track: 'Platform', speaker: 'Hana Lindqvist', room: 'Room A', href: '#' },
      { title: 'Design tokens after the second rename', track: 'Interface', speaker: 'Marcus Oyelaran', room: 'Room B', href: '#' },
      { title: 'What on-call does to a team, and what to do about it', track: 'Practice', speaker: 'Aisling Moreau', room: 'Room C', href: '#' },
    ],
  },
  {
    start: '16:15',
    end: '17:00',
    sessions: [
      { title: 'Closing panel: the parts we are all still doing by hand', room: 'Great Hall', kind: 'keynote' as const, href: '#' },
    ],
  },
  {
    start: '19:00',
    sessions: [{ title: 'Party at the Funkhaus — badge gets you in, no ticket needed', kind: 'break' as const, room: 'Funkhaus' }],
  },
]

const FRIDAY = [
  {
    start: '09:00',
    end: '09:30',
    sessions: [{ title: 'Coffee, and the unconference board is final at 09:30', kind: 'break' as const, room: 'Foyer' }],
  },
  {
    start: '09:30',
    end: '10:15',
    sessions: [
      {
        title: 'The incident that changed how we write postmortems',
        speaker: 'Ruth Okonjo',
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
      { title: 'Queues, backpressure, and the outage we caused fixing one', track: 'Platform', speaker: 'Sam Oyelaran', room: 'Room A', href: '#' },
      { title: 'Server components, one year in production', track: 'Interface', speaker: 'Dev Kaur', room: 'Room B', href: '#' },
      { title: 'Documentation as a tier-one product', track: 'Practice', speaker: 'Elin Sørensen', room: 'Room C', href: '#' },
    ],
  },
  {
    start: '11:20',
    end: '12:00',
    sessions: [
      { title: 'Migrating 4TB without a maintenance window', track: 'Platform', speaker: 'Hana Lindqvist', room: 'Room A', href: '#' },
      { title: 'Testing a design system so it can be changed', track: 'Interface', speaker: 'Priya Ramanathan', room: 'Room B', href: '#' },
      { title: 'The unconference sessions, block one', track: 'Practice', room: 'Room C', href: '#' },
    ],
  },
  {
    start: '12:00',
    end: '13:30',
    sessions: [{ title: 'Lunch', kind: 'break' as const, room: 'Foyer' }],
  },
  {
    start: '13:30',
    end: '15:00',
    sessions: [
      { title: 'Workshop: reading a flame graph without guessing', track: 'Platform', speaker: 'Sam Oyelaran', room: 'Lab 1', kind: 'workshop' as const, href: '#' },
      { title: 'Workshop: writing a postmortem people read', track: 'Practice', speaker: 'Ruth Okonjo', room: 'Lab 2', kind: 'workshop' as const, href: '#' },
      { title: 'The unconference sessions, block two', track: 'Interface', room: 'Room B', href: '#' },
    ],
  },
  {
    start: '15:20',
    end: '16:00',
    sessions: [
      { title: 'What we would do differently, from four teams', room: 'Great Hall', kind: 'keynote' as const, href: '#' },
    ],
  },
  {
    start: '16:00',
    end: '16:30',
    sessions: [{ title: 'Close, and thank you', kind: 'break' as const, room: 'Great Hall' }],
  },
]

const HOW_TO_READ = [
  {
    question: 'What happens if two talks I want are at the same time?',
    answer:
      'Everything except the workshops is recorded and published free within two weeks, so a clash costs you the room and not the talk. The two keynotes and the closing panel deliberately run with nothing scheduled against them.',
  },
  {
    question: 'Do I need to sign up for the workshops in advance?',
    answer:
      'Yes — 24 seats each, booked from your order page, and they open two weeks before the event. A workshop ticket guarantees you a seat in one workshop per day, not in a specific one.',
  },
  {
    question: 'What is the unconference board?',
    answer:
      'A physical board in the foyer. Write a session and a room on it and it is on the programme; the Friday morning slots are filled this way. It opens at lunchtime on Thursday and is final at 09:30 on Friday.',
  },
  {
    question: 'Which rooms have live captions?',
    answer:
      'The Great Hall and Room A, both days, for every scheduled session. Room C is captioned on request with 24 hours’ notice — find any organiser or email us. Hearing loops are in all three rooms.',
  },
]

export default function SchedulePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Frontier"
        links={[
          { label: 'Programme', href: '#sc-thursday' },
          { label: 'Speakers', href: '#' },
          { label: 'Tickets', href: '#' },
          { label: 'Venue', href: '#' },
        ]}
        activeLabel="Programme"
        ctaLabel="Book a ticket"
      />

      <main>
        <header className="mx-auto w-full max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">The programme</h1>
          <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
            Both days in full. Eighteen talks, four workshops and an unconference track, across
            three rooms. Every scheduled session is recorded and published free within a
            fortnight — the workshops are not, deliberately.
          </p>
        </header>

        {/* The two headings differ on purpose: the block hashes its
            `aria-labelledby` target from heading + dayLabel, so identical
            strings would give both days the same id. */}
        <div id="sc-thursday">
          <EventAgendaGrid
            heading="Day one"
            dayLabel="Thursday 14 May"
            timeZoneLabel="All times CEST (Berlin)"
            slots={THURSDAY}
          />
        </div>

        <div id="sc-friday">
          <EventAgendaGrid
            heading="Day two"
            dayLabel="Friday 15 May"
            timeZoneLabel="All times CEST (Berlin)"
            slots={FRIDAY}
          />
        </div>

        <FaqAccordion
          heading="How to read this"
          subheading="Three tracks means a clash in almost every slot. Four questions about what that costs you."
          items={HOW_TO_READ}
        />
      </main>

      <FooterMinimal
        brand="Frontier"
        links={[
          { label: 'Programme', href: '#sc-thursday' },
          { label: 'Code of conduct', href: '#' },
          { label: 'Accessibility', href: '#' },
          { label: 'Past years', href: '#' },
        ]}
        socials={[{ label: 'GitHub', href: '#', icon: 'github' }]}
      />
    </div>
  )
}
