'use client'

/**
 * <SupportTicketThread> — the customer's side of a ticket, with the clock.
 *
 * `support-ticket-form` in this catalog raises one. `inbox-thread-detail` is
 * how the agent works it. This is the third view and the one that decides
 * whether the customer chases: what they see after they have written in.
 *
 * THE ONE THING THAT STOPS A CHASE IS A COMMITMENT WITH A TIME ON IT
 *
 * Not "we have received your request". A named next step, an owner, and a
 * deadline the customer can hold you to — "Sam replies by 17:00 today" — with
 * the clock rendered as remaining time rather than as a timestamp they have to
 * do arithmetic on. Products that ship "Status: Open" get a follow-up email
 * within a day, every time.
 *
 * THE STATUS VOCABULARY IS FOUR WORDS AND ONE OF THEM IS ABOUT THE CUSTOMER
 *
 *   Open            with us, clock running
 *   Waiting on you  with the customer, clock paused — and it says so
 *   Scheduled       a date exists; the clock is irrelevant
 *   Resolved        closed, with the reopen window stated
 *
 * "Waiting on you" is the one almost every ticket UI omits, and it is the one
 * that prevents the argument about response times.
 *
 * REOPENING IS A BUTTON, NOT A NEW TICKET. A resolved ticket that can only be
 * continued by starting again loses the whole history and doubles the queue.
 * The window is finite and the panel says how long is left in it.
 *
 * ACCESSIBILITY: the status is a word plus an icon, never colour alone; the
 * SLA countdown is a polite live region updated on the minute rather than the
 * second, because a per-second live region is unusable; the reply box is
 * always present and labelled, so a keyboard user does not have to find a
 * Reply button first.
 */

import * as React from 'react'
import {
  CalendarClock,
  CircleCheck,
  CircleDot,
  Clock,
  Paperclip,
  Send,
  UserRound,
} from 'lucide-react'

export type TicketStatus = 'open' | 'waiting-on-you' | 'scheduled' | 'resolved'

export interface TicketPost {
  id: string
  author: string
  initials: string
  mine?: boolean
  at: string
  body: string
  attachment?: string
}

export interface SupportTicketThreadProps {
  reference?: string
  subject?: string
  status?: TicketStatus
  owner?: string
  /** Minutes until the promised reply. Ignored unless status is open. */
  dueInMinutes?: number
  scheduledFor?: string
  /** Days left to reopen. Only used when resolved. */
  reopenDays?: number
  posts?: TicketPost[]
  className?: string
}

const DEFAULT_POSTS: TicketPost[] = [
  {
    id: 'p1',
    author: 'You',
    initials: 'YU',
    mine: true,
    at: '12 Sep, 09:02',
    body:
      'The second chair from ORD-88410 arrived with a cracked base plate. I would rather fit a replacement plate myself than wait for a whole chair.',
    attachment: 'base-plate.jpg',
  },
  {
    id: 'p2',
    author: 'Sam Okafor',
    initials: 'SO',
    at: '12 Sep, 09:46',
    body:
      'Sorry about that. A plate is going out today and should reach you Monday — four M6 bolts under the seat pan, and the allen key in the box fits. Fitting it yourself does not affect the warranty.',
  },
  {
    id: 'p3',
    author: 'You',
    initials: 'YU',
    mine: true,
    at: '12 Sep, 10:11',
    body: 'Great. Can you confirm the plate is for the tall variant, not the standard one?',
  },
]

const STATUS_META: Record<
  TicketStatus,
  { label: string; className: string; icon: typeof CircleDot }
> = {
  open: {
    label: 'Open',
    className: 'bg-primary/10 text-primary',
    icon: CircleDot,
  },
  'waiting-on-you': {
    label: 'Waiting on you',
    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    icon: Clock,
  },
  scheduled: {
    label: 'Scheduled',
    className: 'bg-muted text-muted-foreground',
    icon: CalendarClock,
  },
  resolved: {
    label: 'Resolved',
    className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    icon: CircleCheck,
  },
}

