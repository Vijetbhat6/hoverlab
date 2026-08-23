import type { ReactNode } from 'react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

/**
 * Shell for the four policy pages: Terms, Privacy, Refunds, Licence.
 *
 * A route group, so the URLs stay /terms, /privacy, /refunds and /licence —
 * nobody links to "the legal section", they link to the document, and a
 * payment processor's form asks for the URL of the terms page specifically.
 *
 * One narrow column and nothing else. These pages have no navigation of
 * their own on purpose: someone arriving here is reading, not browsing, and
 * the cross-links at the foot of each document reach the other three.
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-16"
      >
        {children}
      </main>
      <SiteFooter />
    </>
  )
}
