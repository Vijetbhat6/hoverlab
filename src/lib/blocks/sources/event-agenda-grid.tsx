/**
 * <EventAgendaGrid> — a conference day across parallel tracks.
 *
 * The reason this is not <CalendarMonth> with different data: a conference
 * agenda has a second axis that a calendar does not. The question a
 * delegate is answering is never "what is on at 14:00" — it is "at 14:00,
 * which of these three rooms do I walk to", and that is a comparison across
 * a row. A month grid puts time on both axes and has nowhere to put the
 * track, so the moment a slot has three sessions it degrades into "+2 more"
 * and hides the exact choice the reader came to make.
 *
 * SO: time down the start edge, tracks across, one cell per session, and
 * everything that is not a choice — registration, lunch, the keynote —
 * spans the full width. The span is load-bearing rather than decorative: a
 * break rendered as three identical cells reads as three simultaneous
 * break sessions you have to choose between.
 *
 * A GRID IS THE WRONG SHAPE ON A PHONE, so there are two renders and only
 * one of them is in the accessibility tree at a time. Narrow screens get
 * the same data as a linear list grouped by time, which is what a delegate
 * standing in a corridor actually reads; the grid is `hidden` below `lg`.
 * Both are built from the same array, so they cannot drift.
 *
 * TIMES ARE PRE-FORMATTED STRINGS AND THE ZONE IS NAMED. Calling
 * `toLocaleTimeString` during render is a hydration mismatch — the server's
 * zone is not the browser's — and an agenda whose times silently shift to
 * the reader's own zone is worse than useless to someone booking a train.
 * A conference happens in one city, in that city's time, and the strip says
 * which.
 *
 * CSS GRID, NOT A <table>. The layout is genuinely tabular, but a table
 * cannot express "this cell spans all columns and that one is empty"
 * without `colspan` bookkeeping the author has to keep in step by hand, and
 * an empty `<td>` is announced as a blank cell in every row a track has
 * nothing on. A list of time groups, each with its sessions, is the honest
 * structure — the grid is presentation laid over it.
 */

import * as React from 'react'
import { MapPin, Clock } from 'lucide-react'

/*
  Hashed from the heading rather than fixed, because two agendas — a
  Thursday and a Friday — legitimately appear on one page, and a literal
  id would make the second one's `aria-labelledby` resolve to the first
  one's heading. Server component, so no `useId`.
*/
function instanceId(...parts: (string | undefined)[]): string {
  const text = parts.filter(Boolean).join('|')
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = (Math.imul(hash, 31) + text.charCodeAt(i)) | 0
  return (hash >>> 0).toString(36).slice(0, 6)
}

export interface AgendaSession {
  title: string
  /** Track name. Must match one of `tracks`, or the session renders full width. */
  track?: string
  speaker?: string
  room?: string
  /** Anything that is not a talk: a break, a keynote, registration. */
  kind?: 'talk' | 'keynote' | 'break' | 'workshop'
  href?: string
}

export interface AgendaSlot {
  /** Pre-formatted in the event's own zone. See the header. */
  start: string
  end?: string
  sessions: AgendaSession[]
}

export interface EventAgendaGridProps {
  heading?: string
  /** The day this agenda is for — "Thursday 14 May". */
  dayLabel?: string
  /** The zone the times are quoted in, spelled out. */
  timeZoneLabel?: string
  /** Column order. A session whose `track` is not here spans the full width. */
  tracks?: string[]
  slots?: AgendaSlot[]
  className?: string
}

const DEFAULT_TRACKS = ['Platform', 'Interface', 'Practice']

