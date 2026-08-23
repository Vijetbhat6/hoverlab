'use client'

/**
 * <DataTablePagination> — page size, range summary and page controls.
 *
 * The page-number window is the fiddly part: with 200 pages you cannot
 * render 200 buttons, and naive slicing makes the control jump around as
 * you move through it. `pageWindow()` keeps a fixed-width run of numbers
 * centred on the current page, clamped at both ends, with ellipses only
 * where pages are genuinely skipped — so the control stays the same width
 * from page 1 to page 200.
 *
 * The "Showing 1–25 of 2,847" line is announced through `aria-live`,
 * because for a keyboard or screen-reader user the only feedback that a
 * page change worked is the range text.
 */

import * as React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export interface DataTablePaginationProps {
  totalItems?: number
  pageSizeOptions?: number[]
  initialPageSize?: number
  onChange?: (state: { page: number; pageSize: number }) => void
  className?: string
}

/**
 * A fixed-width run of page numbers centred on `page`.
 * Returns numbers and `'gap'` markers, never more than `span + 2` entries.
 */
function pageWindow(page: number, pageCount: number, span = 5): Array<number | 'gap'> {
  if (pageCount <= span + 2) {
    return Array.from({ length: pageCount }, (_, i) => i + 1)
  }

  const half = Math.floor(span / 2)
  let start = Math.max(1, page - half)
  const end = Math.min(pageCount, start + span - 1)

  // Re-clamp so the window keeps its width at the top end.
  start = Math.max(1, end - span + 1)

  const out: Array<number | 'gap'> = []
  if (start > 1) out.push(1, 'gap')
  for (let i = start; i <= end; i += 1) out.push(i)
  if (end < pageCount) out.push('gap', pageCount)

  return out
}

export function DataTablePagination({
  totalItems = 2847,
  pageSizeOptions = [10, 25, 50, 100],
  initialPageSize = 25,
  onChange,
  className = '',
}: DataTablePaginationProps) {
  // Per-instance ids. A literal id in a reusable component is a
  // collision waiting for the second copy on the page — and a <label>
  // then resolves to whichever input rendered first.
  const uid = React.useId()
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(initialPageSize)

  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const first = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, totalItems)

  function goTo(next: number) {
    const clamped = Math.max(1, Math.min(pageCount, next))
    setPage(clamped)
    onChange?.({ page: clamped, pageSize })
  }

  function changeSize(size: number) {
    // Keep the first visible record in view rather than resetting to page 1
    // — jumping back to the top after "show 100" loses the user's place.
    const anchor = (page - 1) * pageSize
    const nextPage = Math.floor(anchor / size) + 1
    setPageSize(size)
    setPage(nextPage)
    onChange?.({ page: nextPage, pageSize: size })
  }

  // Named `pages`, not `window` — shadowing the global inside a component
  // is legal and reliably confusing.
  const pages = pageWindow(page, pageCount)

  return (
    <div
      className={`flex flex-col items-center justify-between gap-4 border-t border-border/60 px-4 py-3 sm:flex-row ${className}`}
    >
      <div className="flex items-center gap-2 text-sm">
        <label htmlFor={`${uid}-page-size`} className="text-muted-foreground">
          Rows per page
        </label>
        <select
          id={`${uid}-page-size`}
          value={pageSize}
          onChange={(e) => changeSize(Number(e.target.value))}
          className="rounded-lg border border-border/60 bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <p aria-live="polite" className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{first.toLocaleString('en-US')}</span>–
        <span className="font-medium text-foreground">{last.toLocaleString('en-US')}</span> of{' '}
        <span className="font-medium text-foreground">{totalItems.toLocaleString('en-US')}</span>
      </p>

      <nav aria-label="Pagination" className="flex items-center gap-1">
        <PageButton onClick={() => goTo(1)} disabled={page === 1} label="First page">
          <ChevronsLeft aria-hidden className="h-4 w-4" />
        </PageButton>
        <PageButton onClick={() => goTo(page - 1)} disabled={page === 1} label="Previous page">
          <ChevronLeft aria-hidden className="h-4 w-4" />
        </PageButton>

        {pages.map((entry, i) =>
          entry === 'gap' ? (
            <span key={`gap-${i}`} aria-hidden className="px-1.5 text-sm text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => goTo(entry)}
              aria-label={`Page ${entry}`}
              aria-current={entry === page ? 'page' : undefined}
              className={`h-8 min-w-8 rounded-lg px-2 text-sm font-medium transition-colors ${
                entry === page
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {entry}
            </button>
          ),
        )}

        <PageButton onClick={() => goTo(page + 1)} disabled={page === pageCount} label="Next page">
          <ChevronRight aria-hidden className="h-4 w-4" />
        </PageButton>
        <PageButton onClick={() => goTo(pageCount)} disabled={page === pageCount} label="Last page">
          <ChevronsRight aria-hidden className="h-4 w-4" />
        </PageButton>
      </nav>
    </div>
  )
}

function PageButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  disabled: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  )
}
