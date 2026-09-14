/**
 * A directory's index — search, facets, and a reason to trust the list.
 *
 *   search     the query
 *   results    faceted, because a directory without facets is a long page
 *   method     how entries get in and how they are kept current
 *   categories what else is in here
 *   submit     the other side of the marketplace
 *   answers    paid placement, removals, staleness
 *
 * A DIRECTORY LIVES OR DIES ON WHETHER THE LIST IS BELIEVED, and every
 * design decision here follows from that. The two things a visitor is
 * silently assessing are "is this current" and "is this ranked by who
 * paid", and both are answered in a named section rather than left to be
 * guessed — which is the opposite of what most directories do, because the
 * honest answer is usually embarrassing.
 *
 * <SearchFacetedResults> IS THE PAGE. It carries facets, a result grid and
 * the sort in one block, which is exactly the directory shape; building it
 * out of <ProductGrid> plus <ProductFilterSidebar> would produce the same
 * screen with two blocks that do not know about each other, and a facet
 * count that cannot reflect the current filter.
 *
 * THE FACETS ARE THE TAXONOMY AND THEY ARE THE PRODUCT DECISION. "Pricing
 * model", "hosting" and "has a free tier" are the filters a buyer actually
 * uses; "category" is the one every directory leads with and the one nobody
 * filters by, because they already know the category — it is why they are
 * here. So the categories are a navigation section lower down rather than
 * the primary facet.
 *
 * <StatsBenchmarkBand> CARRIES THE FRESHNESS NUMBERS: when the index was
 * last rechecked, how many entries were removed last month, and how many
 * are paid. A directory that publishes its removal rate is making a claim
 * that can be checked, which is the only kind worth making.
 *
 * Anchors are prefixed `dr-`.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroSearch } from '@/lib/blocks/sources/hero-search'
import { SearchFacetedResults } from '@/lib/blocks/sources/search-faceted-results'
import { StatsBenchmarkBand } from '@/lib/blocks/sources/stats-benchmark-band'
import { FeatureIconGrid } from '@/lib/blocks/sources/feature-icon-grid'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FaqTwoColumn } from '@/lib/blocks/sources/faq-two-column'
import { FooterMega } from '@/lib/blocks/sources/footer-mega'
import { Boxes, GitBranch, LineChart, Lock, Server, Workflow } from 'lucide-react'

const FACETS = [
  {
    id: 'dr-pricing',
    label: 'Pricing model',
    options: [
      { id: 'free', label: 'Has a free tier' },
      { id: 'flat', label: 'Flat monthly' },
      { id: 'usage', label: 'Usage-based' },
      { id: 'onetime', label: 'One-time licence' },
      { id: 'oss', label: 'Open source' },
    ],
  },
  {
    id: 'dr-hosting',
    label: 'Hosting',
    options: [
      { id: 'cloud', label: 'Cloud only' },
      { id: 'selfhost', label: 'Self-hostable' },
      { id: 'onprem', label: 'On-premise supported' },
    ],
  },
  {
    id: 'dr-compliance',
    label: 'Compliance',
    options: [
      { id: 'soc2', label: 'SOC 2 Type II' },
      { id: 'hipaa', label: 'HIPAA' },
      { id: 'eu', label: 'EU data residency' },
    ],
  },
  {
    id: 'dr-integrations',
    label: 'Integrates with',
    options: [
      { id: 'slack', label: 'Slack' },
      { id: 'github', label: 'GitHub' },
      { id: 'datadog', label: 'Datadog' },
      { id: 'snowflake', label: 'Snowflake' },
    ],
  },
]

const ENTRIES = [
  {
    id: 'ratchet',
    title: 'Ratchet',
    vendor: 'Open source',
    price: 'Free',
    rating: 4.8,
    reviews: 214,
    added: 6,
    attrs: { Pricing: 'Open source', Hosting: 'Self-hostable', Checked: '4 days ago' },
  },
  {
    id: 'halyard',
    title: 'Halyard Migrate',
    vendor: 'Halyard Software',
    price: 'From $49/mo',
    rating: 4.4,
    reviews: 88,
    added: 21,
    attrs: { Pricing: 'Flat monthly', Hosting: 'Cloud only', Checked: '4 days ago' },
  },
  {
    id: 'northwind-schema',
    title: 'Northwind Schema',
    vendor: 'Northwind',
    price: 'Usage-based',
    rating: 4.1,
    reviews: 42,
    added: 34,
    attrs: { Pricing: 'Usage-based', Hosting: 'Cloud only', Checked: '11 days ago' },
  },
  {
    id: 'umbra-ledger',
    title: 'Umbra Ledger',
    vendor: 'Umbra Labs',
    price: '$890 one-time',
    rating: 4.6,
    reviews: 61,
    added: 58,
    attrs: { Pricing: 'One-time licence', Hosting: 'On-premise supported', Checked: '4 days ago' },
  },
  {
    id: 'contoso-drift',
    title: 'Contoso Drift',
    vendor: 'Contoso',
    price: 'From $120/mo',
    rating: 3.9,
    reviews: 27,
    added: 73,
    attrs: { Pricing: 'Flat monthly', Hosting: 'Cloud only', Checked: '4 days ago' },
  },
  {
    id: 'vandelay-shift',
    title: 'Vandelay Shift',
    vendor: 'Vandelay',
    price: 'Free tier, then $29/mo',
    rating: 4.3,
    reviews: 133,
    added: 12,
    attrs: { Pricing: 'Has a free tier', Hosting: 'Self-hostable', Checked: '4 days ago' },
  },
]

const FRESHNESS = [
  {
    label: 'Index last rechecked',
    value: '4 days ago',
    detail: 'Every entry’s pricing page and status are fetched fortnightly; the date is on each listing',
  },
  {
    label: 'Removed last month',
    value: '23 entries',
    detail: 'Dead sites, acquisitions and products that stopped shipping. A directory that only grows is not maintained',
  },
  {
    label: 'Paid placements',
    value: '0',
    detail: 'Nobody can buy a position, a badge, or a place in the results. Submissions are £40 and that is the whole business model',
  },
  {
    label: 'Entries with a verified price',
    value: '94%',
    detail: 'The other 6% are marked “contact for pricing”, which is information too',
  },
]

const CATEGORIES = [
  { icon: Server, title: 'Databases and storage', body: '212 entries — managed Postgres, object storage, vector stores, and the migration tooling around them.' },
  { icon: Workflow, title: 'Orchestration', body: '144 entries — workflow engines, schedulers, queues and the durable-execution category that grew out of them.' },
  { icon: LineChart, title: 'Observability', body: '186 entries — tracing, logs, metrics, and the seven products that claim to be all three.' },
  { icon: Lock, title: 'Identity and access', body: '97 entries — auth providers, SSO, secrets management and policy engines.' },
  { icon: GitBranch, title: 'Developer workflow', body: '231 entries — CI, code review, preview environments and local development tooling.' },
  { icon: Boxes, title: 'Infrastructure', body: '158 entries — IaC, container platforms, edge runtimes and cost management.' },
]

const QUESTIONS = [
  {
    question: 'Can I pay to rank higher?',
    answer:
      'No, and there is no mechanism to. Results are sorted by the facet you choose and nothing else — there is no "featured" tier, no sponsored row and no badge for sale. Submission costs £40 once and that is the entire revenue of the site.',
  },
  {
    question: 'How do you keep 1,028 entries current?',
    answer:
      'A fortnightly crawl of every entry’s pricing and status page, flagged for a human when something changes materially. The date each entry was last confirmed is printed on it, so a stale one is visible rather than hidden. 23 were removed last month.',
  },
  {
    question: 'My product is listed and the details are wrong.',
    answer:
      'There is an edit link on every entry and it does not require an account or ownership proof for a factual correction — pricing, a dead link, a changed name. Changes to the description go through review, which takes about a day.',
  },
  {
    question: 'Can I have my product removed?',
    answer:
      'Yes, on request, no reason needed and no retention attempt. Email us and it is gone the same day. We think a directory nobody can leave is a hostage situation rather than a resource.',
  },
  {
    question: 'Where do the ratings come from?',
    answer:
      'Reviews left here, by accounts that have been on the site more than 30 days. They are not aggregated from elsewhere and they are not weighted — the score is the mean, the count is beside it, and a product with 27 reviews should be read differently from one with 214.',
  },
  {
    question: 'Is the data available as an API?',
    answer:
      'The whole index is downloadable as JSON under CC BY-SA, updated nightly, with no key and no rate limit worth mentioning. If you build something better with it, that is a good outcome.',
  },
]

export default function DirectoryIndexPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Stackfinder"
        links={[
          { label: 'Browse', href: '#dr-results' },
          { label: 'Categories', href: '#dr-categories' },
          { label: 'How it works', href: '#dr-method' },
          { label: 'Submit', href: '#dr-submit' },
        ]}
        activeLabel="Browse"
        ctaLabel="Submit a product"
        ctaHref="#dr-submit"
      />

      <main>
        <HeroSearch
          heading="1,028 developer tools, none of them paid to be here"
          subheading="Filter by pricing model, hosting and compliance rather than by category — you already know the category. Every entry says when it was last checked."
          placeholder="Try “self-hosted queue” or “SOC 2 observability”"
          submitLabel="Search"
          inputId="dr-search-input"
          suggestions={['Self-hostable', 'Has a free tier', 'EU data residency', 'One-time licence', 'Open source']}
        />

        <div id="dr-results">
          <SearchFacetedResults facets={FACETS} items={ENTRIES} />
        </div>

        <div id="dr-method">
          <StatsBenchmarkBand
            eyebrow="How the list is maintained"
            heading="The four numbers a directory should publish and almost none do"
            intro="Freshness and independence are the only things that separate a useful directory from a link farm, and both are claims that can be checked rather than adjectives."
            metrics={FRESHNESS}
          />
        </div>

        <div id="dr-categories">
          <FeatureIconGrid
            heading="Browse by category"
            subheading="Six sections, 1,028 entries. The counts are live and include everything, not just the entries that paid — because none of them did."
            features={CATEGORIES}
            columns={3}
          />
        </div>

        <div id="dr-submit">
          <CtaSplitPanel
            heading="Submit a product — £40, once"
            supporting="Reviewed by a person within two working days. If it does not fit, you get the money back and a sentence explaining why, rather than silence."
            primaryLabel="Submit a product"
            secondaryLabel="Read the inclusion criteria"
            reassurance={[
              { text: 'No subscription, no renewal, no upsell to “featured”' },
              { text: 'Refunded in full if we reject it' },
              { text: 'Removable on request, same day, no questions' },
            ]}
          />
        </div>

        <FaqTwoColumn
          heading="How this directory works"
          subheading="Ranking, freshness, corrections and removals — the four things that decide whether a list like this is worth reading."
          items={QUESTIONS}
          helpTitle="Spotted something wrong?"
          helpBody="Every entry has an edit link, and factual corrections do not need an account. They are usually live within a day."
          helpCtaLabel="Report a problem"
        />
      </main>

      <FooterMega
        brand="Stackfinder"
        tagline="1,028 developer tools, independently indexed. Nobody can pay to rank, and the whole index is downloadable."
        statusLabel="Index rechecked 4 days ago"
        regionNote="Run by two people in Dunedin and Lisbon"
        columns={[
          {
            heading: 'Browse',
            links: [
              { label: 'All products', href: '#dr-results' },
              { label: 'Categories', href: '#dr-categories' },
              { label: 'Recently added', href: '#' },
              { label: 'Recently removed', href: '#' },
            ],
          },
          {
            heading: 'For vendors',
            links: [
              { label: 'Submit a product', href: '#dr-submit' },
              { label: 'Inclusion criteria', href: '#' },
              { label: 'Correct an entry', href: '#' },
              { label: 'Request removal', href: '#' },
            ],
          },
          {
            heading: 'The data',
            links: [
              { label: 'Download as JSON', href: '#', badge: 'CC BY-SA' },
              { label: 'How we check entries', href: '#dr-method' },
              { label: 'Review policy', href: '#' },
            ],
          },
        ]}
        legalLinks={[
          { label: 'Privacy', href: '#' },
          { label: 'Terms', href: '#' },
        ]}
      />
    </div>
  )
}
