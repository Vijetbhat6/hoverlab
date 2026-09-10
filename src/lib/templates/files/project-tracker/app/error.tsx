'use client'

/**
 * The error boundary Next actually renders when a segment throws.
 *
 * WHY THIS FILE EXISTS SEPARATELY FROM `/server-error`. Next requires the
 * boundary to be a client component receiving `{ error, reset }` — a shape
 * no ordinary page has, and therefore a shape no page in a catalog of pages
 * can be shipped in. `/server-error` renders the same screen as a normal
 * route so you can open it, restyle it and screenshot it without breaking
 * the app to see it. This is the one the framework calls.
 *
 * WHAT MAKES IT WORTH WIRING RATHER THAN COPYING. `reset` re-renders the
 * failed segment in place, which is the only retry that is not a page
 * reload — the board keeps its scroll position and the user keeps whatever
 * they had typed elsewhere on the screen. A retry button that calls
 * `location.reload()` is the thing this replaces.
 *
 * `error.digest` is the id Next assigns a server-side error and writes into
 * the server log. Putting it on the screen is what turns "it broke" in a
 * support message into one grep, so pass it through rather than letting the
 * block fall back to its placeholder.
 */

import * as React from 'react'
import { ErrorStateRetry } from '@/components/error-state-retry'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    // Replace with your reporter. Logging to the console is what makes this
    // visible in development and useless in production.
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <ErrorStateRetry
        title="This board did not load"
        description="The request failed before it finished. Nothing you had open was changed."
        /*
         * `detail` is the stack in development and nothing in production.
         * Next already strips server error messages before they reach the
         * browser, so this is the client-side half of the same rule: a
         * stack trace on a customer's screen is an invitation, and a
         * <details> element they will never open is not worth it.
         *
         * EMPTY STRING, NOT `undefined`, in both props below. The block
         * hides each section when its value is falsy — but a default
         * parameter only applies to `undefined`, so passing that renders
         * the block's demo stack trace and its placeholder reference id to
         * a real customer. `''` is the only way to say "nothing here".
         */
        detail={process.env.NODE_ENV === 'development' ? (error.stack ?? '') : ''}
        // Client-side errors carry no digest — there is no server log entry
        // to point at, so the reference row is hidden rather than faked.
        errorId={error.digest ?? ''}
        onRetry={async () => reset()}
      />
    </main>
  )
}
