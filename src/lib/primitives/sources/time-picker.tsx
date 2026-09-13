'use client'

/**
 * <TimePicker> — pick a time from the slots that are actually bookable.
 *
 * A `<input type="time">` is the right control when any minute will do. It
 * is the wrong one for a booking: every real scheduling UI offers a fixed
 * step, has slots that are already taken, and must say which time zone it
 * is quoting — and a native time input can express none of those three.
 *
 * The zone is the part worth insisting on. A list of times with no zone on
 * it is how this pattern wastes an hour of everyone involved, so `timeZone`
 * is rendered next to the value rather than being an option nobody passes.
 * It is a label, not a conversion: the slots are the ones the caller handed
 * over, and pretending otherwise would silently move somebody's meeting.
 *
 * It is a listbox, not a combobox — there is nothing to type into, so the
 * trigger is a button and the focus moves into the list when it opens, which
 * is the opposite of what `<Combobox>` does and correct for the same reason.
 *
 *   Down / Up      move the highlight, skipping taken slots
 *   Home / End     first and last selectable slot
 *   Enter / Space  choose the highlighted slot
 *   Escape         close, focus back on the trigger
 *
 * Times are minutes-from-midnight throughout, never `Date`s. A slot list is
 * a shape of the day, not a set of instants, and holding it as `Date`s makes
 * every comparison a DST bug waiting for the clocks to change.
 */

import * as React from 'react'
import { Check, Clock } from 'lucide-react'

export interface TimePickerProps {
  /** Minutes from midnight — `570` is 09:30. `null` for no selection. */
  value?: number | null
  onChange?: (minutes: number) => void
  /** Gap between slots, in minutes. */
  step?: number
  /** Window of the day to offer, in minutes from midnight. */
  min?: number
  max?: number
  /** Slots that exist but cannot be taken. */
  unavailable?: number[]
  hour12?: boolean
  /** Shown beside the value. A label, not a conversion — see the header. */
  timeZone?: string
  placeholder?: string
  disabled?: boolean
  label: string
  className?: string
}

function formatMinutes(minutes: number, hour12: boolean): string {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  if (!hour12) {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }
  const suffix = hour < 12 ? 'AM' : 'PM'
  const shown = hour % 12 === 0 ? 12 : hour % 12
  return `${shown}:${String(minute).padStart(2, '0')} ${suffix}`
}

export function TimePicker({
  value = null,
  onChange,
  step = 30,
  min = 0,
  max = 24 * 60 - 1,
  unavailable = [],
  hour12 = false,
  timeZone,
  placeholder = 'Select a time',
  disabled = false,
  label,
  className = '',
}: TimePickerProps) {
  const id = React.useId()
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)

  const taken = React.useMemo(() => new Set(unavailable), [unavailable])

  const slots = React.useMemo(() => {
    const out: number[] = []
    for (let m = min; m <= max; m += step) out.push(m)
    return out
  }, [min, max, step])

  const [active, setActive] = React.useState(0)

  /* Open on the current selection, or on the first slot anyone can take —
     landing the highlight on a struck-through 9am helps nobody. */
  const openList = () => {
    const selectedIndex = slots.findIndex((m) => m === value)
    const firstFree = slots.findIndex((m) => !taken.has(m))
    setActive(selectedIndex >= 0 ? selectedIndex : Math.max(0, firstFree))
    setOpen(true)
  }

  React.useEffect(() => {
    if (!open) return
    const list = listRef.current
    list?.focus()
    list?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'center' })
    // Deliberately keyed on `open` alone: scrolling to centre on every arrow
    // press would yank the list under the user. The effect below handles the
    // moving highlight, scrolling only to 'nearest'.
  }, [open])

  React.useEffect(() => {
    if (!open) return
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  React.useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const close = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  const move = (delta: number) => {
    setActive((current) => {
      let next = current
      for (let i = 0; i < slots.length; i++) {
        next = (next + delta + slots.length) % slots.length
        if (!taken.has(slots[next])) break
      }
      return next
    })
  }

  const commit = (minutes: number) => {
    if (taken.has(minutes)) return
    onChange?.(minutes)
    close()
  }

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      move(1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      move(-1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActive(Math.max(0, slots.findIndex((m) => !taken.has(m))))
    } else if (e.key === 'End') {
      e.preventDefault()
      for (let i = slots.length - 1; i >= 0; i--) {
        if (!taken.has(slots[i])) {
          setActive(i)
          break
        }
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      commit(slots[active])
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      e.preventDefault()
      close()
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        onClick={() => (open ? close() : openList())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault()
            openList()
          }
        }}
        className={[
          'flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm outline-none',
          'focus-visible:ring-2 focus-visible:ring-ring',
          disabled ? 'opacity-60' : 'hover:bg-muted/50',
        ].join(' ')}
      >
        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span
          className={`flex-1 text-left ${value === null ? 'text-muted-foreground' : 'text-foreground'}`}
        >
          {value === null ? placeholder : formatMinutes(value, hour12)}
        </span>
        {timeZone ? (
          <span className="shrink-0 text-xs text-muted-foreground">{timeZone}</span>
        ) : null}
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          aria-activedescendant={`${id}-slot-${active}`}
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-lg outline-none"
        >
          {slots.map((minutes, i) => {
            const isTaken = taken.has(minutes)
            const selected = minutes === value
            return (
              <li
                key={minutes}
                id={`${id}-slot-${i}`}
                data-index={i}
                role="option"
                aria-selected={selected}
                aria-disabled={isTaken || undefined}
                onPointerDown={(e) => {
                  e.preventDefault()
                  commit(minutes)
                }}
                onPointerEnter={() => !isTaken && setActive(i)}
                className={[
                  'flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm',
                  isTaken
                    ? 'pointer-events-none text-muted-foreground/50 line-through'
                    : 'text-foreground',
                  i === active && !isTaken ? 'bg-muted' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <Check
                  className={`h-4 w-4 shrink-0 ${selected ? 'opacity-100' : 'opacity-0'}`}
                  aria-hidden
                />
                <span className="flex-1">{formatMinutes(minutes, hour12)}</span>
                {isTaken ? (
                  <span className="text-xs text-muted-foreground">Booked</span>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
