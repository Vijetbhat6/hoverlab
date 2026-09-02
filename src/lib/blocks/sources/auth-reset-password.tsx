'use client'

/**
 * <AuthResetPassword> — set a new password, with a strength meter.
 *
 * Strength is scored from character-class variety and length. That is a
 * rough heuristic and deliberately presented as one — the meter is advice,
 * and the only hard gate is the minimum length plus the confirm match.
 * Blocking submission on a strength score frustrates users with genuinely
 * strong passphrases that happen to be all lowercase.
 *
 * The confirmation mismatch is announced through `aria-live` and marked
 * with `aria-invalid`, so it is not conveyed by a red border alone.
 */

import * as React from 'react'
import { Eye, EyeOff, Loader2, KeyRound } from 'lucide-react'

export interface AuthResetPasswordProps {
  heading?: string
  minLength?: number
  onSubmit?: (password: string) => Promise<void>
  className?: string
}

const LEVELS = [
  { label: 'Too short', bar: 'bg-border', text: 'text-muted-foreground' },
  { label: 'Weak', bar: 'bg-red-500', text: 'text-red-500' },
  { label: 'Fair', bar: 'bg-amber-500', text: 'text-amber-500' },
  { label: 'Good', bar: 'bg-sky-500', text: 'text-sky-500' },
  { label: 'Strong', bar: 'bg-emerald-500', text: 'text-emerald-500' },
]

/** 0–4. Length gets the most weight; variety breaks the ties. */
function scorePassword(value: string, minLength: number): number {
  if (value.length < minLength) return 0

  let score = 1
  if (value.length >= minLength + 4) score += 1
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1

  return Math.min(4, score)
}

export function AuthResetPassword({
  heading = 'Choose a new password',
  minLength = 8,
  onSubmit,
  className = '',
}: AuthResetPasswordProps) {
  // Per-instance ids. A literal id in a reusable component is a
  // collision waiting for the second copy on the page — and a <label>
  // then resolves to whichever input rendered first.
  const uid = React.useId()
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [visible, setVisible] = React.useState(false)
  const [busy, setBusy] = React.useState(false)

  const score = scorePassword(password, minLength)
  const level = LEVELS[score]
  const longEnough = password.length >= minLength
  const mismatch = confirm.length > 0 && confirm !== password
  const canSubmit = longEnough && confirm === password && !busy

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    try {
      await onSubmit?.(password)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`flex min-h-96 w-full items-center justify-center p-6 ${className}`}>
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card/80 p-7 shadow-sm backdrop-blur">
        <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <KeyRound className="h-5 w-5" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          It needs at least {minLength} characters. Longer beats complicated.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor={`${uid}-reset-password`} className="mb-1.5 block text-sm font-medium">
              New password
            </label>
            <div className="relative">
              <input
                id={`${uid}-reset-password`}
                type={visible ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 pe-11 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary"
              />
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {visible ? (
                  <EyeOff aria-hidden className="h-4 w-4" />
                ) : (
                  <Eye aria-hidden className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Strength meter */}
            <div className="mt-2.5 flex items-center gap-2">
              <div aria-hidden className="flex flex-1 gap-1">
                {[1, 2, 3, 4].map((step) => (
                  <span
                    key={step}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      score >= step ? level.bar : 'bg-border/60'
                    }`}
                  />
                ))}
              </div>
              <span className={`w-16 text-end text-xs font-medium ${level.text}`}>
                {password.length > 0 ? level.label : ''}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor={`${uid}-reset-confirm`} className="mb-1.5 block text-sm font-medium">
              Confirm password
            </label>
            <input
              id={`${uid}-reset-confirm`}
              type={visible ? 'text' : 'password'}
              required
              autoComplete="new-password"
              aria-invalid={mismatch}
              aria-describedby={`${uid}-reset-confirm-error`}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-shadow focus-visible:ring-2 ${
                mismatch
                  ? 'border-destructive focus-visible:ring-destructive'
                  : 'border-border/60 focus-visible:ring-primary'
              }`}
            />
            <p
              id={`${uid}-reset-confirm-error`}
              aria-live="polite"
              className="mt-1.5 min-h-4 text-xs text-destructive"
            >
              {mismatch ? 'The two passwords do not match.' : ''}
            </p>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin motion-reduce:[animation-duration:1.6s]" /> : null}
            {busy ? 'Saving' : 'Set new password'}
          </button>
        </form>
      </div>
    </div>
  )
}
