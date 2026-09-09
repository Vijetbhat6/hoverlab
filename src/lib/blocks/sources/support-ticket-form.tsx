'use client'

/**
 * <SupportTicketForm> — A support form that asks for the one thing that halves resolution time — what you already tried — and says when a human will read it.
 *
 * The layout problem is that a support form has two audiences with opposite
 * interests. The person filling it in wants to send it now; the person
 * answering it wants context. The obvious wrong answer is to serve the
 * second at the first's expense — a required "steps to reproduce" field is
 * how a form gets abandoned in favour of an email.
 *
 * So the third field asks the one question that reliably removes a round
 * trip, and it is optional. An optional field with a stated reason gets
 * filled in far more often than a required field with none, and nothing is
 * blocked when it does not.
 *
 * The intro states the reply window rather than promising a fast one. "Weekdays, inside four hours" is checkable; "we'll get back to you as soon
 * as possible" is what people have learned means nothing.
 *
 * Accessibility: `htmlFor`/`id` label association so the hints ride on
 * `aria-describedby` rather than being loose text after the input, and a
 * `role="status"` region rendered empty on first paint. That second one is
 * what makes the confirmation audible — a region that did not exist at load
 * is frequently never announced, and on a form whose success state is a
 * sentence, an unannounced sentence is no success state at all.
 *
 * The demo defaults to `idle` with an empty message, which is the state
 * every reader arrives in and the reason the region reserves its height.
 */

import * as React from 'react'

export interface SupportTicketFormProps {
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
interface SupportTicketFormField {
  name: string
  label: string
  type: string
  hint?: string
}

const FIELDS: SupportTicketFormField[] = [
  { name: "email", label: "Email", type: "email", hint: "Where the reply goes. Weekdays, inside four hours." },
  { name: "summary", label: "What happened?", type: "text", hint: "One sentence. The detail goes below." },
  { name: "tried", label: "What have you already tried?", type: "text", hint: "Optional, and the field that saves a round trip." },
]

export function SupportTicketForm({
  heading = "Tell us what broke",
  intro = "Most tickets take two round trips because the first reply has to ask what was already tried. This asks up front, and the answer is optional so it never blocks sending.",
  submitLabel = "Send ticket",
  onSubmit,
  className,
}: SupportTicketFormProps) {
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
      aria-labelledby="support-ticket-form-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <h2
          id="support-ticket-form-heading"
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
                htmlFor={`support-ticket-form-${field.name}`}
                className="block text-sm font-medium text-foreground"
              >
                {field.label}
              </label>
              <input
                id={`support-ticket-form-${field.name}`}
                name={field.name}
                type={field.type}
                required
                aria-describedby={field.hint ? `support-ticket-form-${field.name}-hint` : undefined}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {field.hint ? (
                <p
                  id={`support-ticket-form-${field.name}-hint`}
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
