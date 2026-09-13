/**
 * The case study index, take 02 — a results directory, not a reading list.
 *
 *   search      a phrase, because the reader has a situation not a category
 *   filters     what is narrowing the list, visible and removable
 *   results     faceted, scannable, sortable
 *   benchmark   the aggregate, so one result can be judged against the set
 *
 * Take 01 is a reading list: excerpts that lead with the outcome, filterable
 * by industry. It works when there are nine case studies and the reader has
 * time to browse.
 *
 * At forty-plus it breaks, and it breaks in a specific way — an excerpt grid
 * makes every study look equally relevant, so the reader reads two and
 * leaves. This take treats the collection as a directory instead: search by
 * the situation you are in, narrow by entity count and system and industry,
 * and compare on the metric you care about rather than on which card has the
 * nicest photograph.
 *
 * The cost is real and worth naming: a faceted directory is a worse first
 * impression than a grid of stories. It looks like software rather than
 * like proof. That trade only pays above roughly thirty studies, which is
 * the number at which browsing stops working — below that, take 01 wins and
 * this one is premature.
 *
 * `stats-benchmark-band` sits at the bottom rather than the top on purpose.
 * Leading with "our average customer closes 38% faster" is the aggregate
 * claim the reader distrusts most; it lands differently after they have
 * seen the thirty-four individual rows it was computed from.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroSearch } from '@/lib/blocks/sources/hero-search'
import { AppliedFiltersBar } from '@/lib/blocks/sources/applied-filters-bar'
import { SearchFacetedResults } from '@/lib/blocks/sources/search-faceted-results'
import { StatsBenchmarkBand } from '@/lib/blocks/sources/stats-benchmark-band'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const ACTIVE_FILTERS = [
  { id: 'published', field: 'Status', value: 'Published', locked: true },
  { id: 'entities', field: 'Entities', value: '10–15' },
  { id: 'system', field: 'Ledger', value: 'NetSuite' },
]

const SORTS = [
  { value: 'relevance', label: 'Most relevant' },
  { value: 'improvement', label: 'Biggest improvement' },
  { value: 'recent', label: 'Most recent' },
  { value: 'size', label: 'Company size' },
]

const FACETS = [
  {
    id: 'industry',
    label: 'Industry',
    options: [
      { id: 'food', label: 'Food and beverage' },
      { id: 'saas', label: 'Software' },
      { id: 'retail', label: 'Retail' },
      { id: 'logistics', label: 'Logistics' },
      { id: 'nonprofit', label: 'Non-profit' },
    ],
  },
  {
    id: 'entities',
    label: 'Entities',
    options: [
      { id: '1-3', label: '1–3' },
      { id: '4-9', label: '4–9' },
      { id: '10-15', label: '10–15' },
      { id: '16+', label: '16 or more' },
    ],
  },
  {
    id: 'ledger',
    label: 'Ledger',
    options: [
      { id: 'netsuite', label: 'NetSuite' },
      { id: 'xero', label: 'Xero' },
      { id: 'sage', label: 'Sage Intacct' },
      { id: 'dynamics', label: 'Dynamics 365' },
    ],
  },
]

const RESULTS = [
  {
    id: 'meridian',
    title: 'Close from 9 days to 4, across 11 entities',
    vendor: 'Meridian Foods',
    price: '−56% close time',
    rating: 4.8,
    reviews: 8,
    added: 1,
    attrs: { Industry: 'Food and beverage', Entities: '11', Ledger: 'NetSuite' },
  },
  {
    id: 'northwind',
    title: 'Two restatements to none in four quarters',
    vendor: 'Northwind Logistics',
    price: '−41% close time',
    rating: 4.6,
    reviews: 12,
    added: 2,
    attrs: { Industry: 'Logistics', Entities: '14', Ledger: 'NetSuite' },
  },
  {
    id: 'kestrel',
    title: 'One controller, twelve entities, no weekend work',
    vendor: 'Kestrel Software',
    price: '−49% close time',
    rating: 4.9,
    reviews: 6,
    added: 3,
    attrs: { Industry: 'Software', Entities: '12', Ledger: 'Xero' },
  },
  {
    id: 'harbourside',
    title: 'Where it did not work: a 6-month rollout that should have been 2',
    vendor: 'Harbourside Retail',
    price: '−18% close time',
    rating: 3.4,
    reviews: 9,
    added: 4,
    attrs: { Industry: 'Retail', Entities: '15', Ledger: 'Sage Intacct' },
  },
  {
    id: 'lantern',
    title: 'Grant reporting and close on the same rule set',
    vendor: 'Lantern Trust',
    price: '−37% close time',
    rating: 4.7,
    reviews: 4,
    added: 5,
    attrs: { Industry: 'Non-profit', Entities: '10', Ledger: 'Xero' },
  },
]

const AGGREGATE = [
  { label: 'Median close improvement', value: '−38%', detail: 'Across all 34 published studies' },
  { label: 'Median time to first value', value: '3 weeks', detail: 'Slowest published: 9 weeks' },
  { label: 'Studies where we underperformed', value: '4', detail: 'All four are in this directory' },
]

export default function CaseStudyIndexPage02() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Customers" ctaLabel="Talk to us" ctaHref="#case-study-index-page-02-talk" />

      <main>
        <HeroSearch
          inputId="case-study-index-02-search"
          heading="Thirty-four closes, searchable"
          subheading="Search the situation rather than the industry — most readers arrive with a problem shape (&ldquo;eleven entities, three currencies&rdquo;) rather than a category."
          placeholder="e.g. multi-currency, NetSuite, 12 entities"
          submitLabel="Search studies"
          suggestions={[
            'multi-entity consolidation',
            'NetSuite migration',
            'restatement risk',
            'one-person finance team',
          ]}
        />

        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <AppliedFiltersBar
            filters={ACTIVE_FILTERS}
            matched={5}
            total={34}
            sortOptions={SORTS}
          />
        </div>

        <SearchFacetedResults facets={FACETS} items={RESULTS} />

        {/*
          Bottom, not top. "Our customers close 38% faster" is the least
          credible sentence on the page in isolation and one of the more
          credible ones directly beneath the thirty-four rows it came from —
          four of which are the studies where we did badly.
        */}
        <StatsBenchmarkBand
          eyebrow="Across the whole set"
          heading="What the thirty-four add up to"
          intro="Including the four where the rollout went badly. Those are published in the same directory rather than in a footnote, and they are filterable like everything else."
          metrics={AGGREGATE}
        />

        <div id="case-study-index-page-02-talk">
          <CtaSplitPanel
            heading="None of these look like you?"
            supporting="Tell us the entity count, the ledger and the thing that currently takes longest. If we have no comparable customer we will say so rather than send you the closest logo."
            primaryLabel="Describe your close"
            secondaryLabel="Browse all thirty-four"
          />
        </div>
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
