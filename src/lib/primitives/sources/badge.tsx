/**
 * <Badge> — a small piece of labelled text.
 *
 * Six tones and three shapes, and the only interesting decision is that
 * tone is separate from shape. Most badge components fuse the two —
 * `variant="destructive"` implying both a red colour and a solid fill — and
 * then a design needs a red outline badge and there is no way to ask for
 * one.
 *
 * The tones are semantic rather than colours: `success`, not `green`. A
 * badge named after its colour is renamed the first time the palette
 * changes, and every call site has to be found.
 */

import * as React from 'react'

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'
export type BadgeShape = 'solid' | 'soft' | 'outline'

const TONES: Record<BadgeTone, Record<BadgeShape, string>> = {
  neutral: {
    solid: 'bg-foreground text-background',
    soft: 'bg-muted text-muted-foreground',
    outline: 'border border-border text-muted-foreground',
  },
  brand: {
    solid: 'bg-primary text-primary-foreground',
    soft: 'bg-primary/10 text-primary',
    outline: 'border border-primary/40 text-primary',
  },
  success: {
    solid: 'bg-emerald-600 text-white',
    soft: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    outline: 'border border-emerald-500/40 text-emerald-700 dark:text-emerald-400',
  },
  warning: {
    solid: 'bg-amber-500 text-amber-950',
    soft: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    outline: 'border border-amber-500/40 text-amber-700 dark:text-amber-400',
  },
  danger: {
    solid: 'bg-destructive text-destructive-foreground',
    soft: 'bg-destructive/10 text-destructive',
    outline: 'border border-destructive/40 text-destructive',
  },
  info: {
    solid: 'bg-sky-600 text-white',
    soft: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
    outline: 'border border-sky-500/40 text-sky-700 dark:text-sky-400',
  },
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  shape?: BadgeShape
  size?: 'sm' | 'md'
  icon?: React.ReactNode
  /** Pill rather than rounded rectangle. Use for counts and statuses. */
  pill?: boolean
}

export function Badge({
  tone = 'neutral',
  shape = 'soft',
  size = 'md',
  pill = false,
  icon,
  className = '',
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex shrink-0 items-center gap-1 font-medium leading-none',
        'whitespace-nowrap',
        pill ? 'rounded-full' : 'rounded-md',
        size === 'sm' ? 'h-5 px-1.5 text-[11px]' : 'h-6 px-2 text-xs',
        TONES[tone][shape],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {icon}
      {children}
    </span>
  )
}
