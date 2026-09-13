/**
 * <ContentDivider> — a rule with something in the middle of it.
 *
 * The "or" between a social sign-in row and an email form, the date
 * separator in a message thread, the "3 unread" marker in an inbox. It is
 * two rules and a label, and the hard part is that the label must sit ON
 * the line without a background colour matching the page — the trick of
 * putting `bg-background` behind the text breaks the moment the divider is
 * used on a card, a modal, or a tinted section.
 *
 * So the rules are flex children that grow, and the label sits between
 * them. No background, no negative margins, no assumption about what is
 * behind it.
 *
 * `role="separator"` with a label is the semantic that matches what a
 * sighted user sees. Without the label a divider is decorative and should
 * be `aria-hidden`; with one, the text is meaningful — "or", "Today",
 * "Unread from here" — and it is the only place that information appears.
 */

import * as React from 'react'

export interface ContentDividerProps {
  /** The text or node in the middle. Omit for a plain rule. */
  children?: React.ReactNode
  /** Where the label sits along the rule. */
  align?: 'center' | 'start' | 'end'
  orientation?: 'horizontal' | 'vertical'
  tone?: 'default' | 'strong' | 'accent'
  /** Dashed rule — for drop targets and "add here" affordances. */
  dashed?: boolean
  className?: string
}

export function ContentDivider({
  children,
  align = 'center',
  orientation = 'horizontal',
  tone = 'default',
  dashed = false,
  className = '',
}: ContentDividerProps) {
  const line = [
    'shrink-0',
    dashed ? 'border-dashed' : 'border-solid',
    tone === 'strong'
      ? 'border-foreground/25'
      : tone === 'accent'
        ? 'border-primary/40'
        : 'border-border',
  ].join(' ')

  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={`inline-flex h-full flex-col items-center ${className}`}
      >
        <span aria-hidden className={`${line} w-0 flex-1 border-s`} />
        {children ? (
          <span className="py-2 text-xs font-medium text-muted-foreground">{children}</span>
        ) : null}
        <span aria-hidden className={`${line} w-0 flex-1 border-s`} />
      </div>
    )
  }

  if (!children) {
    return (
      <hr
        // A bare rule carries no information a screen reader needs; the
        // heading structure around it is what conveys the break.
        aria-hidden
        className={`${line} border-0 border-t ${className}`}
      />
    )
  }

  return (
    <div
      role="separator"
      className={`flex w-full items-center gap-3 ${className}`}
    >
      {/*
        The rules are flex children, so the label needs no background to
        stand on. `flex-1` on both for centre; on one side only for a
        start- or end-aligned label — which is why this is logical
        (`start`/`end`) rather than left and right.
      */}
      <span
        aria-hidden
        className={`${line} border-0 border-t ${align === 'start' ? 'w-4' : 'flex-1'}`}
      />
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {children}
      </span>
      <span
        aria-hidden
        className={`${line} border-0 border-t ${align === 'end' ? 'w-4' : 'flex-1'}`}
      />
    </div>
  )
}
