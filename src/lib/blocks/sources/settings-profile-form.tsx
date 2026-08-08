'use client'

/**
 * <SettingsProfileForm> — name, email, bio and avatar, with a save bar.
 *
 * The save bar only appears once something has actually changed, and it is
 * sticky to the bottom of the panel. A form with a permanently enabled
 * Save button gives no signal about unsaved work; one where the button
 * scrolls off the end of a long form gives no way to reach it.
 *
 * "Dirty" is computed by comparing against the initial values rather than
 * being set by every onChange, so typing a character and deleting it
 * correctly returns the form to clean.
 */

import * as React from 'react'
import { Loader2, Upload, Check } from 'lucide-react'

export interface ProfileValues {
  name: string
  email: string
  bio: string
}

export interface SettingsProfileFormProps {
  initial?: ProfileValues
  onSave?: (values: ProfileValues) => Promise<void>
  bioLimit?: number
  className?: string
}

const DEFAULT_VALUES: ProfileValues = {
  name: 'Ada Lovelace',
  email: 'ada@acme.com',
  bio: 'Working on compilers and the occasional analytical engine.',
}

export function SettingsProfileForm({
  initial = DEFAULT_VALUES,
  onSave,
  bioLimit = 160,
  className = '',
}: SettingsProfileFormProps) {
  const [values, setValues] = React.useState(initial)
  const [busy, setBusy] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  const dirty =
    values.name !== initial.name ||
    values.email !== initial.email ||
    values.bio !== initial.bio

  const overLimit = values.bio.length > bioLimit

  function set<K extends keyof ProfileValues>(key: K, value: ProfileValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
    setSaved(false)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!dirty || overLimit || busy) return

    setBusy(true)
    try {
      await onSave?.(values)
      setSaved(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`overflow-hidden rounded-2xl border border-border/60 bg-card/60 ${className}`}
    >
      <div className="border-b border-border/60 px-6 py-4">
        <h2 className="font-semibold tracking-tight">Profile</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          This is how you appear to everyone else in the workspace.
        </p>
      </div>

      <div className="space-y-6 p-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-bold text-foreground/70"
          >
            {values.name
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0] ?? '')
              .join('')
              .toUpperCase()}
          </span>

          <div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Upload aria-hidden className="h-4 w-4" />
              Upload photo
            </button>
            <p className="mt-1.5 text-xs text-muted-foreground">
              JPG, PNG or GIF. 2 MB maximum.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium">
              Full name
            </label>
            <input
              id="profile-name"
              autoComplete="name"
              value={values.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="profile-email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(e) => set('email', e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Changing this sends a confirmation link to the new address.
            </p>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor="profile-bio" className="block text-sm font-medium">
              Bio
            </label>
            <span
              className={`text-xs tabular-nums ${
                overLimit ? 'font-medium text-destructive' : 'text-muted-foreground'
              }`}
            >
              {values.bio.length}/{bioLimit}
            </span>
          </div>
          <textarea
            id="profile-bio"
            rows={3}
            aria-invalid={overLimit}
            value={values.bio}
            onChange={(e) => set('bio', e.target.value)}
            className={`w-full resize-y rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-shadow focus-visible:ring-2 ${
              overLimit
                ? 'border-destructive focus-visible:ring-destructive'
                : 'border-border/60 focus-visible:ring-primary'
            }`}
          />
        </div>
      </div>

      {/* Save bar — only present when there is something to save. */}
      {dirty || saved ? (
        <div
          aria-live="polite"
          className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-border/60 bg-card/95 px-6 py-3 backdrop-blur"
        >
          <span className="text-sm text-muted-foreground">
            {saved ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Check aria-hidden className="h-4 w-4" />
                Saved
              </span>
            ) : (
              'You have unsaved changes'
            )}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setValues(initial)
                setSaved(false)
              }}
              className="rounded-xl border border-border/60 bg-background px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={!dirty || overLimit || busy}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : null}
              Save changes
            </button>
          </div>
        </div>
      ) : null}
    </form>
  )
}
