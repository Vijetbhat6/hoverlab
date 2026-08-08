/**
 * <EmptyState> — the "nothing here yet" panel.
 *
 * The distinction that matters: an empty list because you have not created
 * anything is a different screen from an empty list because your filters
 * excluded everything. The first wants an onboarding pitch and a create
 * button; the second wants "clear filters" and nothing else. Pass
 * `variant="filtered"` for the second — offering "Create your first
 * project" to someone who has forty projects and a bad filter is the
 * classic version of this bug.
 *
 * The illustration is inline SVG built from the same design tokens, so it
 * themes with the page instead of being a light-mode PNG on a dark card.
 */

import * as React from 'react'
import { Plus, FilterX, BookOpen } from 'lucide-react'

export interface EmptyStateProps {
  variant?: 'empty' | 'filtered'
  title?: string
  description?: string
  primaryLabel?: string
  secondaryLabel?: string
  onPrimary?: () => void
  onSecondary?: () => void
  className?: string
}

export function EmptyState({
  variant = 'empty',
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  className = '',
}: EmptyStateProps) {
  const filtered = variant === 'filtered'

  const resolvedTitle =
    title ?? (filtered ? 'No results match those filters' : 'No projects yet')

  const resolvedDescription =
    description ??
    (filtered
      ? 'Try widening the date range or removing a filter. Nothing has been deleted.'
      : 'Projects hold your work and your team’s. Create one to get started — it takes about ten seconds.')

  const resolvedPrimary = primaryLabel ?? (filtered ? 'Clear filters' : 'New project')
  const resolvedSecondary = secondaryLabel ?? (filtered ? undefined : 'Read the guide')

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 px-6 py-14 text-center ${className}`}
    >
      <EmptyIllustration filtered={filtered} />

      <h2 className="mt-6 text-lg font-bold tracking-tight">{resolvedTitle}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        {resolvedDescription}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onPrimary}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {filtered ? (
            <FilterX aria-hidden className="h-4 w-4" />
          ) : (
            <Plus aria-hidden className="h-4 w-4" />
          )}
          {resolvedPrimary}
        </button>

        {resolvedSecondary ? (
          <button
            type="button"
            onClick={onSecondary}
            className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <BookOpen aria-hidden className="h-4 w-4" />
            {resolvedSecondary}
          </button>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Inline SVG rather than an image file: it inherits `currentColor`, so it
 * is correct in both themes and needs no second asset, no request and no
 * space reserved against layout shift.
 */
function EmptyIllustration({ filtered }: { filtered: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 90"
      className="h-24 w-32 text-muted-foreground/30"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="18" y="14" width="84" height="62" rx="8" />
      <path d="M18 32h84" />
      <circle cx="28" cy="23" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="37" cy="23" r="2.5" fill="currentColor" stroke="none" />

      {filtered ? (
        <>
          <path d="M46 46h28l-11 12v10l-6-3V58z" className="text-muted-foreground/50" />
          <path d="M78 44l14 14M92 44l-14 14" className="text-destructive/40" />
        </>
      ) : (
        <>
          <path d="M34 46h30M34 56h44M34 66h22" className="text-muted-foreground/40" />
          <circle cx="86" cy="60" r="12" className="text-primary/40" />
          <path d="M86 54v12M80 60h12" className="text-primary/50" />
        </>
      )}
    </svg>
  )
}
