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
 *
 * ── THIS IS NO LONGER THE PREFERRED FORM ────────────────────────────────
 *
 * Six tools — palette, tokens, gradient, shadow, typography and contrast —
 * now carry their state in a readable query string instead: see
 * `lib/tools/permalink.ts`. A fragment buys invisibility, and invisibility
 * turned out to be the problem rather than the feature. The server never
 * sees a hash, so the page cannot say in its <title> what the link
 * contains; a crawler never sees one, so the link is not a document; and a
 * person cannot read one, so nobody can tell two apart or edit one by hand.
 *
 * What is left here is still load-bearing, in two places:
 *
 *   Reading. Every `#s=` link already pasted into somebody's channel keeps
 *   working — `useToolState` still decodes them, one rung below the query
 *   string in its restore order.
 *
 *   Writing, for the tools with no readable form. The code screenshotter
 *   holds a pasted document; there is no honest way to spell that as named
 *   parameters, and a base64 blob is the right answer for it.
 *
 * `ShareLinkButton` itself did not change and does not care: it calls
 * whatever getter it was handed, and the hook decides which of the two
 * spellings that getter builds.
 */

import * as React from 'react'
import { Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { copyWithToast } from '@/components/designer-tools/tool-layout'
import { toast } from 'sonner'
import {
  SHARE_URL_MAX,
  decodeSharedState,
  encodeSharedState,
} from '@/lib/shared-tool-state'

/**
 * Build the shareable URL for `state`, or null if it would be too long to
 * survive being pasted somewhere (see `SHARE_URL_MAX`).
 *
 * Returns null rather than throwing or truncating: the caller's job is to
 * say so in the UI, and a truncated payload would decode to nothing on the
 * far end while still looking like a working link.
 *
 * The base64url-JSON itself is `lib/shared-tool-state.ts`, so a caller that
 * wants a link to a *different* route — the landing hero's theme pills,
 * which point at /tools/tokens — can encode one without pulling this
 * module's toast and Button in behind it.
 */
export function shareUrlFor(state: unknown): string | null {
  if (typeof window === 'undefined') return null
  const hash = encodeSharedState(state)
  if (hash === null) return null
  const url = `${window.location.origin}${window.location.pathname}${hash}`
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
  const parsed = decodeSharedState<T>(window.location.hash)
  if (parsed === null) return null
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
  return parsed
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
