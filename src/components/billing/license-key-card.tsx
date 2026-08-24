'use client'

/**
 * <LicenseKeyCard> — the licence key, on /account.
 *
 * The key is what carries a Pro licence outside the browser: it is how
 * `npx hoverlab add saas-starter` and `/api/v1/templates/{id}` know a
 * caller is entitled to a template's source. See `lib/billing/api-key.ts`
 * for why it exists and why it is stored hashed.
 *
 * Two things here are non-negotiable and both are about the same fact — the
 * secret is unrecoverable:
 *
 *   1. It is shown once, in this component's state, and never fetched
 *      again. A card that could re-display a key would be a card backed by
 *      a plaintext secret in the database.
 *   2. The warning is rendered next to the key at the moment it appears,
 *      not in a paragraph above the button. Someone who copies the key and
 *      closes the tab has done the right thing; someone who assumes they
 *      can come back for it has to rotate, which invalidates the copy they
 *      already deployed.
 *
 * Rendered only for licence holders. A free account is shown nothing — not
 * a locked card — because a key would unlock exactly what they already
 * have, so there is nothing to upsell here. The upsell for templates is on
 * the template page, where the person actually wanted one.
 */

import * as React from 'react'
import { Check, Copy, KeyRound, Loader2, RotateCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useEntitlements } from '@/hooks/use-entitlements'

interface KeyRecord {
  prefix: string
  createdAt: string
  lastUsedAt: string | null
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function LicenseKeyCard({ className }: { className?: string }) {
  const { entitlements } = useEntitlements()
  const [record, setRecord] = React.useState<KeyRecord | null>(null)
  const [secret, setSecret] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [busy, setBusy] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const licensed = entitlements?.canUseProFeatures ?? false

  React.useEffect(() => {
    if (!licensed) {
      setLoading(false)
      return
    }
    let live = true
    fetch('/api/billing/key', { credentials: 'same-origin', cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { key: null }))
      .then((body: { key: KeyRecord | null }) => {
        if (live) setRecord(body.key)
      })
      .catch(() => {
        /* Leave the card in its empty state; the buttons still work. */
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [licensed])

  async function issue() {
    setBusy(true)
    try {
      const res = await fetch('/api/billing/key', {
        method: 'POST',
        credentials: 'same-origin',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = (await res.json()) as { key: KeyRecord; secret: string }
      setRecord(body.key)
      setSecret(body.secret)
      setCopied(false)
    } catch {
      toast.error('Could not create a key', {
        description: 'Try again in a moment.',
      })
    } finally {
      setBusy(false)
    }
  }

  async function revoke() {
    setBusy(true)
    try {
      const res = await fetch('/api/billing/key', {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setRecord(null)
      setSecret(null)
      toast.success('Key revoked', {
        description: 'Anything still using it will start failing now.',
      })
    } catch {
      toast.error('Could not revoke the key')
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    if (!secret) return
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy — select the key and copy it manually.')
    }
  }

  if (!licensed) return null

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound aria-hidden className="h-4 w-4 text-primary" />
          Licence key
        </CardTitle>
        <CardDescription>
          Proves your licence outside the browser — the CLI, the MCP server and{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px]">/api/v1</code>.
          Everything free stays free without one.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> Checking…
          </p>
        ) : null}

        {/* The secret, on the one render it exists for. */}
        {secret ? (
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Copy this now — it is not shown again
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-background px-3 py-2 font-mono text-xs">
                {secret}
              </code>
              <Button size="sm" variant="outline" onClick={copy} className="shrink-0 gap-1.5">
                {copied ? (
                  <Check aria-hidden className="h-3.5 w-3.5" />
                ) : (
                  <Copy aria-hidden className="h-3.5 w-3.5" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Store it in <code className="rounded bg-muted px-1">HOVERLAB_KEY</code>, or
              run <code className="rounded bg-muted px-1">npx hoverlab login</code> to save
              it for this machine.
            </p>
          </div>
        ) : null}

        {!loading && record ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
            <div className="min-w-0">
              <p className="font-mono text-sm">{record.prefix}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Created {formatDate(record.createdAt)} ·{' '}
                {record.lastUsedAt
                  ? `last used ${formatDate(record.lastUsedAt)}`
                  : 'never used'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={issue} disabled={busy} className="gap-1.5">
                <RotateCw aria-hidden className="h-3.5 w-3.5" /> Rotate
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={revoke}
                disabled={busy}
                className="gap-1.5 text-muted-foreground hover:text-destructive"
              >
                <Trash2 aria-hidden className="h-3.5 w-3.5" /> Revoke
              </Button>
            </div>
          </div>
        ) : null}

        {!loading && !record ? (
          <Button onClick={issue} disabled={busy} className="gap-1.5">
            {busy ? (
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound aria-hidden className="h-4 w-4" />
            )}
            Create a licence key
          </Button>
        ) : null}

        {/* Rotation is destructive to whatever is deployed with the old key,
            and that is not obvious from a button labelled "Rotate". */}
        {record ? (
          <p className="text-xs text-muted-foreground">
            Rotating replaces the key immediately. Anything still using the old
            one starts failing, so update your CI and your local environment
            before you rotate.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
