/**
 * <ChatStreamingAnswer> — an answer that arrives a token at a time, with
 * inline citations, reply actions and follow-up chips.
 *
 * Streaming is where accessible chat quietly breaks, so the handling here is
 * the point of the block:
 *
 *  - The text is NOT in a live region. A region that re-reads on every
 *    mutation turns a 60-token answer into 60 announcements of a growing
 *    paragraph. Instead the streaming *status* is announced once from a
 *    separate `role="status"`, and the finished text is announced once when
 *    it settles — which is what a reader actually wants read to them.
 *  - `prefers-reduced-motion` skips the animation outright rather than
 *    slowing it. There is no information in watching characters appear; the
 *    answer is the information, and a user who asked for less motion should
 *    simply have it.
 *  - The caret blink is `motion-safe:` for the same reason, and disappears
 *    the moment the stream ends so it cannot be mistaken for a hung request.
 *
 * The mount-time reset runs in a layout effect, not `useEffect`. The server
 * render has to emit the *finished* answer — an exported HTML snapshot of an
 * empty paragraph is worthless — so the client starts full and rewinds to
 * zero, and doing that after paint would flash the whole answer for a frame.
 */

'use client'

import * as React from 'react'
import { Bot, Check, Copy, CornerDownRight, ExternalLink, RotateCcw } from 'lucide-react'

export interface AnswerSource {
  id: number
  title: string
  host: string
}

export interface ChatStreamingAnswerProps {
  /**
   * The prompt this answers, shown as a bubble above it. Pass an empty
   * string to drop it — inside an existing thread the question has already
   * been rendered, and repeating it puts the same sentence on screen twice.
   */
  question?: string
  /** The answer body. `[1]`-style markers are linked to `sources`. */
  answer?: string
  sources?: AnswerSource[]
  followUps?: string[]
  /** Milliseconds per character while streaming. */
  speed?: number
  className?: string
}

const DEFAULT_ANSWER =
  'Churn concentrated in accounts under 20 seats, which lost 6.1% of ARR against 1.4% in the rest of the book [1]. The common thread is activation rather than price: teams that never connected a second data source churned at roughly four times the rate of those that did [2]. Only 11% of the cancellations cited cost in their exit survey, and most of those had already downgraded once [3].'

const DEFAULT_SOURCES: AnswerSource[] = [
  { id: 1, title: 'Q3 revenue cohorts', host: 'warehouse.arr_monthly' },
  { id: 2, title: 'Activation funnel, Jul–Sep', host: 'warehouse.events' },
  { id: 3, title: 'Cancellation survey responses', host: 'support.exit_surveys' },
]

const DEFAULT_FOLLOW_UPS = [
  'Which integrations correlate with retention?',
  'Show the same cut for last quarter',
  'Draft a save offer for the at-risk accounts',
]

/**
 * `useLayoutEffect` on the client, `useEffect` on the server.
 *
 * React warns that a layout effect does nothing during SSR, and it is right —
 * but the warning fires even when the effect exists precisely to correct the
 * server's output before the browser paints it. Swapping the hook by
 * environment is the standard way out, and it is the only reason the rewind
 * below does not flash.
 */
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

