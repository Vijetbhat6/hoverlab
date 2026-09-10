'use client'

/**
 * SiteHeader — the one header. Every surface mounts this and nothing else.
 *
 * It used to be one of seven. The landing page, /library, /playground,
 * /tools, each designer tool, /account and the catalog pages each carried
 * their own sticky bar, and they disagreed about everything that matters:
 * the landing page showed five ladder links, /library showed none at all,
 * /playground offered "Back to library", and the catalog pages were the
 * only ones that knew there were four rungs. Someone who landed on
 * /library — the page most of the marketing points at — could not see that
 * /blocks, /pages or /templates existed. Five headers is not five designs;
 * it is one design that nobody finished.
 *
 * So this is now the whole navigational spine:
 *
 *   brand · ladder nav · [page actions] · search · compare · bundle ·
 *   copy history · preferences · account
 *
 * Everything that used to be a bare icon carries a word. Compare, Bundle
 * and Copy history show their label outright from `xl` and a real tooltip
 * below that; the preference toggles that were three undecodable icons
 * (sun, lightning bolt, keyboard) are one labelled menu.
 *
 * It also owns what those seven headers each kept a copy of: the bundle and
 * compare drawers, the command palette, the shortcuts dialog, and the `b` /
 * `v` shortcuts. Pages open the drawers by dispatching the events in
 * `lib/tray-events`, which is how the command palette already did it.
 */

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  ChevronDown,
  Cookie,
  Github,
  Keyboard,
  Laptop,
  Layers,
  Moon,
  Package,
  Scale,
  Search,
  Settings2,
  Sun,
  Wand2,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { UserMenu } from '@/components/user-menu'
import { BundleDrawer } from '@/components/bundle-drawer'
import { CompareDrawer } from '@/components/compare-drawer'
import { CommandPalette, useCommandPalette } from '@/components/command-palette'
import { ShortcutsHelpButton, useShortcutsHelp } from '@/components/shortcuts-help'
import { CopyHistoryDropdown } from '@/components/copy-history-dropdown'
import { LadderTour, openLadderTour } from '@/components/ladder-tour'
import { openCookieChoices } from '@/components/cookie-consent-banner'
import { CONSENT_REQUIRED } from '@/lib/consent'
import { useReducedMotion } from '@/components/reduced-motion-provider'
import { useBundle } from '@/hooks/use-bundle'
import { useCompare } from '@/hooks/use-compare'
import { PLANS, formatPrice } from '@/lib/billing/plans'
import { SOCIAL, isPlaceholder } from '@/lib/social'
import { TRAY_EVENTS, isTypingTarget } from '@/lib/tray-events'

/**
 * The ladder, in rungs, atom → assembly, then the surfaces beside it.
 *
 * `match` is a prefix test rather than an equality test so that a detail
 * page highlights its tier — /block/pricing-tiers lights up "Blocks". The
 * singular and plural routes both belong to one tab, which is why each
 * entry carries a list.
 *
 * `hint` is the line that says what the rung *is*. It shows in the tooltip,
 * because "Blocks" and "Pages" mean nothing to someone who has not read the
 * landing page, and the ladder is the whole differentiator.
 *
 * Paths sits second, out of ladder order, and that is deliberate. The rest
 * of this list is a taxonomy — it assumes you already know whether the thing
 * you need is an effect or a block, which is exactly what a first-time
 * visitor does not know. "Build a landing page · 30 min · 8 steps" answers
 * the question the taxonomy can't, so it goes where someone reading left to
 * right will actually reach it, not eighth of nine.
 */
/**
 * `badge` is merchandising, and it is deliberately rationed.
 *
 * A marketplace nav carries four items, two of which wear a tiny
 * high-contrast pill — "All Access 30% OFF", "Forge NEW" — and those
 * pills are doing the revenue work for the whole header. Hoverlab cannot
 * cut to four items (the four rungs plus Browse and Paths are the
 * product's central idea, and a rung nobody can see is a rung nobody
 * uses), but it can take the half of the pattern that pays.
 *
 * Two badges, no more. A third makes all three ordinary.
 */
