'use client'

/**
 * <InboxThreadDetail> — the reading pane, and the reply that goes with it.
 *
 * The other half of `inbox-thread-list`. Reading a thread and answering it are
 * one task, and splitting them across a page transition is how a support
 * queue gets slow — so the composer lives at the foot of the pane and is
 * always there, never behind a Reply button that scrolls the message away.
 *
 * QUOTED HISTORY IS COLLAPSED BY DEFAULT AND SAYS HOW MUCH
 *
 * Email threads accumulate. The pane shows the messages and hides the quoted
 * copy of the previous message inside each one behind a control that names its
 * size — "3 earlier replies, quoted" — rather than a bare ellipsis. An
 * ellipsis makes people expand everything to find out; a count lets them
 * decide.
 *
 * THE INTERNAL NOTE IS A DIFFERENT COLOUR AND SAYS SO IN WORDS
 *
 * The single most expensive mistake in a shared inbox is sending an internal
 * note to the customer. Colour alone does not prevent it — colour-blind users,
 * tired users, a screenshot in a ticket. So the composer's mode is a real
 * control, the note surface is visibly different, and the send button changes
 * its label to name the recipient: "Send to Marte" versus "Save internal note".
 *
 * THE HEADER CARRIES THE OPERATIONAL FACTS, NOT JUST THE SUBJECT. Who it is
 * assigned to, which channel it came from, and how long it has been open. A
 * reading pane whose header is only a subject line makes the agent go back to
 * the list to answer "is this mine".
 *
 * ACCESSIBILITY: the pane is a labelled region so it can be jumped to; each
 * message is an `<article>` with a real heading; the quoted-history control is
 * a disclosure carrying both `aria-expanded` and `aria-controls`, because the
 * catalog's audit flags the first without the second; the composer mode is a
 * radio group, not two buttons that look like tabs.
 */

import * as React from 'react'
import { ChevronDown, Clock, Lock, Reply, Send, User } from 'lucide-react'

export interface ThreadEntry {
  id: string
  author: string
  initials: string
  role: 'customer' | 'agent' | 'note'
  at: string
  body: string
  /** Quoted earlier replies, collapsed with a count. */
  quotedCount?: number
  quoted?: string
}

export interface InboxThreadDetailProps {
  subject?: string
  assignee?: string
  channel?: string
  openFor?: string
  customer?: string
  entries?: ThreadEntry[]
  className?: string
}

const DEFAULT_ENTRIES: ThreadEntry[] = [
  {
    id: 'e1',
    author: 'Marte Haugen',
    initials: 'MH',
    role: 'customer',
    at: '11 Sep, 18:22',
    body:
      'The second chair arrived with a cracked base plate. Everything else is fine. I would rather fit a replacement plate myself than wait for a whole chair to be swapped.',
  },
  {
    id: 'e2',
    author: 'Sam Okafor',
    initials: 'SO',
    role: 'note',
    at: '12 Sep, 08:41',
    body:
      'Third cracked plate from the 08-2026 batch this month. Flagging to quality before we ship another one.',
  },
  {
    id: 'e3',
    author: 'Sam Okafor',
    initials: 'SO',
    role: 'agent',
    at: '12 Sep, 08:46',
    body:
      'Sorry about that — a plate is on its way and should reach you Monday. It is four M6 bolts under the seat pan; the allen key in the box fits. If it turns out to be more than that, we will swap the whole chair and collect the old one.',
    quotedCount: 1,
    quoted:
      'The second chair arrived with a cracked base plate. Everything else is fine.',
  },
  {
    id: 'e4',
    author: 'Marte Haugen',
    initials: 'MH',
    role: 'customer',
    at: '12 Sep, 09:03',
    body: 'Perfect, thank you. Does the warranty still stand if I fit it myself?',
  },
]

const ROLE_STYLE: Record<ThreadEntry['role'], string> = {
  customer: 'border-border bg-card',
  agent: 'border-primary/30 bg-primary/5',
  note: 'border-amber-500/40 bg-amber-500/5',
}

