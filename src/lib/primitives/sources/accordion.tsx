'use client'

/**
 * <Accordion> — stacked headings that each open to reveal a panel.
 *
 *  - The header is a `<button>` INSIDE a heading, not a heading made
 *    clickable. The heading gives a screen reader a place in the document
 *    outline ("heading level 3, Shipping"); the button gives the control. A
 *    clickable `<div>` gives neither. `headingLevel` is a prop because the
 *    right level depends on the page it is dropped into, and a hard-coded
 *    `<h3>` under an `<h1>` skips a level.
 *  - `aria-expanded` and an `aria-controls` that always resolves: every panel
 *    stays mounted and is closed by height, so the reference never dangles.
 *  - A closed panel is `inert`, not just clipped to zero height. Clipping
 *    leaves its links and buttons focusable, so Tab would walk into invisible
 *    content; `inert` removes it from focus and the accessibility tree at once.
 *  - The height animation is a grid-row transition (0fr to 1fr), which
 *    animates to a height nobody had to measure, and it is off under
 *    `prefers-reduced-motion`.
 *  - Up/Down move between headers, wrapping; Home and End jump. Space and
 *    Enter are the button's own.
 *  - `single` mode keeps one open (`collapsible` decides whether it can close);
 *    `multiple` lets any number be open.
 */

import * as React from 'react'
import { ChevronDown } from 'lucide-react'

export interface AccordionItem {
  id: string
  title: string
  content: React.ReactNode
  disabled?: boolean
}

export interface AccordionProps {
  items: AccordionItem[]
  type?: 'single' | 'multiple'
  /** In `single` mode, whether the open item may be closed again. */
  collapsible?: boolean
  /** Controlled open ids. */
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (open: string[]) => void
  /** Heading level for each header, 2 to 6. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  className?: string
}

export function Accordion({
  items,
  type = 'single',
  collapsible = true,
  value,
  defaultValue = [],
  onValueChange,
  headingLevel = 3,
  className = '',
}: AccordionProps) {
  const uid = React.useId()
  const [inner, setInner] = React.useState<string[]>(defaultValue)
  const open = value ?? inner
  const buttons = React.useRef<(HTMLButtonElement | null)[]>([])
  const Heading = `h${headingLevel}` as 'h3'

  const commit = (next: string[]) => {
    if (value === undefined) setInner(next)
    onValueChange?.(next)
  }

  const toggle = (id: string) => {
    const isOpen = open.includes(id)
    if (type === 'multiple') return commit(isOpen ? open.filter((o) => o !== id) : [...open, id])
    if (isOpen) return collapsible ? commit([]) : undefined
    commit([id])
  }

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const live = items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0)
    const at = live.indexOf(index)
    let target: number | undefined
    if (e.key === 'ArrowDown') target = live[(at + 1) % live.length]
    else if (e.key === 'ArrowUp') target = live[(at - 1 + live.length) % live.length]
    else if (e.key === 'Home') target = live[0]
    else if (e.key === 'End') target = live[live.length - 1]
    if (target === undefined) return
    e.preventDefault()
    buttons.current[target]?.focus()
  }

  return (
    <div className={`divide-y divide-border rounded-xl border border-border ${className}`}>
      {items.map((item, i) => {
        const isOpen = open.includes(item.id)
        return (
          <div key={item.id}>
            <Heading className="m-0 text-base">
              <button
                ref={(el) => {
                  buttons.current[i] = el
                }}
                type="button"
                id={`${uid}-h-${item.id}`}
                aria-expanded={isOpen}
                aria-controls={`${uid}-p-${item.id}`}
                disabled={item.disabled}
                onClick={() => toggle(item.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-start text-sm font-medium transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {item.title}
                <ChevronDown
                  aria-hidden
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </Heading>
            <div
              id={`${uid}-p-${item.id}`}
              role="region"
              aria-labelledby={`${uid}-h-${item.id}`}
              className={`grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div inert={!isOpen} className="overflow-hidden">
                <div className="px-4 pb-4 text-sm text-muted-foreground">{item.content}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
