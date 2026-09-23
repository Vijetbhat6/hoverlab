'use client'

/**
 * <SupportChatWidget> — the bubble in the corner, and what it owes you.
 *
 * The support launcher is the most-shipped and least-designed component on the
 * web. The default version pops open unprompted, promises a reply in "a few
 * minutes" at 23:00 on a Sunday, and covers the checkout button on a phone.
 *
 * FOUR THINGS THIS ONE DOES DIFFERENTLY
 *
 *  - **It states real availability, in the visitor's terms.** Either an agent
 *    is online and the wait is a number, or nobody is and the honest offer is
 *    a message that gets answered in the morning. "We typically reply in a few
 *    minutes" outside working hours is the lie that turns one contact into
 *    three.
 *  - **It offers self-service before the form.** Three suggested articles
 *    drawn from the current page. Most contacts are a question with a
 *    published answer, and deflecting them is worth more than any routing.
 *  - **It never opens itself.** No proactive invitation, no timer. The
 *    launcher is a button, and a button is enough.
 *  - **It is dismissible for the session.** The bubble covers something on
 *    every mobile layout ever built, and there has to be a way to make it go
 *    away that is not "leave the site".
 *
 * WHY THE PANEL IS ANCHORED WITH `end-` AND NOT `right-`
 *
 * A launcher pinned to the physical right sits over the start of the text in
 * Arabic and Hebrew, exactly where the eye begins. Logical properties put it
 * in the trailing corner in both directions. The whole widget uses `end-4`
 * for that reason and the catalog's RTL check enforces it.
 *
 * ACCESSIBILITY: the launcher carries an accessible name that includes the
 * unread count; the panel is `role="dialog"` named by its heading; the
 * transcript is a `role="log"` with `aria-live="polite"`, so a new agent
 * message is announced without the composer losing focus; Escape closes the
 * panel and returns focus to the launcher, which is the part hand-rolled
 * widgets almost always miss.
 */

import * as React from 'react'
import { BookOpen, Clock, MessageCircle, Send, X } from 'lucide-react'

export interface SuggestedArticle {
  id: string
  title: string
  minutes: number
}

export interface WidgetMessage {
  id: string
  from: 'agent' | 'you'
  body: string
  at: string
}

export interface SupportChatWidgetProps {
  online?: boolean
  waitMinutes?: number
  articles?: SuggestedArticle[]
  messages?: WidgetMessage[]
  unread?: number
  className?: string
}

const DEFAULT_ARTICLES: SuggestedArticle[] = [
  { id: 'a1', title: 'Why my discount code was refused at checkout', minutes: 2 },
  { id: 'a2', title: 'Changing the delivery address after ordering', minutes: 1 },
  { id: 'a3', title: 'What happens if nobody is in for the delivery', minutes: 3 },
]

const DEFAULT_MESSAGES: WidgetMessage[] = [
  {
    id: 'm1',
    from: 'agent',
    body: 'Hi — Priya here. I can see order ORD-88410. What went wrong with it?',
    at: '14:02',
  },
  {
    id: 'm2',
    from: 'you',
    body: 'The second chair arrived with a cracked base plate.',
    at: '14:03',
  },
  {
    id: 'm3',
    from: 'agent',
    body: 'Sorry about that. I can send a replacement base plate today, or swap the whole chair — the plate is a ten-minute job with the allen key in the box. Which suits you?',
    at: '14:04',
  },
]

