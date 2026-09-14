/**
 * One directory entry — the comparison page a buyer sends to their team.
 *
 *   header     what it is, who makes it, when it was last checked
 *   facts      pricing, hosting, compliance, licence
 *   versus     it against the two obvious alternatives
 *   detail     the longer description, in sections
 *   reviews    the distribution, then the reviews themselves
 *   alternatives what else does this job
 *
 * THE FRESHNESS STAMP IS THE FIRST THING UNDER THE TITLE AND THAT IS THE
 * WHOLE POINT OF THE PAGE. A directory entry with no date is indistinguishable
 * from one written three years ago, and everything else on the page — the
 * price, the compliance badges, the integrations — is only worth reading if
 * the reader knows when it was true.
 *
 * <ComparisonTable> RATHER THAN A FEATURE LIST. Nobody arrives at a
 * directory entry in isolation; they arrive comparing two or three things,
 * and a page that describes only one of them sends the reader back to search.
 * Putting the two obvious alternatives in the table is against the interest
 * of the vendor and exactly in the interest of the reader, which is the
 * trade a directory is supposed to make.
 *
 * <ReviewDistributionBand> BEFORE <ReviewList>. A mean score with no shape
 * hides the difference between "consistently fine" and "half love it, half
 * cannot get it working" — and the second is much more useful to somebody
 * deciding. The distribution answers it in one glance; the reviews then
 * explain the low bar.
 *
 * NO BUY BUTTON, NO AFFILIATE LINK, and the page says so. The link to the
 * vendor is a plain link. This is the one structural decision that makes the
 * comparison above credible.
 *
 * Anchors are prefixed `dl-`.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { ArticleHeader } from '@/lib/blocks/sources/article-header'
import { ProductSpecSplit } from '@/lib/blocks/sources/product-spec-split'
import { ComparisonTable } from '@/lib/blocks/sources/comparison-table'
import { ProductInfoAccordion } from '@/lib/blocks/sources/product-info-accordion'
import { ReviewDistributionBand } from '@/lib/blocks/sources/review-distribution-band'
import { ReviewList } from '@/lib/blocks/sources/review-list'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const FACTS = [
  {
    label: 'Open source, MIT, since 2021',
    detail:
      'No dual licence, no “open core” with the useful half held back, and no CLA that assigns your contributions. The licence has not changed in five years and the trademark policy is separate and permissive.',
  },
  {
    label: 'Self-hostable — it is a 6MB static binary',
    detail:
      'No runtime to install alongside it, no control plane phoning home, and no licence key. There is no hosted version, which is a real limitation if you wanted one.',
  },
  {
    label: 'No compliance certifications, and it does not need them',
    detail:
      'It runs inside your infrastructure and holds no data of yours, so SOC 2 is not applicable rather than missing. Worth saying plainly because a blank compliance column usually means the opposite.',
  },
  {
    label: 'Last checked 4 days ago',
    detail:
      'Pricing page, release feed and repository activity. Latest release 2.4.0, eleven days ago; 312 open issues and a median first response of 2 days.',
  },
]

const VERSUS_ROWS = [
  { feature: 'Licence', values: ['MIT, open source', 'Proprietary', 'BSL, converts to Apache after 4 years'] },
  { feature: 'Price', values: ['Free', 'From $49/mo', 'Free under 5 seats, then $29/seat'] },
  { feature: 'Self-hostable', values: [true, false, true] },
  { feature: 'Hosted option', values: [false, true, true] },
  { feature: 'Plain SQL migrations', values: [true, false, true] },
  { feature: 'Blocks destructive changes by scanning app code', values: [true, false, false] },
  { feature: 'Runtime required', values: ['None — static binary', 'Node 20+', 'JVM 17+'] },
  { feature: 'Postgres, MySQL, SQLite', values: ['All three', 'Postgres only', 'All three'] },
  { feature: 'Median issue first response', values: ['2 days', 'Support SLA, 4 hours', '9 days'] },
]

const DETAIL = [
  {
    id: 'dl-what',
    title: 'What it does',
    defaultOpen: true,
    body: [
      'Ratchet is a schema migration runner. Migrations are plain SQL files applied in order, which is unremarkable — what is not is the guard: before applying anything destructive, it parses the queries in paths you nominate and refuses if one of them still reads the column being dropped.',
      'In practice that turns the most common migration-caused outage into a blocked command with a file and a line number. It is the only tool in this category that does it, and it is why the entry exists.',
    ],
    specs: [
      { label: 'Latest release', value: '2.4.0, eleven days ago' },
      { label: 'Databases', value: 'Postgres, MySQL, SQLite' },
      { label: 'Binary size', value: '6MB, static, no runtime' },
      { label: 'Downloads', value: '2.1M/month on npm' },
    ],
  },
  {
    id: 'dl-caveats',
    title: 'Where it is weak',
    body: [
      'There is no hosted or managed version and the maintainers have said there will not be, so if you wanted somebody else to run it, this is not the tool.',
      'The guard only understands SQL and Go query construction today — if your queries are built dynamically in Python or Ruby it will not see them, and it fails open rather than pretending. The Windows build lagged the others by two releases in 2025.',
    ],
  },
  {
    id: 'dl-funding',
    title: 'Who pays for it',
    body: [
      'Two corporate sponsors fund three maintainer-days a week between them on rolling twelve-month agreements, neither with any roadmap influence, plus about 340 individual sponsors.',
      'No single contributor holds more than 19% of commits, so the bus factor is genuinely better than most projects this size. Total 2025 funding was £61k, which they publish.',
    ],
  },
]

const REVIEW_SHAPE = [
  { label: 'Mean score', value: '4.8 / 5', detail: 'From 214 reviews left on this site since 2022' },
  { label: 'Five stars', value: '78%', detail: '167 reviews — almost all mention the guard specifically' },
  { label: 'Two stars or fewer', value: '4%', detail: '9 reviews, seven of which are about the Windows build in 2025' },
  { label: 'Would use again', value: '96%', detail: 'Asked separately from the star rating' },
]

const REVIEWS = [
  {
    id: 'dl-r1',
    author: 'Tobias R.',
    rating: 5,
    title: 'It blocked a migration that would have taken us down',
    body: 'Two months in, it refused a DROP COLUMN and pointed at a reporting query nobody remembered writing. That one event paid for the entire migration off our previous tool. The output is unusually good — it names the file and the line rather than just saying no.',
    date: '2026-02-18',
    verified: true,
    helpfulCount: 84,
    context: 'Using it for 14 months · Postgres, self-hosted',
  },
  {
    id: 'dl-r2',
    author: 'Priya R.',
    rating: 5,
    title: 'Plain SQL is the right call',
    body: 'We moved off a tool with its own DSL and immediately deleted a page of internal documentation explaining the DSL. Onboarding a new engineer to migrations is now "these are SQL files".',
    date: '2026-01-09',
    verified: true,
    helpfulCount: 41,
    context: 'Using it for 8 months · MySQL',
  },
  {
    id: 'dl-r3',
    author: 'Anders L.',
    rating: 2,
    title: 'Windows support was an afterthought for most of last year',
    body: 'Two releases went by without a Windows binary and we pinned an old version for four months. It is fixed now and the maintainers were honest about it in the issue, but if your team is on Windows, check the release page before committing.',
    date: '2025-11-22',
    verified: true,
    helpfulCount: 62,
    context: 'Using it for 2 years · Postgres, Windows',
  },
  {
    id: 'dl-r4',
    author: 'Sameera K.',
    rating: 4,
    title: 'The guard does not see our Python queries',
    body: 'Works exactly as documented — it only parses SQL and Go — but we are a Django shop so the headline feature is mostly inert for us. Still a good migration runner and we kept it. Would be five stars with a Python parser.',
    date: '2026-03-02',
    verified: true,
    helpfulCount: 37,
    context: 'Using it for 5 months · Postgres, Django',
  },
]

export default function DirectoryListingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Stackfinder"
        links={[
          { label: 'Browse', href: '#' },
          { label: 'Categories', href: '#' },
          { label: 'How it works', href: '#' },
          { label: 'Submit', href: '#' },
        ]}
        activeLabel="Browse"
        ctaLabel="Submit a product"
      />

      <main>
        <ArticleHeader
          category="Databases and storage · Migration tooling"
          title="Ratchet"
          standfirst="An open-source schema migration runner that parses your application code before a destructive migration and blocks itself when something still reads the column. Plain SQL, one static binary, no hosted version."
          author="Indexed by Stackfinder"
          role="No affiliate link · nobody paid for this listing"
          date="Last checked 4 days ago"
          readMinutes={4}
        />

        <ProductSpecSplit
          eyebrow="The facts"
          heading="Licence, hosting, compliance, freshness"
          intro="The four columns every entry in this directory carries, in the same order, so two entries can be read side by side without hunting."
          points={FACTS}
        />

        <div id="dl-versus">
          <ComparisonTable
            heading="Against the two obvious alternatives"
            subheading="Chosen by what people actually search for next, not by who would like to be compared. Every row is checkable from public documentation and dated 4 days ago."
            columns={['Ratchet', 'Halyard Migrate', 'Vandelay Shift']}
            rows={VERSUS_ROWS}
            highlightColumn={0}
          />
        </div>

        <ProductInfoAccordion sections={DETAIL} />

        <ReviewDistributionBand
          eyebrow="214 reviews"
          heading="The shape of the score, not just the mean"
          intro="A 4.8 can mean consistently good or sharply divided, and those are different purchases. Here almost all the low scores are one issue from one year, which is worth knowing before you read them."
          metrics={REVIEW_SHAPE}
        />

        <ReviewList reviews={REVIEWS} locale="en-GB" />

        <CtaSplitPanel
          heading="No buy button, on purpose"
          supporting="This is a plain link to the project. Stackfinder takes no affiliate revenue and nobody can pay for placement, which is the only reason the comparison above is worth reading."
          primaryLabel="Open the project site"
          secondaryLabel="Compare with three others"
          secondaryHref="#dl-versus"
          reassurance={[
            { text: 'Entry last verified 4 days ago' },
            { text: 'Correct a factual error without an account' },
            { text: 'The whole index is downloadable as JSON' },
          ]}
        />
      </main>

      <FooterMinimal
        brand="Stackfinder"
        links={[
          { label: 'Browse', href: '#' },
          { label: 'Correct this entry', href: '#' },
          { label: 'How we check entries', href: '#' },
          { label: 'Download the index', href: '#' },
        ]}
      />
    </div>
  )
}
