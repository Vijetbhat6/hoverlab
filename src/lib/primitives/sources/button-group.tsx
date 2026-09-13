/**
 * <ButtonGroup> — buttons joined into one control.
 *
 * Three details decide whether this looks built or bodged, and all three
 * are why people get it wrong by hand:
 *
 *   1. The rounding is on the ENDS, not on each button, and it has to be
 *      logical — `rounded-s-lg` / `rounded-e-lg`. Physical `rounded-l`
 *      puts the flat edge on the outside of the group in Arabic.
 *   2. Adjacent borders must collapse. Two 1px borders meeting make a 2px
 *      seam that is visibly heavier than the outer edge; the fix is a
 *      negative inline-start margin on every button after the first.
 *   3. The pressed button has to paint ABOVE its neighbours, or its focus
 *      ring is clipped by the button next to it. `z-10` on hover/focus.
 *
 * This is a group of independent actions — `role="group"`, each child a
 * plain button. If exactly one child can be active at a time, that is a
 * different control with different semantics, and it is `SegmentedControl`.
 * Using this one for that case means a screen reader announces three
 * buttons and never says which is chosen.
 */

import * as React from 'react'

export interface ButtonGroupItem {
  /** Stable key and the value reported to `onAction`. */
  value: string
  label?: React.ReactNode
  icon?: React.ReactNode
  /** Required when the item has no visible label. */
  'aria-label'?: string
  disabled?: boolean
}

export interface ButtonGroupProps {
  items: ButtonGroupItem[]
  onAction?: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md'
  /** Names the group for assistive tech, e.g. "Text alignment". */
  label: string
  className?: string
}

export function ButtonGroup({
  items,
  onAction,
  orientation = 'horizontal',
  size = 'md',
  label,
  className = '',
}: ButtonGroupProps) {
  const vertical = orientation === 'vertical'

  return (
    <div
      role="group"
      aria-label={label}
      className={[
        'inline-flex',
        vertical ? 'flex-col' : 'flex-row',
        'isolate',
        className,
      ].join(' ')}
    >
      {items.map((item, i) => {
        const first = i === 0
        const last = i === items.length - 1

        return (
          <button
            key={item.value}
            type="button"
            disabled={item.disabled}
            aria-label={item['aria-label']}
            onClick={() => onAction?.(item.value)}
            className={[
              'relative inline-flex items-center justify-center gap-1.5 border border-border',
              'bg-background font-medium text-foreground transition-colors',
              'hover:bg-muted/70 focus-visible:z-10 focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:pointer-events-none disabled:opacity-50',
              size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-9 px-3 text-sm',
              // Logical radii: the ends of the group, whichever way the
              // document reads.
              vertical
                ? [first ? 'rounded-t-lg' : '', last ? 'rounded-b-lg' : ''].join(' ')
                : [first ? 'rounded-s-lg' : '', last ? 'rounded-e-lg' : ''].join(' '),
              // Collapse the shared border. `-ms-px` is the inline-start
              // margin, so it stays the *shared* edge under RTL.
              first ? '' : vertical ? '-mt-px' : '-ms-px',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {item.icon}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
