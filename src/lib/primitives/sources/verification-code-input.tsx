'use client'

/**
 * <VerificationCodeInput> — the six boxes after "check your email".
 *
 * Almost every hand-rolled version of this fails the only interaction that
 * matters. The user does not type the code; they copy it from the email and
 * paste it, and they paste it into whichever box happens to be focused. So:
 *
 *   paste       distributes across the boxes from the FIRST one, whichever
 *               box received the event, and focus lands on the last filled
 *               box or the first empty one
 *   backspace   in an empty box moves back and clears, rather than doing
 *               nothing and leaving the user pressing it again
 *   arrows      move between boxes; Home and End jump to the ends
 *   overtype    typing in a filled box replaces and advances, instead of
 *               being swallowed by maxLength
 *
 * `autoComplete="one-time-code"` on the first box is what makes iOS offer
 * the code from Messages above the keyboard, and it only works on the
 * first. `inputMode="numeric"` gets the number pad without `type="number"`,
 * which would bring a spinner and accept "e" and "-".
 */

import * as React from 'react'

export interface VerificationCodeInputProps {
  length?: number
  value?: string
  onChange?: (value: string) => void
  /** Fired when the last box is filled — usually submits the form. */
  onComplete?: (value: string) => void
  invalid?: boolean
  disabled?: boolean
  /** Names the whole group, since each box on its own is meaningless. */
  label?: string
  className?: string
}

export function VerificationCodeInput({
  length = 6,
  value,
  onChange,
  onComplete,
  invalid = false,
  disabled = false,
  label = 'Verification code',
  className = '',
}: VerificationCodeInputProps) {
  const [internal, setInternal] = React.useState('')
  const code = value ?? internal
  const refs = React.useRef<(HTMLInputElement | null)[]>([])

  const commit = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, length)
    if (value === undefined) setInternal(clean)
    onChange?.(clean)
    if (clean.length === length) onComplete?.(clean)
    return clean
  }

  const focusAt = (index: number) => {
    const target = refs.current[Math.max(0, Math.min(length - 1, index))]
    target?.focus()
    target?.select()
  }

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '')
    if (digits.length === 0) return

    // More than one digit means a paste or an autofill landed here, so it
    // fills forward from this box rather than being truncated to one.
    const chars = code.padEnd(length, ' ').split('')
    for (let i = 0; i < digits.length && index + i < length; i++) {
      chars[index + i] = digits[i]
    }
    const next = commit(chars.join('').trimEnd())
    focusAt(Math.min(index + digits.length, length - 1))
    void next
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (code[index]) {
        commit(code.slice(0, index) + code.slice(index + 1))
        return
      }
      // Empty box: step back and clear the one behind, which is what the
      // user is trying to do when they press it a second time.
      if (index > 0) {
        commit(code.slice(0, index - 1) + code.slice(index))
        focusAt(index - 1)
      }
      return
    }

    // Deliberately physical, not logical. These boxes are a number written
    // left to right in every locale — a verification code is not prose, and
    // RTL users read and type it in the same order.
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusAt(index - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusAt(index + 1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      focusAt(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      focusAt(length - 1)
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!digits) return
    // From the first box regardless of which one was focused: a pasted
    // code is the whole code.
    commit(digits)
    focusAt(digits.length >= length ? length - 1 : digits.length)
  }

  return (
    <div
      role="group"
      aria-label={label}
      /*
       * `aria-invalid` is NOT here. The group role does not support it —
       * an assistive technology is free to ignore it, and several do — so
       * the state would be visible and unannounced. It goes on each input
       * below instead, where it is part of the role's own contract.
       */
      className={`flex items-center gap-2 ${className}`}
    >
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          // Only the first box offers the SMS code; on the rest it makes
          // the platform suggest the whole code into a single digit slot.
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          disabled={disabled}
          value={code[i] ?? ''}
          aria-label={`Digit ${i + 1} of ${length}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.currentTarget.select()}
          aria-invalid={invalid || undefined}
          className={[
            'h-12 w-10 rounded-lg border text-center font-mono text-lg font-semibold',
            'text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            invalid ? 'border-destructive bg-destructive/5' : 'border-border bg-background',
          ].join(' ')}
        />
      ))}
    </div>
  )
}
