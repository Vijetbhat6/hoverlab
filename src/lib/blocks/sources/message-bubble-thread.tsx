'use client'

/**
 * <MessageBubbleThread> — the bubbles, done properly once.
 *
 * `chat-thread-panel` in this catalog is an *assistant* thread: one human, one
 * model, no delivery state, no identity to establish. This is the human-to-
 * human version, and the differences are not cosmetic.
 *
 * WHAT A HUMAN THREAD NEEDS THAT AN ASSISTANT THREAD DOES NOT
 *
 *  - **Delivery state per message.** Sending, sent, delivered, read, failed.
 *    A message that silently failed is the worst outcome in any messaging
 *    product, and the failed state needs a retry on the bubble itself rather
 *    than a toast that scrolls away.
 *  - **Grouping by author and time.** Consecutive messages from one person
 *    within a few minutes share an avatar and a timestamp. Repeating them per
 *    bubble is what makes a hand-built thread look wrong in a way people
 *    cannot name.
 *  - **Day separators.** Absolute dates between days, relative times within
 *    them. A thread of bare "09:14" stamps is unreadable after a week.
 *  - **A reply quote.** Threads fork; the quoted parent is how a reply to a
 *    message from four screens ago makes sense at all.
 *
 * THE CORNER RADII CARRY THE DIRECTION
 *
 * `rounded-ee-sm` on your own bubbles and `rounded-es-sm` on theirs — logical
 * corners, so the tail sits on the correct side in Arabic and Hebrew without a
 * second rule. A thread built with `rounded-br-sm` has both tails on the same
 * side in RTL, which reads as everyone talking to themselves.
 *
 * ACCESSIBILITY: the thread is a `role="log"` with `aria-live="polite"`, so a
 * new message is announced without dragging focus out of the composer; each
 * bubble is an `<article>` with a visually hidden author-and-time line, since
 * an avatar and an alignment are not information to a screen reader; delivery
 * state is a word, not a tick glyph alone.
 */

import * as React from 'react'
import { Check, CheckCheck, Clock, RotateCcw, Send, TriangleAlert } from 'lucide-react'

export type Delivery = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface ThreadMessage {
  id: string
  author: string
  initials: string
  mine?: boolean
  body: string
  at: string
  /** Absolute day label. A change from the previous message inserts a rule. */
  day: string
  delivery?: Delivery
  /** Quoted parent, for a reply that would otherwise make no sense. */
  replyTo?: { author: string; body: string }
}

export interface MessageBubbleThreadProps {
  messages?: ThreadMessage[]
  className?: string
}

const DEFAULT_MESSAGES: ThreadMessage[] = [
  {
    id: '1',
    author: 'Priya Raman',
    initials: 'PR',
    day: 'Thursday 11 September',
    at: '16:41',
    body: 'The Rotterdam bay is booked out until Tuesday. Do you want me to split the delivery?',
  },
  {
    id: '2',
    author: 'Priya Raman',
    initials: 'PR',
    day: 'Thursday 11 September',
    at: '16:41',
    body: 'Half now, half when the bay frees up. No extra charge either way.',
  },
  {
    id: '3',
    author: 'You',
    initials: 'YU',
    mine: true,
    day: 'Thursday 11 September',
    at: '17:02',
    body: 'Split it. The chairs are the urgent half.',
    delivery: 'read',
  },
  {
    id: '4',
    author: 'Priya Raman',
    initials: 'PR',
    day: 'Friday 12 September',
    at: '09:14',
    body: 'Chairs are on the 07:00 run Monday. I moved the desks to Wednesday.',
    replyTo: { author: 'You', body: 'Split it. The chairs are the urgent half.' },
  },
  {
    id: '5',
    author: 'You',
    initials: 'YU',
    mine: true,
    day: 'Friday 12 September',
    at: '09:20',
    body: 'Perfect. Can you put the reference on the paperwork this time?',
    delivery: 'delivered',
  },
  {
    id: '6',
    author: 'You',
    initials: 'YU',
    mine: true,
    day: 'Friday 12 September',
    at: '09:21',
    body: 'ORD-88410, in case it helps.',
    delivery: 'failed',
  },
]

const DELIVERY_LABEL: Record<Delivery, string> = {
  sending: 'Sending',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Not sent',
}

