/**
 * An integration-platform landing page, assembled from blocks.
 *
 * Superficially this is the developer-tool page again, and it is not. The
 * question that decides a developer tool is "is this any good"; the question
 * that decides an integration platform is "is *my* thing on the list", and
 * a visitor who cannot answer that in ten seconds leaves regardless of how
 * good the product is:
 *
 *   navbar          catalogue first, because that is the question
 *   hero            the connector names, in the hero, above the pitch
 *   catalogue       the full list with honest live/beta/planned status
 *   code            one payload in four languages — the second question
 *   features        what the platform does that a webhook does not
 *   pricing         credit packs, because the usage is bursty and uneven
 *   roadmap         what is coming, dated, because the answer to "is my
 *                   thing on the list" is often "not yet" and that has to
 *                   go somewhere better than a support email
 *   faq             lock-in, rate limits, what happens when an API changes
 *   footer          the full sitemap, since the catalogue is the SEO surface
 *
 * THE STATUS FIELD IS THE WHOLE HONESTY OF THE PAGE. `<IntegrationGrid>`
 * takes `live | beta | planned`, and the temptation is to mark everything
 * live. Do it and the first developer who hits a beta connector in
 * production stops believing the rest of the list. Marking four as planned
 * costs a few signups and buys the credibility that makes the other
 * thirty-odd worth anything.
 *
 * WHY THE ROADMAP IS ON THE LANDING PAGE. Most visitors will not find their
 * system in the catalogue. Without a roadmap that is a dead end; with one
 * it is a date and a mailing list. It is the cheapest section on the page
 * and it catches the majority of the traffic.
 *
 * WHY CREDITS AND NOT SEATS. Integration volume is bursty — a migration
 * month is fifty times a normal one — and a seat price makes the quiet
 * months feel like a rip-off and the busy ones like a penalty. Packs that
 * do not expire fit the actual shape of the usage.
 *
 * Every section takes props, so this file is a running order rather than a
 * wall of copy — swap the content without touching the layout.
 */

import * as React from 'react'

import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroIntegrations } from '@/lib/blocks/sources/hero-integrations'
import { IntegrationGrid } from '@/lib/blocks/sources/integration-grid'
import { CodeTabsPanel } from '@/lib/blocks/sources/code-tabs-panel'
import { FeatureRows } from '@/lib/blocks/sources/feature-rows'
import { PricingCredits } from '@/lib/blocks/sources/pricing-credits'
import { RoadmapColumns } from '@/lib/blocks/sources/roadmap-columns'
import { FaqGrid } from '@/lib/blocks/sources/faq-grid'
import { FooterMega } from '@/lib/blocks/sources/footer-mega'

