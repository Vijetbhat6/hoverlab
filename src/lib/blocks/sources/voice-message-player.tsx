'use client'

/**
 * <VoiceMessagePlayer> — a voice note you can actually navigate.
 *
 * A voice message is the least scannable thing a chat can contain. You cannot
 * skim it, you cannot search it, and you cannot tell from the outside whether
 * the useful part is at 0:04 or 1:40. Most implementations ship a play button
 * and a duration and leave it there.
 *
 * FOUR THINGS THAT MAKE ONE USABLE
 *
 *  - **A waveform that is a seek control.** Not an animated decoration.
 *    Clicking or dragging it moves the playhead, and it is a real
 *    `<input type="range">` underneath so it works from the keyboard and
 *    announces its position. A canvas-with-pointer-events version loses both.
 *  - **A speed control.** 1×, 1.5×, 2×. A two-minute note at 2× is a
 *    one-minute note, and this single button is why people tolerate voice
 *    messages at all.
 *  - **A transcript.** The accessibility requirement and, in practice, the
 *    feature everybody uses: it makes the content searchable, skimmable and
 *    quotable. Collapsed by default, with the first line showing.
 *  - **Played state that persists.** The bar stays filled after it finishes,
 *    so a thread of six notes shows which one you stopped at.
 *
 * THE WAVEFORM IS DETERMINISTIC, NOT RANDOM. Generated from the message id, so
 * the same note draws the same shape on every render — a `Math.random()`
 * waveform changes between the server and the client, which React reports as a
 * hydration mismatch and then discards the subtree.
 *
 * ACCESSIBILITY: the scrubber is a labelled range input with `aria-valuetext`
 * in minutes and seconds, because "37" announced bare is not a position; the
 * transcript is a real disclosure with `aria-expanded` and `aria-controls`;
 * play state is in the button's accessible name, not only in the glyph.
 */

import * as React from 'react'
import { FileText, Pause, Play, SkipBack, SkipForward } from 'lucide-react'

export interface VoiceMessage {
  id: string
  author: string
  mine?: boolean
  at: string
  seconds: number
  transcript: string
  played?: boolean
}

export interface VoiceMessagePlayerProps {
  messages?: VoiceMessage[]
  speeds?: number[]
  className?: string
}

const DEFAULT_MESSAGES: VoiceMessage[] = [
  {
    id: 'v1',
    author: 'Priya Raman',
    at: '09:41',
    seconds: 34,
    played: true,
    transcript:
      'Quick one about the Monday run — the driver can take the chairs and two of the desks, but not the third. If you want all three desks together it has to be Wednesday. Let me know before four and I will hold the slot.',
  },
  {
    id: 'v2',
    author: 'You',
    mine: true,
    at: '09:48',
    seconds: 12,
    transcript:
      'Chairs and the two desks on Monday is fine. Put the third one on the Wednesday run with the lamps.',
  },
]

/** Deterministic from the id — a random waveform is a hydration mismatch. */
function bars(id: string, count: number) {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return Array.from({ length: count }, () => {
    hash = (hash * 1103515245 + 12345) >>> 0
    return 20 + ((hash >>> 16) % 80)
  })
}

