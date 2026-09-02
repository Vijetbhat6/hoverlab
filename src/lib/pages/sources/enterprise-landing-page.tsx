/**
 * An enterprise landing page, assembled from blocks.
 *
 * The person reading this cannot buy it. They are building an internal case
 * for somebody else to sign, and the page's job is to hand them the case
 * rather than to convince them personally:
 *
 *   navbar          a mega menu, because there are genuinely twenty pages
 *   hero            four numbers, not a promise — those numbers go in a deck
 *   logos           peers, which is the argument that survives a committee
 *   features        what it does, in tiles they can screenshot
 *   comparison      us against the incumbent, named, with the losses admitted
 *   video           three named customers on camera, because procurement
 *                   asks for references and this is the pre-emptive answer
 *   milestones      that we will still exist in four years
 *   pricing         real tiers with real numbers, not a "contact sales" wall
 *   cta             a demo, which is the only real conversion at this size
 *   footer          the compliance and legal surface a vendor review reads
 *
 * WHY THERE ARE NUMBERS IN THE HERO. Everything above the fold on this page
 * gets pasted into a slide by somebody who needs their VP to care. A
 * headline cannot be pasted; "31% lower cost per resolved ticket, median
 * across 412 accounts" can. `<HeroMetrics>` is the block that puts that
 * where they will find it.
 *
 * WHY THE COMPARISON NAMES THE COMPETITOR AND CONCEDES ROWS. A comparison
 * table that wins every row is read as marketing and discarded. Losing two
 * rows on purpose is what makes the other eleven usable inside the customer's
 * own organisation, which is the only place this argument actually happens.
 *
 * WHY PRICING EXISTS AT ALL. "Contact sales" is the default at this tier and
 * it costs more than it protects: the champion cannot start a budget
 * conversation without a number, so the deal does not begin. Publishing the
 * floor — including the enterprise one — gives them something to take to
 * finance, and filters out the buyers who were never going to clear it.
 *
 * Every section takes props, so this file is a running order rather than a
 * wall of copy — swap the content without touching the layout.
 */

import * as React from 'react'

import { NavbarMegaMenu } from '@/lib/blocks/sources/navbar-mega-menu'
import { HeroMetrics } from '@/lib/blocks/sources/hero-metrics'
import { LogoCloud } from '@/lib/blocks/sources/logo-cloud'
import { BentoFeatures } from '@/lib/blocks/sources/bento-features'
import { ComparisonTable } from '@/lib/blocks/sources/comparison-table'
import { TestimonialVideo } from '@/lib/blocks/sources/testimonial-video'
import { StatsTimeline } from '@/lib/blocks/sources/stats-timeline'
import { PricingTiers } from '@/lib/blocks/sources/pricing-tiers'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterCompliance } from '@/lib/blocks/sources/footer-compliance'

