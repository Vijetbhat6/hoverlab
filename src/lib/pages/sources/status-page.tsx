/**
 * The status page.
 *
 *   banner     the current state, first and unmissable
 *   maintenance the scheduled window, when there is one
 *   components what is degraded, by subsystem
 *   history    ninety days of uptime, as a heatmap
 *   incidents  the write-ups, most recent first
 *
 * Written for the person refreshing it during an outage, which is the only
 * visitor a status page has that matters. That reader wants one sentence
 * above the fold and does not want to scroll; everything below the first
 * screen is for the person doing a procurement review next Tuesday.
 *
 * Two things this page does that most do not. The **maintenance window is
 * rendered as a real block with an end time**, not a footnote — "scheduled
 * maintenance" with no end time is indistinguishable from an outage to
 * someone who has just arrived. And the **component list names what still
 * works**, because during a partial outage the actionable information is
 * usually which half to route around.
 *
 * A status page hosted on the same infrastructure as the product is a status
 * page that goes down with it. Deploy this one somewhere else — that is not a
 * detail the markup can enforce, which is why it is written here.
 */

import * as React from 'react'
import { OfflineStateBanner } from '@/lib/blocks/sources/offline-state-banner'
import { MaintenanceWindowState } from '@/lib/blocks/sources/maintenance-window-state'
import { RetrievalIndexStatus } from '@/lib/blocks/sources/retrieval-index-status'
import { ActivityHeatmap } from '@/lib/blocks/sources/activity-heatmap'
import { ChangelogTimeline } from '@/lib/blocks/sources/changelog-timeline'
import { FooterStatusLocale } from '@/lib/blocks/sources/footer-status-locale'

const COMPONENTS = [
  {
    id: 'api',
    name: 'REST API',
    kind: 'Public endpoint',
    state: 'fresh' as const,
    age: 'checked 40 seconds ago',
    documents: 0,
  },
  {
    id: 'web',
    name: 'Web application',
    kind: 'Interface',
    state: 'fresh' as const,
    age: 'checked 40 seconds ago',
    documents: 0,
  },
  {
    id: 'sync',
    name: 'Integration sync',
    kind: 'Background worker',
    state: 'partial' as const,
    age: 'degraded for 22 minutes',
    documents: 0,
    problem: 'Quartzly pushes are queuing. Nothing is lost; the backlog is draining at about 900 lines a minute.',
  },
  {
    id: 'exports',
    name: 'Exports and reports',
    kind: 'Background worker',
    state: 'fresh' as const,
    age: 'checked 1 minute ago',
    documents: 0,
  },
  {
    id: 'webhooks',
    name: 'Outbound webhooks',
    kind: 'Delivery',
    state: 'fresh' as const,
    age: 'checked 40 seconds ago',
    documents: 0,
  },
]

const INCIDENTS = [
  {
    date: '2026-01-09',
    version: 'Degraded',
    title: 'Integration sync backlog',
    items: [
      { kind: 'changed' as const, text: '11:42 UTC — Quartzly push latency above threshold; queue building.' },
      { kind: 'fixed' as const, text: '11:58 UTC — Cause identified as a slow query after an index change. Rolled back.' },
      { kind: 'changed' as const, text: '12:04 UTC — Backlog draining. No data lost; every push carries an idempotency key.' },
    ],
  },
  {
    date: '2025-12-18',
    version: 'Resolved',
    title: 'Exports delayed for 71 minutes',
    items: [
      { kind: 'fixed' as const, text: 'A single tenant’s 4.1M-row export starved the shared worker pool.' },
      { kind: 'added' as const, text: 'Per-tenant concurrency cap added the same week. This cannot recur in the same form.' },
    ],
  },
  {
    date: '2025-11-02',
    version: 'Resolved',
    title: 'Partial API outage, eu-west, 9 minutes',
    items: [
      { kind: 'fixed' as const, text: 'Certificate rotation applied to one load balancer ahead of its pair.' },
      { kind: 'changed' as const, text: 'Rotation is now staged behind a health check rather than by schedule.' },
    ],
  },
]

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        {/*
          The banner is the page's headline and is the only thing most
          visitors will read. `queuedChanges` carries the concrete number
          rather than the word "some", because during an incident the reader
          is deciding whether to wait or to route around.
        */}
        <OfflineStateBanner queuedChanges={1480} unavailable={['Quartzly push', 'Halyard payment runs']} />

        <MaintenanceWindowState
          title="Scheduled maintenance this Sunday"
          summary="Database failover rehearsal in eu-west. The API stays up; exports and scheduled reports are paused for the window."
          endsAt="2026-01-18T04:00:00Z"
          stillWorking={['REST API reads and writes', 'Web application', 'Inbound webhooks']}
        />

        <div id="incidents">
          <RetrievalIndexStatus sources={COMPONENTS} />
        </div>

        <ActivityHeatmap heading="Ninety days of uptime" noun="incident-free day" />

        <ChangelogTimeline
          heading="Incident history"
          subheading="Every incident with customer impact, written up within two working days. Post-mortems are public by default and redacted only where a customer is named."
          entries={INCIDENTS}
        />
      </main>

      <FooterStatusLocale
        productName="Acme"
        status="degraded"
        version="2026.1.9"
        links={[
          { label: 'Subscribe to updates', href: '#subscribe' },
          { label: 'Incident history', href: '#incidents' },
          { label: 'Uptime SLA', href: '#sla' },
        ]}
      />
    </div>
  )
}