export default function IntegrationPlatformLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Junction"
        links={[
          { label: 'Catalogue', href: '#catalogue' },
          { label: 'Docs', href: '/docs' },
          { label: 'Packs', href: '#packs' },
        ]}
        activeLabel="Catalogue"
        signInLabel="Sign in"
        signInHref="/login"
        ctaLabel="Get an API key"
        ctaHref="/login"
      />

      <main>
        {/* The connector names are the headline. Everything else on this
            page is answering a question the visitor has not asked yet. */}
        <HeroIntegrations
          eyebrow="38 connectors, one contract"
          heading="One API for every system your customers already run"
          subheading="Junction normalises 38 CRMs, ledgers and HR systems behind a single schema. Write the integration once; we keep it working when their vendor changes the field names."
          primaryLabel="Browse the catalogue"
          primaryHref="#catalogue"
          secondaryLabel="Read the docs"
          secondaryHref="/docs"
          integrations={[
            'Salesforce',
            'HubSpot',
            'NetSuite',
            'Xero',
            'QuickBooks',
            'Workday',
            'BambooHR',
            'Dynamics 365',
          ]}
          moreLabel="and 30 more"
        />

        <div id="catalogue">
          <IntegrationGrid
            heading="The whole catalogue, with what actually works"
            subheading="Beta means the endpoints exist and the edge cases do not all have tests yet. Planned means it is not built. We would rather lose the signup than the trust."
            integrations={[
              { name: 'Salesforce', description: 'Accounts, contacts, opportunities and custom objects.', status: 'live', category: 'CRM' },
              { name: 'HubSpot', description: 'Full CRM object model, including associations.', status: 'live', category: 'CRM' },
              { name: 'Pipedrive', description: 'Deals, persons, organisations and activities.', status: 'live', category: 'CRM' },
              { name: 'NetSuite', description: 'GL, AR/AP, subsidiaries and saved searches.', status: 'live', category: 'Ledger' },
              { name: 'Xero', description: 'Invoices, bills, contacts and tracking categories.', status: 'live', category: 'Ledger' },
              { name: 'QuickBooks', description: 'Online only — the desktop editions are not supported.', status: 'live', category: 'Ledger' },
              { name: 'Sage Intacct', description: 'Dimensions, journals and multi-entity consolidation.', status: 'beta', category: 'Ledger' },
              { name: 'Workday', description: 'Workers, org structure and compensation, read-only.', status: 'beta', category: 'HR' },
              { name: 'BambooHR', description: 'Employees, time off and custom fields.', status: 'live', category: 'HR' },
              { name: 'Personio', description: 'Employees, absences and attendance.', status: 'live', category: 'HR' },
              { name: 'Dynamics 365', description: 'Sales and Business Central. Finance & Ops is planned.', status: 'beta', category: 'CRM' },
              { name: 'SAP S/4HANA', description: 'Scoped to the finance modules. In build with two design partners.', status: 'planned', category: 'Ledger' },
              { name: 'Oracle Fusion', description: 'ERP and HCM. Design partners wanted.', status: 'planned', category: 'Ledger' },
              { name: 'Gusto', description: 'Payroll runs, employees and contractor payments.', status: 'planned', category: 'HR' },
            ]}
          />
        </div>

        {/* The second question, in four languages, because "is there an SDK
            for what I write in" is asked immediately after "is my system on
            the list". */}
        <CodeTabsPanel
          title="One normalised payload, whatever is behind it"
          tabs={[
            {
              label: 'TypeScript',
              language: 'ts',
              code: `import { Junction } from '@junction/sdk'

const junction = new Junction(process.env.JUNCTION_KEY!)

// Same shape whether the account lives in Salesforce,
// HubSpot or Dynamics — the connector is a parameter,
// not a different code path.
const { data } = await junction.accounts.list({
  connection: 'conn_8fK2',
  updatedSince: '2026-08-01',
  limit: 100,
})

for (const account of data) {
  console.log(account.id, account.name, account.owner?.email)
}`,
            },
            {
              label: 'Python',
              language: 'py',
              code: `from junction import Junction

junction = Junction(os.environ["JUNCTION_KEY"])

page = junction.accounts.list(
    connection="conn_8fK2",
    updated_since="2026-08-01",
    limit=100,
)

for account in page.data:
    print(account.id, account.name, account.owner.email)`,
            },
            {
              label: 'Go',
              language: 'go',
              code: `client := junction.New(os.Getenv("JUNCTION_KEY"))

page, err := client.Accounts.List(ctx, &junction.AccountListParams{
    Connection:   "conn_8fK2",
    UpdatedSince: junction.Date("2026-08-01"),
    Limit:        100,
})
if err != nil {
    return err
}

for _, account := range page.Data {
    fmt.Println(account.ID, account.Name, account.Owner.Email)
}`,
            },
            {
              label: 'curl',
              language: 'bash',
              code: `curl https://api.junction.example/v1/accounts \\
  -H "Authorization: Bearer $JUNCTION_KEY" \\
  -G \\
  -d connection=conn_8fK2 \\
  -d updated_since=2026-08-01 \\
  -d limit=100`,
            },
          ]}
        />

        <FeatureRows
          heading="What this does that a webhook does not"
          subheading="Every one of these is a thing you would otherwise build once per connector, and then maintain once per connector for as long as the product exists."
          rows={[
            {
              eyebrow: 'Normalisation',
              title: 'One schema, thirty-eight field-naming conventions',
              body: 'An account is an account whether the system underneath calls it a Customer, an Organisation or a Business Partner. Custom fields come through in a typed passthrough rather than being dropped, so the 20% of every integration that is somebody’s bespoke field does not fall out of the abstraction.',
              bullets: [
                'One object model across CRM, ledger and HR',
                'Custom fields preserved and typed',
                'Field-level mapping you can override per connection',
              ],
            },
            {
              eyebrow: 'Auth',
              title: 'The OAuth dance, thirty-eight times, already done',
              body: 'A hosted connection flow your customer completes in your product, with token refresh, revocation handling and the per-vendor quirks absorbed. The one that expires silently after 90 days is handled; you find out from a webhook rather than from a customer.',
              bullets: ['Hosted or embedded connect flow', 'Refresh and revocation handled', 'Per-connection scope reporting'],
            },
            {
              eyebrow: 'Change',
              title: 'When their vendor breaks the API, it is our incident',
              body: 'Upstream schema changes are absorbed behind the normalised model wherever they can be, and announced with a migration window where they cannot. In four years we have passed through two breaking changes to customers, both with ninety days’ notice.',
              bullets: ['Versioned, with a 12-month support window', '2 breaking changes passed through since 2022', 'Status per connector, not just per platform'],
            },
          ]}
        />

        <div id="packs">
          <PricingCredits
            eyebrow="Pricing"
            heading="Credits, because integration volume is not a straight line"
            subheading="A customer’s migration month is fifty times a normal one. Seats make the quiet months feel like a rip-off and the busy ones like a penalty."
            unitExplainer="One credit is one API call to a connected system — a read, a write or a page of results. Retries after our own failures are not charged."
            packs={[
              {
                credits: '250K',
                price: '$99',
                unit: 'per month',
                note: 'Enough for about 40 connected customers on a normal month.',
                ctaLabel: 'Start here',
                ctaHref: '/login',
              },
              {
                credits: '2M',
                price: '$599',
                unit: 'per month',
                saving: 'Save 25%',
                note: 'The tier most teams settle on once they are past a hundred connections.',
                featured: true,
                ctaLabel: 'Choose 2M',
                ctaHref: '/login',
              },
              {
                credits: '10M',
                price: '$2,200',
                unit: 'per month',
                saving: 'Save 45%',
                note: 'Volume pricing below this rate is available above 25M.',
                ctaLabel: 'Talk to us',
                ctaHref: '#',
              },
            ]}
            assurances={[
              'Unused credits roll over for 12 months',
              'Retries after our own failures are never charged',
              'No per-connector fee and no per-seat fee',
              'Hard caps available, so a runaway job cannot invoice you',
            ]}
          />
        </div>

        {/* Most visitors will not find their system above. This is where
            they go instead of away. */}
        <RoadmapColumns
          heading="If yours is not on the list yet"
          subheading="Dated where we can date it, and marked planned rather than “coming soon”. Design partners get the connector free for the first year and a say in the field mapping."
          items={[
            { title: 'Salesforce custom objects, write path', status: 'shipped', description: 'Landed in v3.1, August.' },
            { title: 'Sage Intacct multi-entity', status: 'shipped', description: 'Consolidation dimensions included.' },
            { title: 'Workday write path', status: 'in-progress', description: 'Read-only today; writes with two design partners.', eta: 'Q4 2026' },
            { title: 'Dynamics 365 Finance & Ops', status: 'in-progress', description: 'Sales and Business Central are already live.', eta: 'Q4 2026' },
            { title: 'SAP S/4HANA, finance modules', status: 'planned', description: 'Scoped with two design partners. Not started.', eta: 'H1 2027' },
            { title: 'Oracle Fusion ERP', status: 'planned', description: 'Design partners wanted — talk to us.', eta: 'H1 2027' },
            { title: 'Gusto and Rippling payroll', status: 'planned', description: 'Payroll is a different object model; scoping now.', eta: 'H1 2027' },
            { title: 'Webhook-based change feeds for every connector', status: 'in-progress', description: 'Polling today on 11 of the 38.', eta: 'Q1 2027' },
          ]}
        />

        <FaqGrid
          heading="What you will ask in the security review"
          subheading="Or at the point where somebody senior asks what happens if this goes away."
          items={[
            {
              question: 'Do you store our customers’ data?',
              answer:
                'Only what is needed to serve a request, and by default only for the 24 hours a retry window needs. Sync mode caches normalised records so you can query without hitting the upstream rate limit; it is opt-in per connection, and the retention is yours to set down to zero.',
            },
            {
              question: 'What happens when we outgrow you?',
              answer:
                'Every connection can be exported with its tokens and its field mappings, in a documented format, on every plan. We would rather you left cleanly than stayed because leaving was expensive — and the number of teams that ask this and then never leave is most of them.',
            },
            {
              question: 'How do you handle upstream rate limits?',
              answer:
                'Per-connection budgeting, queued writes and automatic backoff tuned to each vendor’s published limits. Your call either returns data or returns a documented 429 with a retry-after — it never silently returns a partial page.',
            },
            {
              question: 'Who is liable when a connector loses data?',
              answer:
                'We are, up to the limits in the contract, and the contract is on the site rather than behind a sales call. Writes are idempotent by key so a retry cannot double-post, which is the failure mode this question is really about.',
            },
            {
              question: 'Can we self-host it?',
              answer:
                'No, and we would rather say so plainly than run a sales process that ends here. Single-tenant deployment in your cloud region is available on the top tier; the code does not leave our estate.',
            },
            {
              question: 'What is your uptime, and where is it published?',
              answer:
                '99.95% on the API, measured per connector and published per connector — a status page that stays green while one connector has been broken for a week is worse than no status page at all.',
            },
          ]}
        />
      </main>

      <FooterMega
        brand="Junction"
        tagline="One API for the systems your customers already run."
        statusLabel="All connectors normal"
        statusHref="/status"
        regionNote="Data processed in the EU and US. Region selectable per account."
        columns={[
          {
            heading: 'Product',
            links: [
              { label: 'Catalogue', href: '#catalogue' },
              { label: 'Credit packs', href: '#packs' },
              { label: 'Roadmap', href: '#' },
              { label: 'Changelog', href: '/changelog' },
              { label: 'Status', href: '/status' },
            ],
          },
          {
            heading: 'Developers',
            links: [
              { label: 'Documentation', href: '/docs' },
              { label: 'API reference', href: '/docs' },
              { label: 'SDKs', href: '/docs', badge: '4 languages' },
              { label: 'Sandbox connections', href: '/docs' },
              { label: 'Postman collection', href: '#' },
            ],
          },
          {
            heading: 'Connectors',
            links: [
              { label: 'CRM', href: '#catalogue' },
              { label: 'Ledger and ERP', href: '#catalogue' },
              { label: 'HR and payroll', href: '#catalogue' },
              { label: 'Request a connector', href: '#' },
              { label: 'Become a design partner', href: '#' },
            ],
          },
          {
            heading: 'Company',
            links: [
              { label: 'About', href: '#' },
              { label: 'Security', href: '#' },
              { label: 'Sub-processors', href: '#' },
              { label: 'Careers', href: '#' },
            ],
          },
        ]}
        legalLinks={[
          { label: 'Terms', href: '#' },
          { label: 'Privacy', href: '#' },
          { label: 'DPA', href: '#' },
          { label: 'SLA', href: '#' },
        ]}
      />
    </div>
  )
}
