'use client'

/**
 * <Switch> — an on/off setting that takes effect immediately, with its label
 * and description in the same row.
 *
 * A switch and a checkbox are different promises. A checkbox records a choice
 * to be submitted later; a switch flips something NOW. Say "switch" to a
 * screen reader and it announces "on" or "off", not "checked" — which is why
 * this is `role="switch"` with `aria-checked`, and why using it for a form
 * field that only saves on submit is the wrong control.
 *
 *  - It is a real `<button>`, so Space and Enter work and it is one tab stop.
 *  - The label is a real `<label>` pointing at it, so clicking the words
 *    toggles it too. The description is `aria-describedby`.
 *  - It works inside a plain `<form>`: give it a `name` and a hidden checkbox
 *    is submitted only while it is on, exactly like the native control.
 *  - The unchecked track is `muted-foreground` at 80%, not a pale grey. A
 *    switch whose OFF state is 1.6:1 against the page looks disabled and
 *    fails the 3:1 non-text contrast requirement (1.4.11).
 *  - The thumb slides the right way in right-to-left documents, and not at
 *    all under `prefers-reduced-motion`.
 *  - Controlled with `checked` + `onCheckedChange`, or uncontrolled with
 *    `defaultChecked`.
 */

import * as React from 'react'

export interface SwitchProps {
  label: React.ReactNode
  description?: React.ReactNode
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  name?: string
  /** Submitted as the field's value while on. Defaults to "on". */
  value?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function Switch({
  label,
  description,
  checked,
  defaultChecked = false,
  onCheckedChange,
  name,
  value = 'on',
  disabled = false,
  size = 'md',
  className = '',
}: SwitchProps) {
  const uid = React.useId()
  const [inner, setInner] = React.useState(defaultChecked)
  const on = checked ?? inner

  const toggle = () => {
    if (disabled) return
    if (checked === undefined) setInner(!on)
    onCheckedChange?.(!on)
  }

  const track = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11'
  const thumb = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const travel = size === 'sm' ? 'ltr:translate-x-4 rtl:-translate-x-4' : 'ltr:translate-x-5 rtl:-translate-x-5'

  return (
    <div className={`flex items-start justify-between gap-4 ${disabled ? 'opacity-60' : ''} ${className}`}>
      <div className="min-w-0">
        <label htmlFor={`${uid}-switch`} className={`text-sm font-medium ${disabled ? '' : 'cursor-pointer'}`}>
          {label}
        </label>
        {description ? (
          <p id={`${uid}-desc`} className="mt-0.5 text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        role="switch"
        id={`${uid}-switch`}
        aria-checked={on}
        aria-describedby={description ? `${uid}-desc` : undefined}
        disabled={disabled}
        onClick={toggle}
        className={`relative inline-flex shrink-0 items-center rounded-full border border-transparent p-0.5 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed ${track} ${
          on ? 'bg-primary' : 'bg-muted-foreground/80'
        }`}
      >
        <span
          aria-hidden
          className={`block rounded-full border border-transparent bg-background shadow-sm transition-transform motion-reduce:transition-none ${thumb} ${
            on ? travel : 'translate-x-0'
          }`}
        />
      </button>

      {name ? <input type="checkbox" hidden readOnly name={name} value={value} checked={on} /> : null}
    </div>
  )
}
