'use client'

/**
 * Client-side authentication context, backed by Firebase Auth.
 *
 * The shape of a sign-in:
 *   1. Firebase verifies the credentials in the browser and issues an ID token.
 *   2. That token is posted to /api/auth/session, which exchanges it for an
 *      httpOnly session cookie (see that route for why the cookie exists).
 *   3. /api/auth/me is the source of truth for "who am I" from then on, so
 *      the server decides session validity, not the client SDK.
 *
 * Password reset is Firebase's: it owns the email, the token and the
 * reset page, which is why there is no /forgot-password route in this app
 * any more.
 */

import * as React from 'react'
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { identify, resetIdentity } from '@/lib/analytics'
import { firebaseAuth, isFirebaseConfigured } from '@/lib/firebase/client'

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
  /** Send a Firebase password reset email. Resolves even if unregistered. */
  resetPassword: (email: string) => Promise<void>
  /** Manually refresh the session from the server. */
  refresh: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

/**
 * Turn a Firebase error code into something worth showing a person.
 *
 * Firebase's own messages read like "Firebase: Error (auth/invalid-credential)."
 * Left unmapped they would reach the sign-in form verbatim. Note that
 * invalid-credential covers both "no such account" and "wrong password" by
 * design — Firebase declines to say which, and neither do we.
 */
function describeAuthError(error: unknown, fallback: string): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code: unknown }).code)
      : ''

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.'
    case 'auth/invalid-email':
      return 'That email address does not look right.'
    case 'auth/email-already-in-use':
      return 'An account with that email already exists.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes and try again.'
    case 'auth/user-disabled':
      return 'That account has been disabled.'
    case 'auth/network-request-failed':
      return 'Could not reach the authentication service. Check your connection.'
    case 'auth/operation-not-allowed':
      return 'Email and password sign-in is not enabled for this project.'
    default:
      return error instanceof Error && error.message && !code
        ? error.message
        : fallback
  }
}

/**
 * Exchange a Firebase ID token for the server session cookie.
 *
 * Errors here are reported honestly rather than as a credentials problem:
 * the password was already accepted by Firebase at this point, so anything
 * that fails now is the server's fault, not the person's.
 */
async function exchangeIdToken(idToken: string): Promise<AuthUser> {
  let res: Response
  try {
    res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ idToken }),
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

  if (!res.ok || !data.user) {
    const message =
      typeof data.error === 'string' && data.error.trim()
        ? data.error
        : 'Signed in, but the session could not be created. Please try again.'
    throw new Error(message)
  }
  return data.user
}

function assertConfigured() {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Sign-in is not configured for this deployment (missing Firebase keys).',
    )
  }
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
    assertConfigured()
    let idToken: string
    try {
      const credential = await signInWithEmailAndPassword(
        firebaseAuth(),
        email.trim(),
        password,
      )
      idToken = await credential.user.getIdToken()
    } catch (err) {
      throw new Error(
        describeAuthError(err, 'Sign in failed. Please try again.'),
      )
    }
    setUser(await exchangeIdToken(idToken))
  }, [])

  const signup = React.useCallback(
    async (email: string, password: string, name?: string) => {
      assertConfigured()
      let idToken: string
      try {
        const credential = await createUserWithEmailAndPassword(
          firebaseAuth(),
          email.trim(),
          password,
        )
        if (name) {
          await updateProfile(credential.user, { displayName: name })
        }
        // force-refresh so the token carries the display name just set.
        idToken = await credential.user.getIdToken(Boolean(name))
      } catch (err) {
        throw new Error(
          describeAuthError(err, 'Sign up failed. Please try again.'),
        )
      }
      setUser(await exchangeIdToken(idToken))
    },
    [],
  )

  const logout = React.useCallback(async () => {
    // Clear the server cookie first: if signOut() succeeded and this failed,
    // the browser would look signed out while the cookie still authenticated
    // every server request.
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    }).catch(() => {})
    if (isFirebaseConfigured()) {
      await signOut(firebaseAuth()).catch(() => {})
    }
    setUser(null)
  }, [])

  const resetPassword = React.useCallback(async (email: string) => {
    assertConfigured()
    try {
      await sendPasswordResetEmail(firebaseAuth(), email.trim())
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code: unknown }).code)
          : ''
      // Never report "no such account": that turns the reset form into a way
      // to test which email addresses are registered.
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') return
      throw new Error(
        describeAuthError(err, 'Could not send the reset email. Try again.'),
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
