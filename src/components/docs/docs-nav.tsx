'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { useHeaderHeight } from '@/hooks/use-header-height'

/**
 * The docs sidebar.
 *
 * Sticky below the site header on desktop; a horizontally scrolling strip
 * on mobile rather than a collapsed menu, for the same reason the ladder
 * nav is — a menu you have to open is one a first-time reader does not know
 * exists. This used to say "four links fit", then five; at seven the mobile
 * strip scrolls properly, which is the behaviour it was built for and still
 * beats a hidden menu. The scroll is the signal that there is more, so the
 * count at which this becomes a real problem is the count at which a reader
 * stops finding the last entry — not a number worth guessing in advance.
 */
const SECTIONS: Array<{ href: string; label: string; blurb: string }> = [
  { href: '/docs', label: 'Overview', blurb: 'What this is and how to install' },
  { href: '/docs/cli', label: 'CLI', blurb: 'npx hoverlab add, init, search' },
  { href: '/docs/api', label: 'API', blurb: 'The public /api/v1 surface' },
  { href: '/docs/mcp', label: 'MCP', blurb: 'Editor agents & Figma' },
  { href: '/docs/registry', label: 'Registry', blurb: 'npx shadcn add @hoverlab' },
  { href: '/docs/dna', label: 'Design DNA', blurb: 'Tokens and rules for AI tools' },
  { href: '/docs/skills', label: 'Skills', blurb: 'Teach your agent the catalog' },
]

export function DocsNav() {
  const pathname = usePathname() ?? ''

  /*
    `top-16` asserted the header is 64px. It is 65 from `md` up, but its
    nav wraps to a second row on a phone — 85px at 360-430 wide, 125px at
    320 — so on exactly the widths where this bar is the mobile navigation,
    it sat behind the site nav instead of below it.
  */
  const headerHeight = useHeaderHeight()

  return (
    <nav
      aria-label="Documentation"
      style={{ top: headerHeight }}
      className="sticky z-30 -mx-4 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur lg:mx-0 lg:h-fit lg:border-b-0 lg:bg-transparent lg:px-0 lg:py-14 lg:backdrop-blur-none"
    >
      <p className="mb-2 hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:block">
        Documentation
      </p>

      <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none] lg:flex-col lg:overflow-visible [&::-webkit-scrollbar]:hidden">
        {SECTIONS.map((section) => {
          // Exact match, not a prefix test: /docs would otherwise light up
          // on every page beneath it.
          const active = pathname === section.href
          return (
            <li key={section.href} className="shrink-0 lg:shrink">
              <Link
                href={section.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'block rounded-lg px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                {section.label}
                <span className="mt-0.5 hidden text-xs font-normal text-muted-foreground lg:block">
                  {section.blurb}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
