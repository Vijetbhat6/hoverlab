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
import { Loader2, Wand2, Github } from 'lucide-react'
import { toast } from 'sonner'
import { track } from '@/lib/analytics'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -top-20 right-1/4 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Brand */}
        <Link
          href="/library"
          className="mb-6 flex items-center justify-center gap-2.5 text-foreground"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-lg shadow-primary/30">
            <Wand2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight">Hoverlab</span>
            <span className="text-[11px] text-muted-foreground">
              A living CSS effects library
            </span>
          </div>
        </Link>

        <Card className="border-border/60 bg-background/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </CardTitle>
            <CardDescription>
              {isSignup
                ? 'Save your favorites and bundle across devices.'
                : 'Sign in to access your saved effects and bundle.'}
            </CardDescription>
          </CardHeader>

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
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      onClick={() => setShowPw((v) => !v)}
                      tabIndex={-1}
                    >
                      {showPw ? 'Hide' : 'Show'}
                    </button>
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
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing, you agree to save your favorites and bundle to your account.
          <br />
          You can sign out anytime — your local data stays on this device too.
        </p>
      </div>
    </div>
  )
}
