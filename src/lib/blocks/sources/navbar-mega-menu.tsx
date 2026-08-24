'use client'

/**
 * <NavbarMegaMenu> — a navbar whose top-level items open a full panel.
 *
 * What a mega menu is for: a site with more destinations than fit in a row,
 * where a plain dropdown of eight link labels tells a visitor nothing about
 * which one they want. The panel buys room for a description per link,
 * which is the entire justification for the pattern — a mega menu that is
 * just a wider list of labels is a dropdown with extra steps.
 *
 * The interaction is the hard part, and most hand-rolled versions get one
 * of these wrong:
 *
 *  - Opens on hover *and* on focus, so a keyboard user reaches it at all.
 *    Hover alone is the most common failure; it also strands touch users,
 *    which is why the trigger is a real button that toggles on click.
 *  - Closes on Escape, on click outside, and on focus leaving the group —
 *    tabbing past the last link in the panel closes it rather than leaving
 *    an open panel over content the user is now reading.
 *  - A close timer on pointer-leave, not an instant close. The gap between
 *    a trigger and its panel is a few pixels of nothing, and an instant
 *    close makes the menu impossible to enter diagonally.
 *  - `aria-expanded` on the trigger and `aria-hidden` never used to hide an
 *    open panel's focusable contents.
 *
 * Below `lg` the whole thing collapses to a stacked accordion, because a
 * three-column panel on a phone is a scroll trap.
 */

import * as React from 'react'
import { ChevronDown, Menu, X } from 'lucide-react'

export interface MegaMenuLink {
  label: string
  description: string
  href: string
}

export interface MegaMenuSection {
  label: string
  links: MegaMenuLink[]
  /** Optional promoted card in the panel's right rail. */
  feature?: { title: string; body: string; href: string; cta: string }
}

export interface NavbarMegaMenuProps {
  brand?: string
  sections?: MegaMenuSection[]
  /** Items with no panel, rendered as plain links. */
  plainLinks?: Array<{ label: string; href: string }>
  ctaLabel?: string
  ctaHref?: string
  className?: string
}

const DEFAULT_SECTIONS: MegaMenuSection[] = [
  {
    label: 'Product',
    links: [
      { label: 'Analytics', description: 'Events, funnels and retention', href: '#' },
      { label: 'Experiments', description: 'Ship behind a flag, measure the lift', href: '#' },
      { label: 'Sessions', description: 'Watch what the numbers cannot explain', href: '#' },
      { label: 'Alerts', description: 'Know before your customers tell you', href: '#' },
    ],
    feature: {
      title: 'What shipped in March',
      body: 'Warehouse sync, a rewritten query engine and 40% faster dashboards.',
      href: '#',
      cta: 'Read the changelog',
    },
  },
  {
    label: 'Solutions',
    links: [
      { label: 'For startups', description: 'Free until you raise a Series A', href: '#' },
      { label: 'For enterprise', description: 'SSO, audit logs and a DPA', href: '#' },
      { label: 'For agencies', description: 'One account, every client', href: '#' },
      { label: 'For e-commerce', description: 'Revenue attribution out of the box', href: '#' },
    ],
  },
]

const DEFAULT_PLAIN = [
  { label: 'Pricing', href: '#' },
  { label: 'Docs', href: '#' },
]

