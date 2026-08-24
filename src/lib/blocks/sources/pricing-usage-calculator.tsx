'use client'

/**
 * <PricingUsageCalculator> — a slider that answers "what will this cost me".
 *
 * Usage pricing has a specific failure: the page states a rate, the visitor
 * has to do arithmetic to find their own number, and most of them do not —
 * they guess high and leave. Neither <PricingTiers> nor <ComparisonTable>
 * helps, because both assume the price is a property of the plan rather
 * than of the buyer.
 *
 * So the interaction is the product here. Move the slider, read your bill.
 *
 * Tiered rather than flat, because that is how these are actually sold and
 * a flat rate needs no calculator at all — the whole reason someone cannot
 * work it out in their head is that the marginal price changes. The
 * breakdown under the total shows each tier's contribution, so the number
 * is checkable rather than asserted; a total a buyer cannot reproduce is a
 * total they do not trust.
 *
 * A native <input type="range"> rather than a drawn track. It arrives with
 * keyboard support, a real focus ring, arrow and Home/End handling, and the
 * platform's own touch target, all of which a div with a pointer listener
 * has to reimplement and usually gets wrong for the keyboard. The visible
 * total is tied to it with `aria-describedby`, so the value and its
 * consequence are announced together rather than as an orphaned number.
 *
 * Steps are indices into a fixed scale, not raw units. A linear slider from
 * 1k to 10M spends most of its travel in a range nobody picks; the scale
 * gives every stop a usable resolution.
 */

import * as React from 'react'

export interface UsageTier {
  /** Units up to this bound priced at `pricePerUnitCents`. Infinity for the last. */
  upTo: number
  pricePerUnitCents: number
}

export interface PricingUsageCalculatorProps {
  heading?: string
  subheading?: string
  /** Selectable volumes, ascending. The slider steps between them. */
  scale?: number[]
  tiers?: UsageTier[]
  unitLabel?: string
  /** Charged before any usage. */
  baseCents?: number
  baseLabel?: string
  ctaLabel?: string
  ctaHref?: string
  className?: string
}

const DEFAULT_SCALE = [
  1_000, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000,
]

const DEFAULT_TIERS: UsageTier[] = [
  { upTo: 10_000, pricePerUnitCents: 0 },
  { upTo: 100_000, pricePerUnitCents: 0.05 },
  { upTo: Infinity, pricePerUnitCents: 0.02 },
]

const money = (cents: number) =>
  (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

const compact = (n: number) =>
  n.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 })

/**
 * A unit rate, quoted at a scale where it is a legible number.
 *
 * Metered pricing is routinely fractions of a cent per unit, and running
 * that through `money()` rounds it to $0.00 — a breakdown row reading
 * "100K-inf at $0.00" beside a charge of $180 discredits the total it was
 * added to explain. So a sub-cent rate is quoted per thousand, which is how
 * these are sold anyway, and only a rate that survives cent precision is
 * shown per unit.
 */
const rate = (centsPerUnit: number) =>
  centsPerUnit >= 1
    ? `${money(centsPerUnit)} each`
    : `${money(centsPerUnit * 1000)} per 1K`

/** Per-tier contribution for a volume, in the order the tiers were given. */
function breakdown(units: number, tiers: UsageTier[]) {
  const rows: { label: string; units: number; cents: number }[] = []
  let floor = 0
  for (const tier of tiers) {
    if (units <= floor) break
    const inTier = Math.min(units, tier.upTo) - floor
    rows.push({
      label:
        tier.pricePerUnitCents === 0
          ? `First ${compact(tier.upTo)} free`
          : `${compact(floor)}–${tier.upTo === Infinity ? '∞' : compact(tier.upTo)} at ${rate(tier.pricePerUnitCents)}`,
      units: inTier,
      cents: inTier * tier.pricePerUnitCents,
    })
    floor = tier.upTo
  }
  return rows
}

export function PricingUsageCalculator({
  heading = 'What it costs at your volume',
  subheading = 'Move the slider. The first 10,000 are free every month.',
  scale = DEFAULT_SCALE,
  tiers = DEFAULT_TIERS,
  unitLabel = 'requests / month',
  baseCents = 0,
  baseLabel = 'Platform fee',
  ctaLabel = 'Start free',
  ctaHref = '/signup',
  className = '',
}: PricingUsageCalculatorProps) {
  // The slider's value is the index. Two steps of the same width can be an
  // order of magnitude apart in units, which is the point.
  const [index, setIndex] = React.useState(() => Math.min(2, scale.length - 1))
  const units = scale[index] ?? scale[0]

  const rows = React.useMemo(() => breakdown(units, tiers), [units, tiers])
  const usageCents = rows.reduce((sum, r) => sum + r.cents, 0)
  const totalCents = usageCents + baseCents

  return (
    <section
      className={`mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24 ${className}`}
    >
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {heading}
        </h2>
        {subheading ? (
          <p className="mt-3 text-muted-foreground">{subheading}</p>
        ) : null}
      </div>

      <div className="rounded-3xl border border-border/60 bg-card/60 p-6 sm:p-8">
        <label
          htmlFor="usage-volume"
          className="flex flex-wrap items-baseline justify-between gap-2"
        >
          <span className="text-sm font-medium text-muted-foreground">
            Monthly volume
          </span>
          <span className="text-2xl font-bold tabular-nums">
            {units.toLocaleString('en-US')}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              {unitLabel}
            </span>
          </span>
        </label>

        <input
          id="usage-volume"
          type="range"
          min={0}
          max={scale.length - 1}
          step={1}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          aria-describedby="usage-total"
          // The thumb and track come from the platform; `accent-color` is
          // what tints them without replacing the control.
          className="mt-4 w-full accent-primary"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{compact(scale[0])}</span>
          <span>{compact(scale[scale.length - 1])}</span>
        </div>

        <dl className="mt-8 space-y-2 border-t border-border/60 pt-6 text-sm">
          {baseCents > 0 ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{baseLabel}</dt>
              <dd className="tabular-nums">{money(baseCents)}</dd>
            </div>
          ) : null}
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd className="tabular-nums">
                {r.cents === 0 ? '—' : money(r.cents)}
              </dd>
            </div>
          ))}
        </dl>

        <div
          id="usage-total"
          className="mt-6 flex items-baseline justify-between gap-4 border-t border-border/60 pt-6"
        >
          <span className="font-semibold">Estimated monthly total</span>
          <span className="text-3xl font-extrabold tracking-tight tabular-nums">
            {money(totalCents)}
          </span>
        </div>

        <a
          href={ctaHref}
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {ctaLabel}
        </a>
      </div>
    </section>
  )
}
