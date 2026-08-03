'use client'

/**
 * Client-side authentication context.
 *
 * Every call goes to this app's own API routes. The browser never contacts
 * Firebase directly — that was the earlier design, using the Firebase client
 * SDK, and it made sign-in depend on the browser being able to reach
 * identitytoolkit.googleapis.com. Ad blockers, privacy extensions and DNS
 * filtering break that reliably, producing a network error before the app
 * was involved at all, and nothing on the app's side could fix it. The
 * server talks to Firebase now; the browser talks only here.
 *
 * /api/auth/me is the source of truth for "who am I", so session validity is
 * always the server's decision.
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
  signup: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  /** Ask Firebase to send a reset email. Resolves even if unregistered. */
  resetPassword: (email: string) => Promise<void>
  /** Manually refresh the session from the server. */
  refresh: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

/**
 * Pull a displayable message out of whatever sits in an `error` field.
 *
 * Our own routes always send a string, but the response is not always ours:
 * infrastructure in front of the app can answer first. Vercel's Deployment
 * Protection, for one, returns `{"error":{"message":"Protected deployment"}}`
 * — and `new Error(someObject)` renders as the literal text "[object Object]".
 */
function readError(error: unknown): string | null {
  if (typeof error === 'string' && error.trim()) return error
  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return null
}

interface PostResult {
  data: { user?: AuthUser; error?: unknown }
  status: number
  ok: boolean
}

/**
 * POST to one of our auth routes and normalise the outcome.
 *
 * The distinction that matters is *why* something failed. A wrong password, a
 * crashed route handler and an unreachable server used to collapse into one
 * sentence — and only the first is worth retyping a password over. So: a JSON
 * body carries the server's own message, a non-JSON body reports the status
 * code (a route that threw returns an HTML error page), and a failed fetch
 * says the server could not be reached.
 */
async function post(path: string, body: unknown): Promise<PostResult> {
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
  return { data, status: res.status, ok: res.ok }
}

async function postForUser(
  path: string,
  body: unknown,
  fallback: string,
): Promise<AuthUser> {
  const { data, ok } = await post(path, body)
  if (!ok || !data.user) throw new Error(readError(data.error) ?? fallback)
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

  const login = React.useCallback(async (email: string, password: string) => {
    setUser(
      await postForUser(
        '/api/auth/login',
        { email, password },
        'Sign in failed. Please try again.',
      ),
    )
  }, [])

  const signup = React.useCallback(
    async (email: string, password: string, name?: string) => {
      setUser(
        await postForUser(
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
    }).catch(() => {})
    setUser(null)
  }, [])

  const resetPassword = React.useCallback(async (email: string) => {
    const { data, ok } = await post('/api/auth/forgot-password', { email })
    // Only a hard failure (rate limiting) surfaces; "no such account" comes
    // back as success by design, so the form cannot be used to test which
    // addresses are registered.
    if (!ok) {
      throw new Error(
        readError(data.error) ?? 'Could not send the reset email. Try again.',
      )
    }
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
    () => ({ user, loading, login, signup, logout, resetPassword, refresh }),
    [user, loading, login, signup, logout, resetPassword, refresh],
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
