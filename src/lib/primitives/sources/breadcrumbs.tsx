'use client'

/**
 * <Breadcrumbs> — where you are, as a trail back up.
 *
 *  - A `<nav aria-label="Breadcrumb">` around an ordered list. The list is
 *    what tells a screen reader "list, 4 items"; the ordering is what makes
 *    the trail a sequence and not a pile of links.
 *  - The last crumb is the current page: plain text with `aria-current="page"`,
 *    not a link to itself. A link you can follow to the page you are already
 *    on is a small lie repeated on every page of a site.
 *  - Long trails collapse the middle to a "…" button, and the button is a real
 *    button: it announces how many levels it hides, and on activation it
 *    reveals them AND moves focus to the first revealed crumb. Removing the
 *    button you just pressed without moving focus drops a keyboard user back
 *    at the top of the page.
 *  - The separator is decoration. It is `aria-hidden`, so the trail is not
 *    read as "Home, chevron, Products, chevron", and it mirrors in a
 *    right-to-left document because it points along the reading direction.
 */

import * as React from 'react'
import { ChevronRight } from 'lucide-react'

export interface Crumb {
  label: string
  /** Omit on the last crumb, and on any crumb that is not a page. */
  href?: string
}

export interface BreadcrumbsProps {
  items: Crumb[]
  /** Most crumbs shown before the middle collapses. Minimum 3. */
  maxVisible?: number
  label?: string
  className?: string
}

export function Breadcrumbs({
  items,
  maxVisible = 4,
  label = 'Breadcrumb',
  className = '',
}: BreadcrumbsProps) {
  const [expanded, setExpanded] = React.useState(false)
  const firstRevealed = React.useRef<HTMLAnchorElement | null>(null)
  const limit = Math.max(3, maxVisible)
  const collapsed = !expanded && items.length > limit

  // Keep the first crumb and the last (limit - 2), which is the trail a person
  // most wants: the root, and the few levels nearest where they are.
  const tail = limit - 2
  const hidden = collapsed ? items.slice(1, items.length - tail) : []
  const shown = collapsed ? [items[0], null, ...items.slice(items.length - tail)] : items

  const wasCollapsed = React.useRef(collapsed)
  React.useEffect(() => {
    if (wasCollapsed.current && !collapsed) firstRevealed.current?.focus()
    wasCollapsed.current = collapsed
  }, [collapsed])

  return (
    <nav aria-label={label} className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {shown.map((crumb, i) => {
          const last = i === shown.length - 1
          const key = crumb ? `${crumb.label}-${i}` : 'collapsed'
          return (
            <li key={key} className="flex min-w-0 items-center gap-1.5">
              {crumb === null ? (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  aria-label={`Show ${hidden.length} hidden ${hidden.length === 1 ? 'level' : 'levels'}`}
                  className="rounded px-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  …
                </button>
              ) : last ? (
                <span aria-current="page" className="truncate font-medium text-foreground" title={crumb.label}>
                  {crumb.label}
                </span>
              ) : (
                <a
                  ref={expanded && i === 1 ? firstRevealed : undefined}
                  href={crumb.href ?? '#'}
                  className="truncate rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  title={crumb.label}
                >
                  {crumb.label}
                </a>
              )}
              {last ? null : (
                <ChevronRight
                  aria-hidden
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70 rtl:rotate-180"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
