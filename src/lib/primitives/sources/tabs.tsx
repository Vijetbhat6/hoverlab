'use client'

/**
 * <Tabs> — one panel visible at a time, chosen from a row of labels.
 *
 * The keyboard contract is the whole component. A tab list is ONE tab stop:
 * Tab moves into it, lands on the selected tab, and the next Tab leaves —
 * straight to the panel, not through every other tab. Arrow keys move between
 * tabs, Home and End jump to the ends. That is the roving-tabindex pattern
 * below, and it is why the unselected tabs have `tabIndex={-1}`.
 *
 * TWO ACTIVATION MODES, BECAUSE THEY ARE DIFFERENT PROMISES
 *
 *  - `auto` (default): arrowing onto a tab selects it. Right when showing the
 *    panel is instant and free.
 *  - `manual`: arrowing only moves focus; Enter or Space selects. Right when
 *    a panel is expensive — a network request, a chart — because otherwise a
 *    keyboard user who arrows across five tabs to reach the last one fires
 *    four requests they never wanted.
 *
 * Arrow keys follow reading direction: in a right-to-left document the next
 * tab is to the LEFT, so ArrowLeft goes forward. Vertical tabs use Up/Down,
 * which have no direction to reverse.
 *
 * Every id is rooted in `useId()`. The panel is always in the DOM, hidden when
 * inactive, so `aria-controls` never points at nothing; only the selected
 * panel's CONTENT is mounted.
 */

import * as React from 'react'

export interface TabItem {
  id: string
  label: string
  content: React.ReactNode
  disabled?: boolean
  /** A count or short status shown after the label, e.g. "3". */
  badge?: string | number
}

export interface TabsProps {
  items: TabItem[]
  /** Controlled selection. Omit it to let the component keep its own. */
  value?: string
  defaultValue?: string
  onValueChange?: (id: string) => void
  activation?: 'auto' | 'manual'
  orientation?: 'horizontal' | 'vertical'
  /** Names the tab list for assistive tech — "Project sections". */
  label: string
  className?: string
}

export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  activation = 'auto',
  orientation = 'horizontal',
  label,
  className = '',
}: TabsProps) {
  const uid = React.useId()
  const firstEnabled = items.find((t) => !t.disabled)?.id ?? items[0]?.id
  const [inner, setInner] = React.useState(defaultValue ?? firstEnabled)
  const selectedId = value ?? inner
  // Focus and selection are separate in manual mode, so track focus itself.
  const [focusId, setFocusId] = React.useState(selectedId)
  const refs = React.useRef(new Map<string, HTMLButtonElement>())

  const select = (id: string) => {
    if (value === undefined) setInner(id)
    onValueChange?.(id)
  }

  const enabled = items.filter((t) => !t.disabled)

  const focusTab = (id: string) => {
    setFocusId(id)
    refs.current.get(id)?.focus()
    if (activation === 'auto') select(id)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const rtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl'
    const horizontal = orientation === 'horizontal'
    const next = horizontal ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown'
    const prev = horizontal ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp'
    const at = enabled.findIndex((t) => t.id === focusId)

    let target: TabItem | undefined
    if (e.key === next) target = enabled[(at + 1) % enabled.length]
    else if (e.key === prev) target = enabled[(at - 1 + enabled.length) % enabled.length]
    else if (e.key === 'Home') target = enabled[0]
    else if (e.key === 'End') target = enabled[enabled.length - 1]
    if (!target) return
    e.preventDefault()
    focusTab(target.id)
  }

  const vertical = orientation === 'vertical'

  return (
    <div className={`${vertical ? 'flex gap-6' : ''} ${className}`}>
      <div
        role="tablist"
        aria-label={label}
        aria-orientation={orientation}
        onKeyDown={onKeyDown}
        className={
          vertical
            ? 'flex w-44 shrink-0 flex-col border-s border-border'
            : 'flex overflow-x-auto border-b border-border [scrollbar-width:none]'
        }
      >
        {items.map((tab) => {
          const selected = tab.id === selectedId
          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) refs.current.set(tab.id, el)
                else refs.current.delete(tab.id)
              }}
              type="button"
              role="tab"
              id={`${uid}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${uid}-panel-${tab.id}`}
              disabled={tab.disabled}
              tabIndex={tab.id === focusId || (!items.some((t) => t.id === focusId) && selected) ? 0 : -1}
              onClick={() => {
                setFocusId(tab.id)
                select(tab.id)
              }}
              className={[
                'inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium',
                'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                'disabled:cursor-not-allowed disabled:opacity-50',
                vertical ? '-ms-px border-s-2 text-start' : '-mb-px border-b-2',
                selected
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {tab.label}
              {tab.badge !== undefined ? (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      <div className={vertical ? 'min-w-0 flex-1' : ''}>
        {items.map((tab) => {
          const selected = tab.id === selectedId
          return (
            <div
              key={tab.id}
              role="tabpanel"
              id={`${uid}-panel-${tab.id}`}
              aria-labelledby={`${uid}-tab-${tab.id}`}
              hidden={!selected}
              // A panel with nothing focusable in it still needs to be
              // reachable, or a keyboard user can never get to its text.
              tabIndex={0}
              className="py-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {selected ? tab.content : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
