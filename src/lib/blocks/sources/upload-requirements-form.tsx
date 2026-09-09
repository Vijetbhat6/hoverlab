'use client'

/**
 * <UploadRequirementsForm> — An upload form that states the constraints before the file is chosen, rather than rejecting it after a two-minute transfer.
 *
 * Rejecting a 400 MB file after transferring it is a failure of the form,
 * not of the person. That is the whole layout problem: the constraints are
 * known before the file is chosen and are conventionally printed in the
 * error afterwards.
 *
 * The obvious wrong answer is a bare drop zone with the limits in a tooltip.
 * A drop zone is the better affordance once someone knows what is
 * acceptable, and it is the worse one before — which is why this block and
 * the catalog's dropzone are different blocks rather than one with a prop.
 * Take this where the rules are unusual; take the dropzone where they are
 * obvious.
 *
 * Every hint is a constraint, and the file field's names the escape hatch
 * too: over 50 MB, use the import API. A limit stated without an
 * alternative reads as a wall.
 *
 * The notify field is optional and says why in its hint — large imports
 * finish long after the tab is closed. An optional field with no stated
 * reason is one most people skip, and this is the one that decides whether
 * they ever learn the import finished.
 *
 * Accessibility: `htmlFor`/`id` label association with the hint carried by
 * `aria-describedby`, so the constraint is announced with the field rather
 * than read as loose text after it. And the live region is in the DOM from
 * the first paint and empty — a status region mounted when it first has
 * text is routinely never announced.
 *
 * The demo defaults to `idle`. Note that the file input is a real file
 * input: it renders the browser's own control, which looks different in
 * every browser, and that is correct — restyling it is how a file picker
 * stops being operable by keyboard.
 */

import * as React from 'react'

export interface UploadRequirementsFormProps {
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
interface UploadRequirementsFormField {
  name: string
  label: string
  type: string
  hint?: string
}

const FIELDS: UploadRequirementsFormField[] = [
  { name: "file", label: "File", type: "file", hint: "CSV, XLSX or JSON. Up to 50 MB — larger files go through the import API." },
  { name: "label", label: "Name this import", type: "text", hint: "Shown in the import history. The filename is kept either way." },
  { name: "notify", label: "Notify on completion", type: "email", hint: "Optional. Large imports finish long after you close the tab." },
]

export function UploadRequirementsForm({
  heading = "Send us the file",
  intro = "The limits are here rather than in the error you would otherwise meet after uploading. Rejecting a 400 MB file after transferring it is a failure of the form, not of the person.",
  submitLabel = "Upload",
  onSubmit,
  className,
}: UploadRequirementsFormProps) {
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
      aria-labelledby="upload-requirements-form-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <h2
          id="upload-requirements-form-heading"
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
                htmlFor={`upload-requirements-form-${field.name}`}
                className="block text-sm font-medium text-foreground"
              >
                {field.label}
              </label>
              <input
                id={`upload-requirements-form-${field.name}`}
                name={field.name}
                type={field.type}
                required
                aria-describedby={field.hint ? `upload-requirements-form-${field.name}-hint` : undefined}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {field.hint ? (
                <p
                  id={`upload-requirements-form-${field.name}-hint`}
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
