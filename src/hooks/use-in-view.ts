'use client'

/**
 * useInView — IntersectionObserver-based scroll trigger.
 *
 * Returns a ref + a boolean. The boolean flips to true the first time
 * the element scrolls into the viewport (one-shot by default).
 *
 * Respects prefers-reduced-motion: when the user has reduced motion
 * enabled, the hook reports `true` immediately so the element is shown
 * without animation.
 *
 * Why a hook instead of a CSS-only solution: we need to add a class
 * once, then unobserve — IntersectionObserver gives us that control
 * without depending on framer-motion or any animation library.
 */

import * as React from 'react'

export interface UseInViewOptions {
  /** Only fire once, then stop observing. Default true. */
  once?: boolean
  /** IntersectionObserver rootMargin. Default "0px 0px -10% 0px". */
  rootMargin?: string
  /** IntersectionObserver threshold. Default 0.1 (10% visible). */
  threshold?: number
}

export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {},
): readonly [React.RefObject<T | null>, boolean] {
  const { once = true, rootMargin = '0px 0px -10% 0px', threshold = 0.1 } = options
  const ref = React.useRef<T>(null)
  const [inView, setInView] = React.useState(false)

  React.useEffect(() => {
    // SSR / no IO support → just show.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    // Respect reduced-motion users — show immediately, no animation.
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setInView(true)
      return
    }

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            if (once) observer.disconnect()
          } else if (!once) {
            setInView(false)
          }
        }
      },
      { rootMargin, threshold },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [once, rootMargin, threshold])

  return [ref, inView] as const
}
