'use client'

/**
 * <SegmentedControl> — pick exactly one, from two to five.
 *
 * It looks like `ButtonGroup` and is a different control. A button group is
 * a set of actions; this is a single value with several possible states, so
 * it is a radio group — `role="radiogroup"` with `role="radio"` children —
 * and a screen reader says "Month, radio button, 2 of 3, selected". Built
 * as buttons, as most segmented controls are, it announces three unrelated
 * buttons and never says which one is on.
 *
 * That semantic choice brings a keyboard contract with it. A radio group is
 * ONE tab stop: Tab moves into it and out of it, and the arrow keys move
 * between the options, wrapping. That is the roving-tabindex pattern below,
 * and it is why the unselected options have `tabIndex={-1}`.
 *
 * The sliding indicator is a single absolutely positioned element moved
 * with a transform, not a background colour on the selected item. Moving
 * one element animates; repainting backgrounds does not, and the difference
 * is the entire reason this control is nicer than tabs.
 */

import * as React from 'react'

export interface SegmentedOption {
  value: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
}

export interface SegmentedControlProps {
  options: SegmentedOption[]
  value: string
  onChange: (value: string) => void
  size?: 'sm' | 'md'
  /** Fill the container and split it evenly. */
  block?: boolean
  /** Names the group — "View", "Billing period". */
  label: string
  className?: string
}

export function SegmentedControl({
  options,
  value,
  onChange,
  size = 'md',
  block = false,
  label,
  className = '',
}: SegmentedControlProps) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])
  const index = Math.max(0, options.findIndex((o) => o.value === value))

  const move = (delta: number) => {
    const count = options.length
    let next = index
    // Skip disabled options rather than landing on one — the loop bound
    // stops it spinning forever if every other option is disabled.
    for (let i = 0; i < count; i++) {
      next = (next + delta + count) % count
      if (!options[next].disabled) break
    }
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    /*
     * Physical arrow keys mapped through the reading direction. In a
     * right-to-left document the first option is on the right, so ArrowLeft
     * has to move FORWARD through the list — a radio group that walks
     * backwards when you press the key pointing at the next option is the
     * RTL bug nobody catches, because it is invisible in a screenshot.
     */
    const rtl =
      typeof document !== 'undefined' && document.documentElement.dir === 'rtl'
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
    const back = rtl ? 'ArrowRight' : 'ArrowLeft'

    if (e.key === forward || e.key === 'ArrowDown') {
      e.preventDefault()
      move(1)
    } else if (e.key === back || e.key === 'ArrowUp') {
      e.preventDefault()
      move(-1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      onChange(options[0].value)
      refs.current[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      const last = options.length - 1
      onChange(options[last].value)
      refs.current[last]?.focus()
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={[
        'relative isolate inline-flex rounded-lg bg-muted/70 p-1',
        block ? 'flex w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/*
        The indicator, positioned in percentage of the track so it needs no
        measurement pass — which also means it is correct on first paint
        instead of snapping into place after a layout effect.

        `inset-inline-start` via `start-*` is not available as a percentage
        utility, so this uses an inline style with a logical property.
      */}
      <span
        aria-hidden
        className="absolute inset-y-1 z-0 rounded-md bg-background shadow-sm transition-[inset-inline-start] duration-200 ease-out motion-reduce:transition-none"
        style={{
          insetInlineStart: `calc(${(index / options.length) * 100}% + 0.25rem)`,
          width: `calc(${100 / options.length}% - 0.5rem)`,
        }}
      />

      {options.map((option, i) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={option.disabled}
            // Roving tabindex: the group is one tab stop and the arrows
            // move within it.
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={[
              'relative z-10 inline-flex flex-1 items-center justify-center gap-1.5 rounded-md',
              'font-medium transition-colors focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:pointer-events-none disabled:opacity-40',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3.5 text-sm',
              selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