const NAV: Array<{
  label: string
  href: string
  match: string[]
  hint: string
  badge?: { text: string; tone: 'new' | 'pro' }
}> = [
  {
    label: 'Browse',
    href: '/browse',
    match: ['/browse'],
    hint: 'Search everything — all four rungs at once',
  },
  {
    label: 'Paths',
    href: '/paths',
    match: ['/paths'],
    hint: 'Start here — the catalog in the order you would actually build it',
  },
  {
    label: 'Kits',
    href: '/kits',
    match: ['/kits'],
    hint: 'Everything for one job at once — the template, the screens and the sections',
  },
  {
    label: 'Effects',
    href: '/library',
    match: ['/library', '/effect', '/category'],
    hint: 'The atoms — single pure-CSS hover states, loaders and animations',
  },
  {
    label: 'Blocks',
    href: '/blocks',
    match: ['/blocks', '/block'],
    hint: 'The sections — pricing tables, FAQs, navbars, ready to drop in',
  },
  {
    label: 'Pages',
    href: '/pages',
    match: ['/pages', '/page'],
    hint: 'The screens — whole layouts assembled from blocks',
  },
  {
    label: 'Templates',
    href: '/templates',
    match: ['/templates', '/template'],
    hint: 'The projects — deployable starters you can clone',
  },
  {
    label: 'Builder',
    href: '/builder',
    match: ['/builder'],
    hint: 'Compose your own page out of sections, and leave with the source',
    badge: { text: 'New', tone: 'new' },
  },
  {
    label: 'Playground',
    href: '/playground',
    match: ['/playground'],
    hint: 'Paste any HTML and CSS and tune it live',
  },
  {
    label: 'Tools',
    href: '/tools',
    match: ['/tools'],
    hint: 'Palettes, gradients, shadows, contrast and unit conversion',
    badge: { text: 'New', tone: 'new' },
  },
  {
    label: 'Docs',
    href: '/docs',
    match: ['/docs'],
    hint: 'The CLI, the API, and how the four rungs fit together',
  },
]

