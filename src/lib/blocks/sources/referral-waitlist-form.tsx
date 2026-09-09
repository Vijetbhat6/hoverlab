'use client'

/**
 * <ReferralWaitlistForm> — A waitlist capture that shows position and referral credit, turning a dead-end confirmation into the one action that moves the queue.
 *
 * A waitlist confirmation is usually a dead end: an address goes in, a
 * thank-you comes out, and nothing the person can do changes anything. The
 * layout problem is that the only moment they are motivated is the moment
 * they submit, and the conventional design spends it on a full stop.
 *
 * So the form states the referral mechanic before submission rather than
 * after. The obvious wrong answer is to reveal it on the confirmation
 * screen, where it reads as an upsell attached to something already
 * finished; stated first, it is a reason to fill the form in at all.
 *
 * "Three people through your link moves you up a hundred places" is written
 * as an exchange rate rather than as an invitation to share. A waitlist is
 * only worth sharing if the sharer can say what it does for them, and a
 * vague "move up the queue" is what makes referral links feel like spam to
 * send.
 *
 * The referral field is optional and its hint says it credits both people.
 * A code field with no explanation is one arrivals paste blindly and
 * organic signups leave blank while wondering whether they should have one.
 *
 * Accessibility is the same pair as the other forms in this wave, and the
 * second half is the one that matters: the `role="status"` region is
 * rendered empty on first paint rather than created when the message
 * arrives, because a live region that did not exist when the page loaded is
 * frequently never announced. It also holds its height, so the card does not
 * jump when the confirmation lands.
 *
 * The demo defaults to `idle`. With no `onSubmit` passed it resolves
 * immediately and shows the success message.
 */

import * as React from 'react'

export interface ReferralWaitlistFormProps {
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
interface ReferralWaitlistFormField {
  name: string
  label: string
  type: string
  hint?: string
}

const FIELDS: ReferralWaitlistFormField[] = [
  { name: "email", label: "Email", type: "email", hint: "One message when your place comes up. Nothing else." },
  { name: "referrer", label: "Referral code", type: "text", hint: "Optional. Credits whoever sent you, and moves you both up." },
]

export function ReferralWaitlistForm({
  heading = "Join the queue, or skip it",
  intro = "Everyone who joins gets a position and a link. Three people through your link moves you up a hundred places, which is the only honest way a waitlist is worth sharing.",
  submitLabel = "Get my place",
  onSubmit,
  className,
}: ReferralWaitlistFormProps) {
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
      aria-labelledby="referral-waitlist-form-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <h2
          id="referral-waitlist-form-heading"
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
                htmlFor={`referral-waitlist-form-${field.name}`}
                className="block text-sm font-medium text-foreground"
              >
                {field.label}
              </label>
              <input
                id={`referral-waitlist-form-${field.name}`}
                name={field.name}
                type={field.type}
                required
                aria-describedby={field.hint ? `referral-waitlist-form-${field.name}-hint` : undefined}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {field.hint ? (
                <p
                  id={`referral-waitlist-form-${field.name}-hint`}
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