const DEFAULT_SLOTS: AgendaSlot[] = [
  {
    start: '08:30',
    end: '09:30',
    sessions: [{ title: 'Registration and coffee', kind: 'break', room: 'Foyer' }],
  },
  {
    start: '09:30',
    end: '10:15',
    sessions: [
      {
        title: 'What we got wrong about build tooling, twice',
        speaker: 'Aisling Moreau',
        room: 'Great Hall',
        kind: 'keynote',
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
  {
    start: '11:20',
    end: '12:00',
    sessions: [
      {
        title: 'Postgres is still the answer, and here is the bill',
        track: 'Platform',
        speaker: 'Hana Lindqvist',
        room: 'Room A',
        href: '#',
      },
      {
        title: 'Animation that survives prefers-reduced-motion',
        track: 'Interface',
        speaker: 'Dev Kaur',
        room: 'Room B',
        href: '#',
      },
    ],
  },
  {
    start: '12:00',
    end: '13:30',
    sessions: [{ title: 'Lunch, and the unconference board opens', kind: 'break', room: 'Foyer' }],
  },
  {
    start: '13:30',
    end: '15:00',
    sessions: [
      {
        title: 'Workshop: profiling a slow page down to the frame',
        track: 'Platform',
        speaker: 'Tobias Renner',
        room: 'Lab 1',
        kind: 'workshop',
        href: '#',
      },
      {
        title: 'Workshop: accessible components from first principles',
        track: 'Interface',
        speaker: 'Priya Ramanathan',
        room: 'Lab 2',
        kind: 'workshop',
        href: '#',
      },
      {
        title: 'Open space: hiring without take-home tests',
        track: 'Practice',
        room: 'Room C',
        href: '#',
      },
    ],
  },
  {
    start: '15:20',
    end: '16:00',
    sessions: [
      {
        title: 'Five years of one monorepo, honestly assessed',
        track: 'Platform',
        speaker: 'Hana Lindqvist',
        room: 'Room A',
        href: '#',
      },
      {
        title: 'Design tokens after the second rename',
        track: 'Interface',
        speaker: 'Marcus Oyelaran',
        room: 'Room B',
        href: '#',
      },
      {
        title: 'What on-call does to a team, and what to do about it',
        track: 'Practice',
        speaker: 'Aisling Moreau',
        room: 'Room C',
        href: '#',
      },
    ],
  },
  {
    start: '16:15',
    end: '17:00',
    sessions: [
      {
        title: 'Closing panel: the parts we are all still doing by hand',
        room: 'Great Hall',
        kind: 'keynote',
        href: '#',
      },
    ],
  },
]

/** Per-kind chrome. Kept in one place so the two renders cannot diverge. */
function kindClasses(kind: AgendaSession['kind']): string {
  switch (kind) {
    case 'break':
      return 'border-dashed border-border bg-muted/40 text-muted-foreground'
    case 'keynote':
      return 'border-primary/40 bg-primary/5'
    case 'workshop':
      return 'border-border bg-card ring-1 ring-inset ring-border/60'
    default:
      return 'border-border bg-card'
  }
}

function kindLabel(kind: AgendaSession['kind']): string | null {
  if (kind === 'keynote') return 'Keynote'
  if (kind === 'workshop') return 'Workshop · 90 min'
  return null
}

/** One session, used by both the grid and the narrow list. */
function SessionCard({ session }: { session: AgendaSession }) {
  const label = kindLabel(session.kind)
  const Tag = session.href ? 'a' : 'div'

  return (
    <Tag
      {...(session.href ? { href: session.href } : {})}
      className={`flex h-full flex-col rounded-xl border p-3 text-start transition-colors ${kindClasses(
        session.kind,
      )} ${session.href ? 'hover:border-primary/50 hover:bg-muted/40' : ''}`}
    >
      {label ? (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
          {label}
        </span>
      ) : null}

      <p
        className={`text-sm font-semibold leading-snug ${label ? 'mt-1' : ''} ${
          session.kind === 'break' ? 'text-muted-foreground' : 'text-card-foreground'
        }`}
      >
        {session.title}
      </p>

      {session.speaker ? (
        <p className="mt-1.5 text-xs font-medium text-muted-foreground">{session.speaker}</p>
      ) : null}

      {session.room ? (
        <p className="mt-auto pt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin aria-hidden className="h-3 w-3" />
          {session.room}
        </p>
      ) : null}
    </Tag>
  )
}

export function EventAgendaGrid({
  heading = 'The programme',
  dayLabel = 'Thursday 14 May',
  timeZoneLabel = 'All times CEST (Berlin)',
  tracks = DEFAULT_TRACKS,
  slots = DEFAULT_SLOTS,
  className = '',
}: EventAgendaGridProps) {
  const headingId = `event-agenda-heading-${instanceId(heading, dayLabel)}`

  /* `6rem` for the time gutter, then one equal column per track. Inline
     because the track count is data — a Tailwind class cannot be built
     from a runtime number without the JIT having seen it. */
  const gridTemplate = { gridTemplateColumns: `6rem repeat(${tracks.length}, minmax(0, 1fr))` }

  return (
    <section
      aria-labelledby={headingId}
      className={`mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h2 id={headingId} className="text-3xl font-bold tracking-tight sm:text-4xl">
            {heading}
          </h2>
          <p className="mt-2 text-sm font-medium text-muted-foreground">{dayLabel}</p>
        </div>
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock aria-hidden className="h-3.5 w-3.5" />
          {timeZoneLabel}
        </p>
      </header>

      {/* ── Wide: the grid ───────────────────────────────────────────── */}
      <div className="mt-8 hidden lg:block">
        <div className="grid gap-2 pb-2" style={gridTemplate} aria-hidden>
          <span />
          {tracks.map((track) => (
            <span
              key={track}
              className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {track}
            </span>
          ))}
        </div>

        <ol className="space-y-2">
          {slots.map((slot) => {
            /* A slot is "shared" when nothing in it names a known track —
               registration, lunch, a keynote. It spans every column. */
            const shared = slot.sessions.filter((s) => !s.track || !tracks.includes(s.track))

            return (
              <li key={slot.start} className="grid gap-2" style={gridTemplate}>
                <div className="pt-3 text-xs font-medium tabular-nums text-muted-foreground">
                  {slot.start}
                  {slot.end ? (
                    <span className="block text-muted-foreground/60">{slot.end}</span>
                  ) : null}
                </div>

                {shared.length ? (
                  <div style={{ gridColumn: `span ${tracks.length}` }}>
                    {shared.map((session) => (
                      <SessionCard key={session.title} session={session} />
                    ))}
                  </div>
                ) : (
                  tracks.map((track) => {
                    const session = slot.sessions.find((s) => s.track === track)
                    return (
                      <div key={track}>
                        {session ? <SessionCard session={session} /> : null}
                      </div>
                    )
                  })
                )}
              </li>
            )
          })}
        </ol>
      </div>

      {/* ── Narrow: the same data, grouped by time ───────────────────── */}
      <ol className="mt-8 space-y-8 lg:hidden">
        {slots.map((slot) => (
          <li key={slot.start}>
            <p className="text-xs font-semibold uppercase tracking-wider tabular-nums text-muted-foreground">
              {slot.start}
              {slot.end ? ` – ${slot.end}` : null}
            </p>
            <ul className="mt-3 space-y-2">
              {slot.sessions.map((session) => (
                <li key={session.title}>
                  {session.track ? (
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary/80">
                      {session.track}
                    </p>
                  ) : null}
                  <SessionCard session={session} />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  )
}
