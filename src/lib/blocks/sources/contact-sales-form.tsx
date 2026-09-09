'use client'

/**
 * <ContactSalesForm> — A qualifying contact form that asks the three things a first reply needs, and says what happens next before you send it.
 *
 * The layout problem with a contact form is that every field costs replies
 * and the pressure is always to add one more. The obvious wrong answer is
 * the fourteen-field qualification form, which is a way of asking for the
 * meeting twice: once by the form and once by the reply that has to ask what
 * the form did not.
 *
 * Three fields, and each one earns its place by changing what happens next
 * — the address the reply goes to, enough to look the company up before the
 * call, and one line that decides who replies. A "company size" dropdown
 * would change nothing about the first reply, so it is not here.
 *
 * Two accessibility decisions, and the second is the one usually missed.
 * Labels are associated with `htmlFor`/`id` rather than by wrapping the
 * input, which lets the hint sit outside the label and still be announced
 * through `aria-describedby` — a wrapped label would either swallow the hint
 * into the label text or lose it entirely.
 *
 * The second: the live region is always in the DOM and starts empty. A
 * <p role="status"> that is mounted at the moment it receives text is
 * frequently not announced at all, because the assistive technology never
 * observed it becoming live. Rendering it empty from the first paint and
 * writing into it later is what makes the success and error messages
 * audible, and it is why the element has a `min-h-5` — an empty region that
 * takes no space makes the form jump when it fills.
 *
 * The demo defaults to `idle` with an empty message, which is the state
 * every reader arrives in. `onSubmit` is optional and unset here, so the
 * demo resolves immediately and shows the success state — throw from it to
 * see the error path.
 */

import * as React from 'react'

export interface ContactSalesFormProps {
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
interface ContactSalesFormField {
  name: string
  label: string
  type: string
  hint?: string
}

const FIELDS: ContactSalesFormField[] = [
  { name: "email", label: "Work email", type: "email", hint: "We reply here. It is never added to a list." },
  { name: "company", label: "Company", type: "text", hint: "Enough to look you up before the call." },
  { name: "context", label: "What are you building?", type: "text", hint: "One line is plenty. It decides who replies." },
]

export function ContactSalesForm({
  heading = "Talk to someone who builds this",
  intro = "Three fields, because a fourteen-field form is a way of asking for the meeting twice. You get a reply inside one working day.",
  submitLabel = "Request a call",
  onSubmit,
  className,
}: ContactSalesFormProps) {
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
      aria-labelledby="contact-sales-form-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <h2
          id="contact-sales-form-heading"
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
                htmlFor={`contact-sales-form-${field.name}`}
                className="block text-sm font-medium text-foreground"
              >
                {field.label}
              </label>
              <input
                id={`contact-sales-form-${field.name}`}
                name={field.name}
                type={field.type}
                required
                aria-describedby={field.hint ? `contact-sales-form-${field.name}-hint` : undefined}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {field.hint ? (
                <p
                  id={`contact-sales-form-${field.name}-hint`}
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
