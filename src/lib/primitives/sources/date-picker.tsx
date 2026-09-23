'use client'

/**
 * <DatePicker> — a field you can type a date into, with a calendar attached.
 *
 * The typing half is the half that gets dropped, and it is the one people
 * with a keyboard and a known date actually use: entering 2024-03-11 should
 * never require eleven presses of Right. So the input stays a real text
 * input, parses on blur and on Enter, and the calendar is an alternative
 * rather than the only way in.
 *
 * The popover contract, which is where these go wrong:
 *
 *   - **Escape closes and returns focus to the input.** A popover that
 *     closes and drops focus on `<body>` sends the next Tab to the top of
 *     the page, and the user has lost their place in the form.
 *   - **The calendar is not focused when it opens.** It opens *under* the
 *     input the user is still typing in; stealing focus would swallow the
 *     next keystroke. Down arrow moves into the grid deliberately.
 *   - **Clicking a day closes and returns focus too**, because choosing a
 *     date is finishing with the field, not with the page.
 *
 * Parsing is deliberately narrow: ISO `YYYY-MM-DD`, plus `D/M/YYYY` and
 * `M/D/YYYY` resolved by the `dayFirst` prop rather than guessed. A picker
 * that guesses reads 03/04 as March in one country and April in another,
 * silently, and the user never finds out. Anything it cannot parse is left
 * in the box untouched with `aria-invalid` set — clearing what someone typed
 * is the one response worse than not understanding it.
 */

import * as React from 'react'
import { CalendarDays } from 'lucide-react'

import { Calendar } from './calendar'

export interface DatePickerProps {
  value?: Date | null
  onChange?: (date: Date | null) => void
  min?: Date
  max?: Date
  isDisabled?: (date: Date) => boolean
  /** Read `3/4/2024` as 3 April rather than 4 March. */
  dayFirst?: boolean
  weekStartsOn?: 0 | 1
  locale?: string
  placeholder?: string
  disabled?: boolean
  /** Names the field — every instance needs one. */
  label: string
  className?: string
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** `Date` → `YYYY-MM-DD`, in local time. `toISOString()` would shift the day. */
function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Parse what a person is likely to have typed, and nothing else.
 *
 * Returns `null` for anything unrecognised, which the caller shows as
 * invalid rather than correcting. Note the explicit round-trip check: the
 * `Date` constructor rolls 31 February forward to 2 March without
 * complaining, so a date that comes back as a different day was not a date.
 */
function parseDate(text: string, dayFirst: boolean): Date | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed)
  const slashed = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(trimmed)

  let year: number
  let month: number
  let day: number

  if (iso) {
    year = Number(iso[1])
    month = Number(iso[2])
    day = Number(iso[3])
  } else if (slashed) {
    year = Number(slashed[3])
    month = Number(dayFirst ? slashed[2] : slashed[1])
    day = Number(dayFirst ? slashed[1] : slashed[2])
  } else {
    return null
  }

  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

export function DatePicker({
  value = null,
  onChange,
  min,
  max,
  isDisabled,
  dayFirst = false,
  weekStartsOn = 0,
  locale,
  placeholder = 'YYYY-MM-DD',
  disabled = false,
  label,
  className = '',
}: DatePickerProps) {
  const id = React.useId()
  const [open, setOpen] = React.useState(false)
  const [text, setText] = React.useState(() => (value ? toISODate(value) : ''))
  const [invalid, setInvalid] = React.useState(false)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const popoverRef = React.useRef<HTMLDivElement>(null)

  /* Track the value we last wrote, so a parent changing `value` refreshes
     the box while the user's own half-typed text survives a re-render. */
  const lastValue = React.useRef(value)
  React.useEffect(() => {
    if (lastValue.current === value) return
    lastValue.current = value
    setText(value ? toISODate(value) : '')
    setInvalid(false)
  }, [value])

  React.useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const commitText = () => {
    if (!text.trim()) {
      setInvalid(false)
      onChange?.(null)
      return
    }
    const parsed = parseDate(text, dayFirst)
    if (!parsed) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    setText(toISODate(parsed))
    lastValue.current = parsed
    onChange?.(parsed)
  }

  const close = (restoreFocus: boolean) => {
    setOpen(false)
    if (restoreFocus) inputRef.current?.focus()
  }

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitText()
      setOpen(false)
    } else if (e.key === 'Escape' && open) {
      e.preventDefault()
      close(true)
    } else if (e.key === 'ArrowDown' && open) {
      // Deliberate hand-off into the grid — see the header.
      e.preventDefault()
      popoverRef.current?.querySelector<HTMLElement>('[data-focused="true"]')?.focus()
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div
        className={[
          'flex items-center gap-2 rounded-lg border bg-background px-3',
          'focus-within:ring-2 focus-within:ring-ring',
          invalid ? 'border-destructive' : 'border-border',
          disabled ? 'opacity-60' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-label={label}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
          disabled={disabled}
          value={text}
          placeholder={placeholder}
          onChange={(e) => {
            setText(e.target.value)
            if (invalid) setInvalid(false)
          }}
          onBlur={commitText}
          onKeyDown={onInputKeyDown}
          className="h-9 w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground border border-transparent"
        />
        <button
          type="button"
          disabled={disabled}
          aria-label={open ? 'Close calendar' : 'Open calendar'}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls={open ? `${id}-popover` : undefined}
          onClick={() => setOpen((o) => !o)}
          className="-me-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CalendarDays className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {invalid ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-destructive">
          Enter a date as {placeholder}.
        </p>
      ) : null}

      {open ? (
        <div
          ref={popoverRef}
          id={`${id}-popover`}
          role="dialog"
          aria-label={label}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              close(true)
            }
          }}
          className="absolute z-50 mt-1 shadow-lg"
        >
          <Calendar
            value={value}
            min={min}
            max={max}
            isDisabled={isDisabled}
            weekStartsOn={weekStartsOn}
            locale={locale}
            label={label}
            onChange={(date) => {
              setText(toISODate(date))
              setInvalid(false)
              lastValue.current = date
              onChange?.(date)
              close(true)
            }}
          />
        </div>
      ) : null}
    </div>
  )
}
