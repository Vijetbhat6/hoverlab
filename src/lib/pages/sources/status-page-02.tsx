/**
 * The status page, take 02 — the one read when nothing is wrong.
 *
 *   record      uptime over 90 days, as the headline number
 *   trend       the latency curve, because "up" and "usable" differ
 *   incidents   every one of them, with the post-mortem attached
 *   history     the raw event log, newest first
 *   subscribe   how to hear about the next one before you notice it
 *
 * Take 01 is written for the person refreshing during an outage: current
 * state above the fold, the maintenance window as a real block with an end
 * time, and a component list naming what still works. Under those
 * conditions everything except "is it me or is it you" is noise, and take 01
 * is correctly ruthless about it.
 *
 * This take serves the other visitor entirely — a procurement reviewer or a
 * prospect's engineer doing diligence, weeks before signing, on a day when
 * the system is fine. For them the current banner is the least interesting
 * thing on the page. They want the record: how often, how long, and whether
 * anyone wrote down what happened.
 *
 * So the ordering inverts. Uptime and latency lead; the incident list is the
 * body of the page rather than a footnote; and every incident row carries a
 * post-mortem rather than a one-line "resolved". The four incidents are all
 * shown, including the bad one — a status page whose history contains only
 * green is read as a status page that deletes things.
 *
 * `line-chart-panel` earns its place here and would be actively harmful on
 * take 01: during an outage a latency chart invites the reader to diagnose
 * instead of telling them what to do. On a diligence read it is the whole
 * question, because a service that is technically up at nine seconds is not
 * up.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { StatsBand } from '@/lib/blocks/sources/stats-band'
import { LineChartPanel } from '@/lib/blocks/sources/line-chart-panel'
import { MetricAlertList } from '@/lib/blocks/sources/metric-alert-list'
import { ActivityTimeline } from '@/lib/blocks/sources/activity-timeline'
import { NotificationChannelList } from '@/lib/blocks/sources/notification-channel-list'
import { FooterStatusLocale } from '@/lib/blocks/sources/footer-status-locale'

const RECORD = [
  { value: '99.94%', label: 'Uptime, trailing 90 days', caption: 'SLA commitment is 99.9%' },
  { value: '4', label: 'Incidents, trailing 90 days', caption: 'One of them was serious' },
  { value: '41 min', label: 'Longest single outage', caption: '14 November, sync workers' },
  { value: '4 of 4', label: 'Post-mortems published', caption: 'Within 5 business days each' },
]

const LATENCY_LABELS = [
  'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const LATENCY_SERIES = [
  { name: 'p50 (ms)', values: [82, 79, 84, 81, 88, 143, 86], area: true },
  { name: 'p99 (ms)', values: [410, 395, 428, 402, 447, 1980, 436] },
]

const INCIDENTS = [
  {
    id: 'nov-14',
    label: '14 Nov — Sync workers stalled for 41 minutes',
    detail:
      'A NetSuite governance change we had not accounted for caused every ledger worker to back off simultaneously. Reconciliation was unavailable; nothing was lost and nothing double-posted. Root cause was a retry policy with no jitter, which is an embarrassing thing to find in 2025. Post-mortem published 19 Nov.',
    tone: 'critical' as const,
    status: '41 min',
  },
  {
    id: 'oct-02',
    label: '2 Oct — Elevated latency, 2h 10m',
    detail:
      'p99 above 2 seconds for just over two hours during a database failover that took longer than the runbook said it would. The service stayed up. We count this as an incident anyway, because a nine-second page load is an outage to the person waiting for it.',
    tone: 'warning' as const,
    status: '2h 10m',
  },
  {
    id: 'sep-19',
    label: '19 Sep — Stripe connector degraded, 26 min',
    detail:
      'Upstream. Stripe had a partial API outage; our connector queued correctly and drained without loss once it cleared. Listed here because it affected you, not because it was ours.',
    tone: 'neutral' as const,
    status: '26 min',
  },
  {
    id: 'jul-08',
    label: '8 Jul — Scheduled maintenance overran by 18 minutes',
    detail:
      'Announced window was 60 minutes; it took 78. We publish overruns as incidents because a maintenance window that quietly doubles is indistinguishable from an outage on your side of it.',
    tone: 'neutral' as const,
    status: '+18 min',
  },
]

const EVENT_LOG = [
  {
    label: 'This month',
    events: [
      {
        id: 'e1',
        kind: 'deploy' as const,
        actor: 'Platform',
        action: 'deployed',
        target: 'ledger-worker v4.22.1',
        at: '2026-01-09T09:14:00Z',
        timeLabel: '9 Jan, 09:14 UTC',
      },
      {
        id: 'e2',
        kind: 'settings' as const,
        actor: 'Platform',
        action: 'completed maintenance on',
        target: 'EU read replicas',
        at: '2026-01-04T02:00:00Z',
        timeLabel: '4 Jan, 02:00 UTC',
      },
    ],
  },
  {
    label: 'December',
    events: [
      {
        id: 'e3',
        kind: 'deploy' as const,
        actor: 'Platform',
        action: 'deployed',
        target: 'retry policy with jitter — the Nov 14 fix',
        at: '2025-12-11T10:02:00Z',
        timeLabel: '11 Dec, 10:02 UTC',
      },
      {
        id: 'e4',
        kind: 'incident' as const,
        actor: 'Platform',
        action: 'published post-mortem for',
        target: '14 Nov sync stall',
        at: '2025-12-01T16:30:00Z',
        timeLabel: '1 Dec, 16:30 UTC',
      },
    ],
  },
]

const SUBSCRIBE = [
  {
    id: 'email',
    label: 'Email',
    detail: 'One message when an incident opens, one when it closes, one when the post-mortem lands. Never anything else — this list is not used for product news.',
    tone: 'positive' as const,
    status: 'Recommended',
  },
  {
    id: 'webhook',
    label: 'Webhook',
    detail: 'POST to your endpoint on every state change, signed. The payload matches the public JSON feed.',
    tone: 'neutral' as const,
    status: 'JSON',
  },
  {
    id: 'rss',
    label: 'RSS / Atom',
    detail: 'Both, unauthenticated, including resolved incidents and post-mortem links.',
    tone: 'neutral' as const,
    status: 'Open',
  },
  {
    id: 'slack',
    label: 'Slack',
    detail: 'A channel app. It posts to one channel and it cannot read anything in your workspace.',
    tone: 'neutral' as const,
    status: 'Write-only',
  },
]

export default function StatusPage02() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Status" ctaLabel="Subscribe" ctaHref="#status-page-02-subscribe" />

      <main>
        <div className="mx-auto w-full max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ninety days of record
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
            Everything is operational right now, which is the least useful
            thing this page can tell you. If you are reading it during
            diligence rather than during an outage, the numbers below are the
            ones that matter — including the November incident, which was
            ours and which was bad.
          </p>
        </div>

        <StatsBand stats={RECORD} />

        {/*
          A latency chart would be harmful on take 01 — during an outage it
          invites the reader to diagnose instead of telling them what to do.
          On a diligence read it is the whole question, because a service
          that is technically up at nine seconds is not up.
        */}
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <LineChartPanel
            heading="API response time, seven months"
            description="p50 and p99 on the reconciliation endpoint. The November spike is the sync stall; the p99 line is the honest one and it is why that month is listed as an incident rather than as degraded performance."
            labels={LATENCY_LABELS}
            series={LATENCY_SERIES}
            format={(v) => `${v} ms`}
          />
        </div>

        <MetricAlertList
          heading="Every incident in the window"
          intro="Four, all of them, newest first — including the upstream one that was not our fault and the maintenance window that overran, because a history containing only green is read as a history that gets edited."
          rows={INCIDENTS}
        />

        <ActivityTimeline heading="Raw event log" groups={EVENT_LOG} />

        <div id="status-page-02-subscribe">
          <NotificationChannelList
            heading="Hear about the next one first"
            intro="Four channels, all free, none of them attached to a marketing list. The email option is the one most customers pick and it sends at most three messages per incident."
            rows={SUBSCRIBE}
          />
        </div>
      </main>

      <FooterStatusLocale
        productName="Acme"
        status="operational"
        version="v4.22.1"
      />
    </div>
  )
}
