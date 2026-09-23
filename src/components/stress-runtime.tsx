'use client'

/**
 * Applies `?stress=<id>` to a preview frame, after hydration.
 *
 * Renders nothing. It exists so that the stress matrix, the test harness and
 * anyone who opens the URL by hand are all looking at the same thing: there
 * is one implementation of each condition (`lib/stress/apply.ts`) and this is
 * its only caller.
 *
 * ── WHY IT WAITS ────────────────────────────────────────────────────────
 *
 * Blocks render some of their content in effects and on animation frames. A
 * transform run at mount would rewrite a tree that is about to change under
 * it and miss whatever arrived a frame later. Two animation frames plus a
 * short timer is what "hydrated and settled" means here; the harness waits
 * for `data-stress-applied` on <html>, which is set only after that.
 *
 * The query is read in the browser rather than through `searchParams`: the
 * preview route is prerendered, and awaiting `searchParams` would turn every
 * frame into a function call (see the note in the route).
 */

import { useEffect } from 'react'

import { STRESS_BY_ID, isFrameStress } from '@/lib/stress/conditions'
import { applyStress } from '@/lib/stress/apply'

const SETTLE_MS = 350

export function StressRuntime() {
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('stress')
    if (!isFrameStress(requested)) return

    const stress = requested in STRESS_BY_ID ? STRESS_BY_ID[requested as keyof typeof STRESS_BY_ID] : null

    let dispose: (() => void) | undefined
    let timer: number | undefined
    let frame: number | undefined

    frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(() => {
        timer = window.setTimeout(() => {
          const applied = applyStress(requested, stress)
          dispose = applied.dispose
          document.documentElement.dataset.stressChanged = String(applied.changed)
        }, SETTLE_MS)
      })
    })

    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame)
      if (timer !== undefined) window.clearTimeout(timer)
      dispose?.()
    }
  }, [])

  return null
}
