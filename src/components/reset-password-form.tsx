'use client'

/**
 * /reset-password?token=… — choose a new password.
 *
 * The token is checked on mount so a dead link says so immediately, rather
 * than after the person has typed and confirmed a new password. The POST
 * re-checks it regardless; this is UX, not enforcement.
 *
 * On success the browser is left signed out (the reset revokes every session
 * issued before it, including this one) and sent to /login.
 */

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth-provider'
import { AuthShell } from '@/components/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

type TokenState = 'checking' | 'valid' | 'invalid'

export function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { refresh } = useAuth()
  const token = params.get('token') ?? ''

  const [tokenState, setTokenState] = React.useState<TokenState>('checking')
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [showPw, setShowPw] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    if (!token) {
      setTokenState('invalid')
      return
    }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((res) => (res.ok ? res.json() : { valid: false }))
      .then((data: { valid?: boolean }) => {
        if (!cancelled) setTokenState(data.valid ? 'valid' : 'invalid')
      })
      .catch(() => {
        if (!cancelled) setTokenState('invalid')
      })
    return () => {
      cancelled = true
    }
  }, [token])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Those passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ token, password }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        expired?: boolean
      }
      if (!res.ok) {
        if (data.expired) setTokenState('invalid')
        throw new Error(data.error ?? 'Something went wrong. Try again.')
      }

      // The old cookie was just revoked server-side; clear the client's copy
      // of the session so the header doesn't keep showing a signed-in user.
      await refresh()
      toast.success('Password updated. Sign in with your new password.')
      router.replace('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  if (tokenState === 'checking') {
    return (
      <AuthShell title="Reset your password" description="Checking your link…">
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </AuthShell>
    )
  }

  if (tokenState === 'invalid') {
    return (
      <AuthShell
        title="This link doesn't work"
        description="Reset links expire after an hour and can only be used once."
      >
        <CardContent>
          <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p>
              Request a fresh link and it will work for the next hour. Your
              current password is unchanged in the meantime.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button className="w-full" asChild>
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
          <Button variant="ghost" className="w-full" asChild>
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardFooter>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Choose a new password"
      description="Signing in elsewhere will need the new password — this resets every active session."
    >
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="new-password">New password</Label>
              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                onClick={() => setShowPw((v) => !v)}
                tabIndex={-1}
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            <Input
              id="new-password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              disabled={submitting}
            />
          </div>
        </CardContent>

        <CardFooter className="mt-6 flex-col gap-3">
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating password…
              </>
            ) : (
              'Update password'
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </AuthShell>
  )
}
