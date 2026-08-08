/**
 * <UsageMeterPanel> — quota consumption against plan limits.
 *
 * The panel a user opens when they want to know whether they are about to
 * be charged, so it is built to answer that first.
 *
 *  - Bars change tone as they approach the limit, and the threshold is
 *    stated ("80% of your limit"), not just implied by turning amber.
 *  - Unlimited quotas render as a dash rather than a full bar. A metered
 *    bar for something with no ceiling is actively misleading.
 *  - Overage is drawn past the 100% mark in the destructive tone rather
 *    than clamped, because a bar pinned at full hides how far over you are.
 *
 * `<progress>` would be the semantic element, but it cannot be styled
 * consistently across engines. The `role="progressbar"` div with explicit
 * `aria-valuenow`/`min`/`max` carries the same information.
 *
 * Server component.
 */

import * as React from 'react'
import { TriangleAlert, Infinity as InfinityIcon } from 'lucide-react'

export interface Quota {
  label: string
  used: number
  /** `null` for an unmetered allowance. */
  limit: number | null
  unit?: string
  /** Formats both the used and limit figures. */
  format?: (value: number) => string
}

export interface UsageMeterPanelProps {
  quotas?: Quota[]
  heading?: string
  periodEnds?: string
  /** Fraction above which a quota is flagged as running out. */
  warnAt?: number
  upgradeHref?: string
  className?: string
}

const DEFAULT_QUOTAS: Quota[] = [
  { label: 'API requests', used: 842_000, limit: 1_000_000 },
  { label: 'Team seats', used: 8, limit: 10 },
  { label: 'Storage', used: 47, limit: 50, unit: 'GB' },
  { label: 'Bandwidth', used: 128, limit: 100, unit: 'GB' },
  { label: 'Projects', used: 23, limit: null },
]

export function UsageMeterPanel({
  quotas = DEFAULT_QUOTAS,
  heading = 'Usage this period',
  periodEnds = 'Resets 1 September',
  warnAt = 0.8,
  upgradeHref,
  className = '',
}: UsageMeterPanelProps) {
  const anyOver = quotas.some((q) => q.limit !== null && q.used > q.limit)

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur ${className}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border/60 px-6 py-4">
        <div>
          <h2 className="font-semibold tracking-tight">{heading}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{periodEnds}</p>
        </div>

        {upgradeHref ? (
          <a
            href={upgradeHref}
            className="rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Upgrade plan
          </a>
        ) : null}
      </div>

      {anyOver ? (
        <p className="flex items-start gap-2 border-b border-border/60 bg-destructive/5 px-6 py-3 text-sm text-destructive">
          <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          You are over the limit on at least one quota. Overage is billed at the
          end of the period.
        </p>
      ) : null}

      <ul className="divide-y divide-border/40">
        {quotas.map((quota) => {
          const format = quota.format ?? ((v: number) => v.toLocaleString('en-US'))
          const unlimited = quota.limit === null
          const fraction = unlimited ? 0 : quota.used / quota.limit!
          const over = !unlimited && quota.used > quota.limit!
          const warning = !unlimited && !over && fraction >= warnAt

          const tone = over
            ? 'bg-destructive'
            : warning
              ? 'bg-amber-500'
              : 'bg-primary'

          return (
            <li key={quota.label} className="px-6 py-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium">{quota.label}</span>

                <span className="text-sm tabular-nums text-muted-foreground">
                  {format(quota.used)}
                  {quota.unit ? ` ${quota.unit}` : ''}
                  {unlimited ? (
                    <span className="ml-1 inline-flex items-center gap-1 text-xs">
                      <span aria-hidden>/</span>
                      <InfinityIcon aria-hidden className="h-3.5 w-3.5" />
                      <span className="sr-only">of unlimited</span>
                    </span>
                  ) : (
                    <>
                      {' / '}
                      {format(quota.limit!)}
                      {quota.unit ? ` ${quota.unit}` : ''}
                    </>
                  )}
                </span>
              </div>

              {unlimited ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  No limit on this plan
                </p>
              ) : (
                <>
                  <div
                    role="progressbar"
                    aria-valuenow={Math.round(fraction * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${quota.label} usage`}
                    className="relative mt-2 h-2 overflow-hidden rounded-full bg-muted"
                  >
                    <span
                      className={`block h-full rounded-full transition-all ${tone}`}
                      style={{ width: `${Math.min(100, fraction * 100)}%` }}
                    />
                  </div>

                  <p
                    className={`mt-1.5 text-xs ${
                      over
                        ? 'font-medium text-destructive'
                        : warning
                          ? 'font-medium text-amber-600 dark:text-amber-400'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {over
                      ? `${format(quota.used - quota.limit!)}${quota.unit ? ` ${quota.unit}` : ''} over your limit`
                      : warning
                        ? `${Math.round(fraction * 100)}% of your limit used`
                        : `${Math.round(fraction * 100)}% used`}
                  </p>
                </>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
