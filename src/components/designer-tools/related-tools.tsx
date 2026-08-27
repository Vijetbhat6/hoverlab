'use client'

/**
 * The rail at the foot of every designer tool.
 *
 * A visitor arriving from "css clip path generator" gets exactly what they
 * searched for and then hits the end of the page. Twenty other tools exist
 * on the same site and, until this, the only thing pointing at them was a
 * back-link labelled "All designer tools" a full scroll above — a
 * navigation control, not an invitation.
 *
 * This is the cheap half of the funnel: it costs no signup and makes no
 * offer. <UseInCatalog> is the half that points at the catalog; this one
 * just keeps someone on the site long enough to find out there is one.
 *
 * Ordering comes from `relatedTools`, which scores shared keywords. The
 * heading deliberately claims nothing stronger than "more" — the overlap
 * is real when it exists, and calling three unrelated tools "related"
 * would be the kind of small lie that teaches people to ignore the rail.
 */

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

import { relatedTools, DESIGNER_TOOLS } from '@/lib/designer-tools'
import { cn } from '@/lib/utils'

export function RelatedTools({ className }: { className?: string }) {
  const pathname = usePathname()
  const tools = React.useMemo(() => relatedTools(pathname ?? ''), [pathname])

  if (tools.length === 0) return null

  return (
    <section
      aria-labelledby="more-tools-heading"
      className={cn('mt-14 border-t border-border/60 pt-8', className)}
    >
      <div className="mb-5 flex flex-wrap items-baseline gap-3">
        <h2 id="more-tools-heading" className="text-lg font-bold tracking-tight">
          More designer tools
        </h2>
        <span className="text-sm text-muted-foreground">
          All {DESIGNER_TOOLS.length} run in the tab — no account, no upload.
        </span>
        <Link
          href="/tools"
          className="ml-auto inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          See all
          <ArrowRight aria-hidden className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ul className="grid gap-4 sm:grid-cols-3">
        {tools.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="group flex h-full flex-col rounded-xl border border-border/60 bg-card/60 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={cn(
                  'mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm',
                  tool.accent,
                )}
              >
                <tool.icon aria-hidden className="h-4.5 w-4.5" />
              </span>
              <span className="text-sm font-semibold">{tool.name}</span>
              {/* One line only. Three full descriptions at the foot of a
                  tool page is a second article nobody asked for. */}
              <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {tool.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
