'use client'

/**
 * <DigestScheduleForm> — The control that turns notification volume down instead of off, which is the choice most people actually want.
 *
 * The layout problem is that notification settings are almost always
 * presented as a switch, and a switch has only two positions — the loud one
 * and the one everybody eventually picks. The obvious wrong answer is a
 * longer list of switches, which is the same failure at higher resolution.
 *
 * Volume is a schedule, not a toggle. A send time and a floor turn an
 * unbounded stream into exactly one predictable message, which is a setting
 * someone can live with instead of muting.
 *
 * The second field is the one that is usually missing. Without a floor, a
 * quiet day still produces a digest containing one item, and an empty
 * digest is an interruption that has taught the reader nothing — after a
 * week of those the digest is filtered too.
 *
 * Accessibility: `htmlFor`/`id` label association with the hints on
 * `aria-describedby`, and the `role="status"` region mounted empty from the
 * first paint so the saved confirmation is actually announced. Note that the
 * time input is a real `type="time"` control — it renders the browser's own
 * picker, which looks different everywhere, and that is correct. Restyling
 * it is how a time field stops being operable by keyboard.
 *
 * The demo defaults to `idle`. The fields have no initial values, which is
 * the honest starting state for a preference that has never been set.
 */

import * as React from 'react'

export interface DigestScheduleFormProps {
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
interface DigestScheduleFormField {
  name: string
  label: string
  type: string
  hint?: string
}

const FIELDS: DigestScheduleFormField[] = [
  { name: "time", label: "Send at", type: "time", hint: "Your local time. Nothing arrives outside this except an outage." },
  { name: "threshold", label: "Skip the digest below", type: "number", hint: "Fewer events than this and no message is sent at all. An empty digest is still an interruption." },
]

export function DigestScheduleForm({
  heading = "Send it all at once instead",
  intro = "The alternative offered by most products is on or off, so everyone picks off. A time and a floor turns the same stream into one predictable message.",
  submitLabel = "Save schedule",
  onSubmit,
  className,
}: DigestScheduleFormProps) {
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
      aria-labelledby="digest-schedule-form-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <h2
          id="digest-schedule-form-heading"
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
                htmlFor={`digest-schedule-form-${field.name}`}
                className="block text-sm font-medium text-foreground"
              >
                {field.label}
              </label>
              <input
                id={`digest-schedule-form-${field.name}`}
                name={field.name}
                type={field.type}
                required
                aria-describedby={field.hint ? `digest-schedule-form-${field.name}-hint` : undefined}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {field.hint ? (
                <p
                  id={`digest-schedule-form-${field.name}-hint`}
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
