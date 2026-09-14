/**
 * /markets — the public price screen of an exchange.
 *
 *   ticker     the rail, again, because this is the page it belongs on most
 *   movers     the four numbers that frame the session
 *   depth      one pair drawn over a day
 *   listings   the assets, as a comparison of what each one supports
 *   answers    what the numbers on this page do and do not mean
 *
 * This is the screen a fintech template cannot borrow from a SaaS one. It
 * is pre-authentication, it is the most-visited page on every exchange by a
 * wide margin, and it is almost entirely numbers — which means every design
 * decision on it is about making numbers comparable rather than about
 * hierarchy or persuasion.
 *
 * <MetricSparklineCards> RATHER THAN A TABLE FOR THE MOVERS. A sparkline is
 * the only way to show that two assets both up 4% got there differently —
 * one climbing steadily, one spiking and giving it back — and that shape is
 * the actual information a trader is scanning for. A percentage column
 * flattens both into the same cell.
 *
 * <DataTableSortable> IS DELIBERATELY NOT USED, even though a sortable
 * table is obviously what a real markets page ships. Its `Row` type is
 * concretely a customer record — name, email, plan, MRR, status — so using
 * it here would mean either lying about the data or widening a block's
 * types to serve one page. <ComparisonTable> carries the listing detail
 * instead, which is the honest shape for "which of these assets can I
 * actually deposit, stake and withdraw", and is the question a listings
 * page is really answering once price is on the ticker above it.
 *
 * NOTHING ON THIS PAGE IS LIVE AND IT SAYS SO IN THREE PLACES. A market
 * screen with stale numbers and no timestamp is worse than no market
 * screen, and a template that teaches the omission ships it into every
 * project built from it.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { PriceTickerStrip } from '@/lib/blocks/sources/price-ticker-strip'
import { MetricSparklineCards } from '@/lib/blocks/sources/metric-sparkline-cards'
import { LineChartPanel } from '@/lib/blocks/sources/line-chart-panel'
import { ComparisonTable } from '@/lib/blocks/sources/comparison-table'
import { FaqAccordion } from '@/lib/blocks/sources/faq-accordion'
import { FooterStatusLocale } from '@/lib/blocks/sources/footer-status-locale'

const MOVERS = [
  {
    label: 'BTC / USD',
    value: '$63,204',
    delta: 2.41,
    series: [61180, 61420, 60980, 61760, 62340, 62110, 62880, 63510, 63204],
  },
  {
    label: 'ETH / USD',
    value: '$3,118',
    delta: 1.08,
    series: [3084, 3061, 3092, 3140, 3108, 3072, 3096, 3131, 3118],
  },
  {
    label: 'SOL / USD',
    value: '$147.93',
    delta: -3.22,
    series: [152.8, 154.1, 153.2, 150.6, 149.8, 151.2, 148.4, 146.9, 147.93],
  },
  {
    label: '30-day volume',
    value: '$4.1bn',
    delta: 8.6,
    series: [3.2, 3.4, 3.3, 3.6, 3.8, 3.7, 3.9, 4.0, 4.1],
  },
]

const SESSION_LABELS = [
  '00:00',
  '03:00',
  '06:00',
  '09:00',
  '12:00',
  '15:00',
  '18:00',
  '21:00',
  '24:00',
]

const SESSION_SERIES = [
  {
    name: 'BTC / USD',
    values: [61180, 61420, 60980, 61760, 62340, 62110, 62880, 63510, 63204],
    area: true,
  },
]

const LISTING_ROWS = [
  { feature: 'Spot trading', values: [true, true, true, true] },
  { feature: 'Deposits and withdrawals', values: [true, true, true, true] },
  { feature: 'Networks supported', values: ['Bitcoin, Lightning', 'Ethereum, Base, Arbitrum', 'Solana', 'Ethereum, Solana, Base'] },
  { feature: 'Minimum withdrawal', values: ['0.0002 BTC', '0.005 ETH', '0.02 SOL', '10 USDC'] },
  { feature: 'Staking', values: [false, true, true, false] },
  { feature: 'Used as trading collateral', values: [true, true, false, true] },
  { feature: 'Listed since', values: ['2019', '2019', '2021', '2020'] },
]

const NOTES = [
  {
    question: 'How fresh are the prices on this page?',
    answer:
      'The rail at the top of the page is indicative and delayed by roughly fifteen minutes. Prices inside the trading screen are live from the order book and are the only ones an order is filled at. If the two disagree, the order book is right and this page is stale.',
  },
  {
    question: 'Why does your price differ from the one on a price-tracking site?',
    answer:
      'Those sites publish a volume-weighted average across dozens of venues. We publish the last trade on our own book. Neither is wrong; they are answers to different questions, and the one that matters for an order you are about to place is ours.',
  },
  {
    question: 'What does the 24-hour change actually compare?',
    answer:
      'The last trade now against the last trade at the same clock time yesterday, in UTC, on this venue. It is not a calendar-day figure and it does not reset at midnight in your own time zone — which is why two exchanges can honestly report different daily changes for the same asset.',
  },
  {
    question: 'An asset I hold is not listed here any more. What happened?',
    answer:
      'Delisting is announced at least 30 days in advance by email and on the status page, and withdrawals stay open for 12 months afterwards. Nothing is ever seized — if you miss the window, open a support ticket and we will process it manually.',
  },
]

export default function MarketsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Meridian"
        links={[
          { label: 'Markets', href: '#mk-movers' },
          { label: 'Security', href: '#' },
          { label: 'Fees', href: '#' },
          { label: 'Developers', href: '#' },
        ]}
        activeLabel="Markets"
        signInLabel="Sign in"
        ctaLabel="Open an account"
      />

      <PriceTickerStrip asOf="Indicative prices, delayed 15 minutes · last updated 14:42 UTC" />

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Markets</h1>
          <p className="mt-3 text-pretty text-muted-foreground">
            214 assets, 96 pairs, and the fee you pay on each of them on one page. Everything
            here is indicative and delayed — the order book is the only live price, and it is
            the one your order fills at.
          </p>
        </header>

        <div id="mk-movers" className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            The session so far
          </h2>
          <div className="mt-4">
            <MetricSparklineCards metrics={MOVERS} />
          </div>
        </div>

        <div className="mt-12">
          <LineChartPanel
            heading="BTC / USD, last 24 hours"
            description="Last trade on this venue, sampled every three hours, in UTC. Not a volume-weighted average across exchanges — see the notes below for why that matters."
            labels={SESSION_LABELS}
            series={SESSION_SERIES}
          />
        </div>
      </main>

      <ComparisonTable
        heading="What each listing actually supports"
        subheading="Once the price is on the rail above, this is the question a listings page is really answering: which networks, what minimum, and can I stake it."
        columns={['BTC', 'ETH', 'SOL', 'USDC']}
        rows={LISTING_ROWS}
      />

      <FaqAccordion
        heading="What the numbers on this page mean"
        subheading="Four questions that come up every time somebody compares our price with somebody else’s and finds a difference."
        items={NOTES}
      />

      <FooterStatusLocale
        productName="Meridian"
        statusHref="#"
        version="Market data v4"
        links={[
          { label: 'API documentation', href: '#' },
          { label: 'Fee schedule', href: '#' },
          { label: 'Proof of reserves', href: '#' },
          { label: 'Risk warning', href: '#' },
        ]}
      />
    </div>
  )
}
