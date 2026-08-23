/**
 * /changelog — what the catalog gained, and when.
 *
 * The site had no answer to "is this still being worked on". Counts grew
 * between deploys and nothing said so, which for a catalog product is the
 * difference between "actively curated" and "someone's abandoned side
 * project". Return visitors had nothing to return for, and the newsletter
 * had nothing to be about.
 *
 * Every date on this page is derived from git via the recency ledger — see
 * `lib/recency.ts`. Nothing here is hand-maintained, so it cannot rot, and
 * more importantly it cannot be inflated: a quiet fortnight shows as a
 * quiet fortnight. That is the same discipline that took the invented
 * testimonials off the landing page.
 *
 * Deliberately NOT a release log of the app. Features ship, get described
 * on the pages that carry them, and a version number means little to
 * someone who has never used the product. What a visitor to a catalog
 * wants to know is whether there is new stuff in the catalog.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Sparkles } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { JsonLd } from '@/components/json-ld'
import { Button } from '@/components/ui/button'
import { EFFECTS } from '@/lib/effects'
import { BLOCK_CATALOG } from '@/lib/blocks/catalog'
import { PAGE_CATALOG } from '@/lib/pages/catalog'
import { TEMPLATE_CATALOG } from '@/lib/templates/catalog'
import { LEVEL_LABEL, type ArtifactLevel } from '@/lib/artifact-types'
import {
  CATALOG_UPDATED_AT,
  catalogWaves,
  formatAdded,
  type CatalogWave,
} from '@/lib/recency'
import { breadcrumbLd } from '@/lib/structured-data'
import { absoluteUrl } from '@/lib/site'

const TITLE = "What's new in the Hoverlab catalog"
const DESCRIPTION =
  'Every effect, block, page and template added to Hoverlab, dated and grouped by the day it landed. Derived from the repository history, not hand-maintained.'

export const metadata: Metadata = {
  title: `${TITLE} — Hoverlab`,
  description: DESCRIPTION,
  keywords: [
    'hoverlab changelog',
    'new css effects',
    'new tailwind blocks',
    'ui catalog updates',
  ],
  alternates: { canonical: '/changelog' },
  openGraph: {
    url: absoluteUrl('/changelog'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

/**
 * Name lookup per rung.
 *
 * Built once at module scope from the catalogs themselves rather than
 * stored alongside the dates: the ledger holds ids and nothing else, so it
 * can never disagree with the catalog about what something is called.
 */
const NAMES: Record<ArtifactLevel, Map<string, string>> = {
  effect: new Map(EFFECTS.map((e) => [e.id, e.name])),
  block: new Map(BLOCK_CATALOG.map((b) => [b.id, b.name])),
  page: new Map(PAGE_CATALOG.map((p) => [p.id, p.name])),
  template: new Map(TEMPLATE_CATALOG.map((t) => [t.id, t.name])),
}

/** How many artifacts each wave names before falling back to a count. */
const SAMPLES = 8

export default function ChangelogPage() {
  // One entry per day, each holding that day's waves across all four rungs.
  const byDate = new Map<string, CatalogWave[]>()
  for (const wave of catalogWaves()) {
    const existing = byDate.get(wave.date)
    if (existing) existing.push(wave)
    else byDate.set(wave.date, [wave])
  }
  const days = [...byDate.entries()]

  const total =
    EFFECTS.length + BLOCK_CATALOG.length + PAGE_CATALOG.length + TEMPLATE_CATALOG.length

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <JsonLd
        data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: "What's new" }])}
      />

      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-12 sm:px-6">
        <header className="mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <CalendarDays aria-hidden className="h-3.5 w-3.5 text-primary" />
            Catalog updated {formatAdded(CATALOG_UPDATED_AT)}
          </span>
          <h1 className="type-page mt-3">What&apos;s new</h1>
          <p className="mt-4 text-body text-muted-foreground">
            {total.toLocaleString('en-US')} artifacts, and the day each one
            arrived. Grouped by the batch it landed in, newest first.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            These dates are read out of the repository history rather than
            typed in, so this page is a record of what actually shipped — not
            a summary of it.
          </p>
        </header>

        <ol className="space-y-10">
          {days.map(([date, waves]) => (
            <li key={date} className="border-t border-border/60 pt-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="text-lg font-bold tracking-tight">
                  {formatAdded(date)}
                </h2>
                <p className="font-mono text-xs text-muted-foreground">
                  +{waves.reduce((n, w) => n + w.ids.length, 0).toLocaleString('en-US')}
                </p>
              </div>

              <div className="mt-4 space-y-5">
                {waves.map((wave) => (
                  <Wave key={`${wave.date}:${wave.level}`} wave={wave} />
                ))}
              </div>
            </li>
          ))}
        </ol>

        <section className="mt-16 rounded-2xl border border-border/60 bg-card/60 p-6">
          <h2 className="text-lg font-bold tracking-tight">
            Want the next batch in your inbox?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            One email when new effects drop — the same list this page is
            generated from.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/#newsletter">
                Get notified
                <ArrowRight aria-hidden className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/browse">Browse the catalog</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}

/** One rung's additions on one day. */
function Wave({ wave }: { wave: CatalogWave }) {
  const label = LEVEL_LABEL[wave.level]
  const names = NAMES[wave.level]
  const shown = wave.ids.slice(0, SAMPLES)
  const rest = wave.ids.length - shown.length

  return (
    <div>
      <h3 className="flex items-center gap-1.5 text-sm font-semibold">
        <Sparkles aria-hidden className="h-3.5 w-3.5 text-primary" />
        {wave.ids.length.toLocaleString('en-US')}{' '}
        {wave.ids.length === 1 ? label.one.toLowerCase() : label.many.toLowerCase()}
      </h3>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {shown.map((id) => (
          <li key={id}>
            <Link
              href={`/${wave.level}/${id}`}
              prefetch={false}
              className="inline-flex rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {names.get(id) ?? id}
            </Link>
          </li>
        ))}
        {rest > 0 ? (
          <li className="inline-flex items-center px-1 text-xs text-muted-foreground">
            and {rest.toLocaleString('en-US')} more
          </li>
        ) : null}
      </ul>
    </div>
  )
}
