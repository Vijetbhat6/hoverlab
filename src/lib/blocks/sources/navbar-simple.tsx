'use client'

/**
 * <NavbarSimple> — brand, links, CTAs, and a mobile menu.
 *
 * The navbar most marketing sites actually need. Everything here that looks
 * like decoration is doing a job:
 *
 *  - The mobile panel is toggled by a `<button>` carrying `aria-expanded`
 *    and `aria-controls`, not a checkbox hack. The hack is smaller but it
 *    announces as a checkbox, and "menu, checkbox, not checked" is not what
 *    a screen-reader user needs to hear.
 *  - Escape closes the panel and returns focus to the trigger. Without the
 *    return, a keyboard user who dismisses the menu is dropped at the top
 *    of the document with nothing focused.
 *  - The panel is unmounted when closed rather than hidden with `hidden` or
 *    opacity, so its links are not reachable by tab while invisible — the
 *    classic "tab into nothing" bug in every rolled-by-hand navbar.
 *  - `aria-current="page"` marks the active link. Colour alone does not
 *    survive a screen reader or a colourblind visitor.
 *
 * The bar is sticky and translucent. `backdrop-blur` over `bg-background/70`
 * keeps content legible as it scrolls under, which a solid bar does by
 * hiding it and a fully transparent one fails to do at all.
 */

import * as React from 'react'
import { Menu, X } from 'lucide-react'

export interface NavbarLink {
  label: string
  href: string
}

export interface NavbarSimpleProps {
  brand?: string
  links?: NavbarLink[]
  /** Label of the current page, matched against `links[].label`. */
  activeLabel?: string
  signInLabel?: string
  signInHref?: string
  ctaLabel?: string
  ctaHref?: string
  className?: string
}

const DEFAULT_LINKS: NavbarLink[] = [
  { label: 'Product', href: '#' },
  { label: 'Pricing', href: '#' },
  { label: 'Docs', href: '#' },
  { label: 'Blog', href: '#' },
]

export function NavbarSimple({
  brand = 'Acme',
  links = DEFAULT_LINKS,
  activeLabel = 'Product',
  signInLabel = 'Sign in',
  signInHref = '#',
  ctaLabel = 'Get started',
  ctaHref = '#',
  className = '',
}: NavbarSimpleProps) {
  // Per-instance ids. A literal id in a reusable component is a
  // collision waiting for the second copy on the page — and a <label>
  // then resolves to whichever input rendered first.
  const uid = React.useId()
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  // Escape closes and hands focus back. Bound only while open, so the
  // listener does not sit on the document for the life of the page.
  React.useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <header
      className={`sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl ${className}`}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <a href="#" className="flex shrink-0 items-center gap-2.5">
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-sm font-black text-primary-foreground shadow-lg shadow-primary/25"
          >
            {brand.slice(0, 1)}
          </span>
          <span className="text-base font-bold tracking-tight">{brand}</span>
        </a>

        {/* Desktop links */}
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => {
              const active = link.label === activeLabel
              return (
                <li key={link.label}>
                  <a
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      active
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    {link.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={signInHref}
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {signInLabel}
          </a>
          <a
            href={ctaHref}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {ctaLabel}
          </a>
        </div>

        {/* Mobile trigger */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={`${uid}-navbar-mobile-panel`}
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          {open ? (
            <X aria-hidden className="h-5 w-5" />
          ) : (
            <Menu aria-hidden className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile panel */}
      {open ? (
        <div
          id={`${uid}-navbar-mobile-panel`}
          className="border-t border-border/40 bg-background/95 backdrop-blur-xl lg:hidden"
        >
          <nav aria-label="Main" className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
            <ul className="space-y-1">
              {links.map((link) => {
                const active = link.label === activeLabel
                return (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setOpen(false)}
                      className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {link.label}
                    </a>
                  </li>
                )
              })}
            </ul>

            <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4">
              <a
                href={signInHref}
                className="rounded-lg border border-border/60 px-4 py-2.5 text-center text-sm font-semibold transition-colors hover:bg-muted"
              >
                {signInLabel}
              </a>
              <a
                href={ctaHref}
                className="rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                {ctaLabel}
              </a>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