function DeliveryMark({ state }: { state: Delivery }) {
  const Icon =
    state === 'sending'
      ? Clock
      : state === 'failed'
        ? TriangleAlert
        : state === 'sent'
          ? Check
          : CheckCheck
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] ${
        state === 'failed'
          ? 'text-destructive'
          : state === 'read'
            ? 'text-primary-foreground/90'
            : 'text-primary-foreground/70'
      }`}
    >
      <Icon aria-hidden className="h-3 w-3" />
      {/* A word, not a tick glyph alone. */}
      {DELIVERY_LABEL[state]}
    </span>
  )
}

export function MessageBubbleThread({
  messages = DEFAULT_MESSAGES,
  className = '',
}: MessageBubbleThreadProps) {
  const uid = React.useId()
  const [thread, setThread] = React.useState(messages)
  const [draft, setDraft] = React.useState('')

  function retry(id: string) {
    setThread((t) =>
      t.map((m) => (m.id === id ? { ...m, delivery: 'sending' as Delivery } : m)),
    )
    window.setTimeout(() => {
      setThread((t) => t.map((m) => (m.id === id ? { ...m, delivery: 'sent' as Delivery } : m)))
    }, 800)
  }

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
        day: 'Friday 12 September',
        at: '09:24',
        body: draft.trim(),
        delivery: 'sent',
      },
    ])
    setDraft('')
  }

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <div className="mx-auto flex h-[34rem] max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card">
        <header className="flex items-center gap-3 border-b border-border p-4">
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary"
          >
            PR
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">Priya Raman</h2>
            <p className="text-xs text-muted-foreground">Northwind logistics · online</p>
          </div>
        </header>

        <div
          role="log"
          aria-live="polite"
          aria-label="Messages"
          className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4"
        >
          {thread.map((message, index) => {
            const previous = thread[index - 1]
            const newDay = previous?.day !== message.day
            // Grouped by author within a day — the detail that makes a
            // hand-built thread look wrong when it is missing.
            const grouped = !newDay && previous?.author === message.author
            return (
              <React.Fragment key={message.id}>
                {newDay ? (
                  <div className="flex items-center gap-3 py-3">
                    <span aria-hidden className="h-px flex-1 bg-border" />
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {message.day}
                    </span>
                    <span aria-hidden className="h-px flex-1 bg-border" />
                  </div>
                ) : null}

                <article
                  className={`flex gap-2 ${message.mine ? 'justify-end' : 'justify-start'} ${
                    grouped ? '' : 'pt-2'
                  }`}
                >
                  {!message.mine ? (
                    <span
                      aria-hidden
                      className={`mt-auto grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                        grouped ? 'invisible' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {message.initials}
                    </span>
                  ) : null}

                  <div className={`max-w-[78%] ${message.mine ? 'items-end' : ''}`}>
                    {/* An avatar and an alignment are not information. */}
                    <p className="sr-only">
                      {message.author}, {message.at}
                    </p>

                    {message.replyTo ? (
                      <blockquote className="mb-1 rounded-lg border-s-2 border-primary/50 bg-muted/60 px-2 py-1 text-[11px] text-muted-foreground">
                        <span className="font-semibold">{message.replyTo.author}:</span>{' '}
                        {message.replyTo.body}
                      </blockquote>
                    ) : null}

                    <div
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        message.mine
                          ? 'rounded-ee-sm bg-primary text-primary-foreground'
                          : 'rounded-es-sm bg-muted text-foreground'
                      }`}
                    >
                      <p>{message.body}</p>
                      <p
                        className={`mt-1 flex items-center gap-2 text-[10px] ${
                          message.mine
                            ? 'justify-end text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}
                      >
                        <span aria-hidden>{message.at}</span>
                        {message.delivery ? <DeliveryMark state={message.delivery} /> : null}
                      </p>
                    </div>

                    {/* Retry on the bubble, not in a toast that scrolls away. */}
                    {message.delivery === 'failed' ? (
                      <p className="mt-1 flex items-center justify-end gap-1.5 text-[11px] text-destructive">
                        Could not send.
                        <button
                          type="button"
                          onClick={() => retry(message.id)}
                          className="inline-flex items-center gap-1 rounded font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <RotateCcw aria-hidden className="h-3 w-3" />
                          Retry
                        </button>
                      </p>
                    ) : null}
                  </div>
                </article>
              </React.Fragment>
            )
          })}
        </div>

        <form onSubmit={send} className="flex items-center gap-2 border-t border-border p-3">
          <label htmlFor={`${uid}-draft`} className="sr-only">
            Write a message
          </label>
          <input
            id={`${uid}-draft`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message Priya"
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send message"
            className="rounded-lg bg-primary p-2 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Send aria-hidden className="h-4 w-4 rtl:rotate-180" />
          </button>
        </form>
      </div>
    </section>
  )
}
