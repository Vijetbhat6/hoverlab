'use client'

/**
 * <WorkspaceSetupForm> — The first screen after signup, asking only the two things that cannot be changed silently later.
 *
 * The first screen after signup is where products ask fourteen questions
 * and lose the person who has not yet seen anything work. The layout problem
 * is deciding what genuinely cannot wait, and the obvious wrong answer is a
 * multi-step wizard covering team size, industry and use case — none of
 * which changes what happens next.
 *
 * Two fields survive that test, and only because of the asymmetry the hints
 * spell out: the name is changeable at any time and the URL is not, because
 * the URL is already in every link that has been shared. That distinction is
 * the entire reason this screen exists rather than defaulting both.
 *
 * Everything else in setup has a sensible default and can be changed later
 * without telling anyone, so it is not here.
 *
 * Accessibility: labels wired with `htmlFor`/`id` so the hints are announced
 * through `aria-describedby` — and the URL hint is the one that must not be
 * missed, since it is the warning about the irreversible field. The
 * `role="status"` region is in the DOM and empty from the first render, so
 * the created-workspace confirmation is announced rather than silently
 * replacing the form.
 *
 * The demo defaults to `idle` with both fields empty. A real implementation
 * should derive the slug from the name as it is typed and let it be
 * overridden, which is why they are separate fields rather than one.
 */

import * as React from 'react'

export interface WorkspaceSetupFormProps {
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
interface WorkspaceSetupFormField {
  name: string
  label: string
  type: string
  hint?: string
}

const FIELDS: WorkspaceSetupFormField[] = [
  { name: "name", label: "Workspace name", type: "text", hint: "Shown to everyone you invite. Changeable at any time." },
  { name: "slug", label: "URL", type: "text", hint: "Becomes part of every link you share. Changing it later breaks the old ones." },
]

export function WorkspaceSetupForm({
  heading = "Name your workspace",
  intro = "Everything else in setup has a sensible default and can be changed later without telling anyone. These two appear in URLs and invitations, so they are worth one screen.",
  submitLabel = "Create workspace",
  onSubmit,
  className,
}: WorkspaceSetupFormProps) {
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
      aria-labelledby="workspace-setup-form-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <h2
          id="workspace-setup-form-heading"
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
                htmlFor={`workspace-setup-form-${field.name}`}
                className="block text-sm font-medium text-foreground"
              >
                {field.label}
              </label>
              <input
                id={`workspace-setup-form-${field.name}`}
                name={field.name}
                type={field.type}
                required
                aria-describedby={field.hint ? `workspace-setup-form-${field.name}-hint` : undefined}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {field.hint ? (
                <p
                  id={`workspace-setup-form-${field.name}-hint`}
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
