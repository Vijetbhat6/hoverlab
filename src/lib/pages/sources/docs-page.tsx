/**
 * A documentation page — the site navbar over the three-column docs layout.
 *
 * The navbar stays because docs are not a separate product: the reader who
 * arrives from a search result needs a way to the pricing page, and the
 * evaluator halfway through a guide needs a way back to the docs root. All
 * of the actual docs apparatus — sidebar, article, on-this-page rail —
 * lives inside <DocsLayout>, so this file stays a two-line running order.
 *
 * In a real project this route is `app/docs/[[...slug]]/page.tsx`: one
 * layout, every article. The slug picks the content; the frame never
 * changes, which is the whole point of a docs frame.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { DocsLayout } from '@/lib/blocks/sources/docs-layout'

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Docs" ctaLabel="Get API key" ctaHref="/signup" />

      <main>
        <DocsLayout />
      </main>
    </div>
  )
}
