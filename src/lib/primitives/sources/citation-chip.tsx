/**
 * <CitationChip> — one numbered source reference, inline in the prose or as
 * a card under it.
 *
 * **The numeral is not the accessible name.** A citation rendered as
 * `<sup><a href="…">1</a></sup>` is announced as "link, one". In a list of
 * links — which is how many people navigate a page — it is one of eight
 * entries all called a digit, and choosing between them is impossible. So
 * the visible text stays the numeral the prose refers to, and the
 * `aria-label` carries what the link actually goes to.
 *
 * **`<cite>` is the element for the title of a referenced work.** It is one
 * of the few HTML elements that means precisely the thing being marked up
 * here, and it costs nothing to use correctly.
 *
 * **There is no hover card.** The obvious design puts the snippet in a
 * tooltip, which is unreachable by touch, needs a focus and dismissal
 * contract to satisfy 1.4.13, and hides the one piece of text that would
 * let a reader judge the source without leaving the page. The `card`
 * variant puts the snippet on the page instead. If you want the popover,
 * build it around this — but the default should not be the version that
 * only works with a mouse.
 *
 * **New tabs announce themselves.** `target="_blank"` without a warning is
 * a 3.2.5 failure: the back button stops working and nobody said why.
 */

import * as React from 'react'

export interface CitationChipProps {
  /** The number the prose refers to. Rendered visibly; never the whole name. */
  index: number
  title: string
  href?: string
  /** The publication or domain — "arxiv.org", "Internal wiki". */
  source?: string
  /** Shown in the `card` variant, ignored inline. */
  snippet?: string
  variant?: 'inline' | 'card'
  /** Opens in a new tab, with the warning that obliges. */
  newTab?: boolean
  className?: string
}

export function CitationChip({
  index,
  title,
  href,
  source,
  snippet,
  variant = 'inline',
  newTab = false,
  className = '',
}: CitationChipProps) {
  const accessibleName = source ? `Source ${index}: ${title}, ${source}` : `Source ${index}: ${title}`
  const external = newTab && href ? { target: '_blank', rel: 'noreferrer' } : {}

  if (variant === 'inline') {
    const chip = (
      <>
        {index}
        <span className="sr-only">
          {` ${accessibleName}`}
          {newTab && href ? ' (opens in a new tab)' : ''}
        </span>
      </>
    )

    return (
      <sup className={['mx-0.5 align-super', className].filter(Boolean).join(' ')}>
        {href ? (
          <a
            href={href}
            aria-label={accessibleName + (newTab ? ' (opens in a new tab)' : '')}
            {...external}
            className="inline-grid size-[1.15em] place-items-center rounded-[0.25em] bg-muted text-[0.7em] font-medium leading-none tabular-nums text-muted-foreground no-underline transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
          >
            {index}
          </a>
        ) : (
          <span className="inline-grid size-[1.15em] place-items-center rounded-[0.25em] bg-muted text-[0.7em] font-medium leading-none tabular-nums text-muted-foreground">
            {chip}
          </span>
        )}
      </sup>
    )
  }

  return (
    <div
      className={[
        // `relative` is load-bearing: the title link stretches over the whole
        // card with `after:inset-0`, and an absolute child with no positioned
        // ancestor anchors to the page instead.
        'relative flex gap-2.5 rounded-lg border border-border bg-card p-2.5',
        href ? 'transition-colors hover:border-primary/40' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 grid size-5 shrink-0 place-items-center rounded bg-muted text-[11px] font-medium tabular-nums text-muted-foreground"
      >
        {index}
      </span>

      <div className="min-w-0 flex-1">
        <cite className="block truncate text-sm font-medium not-italic text-foreground">
          {href ? (
            <a
              href={href}
              aria-label={accessibleName + (newTab ? ' (opens in a new tab)' : '')}
              {...external}
              className="no-underline outline-none after:absolute after:inset-0 hover:underline focus-visible:underline"
            >
              {title}
            </a>
          ) : (
            title
          )}
        </cite>
        {source ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{source}</p> : null}
        {snippet ? (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {snippet}
          </p>
        ) : null}
      </div>
    </div>
  )
}
