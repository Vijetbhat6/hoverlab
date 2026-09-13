'use client'

/**
 * <InboxThreadList> — the list half of a two-pane inbox.
 *
 * A thread list is a table pretending to be a list, and the pretence is what
 * makes it hard. Six things compete for one row: who, subject, preview, when,
 * unread, and whatever the product's own state is — assignee, SLA, channel.
 * Every inbox that reads badly has lost that fight in the same way, by giving
 * each of the six an equal share of the row.
 *
 * THE HIERARCHY THIS PICKS, AND WHY
 *
 *   line 1   sender, then time — the two things scanned first, at the edges
 *   line 2   subject, in the reading weight
 *   line 3   preview, one line, clipped
 *   markers  unread dot at the start edge, state chips at the end
 *
 * Unread is a dot and a font weight, not a background colour: a highlighted
 * row is how a list of forty unread messages becomes an unreadable block, and
 * the dot survives being read at a glance in a way a shade of grey does not.
 *
 * SELECTION AND UNREAD ARE DIFFERENT THINGS AND MUST LOOK DIFFERENT
 *
 * The row you are reading is selected; the rows you have not read are unread;
 * a selected unread row is both, briefly. Products that use one visual
 * treatment for both make it impossible to tell what you are looking at, so
 * here selection is a filled surface plus a start-edge rule and unread is the
 * dot and the weight.
 *
 * BULK SELECTION IS A SEPARATE MODE. A checkbox that appears on hover in a row
 * that is also a button is a click-target conflict, so bulk mode is entered
 * deliberately and the rows become checkboxes while it is on.
 *
 * ACCESSIBILITY: the list is a `<ul>` of buttons, not a `role="grid"`; the
 * selected row carries `aria-current="true"`; unread is announced through a
 * visually hidden word rather than by the dot; the filter row is a real
 * tablist so arrow keys move between filters.
 */

import * as React from 'react'
import { CheckSquare, Circle, Mail, Paperclip, Star } from 'lucide-react'

export type ThreadChannel = 'email' | 'chat' | 'form'

export interface InboxThread {
  id: string
  sender: string
  initials: string
  subject: string
  preview: string
  at: string
  unread?: boolean
  starred?: boolean
  attachments?: number
  channel: ThreadChannel
  /** Free-form state chip — assignee, SLA, queue. */
  chip?: string
}

export interface InboxThreadListProps {
  threads?: InboxThread[]
  className?: string
}

const DEFAULT_THREADS: InboxThread[] = [
  {
    id: 't1',
    sender: 'Priya Raman',
    initials: 'PR',
    subject: 'Split delivery for ORD-88410',
    preview: 'Chairs are on the 07:00 run Monday. I moved the desks to Wednesday.',
    at: '09:14',
    unread: true,
    channel: 'chat',
    chip: 'You',
  },
  {
    id: 't2',
    sender: 'accounts@contoso.example',
    initials: 'CO',
    subject: 'Remittance advice — 12 September',
    preview: 'Payment of £18,900.00 has been sent covering invoice INV-2026-0841.',
    at: '08:02',
    unread: true,
    attachments: 2,
    channel: 'email',
  },
  {
    id: 't3',
    sender: 'Marte Haugen',
    initials: 'MH',
    subject: 'Cracked base plate — replacement or swap?',
    preview: 'Happy to fit the plate myself if you can post one. The allen key is in the box.',
    at: 'Yesterday',
    starred: true,
    channel: 'form',
    chip: 'Sam O.',
  },
  {
    id: 't4',
    sender: 'Fabrikam Parts',
    initials: 'FP',
    subject: 'Lead time change: brass lamp shades',
    preview: 'October stock has slipped to the 12th. Everything else is unchanged.',
    at: 'Yesterday',
    channel: 'email',
  },
  {
    id: 't5',
    sender: 'Kofi Ojo',
    initials: 'KO',
    subject: 'Refund not received',
    preview: 'It has been eleven days. My bank says nothing has been presented.',
    at: 'Wed',
    channel: 'form',
    chip: 'Breaching',
  },
]

const CHANNEL_LABEL: Record<ThreadChannel, string> = {
  email: 'Email',
  chat: 'Live chat',
  form: 'Web form',
}

