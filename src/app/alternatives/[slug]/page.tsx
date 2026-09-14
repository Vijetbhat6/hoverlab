/**
 * /alternatives/[slug] — one vendor, compared honestly.
 *
 * THE SHAPE, AND WHY IT IS IN THIS ORDER
 *
 *   1. What they do better.   Their `beatsUs`, at full size, first.
 *   2. The two side by side.  Price, volume, free tier, design files, agent
 *                             access, and what each of us puts behind a wall.
 *   3. What differs.          The gate row, expanded — it is the only row
 *                             where the two businesses actually disagree.
 *   4. Where to go next.
 *
 * Leading with the competitor's advantage is not modesty, it is the only
 * arrangement that works on the reader this page gets. Somebody who typed
 * "<vendor> alternative" already likes that vendor; a page that opens by
 * explaining why they are wrong is closed before the second paragraph. A
 * page that opens by conceding the strongest point against us is the only
 * one they keep reading, and `compare.ts` already requires that point to
 * exist and be written down.
 *
 * WHERE THE NUMBERS COME FROM
 *
 * Theirs: `compare.ts`, read off their own page, with the per-row date
 * printed on this page so a reader can go and check the one we could not.
 * Ours: computed from the catalog at build time — TOTAL_COUNT, BLOCK_COUNT
 * and the rest — never typed. Both rules are the file-level docblock in
 * `lib/compare.ts`, and this page is a second consumer of them rather than
 * a second copy.
 *
 * PRERENDERED, NOT DYNAMIC
 *
 * `generateStaticParams` emits all nine at build. These exist to be indexed,
 * and a route that renders on demand hands a crawler a slower page for no
 * benefit — the data is a module constant.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Check, ExternalLink, Minus } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { JsonLd } from '@/components/json-ld'
import { breadcrumbLd } from '@/lib/structured-data'
import { absoluteUrl } from '@/lib/site'
import { TOTAL_COUNT } from '@/lib/catalog-stats'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { PAGE_COUNT } from '@/lib/pages/page-index'
import { TEMPLATE_COUNT } from '@/lib/templates/template-index'
import { PLANS, formatPrice } from '@/lib/billing/plans'
import {
  COMPETITORS,
  GATE_LABELS,
  OUR_GATE,
  competitorBySlug,
  dateLabel,
  type Competitor,
} from '@/lib/compare'

/** All nine, prerendered. See the docblock. */
export function generateStaticParams() {
  return COMPETITORS.map((competitor) => ({ slug: competitor.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const competitor = competitorBySlug(slug)
  if (!competitor) return {}

  const title = `Hoverlab vs ${competitor.name} — an honest comparison`
  const description = `What ${competitor.name} does better, what it costs, what each of us gives away, and what each of us puts behind a wall. Their figures were read from their own site on ${dateLabel(competitor.checkedOn)}.`

  return {
    title,
    description,
    keywords: [
      `${competitor.name.toLowerCase()} alternative`,
      `${competitor.name.toLowerCase()} vs hoverlab`,
      `${competitor.name.toLowerCase()} pricing`,
    ],
    alternates: { canonical: `/alternatives/${competitor.slug}` },
    openGraph: {
      url: absoluteUrl(`/alternatives/${competitor.slug}`),
      title,
      description,
      type: 'article',
      siteName: 'Hoverlab',
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

/** Our own entry price, for the price row. Read from the catalog, never typed. */
function ourEntry(): string {
  return `${formatPrice(PLANS.pro.priceCents)} one-time`
}

/** Their entry price, in the same phrasing. */
function theirEntry(competitor: Competitor): string {
  if (competitor.entryUsd === null) return 'No paid individual licence'
  return `${formatPrice(competitor.entryUsd * 100)} ${competitor.entryTerm}`
}

/** A row of the two-column table. `null` renders as an em dash, not a blank. */
interface Row {
  label: string
  ours: React.ReactNode
  theirs: React.ReactNode
}

export default async function AlternativePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const competitor = competitorBySlug(slug)
  if (!competitor) notFound()

  const rows: Row[] = [
    {
      label: 'Entry price',
      ours: ourEntry(),
      theirs: theirEntry(competitor),
    },
    {
      label: 'Price ladder',
      ours: `${formatPrice(PLANS.pro.priceCents)} Pro / ${formatPrice(PLANS.studio.priceCents)} Studio / ${formatPrice(PLANS.enterprise.priceCents)} Enterprise, one-time, plus a per-seat Team plan`,
      theirs: competitor.ladder,
    },
    {
      label: 'What ships',
      // Computed, never typed — see the docblock in lib/compare.ts about
      // ratios being the loophole this rule leaked through twice.
      ours: `${TOTAL_COUNT.toLocaleString('en-US')} effects, ${BLOCK_COUNT} blocks, ${PAGE_COUNT} pages, ${TEMPLATE_COUNT} templates`,
      theirs: competitor.ships,
    },
    {
      label: 'Free tier',
      ours:
        'The whole catalog — readable, copyable and installable, with no account. Plus the CLI, the MCP server and an unauthenticated HTTP API.',
      theirs: competitor.freeTier ?? 'None',
    },
    {
      label: 'Design files',
      ours: 'Importable Figma frames and Dev Mode pairing — frames, not a component library',
      theirs: competitor.figma ? 'Yes — a Figma library' : 'No',
    },
    {
      label: 'Agent access',
      ours: 'MCP server, packaged agent skills, a public API and a shadcn registry. No key, no metering.',
      theirs: competitor.agent,
    },
    {
      label: 'What is behind the wall',
      ours: GATE_LABELS[OUR_GATE],
      theirs: GATE_LABELS[competitor.gate],
    },
  ]

  return (
    <div className="relative flex min-h-screen flex-col">
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Alternatives', path: '/alternatives' },
          { name: competitor.name },
        ])}
      />
      <SiteHeader />

      <main
        id="main-content"
        className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20 pt-12 sm:px-6"
      >
        <header>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Link href="/alternatives" className="hover:text-foreground">
              Alternatives
            </Link>
          </p>
          <h1 className="type-page mt-2">Hoverlab vs {competitor.name}</h1>
          <p className="mt-4 text-pretty text-body">
            Both of these are catalogs of ready-made interface code, and the
            interesting differences are not the component counts. They are what each
            one gives away, what each one charges for, and what you are actually
            buying when you pay.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {competitor.name}&rsquo;s figures below were read from{' '}
            <a
              href={competitor.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-foreground"
            >
              their own site
              <ExternalLink aria-hidden className="h-3 w-3" />
            </a>{' '}
            on {dateLabel(competitor.checkedOn)}. Ours are computed from the catalog
            at build time. Prices move; go and check theirs.
          </p>
        </header>

        {/* ------------------------------------------------------------ *
         *  What they do better — first, and at full size.
         * ------------------------------------------------------------ */}
        <section className="mt-10 rounded-xl border border-border bg-muted/40 p-5">
          <h2 className="text-base font-semibold">
            What {competitor.name} does better than we do
          </h2>
          <p className="mt-3 text-pretty text-sm text-muted-foreground">
            {competitor.beatsUs}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            This is the first thing on the page on purpose. You would have found it
            out anyway, and a comparison where the author wins every row is an
            advertisement — which readers of this particular kind of page recognise
            faster than most.
          </p>
        </section>

        {/* ------------------------------------------------------------ *
         *  Side by side
         * ------------------------------------------------------------ */}
        <section className="mt-12">
          <h2 className="type-section">Side by side</h2>

          {/*
            `relative` is required, not decorative. The header row carries an
            `sr-only` span, which is `position: absolute` — and an absolutely
            positioned box in a static overflow container is not clipped by
            it. It escapes to the nearest positioned ancestor and drags the
            whole page sideways. `check-overflow-clip.mts` fails the build on
            this, which is how it was caught here.
          */}
          <div className="relative mt-5 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    <span className="sr-only">Row</span>
                  </th>
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    Hoverlab
                  </th>
                  <th scope="col" className="py-2 font-semibold">
                    {competitor.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-b border-border/60 align-top">
                    <th
                      scope="row"
                      className="w-36 py-3 pr-4 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      {row.label}
                    </th>
                    <td className="py-3 pr-4">{row.ours}</td>
                    <td className="py-3 text-muted-foreground">{row.theirs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ------------------------------------------------------------ *
         *  The gate — the row that is actually a difference of opinion
         * ------------------------------------------------------------ */}
        <section className="mt-12">
          <h2 className="type-section">The difference that is not a number</h2>
          <p className="mt-3 text-pretty text-sm text-muted-foreground">
            Every catalog in this market withholds something until you pay, and{' '}
            {competitor.gate === OUR_GATE
              ? 'this is the one row where we and ' +
                competitor.name +
                ' genuinely agree: both of us sell the right to ship rather than the ability to look.'
              : 'this is where the two businesses actually diverge.'}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                <Check aria-hidden className="h-4 w-4 text-primary" />
                Hoverlab
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{GATE_LABELS[OUR_GATE]}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Everything is readable, copyable and installable before you pay
                anything. What Pro buys is the{' '}
                <Link href="/licence" className="underline underline-offset-4 hover:text-foreground">
                  commercial licence
                </Link>
                .
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/40 p-4">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                <Minus aria-hidden className="h-4 w-4 text-muted-foreground" />
                {competitor.name}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {GATE_LABELS[competitor.gate]}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Read as of {dateLabel(competitor.checkedOn)}.{' '}
                <a
                  href={competitor.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Check it yourself
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ *
         *  Next
         * ------------------------------------------------------------ */}
        <section className="mt-12 rounded-xl border border-border bg-muted/30 p-5">
          <h2 className="text-base font-semibold">Decide for yourself</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You do not have to take any of this on trust — the catalog is open
            without an account, so the fastest way to settle it is to install one
            thing from each and read the code.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link
              href="/browse"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Browse everything
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
            <Link
              href="/compare"
              className="inline-flex h-10 items-center rounded-lg border border-border px-5 text-sm font-semibold transition-colors hover:bg-muted"
            >
              All {COMPETITORS.length} in one table
            </Link>
            <Link
              href="/roadmap"
              className="inline-flex h-10 items-center rounded-lg border border-border px-5 text-sm font-semibold transition-colors hover:bg-muted"
            >
              What is still unfinished
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
