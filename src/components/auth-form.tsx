'use client'

/**
 * Shared auth form for both /login and /signup.
 *
 * Behavior:
 *  - mode="login"  → email + password, primary CTA "Sign in"
 *  - mode="signup" → name (optional) + email + password, primary CTA "Create account"
 *
 * On success:
 *  - Calls the optional onAuthenticated callback (used to trigger data sync).
 *  - Reads the `redirect` query param and navigates there, defaulting to `/`.
 *
 * Errors from the API are surfaced inline via the Alert component.
 */

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { track } from '@/lib/analytics'

import { useAuth } from '@/components/auth-provider'
import { AuthShell } from '@/components/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Mode = 'login' | 'signup'

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const params = useSearchParams()
  const { login, signup } = useAuth()

  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPw, setShowPw] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const isSignup = mode === 'signup'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (isSignup) {
        await signup(email, password, name.trim() || undefined)
        track('signup_completed', { method: 'email' })
        toast.success('Account created. Your work is now saved to your account.')
      } else {
        await login(email, password)
        track('login_completed', { method: 'email' })
        toast.success('Welcome back!')
      }
      const redirect = params.get('redirect') || '/library'
      router.replace(redirect)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title={isSignup ? 'Create your account' : 'Welcome back'}
      description={
        isSignup
          ? 'Save your favorites and bundle across devices.'
          : 'Sign in to access your saved effects and bundle.'
      }
      note={
        <>
          By continuing, you agree to save your favorites and bundle to your
          account.
          <br />
          You can sign out anytime — your local data stays on this device too.
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {isSignup ? (
            <div className="space-y-2">
              <Label htmlFor="auth-name">Name (optional)</Label>
              <Input
                id="auth-name"
                type="text"
                autoComplete="name"
                placeholder="Ada Lovelace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                disabled={submitting}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="auth-password">Password</Label>
              {isSignup ? (
                <span className="text-xs text-muted-foreground">
                  Min 8 characters
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    tabIndex={-1}
                  >
                    Forgot password?
                  </Link>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    onClick={() => setShowPw((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </span>
              )}
            </div>
            <Input
              id="auth-password"
              type={showPw || isSignup ? 'text' : 'password'}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={submitting}
            />
          </div>
        </CardContent>

        <CardFooter className="mt-6 flex-col gap-3">
          <Button
            type="submit"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSignup ? 'Creating account…' : 'Signing in…'}
              </>
            ) : isSignup ? (
              'Create account'
            ) : (
              'Sign in'
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {isSignup ? (
              <>
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <Link
                  href="/signup"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Create one
                </Link>
              </>
            )}
          </p>
        </CardFooter>
      </form>
    </AuthShell>
  )
}
