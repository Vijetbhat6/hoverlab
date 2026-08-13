'use client'

/**
 * <NavMobileDrawer> — a slide-in mobile menu with a real focus trap.
 *
 * The inline panel in <NavbarSimple> is enough for four links. This is for
 * when the menu is the whole site map: it covers the page, so it has to
 * behave like a dialog rather than like a dropdown.
 *
 * That distinction is the reason this block exists separately, and it is
 * four behaviours most hand-rolled drawers are missing:
 *
 *  1. `role="dialog"` + `aria-modal`, with `aria-labelledby` pointing at the
 *     drawer's own heading. Without it, a screen reader treats the drawer as
 *     ordinary page content and keeps reading the page behind it.
 *  2. A focus trap. Tab from the last control returns to the first instead
 *     of walking into the page underneath, which is invisible and still
 *     clickable while the drawer is open.
 *  3. Focus restoration. Closing returns focus to the trigger — otherwise
 *     dismissing the menu drops a keyboard user at the top of the document.
 *  4. Body scroll lock. Without it the page scrolls under the drawer on
 *     iOS, and the visitor closes the menu to find themselves somewhere
 *     else entirely.
 *
 * The panel animates with a transform, and the transition is dropped under
 * `prefers-reduced-motion: reduce` (`motion-reduce:transition-none`) — a
 * full-screen slide is exactly the kind of movement that setting exists to
 * suppress.
 *
 * The trap deliberately queries focusables on each Tab rather than caching
 * them at open: sections are collapsible, so what is focusable changes while
 * the drawer is open, and a cached list would trap focus on a hidden link.
 */

import * as React from 'react'
import { ChevronRight, Menu, Search, X } from 'lucide-react'

export interface DrawerLink {
  label: string
  href: string
  badge?: string
}

export interface DrawerSection {
  heading: string
  links: DrawerLink[]
}

export interface NavMobileDrawerProps {
  brand?: string
  sections?: DrawerSection[]
  ctaLabel?: string
  ctaHref?: string
  signInLabel?: string
  signInHref?: string
  showSearch?: boolean
  /**
   * Render as a demo inside a larger page. Suppresses the document-level
   * half of the drawer — background scroll lock, Tab trap, Escape — which
   * belongs to a real overlay and not to a card in a preview grid.
   */
  embedded?: boolean
  className?: string
}

const DEFAULT_SECTIONS: DrawerSection[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Overview', href: '#' },
      { label: 'Analytics', href: '#' },
      { label: 'Integrations', href: '#', badge: 'New' },
      { label: 'Pricing', href: '#' },
    ],
  },
  {
    heading: 'Developers',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'API reference', href: '#' },
      { label: 'Changelog', href: '#' },
      { label: 'Status', href: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#', badge: '3' },
    ],
  },
]

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function NavMobileDrawer({
  brand = 'Acme',
  sections = DEFAULT_SECTIONS,
  ctaLabel = 'Get started',
  ctaHref = '#',
  signInLabel = 'Sign in',
  signInHref = '#',
  showSearch = true,
  embedded = false,
  className = '',
}: NavMobileDrawerProps) {
  const [open, setOpen] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const closeRef = React.useRef<HTMLButtonElement>(null)

  const close = React.useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  // Focus into the panel on open, and lock the page behind it.
  React.useEffect(() => {
    if (!open || embedded) return

    closeRef.current?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return

      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null)
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const activeEl = document.activeElement

      // Wrap in both directions. Focus can also start outside the panel
      // entirely (a click on the backdrop), which the first branch catches.
      if (event.shiftKey && (activeEl === first || !panelRef.current.contains(activeEl))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, close, embedded])

  return (
    <header
      className={`sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl ${className}`}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-sm font-black text-primary-foreground shadow-lg shadow-primary/25"
          >
            {brand.slice(0, 1)}
          </span>
          <span className="text-base font-bold tracking-tight">{brand}</span>
        </a>

        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-haspopup="dialog"
          className="flex h-10 items-center gap-2 rounded-lg border border-border/60 px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Menu aria-hidden className="h-4 w-4" />
          Menu
        </button>
      </div>

      {/* Backdrop. Rendered only while open, so it can never swallow a
          click on the page underneath. */}
      {open ? (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={close}
          aria-hidden
        />
      ) : null}

      {/* Panel. Kept mounted so the transform can animate, but pushed
          off-screen and made inert to the tab order when closed. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        aria-hidden={!open}
        // `inert` keeps the closed panel out of the tab order without
        // unmounting it — the panel has to stay mounted for the transform
        // to animate, and a translated-off-screen panel is still tabbable.
        // Browsers without `inert` support still get `aria-hidden`.
        inert={!open}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-border/60 bg-background shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-4">
          <h2 id="drawer-title" className="text-sm font-semibold">
            {brand} menu
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {showSearch ? (
            <div className="relative mb-5">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <label htmlFor="drawer-search" className="sr-only">
                Search
              </label>
              <input
                id="drawer-search"
                type="search"
                placeholder="Search…"
                className="h-10 w-full rounded-lg border border-border/60 bg-card/60 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
          ) : null}

          <nav aria-label="Site" className="space-y-6">
            {sections.map((section) => (
              <div key={section.heading}>
                <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.heading}
                </h3>
                <ul className="mt-2 space-y-0.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        onClick={close}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="flex items-center gap-2">
                          {link.label}
                          {link.badge ? (
                            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                              {link.badge}
                            </span>
                          ) : null}
                        </span>
                        <ChevronRight aria-hidden className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="shrink-0 space-y-2 border-t border-border/60 p-4">
          <a
            href={signInHref}
            className="block rounded-lg border border-border/60 px-4 py-2.5 text-center text-sm font-semibold transition-colors hover:bg-muted"
          >
            {signInLabel}
          </a>
          <a
            href={ctaHref}
            className="block rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </header>
  )
}
