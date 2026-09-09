/**
 * <KpiSummaryBand> — The top-of-dashboard figures, each carrying the comparison period that makes a delta mean anything.
 *
 * The layout problem in a dashboard summary is not the numbers, it is the
 * deltas. A percentage change with no stated comparison period is the most
 * common way a dashboard misleads the people who built it — "+7.2%" against
 * last calendar month and against a trailing thirty days are different
 * numbers, and teams argue about which one was on the screen.
 *
 * So every detail names the comparison explicitly, and the first tile spells
 * out the one that is usually ambiguous: the previous 30 days, not last
 * calendar month. The obvious wrong answer is a coloured arrow, which
 * carries a direction and no denominator at all.
 *
 * The latency tile does the same job for a different failure: it names p95
 * and says p50 is 96 ms and hides this. A single latency number on a
 * dashboard is almost always the median, and the median is the one that
 * looks fine while a twentieth of requests time out.
 *
 * The incidents tile says degraded, not down. One is a number that means
 * three different things depending on severity, so the tile spends its
 * detail line disambiguating rather than repeating itself.
 *
 * Accessibility: the `<dl>` pairing announces "Active workspaces, 3,412"
 * rather than a bare figure, which matters most on a band where all four
 * values are numbers with no units. `tabular-nums` keeps them aligned, and
 * the `gap-px` grid over `bg-border` produces true hairlines. Server
 * component — nothing here is interactive, and the demo values are the
 * defaults so it renders identically in a preview and a screenshot.
 */

export interface KpiSummaryBandMetric {
  label: string
  value: string
  /** One clause on what moved, or omit for a bare figure. */
  detail?: string
}

export interface KpiSummaryBandProps {
  eyebrow?: string
  heading?: string
  intro?: string
  metrics?: KpiSummaryBandMetric[]
  className?: string
}

const METRICS: KpiSummaryBandMetric[] = [
  { label: "Active workspaces", value: "3,412", detail: "+7.2% on the previous 30 days, not on last calendar month." },
  { label: "Net revenue retention", value: "112%", detail: "Trailing twelve months, expansion minus churn and contraction." },
  { label: "p95 latency", value: "412 ms", detail: "Same period, all regions. p50 is 96 ms and hides this." },
  { label: "Open incidents", value: "1", detail: "Degraded, not down. Public status page has the detail." },
]

export function KpiSummaryBand({
  eyebrow = "This month",
  heading = "The four numbers the team looks at",
  intro = "Every figure names what it is being compared against. A delta with no stated period is the most common way a dashboard misleads the people who built it.",
  metrics = METRICS,
  className,
}: KpiSummaryBandProps) {
  return (
    <section
      aria-labelledby="kpi-summary-band-heading"
      className={`w-full bg-background px-6 py-16 sm:py-20 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h2
          id="kpi-summary-band-heading"
          className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          {heading}
        </h2>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">{intro}</p>

        {/*
          A <dl>, not a grid of divs. Each tile is a term and its value, and
          a screen reader reading "Uptime, 99.98%" is the whole point of the
          section — a div soup reads as five unrelated numbers.
        */}
        <dl className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="bg-card p-6">
              <dt className="text-sm font-medium text-muted-foreground">{metric.label}</dt>
              <dd className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                {metric.value}
              </dd>
              {metric.detail ? (
                <p className="mt-1 text-sm text-muted-foreground">{metric.detail}</p>
              ) : null}
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
