import type { ReactNode } from 'react'
import Link from 'next/link'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { DocsNav } from '@/components/docs/docs-nav'

/**
 * Docs shell — the ladder nav on top, a section list down the side.
 *
 * The sidebar is a client component only because it marks the current
 * page; everything else here, including every docs page under it, is a
 * server render with no JavaScript of its own. Documentation is the last
 * thing that should need a bundle to be readable.
 */
export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
          <DocsNav />

          {/* `min-w-0` so a wide code block scrolls inside the column
              instead of stretching the grid and pushing the sidebar off. */}
          <main id="main-content" className="min-w-0 py-10 lg:py-14">
            {children}

            {/*
              A <p>, not a <footer>. Inside <main> this element carried no
              landmark role anyway, and now that <SiteFooter> renders a real
              contentinfo below, a second <footer> here would be the second
              thing announced under the same name.
            */}
            <p className="mt-16 border-t border-border/60 pt-6 text-sm text-muted-foreground">
              Something wrong or missing here?{' '}
              <Link href="/browse" className="font-medium text-primary hover:underline">
                Browse the catalog
              </Link>{' '}
              — every page in it links back to the source it documents.
            </p>
          </main>
        </div>
      </div>
      <SiteFooter />
    </>
  )
}
