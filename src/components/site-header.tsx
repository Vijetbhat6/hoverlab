'use client'

/**
 * SiteHeader — the ladder nav that every catalog page shares.
 *
 * Until this existed, the four tiers were only reachable from the landing
 * page's ladder band or from each other's "related" rails. That is fine for
 * someone who arrived at the front door and wrong for how these pages are
 * actually found: /block/pricing-tiers exists because someone searched
 * "react pricing section", and until now landing on it from a search result
 * left no way up to the other 4,000 things this site has.
 *
 * Deliberately not in the root layout. Six routes — the landing page,
 * /library, /playground, /tools, /account and the designer-tool layout —
 * already carry their own sticky header with surface-specific controls
 * (filter chips, the bundle tray, ⌘K), and mounting this above those would
 * give them two bars. It goes on the catalog surfaces that had none, which
 * is the same set as "pages a crawler can land on cold".
 *
 * Client-side only for `usePathname`, which drives the active underline.
 * Everything else here is static markup.
 */

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, Scale, Wand2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserMenu } from '@/components/user-menu'
import { BundleDrawer } from '@/components/bundle-drawer'
import { CompareDrawer } from '@/components/compare-drawer'
import { useBundle } from '@/hooks/use-bundle'
import { useCompare } from '@/hooks/use-compare'

/**
 * The ladder, in rungs, atom → assembly, then the tools that sit beside it.
 *
 * `match` is a prefix test rather than an equality test so that a detail
 * page highlights its tier — /block/pricing-tiers lights up "Blocks". The
 * singular and plural routes both belong to one tab, which is why each
 * entry carries a list.
 */
const NAV: Array<{ label: string; href: string; match: string[] }> = [
  { label: 'Browse', href: '/browse', match: ['/browse'] },
  { label: 'Effects', href: '/library', match: ['/library', '/effect', '/category'] },
  { label: 'Blocks', href: '/blocks', match: ['/blocks', '/block'] },
  { label: 'Pages', href: '/pages', match: ['/pages', '/page'] },
  { label: 'Templates', href: '/templates', match: ['/templates', '/template'] },
  { label: 'Tools', href: '/tools', match: ['/tools'] },
  { label: 'Paths', href: '/paths', match: ['/paths'] },
  { label: 'Docs', href: '/docs', match: ['/docs'] },
]

/** True when `pathname` is the route itself or something beneath it. */
function isActive(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function SiteHeader() {
  const pathname = usePathname() ?? ''

  const [bundleOpen, setBundleOpen] = React.useState(false)
  const [compareOpen, setCompareOpen] = React.useState(false)
  const { count: bundleCount } = useBundle()
  const { count: compareCount } = useCompare()

  // Counts come from localStorage, so the server render and the first
  // client render disagree by definition. Held back a tick, as elsewhere.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand — the way back to the top of the ladder */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Hoverlab home">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-lg shadow-primary/30">
            <Wand2 className="h-5 w-5" />
          </div>
          <span className="hidden text-base font-bold tracking-tight sm:inline">Hoverlab</span>
        </Link>

        {/* Ladder nav. Scrolls horizontally rather than collapsing into a
            hamburger — five items fit on a phone, and a menu you have to
            open is a menu a first-time visitor doesn't know is there. */}
        <nav
          aria-label="Catalog"
          className="-mx-1 flex flex-1 items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {NAV.map((item) => {
            const active = isActive(pathname, item.match)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-primary"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          {/* Bundle and compare are reachable from every catalog surface,
              not just /library. Without these the "Bundle" and "Compare"
              buttons on a block detail page put something into a drawer
              with no way to open it from the page you are standing on. */}
          <TrayButton
            label="Compare"
            count={mounted ? compareCount : 0}
            onClick={() => setCompareOpen(true)}
          >
            <Scale aria-hidden className="h-4 w-4" />
          </TrayButton>
          <TrayButton
            label="Bundle"
            count={mounted ? bundleCount : 0}
            onClick={() => setBundleOpen(true)}
          >
            <Package aria-hidden className="h-4 w-4" />
          </TrayButton>
          <UserMenu />
          <ThemeToggle />
        </div>
      </div>

      <BundleDrawer open={bundleOpen} onOpenChange={setBundleOpen} />
      <CompareDrawer open={compareOpen} onOpenChange={setCompareOpen} />
    </header>
  )
}

/**
 * A header tray button with a count badge.
 *
 * The badge is suppressed at zero rather than showing "0" — an empty tray
 * is not news, and a permanent zero trains people to ignore the number.
 */
function TrayButton({
  label,
  count,
  onClick,
  children,
}: {
  label: string
  count: number
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${label}${count > 0 ? ` (${count})` : ''}`}
      aria-label={`Open ${label.toLowerCase()}${count > 0 ? `, ${count} item${count === 1 ? '' : 's'}` : ''}`}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {count}
        </span>
      ) : null}
    </button>
  )
}
