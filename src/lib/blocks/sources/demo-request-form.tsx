'use client'

/**
 * <DemoRequestForm> — A demo request that offers the self-serve escape first, so the people who did not want a call do not book one.
 *
 * A demo form's layout problem is that it is aimed at two people who look
 * identical on the way in: the one who wants a call, and the one who is
 * there because the page offered no other way to proceed. The obvious wrong
 * answer is to capture both, which fills a calendar with meetings that both
 * sides resent.
 *
 * So the intro names the escape route in its own sentence — the free tier is
 * the same product — before the fields. That loses bookings, deliberately,
 * and the ones it loses were going to be cancelled or no-showed.
 *
 * Two fields. The second, "what do you want to see", is the one that makes
 * the call worth attending: it decides what is set up in advance, so the
 * thirty minutes are spent on the reader's problem rather than on a seeded
 * demo account.
 *
 * Accessibility: `htmlFor`/`id` label association with `aria-describedby`
 * hints, and a `role="status"` live region rendered empty on first paint —
 * without which the "we'll be in touch" confirmation is invisible to a
 * screen reader, on a form whose only outcome is that sentence.
 *
 * The demo defaults to `idle`. With no `onSubmit` it resolves immediately;
 * a real one should hand off to a scheduler rather than promising a reply,
 * because "book the call" and "we'll email you" are different promises.
 */

import * as React from 'react'

export interface DemoRequestFormProps {
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
interface DemoRequestFormField {
  name: string
  label: string
  type: string
  hint?: string
}

const FIELDS: DemoRequestFormField[] = [
  { name: "email", label: "Work email", type: "email", hint: "The invitation goes here." },
  { name: "goal", label: "What do you want to see?", type: "text", hint: "One line. It decides what gets set up before you arrive." },
]

export function DemoRequestForm({
  heading = "See it on your own data",
  intro = "Thirty minutes, screen-shared, against something of yours rather than a seeded demo account. If you would rather not talk to anyone, the free tier is the same product.",
  submitLabel = "Book the call",
  onSubmit,
  className,
}: DemoRequestFormProps) {
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
      aria-labelledby="demo-request-form-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <h2
          id="demo-request-form-heading"
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
                htmlFor={`demo-request-form-${field.name}`}
                className="block text-sm font-medium text-foreground"
              >
                {field.label}
              </label>
              <input
                id={`demo-request-form-${field.name}`}
                name={field.name}
                type={field.type}
                required
                aria-describedby={field.hint ? `demo-request-form-${field.name}-hint` : undefined}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {field.hint ? (
                <p
                  id={`demo-request-form-${field.name}-hint`}
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
