/**
 * The integrations directory.
 *
 *   hero      the count, and the one that matters to this visitor
 *   grid      everything, with status on every card
 *   segments  the same set grouped by the job, for browsing
 *   faq       the three questions a directory always raises
 *
 * `status` on every card is the point of the page. A directory that lists
 * planned integrations beside live ones without marking which is which is the
 * commonest form of lying on a marketing site, and it is discovered at
 * exactly the wrong moment — after the contract. Marking `beta` and `planned`
 * costs one badge and buys the whole page its credibility.
 *
 * The hero's integration strip is a subset, not the whole list: a hero that
 * renders all forty logos is a wall, and the four the visitor recognises do
 * more work than forty they do not.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroIntegrations } from '@/lib/blocks/sources/hero-integrations'
import { IntegrationGrid } from '@/lib/blocks/sources/integration-grid'
import { LogoSegments } from '@/lib/blocks/sources/logo-segments'
import { FaqAccordion } from '@/lib/blocks/sources/faq-accordion'
import { FooterMega } from '@/lib/blocks/sources/footer-mega'

const INTEGRATIONS = [
  {
    name: 'Quartzly',
    description: 'Two-way sync of ledgers and cost centres, reconciled hourly.',
    category: 'Accounting',
    status: 'live' as const,
  },
  {
    name: 'Northwind',
    description: 'Shipment and duty records imported nightly, matched to invoices.',
    category: 'Logistics',
    status: 'live' as const,
  },
  {
    name: 'Halyard',
    description: 'Payment runs pushed for approval and pulled back as settled.',
    category: 'Payments',
    status: 'live' as const,
  },
  {
    name: 'Meridia',
    description: 'Employee and cost-centre directory as the source of truth for approvals.',
    category: 'HR',
    status: 'live' as const,
  },
  {
    name: 'Cobalt Loop',
    description: 'Infrastructure spend broken out per team and posted as journal lines.',
    category: 'Cloud',
    status: 'beta' as const,
  },
  {
    name: 'Tessellate',
    description: 'Design-tool seat counts reconciled against the licence ledger.',
    category: 'SaaS spend',
    status: 'beta' as const,
  },
  {
    name: 'Obsidia',
    description: 'Warehouse export for teams that would rather model it themselves.',
    category: 'Data',
    status: 'live' as const,
  },
  {
    name: 'Ferrous',
    description: 'Works-order costs matched to purchase invoices at line level.',
    category: 'Manufacturing',
    status: 'planned' as const,
  },
  {
    name: 'Isobar',
    description: 'Carbon accounting fed from the same supplier records as the ledger.',
    category: 'Reporting',
    status: 'planned' as const,
  },
]

const INTEGRATION_FAQ = [
  {
    question: 'What does “beta” mean on a card here?',
    answer:
      'It works, it is supported, and the field mapping may still change with notice. It is not a waiting list — you can turn a beta integration on today, and roughly a third of customers run at least one.',
  },
  {
    question: 'Can I build my own?',
    answer:
      'Yes. Everything on this page uses the same public REST API and webhooks that you have, with no private endpoints and no partner tier. If ours does not fit, yours will not be second-class.',
  },
  {
    question: 'How do I get one built that is not listed?',
    answer:
      'Ask. We build the ones that more than five customers request, in request order, and the list of what has been asked for is public rather than a thing you have to guess at.',
  },
]

export default function IntegrationsIndexPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Acme"
        activeLabel="Integrations"
        ctaLabel="Start free"
        ctaHref="#directory"
      />

      <main>
        <HeroIntegrations
          eyebrow="Integrations"
          heading="It already talks to what you already run"
          subheading="Nine live connections and two in beta, all built on the same public API you can use yourself. Nothing here is a partner-tier endpoint."
          primaryLabel="Browse the directory"
          primaryHref="#directory"
          secondaryLabel="Read the API docs"
          integrations={['Quartzly', 'Northwind', 'Halyard', 'Meridia', 'Obsidia']}
          moreLabel="and four more"
        />

        <div id="directory">
          <IntegrationGrid
            heading="Everything, with its real status"
            subheading="Live means supported and stable. Beta means supported and still moving. Planned means not yet built, and it is on this page rather than hidden so you can plan around it."
            integrations={INTEGRATIONS}
          />
        </div>

        <LogoSegments
          eyebrow="By the job"
          heading="Grouped by what you are trying to close"
          subheading="The same set, arranged by the reconciliation it removes rather than by vendor category."
        />

        <FaqAccordion
          heading="About this directory"
          subheading="Three questions every integration page raises and most of them dodge."
          items={INTEGRATION_FAQ}
        />
      </main>

      <FooterMega
        brand="Acme"
        tagline="Nine live connections, two in beta, all on the same public API you have."
      />
    </div>
  )
}
