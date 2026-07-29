'use client'

/**
 * <Reveal> — wraps children with a fade-in-up animation on scroll.
 *
 * Behavior:
 *  - Hidden by default (opacity 0, translateY 24px) via the `.reveal` class
 *    defined in globals.css.
 *  - When the element scrolls into view, `.is-visible` is added and the
 *    CSS transition runs.
 *  - Respects prefers-reduced-motion: the useInView hook reports true
 *    immediately for reduced-motion users, AND the CSS overrides to
 *    opacity:1 / no transform.
 *
 * Stagger: pass `delay` in ms. The parent can wrap multiple <Reveal>
 * children with incrementing delays (0, 80, 160, 240...) for a cascade.
 *
 * Polymorphic: renders as a `div` by default, but accepts `as` to render
 * other tags (section, li, etc.) without a wrapper.
 */

import * as React from 'react'
import { useInView } from '@/hooks/use-in-view'
import { cn } from '@/lib/utils'

export interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  /** Delay before the transition starts, in milliseconds. Default 0. */
  delay?: number
  /** Render as a different element. Default 'div'. */
  as?: keyof React.JSX.IntrinsicElements
  /** Disable the animation entirely (always visible). Default false. */
  disabled?: boolean
}

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
  disabled = false,
  style,
  ...rest
}: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>()

  return React.createElement(
    Tag,
    {
      ref,
      className: cn(disabled ? undefined : 'reveal', inView && !disabled && 'is-visible', className),
      style: { ...style, transitionDelay: delay ? `${delay}ms` : undefined },
      ...rest,
    },
    children,
  )
}
