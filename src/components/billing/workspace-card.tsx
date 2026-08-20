'use client'

/**
 * <WorkspaceCard> — seats, on /account.
 *
 * Two audiences, one card:
 *
 *   The buyer sees the invite code and how many of their seats are taken.
 *   Studio sells ten seats; without somewhere to get the code, nine of them
 *   would be unreachable and the plan would be selling something it does
 *   not deliver.
 *
 *   Everyone else sees a box to paste a code into. That is the whole
 *   join flow — no emailed invitations, no pending-invite table, no expiry
 *   rules. A code can be pasted into a team chat the moment the receipt
 *   arrives, and the seat limit is enforced server-side in a transaction.
 *
 * Nothing here grants anything: /api/team/join re-checks the code, the
 * workspace's status and the remaining seats before it writes.
 */

import * as React from 'react'
import { Check, Copy, Loader2, RefreshCw, Users } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useEntitlements } from '@/hooks/use-entitlements'

interface Workspace {
  id: string
  name: string
  kind: 'studio' | 'team'
  seats: number
  seatsUsed: number
  isOwner: boolean
  inviteCode: string | null
}

export function WorkspaceCard() {
  const { refresh: refreshEntitlements } = useEntitlements()
  const [workspace, setWorkspace] = React.useState<Workspace | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [code, setCode] = React.useState('')
  const [joining, setJoining] = React.useState(false)
  const [rotating, setRotating] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    fetch('/api/team')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { workspace: Workspace | null } | null) => {
        if (!cancelled) setWorkspace(data?.workspace ?? null)
      })
      .catch(() => {
        // Leave it null — the redeem box is still usable, and a failed read
        // is not worth a scary empty state on the billing page.
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function join(event: React.FormEvent) {
    event.preventDefault()
    if (!code.trim() || joining) return
    setJoining(true)
    try {
      const res = await fetch('/api/team/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        workspace?: Workspace
        error?: string
      }
      if (!res.ok || !data.workspace) {
        toast.error(data.error ?? 'That code could not be redeemed.')
        return
      }
      setWorkspace(data.workspace)
      setCode('')
      // The seat only becomes real to the rest of the app once entitlements
      // are re-read — the header badge and every Pro-gated control follow
      // from them.
      await refreshEntitlements()
      toast.success(`You're on ${data.workspace.name}.`, {
        description: 'Everything Pro unlocks is available on this account now.',
      })
    } finally {
      setJoining(false)
    }
  }

  async function copyCode() {
    if (!workspace?.inviteCode) return
    try {
      await navigator.clipboard.writeText(workspace.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy — select the code and copy it by hand.')
    }
  }

  async function rotate() {
    if (rotating) return
    setRotating(true)
    try {
      const res = await fetch('/api/team', { method: 'POST' })
      const data = (await res.json().catch(() => ({}))) as {
        workspace?: Workspace
        error?: string
      }
      if (!res.ok || !data.workspace) {
        toast.error(data.error ?? 'Could not change the code.')
        return
      }
      setWorkspace(data.workspace)
      toast.success('New code created.', {
        description: 'The old one stops working immediately.',
      })
    } finally {
      setRotating(false)
    }
  }

  if (loading) return null

  if (workspace) {
    const remaining = Math.max(workspace.seats - workspace.seatsUsed, 0)
    return (
      <Card className="mt-6 border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-4 w-4 text-primary" />
            {workspace.name}
          </CardTitle>
          <CardDescription>
            {workspace.kind === 'studio'
              ? 'Studio license — bought once, never renews.'
              : 'Team subscription.'}{' '}
            {workspace.seatsUsed} of {workspace.seats} seats taken
            {remaining > 0
              ? `, ${remaining} still free.`
              : ' — every seat is claimed.'}
          </CardDescription>
        </CardHeader>
        {workspace.isOwner && workspace.inviteCode && (
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Send this code to your team. Anyone who redeems it takes a seat,
              so treat it like a password.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded-md border border-border/60 bg-muted px-3 py-2 font-mono text-sm tracking-widest">
                {workspace.inviteCode}
              </code>
              <Button variant="outline" size="sm" onClick={copyCode}>
                {copied ? (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={rotate}
                disabled={rotating}
              >
                {rotating ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                )}
                New code
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <Card className="mt-6 border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">Have a workspace code?</CardTitle>
        <CardDescription>
          If your team bought Studio or Team, redeem their code to take a seat
          — you don&apos;t need to buy anything yourself.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={join} className="flex flex-wrap items-center gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="HL-XXXX-XXXX"
            aria-label="Workspace code"
            className="w-48 font-mono tracking-widest"
            autoComplete="off"
            spellCheck={false}
          />
          <Button type="submit" variant="outline" disabled={joining || !code.trim()}>
            {joining ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Redeeming…
              </>
            ) : (
              'Redeem'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
