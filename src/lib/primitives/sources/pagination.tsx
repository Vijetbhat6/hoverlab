'use client'

/**
 * <Pagination> — previous, a window of page numbers, next.
 *
 *  - `pageWindow()` is the part worth stealing. It always keeps the first and
 *    last page, keeps `siblings` pages either side of the current one, and
 *    collapses the rest to an ellipsis — except that a gap of exactly ONE page
 *    is drawn as that page, never as "…", because an ellipsis standing in for
 *    a single number is longer to read than the number. The width is also
 *    constant while you page, so the control does not jitter under the cursor.
 *  - Two modes from one component. Give it `getHref` and every page is a real
 *    `<a>`: crawlable, middle-clickable, and it works with JavaScript off,
 *    which is what a listing that wants to be indexed needs. Omit it and they
 *    are buttons calling `onPageChange`.
 *  - Numbered links are named "Page 3" rather than just "3", and the current
 *    one is `aria-current="page"`. A polite live line says "Page 3 of 20" when
 *    the page changes, because the content swapping is otherwise silent.
 *  - The first/last "disabled" states are `aria-disabled` on links (a disabled
 *    link does not exist) and `disabled` on buttons.
 */

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type PageItem = number | 'gap-start' | 'gap-end'

/**
 * The visible page numbers for `current` of `total`.
 * `siblings` is how many neighbours to keep on each side of the current page.
 */
export function pageWindow(current: number, total: number, siblings = 1): PageItem[] {
  const count = Math.max(0, Math.floor(total))
  if (count === 0) return []
  const page = Math.min(Math.max(1, Math.floor(current)), count)
  const s = Math.max(0, Math.floor(siblings))

  // first + last + current + a sibling run each side + two gaps.
  const width = 2 * s + 5
  if (count <= width) return Array.from({ length: count }, (_, i) => i + 1)

  /*
   * Every window is exactly `width` cells, wherever the current page is.
   * That is what stops the control changing size under the cursor as you
   * click through it, and it is why the two ends are not just the middle case
   * with the gap left out: near an edge the run of numbers grows to fill the
   * cells the missing gap would have used.
   *
   * The edges start where the left gap would hide fewer than TWO pages (page
   * `s + 3`), because an ellipsis for one page is longer than the page.
   */
  const run = (from: number, to: number): PageItem[] =>
    Array.from({ length: to - from + 1 }, (_, i) => from + i)

  if (page <= s + 3) return [...run(1, 2 * s + 3), 'gap-end', count]
  if (page >= count - s - 2) return [1, 'gap-start', ...run(count - 2 * s - 2, count)]
  return [1, 'gap-start', ...run(page - s, page + s), 'gap-end', count]
}

export interface PaginationProps {
  page: number
  pageCount: number
  onPageChange?: (page: number) => void
  /** Build a URL for a page to render links instead of buttons. */
  getHref?: (page: number) => string
  siblings?: number
  /**
   * Draw the words "Previous" and "Next" beside the arrows. Off by default:
   * with a full window of numbers they do not fit a narrow column, and a pager
   * that wraps its Next button onto a line of its own is worse than one with
   * two arrows. Their accessible names ("Previous page", "Next page") are the
   * same either way. On a phone, `siblings={0}` also saves two cells.
   */
  labels?: boolean
  label?: string
  className?: string
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  getHref,
  siblings = 1,
  labels = false,
  label = 'Pagination',
  className = '',
}: PaginationProps) {
  if (pageCount < 1) return null
  const current = Math.min(Math.max(1, page), pageCount)
  const items = pageWindow(current, pageCount, siblings)

  const base =
    'inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
  const idle = 'text-muted-foreground hover:bg-muted hover:text-foreground'

  const control = (
    target: number,
    content: React.ReactNode,
    opts: { name: string; active?: boolean; disabled?: boolean },
  ) => {
    const cls = `${base} ${opts.active ? 'bg-primary text-primary-foreground' : opts.disabled ? 'pointer-events-none opacity-40' : idle}`
    if (getHref) {
      return (
        <a
          href={opts.disabled ? undefined : getHref(target)}
          aria-label={opts.name}
          aria-current={opts.active ? 'page' : undefined}
          aria-disabled={opts.disabled || undefined}
          tabIndex={opts.disabled ? -1 : undefined}
          className={cls}
          onClick={(e) => {
            if (opts.disabled) return e.preventDefault()
            if (onPageChange) {
              e.preventDefault()
              onPageChange(target)
            }
          }}
        >
          {content}
        </a>
      )
    }
    return (
      <button
        type="button"
        aria-label={opts.name}
        aria-current={opts.active ? 'page' : undefined}
        disabled={opts.disabled}
        onClick={() => onPageChange?.(target)}
        className={cls}
      >
        {content}
      </button>
    )
  }

  return (
    <nav aria-label={label} className={`relative ${className}`}>
      <ul className="flex flex-wrap items-center gap-1">
        <li>
          {control(
            current - 1,
            <>
              <ChevronLeft aria-hidden className="h-4 w-4 rtl:rotate-180" />
              {labels ? <span>Previous</span> : null}
            </>,
            { name: 'Previous page', disabled: current <= 1 },
          )}
        </li>
        {items.map((item) =>
          typeof item === 'number' ? (
            <li key={item}>
              {control(item, item, { name: `Page ${item}`, active: item === current })}
            </li>
          ) : (
            <li key={item} aria-hidden className="px-1 text-muted-foreground">
              …
            </li>
          ),
        )}
        <li>
          {control(
            current + 1,
            <>
              {labels ? <span>Next</span> : null}
              <ChevronRight aria-hidden className="h-4 w-4 rtl:rotate-180" />
            </>,
            { name: 'Next page', disabled: current >= pageCount },
          )}
        </li>
      </ul>
      <p role="status" className="sr-only">
        Page {current} of {pageCount}
      </p>
    </nav>
  )
}
