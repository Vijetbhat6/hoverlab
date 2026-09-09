'use client'

/**
 * <BackInStockForm> — The capture that replaces a dead sold-out button, with the honest caveat that a notification is not a reservation.
 *
 * A sold-out product page is the highest-intent, lowest-yield page in
 * commerce: someone has decided, and there is nothing for them to do. The
 * layout problem is what occupies the space the buy button had. The obvious
 * wrong answer is a disabled button, which is a dead end that still looks
 * like the primary action.
 *
 * So the capture takes that slot, and the second field is the one most
 * implementations omit: without the size, the alert fires on a restock of a
 * variant the reader cannot use, which teaches them to ignore the next one.
 *
 * The hint on the email field carries the sentence that keeps this honest —
 * a notification is not a reservation. Sending "it's back!" to four hundred
 * people for eleven units and calling it a reservation is how this feature
 * generates complaints rather than orders.
 *
 * Accessibility: the label/hint pairing is `htmlFor`/`id` plus
 * `aria-describedby`, so "this is not a reservation" is announced as part of
 * the field rather than floating after it — which is exactly the sentence
 * that must not be missed. The live region is mounted empty from first
 * paint, because a region created when the message arrives is usually never
 * announced.
 *
 * The demo defaults to `idle`. Both fields are marked required by the
 * scaffold; a real implementation should relax the size field, since "any
 * size" is a legitimate answer and the hint already says so.
 */

import * as React from 'react'

export interface BackInStockFormProps {
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
interface BackInStockFormField {
  name: string
  label: string
  type: string
  hint?: string
}

const FIELDS: BackInStockFormField[] = [
  { name: "email", label: "Email", type: "email", hint: "One message when it restocks. This is not a reservation — stock is first come." },
  { name: "size", label: "Size", type: "text", hint: "Only that size triggers the alert. Leave blank for any." },
]

export function BackInStockForm({
  heading = "Tell me when it is back",
  intro = "A sold-out product page with a greyed-out button is a dead end and a lost address. One field turns it into the only useful thing left on the page.",
  submitLabel = "Notify me",
  onSubmit,
  className,
}: BackInStockFormProps) {
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
      aria-labelledby="back-in-stock-form-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <h2
          id="back-in-stock-form-heading"
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
                htmlFor={`back-in-stock-form-${field.name}`}
                className="block text-sm font-medium text-foreground"
              >
                {field.label}
              </label>
              <input
                id={`back-in-stock-form-${field.name}`}
                name={field.name}
                type={field.type}
                required
                aria-describedby={field.hint ? `back-in-stock-form-${field.name}-hint` : undefined}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {field.hint ? (
                <p
                  id={`back-in-stock-form-${field.name}-hint`}
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
