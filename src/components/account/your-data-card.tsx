'use client'

/**
 * <YourDataCard> — download your data, delete your account. On /account.
 *
 * Both used to be "email us". They are self-serve now, and the card is
 * written so that neither can be done by accident or misunderstood:
 *
 *   Download   one button, a JSON file. Errors (a daily limit, a server that
 *              is not configured) are said in words and never leave the
 *              person looking at a raw JSON error page, which is what a
 *              plain link to the route would do.
 *
 *   Delete     a dialog that says what goes, what stays and why, asks for the
 *              account email to be typed, and only enables the button when
 *              the typed value matches — using the SAME comparison the
 *              server makes (`lib/account/confirm`), so the button and the
 *              server cannot disagree.
 *
 * The server is the authority on everything the dialog cannot know. It
 * refuses (409) while a recurring subscription is still charging, or while a
 * workspace has other people in it, and the dialog puts that message where
 * the button was, with the way to fix it, rather than a toast that vanishes.
 * If deletion is only partly done (500 with the outcome of every step) the
 * dialog lists what finished and offers the retry, because the server is
 * built so that asking again resumes.
 *
 * After success the auth hint is cleared by calling the existing `logout()`
 * (which goes through AuthProvider's `setUser(null)` and so through the one
 * place `hl:auth-hint` is written) and the person lands on `/`.
 */

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Download, Loader2, Trash2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { confirmationMatches } from '@/lib/account/confirm'

interface StepOutcome {
  id: string
  label: string
  status: 'done' | 'failed' | 'skipped' | 'warning'
  detail?: string
  error?: string
}

interface Blocker {
  code: string
  message: string
}

interface ApiError {
  error?: string
  code?: string
  supportEmail?: string | null
  blockers?: Blocker[]
  steps?: StepOutcome[]
  manualFollowUp?: string[]
}

/** Pull a downloadable file name out of Content-Disposition, or fall back. */
function fileNameFrom(res: Response): string {
  const header = res.headers.get('content-disposition') ?? ''
  const match = /filename="?([^";]+)"?/i.exec(header)
  return match?.[1] ?? 'hoverlab-data.json'
}

function ContactLine({ email }: { email: string | null | undefined }) {
  return email ? (
    <a href={`mailto:${email}`} className="font-medium underline underline-offset-2">
      {email}
    </a>
  ) : (
    <Link href="/support" className="font-medium underline underline-offset-2">
      the support page
    </Link>
  )
}

