/**
 * The case study, take 02 — the narrative one.
 *
 *   quote       the customer's sentence, before any of ours
 *   story       what happened, in order, including the bad middle
 *   outcome     the numbers, as confirmation rather than as headline
 *   benchmark   the same numbers against the category, so they mean something
 *   next        one step, low commitment
 *
 * Take 01 puts the numbers above the story on the grounds that this link
 * gets forwarded and the colleague who receives it needs the result in the
 * first screen. That is correct for a case study used as sales collateral —
 * a champion sends it internally and the recipient reads two hundred pixels.
 *
 * This take is for the case study used as a *discovery* asset: found by
 * search, read by someone who has not yet decided they have the problem.
 * For that reader, the metric-first layout fails, because a thirty-percent
 * improvement in a number they do not yet track is noise. They need to
 * recognise their own situation first, which is what the quote and the
 * narrative do.
 *
 * The deliberate difficulty: this take includes the part where it went
 * wrong. Six weeks in, the match rules were worse than the spreadsheet they
 * replaced. Sales collateral cuts that paragraph; a discovery asset needs it,
 * because a story with no bad middle reads as marketing and gets discounted
 * entirely — including the numbers at the end.
 *
 * `stats-benchmark-band` follows `customer-outcome-band` rather than
 * replacing it: one says what this customer got, the other says whether that
 * is unusual. A result with no category baseline is a number, not evidence.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroTestimonial } from '@/lib/blocks/sources/hero-testimonial'
import { FeatureRows } from '@/lib/blocks/sources/feature-rows'
import { CustomerOutcomeBand } from '@/lib/blocks/sources/customer-outcome-band'
import { StatsBenchmarkBand } from '@/lib/blocks/sources/stats-benchmark-band'
import { CtaInlineCard } from '@/lib/blocks/sources/cta-inline-card'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const STORY = [
  {
    eyebrow: 'Before',
    title: 'Four people, two days, every month, forever',
    body: 'Meridian ran eleven entities across three currencies, and the close ran on a shared workbook with 340 tabs that one person understood. Nobody thought this was fine. It had simply never been the most broken thing in any given quarter, which is how a two-day manual process survives six years.',
    bullets: [
      '340-tab workbook, one owner, no tests',
      'Close took 9 working days end to end',
      'Two restatements in the prior 18 months',
    ],
  },
  {
    eyebrow: 'The middle, which did not go well',
    title: 'Six weeks in, the automated match was worse than the spreadsheet',
    body: 'The first rule set matched 71 percent of lines. The workbook, with a human applying judgement, was effectively matching 96. For about a month the finance team was doing their old job plus reviewing our exceptions, and the honest summary of week six is that they nearly stopped. What changed it was giving them the rule editor rather than filing tickets with us — the controller wrote the seventeen rules that took it to 94 percent herself, in an afternoon, because she was the only person who knew why a supplier sometimes invoiced under a trading name.',
    bullets: [
      'Week 6: 71% auto-match, and falling confidence',
      'Week 9: rule editor handed over, 17 rules written in-house',
      'Week 12: 94% auto-match, exceptions reviewed in 40 minutes',
    ],
  },
  {
    eyebrow: 'After',
    title: 'The close is boring now, and one person no longer holds the risk',
    body: 'The number that matters to the CFO is nine days down to four. The number that matters to the controller is that she took a fortnight off in November for the first time since 2021, because the rules are written down and three people can run them.',
    bullets: [
      'Close: 9 days to 4',
      'Three people can now run it, up from one',
      'No restatement since cutover',
    ],
  },
]

const OUTCOMES = [
  { label: 'Close duration', value: '4 days', detail: 'From 9, measured over 8 consecutive closes' },
  { label: 'Auto-matched lines', value: '94%', detail: 'Up from 71% at week 6' },
  { label: 'Exception review', value: '40 min', detail: 'Was roughly 2 days of combined effort' },
  { label: 'People who can run close', value: '3', detail: 'Was 1' },
]

const BENCHMARK = [
  { label: 'Median close, 11-entity peers', value: '6.5 days', detail: 'Meridian: 4' },
  { label: 'Typical auto-match at 12 weeks', value: '88%', detail: 'Meridian: 94%' },
  { label: 'Typical time to first value', value: '3 weeks', detail: 'Meridian: 9 — the slow one' },
]

export default function CaseStudyPage02() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Customers" ctaLabel="Talk to us" ctaHref="#case-study-page-02-next" />

      <main>
        <HeroTestimonial
          eyebrow="Case study — Meridian Foods"
          heading="The month-end close went from nine days to four"
          subheading="Eleven entities, three currencies, and a 340-tab workbook that one person understood. This is the whole story, including the six weeks where our software was worse than the spreadsheet it replaced."
          primaryLabel="Read what happened"
          primaryHref="#case-study-page-02-story"
          secondaryLabel="See the numbers"
          secondaryHref="#case-study-page-02-outcome"
          quote="I would not describe the first two months as a success. What saved it was that they gave me the rule editor instead of asking me to file tickets — I knew why the data was weird and they never could have."
          authorName="Priya Raman"
          authorTitle="Financial Controller, Meridian Foods"
        />

        <div id="case-study-page-02-story">
          <FeatureRows
            heading="What actually happened, in order"
            subheading="Three acts, and the second one is the reason the third is believable."
            rows={STORY}
          />
        </div>

        <div id="case-study-page-02-outcome">
          <CustomerOutcomeBand
            eyebrow="Twelve months on"
            heading="Where it landed"
            intro="Measured over eight consecutive closes rather than the best one, which is the only version of these numbers worth printing."
            metrics={OUTCOMES}
          />
        </div>

        {/*
          A result with no baseline is a number. This band exists so the
          reader can tell which of the four outcomes above is genuinely
          unusual — and it includes the row where Meridian did worse than
          typical, because a benchmark that only flatters is not one.
        */}
        <StatsBenchmarkBand
          eyebrow="Against the category"
          heading="Is four days good?"
          intro="Compared against the 34 other 10-to-15-entity customers we have. One of these three rows does not flatter us and it is the one about time to first value."
          metrics={BENCHMARK}
        />

        <div id="case-study-page-02-next">
          <CtaInlineCard
            contextLabel="Finished the story"
            heading="Ask Priya about it directly"
            body="She has agreed to take reference calls, including from people who end up choosing someone else. Thirty minutes, no salesperson on the line."
            actionLabel="Request a reference call"
            href="#case-study-page-02-next"
            fineprint="We introduce by email and then step out of the thread."
          />
        </div>
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
