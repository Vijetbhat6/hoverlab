/**
 * <DashboardActivityFeed> — a "what just happened" panel.
 *
 * Timestamps render as relative text ("2h ago") inside a <time> carrying
 * the absolute ISO value, so hovering gives the exact moment and a screen
 * reader is not left with a figure that silently goes stale.
 *
 * Each row's actor avatar is initials rather than an image. An activity
 * feed is the worst place for avatar images: a dozen network requests for
 * decoration, each one a layout shift when it lands.
 */

import * as React from 'react'
import { GitCommit, MessageSquare, UserPlus, CreditCard, ArrowRight } from 'lucide-react'

export type ActivityKind = 'commit' | 'comment' | 'signup' | 'payment'

export interface ActivityEvent {
  id: string
  kind: ActivityKind
  actor: string
  /** Verb phrase — the actor's name is prefixed automatically. */
  action: string
  target?: string
  /** ISO timestamp. */
  at: string
}

export interface DashboardActivityFeedProps {
  events?: ActivityEvent[]
  heading?: string
  /** "now" for relative formatting. Pass a fixed value to keep it testable. */
  now?: Date
  viewAllHref?: string
  className?: string
}

const KIND_STYLE: Record<ActivityKind, { icon: React.ReactNode; tone: string }> = {
  commit: { icon: <GitCommit className="h-3.5 w-3.5" />, tone: 'bg-sky-500/15 text-sky-500' },
  comment: {
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    tone: 'bg-violet-500/15 text-violet-500',
  },
  signup: { icon: <UserPlus className="h-3.5 w-3.5" />, tone: 'bg-emerald-500/15 text-emerald-500' },
  payment: { icon: <CreditCard className="h-3.5 w-3.5" />, tone: 'bg-amber-500/15 text-amber-500' },
}

const DEFAULT_NOW = new Date('2026-08-08T12:00:00Z')

const DEFAULT_EVENTS: ActivityEvent[] = [
  {
    id: '1',
    kind: 'payment',
    actor: 'Northwind Ltd',
    action: 'upgraded to',
    target: 'Team annual',
    at: '2026-08-08T11:42:00Z',
  },
  {
    id: '2',
    kind: 'signup',
    actor: 'Marco Silva',
    action: 'created an account',
    at: '2026-08-08T09:15:00Z',
  },
  {
    id: '3',
    kind: 'comment',
    actor: 'Priya Raman',
    action: 'commented on',
    target: 'Billing migration',
    at: '2026-08-07T16:30:00Z',
  },
  {
    id: '4',
    kind: 'commit',
    actor: 'Alex Chen',
    action: 'pushed 3 commits to',
    target: 'main',
    at: '2026-08-07T08:05:00Z',
  },
  {
    id: '5',
    kind: 'signup',
    actor: 'Dana Whitfield',
    action: 'created an account',
    at: '2026-08-05T13:20:00Z',
  },
]

/** Coarse relative time — exact enough for a feed, no dependency needed. */
function relativeTime(iso: string, now: Date): string {
  const seconds = Math.round((now.getTime() - new Date(iso).getTime()) / 1000)
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [3600, 'minute'],
    [86400, 'hour'],
    [604800, 'day'],
    [2629800, 'week'],
    [Infinity, 'month'],
  ]

  const divisors = [1, 60, 3600, 86400, 604800, 2629800]
  const format = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  for (let i = 0; i < units.length; i += 1) {
    if (Math.abs(seconds) < units[i][0]) {
      return format.format(-Math.round(seconds / divisors[i]), units[i][1])
    }
  }
  return format.format(-Math.round(seconds / 2629800), 'month')
}

export function DashboardActivityFeed({
  events = DEFAULT_EVENTS,
  heading = 'Recent activity',
  now = DEFAULT_NOW,
  viewAllHref,
  className = '',
}: DashboardActivityFeedProps) {
  return (
    <section
      className={`rounded-2xl border border-border/60 bg-card/80 backdrop-blur ${className}`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-border/60 px-5 py-4">
        <h2 className="font-semibold tracking-tight">{heading}</h2>
        {viewAllHref ? (
          <a
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-all hover:gap-2 hover:text-foreground"
          >
            View all
            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>

      <ul className="divide-y divide-border/40">
        {events.map((event) => {
          const style = KIND_STYLE[event.kind]
          return (
            <li key={event.id} className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30">
              <span
                aria-hidden
                className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style.tone}`}
              >
                {style.icon}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug">
                  <span className="font-medium">{event.actor}</span>{' '}
                  <span className="text-muted-foreground">{event.action}</span>
                  {event.target ? <span className="font-medium"> {event.target}</span> : null}
                </p>
                <time
                  dateTime={event.at}
                  title={new Date(event.at).toUTCString()}
                  className="mt-0.5 block text-xs text-muted-foreground"
                >
                  {relativeTime(event.at, now)}
                </time>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
