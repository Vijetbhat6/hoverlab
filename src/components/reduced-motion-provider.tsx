'use client'

/**
 * Reduced-motion accessibility provider.
 *
 * Honors the user's OS-level `prefers-reduced-motion: reduce` setting, with
 * a manual override in the header. When motion is reduced, we inject a global
 * CSS rule that:
 *   - forces animation-duration and transition-duration to 0.001ms
 *   - forces animation-iteration-count to 1 (no infinite loops)
 *   - hides elements with `animation-name` of the surprise-me sweep
 *
 * This is a hard modern accessibility expectation — every animation library
 * should ship with this. Most CSSFX clones don't.
 *
 * Storage:
 *   - localStorage key 'hoverlab:reduced-motion'
 *   - Values: 'auto' | 'on' | 'off' (default 'auto' = follow OS)
 */

import * as React from 'react'

type ReducedMotionPref = 'auto' | 'on' | 'off'

interface ReducedMotionContextValue {
  /** The user's explicit preference. */
  pref: ReducedMotionPref
  /** The effective setting (auto → resolved against OS query). */
  enabled: boolean
  /** Set the user's explicit preference. */
  setPref: (p: ReducedMotionPref) => void
  /** Convenience: cycle auto → on → off → auto. */
  cycle: () => void
}

const STORAGE_KEY = 'hoverlab:reduced-motion'
const ReducedMotionContext = React.createContext<ReducedMotionContextValue | null>(null)

function readStoredPref(): ReducedMotionPref {
  if (typeof window === 'undefined') return 'auto'
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    if (v === 'on' || v === 'off' || v === 'auto') return v
  } catch {
    /* ignore */
  }
  return 'auto'
}

function writeStoredPref(p: ReducedMotionPref) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, p)
  } catch {
    /* ignore */
  }
}

/**
 * The injected style block. Uses !important to override every per-effect
 * CSS rule, and targets animation-duration / transition-duration / iteration
 * count specifically so layout-affecting transitions still complete instantly.
 */
const REDUCED_MOTION_CSS = `
*, *::before, *::after {
  animation-duration: 0.001ms !important;
  animation-delay: 0ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.001ms !important;
  transition-delay: 0ms !important;
  scroll-behavior: auto !important;
}
/* The "Surprise me" sweep is purely decorative — hide it entirely. */
.fx-surprise-sweep,
.fx-surprise-shake,
.fx-surprise-pop,
.fx-surprise-rolling {
  animation: none !important;
}
.fx-surprise-sweep {
  display: none !important;
}
`

export function ReducedMotionProvider({ children }: { children: React.ReactNode }) {
  const [pref, setPrefState] = React.useState<ReducedMotionPref>('auto')
  const [osPrefersReduced, setOsPrefersReduced] = React.useState(false)

  // Initialize from localStorage on mount.
  React.useEffect(() => {
    setPrefState(readStoredPref())
  }, [])

  // Subscribe to OS-level prefers-reduced-motion changes.
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setOsPrefersReduced(mq.matches)
    function onChange(e: MediaQueryListEvent) {
      setOsPrefersReduced(e.matches)
    }
    // addEventListener is the modern API; older Safari uses addListener.
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    } else if (typeof (mq).addListener === 'function') {
      ;(mq as MediaQueryList).addListener(onChange)
      return () => (mq as MediaQueryList).removeListener(onChange)
    }
  }, [])

  const enabled = pref === 'on' || (pref === 'auto' && osPrefersReduced)

  // Inject or remove the <style> tag based on `enabled`.
  React.useEffect(() => {
    if (typeof document === 'undefined') return
    const id = 'hoverlab-reduced-motion-style'
    const existing = document.getElementById(id)
    if (enabled) {
      if (!existing) {
        const style = document.createElement('style')
        style.id = id
        style.textContent = REDUCED_MOTION_CSS
        document.head.appendChild(style)
      }
    } else {
      if (existing) existing.remove()
    }
    // Also set a data attribute on <html> so per-effect CSS could opt-in
    // to alternate static states if needed.
    document.documentElement.dataset.reducedMotion = enabled ? 'on' : 'off'
  }, [enabled])

  const setPref = React.useCallback((p: ReducedMotionPref) => {
    setPrefState(p)
    writeStoredPref(p)
  }, [])

  const cycle = React.useCallback(() => {
    setPrefState((curr) => {
      const next: ReducedMotionPref = curr === 'auto' ? 'on' : curr === 'on' ? 'off' : 'auto'
      writeStoredPref(next)
      return next
    })
  }, [])

  const value = React.useMemo<ReducedMotionContextValue>(
    () => ({ pref, enabled, setPref, cycle }),
    [pref, enabled, setPref, cycle],
  )

  return (
    <ReducedMotionContext.Provider value={value}>
      {children}
    </ReducedMotionContext.Provider>
  )
}

export function useReducedMotion(): ReducedMotionContextValue {
  const ctx = React.useContext(ReducedMotionContext)
  if (!ctx) {
    // Shouldn't happen — provider is mounted at the root. Fall back to safe
    // defaults so individual components don't crash if used outside.
    return {
      pref: 'auto',
      enabled: false,
      setPref: () => {},
      cycle: () => {},
    }
  }
  return ctx
}
