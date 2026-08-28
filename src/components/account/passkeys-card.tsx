'use client'

/**
 * Passkeys registered on this account.
 *
 * The card has to do three things, and the third is the one that is usually
 * missed: add, remove, and make the list legible enough that removing is a
 * decision rather than a guess. "Passkey", "Passkey", "Passkey" is not a
 * list anyone can act on, which is why every row carries a name it can be
 * given, where it came from, and when it was last used.
 *
 * Removing the last passkey is allowed. Every account here also has a
 * password — passkeys are added to an account, never used to create one —
 * so there is no state in which this card can lock somebody out, and a
 * "you must keep one" rule would be a rule protecting nothing.
 */

import * as React from 'react'
import { Check, Fingerprint, Loader2, Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface Passkey {
  id: string
  name: string
  createdAt: string
  lastUsedAt: string | null
  backedUp: boolean
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'unknown'
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Pull a displayable message out of an error body, whatever shape it took. */
function readError(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error.trim()) return error
  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return fallback
}

export function PasskeysCard() {
  const { user } = useAuth()
  const [passkeys, setPasskeys] = React.useState<Passkey[] | null>(null)
  const [supported, setSupported] = React.useState(false)
  const [adding, setAdding] = React.useState(false)
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draftName, setDraftName] = React.useState('')

  // Same reasoning as the sign-in form: the capability check touches
  // `window`, so it runs after mount and the card renders identically on
  // both sides until it has an answer.
  React.useEffect(() => {
    let cancelled = false
    import('@simplewebauthn/browser').then(({ browserSupportsWebAuthn }) => {
      if (!cancelled) setSupported(browserSupportsWebAuthn())
    })
    return () => {
      cancelled = true
    }
  }, [])

  React.useEffect(() => {
    if (!user) return
    let cancelled = false
    fetch('/api/auth/passkey', { cache: 'no-store', credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : { passkeys: [] }))
      .then((data: { passkeys?: Passkey[] }) => {
        if (!cancelled) setPasskeys(data.passkeys ?? [])
      })
      .catch(() => {
        if (!cancelled) setPasskeys([])
      })
    return () => {
      cancelled = true
    }
  }, [user])

  async function onAdd() {
    setAdding(true)
    try {
      const { startRegistration, WebAuthnError } = await import(
        '@simplewebauthn/browser'
      )

      const optionsRes = await fetch('/api/auth/passkey/register/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: '{}',
      })
      const optionsBody = await optionsRes.json().catch(() => ({}))
      if (!optionsRes.ok) {
        toast.error(
          readError(optionsBody.error, 'Could not start passkey setup.'),
        )
        return
      }

      let attestation
      try {
        attestation = await startRegistration({
          optionsJSON: optionsBody.options,
        })
      } catch (err) {
        // InvalidStateError is the one worth translating: it means the
        // authenticator recognised itself in excludeCredentials and refused
        // to make a second key. The browser's own wording for that is
        // alarming and says nothing useful.
        if (err instanceof Error && err.name === 'InvalidStateError') {
          toast.message('This device already has a passkey for your account.')
          return
        }
        if (
          err instanceof WebAuthnError ||
          (err instanceof Error && err.name === 'NotAllowedError')
        ) {
          toast.message('Passkey setup was cancelled.')
          return
        }
        throw err
      }

      const verifyRes = await fetch('/api/auth/passkey/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ response: attestation }),
      })
      const verifyBody = await verifyRes.json().catch(() => ({}))
      if (!verifyRes.ok) {
        toast.error(
          readError(verifyBody.error, 'That passkey could not be saved.'),
        )
        return
      }

      setPasskeys(verifyBody.passkeys ?? [])
      toast.success('Passkey added. You can use it to sign in from now on.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setAdding(false)
    }
  }

  async function onRemove(passkey: Passkey) {
    setBusyId(passkey.id)
    try {
      const res = await fetch(
        `/api/auth/passkey/${encodeURIComponent(passkey.id)}`,
        { method: 'DELETE', credentials: 'same-origin' },
      )
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(readError(body.error, 'Could not remove that passkey.'))
        return
      }
      setPasskeys(body.passkeys ?? [])
      toast.success(`Removed “${passkey.name}”.`)
    } finally {
      setBusyId(null)
    }
  }

  async function onRename(passkey: Passkey) {
    const name = draftName.trim()
    if (!name || name === passkey.name) {
      setEditingId(null)
      return
    }
    setBusyId(passkey.id)
    try {
      const res = await fetch(
        `/api/auth/passkey/${encodeURIComponent(passkey.id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ name }),
        },
      )
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(readError(body.error, 'Could not rename that passkey.'))
        return
      }
      setPasskeys(body.passkeys ?? [])
      setEditingId(null)
    } finally {
      setBusyId(null)
    }
  }

  if (!user) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-4 w-4" />
          Passkeys
        </CardTitle>
        <CardDescription>
          Sign in with your fingerprint, face or device PIN instead of a
          password. Your password keeps working either way.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {passkeys === null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your passkeys…
          </div>
        ) : passkeys.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No passkeys yet. Add one on a device you trust and the sign-in page
            will offer it.
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {passkeys.map((passkey) => (
              <li
                key={passkey.id}
                className="flex flex-wrap items-center gap-3 px-3 py-2.5"
              >
                {editingId === passkey.id ? (
                  <>
                    <Input
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      maxLength={60}
                      autoFocus
                      className="h-8 flex-1 min-w-40"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          onRename(passkey)
                        }
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => onRename(passkey)}
                      disabled={busyId === passkey.id}
                      aria-label={`Save the name for ${passkey.name}`}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setEditingId(null)}
                      aria-label="Cancel renaming"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {passkey.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Added {formatDate(passkey.createdAt)}
                        {passkey.lastUsedAt
                          ? ` · last used ${formatDate(passkey.lastUsedAt)}`
                          : ' · not used yet'}
                        {passkey.backedUp ? ' · synced' : ' · this device only'}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingId(passkey.id)
                        setDraftName(passkey.name)
                      }}
                      aria-label={`Rename ${passkey.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(passkey)}
                      disabled={busyId === passkey.id}
                      aria-label={`Remove ${passkey.name}`}
                    >
                      {busyId === passkey.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {supported ? (
          <Button onClick={onAdd} disabled={adding} variant="outline">
            {adding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Waiting for your device…
              </>
            ) : (
              <>
                <Fingerprint className="mr-2 h-4 w-4" />
                Add a passkey
              </>
            )}
          </Button>
        ) : (
          // Worth saying rather than hiding the button silently: someone who
          // added a passkey on their phone and now sees no way to add one
          // here should know it is the browser, not the account.
          <p className="text-sm text-muted-foreground">
            This browser does not support passkeys. Any passkeys listed above
            still work on the devices that hold them.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