export function YourDataCard() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [downloading, setDownloading] = React.useState(false)
  const [downloadError, setDownloadError] = React.useState<string | null>(null)

  const [open, setOpen] = React.useState(false)
  const [typed, setTyped] = React.useState('')
  const [deleting, setDeleting] = React.useState(false)
  const [failure, setFailure] = React.useState<ApiError | null>(null)

  const email = user?.email ?? ''
  const matches = confirmationMatches(typed, email)
  const blocked = failure?.code === 'blocked'

  async function onDownload() {
    setDownloading(true)
    setDownloadError(null)
    try {
      const res = await fetch('/api/account/export', {
        credentials: 'same-origin',
        cache: 'no-store',
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as ApiError
        setDownloadError(body.error ?? `The download failed (HTTP ${res.status}).`)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileNameFrom(res)
      document.body.appendChild(link)
      link.click()
      link.remove()
      // Revoked on the next tick: some browsers have not started reading the
      // blob by the time click() returns.
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success('Your data is downloading.')
    } catch {
      setDownloadError('Could not reach the server. Check your connection and try again.')
    } finally {
      setDownloading(false)
    }
  }

  function onOpenChange(next: boolean) {
    // Not while a deletion is in flight: closing then would hide the outcome.
    if (deleting) return
    setOpen(next)
    if (!next) {
      setTyped('')
      setFailure(null)
    }
  }

  async function onDelete(event: React.FormEvent) {
    event.preventDefault()
    if (!matches || deleting) return
    setDeleting(true)
    setFailure(null)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ confirmEmail: typed }),
      })
      const body = (await res.json().catch(() => ({}))) as ApiError

      if (!res.ok) {
        setFailure({
          ...body,
          error: body.error ?? `The server returned an error (HTTP ${res.status}).`,
        })
        return
      }

      // Cleared through the existing path, which also drops the auth hint.
      await logout()
      setOpen(false)
      toast.success('Your account has been deleted.', {
        description:
          body.manualFollowUp && body.manualFollowUp.length > 0
            ? 'One thing needs a human — check your email address on our mailing provider.'
            : undefined,
      })
      router.replace('/')
      router.refresh()
    } catch {
      setFailure({
        error: 'Could not reach the server. Nothing was confirmed either way — try again.',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">Your data</CardTitle>
        <CardDescription>
          Download everything we hold about this account, or delete the account. Both are done
          here, immediately.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onDownload} disabled={downloading}>
            {downloading ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="me-2 h-4 w-4" />
            )}
            Download my data
          </Button>
          <Button variant="outline" onClick={() => setOpen(true)} className="text-destructive">
            <Trash2 className="me-2 h-4 w-4" />
            Delete my account
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          The download is a JSON file: your profile, saved items, credit history, orders,
          passkey names and dates, workspace membership and mailing list entry. It never
          contains your password, a passkey&apos;s key, or your licence key.
        </p>
        {downloadError ? (
          <p role="alert" className="text-sm text-destructive">
            {downloadError}
          </p>
        ) : null}
      </CardContent>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <form onSubmit={onDelete} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Delete your account?</DialogTitle>
              <DialogDescription>
                This cannot be undone. You will be signed out everywhere.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 text-sm">
              <div>
                <p className="font-medium">Deleted now</p>
                <ul className="mt-1 list-disc space-y-0.5 ps-5 text-muted-foreground">
                  <li>Your sign-in, profile and display name</li>
                  <li>Favorites, bundle, collections, brand and tool presets</li>
                  <li>Your credit balance and history, passkeys and licence key</li>
                  <li>Your mailing list entry</li>
                  <li>Workspaces you own alone (seats you only belong to are left)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">Kept, without your identity</p>
                <p className="mt-1 text-muted-foreground">
                  Purchase records &mdash; order id, plan, amount, currency and date &mdash; are
                  kept for the six to eight years tax law requires. They no longer point at you.
                  Anything you bought is forfeited with the account.
                </p>
              </div>
              <p className="text-muted-foreground">
                Your payment provider, Polar, keeps its own customer record. Ask us if you want
                that closed too.
              </p>
            </div>

            {blocked ? (
              <div
                role="alert"
                className="grid gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm"
              >
                <p className="flex items-start gap-2 font-medium text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  We can&apos;t delete this account yet
                </p>
                {(failure?.blockers ?? []).map((blocker) => (
                  <p key={`${blocker.code}-${blocker.message}`}>{blocker.message}</p>
                ))}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button asChild size="sm">
                    <Link href="/account/billing">Go to billing</Link>
                  </Button>
                </div>
                <p className="text-muted-foreground">
                  Or email <ContactLine email={failure?.supportEmail} />.
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="confirm-email">
                  Type <span className="font-mono text-foreground">{email}</span> to confirm
                </Label>
                <Input
                  id="confirm-email"
                  type="email"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  disabled={deleting}
                  aria-invalid={typed.length > 0 && !matches}
                />
              </div>
            )}

            {failure && !blocked ? (
              <div
                role="alert"
                className="grid gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm"
              >
                <p className="text-destructive">{failure.error}</p>
                {failure.steps && failure.steps.length > 0 ? (
                  <ul className="grid gap-1">
                    {failure.steps.map((step) => (
                      <li key={step.id} className="flex items-start gap-2">
                        {step.status === 'done' || step.status === 'warning' ? (
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                            aria-hidden
                          />
                        ) : step.status === 'failed' ? (
                          <XCircle
                            className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                            aria-hidden
                          />
                        ) : (
                          <span
                            className="mt-0.5 h-4 w-4 shrink-0 text-center text-muted-foreground"
                            aria-hidden
                          >
                            &middot;
                          </span>
                        )}
                        <span>
                          {step.label}
                          <span className="sr-only"> — {step.status}</span>
                          {step.error ? (
                            <span className="block text-muted-foreground">{step.error}</span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {failure.supportEmail !== undefined ? (
                  <p className="text-muted-foreground">
                    Still stuck? Email <ContactLine email={failure.supportEmail} />.
                  </p>
                ) : null}
              </div>
            ) : null}

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              {blocked ? null : (
                <Button type="submit" variant="destructive" disabled={!matches || deleting}>
                  {deleting ? (
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="me-2 h-4 w-4" />
                  )}
                  {failure?.steps ? 'Try again' : 'Delete my account'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
