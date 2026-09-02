/**
 * <ConfidenceRecommendation> — a suggestion the agent is offering, with an
 * honest confidence reading and the alternatives it rejected.
 *
 * Confidence meters are usually theatre. This one is built so it can carry
 * real information:
 *
 *  - The number is expressed as a `<meter>`, the element that exists for
 *    "a measurement within a known range". It exposes value, min and max to
 *    assistive tech natively, and `low`/`high`/`optimum` let the browser
 *    class the reading — which is genuinely the semantic here, unlike
 *    `<progress>`, which means "how far through a task".
 *  - The percentage is never the only signal. A band label ("moderate") and
 *    a plain-English caveat sit beside it, because 71% means nothing without
 *    knowing 71% of what.
 *  - The rejected alternatives are shown, not hidden behind a toggle. What
 *    the agent *didn't* pick, and why, is the fastest way for a human to
 *    catch a bad recommendation, and burying it is how automation bias sets
 *    in.
 *  - Accept is not styled as the only path. Dismiss and Edit are the same
 *    visual weight, so the card reads as a proposal rather than a prompt to
 *    click the blue thing.
 */

'use client'

import * as React from 'react'
import { Check, ChevronRight, Info, Lightbulb, PenLine, X } from 'lucide-react'

export interface RecommendationAlternative {
  id: string
  label: string
  why: string
}

export interface ConfidenceRecommendationProps {
  eyebrow?: string
  headline?: string
  body?: string
  /** 0–100. */
  confidence?: number
  /** What the score is based on, in plain language. */
  basis?: string
  alternatives?: RecommendationAlternative[]
  className?: string
}

const DEFAULT_ALTERNATIVES: RecommendationAlternative[] = [
  {
    id: 'wait',
    label: 'Wait for the October close',
    why: 'Safer, but the reorder lead time is 3 weeks — you would stock out first',
  },
  {
    id: 'half',
    label: 'Order half now, half in November',
    why: 'Loses the volume break; unit cost rises about 9%',
  },
]

/**
 * `<meter>` restyled without losing its semantics.
 *
 * Left alone a meter renders in the platform's own olive-and-yellow, which
 * is jarring in any themed UI and is why most teams give up and use a div
 * with no semantics at all. Keeping the element is worth this much CSS: the
 * browser still classifies the value against `low`/`high`/`optimum` and
 * decides *which* pseudo-element applies, so the colour goes on meaning what
 * it meant. Only the paint changes.
 *
 * Why a `<style>` block rather than Tailwind utilities — this cost an hour,
 * so it is written down:
 *
 *  - Chromium gates `::-webkit-meter-*` on the *prefixed*
 *    `-webkit-appearance: none`. Tailwind's `appearance-none` emits only the
 *    unprefixed property, so every rule is dropped silently.
 *  - Worse, an arbitrary variant like `[&::-webkit-meter-bar]:bg-muted`
 *    cannot work at all. Tailwind nests it as `&::-webkit-meter-bar`, which
 *    desugars to `:is(.cls)::-webkit-meter-bar`, and Chromium rejects a UA
 *    shadow pseudo-element sitting behind `:is()`. The selector has to be
 *    flat, which no utility class can produce.
 *
 * Firefox exposes one `::-moz-meter-bar` and colours it by the same
 * classification, so it needs no per-band rule.
 */
const METER_CSS = `
  .hl-meter { -webkit-appearance: none; appearance: none; background: none; }
  .hl-meter::-webkit-meter-bar {
    background: var(--muted); border: none; border-radius: 9999px;
  }
  .hl-meter::-webkit-meter-optimum-value {
    background: var(--color-emerald-500, #10b981); border-radius: 9999px;
  }
  .hl-meter::-webkit-meter-suboptimum-value {
    background: var(--color-amber-500, #f59e0b); border-radius: 9999px;
  }
  .hl-meter::-webkit-meter-even-less-good-value {
    background: var(--color-rose-500, #f43f5e); border-radius: 9999px;
  }
  .hl-meter::-moz-meter-bar { border-radius: 9999px; }
`

/** Bands, so the number is never the only thing said about it. */
function band(value: number) {
  if (value >= 85) return { label: 'High confidence', tone: 'text-emerald-600 dark:text-emerald-400' }
  if (value >= 60) return { label: 'Moderate confidence', tone: 'text-amber-600 dark:text-amber-400' }
  return { label: 'Low confidence', tone: 'text-rose-600 dark:text-rose-400' }
}

export function ConfidenceRecommendation({
  eyebrow = 'Suggested action',
  headline = 'Reorder 1,400 units of the winter blend now',
  body = 'Demand is tracking 22% above last October and your supplier holds a volume break at 1,200 units. Ordering today lands stock four days before the forecast stockout.',
  confidence = 71,
  basis = 'Based on 3 seasons of sales history. The forecast has not seen a promotion like the one running this month, which is why this is not higher.',
  alternatives = DEFAULT_ALTERNATIVES,
  className = '',
}: ConfidenceRecommendationProps) {
  const [decision, setDecision] = React.useState<'accepted' | 'dismissed' | null>(null)
  const { label, tone } = band(confidence)

  return (
    <section
      className={`mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-border/60 bg-card ${className}`}
    >
      <style>{METER_CSS}</style>

      <div className="space-y-4 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Lightbulb aria-hidden className="h-4 w-4" />
          </span>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {eyebrow}
            </p>
            <h3 className="mt-0.5 text-base font-semibold leading-snug">{headline}</h3>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>

        {/* -- Confidence ------------------------------------------------ */}
        <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className={`text-sm font-semibold ${tone}`}>{label}</span>
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {confidence}%
            </span>
          </div>

          {/*
            `<meter>`, not a styled div. The value, bounds and the fact that
            this is a measurement are all exposed without a line of ARIA —
            and the bands below let a browser render it as good/average/poor
            on its own.
          */}
          <meter
            value={confidence}
            min={0}
            max={100}
            low={60}
            high={85}
            optimum={100}
            aria-label="Model confidence"
            className="hl-meter mt-2 h-1.5 w-full"
          >
            {confidence}%
          </meter>

          <p className="mt-2.5 flex gap-2 text-xs leading-relaxed text-muted-foreground">
            <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {basis}
          </p>
        </div>

        {/* -- What it rejected ----------------------------------------- */}
        {alternatives.length > 0 ? (
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Considered and rejected
            </h4>
            <ul className="space-y-1.5">
              {alternatives.map((alt) => (
                <li key={alt.id} className="flex gap-2 text-xs leading-relaxed">
                  <ChevronRight
                    aria-hidden
                    className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground"
                  />
                  <span>
                    <span className="font-medium">{alt.label}</span>
                    <span className="text-muted-foreground"> — {alt.why}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {/* -- Actions, all three at equal weight ------------------------- */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border/60 bg-muted/30 px-5 py-3">
        {decision ? (
          <p role="status" className="flex items-center gap-2 text-sm">
            {decision === 'accepted' ? (
              <>
                <Check aria-hidden className="h-4 w-4 text-emerald-500" />
                Order queued for your approval in Purchasing.
              </>
            ) : (
              <>
                <X aria-hidden className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Dismissed. I will not raise this again this week.
                </span>
              </>
            )}
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setDecision('dismissed')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden className="h-4 w-4" />
              Dismiss
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <PenLine aria-hidden className="h-4 w-4" />
              Edit quantity
            </button>

            <button
              type="button"
              onClick={() => setDecision('accepted')}
              className="ms-auto inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3.5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Check aria-hidden className="h-4 w-4" />
              Accept
            </button>
          </>
        )}
      </div>
    </section>
  )
}