export function SupportChatWidget({
  online = true,
  waitMinutes = 3,
  articles = DEFAULT_ARTICLES,
  messages = DEFAULT_MESSAGES,
  unread = 1,
  className = '',
}: SupportChatWidgetProps) {
  const uid = React.useId()
  const [open, setOpen] = React.useState(true)
  const [dismissed, setDismissed] = React.useState(false)
  const [draft, setDraft] = React.useState('')
  const [thread, setThread] = React.useState(messages)
  const launcherRef = React.useRef<HTMLButtonElement>(null)

  function close() {
    setOpen(false)
    // Returning focus is the part hand-rolled widgets miss.
    window.requestAnimationFrame(() => launcherRef.current?.focus())
  }

  function send(event: React.FormEvent) {
    event.preventDefault()
    if (!draft.trim()) return
    setThread((t) => [
      ...t,
      { id: `m${t.length + 1}`, from: 'you', body: draft.trim(), at: '14:06' },
    ])
    setDraft('')
  }

  return (
    <section
      className={`relative min-h-[34rem] overflow-hidden bg-muted/30 p-4 sm:p-6 ${className}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) close()
      }}
    >
      {/* Stand-in for the page the widget sits over. */}
      <div aria-hidden className="mx-auto max-w-2xl space-y-3">
        <div className="h-7 w-48 rounded bg-muted border border-transparent" />
        <div className="h-3 w-full rounded bg-muted border border-transparent" />
        <div className="h-3 w-5/6 rounded bg-muted border border-transparent" />
        <div className="h-3 w-2/3 rounded bg-muted border border-transparent" />
      </div>

      {/* end-4, not right-4 — see the docblock. */}
      <div className="absolute bottom-4 end-4 flex flex-col items-end gap-3">
        {open ? (
          <div
            id={`${uid}-panel`}
            role="dialog"
            aria-labelledby={`${uid}-title`}
            className="flex h-[26rem] w-[min(22rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-lg"
          >
            <header className="flex items-start justify-between gap-3 border-b border-border p-4">
              <div>
                <h2 id={`${uid}-title`} className="text-sm font-semibold">
                  Support
                </h2>
                {/* Real availability, not a stock reassurance. */}
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    aria-hidden
                    className={`h-2 w-2 rounded-full border border-transparent ${
                      online ? 'bg-emerald-500' : 'bg-muted-foreground'
                    }`}
                  />
                  {online
                    ? `Someone is here — about ${waitMinutes} min to a first reply`
                    : 'Nobody is on until 08:00 CET. Leave a message and it is answered first thing.'}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close support"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </header>

            {/* Deflection before the form. */}
            <div className="border-b border-border bg-muted/40 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold">
                <BookOpen aria-hidden className="h-3.5 w-3.5 text-primary" />
                Answers for this page
              </p>
              <ul className="mt-2 space-y-1">
                {articles.map((article) => (
                  <li key={article.id}>
                    <a
                      href="#"
                      className="flex items-start justify-between gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="min-w-0">{article.title}</span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-muted-foreground">
                        <Clock aria-hidden className="h-3 w-3" />
                        {article.minutes} min
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div
              role="log"
              aria-live="polite"
              aria-label="Conversation"
              className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3"
            >
              {thread.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.from === 'you' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
                      message.from === 'you'
                        ? 'rounded-ee-sm bg-primary text-primary-foreground'
                        : 'rounded-es-sm bg-muted text-foreground'
                    }`}
                  >
                    <p>{message.body}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        message.from === 'you'
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {message.from === 'you' ? 'You' : 'Priya'} · {message.at}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={send} className="flex items-center gap-2 border-t border-border p-3">
              <label htmlFor={`${uid}-draft`} className="sr-only">
                Write a message
              </label>
              <input
                id={`${uid}-draft`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={online ? 'Type a message' : 'Leave a message'}
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
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
        ) : null}

        {dismissed ? (
          <p className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            Hidden for this session.{' '}
            <button
              type="button"
              onClick={() => setDismissed(false)}
              className="font-semibold text-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Bring it back
            </button>
          </p>
        ) : (
          <div className="flex items-center gap-2">
            {/* There has to be a way to make it go away. */}
            {!open ? (
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Hide
              </button>
            ) : null}
            <button
              ref={launcherRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls={`${uid}-panel`}
              className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <MessageCircle aria-hidden className="h-5 w-5" />
              <span className="sr-only">
                {open ? 'Close support' : 'Open support'}
                {!open && unread > 0 ? `, ${unread} unread` : ''}
              </span>
              {!open && unread > 0 ? (
                <span
                  aria-hidden
                  className="absolute -top-0.5 end-0 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground"
                >
                  {unread}
                </span>
              ) : null}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
