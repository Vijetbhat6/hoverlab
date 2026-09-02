/**
 * <ChatThreadPanel> — the conversation itself: a scrolling thread with a
 * composer pinned under it.
 *
 * The part every hand-rolled chat gets wrong is the announcement. A thread
 * is a log, so it wants `role="log"` with `aria-live="polite"` — new turns
 * are read when they arrive and the reader is not interrupted mid-sentence.
 * What it must NOT be is `aria-live="assertive"`, which is what most
 * examples reach for and which makes a screen reader talk over the user
 * while they are still typing the next message.
 *
 * `aria-relevant="additions"` matters just as much: without it, a streaming
 * assistant message re-announces the whole answer on every token, because
 * every token is a text mutation inside the live region. Restricting the
 * region to additions is the difference between "one new message" and the
 * same paragraph read forty times.
 *
 * The other half is scroll. Pinning to the bottom on every new message is
 * correct only while the user is already at the bottom; doing it
 * unconditionally yanks them out of the message they scrolled up to read.
 * `stuck` tracks that, and the jump-to-latest button appears when it is
 * false, which is the affordance the auto-scroll replaced.
 */

'use client'

import * as React from 'react'
import { ArrowDown, Bot, Copy, RefreshCw, Send, ThumbsDown, ThumbsUp, User } from 'lucide-react'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  /** Shown under an assistant turn, e.g. "Searched 3 sources · 1.4s". */
  meta?: string
}

export interface ChatThreadPanelProps {
  title?: string
  subtitle?: string
  messages?: ChatMessage[]
  placeholder?: string
  /**
   * Skip the mount-time scroll to the newest message. A thread previewing
   * itself inside a grid would otherwise scroll the host page to this card.
   */
  embedded?: boolean
  className?: string
}

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'Which of our regions missed their Q3 target, and by how much?',
  },
  {
    id: '2',
    role: 'assistant',
    content:
      'Two of the five missed. EMEA came in at 91% of target (−$412k) and APAC at 88% (−$260k). AMER, LATAM and ANZ all cleared, with LATAM the strongest at 118%. The EMEA gap is almost entirely one deal that slipped into October.',
    meta: 'Queried 2 tables · 1.4s',
  },
  {
    id: '3',
    role: 'user',
    content: 'Is that slipped deal still open?',
  },
  {
    id: '4',
    role: 'assistant',
    content:
      'Yes — it moved to Contracting on 4 October and is forecast to close this quarter. Booking it in Q3 would have put EMEA at 103%.',
    meta: 'Queried 1 table · 0.8s',
  },
]

export function ChatThreadPanel({
  title = 'Revenue assistant',
  subtitle = 'Connected to Warehouse · gpt-class model',
  messages = DEFAULT_MESSAGES,
  placeholder = 'Ask a follow-up…',
  embedded = false,
  className = '',
}: ChatThreadPanelProps) {
  const [draft, setDraft] = React.useState('')
  const [stuck, setStuck] = React.useState(true)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // "Near" rather than "at" — subpixel scroll heights mean an exact equality
  // check is false on a thread the user is, visually, at the bottom of.
  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    setStuck(el.scrollHeight - el.scrollTop - el.clientHeight < 32)
  }

  function scrollToLatest(behavior: ScrollBehavior = 'smooth') {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }

  React.useEffect(() => {
    // `scrollTo` on the container, never `scrollIntoView` on the message —
    // the latter walks every scrollable ancestor including the document.
    if (!embedded) scrollToLatest('auto')
  }, [embedded])

  return (
    <div
      className={`mx-auto flex h-[34rem] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border/60 bg-card ${className}`}
    >
      {/* -- Header ----------------------------------------------------- */}
      <div className="flex items-center gap-3 border-b border-border/60 px-5 py-3.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Bot aria-hidden className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {/* -- Thread ----------------------------------------------------- */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Conversation"
          className="h-full space-y-5 overflow-y-auto px-5 py-5"
        >
          {messages.map((message) =>
            message.role === 'user' ? (
              <div key={message.id} className="flex justify-end gap-3">
                <div className="max-w-[80%] rounded-2xl rounded-ee-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
                  {/* Named for a reader that lands here out of context. */}
                  <span className="sr-only">You said: </span>
                  {message.content}
                </div>
                <span
                  aria-hidden
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted text-muted-foreground"
                >
                  <User className="h-3.5 w-3.5" />
                </span>
              </div>
            ) : (
              <div key={message.id} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                >
                  <Bot className="h-3.5 w-3.5" />
                </span>

                <div className="min-w-0 max-w-[85%]">
                  <div className="rounded-2xl rounded-es-md border border-border/60 bg-background px-4 py-2.5 text-sm leading-relaxed">
                    <span className="sr-only">Assistant said: </span>
                    {message.content}
                  </div>

                  <div className="mt-1.5 flex items-center gap-1">
                    {message.meta ? (
                      <span className="me-1 text-xs text-muted-foreground">{message.meta}</span>
                    ) : null}
                    <TurnAction icon={<Copy className="h-3.5 w-3.5" />} label="Copy reply" />
                    <TurnAction icon={<RefreshCw className="h-3.5 w-3.5" />} label="Regenerate" />
                    <TurnAction icon={<ThumbsUp className="h-3.5 w-3.5" />} label="Good reply" />
                    <TurnAction icon={<ThumbsDown className="h-3.5 w-3.5" />} label="Bad reply" />
                  </div>
                </div>
              </div>
            ),
          )}
        </div>

        {/* Only offered while it is needed — a permanent button here reads
            as a broken scroll position. */}
        {stuck ? null : (
          <button
            type="button"
            onClick={() => scrollToLatest()}
            className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium shadow-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowDown aria-hidden className="h-3.5 w-3.5" />
            Jump to latest
          </button>
        )}
      </div>

      {/* -- Composer --------------------------------------------------- */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setDraft('')
        }}
        className="border-t border-border/60 p-3"
      >
        <div className="flex items-end gap-2 rounded-xl border border-border/60 bg-background p-2 focus-within:ring-2 focus-within:ring-ring">
          <textarea
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends, Shift-Enter breaks the line — and the IME guard
              // stops Enter-to-commit-a-candidate from firing a send in
              // Japanese, Chinese and Korean input.
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                e.currentTarget.form?.requestSubmit()
              }
            }}
            placeholder={placeholder}
            aria-label={placeholder}
            className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-1.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={draft.trim().length === 0}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Send aria-hidden className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </button>
        </div>
      </form>
    </div>
  )
}

/**
 * An icon-only action under an assistant turn.
 *
 * The label is `sr-only` rather than a `title`: a tooltip attribute is not
 * reliably read, and an icon button with no accessible name is announced as
 * "button" four times in a row.
 */
function TurnAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span aria-hidden>{icon}</span>
      <span className="sr-only">{label}</span>
    </button>
  )
}
