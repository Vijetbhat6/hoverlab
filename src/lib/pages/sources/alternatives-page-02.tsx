/**
 * The alternatives page, take 02 — one rival, head to head.
 *
 *   framing     who should stay where they are, said first
 *   table       the two products side by side, on rows that matter
 *   migration   what switching actually costs, in time and pain
 *   proof       someone who made this exact move
 *   objections  the questions a switcher asks that a buyer never does
 *
 * Take 01 is the category page: a comparison table with four rivals and a
 * section naming where each one is the better buy. It ranks for "best X
 * software" and it is read by someone who has not bought anything yet.
 *
 * This is the other page, and it is the one that converts: "Acme vs
 * Northwind", read by someone who already owns Northwind. Every assumption
 * changes. They are not choosing a category, they are weighing a migration
 * they do not want to do, against a tool they have already paid for and
 * trained four people on. The competitor's weaknesses are not news to them —
 * they live with them — so a feature table alone is the wrong argument.
 *
 * Hence `data-migration-split` in the middle, which take 01 has no use for.
 * The thing standing between this reader and a switch is not "is Acme
 * better", it is "will I lose four years of match history and spend a
 * quarter on it". Answering that is the page.
 *
 * It opens by telling a large share of the audience not to switch. Naming
 * the three cases where Northwind is the right thing to keep is what buys
 * the credibility for the table underneath — and a comparison page with no
 * such paragraph is read as advertising, because it is.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroSplit } from '@/lib/blocks/sources/hero-split'
import { ProductCompareTable } from '@/lib/blocks/sources/product-compare-table'
import { DataMigrationSplit } from '@/lib/blocks/sources/data-migration-split'
import { TestimonialSpotlight } from '@/lib/blocks/sources/testimonial-spotlight'
import { FaqObjectionList } from '@/lib/blocks/sources/faq-objection-list'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const PRODUCTS = [
  {
    id: 'acme',
    name: 'Acme',
    price: '€490/mo',
    values: {
      'Entities included': '12',
      'Auto-match, median at 12 weeks': '94%',
      'Rule editor for your team': 'Included',
      'Time to first close': '6 weeks',
      'SOC 2': 'Type I',
      'Self-hosting': 'No',
      'Data export on cancellation': '90 days, self-serve',
    },
  },
  {
    id: 'northwind',
    name: 'Northwind',
    price: '€350/mo',
    values: {
      'Entities included': '5',
      'Auto-match, median at 12 weeks': '89%',
      'Rule editor for your team': 'Support ticket',
      'Time to first close': '3 weeks',
      'SOC 2': 'Type II',
      'Self-hosting': 'Yes, enterprise',
      'Data export on cancellation': '30 days, on request',
    },
  },
]

const ROWS = [
  { label: 'Entities included', better: 'higher' as const, numeric: (v: string) => Number(v) },
  { label: 'Auto-match, median at 12 weeks', better: 'higher' as const, numeric: (v: string) => parseFloat(v) },
  { label: 'Rule editor for your team', better: 'none' as const },
  { label: 'Time to first close', better: 'lower' as const, numeric: (v: string) => parseInt(v, 10) },
  { label: 'SOC 2', better: 'none' as const },
  { label: 'Self-hosting', better: 'none' as const },
  { label: 'Data export on cancellation', better: 'none' as const },
]

const MIGRATION = [
  {
    label: 'Match history: we import it, all of it',
    detail: 'Four years of Northwind match decisions import as evidence, not as rules — so your auto-match starts around 80 percent rather than at zero. This is the single biggest reason a switch is survivable, and it is the question nobody thinks to ask until week two.',
  },
  {
    label: 'Rules: about 60 percent convert automatically',
    detail: 'Structural rules (account, amount, date window) convert cleanly. Anything using Northwind’s scripting does not, and we rewrite those by hand during the engagement. Typically eleven to twenty rules.',
  },
  {
    label: 'Run both for one close. We expect you to.',
    detail: 'One month of parallel running, both systems, both results compared line by line. It is a real cost — roughly two extra days for your controller — and anyone telling you to cut straight over has not migrated a close.',
  },
  {
    label: 'Realistic elapsed time: seven weeks, not three',
    detail: 'Six for the build plus one parallel close. Northwind quotes three weeks for an inbound migration and, to be fair to them, they hit it — because they do not run the parallel month.',
  },
  {
    label: 'What you will lose',
    detail: 'Northwind’s supplier-portal module has no equivalent here and is not on our roadmap. Two customers went back for exactly that reason.',
  },
]

const SWITCHER_QUESTIONS = [
  {
    id: 'stay',
    label: 'When should we just stay on Northwind?',
    detail:
      'Three cases, and they are not rare. If you need SOC 2 Type II today, they have it and we do not until Q2. If you self-host by policy, they support it and we never will. If you use their supplier-portal module, there is nothing here to move to. Roughly a third of the people reading this page should close it.',
    tone: 'critical' as const,
    status: 'Often',
  },
  {
    id: 'cost',
    label: 'You are 40 percent more expensive. Why?',
    detail:
      'Twelve entities included against their five, and the rule editor is in the price rather than behind a support queue. At five entities or fewer they are genuinely cheaper and we will not pretend otherwise.',
    tone: 'warning' as const,
    status: '+40%',
  },
  {
    id: 'contract',
    label: 'We are mid-contract with them.',
    detail:
      'We will credit up to three months of overlap against your first invoice, capped at €1,500. It is not a rescue package for a three-year enterprise term and we will tell you that on the first call rather than the fourth.',
    tone: 'neutral' as const,
    status: 'Up to 3 months',
  },
  {
    id: 'back',
    label: 'What if we want to go back?',
    detail:
      'Full export in ninety days, self-serve, including the match history in the format Northwind imports. Two customers have used it. We would rather that number be honest than zero.',
    tone: 'positive' as const,
    status: '2 have',
  },
]

export default function AlternativesPage02() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Compare" ctaLabel="Talk to us" ctaHref="#alternatives-page-02-talk" />

      <main>
        <HeroSplit
          eyebrow="Acme vs Northwind"
          heading="If you need Type II today or you self-host, stay where you are"
          subheading="You already own Northwind. You know its weaknesses better than we do, so a feature table is not the argument — what switching costs is. This page leads with the three cases where the answer is don't, then spends the rest on what a migration actually involves."
          primaryLabel="See the migration cost"
          primaryHref="#alternatives-page-02-migration"
          secondaryLabel="Compare the two"
          secondaryHref="#alternatives-page-02-table"
          bullets={[
            'Seven weeks elapsed, including a parallel close',
            'Four years of match history imports as evidence',
            'Up to 3 months of contract overlap credited',
          ]}
        />

        <div id="alternatives-page-02-table" className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <ProductCompareTable products={PRODUCTS} rows={ROWS} />
        </div>

        {/*
          The section take 01 has no use for. A category page argues about
          features; a switcher page argues about the cost of leaving, and
          that argument is won or lost on whether the match history survives.
        */}
        <div id="alternatives-page-02-migration">
          <DataMigrationSplit
            eyebrow="Switching"
            heading="What a migration off Northwind actually costs"
            intro="Written in weeks of your controller's time rather than in a sales timeline. The last row is the thing you would lose, and it is the reason two customers went back."
            points={MIGRATION}
          />
        </div>

        <TestimonialSpotlight
          quote="The parallel month was the part I resented and the part that made it work. We found nine rules that had been quietly wrong in Northwind for two years, and we would never have found them in a straight cutover."
          name="Tobias Lund"
          role="CFO"
          company="Northwind Logistics"
          stats={[
            { value: '7 wks', label: 'Signed to fully migrated' },
            { value: '9', label: 'Silently wrong rules found' },
          ]}
        />

        <FaqObjectionList
          heading="What a switcher asks that a new buyer never does"
          intro="The first row is the one we would most like you to read, and it is the one that tells roughly a third of this page's readers to stay put."
          rows={SWITCHER_QUESTIONS}
        />

        <div id="alternatives-page-02-talk">
          <CtaSplitPanel
            heading="Send us your Northwind rule export"
            supporting="We will tell you what fraction converts automatically and how many rules need rewriting, as a number, before you commit to anything. It takes us about a day and there is no call attached to it."
            primaryLabel="Send the rule export"
            secondaryLabel="Read the migration guide"
          />
        </div>
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
