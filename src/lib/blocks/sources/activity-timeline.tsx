/**
 * <ActivityTimeline> — an audit log grouped by day.
 *
 * Forty events in a flat list of identical grey dots is technically a
 * timeline and practically unreadable. Two decisions carry all the weight
 * here: events sit under day headings, so "when" is answered by position
 * before you read a single row; and the node icon varies by event type,
 * so a deploy, an incident and a settings change stay distinguishable
 * mid-scroll. Detail attaches inline, in a card under its own row — never
 * a modal, which would cost the reader their place in the sequence.
 */

import * as React from 'react'
import { Rocket, MessageSquare, UserPlus, Settings2, Siren } from 'lucide-react'

export type TimelineKind = 'deploy' | 'comment' | 'member' | 'settings' | 'incident'

export interface TimelineEvent {
  id: string
  kind: TimelineKind
  actor: string
  /** Verb phrase — the actor's name is prefixed automatically. */
  action: string
  target?: string
  /** ISO timestamp; the visible label is the short form. */
  at: string
  timeLabel: string
  /** Optional inline detail card, e.g. a two-line config diff. */
  detail?: { removed: string; added: string }
}

export interface TimelineGroup {
  label: string
  events: TimelineEvent[]
}

export interface ActivityTimelineProps {
  groups?: TimelineGroup[]
  heading?: string
  className?: string
}

const KIND_STYLE: Record<TimelineKind, { icon: React.ReactNode; tone: string }> = {
  deploy: { icon: <Rocket className="h-3.5 w-3.5" />, tone: 'bg-sky-500/15 text-sky-500' },
  comment: {
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    tone: 'bg-violet-500/15 text-violet-500',
  },
  member: { icon: <UserPlus className="h-3.5 w-3.5" />, tone: 'bg-emerald-500/15 text-emerald-500' },
  settings: {
    icon: <Settings2 className="h-3.5 w-3.5" />,
    tone: 'bg-amber-500/15 text-amber-500',
  },
  incident: { icon: <Siren className="h-3.5 w-3.5" />, tone: 'bg-destructive/15 text-destructive' },
}

const DEFAULT_GROUPS: TimelineGroup[] = [
  {
    label: 'Today, Aug 13',
    events: [
      {
        id: '1',
        kind: 'deploy',
        actor: 'Alex Chen',
        action: 'deployed',
        target: 'web@2026.08.13-r2',
        at: '2026-08-13T14:05:00Z',
        timeLabel: '14:05',
      },
      {
        id: '2',
        kind: 'settings',
        actor: 'Priya Raman',
        action: 'changed retention in',
        target: 'audit-log config',
        at: '2026-08-13T11:20:00Z',
        timeLabel: '11:20',
        detail: { removed: 'retention_days: 30', added: 'retention_days: 90' },
      },
      {
        id: '3',
        kind: 'comment',
        actor: 'Dana Whitfield',
        action: 'commented on',
        target: 'Billing migration RFC',
        at: '2026-08-13T09:42:00Z',
        timeLabel: '09:42',
      },
    ],
  },
  {
    label: 'Yesterday',
    events: [
      {
        id: '4',
        kind: 'member',
        actor: 'Rosa Martínez',
        action: 'invited',
        target: 'jonas@acme.dev',
        at: '2026-08-12T16:30:00Z',
        timeLabel: '16:30',
      },
      {
        id: '5',
        kind: 'incident',
        actor: 'Sam Okafor',
        action: 'resolved',
        target: 'INC-208: elevated 5xx on api-eu',
        at: '2026-08-12T08:15:00Z',
        timeLabel: '08:15',
      },
    ],
  },
  {
    label: 'Aug 10',
    events: [
      {
        id: '6',
        kind: 'deploy',
        actor: 'Alex Chen',
        action: 'rolled back',
        target: 'web@2026.08.10-r1',
        at: '2026-08-10T19:47:00Z',
        timeLabel: '19:47',
      },
      {
        id: '7',
        kind: 'settings',
        actor: 'Priya Raman',
        action: 'enabled',
        target: 'SSO enforcement',
        at: '2026-08-10T10:05:00Z',
        timeLabel: '10:05',
      },
    ],
  },
]

export function ActivityTimeline({
  groups = DEFAULT_GROUPS,
  heading = 'Activity',
  className = '',
}: ActivityTimelineProps) {
  return (
    <section className={`rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur ${className}`}>
      <h2 className="font-semibold tracking-tight">{heading}</h2>

      <div className="mt-4 space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </h3>

            <ul className="relative ms-3.5 space-y-4 border-s border-border/60 ps-6">
              {group.events.map((event) => {
                const style = KIND_STYLE[event.kind]
                return (
                  <li key={event.id} className="relative">
                    <span
                      aria-hidden
                      className={`absolute -left-[2.35rem] top-0 inline-flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-background ${style.tone}`}
                    >
                      {style.icon}
                    </span>

                    <p className="text-sm leading-snug">
                      <span className="font-medium">{event.actor}</span>{' '}
                      <span className="text-muted-foreground">{event.action}</span>
                      {event.target ? (
                        <span className="font-medium text-primary underline-offset-2 hover:underline">
                          {' '}
                          {event.target}
                        </span>
                      ) : null}
                    </p>
                    <time dateTime={event.at} className="mt-0.5 block text-xs text-muted-foreground">
                      {event.timeLabel}
                    </time>

                    {event.detail ? (
                      <div className="mt-2 rounded-lg border border-border/60 bg-muted/40 p-3 font-mono text-xs leading-relaxed">
                        <p className="text-destructive">- {event.detail.removed}</p>
                        <p className="text-emerald-600 dark:text-emerald-400">
                          + {event.detail.added}
                        </p>
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
