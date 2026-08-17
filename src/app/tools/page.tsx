'use client'

/**
 * Designer Tools hub page — landing page for all the design utility tools.
 * Each tool gets a card with icon, name, description, and a "Open" link.
 *
 * The hub is intentionally simple: it's a navigation page. The actual
 * tool logic lives in /tools/<name>/page.tsx, and the list itself lives in
 * `@/lib/designer-tools` so the command palette renders the same registry.
 */

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { DESIGNER_TOOLS } from '@/lib/designer-tools'
import { BrandColorPicker } from '@/components/brand-color-picker'
import { SiteHeader } from '@/components/site-header'
import { useCommandPalette } from '@/components/command-palette'

export default function ToolsHubPage() {
  const { open: openCommandPalette } = useCommandPalette()

  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader actions={<BrandColorPicker />} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pt-16">
        {/* Hero */}
        <section className="mx-auto mb-12 max-w-3xl text-center">
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

        {/* Tool cards */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DESIGNER_TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${tool.accent} text-white shadow-md`}
              >
                <tool.icon className="h-6 w-6" />
              </div>
              <h2 className="mb-2 text-lg font-semibold">{tool.name}</h2>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                {tool.description}
              </p>
              <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                Open tool
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </section>

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
            and search for what you need.
          </p>
        </section>
      </main>
    </div>
  )
}
