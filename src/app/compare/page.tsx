import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, ExternalLink, Minus } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { TOTAL_COUNT } from '@/lib/catalog-stats'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { PAGE_COUNT } from '@/lib/pages/page-index'
import { TEMPLATE_COUNT } from '@/lib/templates/template-index'
import { DESIGNER_TOOLS } from '@/lib/designer-tools'
import { PLANS, formatPrice } from '@/lib/billing/plans'
import {
  CHECKED_ON,
  CHECKED_ON_LABEL,
  COMPETITORS,
  GATE_LABELS,
  OUR_GATE,
  WHERE_THEY_WIN,
} from '@/lib/compare'
import { absoluteUrl } from '@/lib/site'

/**
 * /compare — what everything else in this category costs and withholds.
 *
 * WHY THIS PAGE EXISTS
 *
 * Someone deciding between component catalogs opens six tabs and builds
 * this table themselves. Building it for them is worth doing for the
 * obvious reason and one better one: our position only makes sense in
 * company. "$79, nothing gated at browse or copy" reads as a cheap product
 * on its own, and reads as a different business model next to eight vendors
 * whose entry price is $99 to $349 and who all gate the source.
 *
 * The price row is the reason to be careful. Being the cheapest thing in a
 * table is not automatically an argument — under about half the going rate
 * it stops reading as good value and starts reading as a hobby project,
 * which is why the ladder moved off $59 before this page was written.
 *
 * THE HONESTY IS THE MECHANISM, NOT THE DECORATION
 *
 * Every competitor row carries a `beatsUs` and the page renders all of them
 * at full size, in their own section, above the fold of the argument rather
 * than in a footnote. This is not modesty. A comparison table where the
 * author wins every row is an advertisement, and the person reading a
 * comparison page is the single most sceptical visitor this site gets —
 * they came here because they did not believe the pricing page. Conceding
 * the block gap in our own words is what buys belief for the rows we do
 * win, and the block gap is a number they can check in thirty seconds
 * anyway.
 *
 * OUR NUMBERS COME FROM THE CATALOG, THEIRS COME WITH A DATE
 *
 * Everything about Hoverlab on this page is computed — the counts from the
 * indexes, the price from PLANS. Nothing here can drift from what we
 * actually ship. Their figures cannot work that way, so they carry
 * CHECKED_ON instead, rendered where a reader sees it rather than in a
 * comment. See `lib/compare.ts` for what is deliberately absent from that
 * file, including our nearest neighbour.
 */

const TITLE = 'Hoverlab vs the paid component catalogs — Hoverlab'
const DESCRIPTION =
  'What React Bits, Preline, Tailwind Plus, Shadcnblocks, Untitled UI, Aceternity, Magic UI, Flowbite and 21st.dev cost, what they ship, and what each one puts behind the wall — including the rows where they beat us.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'react bits alternative',
    'tailwind plus alternative',
    'shadcn ui blocks comparison',
    'component library pricing',
    'preline vs',
  ],
  alternates: { canonical: '/compare' },
  openGraph: {
    url: absoluteUrl('/compare'),
    title: TITLE,
    description: DESCRIPTION,
  },
}

const TOOL_COUNT = DESIGNER_TOOLS.length
const PRO_PRICE = formatPrice(PLANS.pro.priceCents)

/** Entry price as one string, whatever the term. */
function entryLabel(usd: number | null, term: string): string {
  if (usd === null) return 'Free'
  return term === 'per month' ? `$${usd}/mo` : `$${usd}`
}

