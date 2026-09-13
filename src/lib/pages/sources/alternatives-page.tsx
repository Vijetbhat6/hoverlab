/**
 * The comparison / alternatives page — the one a competitor's name brings
 * people to.
 *
 *   table     the matrix, including the rows where we lose
 *   honest    where each competitor is genuinely the better choice
 *   ratings   third-party scores, which are not ours to adjust
 *   faq       the questions a comparison page raises about itself
 *
 * The section that makes this page work is the second one. A comparison table
 * where the home column wins every row is read as marketing and discarded —
 * the reader already knows no product wins everything, so a page claiming it
 * tells them only that this page is not evidence. Naming the cases where a
 * competitor is the right answer is what makes the other forty rows
 * believable, and it costs almost nothing: someone whose need is genuinely
 * better served elsewhere was never going to become a happy customer.
 *
 * Every row is a fact that could be checked on the day of writing, and the
 * table says when that was. A comparison page with no date is a comparison
 * page that will be wrong within a quarter and will not know it.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { ComparisonTable } from '@/lib/blocks/sources/comparison-table'
import { FeatureRows } from '@/lib/blocks/sources/feature-rows'
import { TestimonialRatings } from '@/lib/blocks/sources/testimonial-ratings'
import { FaqAccordion } from '@/lib/blocks/sources/faq-accordion'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const MATRIX = [
  { feature: 'Free tier that does not expire', values: [true, false, false] },
  { feature: 'Public REST API on every plan', values: [true, false, true] },
  { feature: 'SSO without an enterprise contract', values: [true, false, false] },
  { feature: 'Self-serve export of everything', values: [true, true, false] },
  { feature: 'Data residency choice', values: ['3 regions', '1 region', '6 regions'] },
  { feature: 'Published rate limits', values: [true, false, false] },
  { feature: 'Native mobile apps', values: [false, true, true] },
  { feature: 'Offline desktop client', values: [false, true, false] },
  { feature: 'Approval workflows', values: ['Basic', 'Advanced', 'Advanced'] },
  { feature: 'Implementation partners', values: ['4', '140+', '60+'] },
  { feature: 'Entry price, per month', values: ['£0', '£49', '£90'] },
  { feature: 'Minimum contract', values: ['None', '12 months', '12 months'] },
]

const WHERE_THEY_WIN = [
  {
    eyebrow: 'Choose Meridia if',
    title: 'Your approval chains are genuinely complicated',
    body: 'Conditional, multi-branch approval routing is their strongest feature and is better than ours by a distance. If a purchase order takes four different paths depending on amount, department and supplier risk, buy theirs.',
    bullets: ['Conditional multi-branch routing', 'Delegation and out-of-office rules', 'Mature mobile approvals'],
  },
  {
    eyebrow: 'Choose Obsidia if',
    title: 'You need a partner in the room, in your country',
    body: 'Sixty-plus implementation partners against our four. For a regulated rollout across twelve subsidiaries with local statutory requirements, a partner network is worth more than anything on our feature list.',
    bullets: ['60+ certified partners', 'Six data regions', 'Statutory reporting in 14 countries'],
  },
  {
    eyebrow: 'Choose neither if',
    title: 'A spreadsheet is still working',
    body: 'Under about 500 transactions a month with one person doing the close, none of these three will pay for themselves. Come back when the close takes more than a day or when a second person has to touch it.',
    bullets: ['Under ~500 transactions/month', 'Single preparer', 'No audit requirement yet'],
  },
]

const COMPARISON_FAQ = [
  {
    question: 'Who wrote this and when?',
    answer:
      'We did, on 9 January 2026, from each vendor’s public pricing and documentation on that date. Nothing here comes from a private conversation, and nothing is inferred from a sales call.',
  },
  {
    question: 'What if a row is out of date?',
    answer:
      'Tell us and we will fix it, including when the fix makes us look worse. Every row carries the date it was last checked in the published source data.',
  },
  {
    question: 'Do you compare against the enterprise tiers?',
    answer:
      'Against the cheapest tier of each product that includes the feature. Comparing our entry plan with a competitor’s top plan is the standard trick and produces a table that means nothing.',
  },
  {
    question: 'Can I get a migration from one of these?',
    answer:
      'From either, and it is included rather than a services line item. The importers were built because that is where most of our customers come from.',
  },
]

export default function AlternativesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Compare" ctaLabel="Start free" ctaHref="#versus" />

      <main>
        <div id="versus">
          <ComparisonTable
            heading="Acme, Meridia and Obsidia"
            subheading="Checked against published pricing and documentation on 9 January 2026. Rows where we lose are in the table, in the same type size as the rest."
            columns={['Acme', 'Meridia', 'Obsidia']}
            rows={MATRIX}
            highlightColumn={0}
          />
        </div>

        <FeatureRows
          heading="When you should not buy ours"
          subheading="Three situations where one of the others is the better answer, written by us, on our own site."
          rows={WHERE_THEY_WIN}
        />

        <TestimonialRatings
          score="4.7"
          outOf={5}
          totalReviews="612"
          headline="Scores none of us control"
          sources={[
            { name: 'G2 — Acme', score: '4.7' },
            { name: 'G2 — Meridia', score: '4.5' },
            { name: 'G2 — Obsidia', score: '4.4' },
          ]}
        />

        <FaqAccordion
          heading="About this page"
          subheading="Questions a comparison page ought to answer about itself."
          items={COMPARISON_FAQ}
        />

        <CtaSplitPanel
          heading="Try it against the one you are already paying for"
          supporting="Import into a sandbox workspace, run one real close in both, and keep whichever wins. The sandbox is free and disposable."
          primaryLabel="Start a sandbox"
          secondaryLabel="Book a migration call"
        />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
