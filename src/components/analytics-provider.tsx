'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

import { startAnalytics, stopAnalytics } from '@/lib/analytics'
import { allowsAnalytics, readConsent, subscribeConsent } from '@/lib/consent'

/**
 * Turns PostHog on when — and only when — the visitor has said yes, and
 * records page views on client-side navigations.
 *
 * Mounted once in the root layout. Renders children untouched when
 * NEXT_PUBLIC_POSTHOG_KEY is absent, so local dev, CI builds and forks run
 * with analytics fully disabled and no network calls.
 *
 * WHY THE INIT IS NOT HERE ANY MORE. This file used to call `posthog.init`
 * at module scope, which meant importing it was enough to set an analytics
 * cookie and a localStorage id — on first paint, on every page, before the
 * visitor had been asked anything. Under the EU/UK ePrivacy rules that is
 * non-essential storage set without consent, and /privacy said so in as
 * many words. The init now lives in `startAnalytics()` and runs from the
 * effect below, after a stored decision has been read.
 *
 * `PostHogProvider` still wraps the tree unconditionally, with an
 * uninitialised client when there is no consent. That is deliberate: given
 * a `client` it only supplies context — no request, no storage — whereas
 * mounting it conditionally would change the element type at that position
 * and remount the entire app the moment someone clicked Accept.
 */

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY

/**
 * Fires a `$pageview` per pathname, and again on the transition into
 * consent — the page someone was reading when they accepted is a page they
 * agreed to have counted, and it is usually the landing page, i.e. the one
 * an acquisition report is most wrong without.
 */
function PageViewTracker({ active }: { active: boolean }) {
  const pathname = usePathname()

  React.useEffect(() => {
    if (!active || !pathname) return
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      pathname,
    })
  }, [active, pathname])

  return null
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [consented, setConsented] = React.useState(false)

  React.useEffect(() => {
    const apply = (record: ReturnType<typeof readConsent>) => {
      const allowed = allowsAnalytics(record)
      setConsented(allowed)
      if (allowed) startAnalytics()
      else stopAnalytics()
    }

    // Runs after hydration, never during SSR, so the first render is the
    // same on both sides regardless of what is in localStorage.
    apply(readConsent())
    return subscribeConsent(apply)
  }, [])

  if (!POSTHOG_KEY) return <>{children}</>

  return (
    <PostHogProvider client={posthog}>
      <PageViewTracker active={consented} />
      {children}
    </PostHogProvider>
  )
}
