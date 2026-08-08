/**
 * <FooterMega> — brand column, four link columns, newsletter, legal bar.
 *
 * The footer of a site that has enough pages to need one. Its real job is
 * not decoration: it is the only place every page links to every section,
 * which is what lets a crawler that landed deep in the site reach the rest
 * of it — and what lets a visitor who scrolled past what they wanted find
 * it without going back to the nav.
 *
 * Structure that matters more than it looks:
 *
 *  - Each column is a `<nav>` with an `aria-labelledby` pointing at its own
 *    heading, so a screen reader announces "Product navigation" rather than
 *    four unlabelled lists of links.
 *  - The headings are real `<h2>`s. A footer built from styled divs is
 *    invisible to anyone navigating by heading, which is most of the point
 *    of having one.
 *  - Social links carry visible-to-assistive-tech names; an icon-only link
 *    with no accessible name is announced as its URL.
 *
 * No client JavaScript: it is links, and a footer that hydrates on every
 * page to render links is a cost with nothing on the other side of it. If
 * you want an email capture down here, reach for <FooterNewsletter>, which
 * is this layout with the form and the `'use client'` that comes with it.
 *
 * `year` defaults to the current year, which for a statically rendered page
 * means the year it was built. Pass it explicitly if you rebuild rarely.
 */

import * as React from 'react'
import { Github, Linkedin, Twitter, Youtube } from 'lucide-react'

export interface FooterLink {
  label: string
  href: string
  /** Renders a small chip beside the link — "New", "Beta". */
  badge?: string
}

export interface FooterColumn {
  heading: string
  links: FooterLink[]
}

export interface FooterMegaProps {
  brand?: string
  tagline?: string
  columns?: FooterColumn[]
  /** Status strip — the one thing a footer says that changes. */
  statusLabel?: string
  statusHref?: string
  regionNote?: string
  legalLinks?: FooterLink[]
  year?: number
  className?: string
}

const DEFAULT_COLUMNS: FooterColumn[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Overview', href: '#' },
      { label: 'Features', href: '#' },
      { label: 'Pricing', href: '#' },
      { label: 'Integrations', href: '#', badge: 'New' },
      { label: 'Changelog', href: '#' },
    ],
  },
  {
    heading: 'Developers',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'API reference', href: '#' },
      { label: 'CLI', href: '#' },
      { label: 'Status', href: '#' },
      { label: 'Open source', href: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#', badge: '3' },
      { label: 'Customers', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Help centre', href: '#' },
      { label: 'Community', href: '#' },
      { label: 'Templates', href: '#' },
      { label: 'Guides', href: '#' },
      { label: 'Security', href: '#' },
    ],
  },
]

const DEFAULT_LEGAL: FooterLink[] = [
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Cookies', href: '#' },
]

const SOCIALS = [
  { label: 'GitHub', href: '#', Icon: Github },
  { label: 'Twitter', href: '#', Icon: Twitter },
  { label: 'LinkedIn', href: '#', Icon: Linkedin },
  { label: 'YouTube', href: '#', Icon: Youtube },
]

/** Slug for wiring a column's heading to its nav landmark. */
function headingId(heading: string): string {
  return `footer-${heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

export function FooterMega({
  brand = 'Acme',
  tagline = 'The toolkit for teams who would rather ship than configure.',
  columns = DEFAULT_COLUMNS,
  statusLabel = 'All systems operational',
  statusHref = '#',
  regionNote = 'Served from 14 regions worldwide',
  legalLinks = DEFAULT_LEGAL,
  year = new Date().getFullYear(),
  className = '',
}: FooterMegaProps) {
  return (
    <footer className={`border-t border-border/60 bg-card/30 ${className}`}>
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* -- Brand ------------------------------------------------- */}
          <div className="lg:col-span-4">
            <a href="#" className="inline-flex items-center gap-2.5">
              <span
                aria-hidden
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-sm font-black text-primary-foreground shadow-lg shadow-primary/25"
              >
                {brand.slice(0, 1)}
              </span>
              <span className="text-base font-bold tracking-tight">{brand}</span>
            </a>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {tagline}
            </p>

            <div className="mt-6 flex gap-2">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon aria-hidden className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* -- Link columns ------------------------------------------ */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
            {columns.map((column) => (
              <nav key={column.heading} aria-labelledby={headingId(column.heading)}>
                <h2
                  id={headingId(column.heading)}
                  className="text-xs font-semibold uppercase tracking-wider text-foreground"
                >
                  {column.heading}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {link.label}
                        {link.badge ? (
                          <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            {link.badge}
                          </span>
                        ) : null}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* -- Status strip -------------------------------------------- */}
        <div className="mt-12 flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <a
            href={statusHref}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span aria-hidden className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {statusLabel}
          </a>
          <p className="text-sm text-muted-foreground">{regionNote}</p>
        </div>

        {/* -- Legal bar ----------------------------------------------- */}
        <div className="mt-10 flex flex-col-reverse items-center gap-4 border-t border-border/60 pt-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {year} {brand}, Inc. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