function remaining(minutes: number) {
  if (minutes <= 0) return 'overdue'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

export function SupportTicketThread({
  reference = 'TKT-11842',
  subject = 'Cracked base plate on ORD-88410',
  status = 'open',
  owner = 'Sam Okafor',
  dueInMinutes = 214,
  scheduledFor = 'Monday 15 September, 08:00–12:00',
  reopenDays = 14,
  posts = DEFAULT_POSTS,
  className = '',
}: SupportTicketThreadProps) {
  const uid = React.useId()
  const [draft, setDraft] = React.useState('')
  const [thread, setThread] = React.useState(posts)
  const [minutes, setMinutes] = React.useState(dueInMinutes)

  // On the minute, not the second — a per-second live region is unusable.
  React.useEffect(() => {
    if (status !== 'open') return
    const tick = window.setInterval(() => setMinutes((m) => Math.max(0, m - 1)), 60_000)
    return () => window.clearInterval(tick)
  }, [status])

  const meta = STATUS_META[status]
  const StatusIcon = meta.icon

  function send(event: React.FormEvent) {
    event.preventDefault()
    if (!draft.trim()) return
    setThread((t) => [
      ...t,
      {
        id: `n${t.length + 1}`,
        author: 'You',
        initials: 'YU',
        mine: true,
        at: '12 Sep, 10:24',
        body: draft.trim(),
      },
    ])
    setDraft('')
  }

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-2xl">
        <header className="rounded-2xl border border-border bg-card p-5">
          <p className="font-mono text-xs text-muted-foreground">{reference}</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight">{subject}</h2>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* A word and an icon, never colour alone. */}
            <span
              className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold ${meta.className}`}
            >
              <StatusIcon aria-hidden className="h-3.5 w-3.5" />
              {meta.label}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserRound aria-hidden className="h-3.5 w-3.5" />
              {owner}
            </span>
          </div>

          {/* A named next step with a time on it — the thing that stops a chase. */}
          <p
            aria-live="polite"
            className="mt-3 rounded-xl border border-border bg-muted/40 p-3 text-sm"
          >
            {status === 'open' ? (
              <>
                <span className="font-semibold">{owner} replies within {remaining(minutes)}.</span>{' '}
                <span className="text-muted-foreground">
                  That is a commitment, not an estimate. If it passes, the ticket
                  escalates automatically and you do not have to ask.
                </span>
              </>
            ) : null}
            {status === 'waiting-on-you' ? (
              <>
                <span className="font-semibold">Waiting for your answer.</span>{' '}
                <span className="text-muted-foreground">
                  The response clock is paused while it is with you — nobody is
                  ignoring this.
                </span>
              </>
            ) : null}
            {status === 'scheduled' ? (
              <>
                <span className="font-semibold">Booked for {scheduledFor}.</span>{' '}
                <span className="text-muted-foreground">
                  Nothing else is needed from you before then.
                </span>
              </>
            ) : null}
            {status === 'resolved' ? (
              <>
                <span className="font-semibold">Resolved.</span>{' '}
                <span className="text-muted-foreground">
                  You can reopen this ticket for another {reopenDays} days and
                  keep the whole history — after that it is a new one.
                </span>
              </>
            ) : null}
          </p>
        </header>

        <ol className="mt-5 space-y-3">
          {thread.map((post) => (
            <li key={post.id}>
              <article
                className={`rounded-xl border p-4 ${
                  post.mine ? 'border-border bg-card' : 'border-primary/30 bg-primary/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground"
                  >
                    {post.initials}
                  </span>
                  <h3 className="text-sm font-semibold">{post.author}</h3>
                  <span className="ms-auto text-[11px] text-muted-foreground">{post.at}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{post.body}</p>
                {post.attachment ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1 text-xs">
                    <Paperclip aria-hidden className="h-3 w-3" />
                    {post.attachment}
                  </p>
                ) : null}
              </article>
            </li>
          ))}
        </ol>

        {status === 'resolved' ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border p-4">
            <p className="text-sm text-muted-foreground">
              Did this actually fix it?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Yes, close it
              </button>
              {/* A button, not a new ticket. */}
              <button
                type="button"
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Reopen this ticket
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={send}
            className="mt-5 rounded-xl border border-border bg-card p-4"
          >
            {/* Always present, so a keyboard user need not find Reply first. */}
            <label htmlFor={`${uid}-reply`} className="block text-sm font-medium">
              Add to this ticket
            </label>
            <textarea
              id={`${uid}-reply`}
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Anything else that would help."
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <label
                htmlFor={`${uid}-file`}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
              >
                <Paperclip aria-hidden className="h-3.5 w-3.5" />
                Attach a photo
              </label>
              <input id={`${uid}-file`} type="file" accept="image/*" className="sr-only" />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                <Send aria-hidden className="h-4 w-4 rtl:rotate-180" />
                Send
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
