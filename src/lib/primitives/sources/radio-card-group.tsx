'use client'

/**
 * <RadioCardGroup> — choose one of several, where each choice needs room:
 * plans, shipping methods, environments.
 *
 * It is a set of REAL radio inputs with cards drawn around them, not a set of
 * clickable cards that imitate radios. That distinction is all the
 * accessibility there is: native radios give the group its one tab stop, the
 * arrow keys, "2 of 3, selected" and form submission for nothing, and every
 * one of those is something a `div` with an `onClick` has to rebuild and
 * usually does not.
 *
 *  - The group is a `<fieldset>` with a `<legend>`, the native way to name a
 *    set of controls. The legend can be visually hidden but is always there.
 *  - The input is `sr-only` inside a `relative` label. `sr-only` is absolutely
 *    positioned, so without `relative` on the label it is placed against the
 *    nearest positioned ancestor — and inside a scroll container it makes the
 *    whole page scroll sideways.
 *  - The selected style is driven by `has-[:checked]`, so it can never
 *    disagree with the real state, and the focus ring by `has-[:focus-visible]`
 *    so the card shows keyboard focus exactly as a normal radio would.
 *  - The check mark is drawn, not coloured: selection is a shape as well as a
 *    colour, which is what 1.4.1 (use of colour) asks for.
 *  - Disabled options are dimmed and unreachable, and say so to assistive tech
 *    by being genuinely disabled.
 *
 * Controlled with `value` + `onValueChange`, or uncontrolled with
 * `defaultValue`. Pass `name` to submit it in a form.
 */

import * as React from 'react'

export interface RadioCardOption {
  value: string
  title: string
  description?: string
  /** Right-aligned, e.g. a price. */
  meta?: string
  badge?: string
  disabled?: boolean
}

export interface RadioCardGroupProps {
  legend: string
  options: RadioCardOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  name?: string
  columns?: 1 | 2 | 3
  hideLegend?: boolean
  className?: string
}

const COLUMNS = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3' } as const

export function RadioCardGroup({
  legend,
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  columns = 1,
  hideLegend = false,
  className = '',
}: RadioCardGroupProps) {
  const uid = React.useId()
  const groupName = name ?? `${uid}-group`
  const [inner, setInner] = React.useState(defaultValue)
  const selected = value ?? inner

  return (
    <fieldset className={`min-w-0 border-0 p-0 ${className}`}>
      <legend className={hideLegend ? 'sr-only' : 'mb-3 text-sm font-medium'}>{legend}</legend>
      <div className={`grid gap-3 ${COLUMNS[columns]}`}>
        {options.map((option) => (
          <label
            key={option.value}
            className={`relative flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:disabled]:hover:bg-card`}
          >
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={selected === option.value}
              disabled={option.disabled}
              onChange={() => {
                if (value === undefined) setInner(option.value)
                onValueChange?.(option.value)
              }}
              className="peer sr-only"
            />
            {/* The indicator. An empty ring when off, a filled disc with a
                tick when on — a shape change, not only a colour change. */}
            <span
              aria-hidden
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/60 text-primary-foreground transition-colors peer-checked:border-primary peer-checked:bg-primary"
            >
              <svg
                viewBox="0 0 12 12"
                className="h-3 w-3 opacity-0 transition-opacity peer-checked:opacity-100 [input:checked~span>&]:opacity-100"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2.5 6.5 5 9l4.5-6" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-sm font-medium">{option.title}</span>
                {option.badge ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {option.badge}
                  </span>
                ) : null}
              </span>
              {option.description ? (
                <span className="mt-0.5 block text-sm text-muted-foreground">{option.description}</span>
              ) : null}
            </span>
            {option.meta ? (
              <span className="shrink-0 text-sm font-semibold tabular-nums">{option.meta}</span>
            ) : null}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
