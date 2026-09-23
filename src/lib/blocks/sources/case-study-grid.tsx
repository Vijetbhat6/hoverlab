/**
 * <CaseStudyGrid> — a grid of case-study cards, each leading with the number.
 *
 * The catalog already has a full case-study PAGE (`case-study-page.tsx`) and
 * a table for the results section inside one (`<StatsComparison>`). What was
 * missing is the block that links a reader to several of those pages at
 * once — the "customer stories" section a marketing site puts on its home
 * page or its own `/customers` index, one card per company.
 *
 * Every card leads with the metric, not the company name or a photo,
 * because a card in a grid is competing with five others for a glance: a
 * reader deciding which of six case studies to open is scanning for the
 * biggest number, not the prettiest logo. The quote and the company come
 * after, as the evidence for the number rather than the headline.
 *
 * `window` — a measurement period, authored per card — is required by the
 * type rather than optional, for the reason `case-study-page.tsx` and
 * `customer-outcome-band.tsx` both give: "-63%" with no period attached is
 * not a checkable claim, and a component that makes the field optional
 * teaches the person filling it in that it is fine to leave out.
 *
 * The whole card is the link, matching `<BlogPostGrid>` next door — a metric
 * and a quote that are not clickable read as clickable and are the most
 * common card papercut in this catalog.
 */

import * as React from 'react'
import { ArrowRight } from 'lucide-react'

export interface CaseStudy {
  slug: string
  company: string
  industry: string
  /** The headline figure, already formatted: "68% faster", "3.2x", "$1.2M saved". */
  metric: string
  /** What the metric measures, in a few words: "Time to close the books". */
  metricLabel: string
  /** The period it was measured over — see the note above. */
  window: string
  quote: string
  attribution: string
}

export interface CaseStudyGridProps {
  heading?: string
  standfirst?: string
  studies?: CaseStudy[]
  className?: string
}

const DEFAULT_STUDIES: CaseStudy[] = [
  {
    slug: '/customers/lumen-finance',
    company: 'Lumen Finance',
    industry: 'Fintech · 210 employees',
    metric: '68% faster',
    metricLabel: 'Days to close the month',
    window: 'over two full quarters',
    quote: 'Reconciliation stopped being the thing that ate the first week of every month.',
    attribution: 'VP of Finance',
  },
  {
    slug: '/customers/northbridge-logistics',
    company: 'Northbridge Logistics',
    industry: 'Logistics · 1,400 employees',
    metric: '9 days → 2',
    metricLabel: 'Year-end audit prep',
    window: 'measured across two audit cycles',
    quote: 'Our auditors got read-only access instead of a folder of screenshots. They noticed.',
    attribution: 'Head of Compliance',
  },
  {
    slug: '/customers/hearthside-retail',
    company: 'Hearthside Retail',
    industry: 'E-commerce · 60 employees',
    metric: '31% lower',
    metricLabel: 'Cost per resolved ticket',
    window: 'over the first six months',
    quote: 'We automated the boring 80% and kept the exceptions in front of a human, on purpose.',
    attribution: 'Head of Support',
  },
]

export function CaseStudyGrid({
  heading = 'What changed for them',
  standfirst = 'Three teams, three different problems, one number each that a colleague can check.',
  studies = DEFAULT_STUDIES,
  className = '',
}: CaseStudyGridProps) {
  return (
    <section className={`mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{heading}</h2>
        <p className="mt-3 text-pretty text-muted-foreground">{standfirst}</p>
      </div>

      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {studies.map((study) => (
          <li key={study.slug}>
            <a
              href={study.slug}
              className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card/80 p-6 transition-shadow hover:shadow-lg"
            >
              <div>
                <div className="min-w-0 break-words text-3xl font-bold tracking-tight text-primary tabular-nums">
                  {study.metric}
                </div>
                <div className="mt-1 min-w-0 break-words text-sm font-medium text-foreground">{study.metricLabel}</div>
                <div className="min-w-0 break-words text-xs text-muted-foreground">{study.window}</div>
              </div>

              <p className="mt-4 min-w-0 flex-1 break-words text-pretty text-sm leading-relaxed text-muted-foreground">
                &ldquo;{study.quote}&rdquo;
              </p>

              <div className="mt-5 flex flex-wrap items-end justify-between gap-x-3 gap-y-2 border-t border-border/60 pt-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold transition-colors group-hover:text-primary">
                    {study.company}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{study.industry}</div>
                  <div className="truncate text-xs text-muted-foreground/80">{study.attribution}</div>
                </div>
                <span className="inline-flex max-w-full items-center gap-1 text-xs font-semibold text-primary">
                  Read the case study
                  <ArrowRight aria-hidden className="h-3.5 w-3.5 transition-transform rtl:rotate-180 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
