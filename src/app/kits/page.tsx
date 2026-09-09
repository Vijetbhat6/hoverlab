/**
 * /kits — the curated sets.
 *
 * The hubs answer "what is there" one rung at a time: the effects here,
 * the blocks there, the templates somewhere else. Nothing answered "I am
 * building a storefront, give me the storefront things", which is a
 * question that crosses all four rungs and was therefore four separate
 * browses and a lot of guessing.
 *
 * Sits beside /paths rather than inside it. A path is a tutorial — ordered
 * steps with the reason for each position; a kit is an inventory — take the
 * lot. The same block appears in both, as a step in one and a part in the
 * other, and someone who knows what they are building wants the second.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Boxes, Layers, Package } from 'lucide-react'

import { KITS } from '@/lib/kits/catalog'
import { kitSize, kitSummary } from '@/lib/kits/resolve'
import { absoluteUrl } from '@/lib/site'

/*
 * Counted from the data, not typed. Every number on this page is derived
 * from the same arrays the kit pages render, so the hub cannot advertise a
 * total the pages behind it do not add up to.
 */
const TOTAL_PIECES = KITS.reduce((n, kit) => n + kitSize(kit), 0)

const TITLE = `${KITS.length} kits — everything for one job, in one place — Hoverlab`
const DESCRIPTION =
  'Curated sets that cross the whole catalog: a SaaS launch, an AI product, a storefront, an internal tool, a waitlist, a docs site. Each kit names the template, the screens, the sections and the effects that build it.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'react ui kit',
    'tailwind ui kit',
    'saas starter kit',
    'ecommerce ui kit',
    'ai chat ui kit',
    'admin dashboard kit',
  ],
  alternates: { canonical: '/kits' },
  openGraph: {
    url: absoluteUrl('/kits'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function KitsHubPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Boxes aria-hidden className="h-3.5 w-3.5" />
            Kits
          </span>
          <h1 className="type-hub mt-5">Everything for one job, in one place</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            A kit names the template, the screens, the sections and the polish
            that build one kind of product — so the choosing is done and the
            building is what is left. Every piece is a real catalog entry with
            its own page, free to read and free to copy.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            {KITS.length} kits · {TOTAL_PIECES} pieces · every id links to its own page
          </p>
        </header>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2">
          {KITS.map((kit) => (
            <li key={kit.slug}>
              <Link
                href={`/kits/${kit.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card/60 p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                    <Package aria-hidden className="h-3 w-3" />
                    {kitSize(kit)} pieces
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Layers aria-hidden className="h-3 w-3" />
                    {kitSummary(kit)}
                  </span>
                </div>

                <h2 className="mt-3 text-lg font-bold tracking-tight group-hover:text-primary">
                  {kit.name}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{kit.tagline}</p>
                {/* The line that separates two kits a reader is choosing
                    between. Flexed so the CTA sits on the card's floor
                    whatever the audience line's height. */}
                <p className="mt-3 flex-1 text-xs italic text-muted-foreground/80">
                  {kit.audience}
                </p>

                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  Open the kit
                  <ArrowRight
                    aria-hidden
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* The neighbouring surface, named rather than left to be found.
            Someone who wanted an ordered tutorial and landed on an
            inventory should not have to go back to the nav to find it. */}
        <p className="mt-12 text-center text-sm text-muted-foreground">
          Want the order rather than the list?{' '}
          <Link href="/paths" className="font-medium text-primary hover:underline">
            The guided paths
          </Link>{' '}
          walk the same blocks one step at a time, with the reason for each position.
        </p>
      </div>
    </div>
  )
}