export default function EnterpriseLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarMegaMenu
        brand="Ledgerline"
        plainLinks={[
          { label: 'Customers', href: '#customers' },
          { label: 'Pricing', href: '#plans' },
        ]}
        ctaLabel="Book a demo"
        ctaHref="#demo"
      />

      <main>
        <HeroMetrics
          eyebrow="Reconciliation for regulated finance teams"
          heading="Close the month in four days, and prove how"
          subheading="Ledgerline reconciles every ledger, flags what does not match, and keeps an audit trail your regulator will accept without a follow-up request."
          primaryLabel="Book a demo"
          primaryHref="#demo"
          secondaryLabel="Read a customer story"
          secondaryHref="#customers"
          metrics={[
            { value: '31%', label: 'lower cost per close' },
            { value: '4.2 days', label: 'median month-end, from 11' },
            { value: '412', label: 'finance teams' },
            { value: '99.99%', label: 'uptime, trailing 12 months' },
          ]}
        />

        <LogoCloud
          caption="Reconciling for regulated teams at"
          logos={[
            'Northwind',
            'Contoso',
            'Initech',
            'Globex',
            'Umbrella',
            'Soylent',
            'Vandelay',
            'Lumon',
          ]}
        />

        <BentoFeatures
          heading="What a finance team stops doing by hand"
          subheading="Four surfaces. Each of them is a spreadsheet somebody currently owns, maintains and worries about."
          tiles={[
            {
              title: 'Matching that explains itself',
              body: 'Every automatic match records the rule that made it and the confidence it had, so a reviewer approves a decision rather than re-doing it. The 4% that cannot be matched arrive in a queue with the near-misses attached, not as an error log.',
              span: 'lg:col-span-2',
            },
            {
              title: 'An audit trail nobody assembles',
              body: 'Immutable, timestamped, and exportable to the format your auditor asks for. It is generated as work happens rather than reconstructed in March.',
            },
            {
              title: 'Controls that map to the framework',
              body: 'SOX, ICFR and your own internal controls, mapped to the actual steps in the product, with evidence attached to each one.',
            },
            {
              title: 'Close the same way every month',
              body: 'A checklist with owners, dependencies and a real critical path, so the month-end that took eleven days does not take eleven days because two people were on holiday.',
              span: 'lg:col-span-2',
            },
          ]}
        />

        {/* Names the incumbent and loses two rows. See the header note. */}
        <ComparisonTable
          heading="Against the two things you are probably using"
          subheading="Written by us, so read it accordingly — but the two rows we lose are real, and we would rather you found them here than in month three."
          columns={['Ledgerline', 'Legacy ERP module', 'Spreadsheets']}
          highlightColumn={0}
          rows={[
            { feature: 'Automatic match rate, out of the box', values: ['96%', '71%', 'n/a'] },
            { feature: 'Match reasoning recorded per transaction', values: [true, false, false] },
            { feature: 'Immutable audit trail', values: [true, true, false] },
            { feature: 'Close checklist with owners and critical path', values: [true, false, 'Manual'] },
            { feature: 'SOX / ICFR control mapping', values: [true, 'Add-on', false] },
            { feature: 'SSO, SCIM and scoped roles', values: [true, true, false] },
            { feature: 'Median time to first close', values: ['3 weeks', '9 months', 'Same day'] },
            { feature: 'Works offline on a plane', values: [false, false, true] },
            {
              feature: 'Already integrated with your ERP',
              values: ['14 connectors', 'It is the ERP', 'n/a'],
            },
            { feature: 'Data residency in the EU or UK', values: [true, 'Varies', 'Your laptop'] },
            { feature: 'Cost of the first year', values: ['£48k–£140k', '£300k+', 'Salaries'] },
            { feature: 'Nobody has to be trained on it', values: [false, false, true] },
          ]}
        />

        {/* Procurement will ask for references. This is the answer arriving
            before the question. */}
        <div id="customers">
          <TestimonialVideo
            eyebrow="Customers"
            heading="Three finance leads, on the record"
            subheading="Filmed at their offices, unscripted, and each of them was told they could say what did not work. Two of them did."
            testimonials={[
              {
                name: 'Marisol Herrera',
                role: 'Group Financial Controller',
                company: 'Contoso',
                pullQuote:
                  'We went from eleven days to four. The implementation was harder than they said it would be and I would still do it again tomorrow.',
                duration: '4:12',
                href: '#',
              },
              {
                name: 'Peter Nkemelu',
                role: 'VP Finance',
                company: 'Northwind',
                pullQuote:
                  'The audit trail is the thing. Our auditors used to send forty follow-up requests at year end. Last year they sent four.',
                duration: '3:38',
                href: '#',
              },
              {
                name: 'Hana Ito',
                role: 'Head of Financial Operations',
                company: 'Lumon',
                pullQuote:
                  'The match rate was 96% in the demo and about 80% on our data for the first two months, because our data was a mess. It is 95% now. Ask them what your number will really be.',
                duration: '5:01',
                href: '#',
              },
            ]}
          />
        </div>

        <StatsTimeline
          eyebrow="The vendor-risk question"
          heading="Whether we will still be here when your contract renews"
          milestones={[
            {
              period: '2019',
              value: 'Founded',
              label: 'By two people who had run month-end at a bank',
              note: 'First customer that November; still a customer.',
            },
            {
              period: '2022',
              value: 'Profitable',
              label: 'And has been every quarter since',
              note: 'We raised once, in 2020, and have not needed to again.',
            },
            {
              period: '2024',
              value: 'SOC 2 Type II',
              label: 'Plus ISO 27001 and UK/EU data residency',
              note: 'Reports available under NDA before you sign anything.',
            },
            {
              period: '2026',
              value: '412',
              label: 'finance teams, 94% renewing at twelve months',
              note: 'The 6% who left mostly got acquired onto a parent’s stack.',
            },
          ]}
        />

        {/* `<PricingPlanPicker>` was the first choice and its own header
            talks you out of it: that block is the checkout step, for someone
            who has already decided to pay, and its prorated "charged today"
            line is nonsense on a page nobody has an account on. Tiers are
            the marketing surface, and here the monthly/annual toggle is real
            rather than decorative — annual commitment is how this is
            actually bought. */}
        <div id="plans">
          <PricingTiers
            heading="Real numbers, so you can start the budget conversation"
            subheading="Published because a champion who cannot name a figure cannot open a budget conversation, and a deal that never opens is not protected — it is lost."
            currency="£"
            yearlyDiscount={0.15}
            plans={[
              {
                name: 'Team',
                monthly: 4000,
                description: 'Up to 15 finance users and 3 entities. Self-serve onboarding.',
                features: [
                  'Automatic matching with recorded reasoning',
                  'Close checklist with owners and dependencies',
                  'Immutable audit trail and exports',
                  '4 ERP connectors included',
                  'Email support, next business day',
                ],
                cta: 'Book a demo',
              },
              {
                name: 'Business',
                monthly: 9500,
                description: 'Up to 60 users and 20 entities, with a named lead for the first close.',
                features: [
                  'Everything in Team',
                  'SSO, SCIM and scoped roles',
                  'SOX / ICFR control mapping with evidence',
                  'All 14 ERP connectors',
                  'Named implementation lead through your first close',
                  '99.9% SLA with automatic credits',
                ],
                cta: 'Book a demo',
                featured: true,
              },
              {
                name: 'Enterprise',
                monthly: 14000,
                description: 'From — unlimited entities, your choice of data residency, custom controls.',
                features: [
                  'Everything in Business',
                  'Unlimited entities and users',
                  'UK, EU or your own region for data residency',
                  'Custom controls and bespoke connectors',
                  '99.99% SLA, quarterly business reviews',
                  'Security pack and sub-processor list under NDA',
                ],
                cta: 'Talk to us',
              },
            ]}
          />
          <p className="mx-auto -mt-8 max-w-2xl px-4 pb-16 text-center text-sm text-muted-foreground sm:px-6">
            Prices exclude VAT and are the same whether you find them here or
            ask a salesperson. Implementation is quoted separately and is
            typically £12k–£40k, depending on how many systems have to be
            connected.
          </p>
        </div>

        <div id="demo">
          <CtaSplitPanel
            heading="See it against your own ledger"
            supporting="Forty-five minutes, with a solutions engineer rather than an account executive, using a sample of your data if you can share one."
            primaryLabel="Book a demo"
            primaryHref="#"
            secondaryLabel="Request the security pack"
            secondaryHref="#"
            reassurance={[
              { text: 'A solutions engineer, not a discovery call' },
              { text: 'SOC 2 and ISO reports available under NDA first' },
              { text: 'We will tell you if your ERP is not one we do well' },
            ]}
          />
        </div>
      </main>

      <FooterCompliance
        brand="Ledgerline"
        paymentMethods={['Bank transfer', 'Direct debit', 'Visa', 'Mastercard']}
        regions={[
          {
            id: 'uk',
            label: 'United Kingdom',
            entity: 'Ledgerline Software Ltd',
            registration: 'Registered in England and Wales, company no. 11840922',
            address: ['3rd Floor, 40 Gracechurch Street', 'London EC3V 0BT', 'United Kingdom'],
            taxLine: 'VAT registration GB 318 4402 91. Prices exclude VAT.',
            extraLinks: [
              { label: 'SOC 2 and ISO 27001 reports', href: '#assurance' },
              { label: 'Sub-processors', href: '#subprocessors' },
              { label: 'Modern slavery statement', href: '#modern-slavery' },
            ],
          },
          {
            id: 'eu',
            label: 'European Union',
            entity: 'Ledgerline Software B.V.',
            registration: 'Registered with the Dutch KvK, no. 81920447',
            address: ['Herengracht 124', '1015 BT Amsterdam', 'Netherlands'],
            taxLine: 'VAT registration NL 8619 55 402 B01. Reverse charge applies for EU businesses.',
            extraLinks: [
              { label: 'Standard contractual clauses', href: '#scc' },
              { label: 'EU data residency', href: '#residency' },
              { label: 'Imprint', href: '#imprint' },
            ],
          },
        ]}
      />
    </div>
  )
}
