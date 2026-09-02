/**
 * /pricing — the page people look for before they buy.
 *
 * Pricing existed only as a band halfway down the landing page. That meant
 * it could not be linked, could not be shared, and did not exist for anyone
 * searching "hoverlab pricing" — while /pricing itself returned a 404, the
 * one URL a visitor is most likely to type by hand and the one a colleague
 * is most likely to be sent.
 *
 * The tiers themselves are <PricingTiers>, unchanged and unforked. That is
 * the point: /account renders the same component, and a customer who
 * compared plans on this page must not find different numbers, a different
 * currency toggle or a different CTA once they are signed in. This route
 * adds the things a standalone page needs and a mid-page band cannot have —
 * a title, a canonical URL, a share card, structured data and the two
 * sections that answer the objections a price raises.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, History } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { JsonLd } from '@/components/json-ld'
import { PricingTiers } from '@/components/landing/pricing-tiers'
import { ComparisonTable } from '@/components/landing/comparison-table'
import { FaqAccordion } from '@/components/landing/faq-accordion'
import { Button } from '@/components/ui/button'
import { PLANS } from '@/lib/billing/plans'
import { TOTAL_COUNT } from '@/lib/catalog-stats'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { PAGE_COUNT } from '@/lib/pages/page-index'
import { TEMPLATE_COUNT } from '@/lib/templates/template-index'
import { UPDATE_LEDGER } from '@/lib/compare'
import { breadcrumbLd, PUBLISHER } from '@/lib/structured-data'
import { absoluteUrl } from '@/lib/site'

const TITLE = 'Pricing — free forever, Pro once, Team by the seat'
const DESCRIPTION =
  'Every effect, block, page and template is free to browse, customise and copy. Pro is a single payment that covers commercial work for good. Team adds shared brand tokens and seats.'

export const metadata: Metadata = {
  title: `${TITLE} — Hoverlab`,
  description: DESCRIPTION,
  keywords: [
    'hoverlab pricing',
    'ui component library pricing',
    'tailwind components licence cost',
    'css effects commercial use',
  ],
  alternates: { canonical: '/pricing' },
  openGraph: {
    url: absoluteUrl('/pricing'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

/**
 * Structured data for the two paid plans.
 *
 * The USD list price, deliberately — not what any individual visitor is
 * charged. Regional pricing applies a discount at checkout and the currency
 * toggle is a display preference (see `hooks/use-pricing.ts`), so there is
 * no single number that is true for everyone. A search result showing the
 * list price and a checkout showing less is the harmless direction of that
 * mismatch; the reverse would not be.
 */
function offersLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Hoverlab',
    description: DESCRIPTION,
    url: absoluteUrl('/pricing'),
    brand: PUBLISHER,
    offers: [
      {
        '@type': 'Offer',
        name: 'Pro',
        description: 'One-time commercial licence for a single developer.',
        price: (PLANS.pro.priceCents / 100).toFixed(2),
        priceCurrency: 'USD',
        url: absoluteUrl('/pricing'),
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        name: 'Team',
        description: 'Per-seat monthly plan for teams sharing one design system.',
        price: (PLANS.team.priceCents / 100).toFixed(2),
        priceCurrency: 'USD',
        url: absoluteUrl('/pricing'),
        availability: 'https://schema.org/InStock',
      },
    ],
  }
}

export default function PricingPage() {
  const catalogTotal = TOTAL_COUNT + BLOCK_COUNT + PAGE_COUNT + TEMPLATE_COUNT

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <JsonLd data={offersLd()} />
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Pricing' }])} />

      <main>
        <header className="mx-auto max-w-3xl px-4 pt-14 text-center sm:px-6">
          <h1 className="type-display text-gradient-heading">Pricing</h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-body sm:text-lg">
            All {catalogTotal.toLocaleString('en-US')} artifacts are free to
            browse, customise and copy — no account needed, and{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
              npx hoverlab add
            </code>{' '}
            takes no credentials. What the paid plans buy is what you are
            allowed to ship, and the features that come with shipping it.
          </p>
        </header>

        {/*
          The same section the landing page and /account render. Its own
          <h2> and currency toggle come with it, so this page adds a title
          above it and nothing else.
        */}
        <PricingTiers className="pt-10 sm:pt-14" />

        {/* Why this rather than the alternatives — the objection a price
            raises, answered where it is raised rather than only on the
            landing page a buyer may never scroll. */}
        <ComparisonTable />

        {/* That table compares approaches — hand-writing it, or pulling a
            package. The other question a price raises is about the named
            products in the next tab, and the answer to that one is a page of
            its own because it carries other people's figures and has to date
            them. */}
        {/*
          The update window's other half, said where the window is sold.

          The Pro card promises twelve months of catalog updates. Until now
          nothing on this page said how a buyer would ever RECEIVE one — the
          machinery has shipped for weeks (a revision per artifact, a public
          endpoint, `hoverlab outdated`) and appeared on no page anyone reads
          before paying. A bounded update window with no delivery mechanism
          reads as a limitation; with one, it is the feature.
        */}
        <section className="mx-auto max-w-3xl px-4 pb-10 sm:px-6">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
            <div className="flex items-start gap-4">
              <History aria-hidden className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  {UPDATE_LEDGER.claim}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Twelve months of updates only means something if you can
                  tell when one has landed. Every artifact carries a content
                  revision, the whole ledger is a public endpoint with no key,
                  and the CLI compares your installed copy against it:
                </p>
                <pre className="mt-4 overflow-x-auto rounded-lg border border-border/60 bg-muted/50 p-4 text-xs">
                  <code>{`npx hoverlab outdated      # what has moved since you installed it
npx hoverlab diff hero-split   # the lines that changed`}</code>
                </pre>
                <p className="mt-3 text-sm text-muted-foreground">
                  Nothing reaches into your repo and nothing phones home —
                  applying a change is always your call.{' '}
                  <Link
                    href="/compare"
                    className="font-medium underline underline-offset-4"
                  >
                    Why this is the row the comparison table cannot hold
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-4 sm:px-6">
          <p className="text-center text-sm text-muted-foreground">
            Comparing against a specific catalog?{' '}
            <Link href="/compare" className="font-medium underline underline-offset-4">
              What the nine paid ones cost and withhold
            </Link>
            , including the rows where they beat us.
          </p>
        </section>

        <FaqAccordion />

        <section className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-6 text-center">
            <ShieldCheck aria-hidden className="mx-auto mb-3 h-8 w-8 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">
              Still deciding? Nothing here is behind the payment.
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Open any artifact, read its source, install it and run it. The
              catalog, the CLI and the public API all work before you have paid
              anything — so you can be sure the code is worth buying a licence
              for before you buy one.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/browse">
                  Browse the catalog
                  <ArrowRight aria-hidden className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/docs">Read the docs</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
