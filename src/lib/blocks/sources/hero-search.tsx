/**
 * <HeroSearch> — a hero whose primary call to action is a search field.
 *
 * The hero for a marketplace, directory or docs site: products where the
 * visitor already knows what they want and the worst thing you can do is
 * make them hunt for the search box below the fold.
 *
 * The form is a real `<form role="search">` with a labelled input, not a
 * decorative box. A search hero that only *looks* like search is the one
 * case where the drawing costs something real — someone tabbing into it
 * expects to type and press Enter.
 *
 * The suggestion chips underneath are buttons, not links: they fill the
 * field rather than navigating, which is why the whole thing keeps local
 * state and carries `'use client'`.
 */

'use client'

import * as React from 'react'
import { Search, TrendingUp } from 'lucide-react'

export interface HeroSearchProps {
  heading?: string
  subheading?: string
  placeholder?: string
  submitLabel?: string
  /** Prefilled queries offered under the field. */
  suggestions?: string[]
  /** Called with the query on submit. Defaults to a no-op. */
  onSearch?: (query: string) => void
  className?: string
}

const DEFAULT_SUGGESTIONS = ['Dashboards', 'Auth flows', 'Pricing tables', 'Empty states']

export function HeroSearch({
  heading = 'Find the component you were about to build.',
  subheading = 'Six hundred production-ready sections, searchable by what they do rather than what they are called.',
  placeholder = 'Search components, patterns, categories…',
  submitLabel = 'Search',
  suggestions = DEFAULT_SUGGESTIONS,
  onSearch,
  className = '',
}: HeroSearchProps) {
  const [query, setQuery] = React.useState('')

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    onSearch?.(query)
  }

  return (
    <section className={`relative overflow-hidden ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
        <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          {heading}
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          {subheading}
        </p>

        <form
          role="search"
          onSubmit={handleSubmit}
          className="mx-auto mt-9 flex w-full max-w-xl flex-col gap-2 sm:flex-row"
        >
          <div className="relative flex-1">
            <label htmlFor="hero-search-input" className="sr-only">
              Search
            </label>
            <Search
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="hero-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-xl border border-border/60 bg-card/70 py-3.5 pl-11 pr-4 text-sm shadow-sm backdrop-blur transition-colors placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {submitLabel}
          </button>
        </form>

        {suggestions.length > 0 ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp aria-hidden className="h-3.5 w-3.5" />
              Popular
            </span>
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setQuery(s)}
                className="rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
