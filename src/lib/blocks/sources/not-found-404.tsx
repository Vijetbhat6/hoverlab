/**
 * <NotFound404> — a 404 page that does something useful.
 *
 * Most 404s are a big number and a link home, which helps nobody: the user
 * arrived at a specific URL wanting a specific thing, and "go to the
 * homepage" makes them start their search over.
 *
 * This one offers the three routes that actually resolve the situation —
 * search, a short list of likely destinations, and going back — with home
 * as the fallback rather than the headline.
 *
 * Server component. The search field is a real GET form, so it works
 * before hydration and on a page that never hydrates at all.
 */

import * as React from 'react'
import { Search, ArrowLeft, House, ArrowRight } from 'lucide-react'

export interface SuggestedLink {
  label: string
  description: string
  href: string
}

export interface NotFound404Props {
  code?: string
  title?: string
  description?: string
  searchAction?: string
  links?: SuggestedLink[]
  homeHref?: string
  /**
   * Id for the field. A server component cannot call `useId`, so this is
   * the escape hatch for a page that renders two of these: give the second
   * one its own id rather than letting both labels resolve to the first.
   */
  inputId?: string
  className?: string
}

const DEFAULT_LINKS: SuggestedLink[] = [
  { label: 'Documentation', description: 'Guides and API reference', href: '/docs' },
  { label: 'Dashboard', description: 'Your projects and settings', href: '/dashboard' },
  { label: 'Status', description: 'Current uptime and incidents', href: '/status' },
]

export function NotFound404({
  code = '404',
  title = 'We could not find that page',
  description = 'The link may be out of date, or the page may have moved. Here are a few ways forward.',
  searchAction = '/search',
  inputId = 'notfound-search',
  links = DEFAULT_LINKS,
  homeHref = '/',
  className = '',
}: NotFound404Props) {
  return (
    <div
      className={`mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-16 text-center ${className}`}
    >
      <span
        aria-hidden
        className="bg-gradient-to-br from-primary to-emerald-500 bg-clip-text text-7xl font-extrabold tracking-tighter text-transparent sm:text-8xl"
      >
        {code}
      </span>

      <h1 className="mt-4 text-balance text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 max-w-md text-pretty text-muted-foreground">{description}</p>

      {/* A real GET form — no JavaScript required. */}
      <form action={searchAction} method="get" className="mt-8 flex w-full max-w-md gap-2">
        <div className="relative flex-1">
          <label htmlFor={inputId} className="sr-only">
            Search the site
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id={inputId}
            name="q"
            type="search"
            placeholder="Search for what you were looking for"
            className="w-full rounded-xl border border-border/60 bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Search
        </button>
      </form>

      {links.length > 0 ? (
        <ul className="mt-8 w-full max-w-md divide-y divide-border/40 overflow-hidden rounded-2xl border border-border/60 bg-card/60 text-left">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{link.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {link.description}
                  </span>
                </span>
                <ArrowRight
                  aria-hidden
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                />
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
        {/* Plain anchor so it works without a router; swap for your Link. */}
        <a
          href={homeHref}
          className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <House aria-hidden className="h-4 w-4" />
          Back to home
        </a>
        <span aria-hidden className="text-border">
          |
        </span>
        <a
          href={homeHref}
          className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Previous page
        </a>
      </div>
    </div>
  )
}
