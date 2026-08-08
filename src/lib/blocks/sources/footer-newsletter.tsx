'use client'

/**
 * <FooterNewsletter> — a CTA band sitting on top of a link footer.
 *
 * The variant to reach for when the footer has a job beyond navigation.
 * The band is raised — bordered, tinted, shadowed, straddling the footer's
 * top rule — because a subscribe field inlined into a row of link columns
 * reads as one more link and converts like one.
 *
 * The raise is `pt-10` on the footer against `-mt-10` on the band, which
 * nets to zero: the band lands exactly on the top border without any part
 * of it rendering *above* the footer's own box. The obvious alternative —
 * a bare negative margin — puts pixels outside the element, and they are
 * clipped the moment the footer is the first thing on screen or sits in
 * any `overflow-hidden` container.
 *
 * Client component, unlike <FooterMega>: it owns the submitted state, so
 * the confirmation replaces the field in place rather than navigating. If
 * you do not need the capture, use <FooterMega> and skip the hydration.
 *
 * The status message is a live region, and focus is left on the form's
 * container rather than yanked — a footer that steals focus on submit
 * throws a keyboard user back down the page they were leaving.
 */

import * as React from 'react'
import { ArrowRight, Check, Loader2 } from 'lucide-react'

export interface FooterNewsletterLink {
  label: string
  href: string
}

export interface FooterNewsletterColumn {
  heading: string
  links: FooterNewsletterLink[]
}

export interface FooterNewsletterProps {
  brand?: string
  heading?: string
  subheading?: string
  placeholder?: string
  submitLabel?: string
  successMessage?: string
  note?: string
  columns?: FooterNewsletterColumn[]
  legalLinks?: FooterNewsletterLink[]
  onSubmit?: (email: string) => void | Promise<void>
  year?: number
  className?: string
}

const DEFAULT_COLUMNS: FooterNewsletterColumn[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '#' },
      { label: 'Pricing', href: '#' },
      { label: 'Changelog', href: '#' },
      { label: 'Roadmap', href: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Help centre', href: '#' },
      { label: 'Documentation', href: '#' },
      { label: 'Status', href: '#' },
      { label: 'Community', href: '#' },
    ],
  },
]

const DEFAULT_LEGAL: FooterNewsletterLink[] = [
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
]

type Status = 'idle' | 'pending' | 'done'

function headingId(heading: string): string {
  return `footer-nl-${heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

export function FooterNewsletter({
  brand = 'Acme',
  heading = 'One email a month. Worth the inbox space.',
  subheading = 'Product notes, engineering write-ups and the occasional postmortem.',
  placeholder = 'you@company.com',
  submitLabel = 'Subscribe',
  successMessage = 'Subscribed. Check your inbox to confirm.',
  note = 'Unsubscribe in one click, from any email.',
  columns = DEFAULT_COLUMNS,
  legalLinks = DEFAULT_LEGAL,
  onSubmit,
  year = new Date().getFullYear(),
  className = '',
}: FooterNewsletterProps) {
  const [email, setEmail] = React.useState('')
  const [status, setStatus] = React.useState<Status>('idle')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status !== 'idle') return

    setStatus('pending')
    try {
      await (onSubmit?.(email) ?? new Promise((r) => setTimeout(r, 700)))
      setStatus('done')
    } catch {
      setStatus('idle')
    }
  }

  return (
    <footer className={`border-t border-border/60 bg-card/30 pt-10 ${className}`}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* -- Raised CTA band ----------------------------------------- */}
        <div className="-mt-10 grid gap-6 rounded-2xl border border-border/60 bg-background/90 p-6 shadow-xl shadow-black/10 backdrop-blur sm:p-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-balance text-xl font-bold tracking-tight sm:text-2xl">
              {heading}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{subheading}</p>
          </div>

          <div className="lg:justify-self-end" aria-live="polite">
            {status === 'done' ? (
              <p className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <Check aria-hidden className="h-4 w-4" />
                {successMessage}
              </p>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
                  <label htmlFor="footer-newsletter-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="footer-newsletter-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={placeholder}
                    disabled={status === 'pending'}
                    className="h-11 rounded-xl border border-border/60 bg-card/60 px-4 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-60 sm:w-64"
                  />
                  <button
                    type="submit"
                    disabled={status === 'pending'}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-70"
                  >
                    {status === 'pending' ? (
                      <>
                        {/* The icon is aria-hidden, so without this word the
                            button has no accessible name while pending. */}
                        <Loader2
                          aria-hidden
                          className="h-4 w-4 animate-spin motion-reduce:[animation-duration:1.6s]"
                        />
                        Subscribing
                      </>
                    ) : (
                      <>
                        {submitLabel}
                        <ArrowRight aria-hidden className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
                {note ? <p className="mt-2 text-xs text-muted-foreground">{note}</p> : null}
              </>
            )}
          </div>
        </div>

        {/* -- Links --------------------------------------------------- */}
        <div className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <a href="#" className="inline-flex items-center gap-2.5">
              <span
                aria-hidden
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-600 text-xs font-black text-primary-foreground"
              >
                {brand.slice(0, 1)}
              </span>
              <span className="font-bold tracking-tight">{brand}</span>
            </a>
          </div>

          {columns.map((column) => (
            <nav key={column.heading} aria-labelledby={headingId(column.heading)}>
              <h2
                id={headingId(column.heading)}
                className="text-xs font-semibold uppercase tracking-wider"
              >
                {column.heading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col-reverse items-center gap-3 border-t border-border/60 py-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {year} {brand}, Inc.
          </p>
          <ul className="flex gap-5">
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
