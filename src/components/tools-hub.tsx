'use client'

/**
 * Designer Tools hub — landing page for all the design utility tools.
 * Each tool gets a card with icon, name, description, and a "Open" link.
 *
 * The list itself lives in `@/lib/designer-tools` so the command palette
 * renders the same registry.
 *
 * ── WHY THIS IS NOT JUST A GRID ANY MORE ────────────────────────────────
 *
 * It was, for thirty-six cards, and the page's own footer gave the game
 * away: "open the command palette and search for what you need". A hub that
 * tells you to search somewhere else is a hub that has stopped working. Two
 * things fix it, and both read from data the registry already carried:
 *
 *   A filter box, matching `keywords` as well as names and descriptions —
 *   the same field the palette matches on, so "wcag" finds the contrast
 *   checker here exactly as it does there. Typing is the fastest path for
 *   someone who knows what they want.
 *
 *   Shelves, for everyone else. `group` splits the grid into five headed
 *   sections so the page can be scanned by category instead of read end to
 *   end.
 *
 * The filter is client state and nothing else on the page is, which is why
 * this component stays a client component while the route around it does
 * not: the ItemList structured data is emitted from the server route, and
 * putting it here would ship the registry twice.
 */

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Search, Sparkles, X } from 'lucide-react'
import { DESIGNER_TOOLS, TOOL_GROUPS, type DesignerTool } from '@/lib/designer-tools'
import { BrandColorPicker } from '@/components/brand-color-picker'
import { SiteHeader } from '@/components/site-header'
import { useCommandPalette } from '@/components/command-palette'
import { SiteFooter } from '@/components/site-footer'
import { NewsletterSignup } from '@/components/landing/newsletter-signup'

/**
 * Word-prefix matching over name, description and keywords.
 *
 * Deliberately not fuzzy. The palette is fuzzy because it searches four
 * thousand artifacts where a near-miss is worth surfacing; this searches
 * thirty-six, where a fuzzy matcher mostly returns things you did not ask
 * for and buries the one you did. Every term has to match, so "dark token"
 * narrows rather than widens.
 *
 * A term matches the START of a word rather than anywhere in the string,
 * which is the difference between a filter people trust and one they stop
 * using. Plain `includes` made the short queries — the ones most likely to
 * be typed — useless: "og" returned seven tools because it is inside
 * "logo" and "toggle", with the OG builder buried among them. Prefixes
 * still catch the useful partial ("shad" finds both the shadow builder and
 * the shadcn editor), which is the whole reason not to demand whole words.
 */
function matches(tool: DesignerTool, query: string): boolean {
  const haystack = `${tool.name} ${tool.description} ${tool.keywords}`.toLowerCase()
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => {
      let from = 0
      for (;;) {
        const at = haystack.indexOf(term, from)
        if (at === -1) return false
        // Start of the string, or preceded by anything that is not a letter
        // or a digit — so a hyphenated name like "clip-path" is two words.
        if (at === 0 || !/[a-z0-9]/.test(haystack[at - 1]!)) return true
        from = at + 1
      }
    })
}

function ToolCard({ tool }: { tool: DesignerTool }) {
  return (
    <Link
      href={tool.href}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${tool.accent} text-white shadow-md`}
      >
        <tool.icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{tool.name}</h3>
      <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
        {tool.description}
      </p>
      <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
        Open tool
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  )
}

export function ToolsHub() {
  const { open: openCommandPalette } = useCommandPalette()
  const [query, setQuery] = React.useState('')

  const filtered = React.useMemo(
    () => (query.trim() ? DESIGNER_TOOLS.filter((tool) => matches(tool, query)) : DESIGNER_TOOLS),
    [query],
  )

  const searching = query.trim().length > 0

  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader actions={<BrandColorPicker />} />

      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pt-16">
        {/* Hero */}
        <section className="mx-auto mb-10 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {DESIGNER_TOOLS.length} tools · zero dependencies · works offline
          </div>
          <h1 className="type-hub">
            Designer tools,<br className="hidden sm:inline" /> built into your browser.
          </h1>
          <p className="mt-5 text-pretty text-base text-body sm:text-lg">
            A focused toolkit that complements the effects library: design tokens,
            palettes, gradients, shadows and type scales; WCAG contrast checks;
            favicons, OG tags and email templates ready to ship — all without
            leaving Hoverlab.
          </p>
        </section>

        {/* Filter */}
        <section className="mx-auto mb-10 max-w-md">
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <label htmlFor="tool-filter" className="sr-only">
              Filter tools
            </label>
            <input
              id="tool-filter"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter tools — try “contrast”, “oklch”, “og”"
              className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-9 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            {searching ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear filter"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          {/*
            Announced politely rather than assertively: the count changes on
            every keystroke, and an assertive region would interrupt a
            screen-reader user mid-word for every one of them.
          */}
          <p aria-live="polite" className="mt-2 h-4 text-center text-xs text-muted-foreground">
            {searching
              ? `${filtered.length} of ${DESIGNER_TOOLS.length} tools`
              : ''}
          </p>
        </section>

        {searching ? (
          /*
            One flat grid while filtering. Shelves are for browsing; someone
            who has typed a query is looking for a specific tool, and
            splitting four results across three headed sections makes them
            harder to find rather than easier.
          */
          filtered.length > 0 ? (
            <section aria-labelledby="filter-results">
              {/*
                Visually hidden, but present: the cards are <h3>, and without
                this the document jumps h1 → h3 the moment anyone types. The
                shelves supply the same level when not filtering.
              */}
              <h2 id="filter-results" className="sr-only">
                Matching tools
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((tool) => (
                  <ToolCard key={tool.href} tool={tool} />
                ))}
              </div>
            </section>
          ) : (
            <section className="rounded-xl border border-dashed border-border/60 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                No tool matches “{query}”.
              </p>
              <button
                type="button"
                onClick={openCommandPalette}
                className="mt-2 text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                Search the whole catalog instead (⌘K)
              </button>
            </section>
          )
        ) : (
          <div className="space-y-14">
            {TOOL_GROUPS.map((group) => {
              const tools = DESIGNER_TOOLS.filter((tool) => tool.group === group)
              if (tools.length === 0) return null
              return (
                <section key={group} aria-labelledby={`group-${group.replace(/\W+/g, '-')}`}>
                  <div className="mb-5 flex items-baseline gap-3">
                    <h2
                      id={`group-${group.replace(/\W+/g, '-')}`}
                      className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {group}
                    </h2>
                    <span className="text-xs text-muted-foreground/70">{tools.length}</span>
                    <span aria-hidden className="h-px flex-1 bg-border/60" />
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {tools.map((tool) => (
                      <ToolCard key={tool.href} tool={tool} />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {/* Footer note */}
        <section className="mt-16 rounded-xl border border-border/60 bg-muted/20 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            More tools coming soon. Have a request?{' '}
            <button
              type="button"
              onClick={openCommandPalette}
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Open the command palette (⌘K)
            </button>{' '}
            and search the whole catalog.
          </p>
        </section>

        {/*
          The one place a tool visitor is asked for anything.

          Below the whole grid and below the request note, because the tools
          are the funnel and a form above them is a toll booth. `source`
          matters: it is what enrols the address into the three-email
          sequence written for someone who came for a free utility rather
          than to evaluate a catalog, and the heading above the field is the
          promise that sequence keeps. The API accepted "tools" for months
          while no page ever sent it — see `lib/sequences.ts`.
        */}
        <section className="mt-8">
          <NewsletterSignup source="tools" />
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
