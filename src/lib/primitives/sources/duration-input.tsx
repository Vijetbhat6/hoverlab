'use client'

/**
 * <DurationInput> — three boxes that behave like one field.
 *
 * A duration typed into a single text box has to be parsed, and every parser
 * argues with its users about whether `1:30` is an hour and a half or ninety
 * seconds. Three labelled segments never have that argument. The cost is
 * that three inputs are three tab stops and feel like a form rather than a
 * field, so most of this file is spent making them feel like one:
 *
 *   - **Typing past a segment advances to the next.** Two digits in the
 *     hours box moves to minutes, the way a card-number field does.
 *   - **Backspace in an empty segment goes back** and puts the caret at the
 *     end of the previous one, so a wrong entry is fixed by holding
 *     Backspace rather than by aiming with the mouse.
 *   - **Up/Down step the segment under the caret** and carry properly: 59
 *     minutes + 1 is one more hour and zero minutes, not `60`.
 *   - **Pasting `1:30:00` fills all three**, because that is what people
 *     have on their clipboard. The paste handler is on the group, so it
 *     works whichever segment is focused.
 *
 * `role="group"` with an `aria-labelledby` is what ties the three together
 * for a screen reader, and each segment keeps its own `aria-label` so the
 * announcement is "Duration, Minutes, 30" rather than three loose numbers.
 *
 * The value is a plain number of seconds. Everything else — clamping, the
 * carry, the zero padding — happens on the way in and out, so a consumer
 * never has to hold three pieces of state to hold one duration.
 */

import * as React from 'react'

export interface DurationInputProps {
  /** Total seconds. */
  value?: number
  onChange?: (seconds: number) => void
  /** Drop the seconds box for durations nobody measures that finely. */
  showSeconds?: boolean
  /** Upper bound in seconds. Entry is clamped, not rejected. */
  max?: number
  disabled?: boolean
  /** Names the group — "Session length", "Time spent". */
  label: string
  className?: string
}

interface Segment {
  key: 'hours' | 'minutes' | 'seconds'
  label: string
  /** Exclusive ceiling for the segment, and how many of them make the next. */
  size: number
  width: string
}

const ALL_SEGMENTS: Segment[] = [
  { key: 'hours', label: 'Hours', size: Infinity, width: 'w-12' },
  { key: 'minutes', label: 'Minutes', size: 60, width: 'w-10' },
  { key: 'seconds', label: 'Seconds', size: 60, width: 'w-10' },
]

function split(total: number, showSeconds: boolean) {
  const safe = Math.max(0, Math.floor(total))
  if (!showSeconds) {
    return { hours: Math.floor(safe / 3600), minutes: Math.floor((safe % 3600) / 60), seconds: 0 }
  }
  return {
    hours: Math.floor(safe / 3600),
    minutes: Math.floor((safe % 3600) / 60),
    seconds: safe % 60,
  }
}

