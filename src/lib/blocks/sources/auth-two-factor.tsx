'use client'

/**
 * <AuthTwoFactor> — the authenticator-app challenge, with a backup route.
 *
 * The backup-code escape hatch is the point of this block. A 2FA screen
 * without one locks out every user who changes phone, and support tickets
 * for account recovery are the most expensive kind there is. It is a mode
 * switch rather than a second form so only one input is ever submittable.
 *
 * "Trust this device" is off by default. A checkbox that weakens a security
 * control should never be pre-ticked.
 */

import * as React from 'react'
import { Loader2, Smartphone, KeySquare } from 'lucide-react'

export interface AuthTwoFactorProps {
  heading?: string
  onVerify?: (value: { code: string; mode: Mode; trustDevice: boolean }) => Promise<void>
  className?: string
}

type Mode = 'app' | 'backup'

export function AuthTwoFactor({
  heading = 'Two-factor authentication',
  onVerify,
  className = '',
}: AuthTwoFactorProps) {
  const [mode, setMode] = React.useState<Mode>('app')
  const [code, setCode] = React.useState('')
  const [trustDevice, setTrustDevice] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const isApp = mode === 'app'
  const expected = isApp ? 6 : 10
  const ready = code.trim().length >= (isApp ? expected : 8)

  function switchMode(next: Mode) {
    setMode(next)
    setCode('')
    setError(null)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!ready || busy) return

    setBusy(true)
    setError(null)
    try {
      await onVerify?.({ code, mode, trustDevice })
    } catch {
      setError(isApp ? 'That code is not valid or has expired.' : 'That backup code was not recognised.')
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`flex min-h-96 w-full items-center justify-center p-6 ${className}`}>
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card/80 p-7 shadow-sm backdrop-blur">
        <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
          {isApp ? <Smartphone className="h-5 w-5" /> : <KeySquare className="h-5 w-5" />}
        </div>

        <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isApp
            ? 'Enter the 6-digit code from your authenticator app.'
            : 'Enter one of the backup codes you saved when you set 2FA up.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="tfa-code" className="mb-1.5 block text-sm font-medium">
              {isApp ? 'Authentication code' : 'Backup code'}
            </label>
            <input
              id="tfa-code"
              // Backup codes contain letters and dashes, so only the app
              // code gets the numeric keypad and the OTP autofill hint.
              inputMode={isApp ? 'numeric' : 'text'}
              autoComplete={isApp ? 'one-time-code' : 'off'}
              autoFocus
              required
              maxLength={expected}
              value={code}
              onChange={(e) => setCode(isApp ? e.target.value.replace(/\D/g, '') : e.target.value)}
              placeholder={isApp ? '123456' : 'xxxx-xxxx'}
              className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-center font-mono text-lg tracking-[0.3em] outline-none transition-shadow placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <p aria-live="polite" className="min-h-5 text-sm text-destructive">
            {error}
          </p>

          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border/60 accent-[hsl(var(--primary))]"
            />
            <span className="text-muted-foreground">
              Trust this device for 30 days
            </span>
          </label>

          <button
            type="submit"
            disabled={!ready || busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin motion-reduce:[animation-duration:1.6s]" /> : null}
            {busy ? 'Verifying' : 'Verify'}
          </button>
        </form>

        <div className="mt-6 border-t border-border/60 pt-4 text-center">
          <button
            type="button"
            onClick={() => switchMode(isApp ? 'backup' : 'app')}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {isApp ? 'Lost your device? Use a backup code' : 'Use your authenticator app instead'}
          </button>
        </div>
      </div>
    </div>
  )
}
