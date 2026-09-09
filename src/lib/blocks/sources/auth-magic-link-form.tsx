'use client'

/**
 * <AuthMagicLinkForm> — Passwordless sign-in that says what will land in the inbox and how long it lasts, before the address is typed.
 *
 * A one-field form has an unusual layout problem: there is almost nothing
 * to arrange, so everything rests on what the copy commits to. The obvious
 * wrong answer is a bare email field and a button, which leaves the reader
 * guessing whether a link or a code is coming, whether it expires, and
 * whether the old password still works.
 *
 * So the hint carries the contract — one use, fifteen minutes — and it is
 * under the field rather than in the success message. A constraint revealed
 * after submission is a constraint the reader meets as a failure.
 *
 * The accessibility decision worth pointing at is that hint's wiring. The
 * label is associated with `htmlFor`/`id` rather than by wrapping the input,
 * which is what lets the hint sit outside the label and still be announced,
 * through `aria-describedby`. Wrap the input in the label instead and the
 * hint either gets swallowed into the accessible name or is never read.
 *
 * The live region is in the DOM from the first paint and empty. A
 * `role="status"` element created at the moment it receives text is
 * routinely never announced, because the assistive technology never saw it
 * become live — and on this form that region is the entire result, since
 * nothing else on screen changes when the link is sent.
 *
 * The demo defaults to `idle`. With no `onSubmit` passed it resolves
 * immediately and shows the success state; throw from it to see the error
 * path, which is where a real implementation reports an unknown address.
 */

import * as React from 'react'

export interface AuthMagicLinkFormProps {
  heading?: string
  intro?: string
  submitLabel?: string
  /** Called with the collected values. Resolve to accept, throw to reject. */
  onSubmit?: (values: Record<string, string>) => Promise<void> | void
  className?: string
}

type Status = 'idle' | 'pending' | 'done' | 'error'

/*
  A typed array rather than `as const`. With `as const` the entries have
  different shapes - some carry a hint, some do not - so `field.hint` is a
  type error on the members that lack it, and the `'hint' in field` dance
  needed to work around that is worse than declaring the field optional once.
*/
interface AuthMagicLinkFormField {
  name: string
  label: string
  type: string
  hint?: string
}

const FIELDS: AuthMagicLinkFormField[] = [
  { name: "email", label: "Email", type: "email", hint: "The link lands here and works once. It expires after 15 minutes." },
]

export function AuthMagicLinkForm({
  heading = "Sign in without a password",
  intro = "One address, one link, no password to forget or reuse. The link works once and expires in fifteen minutes, which is stated here rather than discovered when it fails.",
  submitLabel = "Email me a link",
  onSubmit,
  className,
}: AuthMagicLinkFormProps) {
  const [status, setStatus] = React.useState<Status>('idle')
  const [message, setMessage] = React.useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const values = Object.fromEntries(
      FIELDS.map((field) => [field.name, String(data.get(field.name) ?? '')]),
    )

    setStatus('pending')
    try {
      await onSubmit?.(values)
      setStatus('done')
      setMessage('Thanks — that came through.')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'That did not go through.')
    }
  }

  return (
    <section
      aria-labelledby="auth-magic-link-form-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <h2
          id="auth-magic-link-form-heading"
          className="text-xl font-semibold tracking-tight text-card-foreground"
        >
          {heading}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{intro}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {FIELDS.map((field) => (
            <div key={field.name}>
              {/*
                htmlFor / id rather than a wrapping label, so the hint can
                sit outside the label and still be announced — that is what
                aria-describedby is for.
              */}
              <label
                htmlFor={`auth-magic-link-form-${field.name}`}
                className="block text-sm font-medium text-foreground"
              >
                {field.label}
              </label>
              <input
                id={`auth-magic-link-form-${field.name}`}
                name={field.name}
                type={field.type}
                required
                aria-describedby={field.hint ? `auth-magic-link-form-${field.name}-hint` : undefined}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {field.hint ? (
                <p
                  id={`auth-magic-link-form-${field.name}-hint`}
                  className="mt-1 text-xs text-muted-foreground"
                >
                  {field.hint}
                </p>
              ) : null}
            </div>
          ))}

          <button
            type="submit"
            disabled={status === 'pending'}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            {status === 'pending' ? 'Working…' : submitLabel}
          </button>

          {/*
            The live region is always in the DOM and starts empty. A region
            mounted at the moment it gets text is frequently not announced —
            the assistive tech never saw it become live.
          */}
          <p
            role="status"
            aria-live="polite"
            className={`min-h-5 text-sm ${
              status === 'error' ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            {message}
          </p>
        </form>
      </div>
    </section>
  )
}
