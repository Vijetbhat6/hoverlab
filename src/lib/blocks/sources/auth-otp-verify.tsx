'use client'

/**
 * <AuthOtpVerify> — a six-box one-time-code input.
 *
 * The fiddly parts, all of which are why this is a block and not three
 * lines of JSX:
 *
 *  - Paste. Users paste the whole code from an email or SMS. Splitting a
 *    pasted string across the boxes is handled in `onPaste`, because
 *    without it the paste lands entirely in box one.
 *  - Backspace on an empty box moves focus back and clears the previous
 *    one, which is what every native implementation does.
 *  - Arrow keys move between boxes.
 *  - `inputMode="numeric"` and `autoComplete="one-time-code"` between them
 *    get the numeric keypad on mobile and let iOS autofill the code from
 *    the Messages app.
 *
 * The boxes are six inputs rather than one masked field because that is
 * what users expect to see; the cost is all of the above.
 */

import * as React from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'

export interface AuthOtpVerifyProps {
  length?: number
  heading?: string
  /** Where the code went — shown so the user can catch a wrong address. */
  destination?: string
  onComplete?: (code: string) => Promise<void>
  onResend?: () => void
  className?: string
}

export function AuthOtpVerify({
  length = 6,
  heading = 'Check your email',
  destination = 'you@company.com',
  onComplete,
  onResend,
  className = '',
}: AuthOtpVerifyProps) {
  const [digits, setDigits] = React.useState<string[]>(() => Array(length).fill(''))
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const refs = React.useRef<Array<HTMLInputElement | null>>([])

  const code = digits.join('')

  function focusBox(index: number) {
    refs.current[Math.max(0, Math.min(length - 1, index))]?.focus()
  }

  async function submit(value: string) {
    setBusy(true)
    setError(null)
    try {
      await onComplete?.(value)
    } catch {
      setError('That code is not right. Check it and try again.')
      setDigits(Array(length).fill(''))
      focusBox(0)
    } finally {
      setBusy(false)
    }
  }

  function setDigit(index: number, value: string) {
    const next = [...digits]
    next[index] = value
    setDigits(next)

    if (value && index < length - 1) focusBox(index + 1)

    const joined = next.join('')
    if (joined.length === length && !joined.includes('')) void submit(joined)
  }

  function handleChange(index: number, raw: string) {
    // Keep only the last digit typed: typing into a filled box should
    // replace it, not be ignored because maxLength is already reached.
    const digit = raw.replace(/\D/g, '').slice(-1)
    setDigit(index, digit)
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault()
      const next = [...digits]
      next[index - 1] = ''
      setDigits(next)
      focusBox(index - 1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusBox(index - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusBox(index + 1)
    }
  }

  function handlePaste(event: React.ClipboardEvent) {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return

    const next = Array(length).fill('')
    for (let i = 0; i < pasted.length; i += 1) next[i] = pasted[i]
    setDigits(next)
    focusBox(pasted.length)

    if (pasted.length === length) void submit(pasted)
  }

  return (
    <div className={`flex min-h-96 w-full items-center justify-center p-6 ${className}`}>
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card/80 p-7 text-center shadow-sm backdrop-blur">
        <div className="mx-auto mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We sent a {length}-digit code to{' '}
          <span className="font-medium text-foreground">{destination}</span>
        </p>

        <div
          role="group"
          aria-label={`${length}-digit verification code`}
          className="mt-7 flex justify-center gap-2"
          onPaste={handlePaste}
        >
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              aria-label={`Digit ${i + 1}`}
              maxLength={1}
              disabled={busy}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              className="h-12 w-11 rounded-xl border border-border/60 bg-background text-center text-lg font-semibold outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
            />
          ))}
        </div>

        <p aria-live="polite" className="mt-4 min-h-5 text-sm">
          {busy ? (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              Verifying
            </span>
          ) : null}
          {error ? <span className="text-destructive">{error}</span> : null}
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          Did not get it?{' '}
          <button
            type="button"
            onClick={onResend}
            className="font-semibold text-foreground hover:underline"
          >
            Send another
          </button>
        </p>

        <p className="sr-only" aria-live="polite">
          {code.length} of {length} digits entered
        </p>
      </div>
    </div>
  )
}
