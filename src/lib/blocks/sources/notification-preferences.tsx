'use client'

/**
 * <NotificationPreferences> — the per-event, per-channel matrix.
 *
 * Every product grows this screen and most build it as a flat list of
 * switches, which cannot express the thing users actually want: "tell me
 * about billing by email, mentions by push, and nothing at all in my inbox
 * digest". A matrix is the honest shape, and the honest shape is a table.
 *
 * It IS a `<table>`, not a grid of divs. The relationship between a row and
 * a column is the entire content of this screen, and a table is the only
 * markup that carries it — a screen reader on a real table announces
 * "Mentions, Push, checked" from the header cells, where a div grid
 * announces "checkbox, checked" thirty times.
 *
 * Two rules encoded, both learned from products that got them wrong:
 *
 *  - Some notifications cannot be turned off, and the row says so rather
 *    than silently re-enabling itself on save. Security alerts and billing
 *    failures are the usual set. A disabled switch with a reason beats a
 *    switch that does not stick.
 *
 *  - Turning a whole channel off is one action, not fourteen. The column
 *    header is a control, and it reflects a mixed column as indeterminate
 *    rather than guessing at on or off.
 */

import * as React from 'react'
import { Mail, Smartphone, Bell, Lock } from 'lucide-react'

export type ChannelId = 'email' | 'push' | 'inApp'

export interface NotificationEvent {
  id: string
  label: string
  description: string
  /** Channels that cannot be switched off, and why. */
  required?: { channels: ChannelId[]; reason: string }
}

export type Preferences = Record<string, Record<ChannelId, boolean>>

export interface NotificationPreferencesProps {
  events?: NotificationEvent[]
  value?: Preferences
  onChange?: (next: Preferences) => void
  className?: string
}

const CHANNELS: { id: ChannelId; label: string; icon: React.ReactNode }[] = [
  { id: 'email', label: 'Email', icon: <Mail className="h-3.5 w-3.5" /> },
  { id: 'push', label: 'Push', icon: <Smartphone className="h-3.5 w-3.5" /> },
  { id: 'inApp', label: 'In-app', icon: <Bell className="h-3.5 w-3.5" /> },
]

const DEFAULT_EVENTS: NotificationEvent[] = [
  {
    id: 'mentions',
    label: 'Mentions & replies',
    description: 'Someone @-mentions you or replies to your comment.',
  },
  {
    id: 'assignments',
    label: 'Assignments',
    description: 'Work is assigned to you or reassigned away from you.',
  },
  {
    id: 'digest',
    label: 'Weekly digest',
    description: 'A Monday summary of what moved last week.',
  },
  {
    id: 'billing',
    label: 'Billing',
    description: 'Receipts, upcoming charges, and failed payments.',
    required: {
      channels: ['email'],
      reason: 'A failed payment has to reach you somewhere you will see it.',
    },
  },
  {
    id: 'security',
    label: 'Security',
    description: 'New sign-ins, password changes, and API key creation.',
    required: {
      channels: ['email'],
      reason: 'Security alerts cannot be switched off.',
    },
  },
]

function defaultPreferences(events: NotificationEvent[]): Preferences {
  const out: Preferences = {}
  for (const event of events) {
    out[event.id] = {
      email: true,
      push: event.id === 'mentions' || event.id === 'assignments',
      inApp: event.id !== 'digest',
    }
  }
  return out
}

function isRequired(event: NotificationEvent, channel: ChannelId): boolean {
  return Boolean(event.required?.channels.includes(channel))
}

