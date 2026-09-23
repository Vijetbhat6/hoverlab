import { CheckCircle2, CircleSlash, HelpCircle, TriangleAlert, XCircle } from 'lucide-react'

import type { StoredOutcome } from '@/lib/stress/report'

/**
 * A verdict, in words and an icon as well as a colour.
 *
 * Pass and fail must not be told apart by hue alone: this page is evidence
 * about accessibility and would be a poor advertisement if a colour-blind
 * reader could not read its own results.
 */

const VARIANTS = {
  1: { label: 'Pass', Icon: CheckCircle2, className: 'border-emerald-600/30 bg-emerald-600/10 text-emerald-800 dark:text-emerald-300' },
  0: { label: 'Fail', Icon: XCircle, className: 'border-red-600/30 bg-red-600/10 text-red-800 dark:text-red-300' },
  2: { label: 'Not applicable', Icon: CircleSlash, className: 'border-border bg-muted/50 text-muted-foreground' },
  3: { label: 'Could not measure', Icon: TriangleAlert, className: 'border-amber-600/30 bg-amber-600/10 text-amber-900 dark:text-amber-300' },
} as const

export function OutcomeChip({ outcome }: { outcome: StoredOutcome | undefined }) {
  if (outcome === undefined) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
        <HelpCircle aria-hidden className="h-3.5 w-3.5" />
        Not run
      </span>
    )
  }
  const { label, Icon, className } = VARIANTS[outcome]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}>
      <Icon aria-hidden className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}
