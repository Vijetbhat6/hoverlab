/**
 * One case study.
 *
 *   header      who, and what the piece is
 *   comparison  the numbers, before and after, first
 *   detail      what was actually done — three rows, not a narrative
 *   spotlight   the customer in their own words
 *   cta         the way in
 *
 * The numbers go **above** the story, which is the opposite of how case
 * studies are usually written and the reason most of them are not read. A
 * buyer sends this link to a colleague to win an argument; the colleague
 * needs the result in the first screen, and will read the method only if the
 * result is worth the time.
 *
 * Every figure carries its measurement window, because "reduced close time by
 * 60%" with no window is not a claim anyone can check — and a template whose
 * placeholders model unfalsifiable numbers teaches the habit to everyone who
 * fills it in.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { ArticleHeader } from '@/lib/blocks/sources/article-header'
import { StatsComparison } from '@/lib/blocks/sources/stats-comparison'
import { FeatureRows } from '@/lib/blocks/sources/feature-rows'
import { TestimonialSpotlight } from '@/lib/blocks/sources/testimonial-spotlight'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const RESULTS = [
  { metric: 'Days to close the month', before: '9.5', after: '3.0', improvement: '−68%', direction: 'down' as const },
  { metric: 'Entries reconciled by hand', before: '4,200', after: '310', improvement: '−93%', direction: 'down' as const },
  { metric: 'Reopened periods per quarter', before: '2.3', after: '0.4', improvement: '−83%', direction: 'down' as const },
  { metric: 'Finance headcount', before: '6', after: '6', improvement: 'unchanged', direction: 'up' as const },
]

const WHAT_WE_DID = [
  {
    eyebrow: 'Weeks 1–2',
    title: 'Imported four years of history before changing anything',
    body: 'The rule everywhere: no new process until the old data is in and reconciles to the same totals. It caught a duplicate-supplier problem that had been quietly inflating one cost centre since 2022.',
    bullets: ['4.1M rows imported', 'Totals matched to the penny before go-live', 'One pre-existing data fault found'],
  },
  {
    eyebrow: 'Weeks 3–5',
    title: 'Automated the six matching rules that covered 80% of the work',
    body: 'Not all of it. The long tail of exceptions stayed manual on purpose — the team wanted to keep seeing them, and automating a rule you cannot explain to an auditor is a liability rather than a saving.',
    bullets: ['Six rules, all human-readable', 'Exceptions routed, not hidden', 'Every automated match reversible'],
  },
  {
    eyebrow: 'Week 6 onward',
    title: 'Gave the auditors their own read-only access',
    body: 'The year-end request list went from a fortnight of screenshots to a login. This was not in the original scope and turned out to be the change the CFO mentions first.',
    bullets: ['Read-only auditor role', 'Immutable audit log', 'Year-end prep: 11 days → 2'],
  },
]

export default function CaseStudyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Customers" ctaLabel="Talk to sales" ctaHref="#outcome" />

      <main>
        <ArticleHeader
          category="Case study · Manufacturing"
          title="How Halyard Components closed the month in three days"
          standfirst="A six-person finance team, four years of history in two systems, and a close that had been slipping later every quarter for two years."
          author="Priya Raman"
          role="Customer engineering"
          date="4 November 2025"
          readMinutes={6}
        />

        <div id="outcome">
          <StatsComparison
            eyebrow="Results"
            heading="Six months before, six months after"
            beforeLabel="Jan–Jun 2025"
            afterLabel="Jul–Dec 2025"
            rows={RESULTS}
            footnote="Measured from Halyard’s own close calendar, not from our telemetry. Headcount is in the table because it did not change — the saving was in the hours, and nobody lost a job over it."
          />
        </div>

        <FeatureRows
          heading="What the six weeks actually consisted of"
          subheading="Written up in the order it happened, including the part that was not planned."
          rows={WHAT_WE_DID}
        />

        <TestimonialSpotlight
          quote="I had budgeted for a new hire to survive the close. We did not need one, and I would rather have the three days back than the headcount."
          name="Marisol Quintero"
          role="Financial Controller"
          company="Halyard Components"
          stats={[
            { value: '3.0', label: 'Days to close' },
            { value: '93%', label: 'Less manual matching' },
            { value: '6 wks', label: 'To go-live' },
          ]}
        />

        <CtaSplitPanel
          heading="Your close is probably not this one"
          supporting="Send us the shape of it — the systems, the volume and the deadline — and we will tell you honestly whether six weeks is realistic."
          primaryLabel="Book a working session"
          secondaryLabel="Read more studies"
        />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