export function InboxThreadDetail({
  subject = 'Cracked base plate — replacement or swap?',
  assignee = 'Sam Okafor',
  channel = 'Web form',
  openFor = 'Open 18 hours',
  customer = 'Marte',
  entries = DEFAULT_ENTRIES,
  className = '',
}: InboxThreadDetailProps) {
  const uid = React.useId()
  const [expanded, setExpanded] = React.useState<string[]>([])
  const [mode, setMode] = React.useState<'reply' | 'note'>('reply')
  const [draft, setDraft] = React.useState('')

  function toggle(id: string) {
    setExpanded((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]))
  }

  return (
    <section
      aria-label="Thread"
      className={`bg-background px-4 py-10 sm:px-6 ${className}`}
    >
      <div className="mx-auto flex h-[38rem] max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card">
        {/* Operational facts, not just a subject line. */}
        <header className="border-b border-border p-4">
          <h2 className="text-base font-semibold">{subject}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 font-medium">
              <User aria-hidden className="h-3 w-3" />
              {assignee}
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 font-medium">
              {channel}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden className="h-3 w-3" />
              {openFor}
            </span>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {entries.map((entry) => {
            const open = expanded.includes(entry.id)
            return (
              <article
                key={entry.id}
                className={`rounded-xl border p-3 ${ROLE_STYLE[entry.role]}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground"
                  >
                    {entry.initials}
                  </span>
                  <h3 className="text-sm font-semibold">{entry.author}</h3>
                  {entry.role === 'note' ? (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      <Lock aria-hidden className="h-2.5 w-2.5" />
                      Internal only
                    </span>
                  ) : null}
                  <span className="ms-auto text-[11px] text-muted-foreground">
                    {entry.at}
                  </span>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">{entry.body}</p>

                {/* A count, not an ellipsis. */}
                {entry.quotedCount ? (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => toggle(entry.id)}
                      aria-expanded={open}
                      aria-controls={`${uid}-quoted-${entry.id}`}
                      className="inline-flex items-center gap-1 rounded text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ChevronDown
                        aria-hidden
                        className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
                      />
                      {entry.quotedCount} earlier{' '}
                      {entry.quotedCount === 1 ? 'reply' : 'replies'}, quoted
                    </button>
                    {open ? (
                      <blockquote
                        id={`${uid}-quoted-${entry.id}`}
                        className="mt-2 border-s-2 border-border ps-3 text-xs text-muted-foreground"
                      >
                        {entry.quoted}
                      </blockquote>
                    ) : null}
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>

        {/* Always there. Not behind a Reply button that scrolls the thread. */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setDraft('')
          }}
          className={`border-t border-border p-3 transition-colors ${
            mode === 'note' ? 'bg-amber-500/5' : ''
          }`}
        >
          <fieldset className="border-0 p-0">
            <legend className="sr-only">Where does this go?</legend>
            <div className="flex gap-1">
              {(
                [
                  { id: 'reply', label: 'Reply to customer', icon: Reply },
                  { id: 'note', label: 'Internal note', icon: Lock },
                ] as const
              ).map((option) => {
                const Icon = option.icon
                const on = mode === option.id
                return (
                  <div key={option.id}>
                    <input
                      type="radio"
                      id={`${uid}-mode-${option.id}`}
                      name={`${uid}-mode`}
                      checked={on}
                      onChange={() => setMode(option.id)}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={`${uid}-mode-${option.id}`}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${
                        on
                          ? option.id === 'note'
                            ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                            : 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon aria-hidden className="h-3.5 w-3.5 rtl:rotate-180" />
                      {option.label}
                    </label>
                  </div>
                )
              })}
            </div>
          </fieldset>

          <label htmlFor={`${uid}-draft`} className="sr-only">
            {mode === 'note' ? 'Write an internal note' : `Reply to ${customer}`}
          </label>
          <textarea
            id={`${uid}-draft`}
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              mode === 'note'
                ? 'Only your team sees this.'
                : `${customer} will receive this by email.`
            }
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
          />

          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">
              {mode === 'note'
                ? 'Never sent to the customer. Visible to everyone on the team.'
                : `Sent to ${customer} and added to the thread.`}
            </p>
            {/* The label names the recipient. Colour alone is not a guard. */}
            <button
              type="submit"
              disabled={!draft.trim()}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                mode === 'note'
                  ? 'bg-amber-600 text-white'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              {mode === 'note' ? (
                <Lock aria-hidden className="h-4 w-4" />
              ) : (
                <Send aria-hidden className="h-4 w-4 rtl:rotate-180" />
              )}
              {mode === 'note' ? 'Save internal note' : `Send to ${customer}`}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
