/**
 * <SecurityPostureBand> — The compliance and security facts a procurement reviewer asks for, stated as figures with their scope rather than as badges.
 *
 * Same shape as the benchmark band and a different job, which is worth
 * saying because the temptation is to make one component do both. This one
 * answers a procurement review, and the wrong answer it exists to replace
 * is a row of certification logos — those say an audit happened, not what
 * it covered, and "what does it cover" is the entire question a reviewer
 * has.
 *
 * So every tile's detail names a scope rather than a standard. "AES-256"
 * is not the answer; "AES-256, every store, including backups and the
 * search index" is, because the gap a reviewer is looking for is the store
 * somebody forgot. A tile whose detail cannot name a scope should be cut
 * rather than padded.
 *
 * Accessibility is the <dl> pairing, for the same reason as the benchmark
 * band: heard rather than seen, "Data regions, 4" is a fact and a bare "4"
 * is noise. Worth restating here because this block is the more likely of
 * the two to be edited down to bare figures by someone in a hurry, and the
 * <dt>/<dd> structure is what must survive that edit.
 *
 * The demo defaults to four filled tiles. Two would fit the grid and read
 * as an unfinished section; six wraps to a second row where the eye stops
 * treating them as one band.
 *
 * Server component — no state, no interactivity, nothing that needs a
 * browser.
 */

export interface SecurityPostureBandMetric {
  label: string
  value: string
  /** One clause on what moved, or omit for a bare figure. */
  detail?: string
}

export interface SecurityPostureBandProps {
  eyebrow?: string
  heading?: string
  intro?: string
  metrics?: SecurityPostureBandMetric[]
  className?: string
}

const METRICS: SecurityPostureBandMetric[] = [
  { label: "Encryption at rest", value: "AES-256", detail: "Every store, including backups and the search index." },
  { label: "Median patch time", value: "31 h", detail: "Critical CVEs, from advisory to production, trailing year." },
  { label: "Data regions", value: "4", detail: "EU, US, UK and AU. Pinned per workspace, never replicated out." },
  { label: "Access reviews", value: "Quarterly", detail: "All production access, logged and exportable." },
]

export function SecurityPostureBand({
  eyebrow = "Security",
  heading = "What a reviewer will ask, answered first",
  intro = "A wall of certification logos answers none of these. Each figure names its scope, because a control that covers one environment and not the other is the thing a reviewer is looking for.",
  metrics = METRICS,
  className,
}: SecurityPostureBandProps) {
  return (
    <section
      aria-labelledby="security-posture-band-heading"
      className={`w-full bg-background px-6 py-16 sm:py-20 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h2
          id="security-posture-band-heading"
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
