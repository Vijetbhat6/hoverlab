/**
 * /design-system — your brand, as a design system.
 *
 * A public, indexed page for a Pro feature, which is deliberate. "Design
 * tokens from a brand colour" is a thing people search for, the panel is
 * usable and live for anyone who lands here, and the paywall is on the
 * the files rather than on the palette. Somebody who spends two minutes
 * dragging a hue slider and watching 835 effects recolour has already had
 * the argument for Pro made to them better than a pricing card could.
 *
 * It is also the counter to UI8's Design DNA, and the difference is worth
 * stating on the page: theirs describes a Figma file an agent then has to
 * rebuild, ours emits the tokens AND ships a catalog that already speaks
 * them.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Blocks, FileCode, Figma, Terminal } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { DesignSystemPanel } from '@/components/design-system-panel'
import { absoluteUrl } from '@/lib/site'
import { TOTAL_COUNT } from '@/lib/catalog-stats'

const TITLE = 'Design system export — your brand, as tokens — Hoverlab'
const DESCRIPTION =
  'Pick a brand colour and get the whole token set as files: tokens.css, a Tailwind theme, W3C design tokens for Figma and a config the CLI reads. Every effect, block and page in the catalog is already styled through those tokens, so the catalog matches your product instead of the other way round.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'design tokens generator',
    'brand colour design system',
    'tailwind theme from brand color',
    'figma variables export',
    'oklch design tokens',
  ],
  alternates: { canonical: '/design-system' },
  openGraph: {
    url: absoluteUrl('/design-system'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

const READS_IT = [
  {
    icon: FileCode,
    title: 'Your codebase',
    body: 'tokens.css and a Tailwind theme. Drop them into any Hoverlab template, or into a project of your own that uses the same token names.',
  },
  {
    icon: Figma,
    title: 'Your Figma file',
    body: 'W3C design tokens, one file per mode — the format Figma’s own variable import reads, and every token plugin already does. The file and the code stop drifting.',
  },
  {
    icon: Terminal,
    title: 'Your CLI and your agent',
    body: 'hoverlab.config.json in the project root. After that, what you install arrives in your brand: token-styled artifacts exactly, effects hue-rotated to match.',
  },
]

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Design system
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Your brand, and {TOTAL_COUNT.toLocaleString('en-US')} effects that
            already match it
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything in this catalog styles itself through design tokens —{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-sm">bg-card</code>,{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
              text-muted-foreground
            </code>{' '}
            — rather than literal colours. Change the token and you have changed
            every effect, block, page and template at once. Pick a brand below
            and watch it happen; Pro exports the result as files.
          </p>
        </header>

        <DesignSystemPanel />

        {/* ----------------------------------------------------------
         *  What reads the output
         * -------------------------------------------------------- */}
        <section className="mt-16">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Three tools, the same palette
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {READS_IT.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border/60 bg-card/60 p-5"
              >
                <item.icon aria-hidden className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/*
          The return trip. Someone who has just pushed their palette into
          Figma is the exact person who then wants to build FROM Figma, and
          until these two pages linked each other they were two unrelated
          features that happened to both mention Figma.
        */}
        <section className="mt-12 rounded-2xl border border-border/60 bg-card/60 p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <Figma aria-hidden className="h-4 w-4 text-primary" />
            And back the other way
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Once the tokens are in Figma, pair Figma&apos;s MCP server with
            Hoverlab&apos;s and an agent can read a frame and build it from the
            catalog — matching against a design that is already in your
            colours, so there is nothing to translate.
          </p>
          <Link
            href="/docs/mcp#figma"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Pairing it with Figma <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        </section>

        <section className="mt-6 rounded-2xl border border-border/60 bg-card/60 p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <Blocks aria-hidden className="h-4 w-4 text-primary" />
            Then install something into it
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            With <code className="rounded bg-muted px-1">hoverlab.config.json</code> in
            your project root, the CLI installs into your brand rather than ours.
            That is the part a tokens file alone does not get you: a design system
            with nothing built in it is a style guide. Blocks, pages and templates
            follow your tokens directly; effects are hand-written CSS, so the CLI
            hue-rotates them towards your brand — close, and exact if you spend a
            credit on the AI recolour.
          </p>
          <div className="mt-4 overflow-hidden rounded-xl bg-zinc-950 p-4">
            <pre className="overflow-x-auto font-mono text-sm text-zinc-300">
              {'npx hoverlab add pricing-tiers'}
            </pre>
          </div>
          <Link
            href="/docs/cli"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            CLI docs <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        </section>
      </main>
    </div>
  )
}
