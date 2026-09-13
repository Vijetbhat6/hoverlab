/**
 * One integration's page.
 *
 *   header    which two things, and what the connection does
 *   what      what it syncs, in both directions, explicitly
 *   setup     the actual steps, with the code
 *   endpoint  the API call underneath, for whoever is evaluating this
 *   faq       the four questions support gets about this connection
 *
 * The direction arrows are the substance. "Integrates with Quartzly" is what
 * every integration page says and it answers nothing — the questions are
 * which records move, which way, how often, and what happens on conflict.
 * Those four are the difference between a page that closes a deal and a page
 * that generates a support ticket, so they are the second section rather than
 * an appendix.
 *
 * The endpoint card is deliberately here on a *marketing* page. Whoever has
 * to build around this will be sent this link by whoever is buying, and
 * making them log in to find out whether the API can do what they need is how
 * an evaluation stalls for a week.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { ArticleHeader } from '@/lib/blocks/sources/article-header'
import { FeatureRows } from '@/lib/blocks/sources/feature-rows'
import { CodeShowcase } from '@/lib/blocks/sources/code-showcase'
import { ApiEndpointCard } from '@/lib/blocks/sources/api-endpoint-card'
import { FaqAccordion } from '@/lib/blocks/sources/faq-accordion'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const WHAT_MOVES = [
  {
    eyebrow: 'Acme → Quartzly',
    title: 'Journal lines, hourly',
    body: 'Every posted line is pushed with its cost centre, tax code and source reference. Nothing is pushed until it is posted, so a draft in Acme never appears in your ledger.',
    bullets: ['Posted lines only', 'Source reference preserved', 'Retried for 24h on failure, then surfaced'],
  },
  {
    eyebrow: 'Quartzly → Acme',
    title: 'Chart of accounts and cost centres, nightly',
    body: 'Quartzly is the source of truth for structure. A cost centre renamed there is renamed here overnight, and one deleted there is archived here rather than deleted — because deleting it would orphan history.',
    bullets: ['Structure is one-way, by design', 'Deletes become archives', 'Full re-sync available on demand'],
  },
  {
    eyebrow: 'On conflict',
    title: 'The ledger wins, and you are told',
    body: 'If the same period is edited in both systems, Quartzly’s version is kept and the Acme change is held in a review queue rather than discarded. Silent last-write-wins is how reconciliations become unexplainable.',
    bullets: ['Never a silent overwrite', 'Held changes reviewable for 30 days', 'Conflict count on the sync dashboard'],
  },
]

const SETUP_FILES = [
  {
    name: 'connect.sh',
    code: `# 1. Create the connection (once, from your terminal or the UI)
curl -X POST https://api.example.com/v1/connections \\
  -H "Authorization: Bearer $ACME_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "quartzly",
    "workspace": "ws_8f21",
    "scopes": ["ledger.write", "coa.read"]
  }'

# 2. Follow the returned authorize_url in a browser.
# 3. That is the whole of it. The first sync starts within a minute.`,
  },
  {
    name: 'webhook.ts',
    code: `// Told when a sync finishes, rather than polling for it.
export async function POST(request: Request) {
  const event = await request.json()

  if (event.type === 'connection.sync.completed') {
    // \`conflicts\` is the number held for review, not an error count.
    console.log(event.data.pushed, event.data.conflicts)
  }

  // Always 200 quickly; do the work after. A slow webhook is retried,
  // and a retried webhook is the same sync reported twice.
  return new Response(null, { status: 200 })
}`,
  },
]

const PARAMETERS = [
  { name: 'provider', type: 'string', required: true, description: 'Always "quartzly" for this connection.' },
  { name: 'workspace', type: 'string', required: true, description: 'The Acme workspace to bind. One connection per workspace.' },
  {
    name: 'scopes',
    type: 'string[]',
    required: true,
    description: 'Minimum is ledger.write and coa.read. Requesting more than you use is refused at the authorize step.',
  },
  {
    name: 'sync_from',
    type: 'ISO date',
    required: false,
    description: 'Backfill start. Defaults to the first day of the current financial year.',
  },
]

const INTEGRATION_FAQ = [
  {
    question: 'Does it need an admin in Quartzly?',
    answer:
      'For the initial authorisation, yes. After that the connection runs under a service identity, so it survives the admin leaving — which is the failure that takes a month to notice.',
  },
  {
    question: 'What does the backfill cost me?',
    answer:
      'Nothing, and it does not count against your plan volume. Historical records are read-only on our side and we would rather you imported everything.',
  },
  {
    question: 'Can I run it in one direction only?',
    answer:
      'Yes. Push-only is a supported configuration for teams whose chart of accounts is managed somewhere else entirely.',
  },
  {
    question: 'What happens if Quartzly is down?',
    answer:
      'Lines queue and retry for 24 hours, then appear in the sync dashboard as held with the reason. Nothing is dropped, and nothing is posted twice — every push carries an idempotency key.',
  },
]

export default function IntegrationDetailPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Integrations" ctaLabel="Connect" ctaHref="#setup" />

      <main>
        <ArticleHeader
          category="Integration · Accounting"
          title="Acme and Quartzly"
          standfirst="Posted journal lines out every hour, chart of accounts in every night, and a review queue instead of a silent overwrite when the two disagree."
          author="Live since"
          role="March 2023"
          date="Updated 12 January 2026"
          readMinutes={4}
        />

        <FeatureRows
          heading="What moves, and which way"
          subheading="The four questions an integration page usually leaves to a support ticket."
          rows={WHAT_MOVES}
        />

        <div id="setup">
          <CodeShowcase
            heading="Setting it up"
            subheading="Two API calls, or four clicks in the UI. Both are shown because the person evaluating this is usually not the person who will run it."
            files={SETUP_FILES}
            bullets={[
              'One connection per workspace',
              'Scopes are enforced at authorize, not at call time',
              'Webhooks are signed; verify before trusting',
            ]}
          />
        </div>

        <ApiEndpointCard
          method="POST"
          path="/v1/connections"
          description="Creates the connection and returns an authorize_url. Idempotent on provider + workspace, so retrying is safe."
          parameters={PARAMETERS}
          responseStatus="201 Created"
        />

        <FaqAccordion
          heading="About this connection"
          subheading="What support is asked about it most."
          items={INTEGRATION_FAQ}
        />

        <CtaSplitPanel
          heading="Connect it in about four minutes"
          supporting="You will need a Quartzly admin for the first step and nothing after that. Backfill is free and does not count against plan volume."
          primaryLabel="Connect Quartzly"
          secondaryLabel="See all integrations"
        />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
