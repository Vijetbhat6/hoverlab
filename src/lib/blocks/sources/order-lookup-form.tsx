'use client'

/**
 * <OrderLookupForm> — Order tracking for the guest who never made an account, which is most of them.
 *
 * Guest checkout is the majority of orders on most storefronts, and the
 * usual order-tracking page asks precisely those buyers to sign into an
 * account they were never offered. The layout problem is authenticating
 * someone who has no credentials.
 *
 * The obvious wrong answer is the order number alone. That is a bare
 * identifier, often sequential, and a lookup keyed on it is an enumeration
 * of every customer's delivery address. Two fields that must match is the
 * cheap correct answer: the number is the key and the email is the proof.
 *
 * That reasoning belongs in the hint, and it is there — "it is what stops an
 * order number being a lookup key for anyone" — because the second field
 * otherwise reads as pointless friction to the person typing it.
 *
 * Accessibility: `htmlFor`/`id` association with the hints on
 * `aria-describedby`, so "on the confirmation email, top right" is announced
 * with the field rather than after it. And the `role="status"` region is in
 * the DOM empty from the start — on a lookup form the result IS the status
 * message, so a region that is never announced is a form that appears to do
 * nothing.
 *
 * A real implementation should return the same message and timing whether
 * or not the pair matched. The demo defaults to `idle` and resolves on
 * submit, which is the success path; the failure path is a throw.
 */

import * as React from 'react'

export interface OrderLookupFormProps {
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
interface OrderLookupFormField {
  name: string
  label: string
  type: string
  hint?: string
}

const FIELDS: OrderLookupFormField[] = [
  { name: "order", label: "Order number", type: "text", hint: "On the confirmation email, top right. Starts with a #." },
  { name: "email", label: "Email used at checkout", type: "email", hint: "Both have to match. It is what stops an order number being a lookup key for anyone." },
]

export function OrderLookupForm({
  heading = "Find your order",
  intro = "Guest checkout is the majority of orders on most storefronts, and the usual tracking page asks those buyers to sign in to an account they were never offered.",
  submitLabel = "Find it",
  onSubmit,
  className,
}: OrderLookupFormProps) {
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
      aria-labelledby="order-lookup-form-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <h2
          id="order-lookup-form-heading"
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
                htmlFor={`order-lookup-form-${field.name}`}
                className="block text-sm font-medium text-foreground"
              >
                {field.label}
              </label>
              <input
                id={`order-lookup-form-${field.name}`}
                name={field.name}
                type={field.type}
                required
                aria-describedby={field.hint ? `order-lookup-form-${field.name}-hint` : undefined}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {field.hint ? (
                <p
                  id={`order-lookup-form-${field.name}-hint`}
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
