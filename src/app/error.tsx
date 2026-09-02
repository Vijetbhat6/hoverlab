'use client'

/**
 * The error boundary for everything under the root layout.
 *
 * There was none, which meant any render throw on any route — including a
 * paid template's detail page — fell through to Next's built-in screen: a
 * bare white page with no header, no navigation and, in production, the
 * word "error". A visitor who hit it had no way back into the site and no
 * indication the site had a way back.
 *
 * The 404 page already answers the same question ("I am somewhere that
 * isn't working, what now") and this deliberately mirrors it: same header,
 * same shape, same two exits. The difference is one honest sentence about
 * whose fault it is. A 404 is usually the visitor's typo; this never is.
 *
 * WHAT IT DOES NOT DO.
 *
 * It does not show the error message. `error.message` on a server-rendered
 * throw is deliberately redacted by Next in production — what reaches the
 * client is a generic string and a digest — so printing it would either
 * show nothing useful or, in development, leak a stack trace into the
 * layout. The digest IS shown, small and selectable, because it is the one
 * thing that lets a support conversation find the matching server log.
 *
 * `reset()` re-renders the segment without a full reload. It is offered
 * first because a surprising share of these are transient — a failed data
 * read, a hydration race — and trying again costs the visitor nothing.
 */

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, Search, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/site-header'

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    /*
      Logged to the console rather than to analytics.

      The analytics module is consent-gated and client-only, and an error
      boundary is the worst possible place to discover that a consent check
      throws. The server already logs the real error with the digest below;
      this is only so a developer with devtools open sees something.
    */
    console.error('[hoverlab] route error:', error)
  }, [error])

  return (
    <>
      <SiteHeader />

      <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-lg shadow-amber-500/30">
          <TriangleAlert className="h-8 w-8" />
        </div>

        <p className="font-mono text-sm font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-500">
          Error
        </p>
        <h1 className="type-page mt-2">This page broke.</h1>
        <p className="mt-3 max-w-md text-pretty text-sm text-body sm:text-base">
          Not something you did — something on our side failed while
          rendering this page. Trying again often works; if it doesn&apos;t,
          the rest of the site is unaffected.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <Button size="sm" className="gap-1.5" onClick={reset}>
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link href="/browse">
              <Search className="h-4 w-4" /> Search the catalog
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost" className="gap-1.5">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
          </Button>
        </div>

        {error.digest ? (
          <p className="mt-12 text-xs text-muted-foreground">
            If you report this, quote{' '}
            <code className="select-all rounded border border-border bg-muted px-1.5 py-0.5 font-mono">
              {error.digest}
            </code>{' '}
            — it matches this failure to our server log.{' '}
            <Link href="/support" className="underline underline-offset-2 hover:text-foreground">
              Support
            </Link>
          </p>
        ) : (
          <p className="mt-12 text-xs text-muted-foreground">
            <Link href="/support" className="underline underline-offset-2 hover:text-foreground">
              Tell us about it
            </Link>{' '}
            if it keeps happening.
          </p>
        )}
      </div>
    </>
  )
}