export function NavbarMegaMenu({
  brand = 'Acme',
  sections = DEFAULT_SECTIONS,
  plainLinks = DEFAULT_PLAIN,
  ctaLabel = 'Start free',
  ctaHref = '#',
  className = '',
}: NavbarMegaMenuProps) {
  // Per-instance ids. A literal id in a reusable component is a
  // collision waiting for the second copy on the page — and a <label>
  // then resolves to whichever input rendered first.
  const uid = React.useId()
  const [openLabel, setOpenLabel] = React.useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const groupRef = React.useRef<HTMLDivElement>(null)
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cancel any scheduled close — the pointer came back, or focus did.
  const cancelClose = React.useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  // Give the pointer time to cross the gap between trigger and panel.
  const scheduleClose = React.useCallback(() => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpenLabel(null), 140)
  }, [cancelClose])

  React.useEffect(() => cancelClose, [cancelClose])

  React.useEffect(() => {
    if (!openLabel) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenLabel(null)
    }
    function onPointerDown(event: PointerEvent) {
      if (!groupRef.current?.contains(event.target as Node)) setOpenLabel(null)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [openLabel])

  const active = sections.find((s) => s.label === openLabel)

  return (
    <header
      className={`sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl ${className}`}
    >
      <div
        ref={groupRef}
        onMouseLeave={scheduleClose}
        onMouseEnter={cancelClose}
        // Focus leaving the group entirely closes the panel. `blur` bubbles
        // where `focusout` semantics are needed, and relatedTarget tells us
        // whether focus went somewhere still inside.
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpenLabel(null)
        }}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a href="#" className="flex shrink-0 items-center gap-2.5">
            <span
              aria-hidden
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-sm font-black text-primary-foreground shadow-lg shadow-primary/25"
            >
              {brand.slice(0, 1)}
            </span>
            <span className="text-base font-bold tracking-tight">{brand}</span>
          </a>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {sections.map((section) => {
                const isOpen = openLabel === section.label
                return (
                  <li key={section.label}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      /*
                        The panel this trigger opens, named. `aria-expanded`
                        alone tells a screen-reader user that something
                        opened but not what or where; the pair is what lets
                        them jump to it. One shared id is correct here
                        because there is one panel — it swaps contents as
                        the open section changes rather than one panel per
                        trigger existing at once.
                      */
                      aria-controls={`${uid}-mega-panel`}
                      onClick={() => setOpenLabel(isOpen ? null : section.label)}
                      onMouseEnter={() => {
                        cancelClose()
                        setOpenLabel(section.label)
                      }}
                      onFocus={() => setOpenLabel(section.label)}
                      className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        isOpen
                          ? 'bg-muted/60 text-foreground'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      {section.label}
                      <ChevronDown
                        aria-hidden
                        className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </li>
                )
              })}

              {plainLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onMouseEnter={scheduleClose}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden lg:block">
            <a
              href={ctaHref}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {ctaLabel}
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls={`${uid}-mega-mobile-panel`}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            {mobileOpen ? (
              <X aria-hidden className="h-5 w-5" />
            ) : (
              <Menu aria-hidden className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* -- Desktop panel ------------------------------------------- */}
        {active ? (
          <div
            id={`${uid}-mega-panel`}
            className="absolute inset-x-0 hidden border-b border-border/40 bg-background/95 shadow-xl shadow-black/10 backdrop-blur-xl lg:block"
          >
            <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8">
              <ul className={`grid gap-1 sm:grid-cols-2 ${active.feature ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                {active.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="block rounded-xl p-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="block text-sm font-semibold">{link.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {link.description}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>

              {active.feature ? (
                <div className="rounded-xl border border-border/60 bg-card/60 p-5">
                  <h3 className="text-sm font-semibold">{active.feature.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {active.feature.body}
                  </p>
                  <a
                    href={active.feature.href}
                    className="mt-4 inline-block text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {active.feature.cta} →
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* -- Mobile accordion ------------------------------------------ */}
      {mobileOpen ? (
        <div
          id={`${uid}-mega-mobile-panel`}
          className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-border/40 bg-background/95 backdrop-blur-xl lg:hidden"
        >
          <nav aria-label="Main" className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
            {sections.map((section) => (
              <details key={section.label} className="border-b border-border/60 py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                  {section.label}
                  <ChevronDown aria-hidden className="h-4 w-4 text-muted-foreground" />
                </summary>
                <ul className="space-y-1 pb-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="block rounded-lg px-3 py-2 hover:bg-muted/50"
                      >
                        <span className="block text-sm font-medium">{link.label}</span>
                        <span className="text-xs text-muted-foreground">{link.description}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            ))}

            <ul className="mt-2">
              {plainLinks.map((link) => (
                <li key={link.label} className="border-b border-border/60">
                  <a href={link.href} className="block py-3.5 text-sm font-semibold">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <a
              href={ctaHref}
              className="mt-4 block rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground"
            >
              {ctaLabel}
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
