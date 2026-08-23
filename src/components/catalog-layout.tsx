import type { ReactNode } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

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
      {/*
        The <main> lives here, not in each page, for the same reason the
        header does: ten route trees share this file, and a landmark that
        every page has to remember to add is a landmark most pages will not
        have. /paths, /blocks, /pages, /templates, /browse and all four
        detail routes had none at all, so the skip link in <SiteHeader> had
        nothing to skip *to* and a screen reader had no way to jump the nav.

        Pages beneath this must not render their own <main> — nesting them
        is invalid, and only /category did, which now uses a plain wrapper.
      */}
      <main id="main-content">{children}</main>
      <SiteFooter />
    </>
  )
}
