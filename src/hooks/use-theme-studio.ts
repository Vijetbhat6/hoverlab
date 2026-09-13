'use client'

/**
 * The live theme, applied to the whole document and remembered per browser.
 *
 * The four axes in `lib/theme-studio.ts`, held in one place so the control
 * bar above the grid, the preset gallery at /themes and anything else that
 * wants to read the current theme all agree. Pure `localStorage` — a theme
 * you are trying on is a personal UI preference like the light/dark toggle
 * or reduced motion, not curated data worth a round trip.
 *
 * ── WHY IT SUPERSEDES `use-brand-color` RATHER THAN SITTING BESIDE IT ───
 *
 * Both write `--brand-*` on <html>, so two hooks mounted at once would
 * fight, and the winner would be whichever effect ran last. This hook reads
 * and writes the OLD key as well as its own: an existing brand colour is
 * adopted as the accent axis on first load, and every write mirrors the
 * accent back. So the brand picker in account settings and the theme bar on
 * the catalog stay in step in both directions, and nobody loses the colour
 * they picked last month.
 *
 * ── STORAGE ─────────────────────────────────────────────────────────────
 *
 *   hoverlab:theme-studio   the whole theme as JSON, or absent for default
 *   hoverlab:brand-color    the accent alone, kept in step for the old hook
 *
 * Cross-tab through the `storage` event, same-tab through a custom event,
 * because `storage` deliberately does not fire in the tab that wrote.
 *
 * ── THE REF MIRROR ──────────────────────────────────────────────────────
 *
 * Same pattern as `use-brand-color`, `use-favorites` and the rest, and for
 * the same reason: the write helper dispatches a synchronous CustomEvent, so
 * calling it from inside a `setState` updater would run it during React's
 * render phase and trip "Cannot update a component while rendering a
 * different component". State goes through a ref so the callbacks can
 * compute the next value without reading stale state and without needing
 * the updater.
 *
 * ── FIRST PAINT IS ALWAYS THE DEFAULT THEME, ON PURPOSE ─────────────────
 *
 * The server cannot read localStorage, so hydrating from it in an effect is
 * the only correct option; rendering the saved theme on the server would be
 * a guess that mismatches. That means one frame of the default palette
 * before a custom theme lands. Acceptable here — unlike light/dark, where a
 * flash is a white screen in a dark room, a theme flash is a colour
 * changing on an already-legible page.
 */

import * as React from 'react'

import {
  applyThemeToDocument,
  clearThemeFromDocument,
  coerceTheme,
  DEFAULT_THEME,
  matchingPreset,
  type ThemePreset,
  type ThemeStudioValue,
} from '@/lib/theme-studio'
import { coerceBrandColor, type BrandColor } from '@/lib/brand-presets'

const KEY = 'hoverlab:theme-studio'
const BRAND_KEY = 'hoverlab:brand-color'
const CHANGED = 'hoverlab:theme-studio-changed'
const BRAND_CHANGED = 'hoverlab:brand-color-changed'

function read(): ThemeStudioValue | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw && raw !== 'null') {
      const parsed = coerceTheme(JSON.parse(raw))
      if (parsed) return parsed
    }
    // No theme yet, but the brand picker may have left an accent behind.
    // Adopting it is what stops this hook silently resetting somebody's
    // colour the first time they open a catalog page.
    const brandRaw = window.localStorage.getItem(BRAND_KEY)
    if (brandRaw && brandRaw !== 'null') {
      const accent = coerceBrandColor(JSON.parse(brandRaw))
      if (accent) return { ...DEFAULT_THEME, accent }
    }
    return null
  } catch {
    return null
  }
}

function write(value: ThemeStudioValue | null) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value))
    // Mirrored so the older brand picker sees the same accent.
    window.localStorage.setItem(
      BRAND_KEY,
      value ? JSON.stringify(value.accent) : 'null',
    )
    window.dispatchEvent(new CustomEvent(CHANGED))
    window.dispatchEvent(new CustomEvent(BRAND_CHANGED))
  } catch {
    /* Quota, or a browser with site data switched off. Not worth an error. */
  }
}

export interface UseThemeStudio {
  theme: ThemeStudioValue
  /** True once the saved theme has been read — until then `theme` is the default. */
  ready: boolean
  /** True when the user has chosen something, even if it equals the default. */
  isCustom: boolean
  /** The named preset the current theme matches, if any. */
  preset: ThemePreset | null
  set: (next: ThemeStudioValue) => void
  /** Change one axis, leaving the rest alone. */
  patch: (part: Partial<ThemeStudioValue>) => void
  setAccent: (accent: BrandColor) => void
  reset: () => void
}

export function useThemeStudio(): UseThemeStudio {
  const [theme, setTheme] = React.useState<ThemeStudioValue>(DEFAULT_THEME)
  const [isCustom, setIsCustom] = React.useState(false)
  const [ready, setReady] = React.useState(false)

  const themeRef = React.useRef<ThemeStudioValue>(DEFAULT_THEME)
  React.useEffect(() => {
    themeRef.current = theme
  }, [theme])

  const adopt = React.useCallback((next: ThemeStudioValue | null) => {
    if (next) {
      themeRef.current = next
      setTheme(next)
      setIsCustom(true)
      applyThemeToDocument(next)
    } else {
      themeRef.current = DEFAULT_THEME
      setTheme(DEFAULT_THEME)
      setIsCustom(false)
      clearThemeFromDocument()
    }
  }, [])

  React.useEffect(() => {
    adopt(read())
    setReady(true)
  }, [adopt])

  React.useEffect(() => {
    const sync = () => adopt(read())
    window.addEventListener('storage', sync)
    window.addEventListener(CHANGED, sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(CHANGED, sync)
    }
  }, [adopt])

  const set = React.useCallback((next: ThemeStudioValue) => {
    themeRef.current = next
    setTheme(next)
    setIsCustom(true)
    applyThemeToDocument(next)
    write(next)
  }, [])

  const patch = React.useCallback(
    (part: Partial<ThemeStudioValue>) => {
      set({ ...themeRef.current, ...part })
    },
    [set],
  )

  const setAccent = React.useCallback(
    (accent: BrandColor) => {
      set({ ...themeRef.current, accent })
    },
    [set],
  )

  const reset = React.useCallback(() => {
    themeRef.current = DEFAULT_THEME
    setTheme(DEFAULT_THEME)
    setIsCustom(false)
    clearThemeFromDocument()
    write(null)
  }, [])

  return {
    theme,
    ready,
    isCustom,
    preset: matchingPreset(theme),
    set,
    patch,
    setAccent,
    reset,
  }
}
