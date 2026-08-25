'use client'

/**
 * <FooterStatusLocale> — the footer of a product, not of a marketing site.
 *
 * The three footers here are all marketing footers: link columns, a
 * minimal bar, a newsletter band. A signed-in application footer is doing
 * a different job, and the difference is visible in what people actually
 * look for down there. Not "About us" — they are looking for whether the
 * thing is down, and for the switch that changes the language or the theme
 * because they could not find it anywhere else.
 *
 * WHY THE STATUS DOT EARNS ITS PLACE
 *
 * "Is it me or is it them" is the first question of every incident, and a
 * product that makes people search for a status page answers it slowly.
 * A dot with a real label in the footer answers it on every page for free.
 *
 * The label is text, never colour alone — "All systems normal" beside a
 * green dot, "Degraded performance" beside amber. A green circle means
 * nothing to a reader who cannot distinguish it from the amber one, and
 * this is the single most common place that mistake ships.
 *
 * The dot does not pulse. An animated indicator in a footer is motion in
 * peripheral vision for the entire session, which is exactly what
 * `prefers-reduced-motion` exists to stop — and a heartbeat implies live
 * polling that this component is not doing.
 *
 * WHY THE SWITCHERS ARE NATIVE SELECTS
 *
 * Locale and theme are settings, not navigation. A native `<select>` gets
 * keyboard behaviour, a system picker on mobile, and screen-reader support
 * that a custom dropdown has to rebuild and usually rebuilds worse. The
 * only thing lost is a flag emoji, and a flag is the wrong symbol for a
 * language anyway — the same Spanish is spoken under a dozen of them.
 *
 * Theme includes System and defaults to it, because an app that forces a
 * choice on first load is overriding one the reader already made in their
 * operating system.
 *
 * ACCESSIBILITY: the status is a `role="status"` so a change is announced
 * once rather than silently repainting, and each switcher has a real label
 * that is visually hidden rather than a placeholder doing double duty.
 */

import * as React from 'react'
import { Circle } from 'lucide-react'

export type SystemStatus = 'operational' | 'degraded' | 'outage' | 'maintenance'

export interface FooterStatusLocaleProps {
  productName?: string
  status?: SystemStatus
  statusHref?: string
  version?: string
  links?: { label: string; href: string }[]
  locales?: { value: string; label: string }[]
  className?: string
}

/*
  Every state carries its own words. See the note above: colour is how you
  find the indicator, never how you read it.
*/
const STATUS_COPY: Record<SystemStatus, { label: string; dot: string }> = {
  operational: { label: 'All systems normal', dot: 'text-emerald-500' },
  degraded: { label: 'Degraded performance', dot: 'text-amber-500' },
  outage: { label: 'Major outage', dot: 'text-red-500' },
  maintenance: { label: 'Scheduled maintenance', dot: 'text-sky-500' },
}

const DEFAULT_LINKS = [
  { label: 'Docs', href: '#' },
  { label: 'API', href: '#' },
  { label: 'Support', href: '#' },
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
]

const DEFAULT_LOCALES = [
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'de-DE', label: 'Deutsch' },
  { value: 'fr-FR', label: 'Français' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'hi-IN', label: 'हिन्दी' },
  { value: 'ja-JP', label: '日本語' },
]

export function FooterStatusLocale({
  productName = 'Northwind',
  status = 'operational',
  statusHref = '#',
  version = 'v4.12.0',
  links = DEFAULT_LINKS,
  locales = DEFAULT_LOCALES,
  className = '',
}: FooterStatusLocaleProps) {
  const [locale, setLocale] = React.useState(locales[0]?.value ?? 'en-GB')
  const [theme, setTheme] = React.useState('system')
  const copy = STATUS_COPY[status]

  return (
    <footer
      className={`border-t border-border bg-card ${className}`}
      aria-label={`${productName} footer`}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {/* Announced on change, not just repainted. */}
          <a
            href={statusHref}
            role="status"
            className="inline-flex items-center gap-2 rounded text-sm text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {/* No pulse. Motion in peripheral vision for a whole session. */}
            <Circle aria-hidden className={`h-2.5 w-2.5 fill-current ${copy.dot}`} />
            {copy.label}
          </a>

          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="rounded text-sm text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="sr-only">Language</span>
            <select
              value={locale}
              onChange={(event) => setLocale(event.target.value)}
              className="h-8 rounded-lg border border-field bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {locales.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="sr-only">Theme</span>
            <select
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              className="h-8 rounded-lg border border-field bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {/* System first and default — the reader already chose once,
                  in their operating system. */}
              <option value="system">System theme</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>

          <p className="font-mono text-xs text-muted-foreground">{version}</p>
        </div>
      </div>
    </footer>
  )
}
