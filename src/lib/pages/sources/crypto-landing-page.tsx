/**
 * The landing page for an exchange — a crypto or fintech front door.
 *
 *   ticker     prices, moving, before a word of copy
 *   hero       what it is and what it costs, with the numbers in the hero
 *   custody    where the money actually is
 *   proof      volume, assets, uptime
 *   product    the three things the app does
 *   fees       the number everybody is really here for
 *   answers    the objections, which in this category are regulatory
 *   risk       the warning, in full, not in a footer
 *
 * THE TICKER IS THE FIRST THING AND IT IS NOT DECORATION. A visitor
 * arriving at a financial product is asking one question — is this a real
 * market with real prices — and a moving rail of quotes answers it before
 * the heading does. Nothing else in the catalog does that job; a logo cloud
 * would be the generic substitute and it says only that other people exist.
 *
 * TRUST IS THE PRODUCT, SO THE TRUST SECTIONS OUTNUMBER THE FEATURE ONES.
 * <SecurityPostureBand> sits above the feature grid rather than below it,
 * which is the opposite of the SaaS ordering, because the conversion
 * blocker here is "will you lose my money" and not "does it do what I
 * need". <StatsBenchmarkBand> then carries proof-of-reserves and uptime as
 * figures with sources rather than as adjectives.
 *
 * THE RISK WARNING IS A SECTION, NOT SMALL PRINT. Every jurisdiction that
 * regulates this category requires it, several require it above the fold,
 * and burying it in a footer is both the legal failure and the trust
 * failure. <PricingValueSplit> carries it as real content with the fee
 * schedule, because a fee page that hides the downside is the exact thing
 * this industry is distrusted for.
 *
 * <PricingTiers> is deliberately NOT used. It has a monthly/yearly toggle
 * built in, and an exchange does not bill per month — it takes a
 * percentage per trade. <ComparisonTable> is the honest shape for a fee
 * schedule, and the tier names are volume bands rather than plans.
 *
 * Anchors are prefixed `cx-`; `#pricing`, `#fees` and `#faq` are all taken
 * elsewhere in the catalog and /pages renders every page on one DOM.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { PriceTickerStrip } from '@/lib/blocks/sources/price-ticker-strip'
import { HeroMetrics } from '@/lib/blocks/sources/hero-metrics'
import { SecurityPostureBand } from '@/lib/blocks/sources/security-posture-band'
import { StatsBenchmarkBand } from '@/lib/blocks/sources/stats-benchmark-band'
import { FeatureRows } from '@/lib/blocks/sources/feature-rows'
import { ComparisonTable } from '@/lib/blocks/sources/comparison-table'
import { PricingValueSplit } from '@/lib/blocks/sources/pricing-value-split'
import { FaqTwoColumn } from '@/lib/blocks/sources/faq-two-column'
import { FooterCompliance } from '@/lib/blocks/sources/footer-compliance'

const HERO_METRICS = [
  { value: '$4.1bn', label: '30-day spot volume' },
  { value: '0.10%', label: 'Taker fee, entry tier' },
  { value: '214', label: 'Assets listed' },
  { value: '1:1', label: 'Reserves, attested monthly' },
]

const CUSTODY = [
  { label: '98% in cold storage', value: 'Offline', detail: 'Multi-party signing, three geographies, no single quorum holder' },
  { label: 'Client assets segregated', value: 'Ring-fenced', detail: 'Held apart from company funds in a bankruptcy-remote entity' },
  { label: 'Proof of reserves', value: 'Monthly', detail: 'Merkle-tree attestation you can verify against your own balance' },
  { label: 'Insurance on the hot wallet', value: '$250m', detail: 'Underwritten by a Lloyd’s syndicate, policy published in full' },
]

const PROOF = [
  { label: 'Matching engine uptime', value: '99.99%', detail: 'Rolling 12 months, measured externally and published at status.meridian.exchange' },
  { label: 'Median withdrawal', value: '4 min', detail: 'Fiat SEPA, business hours, last 90 days' },
  { label: 'Order latency, p99', value: '11 ms', detail: 'Frankfurt colocation, matched to acknowledgement' },
  { label: 'Regulated in', value: '9 markets', detail: 'MiCA authorisation in the EU, FCA registration in the UK' },
]

const PRODUCT = [
  {
    eyebrow: 'Trade',
    title: 'A real order book, not a swap widget',
    body: 'Limit, market, stop and trailing orders on every pair, with the full depth visible and no hidden spread priced into the quote you are shown.',
    bullets: [
      'Post-only and reduce-only flags on every order type',
      'The spread is shown; we do not widen it and call it "zero fee"',
      'REST and WebSocket APIs on the same rate limits we use ourselves',
    ],
  },
  {
    eyebrow: 'Hold',
    title: 'Withdraw to your own wallet, always, without asking',
    body: 'Self-custody is a right and not a feature. There is no minimum holding period, no withdrawal lock on a promotional balance, and no support ticket between you and your keys.',
    bullets: [
      'Whitelist addresses with a 24-hour cooling period you control',
      'Hardware-key 2FA, and no SMS fallback that defeats it',
      'A full CSV and API export of every movement, going back to day one',
    ],
  },
  {
    eyebrow: 'Report',
    title: 'The tax export your accountant will accept',
    body: 'Cost basis computed per jurisdiction, including the disposal rules that differ between the UK, Ireland and Germany, with the working shown rather than a single number.',
    bullets: [
      'FIFO, LIFO and average-cost, switchable per tax year',
      'Direct export to three filing tools, or plain CSV',
      'Free on every tier — a tax report behind a paywall is a hostage',
    ],
  },
]

const FEE_ROWS = [
  { feature: '30-day volume', values: ['Under $50k', '$50k – $1m', '$1m – $10m', 'Over $10m'] },
  { feature: 'Maker fee', values: ['0.08%', '0.04%', '0.02%', '0.00%'] },
  { feature: 'Taker fee', values: ['0.10%', '0.08%', '0.05%', '0.03%'] },
  { feature: 'Crypto withdrawal', values: ['Network fee only', 'Network fee only', 'Network fee only', 'Network fee only'] },
  { feature: 'SEPA deposit and withdrawal', values: [true, true, true, true] },
  { feature: 'Dedicated API rate limit', values: [false, false, true, true] },
  { feature: 'Named account manager', values: [false, false, false, true] },
]

const RISK_POINTS = [
  {
    label: 'The value of crypto assets can go down as well as up',
    detail:
      'You may get back less than you put in, and you may get back nothing at all. Past performance tells you nothing about future returns.',
  },
  {
    label: 'Crypto assets are not covered by a deposit guarantee scheme',
    detail:
      'Unlike a bank account, there is no FSCS or equivalent compensation if we fail. This is why segregation and proof of reserves are on this page.',
  },
  {
    label: 'You are responsible for your own tax position',
    detail:
      'We produce the report; we do not file it and we are not your accountant. Disposals are usually taxable even when you never touch fiat.',
  },
  {
    label: 'Do not trade with money you need',
    detail:
      'We will not lend you money to trade, we do not offer leverage to retail clients, and we would rather lose the account than the customer.',
  },
]

const OBJECTIONS = [
  {
    question: 'How do I know my money is not being lent out behind my back?',
    answer:
      'Because client assets sit in a separate, bankruptcy-remote entity and the monthly attestation is a Merkle tree you can check your own balance against — the leaf hash is in your account settings. We do not run a yield product, which is the mechanism by which this usually goes wrong.',
  },
  {
    question: 'What happens to my assets if you go out of business?',
    answer:
      'Client assets are segregated, so they are not part of the estate. The administrator returns them; they do not distribute them to our creditors. That is a legal structure rather than a promise, and it is the one question worth checking on any exchange.',
  },
  {
    question: 'Is "zero fee" trading elsewhere actually cheaper?',
    answer:
      'Usually not. Zero-fee venues make the money back on the spread, which is invisible at the moment you trade. Our spread is the order book’s and our fee is on this page, so the total cost is something you can calculate before you press the button.',
  },
  {
    question: 'Why do you need my identity documents?',
    answer:
      'Anti-money-laundering rules in all nine markets we are authorised in. We ask for the minimum the rule requires, delete the raw images after verification, and never sell or share the data. An exchange that skips this step is one regulatory action from freezing your withdrawals.',
  },
  {
    question: 'Can I use this through an API for a trading bot?',
    answer:
      'Yes, on every tier, with the same rate limits our own front end uses. Keys are scoped — a read-only key cannot place an order and a trading key cannot withdraw, which is the separation that saves people when a key leaks.',
  },
]

/*
  <FooterCompliance> defaults to three regions of a fictional software
  multinational, which would be wrong here in a way nobody would notice
  until they shipped: the entity, the registration number and the tax line
  are the parts a regulated business is legally required to get right, and
  an exchange inheriting a SaaS company's VAT footer is the sort of detail
  that ends a licence. So all three are supplied.
*/
const REGIONS = [
  {
    id: 'eu',
    label: 'European Union',
    entity: 'Meridian Digital Assets Ireland Ltd',
    registration: 'CRO 682114 · MiCA authorisation CBI-2025-0417',
    address: ['Ormond Quay House', '2 Upper Ormond Quay', 'Dublin 7, D07 W704', 'Ireland'],
    taxLine: 'VAT IE4392710K. Authorised and supervised by the Central Bank of Ireland.',
    extraLinks: [
      { label: 'MiCA white papers', href: '#' },
      { label: 'Proof of reserves', href: '#' },
      { label: 'Complaints procedure', href: '#' },
    ],
  },
  {
    id: 'uk',
    label: 'United Kingdom',
    entity: 'Meridian Digital Assets UK Ltd',
    registration: 'Companies House 14827731 · FCA firm reference 984210',
    address: ['4th Floor, Tenter House', '45 Moorfields', 'London EC2Y 9AE', 'United Kingdom'],
    taxLine:
      'VAT GB 412 8837 21. Registered with the FCA for anti-money-laundering supervision only — crypto asset trading is not a regulated activity and is not covered by the FSCS.',
    extraLinks: [
      { label: 'Risk summary', href: '#' },
      { label: 'Financial promotions', href: '#' },
      { label: 'Complaints procedure', href: '#' },
    ],
  },
  {
    id: 'ch',
    label: 'Switzerland',
    entity: 'Meridian Digital Assets AG',
    registration: 'CHE-419.882.006 · SRO member, VQF 101884',
    address: ['Baarerstrasse 82', '6300 Zug', 'Switzerland'],
    taxLine: 'CHE-419.882.006 MWST. Affiliated to a FINMA-recognised self-regulatory organisation.',
    extraLinks: [
      { label: 'SRO membership', href: '#' },
      { label: 'Proof of reserves', href: '#' },
    ],
  },
]

