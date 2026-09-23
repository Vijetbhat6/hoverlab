'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ArtifactLevel } from '@/lib/artifact-types'
import {
  FEEDBACK_LIMITS,
  PROBLEM_KINDS,
  PROBLEM_LABEL,
  type ProblemKind,
} from '@/lib/feedback/validate'

/**
 * The "Report a problem" dialog.
 *
 * Loaded on demand by `<ArtifactFeedback>` — see there for why nothing on a
 * detail page fetches or downloads this until it is opened.
 *
 * Four kinds, a message of up to 1,000 characters, and an optional email.
 * The email is asked for plainly and only as a way to be answered: it is
 * stored with the report, read by the owner, never shown to anyone, and the
 * form says so beside the field. Leaving it empty costs nothing.
 *
 * `website` is a honeypot — an input a person never sees, positioned inside
 * the form so a bot filling every field fills it too. The server answers a
 * filled honeypot exactly like a real submission and stores nothing.
 */
export function ReportDialog({
  level,
  id,
  name,
  open,
  onOpenChange,
  onSent,
}: {
  level: ArtifactLevel
  id: string
  name: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSent: () => void
}) {
  const [kind, setKind] = React.useState<ProblemKind>('broken-preview')
  const [message, setMessage] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [website, setWebsite] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const tooShort = message.trim().length < FEEDBACK_LIMITS.messageMin

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (tooShort || sending) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, id, kind, message, email, website }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error || 'That did not go through. Please try again.')
        return
      }
      onSent()
      onOpenChange(false)
    } catch {
      setError('We could not reach the server, so nothing was sent. Your text is still here.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report a problem</DialogTitle>
          <DialogDescription>
            With <span className="font-medium text-foreground">{name}</span>. We read every
            report.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="relative space-y-4">
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium">What is wrong?</legend>
            {PROBLEM_KINDS.map((option) => (
              <label key={option} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="feedback-kind"
                  value={option}
                  checked={kind === option}
                  onChange={() => setKind(option)}
                  className="size-4 accent-primary"
                />
                {PROBLEM_LABEL[option]}
              </label>
            ))}
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="feedback-message">What happened?</Label>
            <Textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={FEEDBACK_LIMITS.message}
              rows={5}
              required
              placeholder="Which browser, what you expected, what you saw instead."
              aria-describedby="feedback-count"
            />
            <p id="feedback-count" className="text-end text-xs text-muted-foreground">
              {message.length} / {FEEDBACK_LIMITS.message}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="feedback-email">Email (optional)</Label>
            <Input
              id="feedback-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              maxLength={FEEDBACK_LIMITS.email}
              placeholder="you@company.com"
              aria-describedby="feedback-email-note"
            />
            <p id="feedback-email-note" className="text-xs text-muted-foreground">
              Only so we can reply. Stored with this report, read by us, never shown to
              anyone.
            </p>
          </div>

          {/* Honeypot. Out of the tab order, hidden from assistive tech,
              zero-size; only a bot fills it. */}
          <input
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="pointer-events-none absolute h-0 w-0 opacity-0"
          />

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={tooShort || sending}>
              {sending ? 'Sending...' : 'Send report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
