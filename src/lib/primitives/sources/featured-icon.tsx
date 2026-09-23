/**
 * <FeaturedIcon> — an icon in a container, which is a different thing.
 *
 * This is the single most repeated element in a marketing or empty-state
 * design and nobody ships it: a glyph, centred in a shaped and tinted box,
 * at one of a few sizes. Every feature grid, every empty state, every
 * "what's included" row is a stack of these, and each project rebuilds the
 * ring-and-tint arithmetic by hand.
 *
 * The variants are the ones that actually recur:
 *
 *   soft     tinted background, coloured glyph. The default.
 *   solid    filled with the tone, glyph knocked out.
 *   outline  border only, for dense layouts where a filled square is loud.
 *   ring     soft, with two concentric translucent rings — the "halo"
 *            treatment used in empty states, where the icon carries a
 *            whole screen and needs the extra presence.
 *
 * It is decoration, and it is marked as such. A featured icon sits next to
 * a heading that says the same thing, so announcing it is a duplicate. Pass
 * `label` on the rare occasion it is the only content — then it becomes an
 * `img` role with a name instead of being hidden.
 */

import * as React from 'react'

export type IconTone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger'
export type IconVariant = 'soft' | 'solid' | 'outline' | 'ring'

const TONES: Record<IconTone, { soft: string; solid: string; outline: string; halo: string }> = {
  brand: {
    soft: 'bg-primary/10 text-primary',
    solid: 'bg-primary text-primary-foreground',
    outline: 'border border-primary/30 text-primary',
    halo: 'ring-primary/10',
  },
  neutral: {
    soft: 'bg-muted text-muted-foreground',
    solid: 'bg-foreground text-background',
    outline: 'border border-border text-muted-foreground',
    halo: 'ring-foreground/5',
  },
  success: {
    soft: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    solid: 'bg-emerald-600 text-white',
    outline: 'border border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
    halo: 'ring-emerald-500/10',
  },
  warning: {
    soft: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    solid: 'bg-amber-500 text-amber-950',
    outline: 'border border-amber-500/30 text-amber-600 dark:text-amber-400',
    halo: 'ring-amber-500/10',
  },
  danger: {
    soft: 'bg-destructive/10 text-destructive',
    solid: 'bg-destructive text-destructive-foreground',
    outline: 'border border-destructive/30 text-destructive',
    halo: 'ring-destructive/10',
  },
}

const SIZES = {
  sm: 'h-8 w-8 rounded-lg [&>svg]:h-4 [&>svg]:w-4',
  md: 'h-10 w-10 rounded-xl [&>svg]:h-5 [&>svg]:w-5',
  lg: 'h-12 w-12 rounded-xl [&>svg]:h-6 [&>svg]:w-6',
  xl: 'h-14 w-14 rounded-2xl [&>svg]:h-7 [&>svg]:w-7',
} as const

export interface FeaturedIconProps {
  /** The glyph. Sized by the container, so pass it without size classes. */
  children: React.ReactNode
  tone?: IconTone
  variant?: IconVariant
  size?: keyof typeof SIZES
  /** Circle instead of the rounded square. */
  circle?: boolean
  /** Only when the icon is the sole content. Otherwise it stays decorative. */
  label?: string
  className?: string
}

export function FeaturedIcon({
  children,
  tone = 'brand',
  variant = 'soft',
  size = 'md',
  circle = false,
  label,
  className = '',
}: FeaturedIconProps) {
  const palette = TONES[tone]

  const surface =
    variant === 'solid'
      ? palette.solid
      : variant === 'outline'
        ? palette.outline
        : palette.soft

  return (
    <span
      // Hidden by default: it sits beside a heading that already says this.
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={[
        'inline-flex shrink-0 items-center justify-center',
        SIZES[size],
        circle ? 'rounded-full' : '',
        surface,
        // The halo is two rings rather than one wide one, so the falloff
        // reads as a glow instead of a second border.
        variant === 'ring' ? `ring-[6px] ${palette.halo}` : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  )
}
