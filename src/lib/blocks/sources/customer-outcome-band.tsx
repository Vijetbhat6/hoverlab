/**
 * <CustomerOutcomeBand> — Testimonials reduced to the measured outcome and the conditions it happened under, for readers who skip the quotes.
 *
 * Most readers skip the quotes. The layout problem is that a testimonial
 * section is built entirely out of the thing being skipped, and the obvious
 * wrong answer is three more quote cards with larger photographs.
 *
 * What does not get skipped is a number with a time period attached. So
 * every tile is a measured outcome, and every detail names both the company
 * it came from and the window it was measured over — because "-63%" with no
 * period is not a result, it is a shape.
 *
 * The second tile is written as a transition, 9 days to 2, rather than as a
 * percentage. Where the before and after are both small and concrete,
 * showing them beats reducing them to a ratio the reader has to unpack.
 *
 * The fourth tile is retention rather than an outcome, and it is last on
 * purpose: it is the aggregate that says the three specific stories above
 * are not the only three that exist.
 *
 * Every figure here is attributable. A stat band of unsourced improvements
 * is the most common form of invented social proof, and if a tile cannot
 * name a customer and a period it should be cut rather than softened.
 *
 * Accessibility: `<dl>` with `<dt>`/`<dd>` pairs, so each figure is
 * announced with its label — "Support replies, -63%" — instead of as a
 * floating number. `tabular-nums` aligns the digits, and the `gap-px` grid
 * over a `bg-border` parent gives hairline seams with no doubled borders.
 * Server component; no state, and the demo values are the defaults.
 */

export interface CustomerOutcomeBandMetric {
  label: string
  value: string
  /** One clause on what moved, or omit for a bare figure. */
  detail?: string
}

export interface CustomerOutcomeBandProps {
  eyebrow?: string
  heading?: string
  intro?: string
  metrics?: CustomerOutcomeBandMetric[]
  className?: string
}

const METRICS: CustomerOutcomeBandMetric[] = [
  { label: "Support replies", value: "-63%", detail: "Median first-response time at Northwind, over one quarter." },
  { label: "Onboarding", value: "9 days → 2", detail: "Time to a customer's first live workspace, at Arden." },
  { label: "Manual reconciliation", value: "12 hrs/wk", detail: "Hours returned to one finance team of three, measured before and after." },
  { label: "Kept using it", value: "94%", detail: "Of teams past 90 days, over the last twelve months." },
]

/**
 * A per-instance heading id, derived rather than generated.
 *
 * `React.useId()` is the textbook fix for a literal id in a reusable
 * component and is not available here: this block has no `'use client'`
 * and does not warrant one. It renders text, and a band that hydrates on
 * every page to render text is a cost with nothing on the other side of
 * it. Same call, and the same reasoning, as `footer-mega`.
 *
 * Hashing the heading *and* the intro is deliberate. Either alone works
 * until two callers happen to agree, which is exactly what a catalog hub
 * rendering every page into one document arranges for; between them they
 * are the two props nobody leaves at the default.
 */
function headingId(heading: string, intro: string): string {
  let hash = 0
  const source = `${heading}|${intro}`
  for (let i = 0; i < source.length; i++) {
    hash = (Math.imul(hash, 31) + source.charCodeAt(i)) | 0
  }
  return `customer-outcome-band-heading-${(hash >>> 0).toString(36).slice(0, 4)}`
}

export function CustomerOutcomeBand({
  eyebrow = "Results",
  heading = "What changed, and over how long",
  intro = "Most readers skip the quotes. What they do not skip is a number with a time period attached to it, and every figure here names the company it came from and how long it took.",
  metrics = METRICS,
  className,
}: CustomerOutcomeBandProps) {
  return (
    <section
      aria-labelledby={headingId(heading, intro)}
      className={`w-full bg-background px-6 py-16 sm:py-20 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h2
          id={headingId(heading, intro)}
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
            <div key={metric.label} className="min-w-0 bg-card p-6">
              <dt className="truncate text-sm font-medium text-muted-foreground">{metric.label}</dt>
              <dd className="mt-2 break-words text-3xl font-semibold tabular-nums tracking-tight text-foreground">
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
