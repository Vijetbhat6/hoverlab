/**
 * <SearchResultsPanel> — the page-level search surface, grouped by section.
 *
 * A flat ranked list makes users read snippets to figure out what each
 * result even is. Grouping by section with a visible breadcrumb path
 * flips that: people recognise *where* a result lives ("Docs › Auth")
 * far faster than they parse a sentence of context, so the eye jumps to
 * the right group and reads two rows instead of ten. The match itself is
 * a real <mark> — semantic highlighting, styled with tokens so it
 * survives dark mode instead of becoming browser-default yellow on navy.
 *
 * The footer row is deliberate: the worst search outcome is a dead end,
 * so "no luck" always routes somewhere a human answers.
 */

import * as React from 'react'
import { ChevronRight, LifeBuoy, Search } from 'lucide-react'

export interface SearchResult {
  title: string
  /** Breadcrumb segments, e.g. ['Docs', 'Authentication']. */
  path: string[]
  /** Snippet split around the matched term: [before, match, after]. */
  snippet: [string, string, string]
  href?: string
}

export interface SearchResultGroup {
  section: string
  results: SearchResult[]
}

export interface SearchResultsPanelProps {
  query?: string
  groups?: SearchResultGroup[]
  supportHref?: string
  className?: string
}

const DEFAULT_GROUPS: SearchResultGroup[] = [
  {
    section: 'Docs',
    results: [
      {
        title: 'Rotating API keys without downtime',
        path: ['Docs', 'Authentication'],
        snippet: ['Create the replacement ', 'API key', ' first, then revoke the old one after the grace window.'],
        href: '#',
      },
      {
        title: 'Environment variables and secrets',
        path: ['Docs', 'Configuration'],
        snippet: ['Never commit an ', 'API key', ' to source control; load it from the environment at boot.'],
        href: '#',
      },
    ],
  },
  {
    section: 'API reference',
    results: [
      {
        title: 'POST /v1/keys',
        path: ['API', 'Keys'],
        snippet: ['Issues a new ', 'API key', ' scoped to the requesting workspace. Returns the secret once.'],
        href: '#',
      },
      {
        title: 'Error 401: invalid_key',
        path: ['API', 'Errors'],
        snippet: ['Returned when the ', 'API key', ' is missing, expired, or was revoked on 12 Jul 2026.'],
        href: '#',
      },
    ],
  },
  {
    section: 'Guides',
    results: [
      {
        title: 'Shipping your first integration',
        path: ['Guides', 'Getting started'],
        snippet: ['Grab a test-mode ', 'API key', ' from the dashboard — it takes about two minutes.'],
        href: '#',
      },
    ],
  },
]

const FILTERS: Array<{ label: string; count: number; active?: boolean }> = [
  { label: 'All', count: 5, active: true },
  { label: 'Docs', count: 2 },
  { label: 'API', count: 2 },
  { label: 'Guides', count: 1 },
]

export function SearchResultsPanel({
  query = 'API key',
  groups = DEFAULT_GROUPS,
  supportHref = '#',
  className = '',
}: SearchResultsPanelProps) {
  const total = groups.reduce((sum, group) => sum + group.results.length, 0)

  return (
    <section className={`mx-auto w-full max-w-2xl ${className}`}>
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          defaultValue={query}
          aria-label="Search documentation"
          className="w-full rounded-xl border border-border/60 bg-background py-3 ps-11 pe-24 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground">
          {total} results
        </span>
      </div>

      <ul className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <li key={filter.label}>
            <a
              href="#"
              aria-current={filter.active ? 'true' : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                filter.active
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {filter.label}
              <span className="tabular-nums opacity-70">{filter.count}</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-6">
        {groups.map((group) => (
          <div key={group.section}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.section}
            </h3>
            <ul className="mt-2 divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card/60">
              {group.results.map((result) => (
                <li key={result.title}>
                  <a
                    href={result.href ?? '#'}
                    className="block px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <p className="text-sm font-semibold text-card-foreground">{result.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      {result.path.map((segment, i) => (
                        <React.Fragment key={segment}>
                          {i > 0 ? (
                            <ChevronRight aria-hidden className="h-3 w-3 shrink-0" />
                          ) : null}
                          <span>{segment}</span>
                        </React.Fragment>
                      ))}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {result.snippet[0]}
                      <mark className="rounded-sm bg-primary/15 px-0.5 font-medium text-foreground">
                        {result.snippet[1]}
                      </mark>
                      {result.snippet[2]}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <a
        href={supportHref}
        className="mt-6 flex items-center gap-3 rounded-xl border border-dashed border-border/60 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
      >
        <LifeBuoy aria-hidden className="h-4 w-4 shrink-0" />
        No luck? Ask support — a human replies within a working day.
      </a>
    </section>
  )
}