export function NotificationPreferences({
  events = DEFAULT_EVENTS,
  value,
  onChange,
  className,
}: NotificationPreferencesProps) {
  // Uncontrolled by default, controlled when `value` is supplied — the same
  // contract as a native input, so this drops into a form without the
  // caller having to own state it does not care about.
  const [internal, setInternal] = React.useState<Preferences>(() =>
    defaultPreferences(events),
  )
  const prefs = value ?? internal

  const commit = (next: Preferences) => {
    if (value === undefined) setInternal(next)
    onChange?.(next)
  }

  const toggle = (eventId: string, channel: ChannelId) => {
    const event = events.find((e) => e.id === eventId)
    if (event && isRequired(event, channel)) return
    commit({
      ...prefs,
      [eventId]: { ...prefs[eventId]!, [channel]: !prefs[eventId]![channel] },
    })
  }

  /**
   * A column is on when every switchable row in it is on.
   *
   * Required rows are excluded from the calculation rather than counted as
   * "on". Counting them means a column of one required row and nine off
   * rows can never read as fully off, so the header control would look
   * broken to the person clicking it.
   */
  const columnState = (channel: ChannelId): 'on' | 'off' | 'mixed' => {
    const switchable = events.filter((e) => !isRequired(e, channel))
    if (!switchable.length) return 'on'
    const on = switchable.filter((e) => prefs[e.id]?.[channel]).length
    if (on === 0) return 'off'
    return on === switchable.length ? 'on' : 'mixed'
  }

  const setColumn = (channel: ChannelId, on: boolean) => {
    const next: Preferences = { ...prefs }
    for (const event of events) {
      if (isRequired(event, channel)) continue
      next[event.id] = { ...next[event.id]!, [channel]: on }
    }
    commit(next)
  }

  return (
    <section
      className={`w-full rounded-2xl border border-border/60 bg-card ${className ?? ''}`}
      aria-labelledby="notif-heading"
    >
      <header className="border-b border-border/60 px-6 py-4">
        <h2 id="notif-heading" className="text-base font-semibold tracking-tight">
          Notifications
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Choose how you hear about each kind of event. Changes save as you
          make them.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-start">
          <caption className="sr-only">
            Notification channels by event type. Each cell is a switch.
          </caption>
          <thead>
            <tr className="border-b border-border/60">
              <th scope="col" className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Event
              </th>
              {CHANNELS.map((channel) => {
                const state = columnState(channel.id)
                return (
                  <th key={channel.id} scope="col" className="px-4 py-3 text-center">
                    <span className="flex flex-col items-center gap-1.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <span aria-hidden>{channel.icon}</span>
                        {channel.label}
                      </span>
                      {/*
                        The column control. `aria-checked="mixed"` is what
                        makes a partially-on column announce as mixed rather
                        than as a lie in one direction — the reason this is a
                        button with a role rather than an <input>, which has
                        no mixed state that survives a click.
                      */}
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={state === 'mixed' ? 'mixed' : state === 'on'}
                        aria-label={`All ${channel.label.toLowerCase()} notifications`}
                        onClick={() => setColumn(channel.id, state !== 'on')}
                        className="text-[11px] font-medium text-primary hover:underline"
                      >
                        {state === 'on' ? 'Turn all off' : 'Turn all on'}
                      </button>
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {events.map((event) => (
              <tr key={event.id}>
                <th scope="row" className="px-6 py-4 font-normal">
                  <span className="block text-sm font-medium">{event.label}</span>
                  <span className="mt-0.5 block max-w-sm text-xs text-muted-foreground">
                    {event.description}
                  </span>
                  {event.required ? (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock aria-hidden className="h-3 w-3" />
                      {event.required.reason}
                    </span>
                  ) : null}
                </th>

                {CHANNELS.map((channel) => {
                  const locked = isRequired(event, channel.id)
                  const on = Boolean(prefs[event.id]?.[channel.id])
                  return (
                    <td key={channel.id} className="px-4 py-4 text-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        disabled={locked}
                        onClick={() => toggle(event.id, channel.id)}
                        aria-label={`${event.label} by ${channel.label}`}
                        title={locked ? event.required?.reason : undefined}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                          on ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm motion-safe:transition-transform ${
                            on ? 'translate-x-[1.125rem]' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
