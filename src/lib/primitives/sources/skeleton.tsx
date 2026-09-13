/**
 * <Skeleton> — the placeholder, and the two rules that make it work.
 *
 * Rule one: a skeleton must match the shape of what replaces it. A grey
 * rectangle where a three-line paragraph will land means the page jumps
 * when the data arrives, which is worse than a spinner — the spinner at
 * least did not lie about the layout. So this ships shapes (`text`,
 * `avatar`, `card`, `button`) rather than one box, and `lines` makes the
 * last line short, the way a real paragraph ends.
 *
 * Rule two: it is invisible to assistive technology. A screen reader user
 * does not benefit from being told there are six grey rectangles; they
 * benefit from the container saying "loading" once. So every skeleton is
 * `aria-hidden`, and `<SkeletonGroup>` is the live region that speaks.
 *
 * The animation is Tailwind's own `animate-pulse` rather than a sweeping
 * gradient, and that is a deliberate trade. A sweep looks better and needs
 * a `@keyframes` block in the consumer's stylesheet — so the component
 * would paste in, render a static grey box, and give no hint why. A
 * primitive whose appearance depends on config the buyer does not have is
 * worse than a plainer one that always works.
 *
 * Either way it stops under `prefers-reduced-motion`: an animation that
 * never ends is the exact case that setting exists for, and a flat tinted
 * block is still a perfectly good skeleton.
 */

import * as React from 'react'

type Shape = 'text' | 'avatar' | 'card' | 'button' | 'thumbnail'

export interface SkeletonProps {
  shape?: Shape
  /** For `shape="text"`: how many lines. The last one is shortened. */
  lines?: number
  /** Tailwind width class, when the default for the shape is wrong. */
  width?: string
  /** Tailwind height class, same. */
  height?: string
  className?: string
}

const BASE = 'bg-muted/70 animate-pulse motion-reduce:animate-none'

const SHAPES: Record<Shape, string> = {
  text: 'h-3.5 rounded',
  avatar: 'h-10 w-10 rounded-full',
  card: 'h-32 w-full rounded-xl',
  button: 'h-9 w-24 rounded-lg',
  thumbnail: 'h-16 w-16 rounded-lg',
}

export function Skeleton({
  shape = 'text',
  lines = 1,
  width,
  height,
  className = '',
}: SkeletonProps) {
  if (shape === 'text' && lines > 1) {
    return (
      <div aria-hidden className={`flex flex-col gap-2 ${className}`}>
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={[
              BASE,
              SHAPES.text,
              // The last line of a paragraph is never full width, and a
              // stack of identical bars is the tell that this is a
              // placeholder rather than a preview of the shape.
              i === lines - 1 ? 'w-3/5' : 'w-full',
            ].join(' ')}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      aria-hidden
      className={[BASE, SHAPES[shape], width ?? '', height ?? '', className]
        .filter(Boolean)
        .join(' ')}
    />
  )
}

export interface SkeletonGroupProps {
  /** True while loading. When false, renders `children` instead. */
  loading: boolean
  /** What a screen reader is told once, in place of the shapes. */
  label?: string
  skeleton: React.ReactNode
  children?: React.ReactNode
  className?: string
}

/**
 * The wrapper that speaks.
 *
 * `aria-busy` on a `role="status"` region is the whole accessibility story
 * for a loading screen: one announcement, once, instead of a description of
 * the placeholder furniture.
 */
export function SkeletonGroup({
  loading,
  label = 'Loading',
  skeleton,
  children,
  className = '',
}: SkeletonGroupProps) {
  return (
    <div role="status" aria-busy={loading} aria-live="polite" className={className}>
      {loading ? (
        <>
          <span className="sr-only">{label}</span>
          {skeleton}
        </>
      ) : (
        children
      )}
    </div>
  )
}
