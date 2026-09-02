'use client'

/**
 * Keeps a live preview from acting like part of the page around it.
 *
 * Blocks and pages render as real React inline (see `artifact-preview.tsx`),
 * which is what makes the preview honest — and also means the demo's markup
 * is markup in the real document, with the real document's semantics. Two
 * things leak out of it, and both only affect the full-size preview on a
 * detail page. The thumbnails on the listing pages are `pointer-events-none`
 * and `inert`, so nothing inside them is reachable or announced.
 *
 * 1. Links. The demo defaults are realistic on purpose: a cart drawer links
 *    to `/checkout`, a dashboard shell to `/dashboard`, a blog grid to
 *    `/blog/<slug>`. None of those are routes here, so clicking anything in
 *    a preview took the visitor off the page they were reading and onto a
 *    404. Every link is blocked, not just the ones that would 404 — a
 *    preview link that quietly worked and navigated away would be the more
 *    surprising of the two behaviours. `rel="nofollow"` is the same problem
 *    for crawlers, which do not care that the thumbnails are `inert` and
 *    were filing the demo destinations as the site's own broken links.
 *
 * 2. Headings. A hero block's headline is an `<h1>`, correctly — it is the
 *    top of the page it was written for. Dropped into /block/hero-split it
 *    became a second `<h1>`, so the outline read "Split Hero with Product
 *    Panel", then "Preview", then "Ship your next idea before the weekend"
 *    at the same rank as the page title. `aria-level` re-ranks a native
 *    heading without touching the element, so the demo keeps its internal
 *    hierarchy and the whole of it nests under the section it sits in.
 */

import * as React from 'react'
import { toast } from 'sonner'

/** The preview sits under a section heading, so its own top level is 3. */
const PREVIEW_TOP_LEVEL = 3

export function PreviewGuard({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const root = ref.current
    if (!root) return

    for (const anchor of root.querySelectorAll('a[href]')) {
      anchor.setAttribute('rel', 'nofollow')
    }

    for (const heading of root.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
      const own = Number(heading.tagName[1])
      // Shift the whole demo down by the same amount rather than flattening
      // it: an h1/h2/h3 demo should still read as three ranks, just lower.
      const shifted = Math.min(own + PREVIEW_TOP_LEVEL - 1, 6)
      heading.setAttribute('aria-level', String(shifted))
    }
  }, [])

  const block = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const anchor = target.closest('a[href]')
    if (!anchor || !ref.current?.contains(anchor)) return

    event.preventDefault()

    const href = anchor.getAttribute('href') ?? ''
    // An in-page anchor is the demo scrolling itself. Nothing to warn about.
    if (href.startsWith('#')) return

    toast('Links inside a preview do not navigate', {
      description: `This demo points at ${href} — copy the source and it will link wherever you point it.`,
    })
  }, [])

  return (
    <div ref={ref} onClick={block} onAuxClick={block}>
      {children}
    </div>
  )
}
