'use client'

/**
 * <SettingsNotificationMatrix> — every event against every channel, in one
 * grid.
 *
 * The catalog has a notification *preferences* block already, and it is the
 * common shape: a list of events with a toggle each. That shape stops
 * working the moment there is more than one delivery channel, because the
 * question stops being "do I want this" and becomes "where do I want this" —
 * and a list of toggles cannot express "email me about billing, Slack me
 * about incidents, and never push either".
 *
 * WHY A MATRIX AND NOT THREE LISTS
 *
 * Three tabs of toggles hides the comparison that people are actually
 * making. The whole reason to open this screen is to see, at a glance, that
 * everything is going to email and nothing is going to Slack. A grid shows
 * that in one look; tabs require remembering the previous tab.
 *
 * THE COLUMN THAT IS NOT A CHANNEL
 *
 * "Required" rows exist in every real product — password resets, receipts,
 * security notices — and are the single most common source of a broken
 * preferences screen, because a toggle rendered for something that cannot
 * be turned off is a lie. Those rows render a lock and a reason instead of
 * a disabled checkbox, which is the honest version of the same fact.
 *
 * ACCESSIBILITY: a real `<table>` with `<th>` on both axes, so each
 * checkbox is announced with its row and column rather than as one of
 * eighteen anonymous checkboxes. The column toggles are buttons that report
 * how many rows they will affect, and the whole grid is one `<fieldset>`
 * with a legend rather than a bare div.
 */

import * as React from 'react'
import { Bell, Lock, Mail, MessageSquare } from 'lucide-react'

export type NotificationChannel = 'email' | 'slack' | 'push'

export interface NotificationEvent {
  id: string
  label: string
  description: string
  /** Cannot be disabled, with the reason shown in place of the controls. */
  required?: boolean
  requiredReason?: string
  channels: Record<NotificationChannel, boolean>
}

export interface SettingsNotificationMatrixProps {
  events?: NotificationEvent[]
  className?: string
}

const CHANNELS: { id: NotificationChannel; label: string; Icon: typeof Mail }[] = [
  { id: 'email', label: 'Email', Icon: Mail },
  { id: 'slack', label: 'Slack', Icon: MessageSquare },
  { id: 'push', label: 'Push', Icon: Bell },
]

const DEFAULT_EVENTS: NotificationEvent[] = [
  {
    id: 'security',
    label: 'Security alerts',
    description: 'New sign-ins, password changes, recovery codes used.',
    required: true,
    requiredReason: 'Always sent by email — a security notice you can turn off is not one.',
    channels: { email: true, slack: false, push: true },
  },
  {
    id: 'billing',
    label: 'Billing and receipts',
    description: 'Invoices, failed payments, plan changes.',
    required: true,
    requiredReason: 'Receipts are sent by email for tax and dispute records.',
    channels: { email: true, slack: false, push: false },
  },
  {
    id: 'incidents',
    label: 'Incidents',
    description: 'An alert rule fired, or a service is degraded.',
    channels: { email: false, slack: true, push: true },
  },
  {
    id: 'mentions',
    label: 'Mentions and replies',
    description: 'Someone named you in a comment or thread.',
    channels: { email: true, slack: true, push: false },
  },
  {
    id: 'weekly',
    label: 'Weekly summary',
    description: 'One digest of the week, sent Monday morning.',
    channels: { email: true, slack: false, push: false },
  },
  {
    id: 'product',
    label: 'Product updates',
    description: 'New features and changelog highlights.',
    channels: { email: false, slack: false, push: false },
  },
]

export function SettingsNotificationMatrix({
  events = DEFAULT_EVENTS,
  className = '',
}: SettingsNotificationMatrixProps) {
  const [state, setState] = React.useState(events)

  const optional = state.filter((event) => !event.required)

  function toggle(eventId: string, channel: NotificationChannel) {
    setState((current) =>
      current.map((event) =>
        event.id === eventId
          ? { ...event, channels: { ...event.channels, [channel]: !event.channels[channel] } }
          : event,
      ),
    )
  }

  /** Column header toggle — all on unless they already all are. */
  function toggleColumn(channel: NotificationChannel) {
    const allOn = optional.every((event) => event.channels[channel])
    setState((current) =>
      current.map((event) =>
        event.required
          ? event
          : { ...event, channels: { ...event.channels, [channel]: !allOn } },
      ),
    )
  }

  return (
    <section
      className={`rounded-2xl border border-border bg-card text-card-foreground ${className}`}
    >
      <fieldset className="p-5 sm:p-6">
        <legend className="text-base font-semibold">Notifications</legend>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose where each kind of message goes. Changes save as you make them.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-2.5 pr-4 font-semibold">
                  Event
                </th>
                {CHANNELS.map(({ id, label, Icon }) => {
                  const on = optional.filter((event) => event.channels[id]).length
                  return (
                    <th key={id} scope="col" className="px-3 py-2.5 text-center font-semibold">
                      <button
                        type="button"
                        onClick={() => toggleColumn(id)}
                        className="mx-auto flex flex-col items-center gap-1 rounded-lg px-2 py-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Icon aria-hidden className="h-4 w-4 text-muted-foreground" />
                        {label}
                        <span className="text-[11px] font-normal text-muted-foreground">
                          {on}/{optional.length}
                        </span>
                        <span className="sr-only">
                          Toggle {label} for all {optional.length} optional events
                        </span>
                      </button>
                    </th>
                  )
                })}
              </tr>
            </thead>

            <tbody>
              {state.map((event) => (
                <tr key={event.id} className="border-b border-border/60 last:border-0">
                  <th scope="row" className="max-w-xs py-3.5 pr-4 font-medium">
                    {event.label}
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                      {event.description}
                    </span>
                  </th>

                  {event.required ? (
                    /*
                      One cell spanning the row rather than three disabled
                      checkboxes. A greyed-out control still reads as
                      "something I could turn on if I upgraded"; a sentence
                      reads as the policy it is.
                    */
                    <td colSpan={CHANNELS.length} className="px-3 py-3.5">
                      <span className="flex items-center justify-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                        <Lock aria-hidden className="h-3.5 w-3.5 shrink-0" />
                        {event.requiredReason}
                      </span>
                    </td>
                  ) : (
                    CHANNELS.map(({ id, label }) => (
                      <td key={id} className="px-3 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={event.channels[id]}
                          onChange={() => toggle(event.id, id)}
                          aria-label={`${event.label} via ${label}`}
                          className="h-4 w-4 accent-primary"
                        />
                      </td>
                    ))
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>
    </section>
  )
}
