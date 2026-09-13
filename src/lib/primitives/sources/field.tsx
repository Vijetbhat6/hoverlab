'use client'

/**
 * <Field> — the label, hint, error and aria wiring around one input.
 *
 * This is the primitive that is missing from every base library and
 * rebuilt, slightly wrong, in every project. The wiring it owns:
 *
 *   label      `htmlFor` pointing at the control's id
 *   hint       its own id, joined into `aria-describedby`
 *   error      its own id, ALSO joined into `aria-describedby`, plus
 *              `aria-invalid` on the control
 *   required   a visual marker and `aria-required`, which are different
 *              things and both needed
 *
 * The part that is usually wrong is the error. Screen readers announce
 * `aria-describedby`, so an error message that is only visually adjacent is
 * invisible to them; and the hint must stay in the list when an error
 * appears, because "must be 8 characters" is exactly what the person who
 * just failed validation needs to hear.
 *
 * The control is a render prop rather than a cloned child. `cloneElement`
 * reads nicer in a demo and then quietly fails on the first control that is
 * a wrapper — a Radix Select, a react-hook-form Controller, anything that
 * does not forward unknown props to a DOM node. Handing the ids out and
 * letting the caller apply them works for every one of those, and it makes
 * the wiring visible at the call site instead of magic.
 */

import * as React from 'react'
import { AlertCircle } from 'lucide-react'

export interface FieldRenderProps {
  /** Put this on the control. The label's `htmlFor` already points at it. */
  id: string
  /** Spread onto the control: `aria-describedby` and `aria-invalid`. */
  'aria-describedby': string | undefined
  'aria-invalid': boolean | undefined
  'aria-required': boolean | undefined
}

export interface FieldProps {
  label: string
  /** Persistent help text. Stays visible when an error appears. */
  hint?: string
  /** Validation message. Its presence is what makes the field invalid. */
  error?: string
  required?: boolean
  /** Hide the label visually but keep it for screen readers. */
  labelHidden?: boolean
  children: (props: FieldRenderProps) => React.ReactNode
  className?: string
}

export function Field({
  label,
  hint,
  error,
  required = false,
  labelHidden = false,
  children,
  className = '',
}: FieldProps) {
  // `useId` rather than a counter: a server-rendered id has to match the
  // client's or React discards the markup and rerenders the whole subtree.
  const id = React.useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={id}
        className={
          labelHidden
            ? 'sr-only'
            : 'text-sm font-medium leading-none text-foreground'
        }
      >
        {label}
        {required ? (
          <>
            {/* The asterisk is decoration; `aria-required` on the control
                is what actually announces it, so this is hidden rather
                than read out as "star". */}
            <span aria-hidden className="ms-1 text-destructive">
              *
            </span>
          </>
        ) : null}
      </label>

      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        'aria-required': required || undefined,
      })}

      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p
          id={errorId}
          /*
           * `role="alert"` announces the message when it appears, which is
           * what you want on submit. It is on the message and not on a
           * permanent wrapper: an empty live region that exists from first
           * paint announces nothing, and a wrapper that is always there
           * re-announces on every keystroke that changes the text.
           */
          role="alert"
          className="flex items-center gap-1.5 text-xs font-medium text-destructive"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  )
}
