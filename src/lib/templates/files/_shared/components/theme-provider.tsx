'use client'

/**
 * Minimal theme provider — light/dark, persisted, no dependency.
 *
 * Deliberately not `next-themes`. That library is excellent and about 5 KB,
 * but a starter should not spend its first dependency on something this
 * file does in forty lines. Swap it in later if you need system-preference
 * tracking, forced themes per route, or more than two themes.
 *
 * The initial class is applied by the inline script in `app/layout.tsx`,
 * before first paint. This provider only handles *changes* — reading state
 * here on mount and applying it would reintroduce the flash the script
 * exists to prevent.
 */

import * as React from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggle: () => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Seeded from the DOM, which the layout script has already set — not from
  // localStorage, so the provider agrees with what is on screen.
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof document === 'undefined') return 'light'
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  })

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    try {
      localStorage.setItem('theme', next)
    } catch {
      // Private mode, or storage disabled. The theme still applies for
      // this session; it just will not survive a reload.
    }
  }, [])

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    }),
    [theme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/** Read and change the theme. Throws outside a ThemeProvider. */
export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside a ThemeProvider')
  return context
}
