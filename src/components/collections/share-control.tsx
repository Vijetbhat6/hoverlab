'use client'

import * as React from 'react'
import { Check, Copy, Link2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * "Share link" for one collection — owner-controlled, revocable.
 *
 * Collapsed by default and silent until pressed. Opening it is the user
 * action that asks the server for the current state
 * (`GET /api/sync/collections/share`); nothing is fetched when the
 * collections page loads, and a page with twenty collections makes no
 * twenty requests. Every dynamic route on this site costs a function call,
 * so state is read at the moment somebody wants it.
 *
 * Three states, and the copy says what each one means for the owner:
 *
 *   not shared   nothing is public. One button creates a link.
 *   shared       anyone with the link can see the name and the artifacts,
 *                read-only, with no account. The link and a Copy button are
 *                shown, and "Stop sharing" is one click: the old link 404s
 *                on the next request.
 *   error        the server's own sentence — 402 says sharing is Pro, 409
 *                says the collection has not finished saving.
 *
 * The full URL is built here from `window.location.origin` because the
 * server returns only a path; the origin is whatever the owner is looking
 * at, which is the one they should be sending.
 */

type ShareState =
  | { kind: 'closed' }
  | { kind: 'loading' }
  | { kind: 'off' }
  | { kind: 'on'; path: string }
  | { kind: 'busy'; was: 'off' | 'on'; path?: string }
  | { kind: 'error'; message: string }

const ENDPOINT = '/api/sync/collections/share'

export function ShareControl({
  collectionId,
  collectionName,
}: {
  collectionId: string
  collectionName: string
}) {
  const [state, setState] = React.useState<ShareState>({ kind: 'closed' })
  const [copied, setCopied] = React.useState(false)

  async function call(method: 'GET' | 'POST' | 'DELETE'): Promise<
    | { ok: true; shared: boolean; path?: string }
    | { ok: false; message: string }
  > {
    try {
      const res =
        method === 'GET'
          ? await fetch(`${ENDPOINT}?collectionId=${encodeURIComponent(collectionId)}`, {
              cache: 'no-store',
            })
          : await fetch(ENDPOINT, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ collectionId }),
            })
      const data = (await res.json().catch(() => ({}))) as {
        shared?: boolean
        path?: string
        error?: string
      }
      if (!res.ok) {
        return { ok: false, message: data.error || 'That did not go through. Please try again.' }
      }
      return { ok: true, shared: data.shared === true, path: data.path }
    } catch {
      return { ok: false, message: 'We could not reach the server, so nothing changed.' }
    }
  }

  async function open() {
    setState({ kind: 'loading' })
    const result = await call('GET')
    if (!result.ok) return setState({ kind: 'error', message: result.message })
    setState(result.shared && result.path ? { kind: 'on', path: result.path } : { kind: 'off' })
  }

  async function create() {
    setState({ kind: 'busy', was: 'off' })
    const result = await call('POST')
    if (!result.ok) return setState({ kind: 'error', message: result.message })
    if (result.path) {
      setState({ kind: 'on', path: result.path })
      toast.success('Share link created')
    }
  }

  async function revoke(path: string) {
    setState({ kind: 'busy', was: 'on', path })
    const result = await call('DELETE')
    if (!result.ok) {
      toast.error(result.message)
      return setState({ kind: 'on', path })
    }
    setState({ kind: 'off' })
    setCopied(false)
    toast.success('Stopped sharing. The old link no longer works.')
  }

  async function copy(path: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy. Select the link and copy it by hand.')
    }
  }

  const panelId = `share-${collectionId}`
  const expanded = state.kind !== 'closed'

  return (
    <div className="px-6 pb-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ms-2 h-8 gap-1.5 text-xs text-muted-foreground"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => (expanded ? setState({ kind: 'closed' }) : open())}
      >
        <Link2 aria-hidden className="h-3.5 w-3.5" />
        Share link
      </Button>

      {expanded ? (
        <div
          id={panelId}
          className="mt-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm"
        >
          {state.kind === 'loading' ? (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
              Checking…
            </p>
          ) : null}

          {state.kind === 'error' ? (
            <p role="alert" className="text-destructive">
              {state.message}
            </p>
          ) : null}

          {state.kind === 'off' || (state.kind === 'busy' && state.was === 'off') ? (
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Not shared. Only you can see <span className="font-medium text-foreground">{collectionName}</span>.
                A share link lets anyone who has it see this collection&apos;s name and the
                artifacts in it — read-only, no account. Your name and email are never
                shown, and you can stop sharing at any time.
              </p>
              <Button type="button" size="sm" disabled={state.kind === 'busy'} onClick={create}>
                {state.kind === 'busy' ? 'Creating…' : 'Create share link'}
              </Button>
            </div>
          ) : null}

          {state.kind === 'on' || (state.kind === 'busy' && state.was === 'on') ? (
            <ShareLink
              path={state.kind === 'on' ? state.path : (state.path ?? '')}
              busy={state.kind === 'busy'}
              copied={copied}
              onCopy={copy}
              onRevoke={revoke}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function ShareLink({
  path,
  busy,
  copied,
  onCopy,
  onRevoke,
}: {
  path: string
  busy: boolean
  copied: boolean
  onCopy: (path: string) => void
  onRevoke: (path: string) => void
}) {
  // Rendered from the current origin on the client; the first paint shows the
  // path alone so server and client markup agree.
  const [origin, setOrigin] = React.useState('')
  React.useEffect(() => setOrigin(window.location.origin), [])

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground">
        Shared. Anyone with this link can view the collection, read-only, without an
        account.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          readOnly
          value={`${origin}${path}`}
          aria-label="Share link"
          className="h-8 flex-1 font-mono text-xs"
          onFocus={(e) => e.currentTarget.select()}
        />
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => onCopy(path)}>
            {copied ? (
              <Check aria-hidden className="h-3.5 w-3.5" />
            ) : (
              <Copy aria-hidden className="h-3.5 w-3.5" />
            )}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => onRevoke(path)}
          >
            {busy ? 'Stopping…' : 'Stop sharing'}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Stopping makes this link stop working immediately. Sharing again makes a new one.
      </p>
    </div>
  )
}
