'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

/**
 * Initializes PostHog and records page views on client-side navigations.
 *
 * Mounted once in the root layout. Renders children untouched when
 * NEXT_PUBLIC_POSTHOG_KEY is absent, so local dev, CI builds, and forks
 * run with analytics fully disabled and no network calls.
 *
 * Page views are captured manually rather than via `capture_pageview: true`
 * because the App Router does client-side navigation — PostHog's automatic
 * pageview only fires on a hard load, so /library → /effect/x would go
 * unrecorded.
 */

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

if (typeof window !== 'undefined' && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // We fire pageviews ourselves on pathname change (see below).
    capture_pageview: false,
    capture_pageleave: true,
    // Respect the same accessibility signal the rest of the app honors,
    // and don't record inputs — the search box can contain anything.
    autocapture: {
      dom_event_allowlist: ['click'],
    },
    persistence: 'localStorage+cookie',
  })
}

function PageViewTracker() {
  const pathname = usePathname()

  React.useEffect(() => {
    if (!POSTHOG_KEY || !pathname) return
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      pathname,
    })
  }, [pathname])

  return null
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  if (!POSTHOG_KEY) return <>{children}</>

  return (
    <PostHogProvider client={posthog}>
      <PageViewTracker />
      {children}
    </PostHogProvider>
  )
}