export function DurationInput({
  value = 0,
  onChange,
  showSeconds = true,
  max,
  disabled = false,
  label,
  className = '',
}: DurationInputProps) {
  const id = React.useId()
  const segments = React.useMemo(
    () => (showSeconds ? ALL_SEGMENTS : ALL_SEGMENTS.slice(0, 2)),
    [showSeconds],
  )
  const refs = React.useRef<(HTMLInputElement | null)[]>([])
  const parts = split(value, showSeconds)

  /* Which segment is mid-edit, and what is in it. A segment holding "" or
     "0" while someone types the second digit of "05" cannot be derived from
     the number, so it lives here until it commits. */
  const [draft, setDraft] = React.useState<{ index: number; text: string } | null>(null)

  const emit = (next: { hours: number; minutes: number; seconds: number }) => {
    let total = next.hours * 3600 + next.minutes * 60 + next.seconds
    if (max !== undefined) total = Math.min(total, max)
    onChange?.(Math.max(0, total))
  }

  const commit = (index: number, raw: string) => {
    const segment = segments[index]
    const typed = Number(raw || '0')
    /* Clamp the minute and second boxes rather than carrying: someone typing
       "75" into minutes meant 75 minutes, but the box cannot show it, and
       silently becoming 1:15 while they are still typing is worse than
       stopping at 59. The Up/Down handler carries; typing does not. */
    const bounded = Number.isFinite(segment.size)
      ? Math.min(typed, segment.size - 1)
      : typed
    emit({ ...parts, [segment.key]: bounded })
  }

  const step = (index: number, delta: number) => {
    const segment = segments[index]
    const unit = segment.key === 'hours' ? 3600 : segment.key === 'minutes' ? 60 : 1
    emit(split(Math.max(0, value + delta * unit), showSeconds))
  }

  const focusSegment = (index: number, caretAtEnd = false) => {
    const input = refs.current[index]
    if (!input) return
    input.focus()
    if (caretAtEnd) {
      const end = input.value.length
      requestAnimationFrame(() => input.setSelectionRange(end, end))
    } else {
      input.select()
    }
  }

  const onSegmentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      step(index, 1)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      step(index, -1)
    } else if (e.key === 'ArrowLeft' && e.currentTarget.selectionStart === 0 && index > 0) {
      e.preventDefault()
      focusSegment(index - 1, true)
    } else if (
      e.key === 'ArrowRight' &&
      e.currentTarget.selectionStart === e.currentTarget.value.length &&
      index < segments.length - 1
    ) {
      e.preventDefault()
      focusSegment(index + 1)
    } else if (e.key === 'Backspace' && e.currentTarget.value === '' && index > 0) {
      e.preventDefault()
      focusSegment(index - 1, true)
    } else if (e.key === ':' || e.key === '.') {
      // The separator people type between segments is a request to move on.
      e.preventDefault()
      if (index < segments.length - 1) focusSegment(index + 1)
    }
  }

  const onPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').trim()
    if (!/^\d{1,3}(:\d{1,2}){1,2}$/.test(text)) return
    e.preventDefault()
    const chunks = text.split(':').map(Number)
    /* `1:30` is minutes:seconds when seconds are shown and hours:minutes
       when they are not — the shorter form means the units on screen. */
    const [hours, minutes, seconds] =
      chunks.length === 3
        ? chunks
        : showSeconds
          ? [0, chunks[0], chunks[1]]
          : [chunks[0], chunks[1], 0]
    setDraft(null)
    emit({ hours, minutes, seconds })
  }

  return (
    <div className={className}>
      <span id={`${id}-label`} className="sr-only">
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={`${id}-label`}
        onPaste={onPaste}
        className={[
          'inline-flex items-center gap-0.5 rounded-lg border border-border bg-background px-2 py-1',
          'focus-within:ring-2 focus-within:ring-ring',
          disabled ? 'opacity-60' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {segments.map((segment, index) => (
          <React.Fragment key={segment.key}>
            {index > 0 ? (
              <span aria-hidden className="text-sm text-muted-foreground">
                :
              </span>
            ) : null}
            <span className="flex flex-col items-center">
              <input
                ref={(el) => {
                  refs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                disabled={disabled}
                aria-label={segment.label}
                value={
                  draft?.index === index
                    ? draft.text
                    : String(parts[segment.key]).padStart(2, '0')
                }
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(-2)
                  setDraft({ index, text: digits })
                  commit(index, digits)
                  // Two digits fills the box — move on, as a card field does.
                  if (digits.length === 2 && index < segments.length - 1) {
                    setDraft(null)
                    focusSegment(index + 1)
                  }
                }}
                onFocus={(e) => e.currentTarget.select()}
                onBlur={() => setDraft(null)}
                onKeyDown={(e) => onSegmentKeyDown(e, index)}
                className={`${segment.width} border border-transparent bg-transparent text-center font-mono text-sm tabular-nums text-foreground outline-none`}
              />
              <span aria-hidden className="text-[0.625rem] uppercase text-muted-foreground">
                {segment.label.slice(0, 3)}
              </span>
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
