'use client'

/**
 * <ImportFromUrlForm> — The import path for a file that is already on the internet, which does not need to travel through the browser at all.
 *
 * A file that already lives at a URL does not need to travel down to a
 * laptop and back up again. The layout problem is that the obvious wrong
 * answer — a drop zone — cannot express this at all: there is no file to
 * drop, and the operation is a server-side fetch that outlives the tab.
 *
 * So this is a two-field form rather than a target, and the second field
 * matters more than it looks. Format is detected from the response content
 * type rather than from the extension, which is stated in the hint because
 * the reader is about to wonder why the field is pre-filled and editable.
 *
 * The URL hint names the failure everyone hits: a link behind a login
 * returns an HTML sign-in page with a 200, and a naive importer cheerfully
 * parses it as the data. Saying "signed links work; a login page does not"
 * in advance is cheaper than the error message that would otherwise be
 * needed.
 *
 * Accessibility: labels associated by `htmlFor`/`id` with the constraint
 * hints wired through `aria-describedby`, and a `role="status"` region
 * present and empty from first paint. The region matters more here than on
 * most forms because a server-side fetch takes real time — the pending state
 * is the only feedback there is, and it has to be announced rather than only
 * shown on the button.
 *
 * The demo defaults to `idle`; the scaffold's submit sets `pending` before
 * awaiting, so the disabled button and the status line both reflect a real
 * in-flight state.
 */

import * as React from 'react'

export interface ImportFromUrlFormProps {
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
interface ImportFromUrlFormField {
  name: string
  label: string
  type: string
  hint?: string
}

const FIELDS: ImportFromUrlFormField[] = [
  { name: "url", label: "File URL", type: "url", hint: "Must be publicly reachable. Signed links work; a login page does not." },
  { name: "format", label: "Format", type: "text", hint: "Detected from the response, not the extension. Override only if it guesses wrong." },
]

export function ImportFromUrlForm({
  heading = "Import from a link",
  intro = "A file that already lives at a URL does not need to be downloaded to a laptop and uploaded again. The server fetches it, which also survives the tab being closed.",
  submitLabel = "Fetch and import",
  onSubmit,
  className,
}: ImportFromUrlFormProps) {
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
      aria-labelledby="import-from-url-form-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <h2
          id="import-from-url-form-heading"
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
                htmlFor={`import-from-url-form-${field.name}`}
                className="block text-sm font-medium text-foreground"
              >
                {field.label}
              </label>
              <input
                id={`import-from-url-form-${field.name}`}
                name={field.name}
                type={field.type}
                required
                aria-describedby={field.hint ? `import-from-url-form-${field.name}-hint` : undefined}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {field.hint ? (
                <p
                  id={`import-from-url-form-${field.name}-hint`}
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