export function ChatStreamingAnswer({
  question = 'Why did churn spike in Q3?',
  answer = DEFAULT_ANSWER,
  sources = DEFAULT_SOURCES,
  followUps = DEFAULT_FOLLOW_UPS,
  speed = 12,
  className = '',
}: ChatStreamingAnswerProps) {
  // Starts complete: this is what the server renders and what a user with
  // reduced motion keeps.
  const [shown, setShown] = React.useState(answer.length)
  const [copied, setCopied] = React.useState(false)
  const [run, setRun] = React.useState(0)

  const streaming = shown < answer.length

  useIsomorphicLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setShown(0)
  }, [answer, run])

  React.useEffect(() => {
    if (!streaming) return
    // Several characters per tick rather than one per tick: a 16ms timer per
    // character makes a 400-character answer take six seconds and pins a
    // timer to every card on the page while it does.
    const id = window.setInterval(() => {
      setShown((n) => Math.min(n + 3, answer.length))
    }, speed)
    return () => window.clearInterval(id)
  }, [streaming, answer.length, speed])

  React.useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(id)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard?.writeText(answer)
      setCopied(true)
    } catch {
      // Denied or unavailable — the answer is still selectable text.
    }
  }

  const visible = answer.slice(0, shown)

  return (
    <div className={`mx-auto w-full max-w-2xl p-6 ${className}`}>
      {question ? (
        <p className="mb-5 text-right text-sm">
          <span className="inline-block rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-left text-primary-foreground">
            {question}
          </span>
        </p>
      ) : null}

      <div className="flex gap-3">
        <span
          aria-hidden
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <Bot className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          {/* Announced once, and only while it is true. The answer text
              itself is deliberately outside every live region. */}
          <span role="status" className="sr-only">
            {streaming ? 'Generating answer' : 'Answer complete'}
          </span>

          <div className="rounded-2xl rounded-bl-md border border-border/60 bg-card px-4 py-3 text-sm leading-relaxed">
            <p>
              {renderWithCitations(visible, sources)}
              {streaming ? (
                <span
                  aria-hidden
                  className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-primary motion-safe:animate-pulse"
                />
              ) : null}
            </p>
          </div>

          {/* -- Sources ------------------------------------------------ */}
          <details className="group mt-2.5" open={!streaming}>
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <CornerDownRight aria-hidden className="h-3.5 w-3.5" />
              {sources.length} sources
            </summary>

            <ul className="mt-1.5 space-y-1">
              {sources.map((source) => (
                <li key={source.id}>
                  <a
                    href="#"
                    id={`citation-${source.id}`}
                    className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-card/60 px-2.5 py-2 text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-[10px] font-semibold">
                      {source.id}
                    </span>
                    <span className="truncate font-medium">{source.title}</span>
                    <span className="ml-auto shrink-0 truncate font-mono text-[11px] text-muted-foreground">
                      {source.host}
                    </span>
                    <ExternalLink aria-hidden className="h-3 w-3 shrink-0 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          </details>

          {/* -- Actions ------------------------------------------------ */}
          <div className="mt-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {copied ? (
                <Check aria-hidden className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy aria-hidden className="h-3.5 w-3.5" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </button>

            <button
              type="button"
              onClick={() => setRun((n) => n + 1)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RotateCcw aria-hidden className="h-3.5 w-3.5" />
              Regenerate
            </button>
          </div>

          {/* -- Follow-ups -------------------------------------------- */}
          {followUps.length > 0 && !streaming ? (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ask next
              </p>
              <ul className="flex flex-wrap gap-2">
                {followUps.map((text) => (
                  <li key={text}>
                    <button
                      type="button"
                      className="rounded-full border border-border/60 bg-card px-3 py-1.5 text-left text-xs transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {text}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/**
 * Turn `[1]` markers into links to the source list below.
 *
 * Split rather than `dangerouslySetInnerHTML` — the answer text is model
 * output, which is the last string in the app that should be trusted as
 * markup. A citation whose number has no matching source is left as plain
 * text instead of linking to nothing.
 */
function renderWithCitations(text: string, sources: AnswerSource[]): React.ReactNode[] {
  const known = new Set(sources.map((s) => s.id))

  return text.split(/(\[\d+\])/g).map((part, i) => {
    const match = /^\[(\d+)\]$/.exec(part)
    const id = match ? Number(match[1]) : null

    if (id === null || !known.has(id)) return <React.Fragment key={i}>{part}</React.Fragment>

    return (
      <a
        key={i}
        href={`#citation-${id}`}
        // Leading margin only. A trailing one opens a visible gap before
        // the sentence's full stop, which reads as a typo.
        className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded bg-primary/10 px-1 align-super font-mono text-[10px] font-semibold text-primary no-underline transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {id}
        <span className="sr-only"> — see source {id}</span>
      </a>
    )
  })
}
