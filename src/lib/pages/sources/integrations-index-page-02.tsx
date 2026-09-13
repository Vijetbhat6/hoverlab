/**
 * The integrations index, take 02 — a directory you search, not a page you read.
 *
 *   search      one field, because the visitor arrived holding a vendor name
 *   toolbar     count and sort, so the size of the catalogue is honest
 *   facets      with counts on every option, including the zeroes
 *   grid        the results
 *   miss        what to do when the answer is no
 *
 * Take 01 leads with `hero-integrations` and a curated grid, which is the
 * right shape for a dozen connections: the reader can see all of them, and
 * the status badge on each card does the work.
 *
 * Past roughly forty it inverts. Nobody browses an integration directory —
 * they arrive from a search engine or a sales call with exactly one vendor
 * name in mind, and every second before the search box is friction. So this
 * take opens on `hero-search` and treats the grid as a result set.
 *
 * The facet counts are the load-bearing detail. A facet list that hides its
 * zeroes lets a reader filter to "Payroll" and find nothing, which feels
 * like a broken page; showing "Payroll (0)" up front tells them the truth in
 * the one place they were going to look anyway.
 *
 * The last section is the one most integration directories lack: a form for
 * when the answer is no. A directory whose failure state is a blank result
 * area loses the visitor and the signal at the same time — and the request
 * count is genuinely how the roadmap gets ordered.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroSearch } from '@/lib/blocks/sources/hero-search'
import { CollectionToolbar } from '@/lib/blocks/sources/collection-toolbar'
import { SearchFacetPanel } from '@/lib/blocks/sources/search-facet-panel'
import { IntegrationGrid } from '@/lib/blocks/sources/integration-grid'
import { DemoRequestForm } from '@/lib/blocks/sources/demo-request-form'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const SORTS = [
  { value: 'relevance', label: 'Most relevant' },
  { value: 'popular', label: 'Most used' },
  { value: 'recent', label: 'Recently added' },
  { value: 'az', label: 'A to Z' },
]

const FACETS = [
  {
    id: 'status',
    label: 'Status',
    options: [
      { id: 'live', label: 'Live', count: 31 },
      { id: 'beta', label: 'Beta', count: 7 },
      { id: 'planned', label: 'Planned', count: 5 },
    ],
  },
  {
    id: 'category',
    label: 'Category',
    options: [
      { id: 'ledger', label: 'General ledger', count: 9 },
      { id: 'banking', label: 'Banking and cards', count: 12 },
      { id: 'billing', label: 'Billing and invoicing', count: 8 },
      { id: 'storage', label: 'Storage and export', count: 6 },
      { id: 'alerting', label: 'Alerting', count: 4 },
      { id: 'payroll', label: 'Payroll', count: 0 },
    ],
    visibleLimit: 5,
  },
  {
    id: 'direction',
    label: 'Direction',
    options: [
      { id: 'read', label: 'Reads only', count: 18 },
      { id: 'write', label: 'Reads and writes', count: 21 },
      { id: 'webhook', label: 'Pushes to us', count: 14 },
    ],
  },
  {
    id: 'plan',
    label: 'Required plan',
    options: [
      { id: 'all', label: 'All plans', count: 26 },
      { id: 'business', label: 'Business and above', count: 12 },
      { id: 'enterprise', label: 'Enterprise only', count: 5 },
    ],
  },
]

const RESULTS = [
  {
    name: 'NetSuite',
    description: 'Two-way. Journals, subsidiaries and the chart of accounts. Conflict resolution is last-write-wins with a review queue.',
    status: 'live' as const,
    category: 'General ledger',
  },
  {
    name: 'Xero',
    description: 'Two-way, including tracking categories. The only connector that supports multi-currency revaluation on our side.',
    status: 'live' as const,
    category: 'General ledger',
  },
  {
    name: 'Sage Intacct',
    description: 'Two-way. Dimension mapping is manual on first setup and takes about an hour.',
    status: 'live' as const,
    category: 'General ledger',
  },
  {
    name: 'Dynamics 365 Finance',
    description: 'Reads only for now. Writing journals is in the March release and the beta is open.',
    status: 'beta' as const,
    category: 'General ledger',
  },
  {
    name: 'Stripe',
    description: 'Payouts, fees and disputes, reconciled to the penny including the FX leg.',
    status: 'live' as const,
    category: 'Banking and cards',
  },
  {
    name: 'Plaid',
    description: 'Bank feeds across 11,000 institutions. We do not store credentials; Plaid holds them.',
    status: 'live' as const,
    category: 'Banking and cards',
  },
  {
    name: 'Ramp',
    description: 'Card transactions and receipts, with the memo field mapped to your match key.',
    status: 'live' as const,
    category: 'Banking and cards',
  },
  {
    name: 'QuickBooks Online',
    description: 'Two-way. Known limitation: classes do not round-trip cleanly and we flag rather than guess.',
    status: 'beta' as const,
    category: 'General ledger',
  },
  {
    name: 'Workday Financials',
    description: 'Scoped, not started. Five customers waiting. Realistically second half of 2026.',
    status: 'planned' as const,
    category: 'General ledger',
  },
]

export default function IntegrationsIndexPage02() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Integrations" ctaLabel="Request one" ctaHref="#integrations-index-page-02-request" />

      <main>
        <HeroSearch
          inputId="integrations-index-02-search"
          heading="Forty-three connections"
          subheading="Thirty-one live, seven in beta, five scoped and not started. Search the vendor name — nobody browses one of these."
          placeholder="Search a vendor, e.g. NetSuite, Stripe, Ramp"
          submitLabel="Search"
          suggestions={['NetSuite', 'Xero', 'Stripe', 'Plaid', 'Sage Intacct']}
        />

        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <CollectionToolbar total={43} sortOptions={SORTS} />
        </div>

        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:px-8">
          {/*
            Counts on every option, zeroes included. "Payroll (0)" answers
            the question in the list the reader is already reading, instead
            of answering it with an empty grid two clicks later.
          */}
          <SearchFacetPanel facets={FACETS} resultCount={43} />

          <IntegrationGrid
            heading="Results"
            subheading="Status is on every card and it is the real one — beta means beta, and the planned rows carry the number of customers waiting rather than a quarter we would miss."
            integrations={RESULTS}
          />
        </div>

        <div id="integrations-index-page-02-request">
          <DemoRequestForm
            heading="Not on the list?"
            intro="This form is genuinely how the order gets decided — the five planned connectors above are the five with the most requests. Tell us the vendor and roughly how many entities it covers."
            submitLabel="Request this connector"
          />
        </div>
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
