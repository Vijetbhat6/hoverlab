'use client'

/**
 * <NotificationInbox> — the bell panel: a filterable list with read state.
 *
 * A toast is for right now; this is for what you missed. The difference
 * drives every decision here — nothing auto-dismisses, everything is
 * scannable, and unread is a state you can act on rather than a colour
 * that fades.
 *
 * Worth keeping:
 *
 *  - The unread count is in the trigger's accessible name ("Notifications,
 *    3 unread"), not only in a badge. A number rendered in a coloured
 *    circle is invisible to a screen reader.
 *  - The filter is a `<fieldset>` of radios styled as a segmented control,
 *    so arrow keys move between All and Unread and the group announces as
 *    one control instead of three unrelated buttons.
 *  - Unread is marked by a dot *and* by `sr-only` text, never by colour
 *    alone.
 *  - Timestamps are `<time dateTime>` with a machine-readable value beside
 *    the human "2h ago", so the real time survives copy-paste and is
 *    available to assistive tech.
 *  - "Mark all read" is announced through a polite live region, because
 *    otherwise the only feedback is dots disappearing.
 */

import * as React from 'react'
import { Bell, CheckCheck, GitPullRequest, MessageSquare, TriangleAlert, UserPlus } from 'lucide-react'

export type NotificationKind = 'mention' | 'review' | 'alert' | 'invite'

export interface NotificationItem {
  id: string
  kind: NotificationKind
  actor: string
  text: string
  /** ISO timestamp — the `datetime` attribute value. */
  at: string
  /** Human relative label. Kept as data so this component stays dependency-free. */
  ago: string
  read?: boolean
  href?: string
}

export interface NotificationInboxProps {
  items?: NotificationItem[]
  emptyMessage?: string
  onMarkAllRead?: () => void
  className?: string
}

const KIND_ICON: Record<NotificationKind, typeof Bell> = {
  mention: MessageSquare,
  review: GitPullRequest,
  alert: TriangleAlert,
  invite: UserPlus,
}

const DEFAULT_ITEMS: NotificationItem[] = [
  {
    id: '1',
    kind: 'mention',
    actor: 'Ada Lovelace',
    text: 'mentioned you in “Q3 roadmap”',
    at: '2026-08-08T09:12:00Z',
    ago: '18m ago',
    href: '#',
  },
  {
    id: '2',
    kind: 'review',
    actor: 'Grace Hopper',
    text: 'requested your review on #482',
    at: '2026-08-08T07:40:00Z',
    ago: '2h ago',
    href: '#',
  },
  {
    id: '3',
    kind: 'alert',
    actor: 'System',
    text: 'Usage reached 80% of your monthly quota',
    at: '2026-08-07T22:05:00Z',
    ago: '11h ago',
    href: '#',
  },
  {
    id: '4',
    kind: 'invite',
    actor: 'Alan Turing',
    text: 'invited you to the Platform team',
    at: '2026-08-07T15:30:00Z',
    ago: '18h ago',
    read: true,
    href: '#',
  },
  {
    id: '5',
    kind: 'mention',
    actor: 'Katherine Johnson',
    text: 'replied to your comment on #470',
    at: '2026-08-06T11:02:00Z',
    ago: '2d ago',
    read: true,
    href: '#',
  },
]

type Filter = 'all' | 'unread'

export function NotificationInbox({
  items = DEFAULT_ITEMS,
  emptyMessage = 'Nothing unread. You are caught up.',
  onMarkAllRead,
  className = '',
}: NotificationInboxProps) {
  const [read, setRead] = React.useState<Set<string>>(
    () => new Set(items.filter((i) => i.read).map((i) => i.id)),
  )
  const [filter, setFilter] = React.useState<Filter>('all')
  const [announcement, setAnnouncement] = React.useState('')

  const unreadCount = items.filter((i) => !read.has(i.id)).length
  const shown = filter === 'unread' ? items.filter((i) => !read.has(i.id)) : items

  function markAllRead() {
    setRead(new Set(items.map((i) => i.id)))
    setAnnouncement('All notifications marked as read.')
    onMarkAllRead?.()
  }

  function toggleRead(id: string) {
    setRead((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className={`mx-auto w-full max-w-md ${className}`}>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-lg">
        {/* -- Header -------------------------------------------------- */}
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Bell aria-hidden className="h-4 w-4" />
            Notifications
            {/* The count is in the text, not only in the badge. */}
            <span className="sr-only">, {unreadCount} unread</span>
            {unreadCount > 0 ? (
              <span
                aria-hidden
                className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground"
              >
                {unreadCount}
              </span>
            ) : null}
          </h2>

          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
          >
            <CheckCheck aria-hidden className="h-3.5 w-3.5" />
            Mark all read
          </button>
        </div>

        {/* -- Filter: one radio group, not three loose buttons -------- */}
        <fieldset className="border-b border-border/60 px-4 py-2.5">
          <legend className="sr-only">Filter notifications</legend>
          <div className="inline-flex rounded-lg border border-border/60 p-0.5">
            {(['all', 'unread'] as const).map((value) => (
              <label
                key={value}
                className={`cursor-pointer rounded-md px-3 py-1 text-xs font-semibold capitalize transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring ${
                  filter === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                <input
                  type="radio"
                  name="notification-filter"
                  value={value}
                  checked={filter === value}
                  onChange={() => setFilter(value)}
                  className="sr-only"
                />
                {value}
                {value === 'unread' ? ` (${unreadCount})` : ''}
              </label>
            ))}
          </div>
        </fieldset>

        {/* -- List ---------------------------------------------------- */}
        {shown.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ul className="max-h-96 divide-y divide-border/60 overflow-y-auto">
            {shown.map((item) => {
              const Icon = KIND_ICON[item.kind]
              const isUnread = !read.has(item.id)
              return (
                <li key={item.id} className={isUnread ? 'bg-primary/[0.04]' : undefined}>
                  <div className="flex gap-3 px-4 py-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground">
                      <Icon aria-hidden className="h-4 w-4" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug">
                        <span className="font-semibold">{item.actor}</span>{' '}
                        <span className="text-muted-foreground">{item.text}</span>
                      </p>
                      <time dateTime={item.at} className="mt-0.5 block text-xs text-muted-foreground">
                        {item.ago}
                      </time>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleRead(item.id)}
                      className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {/* Dot plus text — never colour alone. */}
                      <span
                        aria-hidden
                        className={`h-2 w-2 rounded-full ${
                          isUnread ? 'bg-primary' : 'border border-border'
                        }`}
                      />
                      <span className="sr-only">
                        {isUnread ? 'Unread — mark as read' : 'Read — mark as unread'}
                      </span>
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Bulk actions have no visible feedback beyond dots vanishing. */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