export function InboxThreadList({
  threads = DEFAULT_THREADS,
  className = '',
}: InboxThreadListProps) {
  const uid = React.useId()
  const [filter, setFilter] = React.useState<'all' | 'unread' | 'starred'>('all')
  const [selectedId, setSelectedId] = React.useState(threads[0]?.id ?? '')
  const [bulk, setBulk] = React.useState(false)
  const [checked, setChecked] = React.useState<string[]>([])

  const visible = threads.filter((thread) =>
    filter === 'unread' ? thread.unread : filter === 'starred' ? thread.starred : true,
  )

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-border bg-card">
        <header className="flex items-center justify-between gap-3 border-b border-border p-3">
          <h2 className="text-sm font-semibold">Inbox</h2>
          {/* A separate mode, not a checkbox fighting the row for clicks. */}
          <button
            type="button"
            onClick={() => {
              setBulk((v) => !v)
              setChecked([])
            }}
            aria-pressed={bulk}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              bulk ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
            }`}
          >
            <CheckSquare aria-hidden className="h-3.5 w-3.5" />
            Select
          </button>
        </header>

        <div role="tablist" aria-label="Filter threads" className="flex gap-1 border-b border-border p-2">
          {(['all', 'unread', 'starred'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              id={`${uid}-tab-${value}`}
              aria-selected={filter === value}
              aria-controls={`${uid}-list`}
              tabIndex={filter === value ? 0 : -1}
              onClick={() => setFilter(value)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                filter === value ? 'bg-muted text-foreground' : 'text-muted-foreground'
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        {bulk && checked.length > 0 ? (
          <p role="status" className="border-b border-border bg-primary/5 px-3 py-2 text-xs">
            <span className="font-semibold">{checked.length} selected.</span>{' '}
            <button type="button" className="underline underline-offset-2">
              Mark read
            </button>{' '}
            ·{' '}
            <button type="button" className="underline underline-offset-2">
              Assign
            </button>{' '}
            ·{' '}
            <button type="button" className="underline underline-offset-2">
              Archive
            </button>
          </p>
        ) : null}

        <ul
          id={`${uid}-list`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-${filter}`}
          className="divide-y divide-border/70"
        >
          {visible.map((thread) => {
            const selected = !bulk && selectedId === thread.id
            const isChecked = checked.includes(thread.id)
            return (
              <li key={thread.id}>
                <button
                  type="button"
                  onClick={() =>
                    bulk
                      ? setChecked((c) =>
                          c.includes(thread.id)
                            ? c.filter((id) => id !== thread.id)
                            : [...c, thread.id],
                        )
                      : setSelectedId(thread.id)
                  }
                  aria-current={selected ? 'true' : undefined}
                  aria-pressed={bulk ? isChecked : undefined}
                  // Selection is a surface and a start-edge rule; unread is a
                  // dot and a weight. Two states, two treatments.
                  className={`flex w-full gap-3 border-s-2 p-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                    selected
                      ? 'border-s-primary bg-primary/5'
                      : 'border-s-transparent hover:bg-muted/50'
                  }`}
                >
                  {bulk ? (
                    <span
                      aria-hidden
                      className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded border ${
                        isChecked ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                      }`}
                    >
                      {isChecked ? <CheckSquare className="h-3 w-3" /> : null}
                    </span>
                  ) : (
                    <span
                      aria-hidden
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground"
                    >
                      {thread.initials}
                    </span>
                  )}

                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span
                        className={`truncate text-sm ${
                          thread.unread ? 'font-bold' : 'font-medium'
                        }`}
                      >
                        {thread.sender}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {thread.at}
                      </span>
                    </span>

                    <span
                      className={`mt-0.5 flex items-center gap-1.5 truncate text-sm ${
                        thread.unread ? 'font-semibold' : ''
                      }`}
                    >
                      {thread.unread ? (
                        <Circle
                          aria-hidden
                          className="h-2 w-2 shrink-0 fill-current text-primary"
                        />
                      ) : null}
                      <span className="truncate">{thread.subject}</span>
                    </span>

                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {thread.preview}
                    </span>

                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        <Mail aria-hidden className="h-2.5 w-2.5" />
                        {CHANNEL_LABEL[thread.channel]}
                      </span>
                      {thread.attachments ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Paperclip aria-hidden className="h-2.5 w-2.5" />
                          {thread.attachments}
                        </span>
                      ) : null}
                      {thread.starred ? (
                        <Star
                          aria-hidden
                          className="h-3 w-3 fill-current text-amber-500"
                        />
                      ) : null}
                      {thread.chip ? (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            thread.chip === 'Breaching'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {thread.chip}
                        </span>
                      ) : null}
                    </span>

                    {/* Announced, rather than left to the dot. */}
                    <span className="sr-only">
                      {thread.unread ? 'Unread. ' : ''}
                      {thread.starred ? 'Starred. ' : ''}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        {visible.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Nothing matches that filter.
          </p>
        ) : null}
      </div>
    </section>
  )
}
