'use client'

/**
 * <GiftOptionsForm> — The gifting step, placed in the cart where it is a choice rather than at checkout where it is friction.
 *
 * Placement is the whole decision here, and it is a layout problem rather
 * than a form problem. The obvious wrong answer is checkout, where every
 * implementation puts it — a gift message typed while someone is entering
 * card details is a step standing between them and paying, and it converts
 * worse than not offering it.
 *
 * In the cart it is part of choosing, which is what it actually is. The
 * reader is still deciding; adding a message is another decision of the same
 * kind, and there is no payment flow to interrupt.
 *
 * The character limit is in the hint rather than in a counter that turns red.
 * A limit stated before typing is a constraint; a limit enforced after is a
 * correction, and the difference matters on a field where someone has
 * composed something personal.
 *
 * Accessibility: the labels are associated with `htmlFor`/`id` so the hints
 * ride on `aria-describedby`, and the `role="status"` region exists empty
 * from the first paint so the confirmation is announced. The "From" hint
 * carries a real option — leave it blank to stay anonymous — which is the
 * kind of thing that must be announced with the field rather than sitting as
 * unassociated text beside it.
 *
 * The demo defaults to `idle`. Both fields are required by the scaffold; a
 * real implementation should make both optional, since an anonymous gift
 * with no message is a legitimate order.
 */

import * as React from 'react'

export interface GiftOptionsFormProps {
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
interface GiftOptionsFormField {
  name: string
  label: string
  type: string
  hint?: string
}

const FIELDS: GiftOptionsFormField[] = [
  { name: "message", label: "Message on the card", type: "text", hint: "Handwritten and enclosed. Up to 200 characters." },
  { name: "from", label: "From", type: "text", hint: "Signed as written. Leave blank to stay anonymous." },
]

export function GiftOptionsForm({
  heading = "Sending this as a gift?",
  intro = "In the cart rather than at checkout, because a gift message added while someone is entering card details is a step between them and paying. Here it is part of choosing.",
  submitLabel = "Add gift options",
  onSubmit,
  className,
}: GiftOptionsFormProps) {
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
      aria-labelledby="gift-options-form-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <h2
          id="gift-options-form-heading"
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
                htmlFor={`gift-options-form-${field.name}`}
                className="block text-sm font-medium text-foreground"
              >
                {field.label}
              </label>
              <input
                id={`gift-options-form-${field.name}`}
                name={field.name}
                type={field.type}
                required
                aria-describedby={field.hint ? `gift-options-form-${field.name}-hint` : undefined}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {field.hint ? (
                <p
                  id={`gift-options-form-${field.name}-hint`}
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
