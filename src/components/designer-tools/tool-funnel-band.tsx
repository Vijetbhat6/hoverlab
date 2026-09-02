'use client'

/**
 * <ToolFunnelBand> — the way out of a tool and into the catalog.
 *
 * ── WHY IT LIVES IN THE LAYOUT AND READS THE PATHNAME ───────────────────
 *
 * There are 37 tool routes. Adding a section to each one is 37 edits now
 * and one more with every tool, and the 38th is the one somebody forgets —
 * which is exactly how this surface ended up with no funnel at all. The
 * layout wraps every route under /tools, so mounting it there means a new
 * tool is funnelled by existing.
 *
 * A layout is not told which route it is rendering, hence `usePathname()`
 * and hence `'use client'`. That is the entire reason this is a client
 * component; there is no state and no effect in it.
 *
 * ── WHY IT RENDERS NOTHING SOMETIMES, AND THAT IS CORRECT ───────────────
 *
 * On `/tools` itself, because the hub is already a route into everything.
 * And on any tool with no entry in `TOOL_FUNNELS` — a tool with no honest
 * next step should send people nowhere rather than to a generic banner.
 * `funnelFor` returning undefined is a decision, not a gap.
 *
 * ── WHAT IT IS NOT ──────────────────────────────────────────────────────
 *
 * Not a gate, not a modal, not an email capture. It is a section at the
 * bottom of a page that has already given away everything it has. See the
 * docblock in `lib/tool-presets.ts`: a funnel with a gate in it is a wall,
 * and the tools are the reason anyone arrives.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, Package, Terminal } from 'lucide-react'

import { funnelFor, funnelHref } from '@/lib/tool-funnel'

export function ToolFunnelBand() {
  const pathname = usePathname()
  const funnel = pathname ? funnelFor(pathname) : undefined

  if (!funnel) return null

  const href = funnelHref(funnel)

  return (
    <aside
      aria-labelledby="tool-funnel-heading"
      className="mx-auto mt-16 w-full max-w-5xl px-4 pb-16 sm:px-6 lg:px-8"
    >
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 sm:p-8">
        <p className="text-sm font-medium text-primary">Next</p>
        <h2
          id="tool-funnel-heading"
          className="mt-1.5 text-xl font-bold tracking-tight sm:text-2xl"
        >
          {funnel.pitch}
        </h2>

        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Everything in the catalog is free to browse, customise and copy —
          no account, no key. A licence is only needed to ship it
          commercially.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Package className="h-4 w-4" aria-hidden />
            Open the catalog
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/docs/cli"
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-muted"
          >
            <Terminal className="h-4 w-4" aria-hidden />
            Or install from the terminal
          </Link>
        </div>
      </div>
    </aside>
  )
}
