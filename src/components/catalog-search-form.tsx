/**
 * The catalog search box, in the one shape it has everywhere.
 *
 * /browse already had this and it is the best search on the site — it
 * covers all four rungs and ranks them against each other. The problem was
 * that nothing pointed at it. The front door offered "Create your free
 * account" and "I already have an account", so the first thing a visitor
 * saw was a signup decision about a catalog they had not been shown, and
 * /browse was the eighth item in a nav they had to notice first.
 *
 * A plain GET form, deliberately: it works before JavaScript, it produces a
 * shareable URL, and — the reason it can live in the landing page's hero —
 * it costs nothing. Searching from here is a navigation, so the landing
 * page never imports the 772 KB effect index to offer a search box.
 *
 * Server component. No hooks, no state, no client bundle.
 */

import { Search } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface CatalogSearchFormProps {
  /** Prefills the input, so /browse can echo the active query back. */
  defaultValue?: string
  /**
   * Level to keep selected across a new search, when one is active.
   * Rendered as a hidden field — the form posts to the bare /browse URL.
   */
  level?: string
  placeholder?: string
  /** `lg` for the landing hero, `md` for the /browse toolbar. */
  size?: 'md' | 'lg'
  /** Labels the field for screen readers. Visually hidden. */
  label?: string
  className?: string
}

export function CatalogSearchForm({
  defaultValue = '',
  level,
  placeholder = 'pricing, glassmorphism, dashboard…',
  size = 'md',
  label = 'Search the catalog',
  className,
}: CatalogSearchFormProps) {
  const big = size === 'lg'

  return (
    <form
      action="/browse"
      method="get"
      className={cn('flex w-full gap-2', className)}
      role="search"
    >
      {level ? <input type="hidden" name="level" value={level} /> : null}

      <div className="relative flex-1">
        <Search
          aria-hidden
          className={cn(
            'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground',
            big ? 'h-5 w-5' : 'h-4 w-4',
          )}
        />
        <label htmlFor="browse-q" className="sr-only">
          {label}
        </label>
        <input
          id="browse-q"
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-xl border border-border/60 bg-card/60 pr-3 placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/30',
            big ? 'h-14 pl-11 text-base' : 'h-11 pl-10 text-sm',
          )}
        />
      </div>

      <button
        type="submit"
        className={cn(
          'shrink-0 rounded-xl bg-primary font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          big ? 'h-14 px-7 text-base' : 'h-11 px-5 text-sm',
        )}
      >
        Search
      </button>
    </form>
  )
}
