/**
 * <StatusBadge> — a dot, a word, and the two things a colour cannot carry.
 *
 * Separate from `Badge` because it answers a different question. A badge
 * labels a thing ("Beta", "Pro", "3"); a status badge reports the state of
 * a thing right now, and that brings two requirements a badge does not
 * have:
 *
 *   1. It must not rely on colour alone. Roughly 1 in 12 men cannot
 *      separate the red state from the green one, so the dot is paired
 *      with a word, always — this component has no icon-only mode, by
 *      design, and that is the accessibility rule made structural.
 *   2. A live state has to be announced when it changes. `aria-live`
 *      belongs on the thing that persists across the change, so it is on
 *      the wrapper here and the text inside it is what gets replaced.
 *
 * The `pulse` ring is for states that are genuinely in motion — deploying,
 * syncing, recording — and it is animation-guarded, because a permanent
 * pulse behind text is exactly what `prefers-reduced-motion` exists for.
 */

import * as React from 'react'

export type Status =
  | 'online'
  | 'offline'
  | 'busy'
  | 'away'
  | 'pending'
  | 'success'
  | 'failed'
  | 'draft'

interface StatusStyle {
  dot: string
  text: string
  bg: string
  label: string
  /** Whether this state is one that is actively happening. */
  live?: boolean
}

const STATUSES: Record<Status, StatusStyle> = {
  online: { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-500/10', label: 'Online' },
  offline: { dot: 'bg-slate-400', text: 'text-muted-foreground', bg: 'bg-muted', label: 'Offline' },
  busy: { dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-500/10', label: 'Busy' },
  away: { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-500/10', label: 'Away' },
  pending: { dot: 'bg-sky-500', text: 'text-sky-700 dark:text-sky-400', bg: 'bg-sky-500/10', label: 'In progress', live: true },
  success: { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-500/10', label: 'Succeeded' },
  failed: { dot: 'bg-destructive', text: 'text-destructive', bg: 'bg-destructive/10', label: 'Failed' },
  draft: { dot: 'bg-slate-400', text: 'text-muted-foreground', bg: 'bg-muted', label: 'Draft' },
}

export interface StatusBadgeProps {
  status: Status
  /** Overrides the default word. The word itself is never optional. */
  label?: string
  /** Dot on a plain background instead of a filled pill. */
  subtle?: boolean
  /** Announce changes to assistive tech. For states that update in place. */
  live?: boolean
  className?: string
}

export function StatusBadge({
  status,
  label,
  subtle = false,
  live,
  className = '',
}: StatusBadgeProps) {
  const style = STATUSES[status]
  const text = label ?? style.label
  const announce = live ?? style.live === true

  return (
    <span
      // On the wrapper, which survives the state change — a live region
      // that is itself replaced announces nothing.
      aria-live={announce ? 'polite' : undefined}
      className={[
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full',
        'text-xs font-medium leading-none',
        subtle ? 'px-0' : `px-2 py-1 ${style.bg}`,
        style.text,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {style.live ? (
          <span
            aria-hidden
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none ${style.dot}`}
          />
        ) : null}
        <span aria-hidden className={`relative inline-flex h-2 w-2 rounded-full ${style.dot}`} />
      </span>
      {text}
    </span>
  )
}
