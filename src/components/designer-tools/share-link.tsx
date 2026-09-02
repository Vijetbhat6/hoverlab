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
 *
 * Nothing here is wired per tool any more. `useToolState` reads the hash
 * during its own restore and exposes `shareUrl()`, and `<ToolPresetsBar>`
 * renders the button — so every tool built on the hook can be shared, and
 * the five that had hand-rolled copies of this no longer need one. The
 * exports remain for a tool that needs the button somewhere other than the
 * tray.
 */

import * as React from 'react'
import { Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { copyWithToast } from '@/components/designer-tools/tool-layout'
import { toast } from 'sonner'

/**
 * The longest `#s=` payload we will put on a clipboard.
 *
 * Browsers take far more than this, but a link is shared through things
 * that do not: chat clients wrap it, some mail clients hard-break it, and a
 * URL that arrives split is worse than one that never arrived — the
 * recipient sees a link, clicks it, and lands on a tool showing defaults
 * with no indication anything was lost. 4,000 characters clears every
 * mainstream client with room to spare, and every tool's real state is an
 * order of magnitude under it. The tools that could exceed it are the ones
 * holding pasted documents (the code screenshotter), and for those the
 * honest answer is that a link is the wrong transport.
 */
export const SHARE_URL_MAX = 4000

function encodeState(state: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(state))
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Build the shareable URL for `state`, or null if it would be too long to
 * survive being pasted somewhere (see `SHARE_URL_MAX`).
 *
 * Returns null rather than throwing or truncating: the caller's job is to
 * say so in the UI, and a truncated payload would decode to nothing on the
 * far end while still looking like a working link.
 */
export function shareUrlFor(state: unknown): string | null {
  if (typeof window === 'undefined') return null
  let encoded: string
  try {
    encoded = encodeState(state)
  } catch {
    // A state carrying something JSON cannot express (a cycle, a BigInt).
    // No tool does this today; if one starts, it fails here rather than
    // producing a link that decodes to garbage.
    return null
  }
  const url = `${window.location.origin}${window.location.pathname}#s=${encoded}`
  return url.length > SHARE_URL_MAX ? null : url
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

/**
 * Copies a link to the current page carrying the tool's state in the hash.
 *
 * Takes a getter rather than the state itself so the URL is built at click
 * time. Encoding on every render would run base64 over the whole state on
 * every slider frame, for a string almost every visitor never asks for.
 */
export function ShareLinkButton({
  url,
  className,
}: {
  url: () => string | null
  className?: string
}) {
  return (
    <Button
      // Explicit, because this renders inside the presets <form>: a bare
      // <button> in a form is a submit button, and the default would make
      // "copy link" try to save a preset.
      type="button"
      variant="outline"
      size="sm"
      className={className ?? 'h-8 gap-1.5'}
      onClick={() => {
        const href = url()
        if (!href) {
          toast.error('This is too big to put in a link — save it as a preset instead')
          return
        }
        void copyWithToast(href, 'Link copied — opens with these exact settings')
      }}
    >
      <Link2 className="h-3.5 w-3.5" /> Copy link
    </Button>
  )
}
