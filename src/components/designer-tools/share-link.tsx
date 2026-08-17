'use client'

/**
 * Shareable state links for the designer tools.
 *
 * Every tool persists to localStorage, which means a designer could build a
 * three-layer shadow and have no way to hand it to a colleague. These
 * helpers put the state in the URL instead: `#s=<base64url JSON>`.
 *
 * A hash rather than a query string because the server never needs it — no
 * prerender variance, no metadata implications, nothing logged. The
 * receiving tool applies the state once on mount and then strips the hash,
 * so what the visitor tunes afterwards survives their own reloads; sharing
 * again is one press of the button, which re-encodes the current state.
 */

import * as React from 'react'
import { Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { copyWithToast } from '@/components/designer-tools/tool-layout'

function encodeState(state: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(state))
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Read state shared via `#s=…`, or null if the hash is absent or invalid.
 * Call from a mount effect (never during render — the server has no hash),
 * apply the result over the tool's defaults, then the hash is stripped so a
 * reload keeps the user's subsequent edits.
 */
export function readSharedState<T>(): T | null {
  if (typeof window === 'undefined') return null
  const m = /^#s=([A-Za-z0-9_-]+)$/.exec(window.location.hash)
  if (!m) return null
  try {
    const bin = atob(m[1]!.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as T
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    return parsed
  } catch {
    return null
  }
}

/** Copies a link to the current page carrying `state` in the hash. */
export function ShareLinkButton({ state }: { state: unknown }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1.5"
      onClick={() => {
        const url = `${window.location.origin}${window.location.pathname}#s=${encodeState(state)}`
        void copyWithToast(url, 'Link copied — opens with these exact settings')
      }}
    >
      <Link2 className="h-3.5 w-3.5" /> Copy link
    </Button>
  )
}
