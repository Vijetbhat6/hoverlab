'use client'

/**
 * <InputGroup> — an input with something attached to it.
 *
 * Four shapes, and they are not interchangeable:
 *
 *   addon    a bordered box sharing the input's edge — "https://", ".com",
 *            a currency, a unit. Static text, not interactive.
 *   icon     a glyph INSIDE the field, with padding reserved for it. The
 *            common bug is forgetting the padding, so the caret starts
 *            underneath the magnifier.
 *   action   a button inside the trailing edge — clear, reveal password,
 *            copy. Must be reachable by keyboard and must not be reached
 *            before the input it belongs to.
 *   select   a control sharing the edge, like a country code.
 *
 * Everything here is logical-direction. `ps-9` reserves space at the
 * *start* of the text, so in Arabic the icon and its padding both move to
 * the right together — the physical version puts the icon on the right and
 * leaves the hole on the left.
 *
 * The focus ring is on the group, not the input. A ring around only the
 * middle third of a joined control looks like a rendering bug, so the input
 * drops its own ring and the wrapper grows one via `focus-within`.
 */

import * as React from 'react'

export interface InputGroupProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /** Bordered box before the field — "https://", "$", "+44". */
  addonStart?: React.ReactNode
  /** Bordered box after the field — ".com", "USD", "/month". */
  addonEnd?: React.ReactNode
  /** Glyph inside the field at the start. Padding is reserved for it. */
  iconStart?: React.ReactNode
  /** Interactive control inside the field at the end — clear, reveal, copy. */
  action?: React.ReactNode
  invalid?: boolean
  className?: string
}

export function InputGroup({
  addonStart,
  addonEnd,
  iconStart,
  action,
  invalid = false,
  className = '',
  disabled,
  ...rest
}: InputGroupProps) {
  return (
    <div
      className={[
        'flex w-full items-stretch rounded-lg border bg-background text-sm',
        'transition-shadow focus-within:ring-2 focus-within:ring-ring',
        invalid ? 'border-destructive' : 'border-border',
        disabled ? 'opacity-60' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {addonStart ? <Addon side="start">{addonStart}</Addon> : null}

      <div className="relative flex min-w-0 flex-1 items-center">
        {iconStart ? (
          <span
            aria-hidden
            // `start-0` and `ps-3` rather than `left-0`/`pl-3`: the icon
            // and the padding that makes room for it have to move together
            // when the document direction flips.
            className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-muted-foreground"
          >
            {iconStart}
          </span>
        ) : null}

        <input
          disabled={disabled}
          className={[
            'w-full border border-transparent bg-transparent py-2 text-foreground outline-none',
            'placeholder:text-muted-foreground disabled:cursor-not-allowed',
            iconStart ? 'ps-9' : 'ps-3',
            action ? 'pe-1' : 'pe-3',
          ].join(' ')}
          {...rest}
        />

        {action ? <span className="flex items-center pe-1.5">{action}</span> : null}
      </div>

      {addonEnd ? <Addon side="end">{addonEnd}</Addon> : null}
    </div>
  )
}

/**
 * The bordered box on one end.
 *
 * Its own border is only on the edge it shares with the input, and the
 * group's border draws the rest — two full borders meeting would double up
 * into a heavier seam than the outer edge.
 */
function Addon({ side, children }: { side: 'start' | 'end'; children: React.ReactNode }) {
  return (
    <span
      className={[
        'inline-flex shrink-0 select-none items-center bg-muted/50 px-3',
        'text-sm text-muted-foreground',
        side === 'start' ? 'rounded-s-lg border-e border-border' : 'rounded-e-lg border-s border-border',
      ].join(' ')}
    >
      {children}
    </span>
  )
}
