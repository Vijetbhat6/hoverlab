'use client'

/**
 * <FeatureTabs> — a feature section where the features take turns.
 *
 * When three features compete for attention on one scroll, each gets a
 * third of it and the page gets long. Tabs give every feature the whole
 * stage — full headline, full mock panel — and the labels double as a
 * table of contents the reader sees before committing to any of them.
 *
 * Wired as a real tablist: roving tabindex, arrow-key movement with
 * wraparound, `aria-selected` and `aria-controls` — not three buttons
 * toggling a div, which reads as nothing to a screen reader.
 */

import * as React from 'react'
import { GitBranch, BellRing, BarChart3, Check } from 'lucide-react'

interface FeatureTab {
  id: string
  label: string
  icon: React.ReactNode
  headline: string
  points: string[]
  panel: React.ReactNode
}

export interface FeatureTabsProps {
  heading?: string
  subheading?: string
  className?: string
}

const TABS: FeatureTab[] = [
  {
    id: 'reviews',
    label: 'Reviews',
    icon: <GitBranch aria-hidden className="h-4 w-4" />,
    headline: 'Reviews that start themselves',
    points: [
      'Reviewers assigned by file ownership, not by whoever is online',
      'Stale approvals dismissed automatically when the diff changes',
      'Merge unblocks the moment the last required check goes green',
    ],
    panel: (
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background p-3">
          <div className="h-2 w-2/5 rounded bg-foreground/30" />
          <div className="h-5 w-16 rounded-full bg-emerald-500/20" />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background p-3">
          <div className="h-2 w-1/2 rounded bg-foreground/30" />
          <div className="h-5 w-16 rounded-full bg-amber-500/20" />
        </div>
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
          <div className="h-2 w-1/3 rounded bg-primary/50" />
          <div className="mt-2 h-2 w-3/4 rounded bg-muted-foreground/25" />
        </div>
      </div>
    ),
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: <BellRing aria-hidden className="h-4 w-4" />,
    headline: 'Alerts that respect the on-call',
    points: [
      'Duplicate incidents grouped into one page, not forty',
      'Severity inferred from blast radius before anyone is woken',
      'Quiet hours honoured for everything below SEV-1',
    ],
    panel: (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
          <div className="h-8 w-8 shrink-0 rounded-full bg-destructive/20" />
          <div className="flex-1 space-y-2">
            <div className="h-2 w-1/2 rounded bg-destructive/40" />
            <div className="h-2 w-3/4 rounded bg-muted-foreground/25" />
          </div>
        </div>
        {['w-2/3', 'w-1/2'].map((w) => (
          <div
            key={w}
            className="flex items-center gap-3 rounded-lg border border-border/60 bg-background p-3 opacity-60"
          >
            <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
            <div className={`h-2 ${w} rounded bg-muted-foreground/25`} />
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: <BarChart3 aria-hidden className="h-4 w-4" />,
    headline: 'Insights without a data team',
    points: [
      'Cycle time, review latency and deploy frequency out of the box',
      'Trends over quarters, not screenshots of last week',
      'Every number links to the pull requests behind it',
    ],
    panel: (
      <div className="flex h-full min-h-40 items-end gap-2 rounded-lg border border-border/60 bg-background p-4">
        {[35, 55, 40, 70, 60, 85, 75].map((h, i) => (
          <div key={i} style={{ height: `${h}%` }} className={`flex-1 rounded-t ${i === 5 ? 'bg-primary/70' : 'bg-primary/25'}`} />
        ))}
      </div>
    ),
  },
]

export function FeatureTabs({
  heading = 'One tool, three jobs',
  subheading = 'Pick the part of the pipeline that hurts most.',
  className = '',
}: FeatureTabsProps) {
  const [active, setActive] = React.useState(0)
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  /**
   * Per-instance id prefix.
   *
   * The ids used to be `feature-tab-${t.id}` — unique within one instance
   * and duplicated the moment a second <FeatureTabs> appeared on the same
   * page, which is exactly what a catalog hub does and what any site with
   * two feature sections does. Duplicate ids are not a lint nicety here:
   * `aria-controls` and `aria-labelledby` resolve to whichever element comes
   * first in the document, so the second tablist silently points at the
   * first one's panels and a screen reader reads the wrong content.
   *
   * `useId()` is React's answer and is stable across server and client
   * render, which a counter or a random string is not.
   */
  const uid = React.useId()

  const onKeyDown = (event: React.KeyboardEvent) => {
    let next: number | null = null
    if (event.key === 'ArrowRight') next = (active + 1) % TABS.length
    if (event.key === 'ArrowLeft') next = (active - 1 + TABS.length) % TABS.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = TABS.length - 1
    if (next !== null) {
      event.preventDefault()
      setActive(next)
      tabRefs.current[next]?.focus()
    }
  }

  const tab = TABS[active]

  return (
    <section className={`mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}>
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{heading}</h2>
        {subheading ? <p className="mt-3 text-muted-foreground">{subheading}</p> : null}
      </div>

      <div
        role="tablist"
        aria-label="Product features"
        onKeyDown={onKeyDown}
        className="mx-auto mb-10 flex w-fit flex-wrap justify-center gap-1 rounded-xl border border-border/60 bg-muted/50 p-1"
      >
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => { tabRefs.current[i] = el }}
            type="button"
            role="tab"
            id={`${uid}-tab-${t.id}`}
            aria-selected={i === active}
            aria-controls={`${uid}-panel-${t.id}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              i === active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${uid}-panel-${tab.id}`}
        aria-labelledby={`${uid}-tab-${tab.id}`}
        className="grid items-center gap-10 lg:grid-cols-2"
      >
        <div>
          <h3 className="text-balance text-2xl font-bold tracking-tight">{tab.headline}</h3>
          <ul className="mt-6 space-y-4">
            {tab.points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm leading-relaxed">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                >
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-muted-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </div>
        <div aria-hidden className="rounded-2xl border border-border/60 bg-card/80 p-5 sm:p-6">
          {tab.panel}
        </div>
      </div>
    </section>
  )
}
