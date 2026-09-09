/**
 * The server-error screen — the one page nobody designs and everybody sees.
 *
 * A 500 is different from a 404 in the way that matters to layout: a 404
 * is the visitor's problem to solve, so it offers navigation. A 500 is our
 * problem, and offering navigation implies the rest of the site works,
 * which is exactly what is in doubt.
 *
 * So retry leads. The obvious wrong answer is a big apology and a link
 * home — the apology is not actionable and the link is a guess about
 * whether anything else is up.
 *
 * The connectivity banner underneath covers the case a retry button cannot
 * distinguish: a genuine 500 and a dropped connection look identical from
 * inside the tab, and telling someone to retry while their wifi is off is
 * the loop that makes an error page feel broken rather than honest.
 */

import * as React from 'react'
import { ErrorStateRetry } from '@/lib/blocks/sources/error-state-retry'
import { OfflineStateBanner } from '@/lib/blocks/sources/offline-state-banner'

export default function Error500Page() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <ErrorStateRetry />

      {/*
        Second, not first. It is the less likely cause, and leading with
        "check your connection" on a genuine outage reads as blaming the
        visitor for our failure.
      */}
      <OfflineStateBanner />

      <section className="mx-auto w-full max-w-2xl px-6 pb-20 text-center">
        <p className="text-sm text-muted-foreground">
          If this keeps happening, the status page has more than we can put
          on an error screen — including whether we already know.
        </p>
      </section>
    </main>
  )
}
