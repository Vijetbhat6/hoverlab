'use client'

/**
 * <Stepper> — a number with a minus and a plus.
 *
 * The one people reach for `<input type="number">` for, and then spend an
 * afternoon on. That element brings a locale-dependent spinner you cannot
 * style, accepts `e`, `+` and `-` anywhere in the string, reports `""` for
 * anything it considers invalid so you cannot tell "empty" from "abc", and
 * on a phone shows a keyboard with a decimal point on a field that wants
 * integers.
 *
 * So the field is a text input with `inputMode="numeric"`, and the
 * component owns the arithmetic:
 *
 *   - the buttons disable AT the bounds, not after crossing them
 *   - ArrowUp/ArrowDown step, PageUp/PageDown step by ten, Home/End jump
 *     to min/max — the same keys the native spinner answers, which is what
 *     a keyboard user will try
 *   - typing is unrestricted while the field has focus and clamped on
 *     blur, because clamping mid-keystroke means typing "25" into a field
 *     with a minimum of 10 rewrites your "2" to "10"
 *
 * `role="spinbutton"` with the three aria-value attributes is what makes a
 * screen reader announce "3 of 10" instead of reading an unlabelled
 * textbox next to two unlabelled buttons.
 */

import * as React from 'react'
import { Minus, Plus } from 'lucide-react'

export interface StepperProps {
  value?: number
  defaultValue?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** Appended after the number — "kg", "seats", "×". */
  unit?: string
  disabled?: boolean
  /** Names the control. Required: "3" on its own means nothing. */
  label: string
  size?: 'sm' | 'md'
  className?: string
}

export function Stepper({
  value,
  defaultValue = 1,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  unit,
  disabled = false,
  label,
  size = 'md',
  className = '',
}: StepperProps) {
  const [internal, setInternal] = React.useState(defaultValue)
  const current = value ?? internal
  const [draft, setDraft] = React.useState<string | null>(null)

  const clamp = (n: number) => Math.min(max, Math.max(min, n))

  const set = (next: number) => {
    const clamped = clamp(next)
    if (value === undefined) setInternal(clamped)
    onChange?.(clamped)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const jump: Record<string, number> = {
      ArrowUp: step,
      ArrowDown: -step,
      PageUp: step * 10,
      PageDown: -step * 10,
    }
    if (e.key in jump) {
      e.preventDefault()
      setDraft(null)
      set(current + jump[e.key])
    } else if (e.key === 'Home') {
      e.preventDefault()
      setDraft(null)
      set(min)
    } else if (e.key === 'End') {
      e.preventDefault()
      setDraft(null)
      set(max)
    }
  }

  const height = size === 'sm' ? 'h-8' : 'h-9'
  const button =
    'inline-flex aspect-square shrink-0 items-center justify-center text-muted-foreground ' +
    'transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:outline-none ' +
    'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ' +
    'disabled:pointer-events-none disabled:opacity-40'

  return (
    <div
      role="spinbutton"
      aria-label={label}
      aria-valuenow={current}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={unit ? `${current} ${unit}` : undefined}
      className={[
        'inline-flex items-stretch overflow-hidden rounded-lg border border-border bg-background',
        'focus-within:ring-2 focus-within:ring-ring',
        height,
        disabled ? 'opacity-60' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        // Labelled, because a bare minus sign is announced as "button".
        aria-label={`Decrease ${label}`}
        // Hidden from the accessibility tree's value story: the spinbutton
        // above already reports the number and its bounds, and a screen
        // reader user changes it with the arrow keys.
        tabIndex={-1}
        disabled={disabled || current <= min}
        onClick={() => set(current - step)}
        className={`${button} rounded-s-lg border-e border-border`}
      >
        <Minus className="h-3.5 w-3.5" aria-hidden />
      </button>

      <input
        type="text"
        inputMode="numeric"
        disabled={disabled}
        // While focused the field shows exactly what was typed. Clamping on
        // every keystroke turns "2" into "10" on a field whose minimum is
        // 10, and the user never gets to type the 5.
        value={draft ?? String(current)}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d-]/g, ''))}
        onBlur={() => {
          if (draft !== null) {
            const parsed = Number.parseInt(draft, 10)
            set(Number.isNaN(parsed) ? current : parsed)
            setDraft(null)
          }
        }}
        onKeyDown={onKeyDown}
        aria-label={label}
        className={[
          'w-12 border border-transparent bg-transparent text-center text-sm font-medium tabular-nums',
          'text-foreground outline-none disabled:cursor-not-allowed',
        ].join(' ')}
      />

      {unit ? (
        <span className="flex select-none items-center pe-2 text-xs text-muted-foreground">
          {unit}
        </span>
      ) : null}

      <button
        type="button"
        aria-label={`Increase ${label}`}
        tabIndex={-1}
        disabled={disabled || current >= max}
        onClick={() => set(current + step)}
        className={`${button} rounded-e-lg border-s border-border`}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  )
}
