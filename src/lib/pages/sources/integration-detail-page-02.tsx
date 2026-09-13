/**
 * The integration detail page, take 02 — the setup guide.
 *
 *   scope       what this connector moves, before anything asks you to click
 *   wizard      the five decisions, made once, in order
 *   code        the same thing for someone who would rather script it
 *   security    what it can reach, for the person who has to approve it
 *   stuck       a ticket form pre-scoped to this connector
 *
 * Take 01 is the marketing version: an article header, feature rows, an API
 * card, an FAQ, a CTA. It is written for someone deciding whether to buy,
 * and it is right for the integration page that ranks for "acme netsuite".
 *
 * This take is for the visitor who has already bought and is trying to turn
 * the thing on — a completely different reader who arrives, most often, from
 * inside the product. For them the marketing page is actively hostile: they
 * scroll past three sections of benefit copy to reach a "Get started"
 * button that opens a support article in a fourth place.
 *
 * So there is no hero and no CTA. `integration-depth-split` opens by stating
 * what moves and in which direction, because the commonest setup failure is
 * not a broken step — it is discovering in week two that the connector does
 * not sync the field you assumed. Then the wizard, which is the page.
 *
 * `security-faq-list` is here rather than on take 01 because setup is when
 * someone has to grant the scopes, and that is usually a different person
 * from the one who read the marketing page. The ticket form at the end is
 * pre-scoped to this connector so the reply does not begin by asking which
 * one.
 *
 * Footer is `footer-compliance`, not `footer-minimal`: a reader who has just
 * been asked to grant ledger write access is the reader most likely to want
 * the entity and registration details.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { IntegrationDepthSplit } from '@/lib/blocks/sources/integration-depth-split'
import { SetupWizard } from '@/lib/blocks/sources/setup-wizard'
import { CodeTabsPanel } from '@/lib/blocks/sources/code-tabs-panel'
import { SecurityFaqList } from '@/lib/blocks/sources/security-faq-list'
import { SupportTicketForm } from '@/lib/blocks/sources/support-ticket-form'
import { FooterCompliance } from '@/lib/blocks/sources/footer-compliance'

const SCOPE = [
  {
    label: 'Journal entries — both directions',
    detail: 'We read posted journals and write reconciliation adjustments back as a separate journal source, never by editing yours.',
  },
  {
    label: 'Chart of accounts — read only',
    detail: 'Pulled hourly. We never create, rename or deactivate an account, which is the write nobody wants to discover after the fact.',
  },
  {
    label: 'Subsidiaries and currencies — read only',
    detail: 'All eleven of your subsidiaries, with their functional currency. Revaluation stays in NetSuite.',
  },
  {
    label: 'Vendors and customers — read only',
    detail: 'Names, ids and trading names. The trading-name field is the one that makes supplier matching work, and it is the one most connectors skip.',
  },
  {
    label: 'Attachments — not synced',
    detail: 'Deliberately. Receipts stay in NetSuite; we store the link, not the file.',
  },
]

const WIZARD_STEPS = [
  {
    id: 'role',
    title: 'Access',
    question: 'Which NetSuite role should the connection use?',
    options: [
      {
        value: 'dedicated',
        label: 'A dedicated integration role',
        description: 'Recommended. Survives staff changes and shows up clearly in your audit log as a non-human actor.',
      },
      {
        value: 'existing',
        label: 'An existing admin role',
        description: 'Faster to set up and harder to audit. Every action we take will look like that person took it.',
      },
    ],
  },
  {
    id: 'direction',
    title: 'Direction',
    question: 'Should we write adjustments back to NetSuite?',
    options: [
      {
        value: 'two-way',
        label: 'Read and write',
        description: 'Adjustments post as a separate journal source. This is what most teams want and it is reversible.',
      },
      {
        value: 'read-only',
        label: 'Read only, for now',
        description: 'Nothing is written. Useful for a first month while you build trust in the match rules.',
      },
    ],
  },
  {
    id: 'history',
    title: 'History',
    question: 'How far back should the first sync go?',
    options: [
      {
        value: 'one-month',
        label: 'One closed month',
        description: 'Finishes in about twenty minutes and is enough to write your first rules against.',
      },
      {
        value: 'twelve-months',
        label: 'Twelve months',
        description: 'Takes four to six hours and is worth it if you want the rules tested against seasonality before you rely on them.',
      },
    ],
  },
  {
    id: 'conflict',
    title: 'Conflicts',
    question: 'When the same line changes in both systems, what wins?',
    options: [
      {
        value: 'review',
        label: 'Neither — queue it for review',
        description: 'Recommended. Nothing is silently overwritten; conflicts land in a queue that is usually empty.',
      },
      {
        value: 'netsuite',
        label: 'NetSuite wins',
        description: 'Fewer interruptions, at the cost of losing an adjustment made here without telling you.',
      },
    ],
  },
  {
    id: 'schedule',
    title: 'Schedule',
    question: 'How often should it sync?',
    options: [
      {
        value: 'hourly',
        label: 'Hourly',
        description: 'The default. Well inside NetSuite governance limits even on eleven subsidiaries.',
      },
      {
        value: 'nightly',
        label: 'Nightly',
        description: 'Choose this if you share a NetSuite integration budget with other tools.',
      },
    ],
  },
]

const CODE_TABS = [
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://api.acme.example/v1/connections \\
  -H "Authorization: Bearer $ACME_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "netsuite",
    "account_id": "TSTDRV1234567",
    "role_id": "1057",
    "direction": "two_way",
    "backfill_months": 1,
    "on_conflict": "review",
    "schedule": "hourly"
  }'`,
  },
  {
    label: 'TypeScript',
    language: 'ts',
    code: `import { Acme } from '@acme/sdk'

const acme = new Acme({ apiKey: process.env.ACME_API_KEY })

const connection = await acme.connections.create({
  provider: 'netsuite',
  accountId: 'TSTDRV1234567',
  roleId: '1057',
  direction: 'two_way',
  backfillMonths: 1,
  onConflict: 'review',
  schedule: 'hourly',
})

// Backfill is async. Poll, or subscribe to connection.backfill.completed.
await acme.connections.waitForBackfill(connection.id)`,
  },
  {
    label: 'Python',
    language: 'python',
    code: `from acme import Acme

acme = Acme(api_key=os.environ["ACME_API_KEY"])

connection = acme.connections.create(
    provider="netsuite",
    account_id="TSTDRV1234567",
    role_id="1057",
    direction="two_way",
    backfill_months=1,
    on_conflict="review",
    schedule="hourly",
)

acme.connections.wait_for_backfill(connection.id)`,
  },
]

const SCOPES = [
  {
    id: 'permissions',
    label: 'NetSuite permissions the role needs',
    detail: 'Lists, Transactions (view + create for journal only), Reports, and REST Web Services. Not Setup, not Users, not File Cabinet.',
    tone: 'neutral' as const,
    status: '4 permissions',
  },
  {
    id: 'write-surface',
    label: 'What we can write',
    detail: 'Journal entries under a dedicated source id. We cannot edit your journals, post to a closed period, or change an account.',
    tone: 'positive' as const,
    status: 'Journals only',
  },
  {
    id: 'credentials',
    label: 'Where the credentials live',
    detail: 'Token-based auth, stored encrypted in KMS with per-workspace keys. No password is ever held, and the token is revocable from your side without contacting us.',
    tone: 'positive' as const,
    status: 'TBA, revocable',
  },
  {
    id: 'residency',
    label: 'Where the synced data lands',
    detail: 'The region you chose at workspace creation, EU or US. A NetSuite account in a third region does not change this and cannot be made to.',
    tone: 'warning' as const,
    status: 'Fixed at setup',
  },
  {
    id: 'audit',
    label: 'Audit trail',
    detail: 'Every read and write is logged on both sides. Ours is exportable from settings; NetSuite shows the integration role as the actor if you chose a dedicated one.',
    tone: 'positive' as const,
    status: 'Both sides',
  },
]

export default function IntegrationDetailPage02() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Integrations" ctaLabel="Open the wizard" ctaHref="#integration-detail-page-02-setup" />

      <main>
        {/*
          Scope before setup. The commonest way one of these goes wrong is
          not a failed step — it is finding out in week two that the field
          you assumed was syncing never was.
        */}
        <IntegrationDepthSplit
          eyebrow="NetSuite connector"
          heading="What actually moves, and which way"
          intro="Read this before the wizard. Two of the five rows below are the ones people are surprised by later — attachments do not sync, and the chart of accounts is read-only in both directions of the word."
          points={SCOPE}
        />

        <div id="integration-detail-page-02-setup">
          <SetupWizard
            brand="NetSuite"
            steps={WIZARD_STEPS}
            finishLabel="Create the connection"
            completeTitle="Connected. The backfill is running."
            completeBody="One closed month takes about twenty minutes; twelve months takes four to six hours. You can write match rules while it runs — nothing below depends on the backfill finishing."
          />
        </div>

        <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <CodeTabsPanel
            title="Or create it from the API"
            tabs={CODE_TABS}
          />
        </div>

        {/*
          Setup is where scopes get granted, and the person granting them is
          usually not the person who read the marketing page. This list is
          what they will be asked for.
        */}
        <SecurityFaqList
          heading="For whoever has to approve this"
          intro="The five things a NetSuite administrator asks before granting the role. The residency row is the one with a constraint you cannot change later."
          rows={SCOPES}
        />

        <SupportTicketForm
          heading="Stuck on a step?"
          intro="Pre-tagged to the NetSuite connector, so the reply does not start by asking which integration. Include the step number and the account id."
          submitLabel="Send it"
        />
      </main>

      <FooterCompliance brand="Acme" />
    </div>
  )
}