/** True when `pathname` is the route itself or something beneath it. */
function isActive(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/**
 * How many nav items fit on the line, so the rest can go in a menu that
 * says so rather than scrolling out of sight behind a hidden scrollbar.
 *
 * The nav is the only flexible item in a `max-w-7xl` row, and the cluster
 * on its right *grows* at `md`, `lg` and `2xl` as Compare, Bundle, History
 * and the search field earn their labels. So the nav gets narrower as the
 * viewport gets wider: measured at 1280 and 1440 it had 581px for 790px of
 * links, and at 1600 and above it had 387px. Playground, Tools and Docs
 * were unreachable at every desktop width, Templates and Builder too past
 * 1600, and 1600 rendered the word "Ter" — "Templates" cut mid-word — with
 * nothing to say five more links existed.
 *
 * This is the same bug the Pro link was moved out of the nav to escape,
 * and the comment there states the rule this restores: a rung nobody can
 * see is a rung nobody uses.
 *
 * Not a hamburger. Everything that fits stays on the line, in order, and
 * only the tail moves — so on a wide screen the menu holds nothing and
 * does not render at all.
 *
 * Below `sm` the nav is its own full-width scrolling row, which is a
 * deliberate design that already works; the menu is a no-op there.
 */
function useNavOverflow(total: number) {
  const navRef = React.useRef<HTMLElement | null>(null)
  /*
   * Item widths are cached from a paint where every item was on the line —
   * once the tail is trimmed the trimmed items cannot be measured. They are
   * static labels, so one good measurement holds for the life of the page;
   * `document.fonts.ready` re-takes it in case a webfont reflowed them.
   */
  const widthsRef = React.useRef<number[] | null>(null)
  /** Width of the "More" trigger, measured once and cached the same way. */
  const triggerRef = React.useRef<number>(0)
  const [visible, setVisible] = React.useState(total)

  React.useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const measure = () => {
      const el = navRef.current
      if (!el) return

      // Below `sm` the row scrolls on purpose — show everything.
      if (!window.matchMedia('(min-width: 640px)').matches) {
        widthsRef.current = null
        setVisible(total)
        return
      }

      const items = Array.from(
        el.querySelectorAll<HTMLElement>('[data-nav-item]'),
      )
      const moreEl = el.querySelector<HTMLElement>('[data-nav-more]')

      /*
       * Measure through a forced unhide, restored before this function
       * returns, because a `hidden` element reports `offsetWidth: 0`.
       *
       * Doing it any other way means waiting for React to commit the
       * unhide first, and that is a race this lost: after a re-measure the
       * widths came back as zeros for every item still hidden from the
       * previous pass, every item therefore "fit", and the nav went
       * straight back to eleven items scrolling behind a hidden scrollbar.
       * Reading layout is synchronous, so taking the measurement into our
       * own hands is both correct and cheaper than a second render.
       */
      if (!widthsRef.current || !triggerRef.current) {
        if (items.length < total) return
        const restore = [...items, moreEl].map((node) =>
          node ? ([node, node.hidden] as const) : null,
        )
        for (const entry of restore) if (entry) entry[0].hidden = false

        widthsRef.current = items.map((item) => item.offsetWidth)
        // The count badge grows by a digit past nine items; round up once.
        if (moreEl) triggerRef.current = moreEl.offsetWidth + 8

        for (const entry of restore) if (entry) entry[0].hidden = entry[1]
      }
      const widths = widthsRef.current

      const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0
      const available = el.clientWidth

      // How many fit with everything on the line and no menu at all.
      let used = 0
      let fits = 0
      for (const w of widths) {
        const next = used + (fits === 0 ? 0 : gap) + w
        if (next > available) break
        used = next
        fits += 1
      }
      if (fits === total) {
        setVisible(total)
        return
      }

      /*
       * Something has to move, so the trigger now costs width too. Re-run
       * the fit against the smaller budget, and drop items until the
       * trigger has room — otherwise adding the menu overflows the line it
       * was added to prevent. Reserving nothing for it was what put the
       * trigger past the end of the nav and underneath the Pro link:
       * visible, and impossible to click.
       */
      const trigger = triggerRef.current || 104
      const budget = available - trigger - gap
      let room = 0
      let count = 0
      for (const w of widths) {
        const next = room + (count === 0 ? 0 : gap) + w
        if (next > budget) break
        room = next
        count += 1
      }
      setVisible(count)
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(nav)
    // The right-hand cluster is what squeezes the nav, and it changes width
    // on hydration (Sign in / account) and at every breakpoint above.
    if (nav.parentElement) observer.observe(nav.parentElement)

    /*
     * A webfont swapping in changes every label's width. Dropping the
     * caches is enough — `measure` takes its own reading and no longer
     * needs a render to show the items first.
     */
    let cancelled = false
    void document.fonts?.ready.then(() => {
      if (cancelled) return
      widthsRef.current = null
      triggerRef.current = 0
      measure()
    })

    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [total])

  return { navRef, visible }
}

export interface SiteHeaderProps {
  /**
   * Surface-specific controls, rendered at the head of the tray.
   *
   * Deliberately narrow: this is for a control that only makes sense on one
   * kind of page — the brand-colour picker on the designer tools — not for
   * re-adding a bespoke nav. Anything a visitor needs on more than one
   * surface belongs in the shared tray below, not here.
   */
  actions?: React.ReactNode
}

export function SiteHeader({ actions }: SiteHeaderProps) {
  const pathname = usePathname() ?? ''

  const { navRef, visible } = useNavOverflow(NAV.length)

  const [bundleOpen, setBundleOpen] = React.useState(false)
  const [compareOpen, setCompareOpen] = React.useState(false)
  const { count: bundleCount } = useBundle()
  const { count: compareCount } = useCompare()

  // Counts come from localStorage, so the server render and the first
  // client render disagree by definition. Held back a tick, as elsewhere.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  /**
   * The drawers live here now, so the shortcuts and the cross-page open
   * events live here too. Six surfaces each carried a copy of this effect;
   * on the seventh — every catalog page — `b` and `v` did nothing at all,
   * because the drawers were mounted but nothing listened.
   */
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // ⌘K belongs to <CommandPalette>, which binds it itself.
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return
      const key = e.key.toLowerCase()
      if (key === 'b') {
        e.preventDefault()
        setBundleOpen((v) => !v)
      } else if (key === 'v') {
        e.preventDefault()
        setCompareOpen((v) => !v)
      }
    }
    const onOpenBundle = () => setBundleOpen(true)
    const onOpenCompare = () => setCompareOpen(true)

    window.addEventListener('keydown', onKey)
    window.addEventListener(TRAY_EVENTS.bundle, onOpenBundle)
    window.addEventListener(TRAY_EVENTS.compare, onOpenCompare)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(TRAY_EVENTS.bundle, onOpenBundle)
      window.removeEventListener(TRAY_EVENTS.compare, onOpenCompare)
    }
  }, [])

  return (
    <>
      {/*
        Skip link.

        The header carries the brand, a search field, nine nav items, three
        trays and the account menu — a keyboard or screen-reader user met
        all of it on every page before reaching a word of content, and the
        site had no way past it. It lives here rather than in the root
        layout because the header is what it skips, and because every page
        that renders content renders this component.

        Visually hidden until focused, then it lands over the header as a
        real button. `#main-content` is the id on each page's <main>.
      */}
      <a
        href="#main-content"
        className="sr-only z-50 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        {/*
          On phones the nav drops to its own full-width row.

          It used to share one 64px line with the brand, search, the trays,
          preferences and a "Get started" button. Those are all fixed-width,
          the nav was the only flexible item, so at 390px it was squeezed to
          93px — one visible word, "Browse", with the other eight items
          scrolled out of sight behind no scrollbar. A nav nobody can see is
          worse than the hamburger we avoided, because at least a hamburger
          announces itself.

          Wrapping costs ~48px of header on mobile and gives the nav the full
          width to scroll in. Above `sm` there is room for one row and it
          behaves exactly as before.
        */}
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-2 sm:h-16 sm:flex-nowrap sm:px-6 sm:pb-0 lg:px-8">
          {/* Brand — the way back to the top of the ladder */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Hoverlab home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-lg shadow-primary/30">
              <Wand2 className="h-5 w-5" />
            </div>
            <span className="hidden text-base font-bold tracking-tight sm:inline">
              Hoverlab
            </span>
          </Link>

          {/* Ladder nav. Scrolls horizontally on phones rather than
              collapsing into a hamburger — a menu you have to open is a menu
              a first-time visitor doesn't know is there, and this nav is the
              product. On a desktop line the tail that will not fit moves
              into a labelled "More" menu instead of scrolling out of sight;
              see `useNavOverflow`. Every item is in the server HTML either
              way, so a crawler and a phone both get all eleven links. */}
          <nav
            ref={navRef}
            aria-label="Catalog"
            /* Still clipped, deliberately: the menu itself is portalled, so
               nothing needs to escape this box, and if the measurement is
               ever off by a few pixels the tail scrolls — the old failure —
               rather than painting on top of the Pro link next to it. */
            className="-mx-1 order-last flex w-full min-w-0 items-center gap-0.5 overflow-x-auto px-1 [scrollbar-width:none] sm:order-none sm:w-auto sm:flex-1 [&::-webkit-scrollbar]:hidden"
          >
            {NAV.map((item, i) => {
              const active = isActive(pathname, item.match)
              /*
               * Kept mounted and hidden rather than unmounted: `hidden` is
               * how the measurer tells "does not fit" from "not there yet",
               * and an item that is merely hidden is still a link in the
               * markup for a crawler that ignores our CSS.
               */
              const overflowed = i >= visible
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      data-nav-item
                      href={item.href}
                      hidden={overflowed}
                      aria-hidden={overflowed || undefined}
                      tabIndex={overflowed ? -1 : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative shrink-0 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        active
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                      )}
                    >
                      {item.label}
                      {item.badge ? (
                        <span
                          className={cn(
                            'ml-1.5 rounded px-1 py-0.5 align-middle text-[9px] font-bold uppercase leading-none tracking-wider',
                            item.badge.tone === 'pro'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                          )}
                        >
                          {item.badge.text}
                        </span>
                      ) : null}
                      {active && (
                        <span
                          aria-hidden
                          className="absolute inset-x-2.5 -bottom-[1px] h-0.5 rounded-full bg-primary"
                        />
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-56">
                    {item.hint}
                  </TooltipContent>
                </Tooltip>
              )
            })}

            {/*
              The overflow menu. Always in the tree so the measurer can read
              its width before deciding whether it is needed, and `hidden`
              whenever everything fits — which is the common case on a wide
              screen, where this renders nothing at all.

              It carries the word "More" and a count rather than a bare
              chevron, so the thing it is hiding is legible from the outside.
            */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-nav-more
                  type="button"
                  hidden={visible >= NAV.length}
                  aria-hidden={visible >= NAV.length || undefined}
                  tabIndex={visible >= NAV.length ? -1 : undefined}
                  className={cn(
                    'relative shrink-0 items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                    // `hidden` on a flex child needs the display reset to win.
                    visible >= NAV.length ? 'hidden' : 'flex',
                  )}
                >
                  More
                  <span className="rounded bg-muted px-1 py-0.5 text-[9px] font-bold leading-none tracking-wider text-muted-foreground">
                    {NAV.length - visible}
                  </span>
                  <ChevronDown aria-hidden className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>More of the catalog</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {NAV.slice(visible).map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      href={item.href}
                      aria-current={
                        isActive(pathname, item.match) ? 'page' : undefined
                      }
                      className="flex cursor-pointer flex-col items-start gap-0.5"
                    >
                      <span className="flex items-center gap-1.5 font-medium">
                        {item.label}
                        {item.badge ? (
                          <span
                            className={cn(
                              'rounded px-1 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wider',
                              item.badge.tone === 'pro'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                            )}
                          >
                            {item.badge.text}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.hint}
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* ml-auto so the controls stay right-aligned on the mobile row,
              where the nav is no longer between them and the brand. */}
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0">
            {actions}

            {/*
              Pro, priced, next to the account controls.

              It started out as a tenth entry in the ladder nav above and
              that was measurably wrong: the nav is a horizontal scroller
              and at 1440 px the tenth item lands past the right edge, so
              the one link that carries revenue was the one link nobody
              could see. It is also not a rung — the nav is a taxonomy of
              what the catalog contains, and a price is not a kind of
              component. Here it sits with Sign in and Get started, where
              a price belongs, and where nothing pushes it off-screen.
            */}
            <Link
              href="/pricing"
              aria-current={pathname === '/pricing' ? 'page' : undefined}
              className={cn(
                'relative hidden h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex',
                pathname === '/pricing'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )}
            >
              Pro
              {/* Derived, not typed out: this badge sat at $59 in the header
                  while the pricing page moved to $79, and a header price that
                  contradicts the pricing page is worse than no header price. */}
              <span className="rounded bg-primary px-1 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wider text-primary-foreground">
                {formatPrice(PLANS.pro.priceCents)}
              </span>
              {/* The same underline the ladder nav draws. Pro is a
                  destination now, not a scroll target, so /pricing has to
                  look reached rather than leaving the header saying you are
                  nowhere. */}
              {pathname === '/pricing' && (
                <span
                  aria-hidden
                  className="absolute inset-x-2.5 -bottom-[1px] h-0.5 rounded-full bg-primary"
                />
              )}
            </Link>

            <QuickFindButton />

            {/* The block page's "♡ Save · 📦 Bundle · ⚖ Compare" pattern,
                site-wide: no icon anyone has to decode on its own. */}
            <TrayButton
              label="Compare"
              hint="Put items side by side (v)"
              count={mounted ? compareCount : 0}
              onClick={() => setCompareOpen(true)}
              icon={<Scale aria-hidden className="h-4 w-4" />}
              hideOnMobile
            />
            <TrayButton
              label="Bundle"
              hint="Your collection — export it all as one file (b)"
              count={mounted ? bundleCount : 0}
              onClick={() => setBundleOpen(true)}
              icon={<Package aria-hidden className="h-4 w-4" />}
            />

            {/* Copy history is a power feature and the widest control in
                this row. It waits for a laptop; the nav does not. */}
            <span className="hidden lg:inline-flex">
              <CopyHistoryDropdown />
            </span>
            <PreferencesMenu />
            <UserMenu />
          </div>
        </div>
      </header>

      <BundleDrawer open={bundleOpen} onOpenChange={setBundleOpen} />
      <CompareDrawer open={compareOpen} onOpenChange={setCompareOpen} />
      <CommandPalette />
      <ShortcutsHelpButton />
      <LadderTour />
    </>
  )
}

/**
 * The ⌘K entry point, spelled out.
 *
 * Only /library ever showed this. Every other surface expected you to know
 * the shortcut, which means every other surface had no search at all for
 * anyone who didn't.
 */
function QuickFindButton() {
  const { open } = useCommandPalette()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={open}
          aria-label="Search everything"
          className="flex h-9 items-center gap-2 rounded-full border border-border/60 bg-background/60 px-2.5 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:px-3"
        >
          <Search aria-hidden className="h-4 w-4 shrink-0" />
          {/* Same reasoning as the tray labels, and the same correction: at
              lg these cost ~60px of a row that could not afford it, which
              pushed "Docs" — the last nav item — off the end at 1440px, and
              moving them to 2xl did not buy the room it looked like it did,
              because `max-w-7xl` caps this row at 1280px whatever the
              viewport does. The icon plus its tooltip carries this control;
              the nav cannot be carried by anything. The ⌘K shortcut is in
              the tooltip, and on the shortcuts dialog. */}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        Search every effect, block, page and template (⌘K)
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * A header tray button: icon, a word from `xl` up, a tooltip always.
 *
 * The badge is suppressed at zero rather than showing "0" — an empty tray
 * is not news, and a permanent zero trains people to ignore the number.
 */
function TrayButton({
  label,
  hint,
  count,
  onClick,
  icon,
  hideOnMobile,
}: {
  label: string
  hint: string
  count: number
  onClick: () => void
  icon: React.ReactNode
  /** Drop below `sm`, where the nav needs the width more than this does. */
  hideOnMobile?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={`${label}${count > 0 ? `, ${count} item${count === 1 ? '' : 's'}` : ', empty'}`}
          className={cn(
            'relative flex h-9 items-center gap-1.5 rounded-lg px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            // Compare is a side-by-side view — there is no room to put two
            // things side by side on a 390px screen, so it is the one tray
            // that earns its place back only on a wider viewport. Bundle
            // stays: it is the cart, and it is how you leave with anything.
            hideOnMobile && 'hidden sm:flex',
          )}
        >
          {icon}
          {/*
            No label. The tooltip carries this control.

            It used to appear at xl, which clipped "Playground" to
            "Playgrou" at 1440px, and was moved to 2xl on the reasoning that
            there is "genuinely room at 1536px". There is not, and that is
            the whole bug: this row is `max-w-7xl`, so the content box stops
            growing at 1280px no matter how wide the viewport gets. Past
            1536 the labels switch on and nothing pays for them but the nav,
            which is the only flexible item in the row.

            Measured, that made the site worse on a bigger screen: seven nav
            items on the line at 1440, four at 1600 and at 1920. A label
            waiting for room that never arrives is a label that only ever
            takes it from the nav, and the rule the xl fix already wrote
            down still applies — the nav is the product; it gets the space.
          */}
          {count > 0 ? (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {count}
            </span>
          ) : null}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{hint}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Theme, motion and shortcuts — one labelled menu instead of three icons.
 *
 * A sun, a lightning bolt and a keyboard in a row is three guesses. Motion
 * in particular hid three states behind one glyph that cycled, so the only
 * way to find out what it did was to click it and watch the site change.
 */
function PreferencesMenu() {
  const { theme, setTheme } = useTheme()
  const { pref: motion, setPref: setMotion, enabled: motionReduced } = useReducedMotion()
  const { open: openShortcuts } = useShortcutsHelp()

  // next-themes and the motion pref both read localStorage, so neither has
  // a truthful value until after hydration. Show the neutral default first.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Preferences"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Settings2 aria-hidden className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Preferences — theme, motion, shortcuts
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Theme
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={mounted ? (theme ?? 'system') : 'system'}
          onValueChange={setTheme}
        >
          <DropdownMenuRadioItem value="light" className="cursor-pointer">
            <Sun className="mr-2 h-4 w-4" /> Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" className="cursor-pointer">
            <Moon className="mr-2 h-4 w-4" /> Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" className="cursor-pointer">
            <Laptop className="mr-2 h-4 w-4" /> Match my system
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Animation
          {mounted && motionReduced ? (
            <span className="ml-1 text-amber-500">· currently reduced</span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={mounted ? motion : 'auto'}
          onValueChange={(v) => setMotion(v as 'auto' | 'on' | 'off')}
        >
          <DropdownMenuRadioItem value="auto" className="cursor-pointer">
            Follow my system
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="off" className="cursor-pointer">
            Always animate
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="on" className="cursor-pointer">
            Reduce motion
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        {/* The way back to the tour. Without this, dismissing it once means
            never seeing the one explanation of what the four rungs are. */}
        <DropdownMenuItem onClick={openLadderTour} className="cursor-pointer">
          <Layers className="mr-2 h-4 w-4" /> Replay the intro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openShortcuts} className="cursor-pointer">
          <Keyboard className="mr-2 h-4 w-4" /> Keyboard shortcuts
          <span className="ml-auto font-mono text-xs text-muted-foreground">?</span>
        </DropdownMenuItem>
        {/* The way back to the consent decision. A choice that cannot be
            changed is not one the law counts — withdrawal has to be as easy
            as giving it — and "as easy" cannot mean an email. Hidden where
            no consent was ever asked for, on the same principle as the
            GitHub item below: a menu entry that opens nothing is worse than
            no entry. */}
        {CONSENT_REQUIRED ? (
          <DropdownMenuItem onClick={openCookieChoices} className="cursor-pointer">
            <Cookie className="mr-2 h-4 w-4" /> Cookie choices
          </DropdownMenuItem>
        ) : null}
        {/* Only when NEXT_PUBLIC_GITHUB_URL names an actual repository.
            Unset, SOCIAL.github falls back to github.com's front page, and a
            "Source on GitHub" item that lands there is a claim this project
            cannot back — worse for a developer audience than no item. */}
        {isPlaceholder(SOCIAL.github) ? null : (
          <DropdownMenuItem asChild className="cursor-pointer">
            <a href={SOCIAL.github.href} target="_blank" rel="noreferrer noopener">
              <Github className="mr-2 h-4 w-4" /> Source on GitHub
            </a>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
