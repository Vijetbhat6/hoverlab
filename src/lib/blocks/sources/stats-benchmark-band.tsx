/**
 * <StatsBenchmarkBand> — Performance figures with the measurement method printed beside each one, so a sceptical reader can check rather than take them.
 *
 * A stat band's layout problem is that the figure and its caveat compete
 * for the same slot. The obvious wrong answer is to drop the caveat: four
 * huge numbers read beautifully and mean nothing, because "112 ms" without
 * "p50, Frankfurt, empty cache" is not a measurement, it is a claim. So the
 * detail line is part of the tile rather than a footnote under the section,
 * and the tile is sized to hold two lines of it.
 *
 * The markup is a <dl>, and that is the non-obvious accessibility decision.
 * A grid of divs reads to a screen reader as four unrelated numbers in a
 * row; <dt>/<dd> pairs read as "Cold start, 112 ms", which is the only
 * useful way to hear this section. The detail sits in a <p> inside the same
 * <div> rather than in a second <dd>, because a definition list with two
 * values per term announces them as alternatives.
 *
 * `tabular-nums` on the value, so the four figures line up on their digits
 * rather than on their glyph widths — the column stops looking ragged the
 * moment one value has a 1 in it.
 *
 * The grid is `gap-px` over a `bg-border` parent rather than four bordered
 * cards. That produces true hairlines with no doubled edges at the seams,
 * and it collapses correctly at every breakpoint without a per-cell border
 * rule that has to know which column it is in.
 *
 * Server component. There is no state here at all, and the demo's numbers
 * are the defaults so the block renders identically in a preview, a
 * screenshot and someone's page before they replace them.
 */

export interface StatsBenchmarkBandMetric {
  label: string
  value: string
  /** One clause on what moved, or omit for a bare figure. */
  detail?: string
}

export interface StatsBenchmarkBandProps {
  eyebrow?: string
  heading?: string
  intro?: string
  metrics?: StatsBenchmarkBandMetric[]
  className?: string
}

const METRICS: StatsBenchmarkBandMetric[] = [
  { label: "Cold start", value: "112 ms", detail: "p50 over 10,000 invocations, Frankfurt, empty cache." },
  { label: "Query throughput", value: "24.6k/s", detail: "Single node, 4 vCPU, read-only workload." },
  { label: "Index rebuild", value: "38 s", detail: "One million rows, measured wall-clock end to end." },
  { label: "Memory ceiling", value: "512 MB", detail: "Peak RSS under the throughput run above." },
]

export function StatsBenchmarkBand({
  eyebrow = "Measured, not claimed",
  heading = "How fast it is, and how we know",
  intro = "Every number below names the conditions it was taken under. A benchmark without its method is a marketing figure wearing a lab coat.",
  metrics = METRICS,
  className,
}: StatsBenchmarkBandProps) {
  return (
    <section
      aria-labelledby="stats-benchmark-band-heading"
      className={`w-full bg-background px-6 py-16 sm:py-20 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h2
          id="stats-benchmark-band-heading"
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
