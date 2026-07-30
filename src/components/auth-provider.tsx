'use client'

/**
 * Client-side authentication context.
 *
 * On mount, fetches /api/auth/me to hydrate the session from the cookie.
 * Exposes `login`, `signup`, `logout` actions that hit the corresponding
 * API routes and update state. Persists a "ready" flag so consumers can
 * render a skeleton until the session check completes.
 */

import * as React from 'react'
import { identify, resetIdentity } from '@/lib/analytics'

export interface AuthUser {
  id: string
  email: string
  name: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean // true during the initial session check
  login: (email: string, password: string) => Promise<void>
  signup: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<void>
  logout: () => Promise<void>
  /** Manually refresh the session from the server. */
  refresh: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [loading, setLoading] = React.useState(true)

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      if (!res.ok) {
        setUser(null)
        return
      }
      const data = (await res.json()) as { user: AuthUser | null }
      setUser(data.user ?? null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Hydrate on mount.
  React.useEffect(() => {
    refresh()
  }, [refresh])

  const login = React.useCallback(
    async (email: string, password: string) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        user?: AuthUser
        error?: string
      }
      if (!res.ok || !data.user) {
        throw new Error(data.error ?? 'Sign in failed. Please try again.')
      }
      setUser(data.user)
    },
    [],
  )

  const signup = React.useCallback(
    async (email: string, password: string, name?: string) => {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password, name }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        user?: AuthUser
        error?: string
      }
      if (!res.ok || !data.user) {
        throw new Error(data.error ?? 'Sign up failed. Please try again.')
      }
      setUser(data.user)
    },
    [],
  )

  const logout = React.useCallback(async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    })
    setUser(null)
  }, [])

  /**
   * Bind analytics identity to the signed-in user so pre-signup browsing
   * and post-signup activity stitch into one funnel, and so purchases can
   * be attributed back to the sessions that led to them. Resetting on
   * logout stops the next visitor on a shared machine from inheriting it.
   */
  React.useEffect(() => {
    if (loading) return
    if (user) {
      identify(user.id, { email: user.email, name: user.name ?? undefined })
    } else {
      resetIdentity()
    }
  }, [user, loading])

  const value = React.useMemo<AuthContextValue>(
    () => ({ user, loading, login, signup, logout, refresh }),
    [user, loading, login, signup, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside an <AuthProvider>.')
  }
  return ctx
}