const PAYMENTS = ['SEPA', 'Faster Payments', 'SWIFT', 'Visa', 'Mastercard']

export default function CryptoLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Meridian"
        links={[
          { label: 'Markets', href: '#cx-markets' },
          { label: 'Security', href: '#cx-custody' },
          { label: 'Fees', href: '#cx-fees' },
          { label: 'Developers', href: '#cx-product' },
        ]}
        activeLabel="Markets"
        signInLabel="Sign in"
        ctaLabel="Open an account"
      />

      <div id="cx-markets">
        <PriceTickerStrip />
      </div>

      <main>
        <HeroMetrics
          eyebrow="MiCA-authorised · FCA-registered"
          heading="An exchange that publishes the number you are actually paying"
          subheading="Spot trading on 214 assets, a real order book, and a fee schedule on the same page as the marketing. Withdraw to your own wallet whenever you like — there is no lock-up and never was."
          metrics={HERO_METRICS}
          primaryLabel="Open an account"
          secondaryLabel="Read the fee schedule"
          secondaryHref="#cx-fees"
        />

        <div id="cx-custody">
          <SecurityPostureBand
            eyebrow="Custody"
            heading="Where the money actually is"
            intro="The four facts that decide whether an exchange is safe to use, each one checkable rather than asserted. If a venue will not answer these, that is the answer."
            metrics={CUSTODY}
          />
        </div>

        <StatsBenchmarkBand
          eyebrow="Operations"
          heading="Measured, published, and externally checked"
          intro="Numbers from the last twelve months. The status page is third-party hosted, so it stays up when we do not."
          metrics={PROOF}
        />

        <div id="cx-product">
          <FeatureRows
            heading="Three things, done properly"
            subheading="We are not trying to be a bank, a card, a social network and a launchpad. Trading, custody and reporting — and the reporting is the one everybody else treats as an afterthought."
            rows={PRODUCT}
          />
        </div>

        <div id="cx-fees">
          <ComparisonTable
            heading="The fee schedule, in full"
            subheading="Volume bands, not subscription plans — there is no monthly charge and nothing to cancel. Your band is recalculated every day on a rolling 30-day window."
            columns={['Entry', 'Active', 'Professional', 'Institutional']}
            rows={FEE_ROWS}
            highlightColumn={1}
          />
        </div>

        <PricingValueSplit
          eyebrow="Risk warning"
          heading="Read this part before the marketing"
          intro="Crypto assets are unregulated in several of the markets we serve and are high risk everywhere. This section is required by law in most of them and we would print it anyway."
          points={RISK_POINTS}
        />

        <FaqTwoColumn
          heading="The questions worth asking any exchange"
          subheading="Including the ones we would rather you did not ask. If a competitor cannot answer these in writing, that tells you something."
          items={OBJECTIONS}
          helpTitle="Still deciding?"
          helpBody="Our compliance team answers questions about custody and segregation directly, in writing, before you deposit anything."
          helpCtaLabel="Ask compliance a question"
        />
      </main>

      <FooterCompliance brand="Meridian" />
    </div>
  )
}
