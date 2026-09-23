'use client'

/**
 * <SidebarThreadHistory> — the chat-history sidebar an assistant product
 * lives in: a New chat button, conversations grouped by recency, and a pin
 * control on each row.
 *
 *  - Grouped by recency under real headings, each list labelled by its
 *    heading, so a long history is navigable by heading and not a wall of
 *    same-looking rows.
 *  - The pin button is a toggle: `aria-pressed`, and a name that says which
 *    conversation ("Pin Quarterly report summary"). A row of identical "Pin"
 *    buttons is unusable by ear.
 *  - The pin control is hidden until hover or focus to keep the list calm, but
 *    never on a device that cannot hover — `hover: none` shows it always, or a
 *    touch user could never pin anything — and never on the keyboard: focus
 *    inside the row reveals it.
 *  - Pinning is announced through a `role="status"` line, since the row jumps
 *    to another group and a screen reader would otherwise hear nothing.
 *  - Titles truncate with `min-w-0`; the full title stays in the accessible
 *    name because truncation is only visual.
 */

import * as React from 'react'
import { Plus, Pin, MessageSquare } from 'lucide-react'

export interface Thread {
  id: string
  title: string
  group: 'Today' | 'Yesterday' | 'Previous 7 days'
  pinned?: boolean
}

export interface SidebarThreadHistoryProps {
  threads?: Thread[]
  defaultActiveId?: string
  onNewChat?: () => void
  children?: React.ReactNode
  className?: string
}

const DEFAULT_THREADS: Thread[] = [
  { id: 't1', title: 'Quarterly report summary', group: 'Today' },
  { id: 't2', title: 'Refactor the billing webhook handler', group: 'Today' },
  { id: 't3', title: 'Trip plan: Lisbon in October', group: 'Yesterday', pinned: true },
  { id: 't4', title: 'Explain CRDTs like I am new to them', group: 'Yesterday' },
  { id: 't5', title: 'Cold email to a design agency', group: 'Previous 7 days' },
  { id: 't6', title: 'SQL: cohort retention by week', group: 'Previous 7 days' },
  { id: 't7', title: 'Naming ideas for the mobile app', group: 'Previous 7 days' },
]

const ORDER: Array<Thread['group'] | 'Pinned'> = ['Pinned', 'Today', 'Yesterday', 'Previous 7 days']

export function SidebarThreadHistory({
  threads: initial = DEFAULT_THREADS,
  defaultActiveId = 't2',
  onNewChat,
  children,
  className = '',
}: SidebarThreadHistoryProps) {
  const uid = React.useId()
  const [threads, setThreads] = React.useState(initial)
  const [activeId, setActiveId] = React.useState(defaultActiveId)
  const [announcement, setAnnouncement] = React.useState('')

  const togglePin = (id: string) => {
    const t = threads.find((x) => x.id === id)
    if (!t) return
    setThreads((prev) => prev.map((x) => (x.id === id ? { ...x, pinned: !x.pinned } : x)))
    setAnnouncement(`${t.pinned ? 'Unpinned' : 'Pinned'} ${t.title}`)
  }

  const groups = ORDER.map((name) => ({
    name,
    rows: threads.filter((t) => (name === 'Pinned' ? t.pinned : !t.pinned && t.group === name)),
  })).filter((g) => g.rows.length > 0)

  return (
    <div
      className={`flex h-[32rem] overflow-hidden rounded-2xl border border-border/60 bg-background ${className}`}
    >
      <aside
        aria-label="Chat history"
        className="relative flex w-64 shrink-0 flex-col border-e border-border/60 bg-card/40"
      >
        <div className="p-3">
          <button
            type="button"
            onClick={onNewChat}
            className="flex w-full items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <Plus aria-hidden className="h-4 w-4" />
            New chat
          </button>
        </div>

        <p role="status" className="sr-only">
          {announcement}
        </p>

        <nav aria-label="Conversations" className="flex-1 space-y-4 overflow-y-auto px-2 pb-3">
          {groups.map((group, gi) => {
            const headingId = `${uid}-g${gi}`
            return (
              <div key={group.name}>
                <h2
                  id={headingId}
                  className="flex items-center gap-1.5 px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {group.name === 'Pinned' ? <Pin aria-hidden className="h-3 w-3" /> : null}
                  {group.name}
                </h2>
                <ul aria-labelledby={headingId} className="space-y-0.5">
                  {group.rows.map((t) => {
                    const active = t.id === activeId
                    return (
                      <li
                        key={t.id}
                        className={`group relative flex items-center rounded-xl transition-colors ${
                          active ? 'bg-muted' : 'hover:bg-muted/60'
                        }`}
                      >
                        <a
                          href="#"
                          aria-current={active ? 'page' : undefined}
                          onClick={(e) => {
                            e.preventDefault()
                            setActiveId(t.id)
                          }}
                          className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-xl py-2 ps-3 pe-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            active ? 'font-medium text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                          }`}
                        >
                          <MessageSquare aria-hidden className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{t.title}</span>
                        </a>
                        <button
                          type="button"
                          aria-pressed={!!t.pinned}
                          aria-label={`Pin ${t.title}`}
                          onClick={() => togglePin(t.id)}
                          className={`absolute end-1.5 rounded-lg p-1.5 text-muted-foreground transition-opacity hover:bg-background hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100 ${
                            t.pinned ? 'text-primary opacity-100' : 'opacity-0'
                          }`}
                        >
                          <Pin aria-hidden className={`h-3.5 w-3.5 ${t.pinned ? 'fill-current' : ''}`} />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </nav>
      </aside>

      <main className="hidden min-w-0 flex-1 p-6 sm:block">
        {children ?? (
          <div className="flex min-h-full items-center justify-center rounded-xl border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
            <span className="min-w-0 truncate">
              {threads.find((t) => t.id === activeId)?.title ?? 'Start a new chat'}
            </span>
          </div>
        )}
      </main>
    </div>
  )
}
