'use client'

/**
 * A control that has to say what it does.
 *
 * The playground already writes its sliders properly — "Rotate every color
 * around the wheel", "Multiply every animation duration" — and that one
 * line is the difference between a control you understand and a control you
 * discover by dragging it and watching what breaks.
 *
 * Everywhere else got the top half only. `SliderRow` existed three times,
 * byte for byte, in the glassmorphism, border-radius and typography tools:
 * a label, a value, a track. No description, and no place to put one.
 *
 * So `description` here is required, not optional. Making it optional would
 * reproduce exactly the situation this replaces — a component that permits
 * the unexplained control and therefore gets used that way. If a slider
 * genuinely needs no explanation, the label was not specific enough.
 *
 * The description is wired to the input with `aria-describedby`, so it is
 * read out with the control rather than only being visible next to it.
 */

import * as React from 'react'

import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'

export interface SliderFieldProps {
  /** What the control adjusts, e.g. "Blur". */
  label: string
  /** One line on what it does to the output. Required — see above. */
  description: string
  value: number
  min: number
  max: number
  step: number
  /** The formatted current value, e.g. "12px" or "1.25×". */
  display: string
  onChange: (value: number) => void
  disabled?: boolean
  className?: string
}

export function SliderField({
  label,
  description,
  value,
  min,
  max,
  step,
  display,
  onChange,
  disabled = false,
  className,
}: SliderFieldProps) {
  const id = React.useId()
  const descriptionId = `${id}-description`
  const labelId = `${id}-label`

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        {/*
          A <span>, not a <label htmlFor>. Radix renders the slider root as a
          <span> and a <span> is not a labelable element, so the `for` never
          bound to anything and the control was left nameless. The visible
          text is wired to the thumb with `aria-labelledby` instead, which
          keeps one source of truth for the name rather than duplicating it
          into an `aria-label` that can drift from what is on screen.
        */}
        <span id={labelId} className="text-xs font-semibold text-foreground">
          {label}
        </span>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {display}
        </span>
      </div>

      <Slider
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={(arr) => arr[0] !== undefined && onChange(arr[0])}
      />

      <p id={descriptionId} className="text-[11px] leading-snug text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

export interface ToggleFieldProps {
  label: string
  /** One line on what turning it on changes. Required, same reason. */
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

/** A switch with the same contract: a label, and a line saying what it does. */
export function ToggleField({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className,
}: ToggleFieldProps) {
  const id = React.useId()
  const descriptionId = `${id}-description`

  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <label htmlFor={id} className="text-xs font-semibold text-foreground">
          {label}
        </label>
        <p id={descriptionId} className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        aria-describedby={descriptionId}
        onCheckedChange={onChange}
        className="mt-0.5 shrink-0"
      />
    </div>
  )
}
