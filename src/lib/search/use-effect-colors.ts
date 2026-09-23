'use client'

/**
 * The colour table for the /library filter, loaded on demand.
 *
 * `null` while it is loading or if the chunk failed, a lookup once it is in.
 * The table is a dynamic import so it is its own chunk: /library's first load
 * is unchanged, and the ~10 KB (gzipped) arrives when the page is idle or the
 * moment someone touches a swatch — whichever is first. A visitor who never
 * uses colour downloads it in the background at worst.
 *
 * `failed` is set if the chunk could not be loaded, so the caller can say the
 * filter is unavailable rather than applying it against nothing and
 * reporting "no effects found".
 */

import * as React from 'react'
import type { ColorBucket } from './color'

export interface EffectColors {
  /** Effect ids with this bucket as a main colour. */
  ids: (bucket: ColorBucket) => ReadonlySet<string>
  /** Effects per bucket, for the swatch labels. */
  counts: Record<ColorBucket, number>
  /** How many effects carry any colour tag at all. */
  tagged: number
}

let cached: EffectColors | null = null
let pending: Promise<EffectColors | null> | null = null

function load(): Promise<EffectColors | null> {
  if (cached) return Promise.resolve(cached)
  pending ??= import('./colors-data')
    .then((m) => {
      cached = { ids: m.effectsByColor, counts: m.colorCounts(), tagged: m.taggedEffectCount() }
      return cached
    })
    .catch(() => {
      pending = null
      return null
    })
  return pending
}

/** Start loading now — for hover and focus on the swatches. */
export function preloadEffectColors(): void {
  void load()
}

/**
 * @param wanted  Load immediately (the URL already carries `?color=`).
 *                Otherwise the table is fetched when the browser is idle.
 */
export function useEffectColors(wanted: boolean): {
  colors: EffectColors | null
  failed: boolean
} {
  const [colors, setColors] = React.useState<EffectColors | null>(cached)
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    if (colors) return
    let cancelled = false
    const run = () => {
      void load().then((c) => {
        if (cancelled) return
        if (c) setColors(c)
        else setFailed(true)
      })
    }
    if (wanted) {
      run()
      return () => {
        cancelled = true
      }
    }
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(run, { timeout: 4000 })
      return () => {
        cancelled = true
        w.cancelIdleCallback?.(id)
      }
    }
    const t = window.setTimeout(run, 2000)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [colors, wanted])

  return { colors, failed }
}