function clock(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function spoken(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return m > 0 ? `${m} minutes ${s} seconds` : `${s} seconds`
}

function Note({ message, speeds }: { message: VoiceMessage; speeds: number[] }) {
  const uid = React.useId()
  const [position, setPosition] = React.useState(message.played ? message.seconds : 0)
  const [playing, setPlaying] = React.useState(false)
  const [speed, setSpeed] = React.useState(1)
  const [showTranscript, setShowTranscript] = React.useState(false)

  const shape = React.useMemo(() => bars(message.id, 42), [message.id])
  const progress = message.seconds === 0 ? 0 : position / message.seconds

  React.useEffect(() => {
    if (!playing) return
    const tick = window.setInterval(() => {
      setPosition((p) => {
        const next = p + 0.25 * speed
        if (next >= message.seconds) {
          setPlaying(false)
          return message.seconds
        }
        return next
      })
    }, 250)
    return () => window.clearInterval(tick)
  }, [playing, speed, message.seconds])

  function toggle() {
    // Restart when it has run to the end, rather than doing nothing.
    if (position >= message.seconds) setPosition(0)
    setPlaying((p) => !p)
  }

  function nudge(delta: number) {
    setPosition((p) => Math.min(message.seconds, Math.max(0, p + delta)))
  }

  return (
    <div className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`w-full max-w-sm rounded-2xl p-3 ${
          message.mine ? 'rounded-ee-sm bg-primary/10' : 'rounded-es-sm bg-muted'
        }`}
      >
        <p className="text-xs font-medium">
          {message.author}
          <span className="ms-2 font-normal text-muted-foreground">{message.at}</span>
        </p>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {playing ? (
              <Pause aria-hidden className="h-4 w-4" />
            ) : (
              <Play aria-hidden className="h-4 w-4" />
            )}
            {/* State in the name, not only in the glyph. */}
            <span className="sr-only">
              {playing ? 'Pause' : 'Play'} the voice message from {message.author}
            </span>
          </button>

          <div className="relative min-w-0 flex-1">
            {/* Decorative; the range below is the real control. */}
            <div aria-hidden className="flex h-8 items-center gap-px">
              {shape.map((height, i) => (
                <span
                  key={i}
                  style={{ height: `${height}%` }}
                  className={`w-full rounded-full transition-colors ${
                    i / shape.length <= progress ? 'bg-primary' : 'bg-foreground/20'
                  }`}
                />
              ))}
            </div>
            <label htmlFor={`${uid}-seek`} className="sr-only">
              Position in the message from {message.author}
            </label>
            <input
              id={`${uid}-seek`}
              type="range"
              min={0}
              max={message.seconds}
              step={0.5}
              value={position}
              aria-valuetext={`${spoken(position)} of ${spoken(message.seconds)}`}
              onChange={(e) => setPosition(Number(e.target.value))}
              className="absolute inset-x-0 top-1/2 h-8 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent opacity-0 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
            {clock(position)} / {clock(message.seconds)}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => nudge(-10)}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <SkipBack aria-hidden className="h-3 w-3" />
            10s
          </button>
          <button
            type="button"
            onClick={() => nudge(10)}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <SkipForward aria-hidden className="h-3 w-3" />
            10s
          </button>

          {/* The control that makes voice notes tolerable. */}
          <button
            type="button"
            onClick={() => setSpeed((s) => speeds[(speeds.indexOf(s) + 1) % speeds.length] ?? 1)}
            className="rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {speed}×<span className="sr-only"> playback speed, tap to change</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTranscript((v) => !v)}
            aria-expanded={showTranscript}
            aria-controls={`${uid}-transcript`}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <FileText aria-hidden className="h-3 w-3" />
            Transcript
          </button>
        </div>

        <div id={`${uid}-transcript`} className="mt-2">
          <p
            className={`text-xs text-muted-foreground ${
              showTranscript ? '' : 'line-clamp-1'
            }`}
          >
            {message.transcript}
          </p>
        </div>
      </div>
    </div>
  )
}

export function VoiceMessagePlayer({
  messages = DEFAULT_MESSAGES,
  speeds = [1, 1.5, 2],
  className = '',
}: VoiceMessagePlayerProps) {
  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-2xl space-y-3 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Voice messages</h2>
        {messages.map((message) => (
          <Note key={message.id} message={message} speeds={speeds} />
        ))}
        <p className="pt-1 text-xs text-muted-foreground">
          The transcript is not a courtesy. It is what makes a voice note
          searchable, quotable and usable by someone who cannot play audio right
          now — on a train, in a meeting, or at all.
        </p>
      </div>
    </section>
  )
}
