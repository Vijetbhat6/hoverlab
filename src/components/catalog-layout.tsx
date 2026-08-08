import type { ReactNode } from 'react'
import { SiteHeader } from '@/components/site-header'

/**
 * The layout every catalog surface shares: the ladder nav, then the page.
 *
 * Each catalog route tree has a one-line `layout.tsx` that re-exports this
 * as its default. Layouts rather than an edit to each page body, because a
 * layout covers a whole subtree — /blocks and /blocks/[category] take one
 * file between them, and a route added under either tomorrow gets the nav
 * without anyone remembering to wire it.
 *
 * Not in the root layout: /embed renders deliberately chrome-free, the auth
 * pages have their own shell, and six app surfaces already carry a bespoke
 * sticky header. See the note in `site-header.tsx`.
 */
export function CatalogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  )
}
