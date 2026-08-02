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

/**
 * POST an auth request and return the user, or throw an error whose message
 * is safe to show verbatim.
 *
 * The distinction that matters here is *why* it failed. Every non-success
 * used to collapse into "Sign in failed. Please try again." — the same
 * sentence for a wrong password, a crashed route handler, and an unreachable
 * server. Only the first of those is worth retyping a password over, and the
 * other two look identical to the person doing it. So: a JSON body carries
 * the server's own message, a non-JSON body reports the status code (a route
 * that threw returns an HTML error page, not JSON), and a failed fetch says
 * the server could not be reached.
 */
/**
 * Pull a displayable message out of whatever sits in an `error` field.
 *
 * Our own routes always send a string, but the response is not always ours:
 * an infrastructure layer in front of the app can answer first. Vercel's
 * Deployment Protection, for one, returns
 * `{"error":{"message":"Protected deployment","code":"401"}}` — and
 * `new Error(someObject)` renders as the literal text "[object Object]",
 * which is worse than useless in a banner.
 */
function readError(error: unknown): string | null {
  if (typeof error === 'string' && error.trim()) return error
  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return null
}

async function postAuth(
  path: string,
  body: unknown,
  fallback: string,
): Promise<AuthUser> {
  let res: Response
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error(
      'Could not reach the server. Check your connection and try again.',
    )
  }

  const raw = await res.text().catch(() => '')
  let data: { user?: AuthUser; error?: unknown } = {}
  try {
    data = raw ? JSON.parse(raw) : {}
  } catch {
    throw new Error(
      `The server returned an error (HTTP ${res.status}). ` +
        'This is not your password — check the server logs.',
    )
  }

  if (!res.ok || !data.user) throw new Error(readError(data.error) ?? fallback)
  return data.user
}

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
      setUser(
        await postAuth(
          '/api/auth/login',
          { email, password },
          'Sign in failed. Please try again.',
        ),
      )
    },
    [],
  )

  const signup = React.useCallback(
    async (email: string, password: string, name?: string) => {
      setUser(
        await postAuth(
          '/api/auth/signup',
          { email, password, name },
          'Sign up failed. Please try again.',
        ),
      )
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