export default function ComparePage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <section className="mx-auto w-full max-w-3xl px-4 pb-12 pt-16 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Compared, {CHECKED_ON_LABEL}
          </p>
          <h1 className="type-page mt-3">
            Everyone here gates something. We gate one thing.
          </h1>

          <div className="mt-5 space-y-4 text-body">
            <p>
              Nine paid catalogs, read off their own pricing pages on{' '}
              <time dateTime={CHECKED_ON}>{CHECKED_ON_LABEL}</time>. Eight of
              them sell you the source: you can look at a component, and the
              code is the purchase. One sells agent access by subscription.
            </p>
            <p>
              Hoverlab sells neither.{' '}
              {TOTAL_COUNT.toLocaleString('en-US')} effects, {BLOCK_COUNT}{' '}
              blocks, {PAGE_COUNT} pages, {TEMPLATE_COUNT} templates and{' '}
              {TOOL_COUNT} designer tools are readable, customisable and
              copyable without an account, and the API and MCP server are open
              to anyone. What {PRO_PRICE} buys is the right to ship what you
              copied in something commercial — which is the only thing here
              that was ever really being withheld.
            </p>
            <p className="text-sm text-muted-foreground">
              Their prices are list prices in their own currency and they move.
              Ours are computed from the catalog on every build, so the counts
              above are what is live right now rather than what was true when
              this page was written.
            </p>
          </div>
        </section>

        {/*
          The concessions come BEFORE the table.

          Deliberate, and the whole reason this page can be believed. A
          reader who meets the block gap in our own words in section two
          reads the table in section three as information; a reader who
          finds it themselves in section five reads everything above it
          again, looking for what else was left out.
        */}
        <section
          className="mx-auto w-full max-w-3xl px-4 pb-14 sm:px-6 lg:px-8"
          aria-labelledby="they-win-heading"
        >
          <h2 id="they-win-heading" className="text-2xl font-bold tracking-tight">
            Where they beat us
          </h2>
          <p className="mt-3 text-body text-muted-foreground">
            Five things you would find out in an afternoon of tab-opening. If
            any of them is the thing you are buying on, buy theirs.
          </p>

          <dl className="mt-6 divide-y divide-border/60 rounded-2xl border border-border/60">
            {WHERE_THEY_WIN.map((item) => (
              <div key={item.claim} className="px-5 py-4">
                <dt className="text-sm font-semibold">{item.claim}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{item.detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6 lg:px-8"
          aria-labelledby="table-heading"
        >
          <h2 id="table-heading" className="text-2xl font-bold tracking-tight">
            Side by side
          </h2>
          <p className="mt-3 max-w-3xl text-body text-muted-foreground">
            Entry price is for one individual. The column that actually
            separates these products is the last one.
          </p>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-border/60">
            <table className="w-full min-w-[60rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Entry price, contents, design files, agent access and what is
                behind the paywall, for Hoverlab and nine competing component
                catalogs, as listed on {CHECKED_ON_LABEL}.
              </caption>
              <thead>
                <tr className="border-b border-border/60 bg-muted/40">
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Catalog
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Entry
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Ships
                  </th>
                  <th scope="col" className="px-4 py-3 text-center font-semibold">
                    Figma
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Agents
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Behind the wall
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {/* Us first, and highlighted, because the reader knows whose
                    page they are on. A table that hides its author among the
                    alphabet is being coy about something the reader worked
                    out before the page loaded. */}
                <tr className="bg-primary/5">
                  <th scope="row" className="px-5 py-4 font-semibold">
                    Hoverlab
                  </th>
                  <td className="px-4 py-4">
                    <span className="font-semibold">{PRO_PRICE}</span>
                    <span className="block text-xs text-muted-foreground">one-time</span>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {TOTAL_COUNT.toLocaleString('en-US')} effects, {BLOCK_COUNT}{' '}
                    blocks, {PAGE_COUNT} pages, {TEMPLATE_COUNT} templates,{' '}
                    {TOOL_COUNT} tools
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Minus className="mx-auto h-4 w-4 text-muted-foreground" aria-hidden />
                    <span className="sr-only">
                      No design files — a token file a designer can import, and no drawn
                      components
                    </span>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    Free MCP server, free unauthenticated REST API, CLI
                  </td>
                  <td className="px-4 py-4 font-medium">{GATE_LABELS[OUR_GATE]}</td>
                </tr>

                {COMPETITORS.map((c) => (
                  <tr key={c.name}>
                    <th scope="row" className="px-5 py-4 font-medium">
                      <a
                        href={c.href}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                      >
                        {c.name}
                        <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden />
                      </a>
                    </th>
                    <td className="px-4 py-4">
                      <span className="font-semibold">
                        {entryLabel(c.entryUsd, c.entryTerm)}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {c.entryTerm === 'per month' ? 'subscription' : c.entryTerm}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{c.ships}</td>
                    <td className="px-4 py-4 text-center">
                      {c.figma ? (
                        <>
                          <Check className="mx-auto h-4 w-4 text-foreground" aria-hidden />
                          <span className="sr-only">Ships design files</span>
                        </>
                      ) : (
                        <>
                          <Minus
                            className="mx-auto h-4 w-4 text-muted-foreground"
                            aria-hidden
                          />
                          <span className="sr-only">No design files</span>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{c.agent}</td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {GATE_LABELS[c.gate]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Figures read from each vendor&apos;s own pages on{' '}
            <time dateTime={CHECKED_ON}>{CHECKED_ON_LABEL}</time>. Follow any
            name to check it — if one of these is out of date, it is out of
            date here and we would rather hear about it.
          </p>
        </section>

        <section
          className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6 lg:px-8"
          aria-labelledby="ledger-heading"
        >
          <h2 id="ledger-heading" className="text-2xl font-bold tracking-tight">
            What is actually different here
          </h2>

          <div className="mt-5 space-y-4 text-body">
            <p>
              Not the price, and not the agent support. A free MCP server is
              common now — Magic UI ships one under MIT with no API key, and
              shadcn&apos;s own server ships with every v4 install. Anyone in
              the table above could match ours in a weekend, and one of them
              already has.
            </p>
            <p>
              What is hard to copy is the shape of the whole thing: a ladder
              that runs effect to block to page to template as one system,{' '}
              {TOOL_COUNT} designer tools no other catalog bundles, a public
              API with no key, prices that follow the country you are actually
              in, and a single wall at the point of commercial use. Every
              piece of that is cheap to copy on its own. The combination is
              not, and it is what {PRO_PRICE} is buying a licence to.
            </p>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Browse the catalog
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-muted"
            >
              See what {PRO_PRICE} covers
            </Link>
            <Link
              href="/licence"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-muted"
            >
              Read the licence
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
