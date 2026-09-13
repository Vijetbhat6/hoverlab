/**
 * The public roadmap.
 *
 *   columns   planned, in progress, shipped
 *   shipped   the changelog underneath, as proof the right column moves
 *   feedback  the way to argue with it
 *   notify    the way to hear about it without checking
 *
 * The changelog directly below the board is the point. A roadmap on its own
 * is a promise, and readers have been trained by a decade of abandoned
 * roadmaps to discount one entirely. Putting the last three releases
 * immediately underneath turns the "shipped" column from a claim into
 * something with dates attached, and it costs nothing because the changelog
 * already exists.
 *
 * No dates on anything in "planned", on purpose. A quarter against an
 * unstarted item is a number invented for the page, and the only thing it can
 * do is be wrong in public. Items in progress carry a quarter because by then
 * the estimate is worth something.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { RoadmapColumns } from '@/lib/blocks/sources/roadmap-columns'
import { ChangelogTimeline } from '@/lib/blocks/sources/changelog-timeline'
import { FeedbackWidget } from '@/lib/blocks/sources/feedback-widget'
import { NewsletterSignup } from '@/lib/blocks/sources/newsletter-signup'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const ITEMS = [
  {
    title: 'Ferrous works-order integration',
    description: 'Line-level matching of works-order costs to purchase invoices. The most-requested connector by a distance.',
    status: 'in-progress' as const,
    eta: 'Q1 2026',
  },
  {
    title: 'Conditional approval routing',
    description: 'Multi-branch chains by amount, department and supplier risk. Currently our weakest area against Meridia, and we would rather say so than fudge it.',
    status: 'in-progress' as const,
    eta: 'Q2 2026',
  },
  {
    title: 'Scheduled report delivery to SFTP',
    description: 'For the finance teams whose downstream system still reads a folder at 6am.',
    status: 'planned' as const,
  },
  {
    title: 'Carbon accounting from supplier records',
    description: 'Same supplier ledger, second set of reports. Scoped, not started.',
    status: 'planned' as const,
  },
  {
    title: 'Native mobile approvals',
    description: 'Requested often and honestly not close. It is on the board so nobody buys on the assumption it is coming this year.',
    status: 'planned' as const,
  },
  {
    title: 'Per-tenant export concurrency caps',
    description: 'Shipped in December after one tenant’s 4.1M-row export starved the shared pool.',
    status: 'shipped' as const,
    eta: 'Dec 2025',
  },
  {
    title: 'Published rate limits',
    description: 'Limits are in the docs rather than discovered at 429.',
    status: 'shipped' as const,
    eta: 'Nov 2025',
  },
  {
    title: 'Read-only auditor role',
    description: 'Came out of a customer engagement and turned out to be the feature CFOs mention first.',
    status: 'shipped' as const,
    eta: 'Oct 2025',
  },
]

const RELEASES = [
  {
    date: '2026-01-06',
    version: '2026.1',
    title: 'Sandbox workspaces and a faster importer',
    items: [
      { kind: 'added' as const, text: 'Disposable sandbox workspaces, free on every plan, for trying an import against real data.' },
      { kind: 'changed' as const, text: 'CSV importer is roughly 4× faster above 100,000 rows.' },
      { kind: 'fixed' as const, text: 'Cost-centre archive no longer orphans historical lines on re-sync.' },
    ],
  },
  {
    date: '2025-12-11',
    version: '2025.12',
    title: 'Export concurrency caps',
    items: [
      { kind: 'added' as const, text: 'Per-tenant concurrency cap on exports and scheduled reports.' },
      { kind: 'changed' as const, text: 'Large exports now stream rather than buffering in memory.' },
    ],
  },
  {
    date: '2025-11-04',
    version: '2025.11',
    title: 'Rate limits, written down',
    items: [
      { kind: 'added' as const, text: 'Published per-plan rate limits, with headers on every response.' },
      { kind: 'fixed' as const, text: 'Certificate rotation staged behind a health check after the 2 November incident.' },
    ],
  },
]

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Roadmap" ctaLabel="Request a feature" ctaHref="#shipping" />

      <main>
        <RoadmapColumns
          heading="What we are building, and what we are not"
          subheading="Planned items carry no date, because a quarter against something unstarted is a number invented for this page. In-progress items carry one because by then it is worth something."
          items={ITEMS}
        />

        <div id="shipping">
          <ChangelogTimeline
            heading="The last three releases"
            subheading="Here so the shipped column means something. Every entry links to the release notes and, where there was one, the incident that caused it."
            entries={RELEASES}
          />
        </div>

        <FeedbackWidget heading="Disagree with the order?" />

        <NewsletterSignup
          heading="Hear about it instead of checking"
          subheading="One email per release, which is roughly monthly. No other use of the address and one click to stop."
          ctaLabel="Get release notes"
          note="Monthly-ish. Unsubscribe in one click."
        />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
