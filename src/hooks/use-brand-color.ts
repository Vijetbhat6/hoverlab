'use client'

/**
 * Brand color hook — lets the user recolor the entire app by picking
 * a preset palette or fine-tuning hue/chroma/lightness. The selected
 * brand color is applied to <html> as CSS custom properties
 * (--brand-hue, --brand-chroma, --brand-light-l, --brand-dark-l) which
 * globals.css uses to derive --primary, --ring, and --accent.
 *
 * Pure localStorage — no cloud sync. Brand color is a personal UI
 * preference (like theme toggle / reduced motion), not curated data.
 *
 * Storage layout:
 *  - localStorage key 'hoverlab:brand-color' holds a JSON-stringified
 *    BrandColor object (or null when reset to default).
 *  - Cross-tab sync via 'storage' event + same-tab sync via
 *    'hoverlab:brand-color-changed' custom event.
 *
 * Follows the same ref-mirror pattern as use-remixes / use-favorites /
 * use-bundle / use-compare / use-recently-viewed to avoid the React
 * render-phase setState bug (Task 16).
 */

import * as React from 'react'
import {
  applyBrandColorToDocument,
  clearBrandColorFromDocument,
  coerceBrandColor,
  DEFAULT_BRAND_COLOR,
  type BrandColor,
} from '@/lib/brand-presets'

const STORAGE_KEY = 'hoverlab:brand-color'

/**
 * Read the saved brand color from localStorage. Returns null when:
 *  - running on the server
 *  - no value has been saved
 *  - the saved value is corrupt / unparseable
 *
 * Returning null (rather than DEFAULT_BRAND_COLOR) lets the hook
 * distinguish "user has not customized" from "user picked the default
 * preset explicitly" — useful for showing a Reset button only when
 * there's something to reset.
 */
function readBrandColor(): BrandColor | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return null
    // Allow `null` as a valid stored value (= reset to default).
    if (raw === 'null') return null
    const parsed = JSON.parse(raw)
    return coerceBrandColor(parsed)
  } catch {
    return null
  }
}

function writeBrandColor(c: BrandColor | null) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
    window.dispatchEvent(new CustomEvent('hoverlab:brand-color-changed'))
  } catch {
    /* ignore quota / privacy errors */
  }
}

export interface UseBrandColor {
  /** The currently applied brand color (falls back to default). */
  color: BrandColor
  /** True when the user has explicitly chosen a color (even if it equals the default). */
  isCustomized: boolean
  /** True when the current color equals the default. */
  isDefault: boolean
  /** Replace the current brand color. */
  set: (c: BrandColor) => void
  /** Reset to the default brand color and clear localStorage. */
  reset: () => void
}

export function useBrandColor(): UseBrandColor {
  // Start with the default; we'll hydrate from localStorage in an effect
  // to avoid SSR/CSR mismatch (the server can't read localStorage and
  // would render a different color than the client).
  const [color, setColor] = React.useState<BrandColor>(DEFAULT_BRAND_COLOR)
  const [isCustomized, setIsCustomized] = React.useState<boolean>(false)

  // Mirror in a ref so action callbacks compute next state without
  // reading stale state, and so we can call writeBrandColor(next)
  // OUTSIDE the setEntries updater (which would run during React's
  // render phase and trigger the "Cannot update a component while
  // rendering a different component" error via the synchronous
  // dispatchEvent inside writeBrandColor).
  const colorRef = React.useRef<BrandColor>(DEFAULT_BRAND_COLOR)
  const customizedRef = React.useRef<boolean>(false)
  React.useEffect(() => {
    colorRef.current = color
    customizedRef.current = isCustomized
  }, [color, isCustomized])

  // Hydrate from localStorage on mount + apply to <html>.
  React.useEffect(() => {
    const saved = readBrandColor()
    if (saved) {
      colorRef.current = saved
      customizedRef.current = true
      setColor(saved)
      setIsCustomized(true)
      applyBrandColorToDocument(saved)
    } else {
      // Even if no override is saved, make sure no stale inline styles
      // remain on <html> (e.g. after a previous session was reset).
      clearBrandColorFromDocument()
    }
  }, [])

  // Cross-tab + same-tab sync.
  React.useEffect(() => {
    const sync = () => {
      const saved = readBrandColor()
      if (saved) {
        colorRef.current = saved
        customizedRef.current = true
        setColor(saved)
        setIsCustomized(true)
        applyBrandColorToDocument(saved)
      } else {
        colorRef.current = DEFAULT_BRAND_COLOR
        customizedRef.current = false
        setColor(DEFAULT_BRAND_COLOR)
        setIsCustomized(false)
        clearBrandColorFromDocument()
      }
    }
    window.addEventListener('storage', sync)
    window.addEventListener('hoverlab:brand-color-changed', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('hoverlab:brand-color-changed', sync)
    }
  }, [])

  const set = React.useCallback((c: BrandColor) => {
    colorRef.current = c
    customizedRef.current = true
    setColor(c)
    setIsCustomized(true)
    applyBrandColorToDocument(c)
    writeBrandColor(c)
  }, [])

  const reset = React.useCallback(() => {
    colorRef.current = DEFAULT_BRAND_COLOR
    customizedRef.current = false
    setColor(DEFAULT_BRAND_COLOR)
    setIsCustomized(false)
    clearBrandColorFromDocument()
    writeBrandColor(null)
  }, [])

  return {
    color,
    isCustomized,
    isDefault: !isCustomized,
    set,
    reset,
  }
}
