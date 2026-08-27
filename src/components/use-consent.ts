'use client'

import * as React from 'react'

import {
  type ConsentRecord,
  CONSENT_REQUIRED,
  readConsent,
  subscribeConsent,
} from '@/lib/consent'

/**
 * The consent decision as React state, kept in step across tabs.
 *
 * A hook rather than a context: the two components that need it —
 * `<CookieConsentBanner>` and `<StickyInstallBar>` — are never both on a
 * page more than once, and a provider around the whole app for two readers
 * is a lot of wiring to keep one boolean in.
 *
 * `ready` is the hydration guard, and callers must respect it. The record
 * lives in localStorage, which the server cannot see, so a first render
 * that acted on it would disagree with the server's HTML and React would
 * throw the markup away. Every consumer here renders the "not decided yet"
 * shape until `ready` turns true, one tick after mount.
 */
export function useConsent(): {
  record: ConsentRecord | null
  /** True once a decision — of either kind — has been stored. */
  decided: boolean
  /**
   * A question is on screen and unanswered. Anything else that wants the
   * bottom of the viewport, or focus, should wait for this to be false —
   * and it is false where no question is asked at all, so a keyless fork
   * does not wait forever.
   */
  pending: boolean
  /** False until after hydration, when `record` becomes trustworthy. */
  ready: boolean
} {
  const [record, setRecord] = React.useState<ConsentRecord | null>(null)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    setRecord(readConsent())
    setReady(true)
    return subscribeConsent(setRecord)
  }, [])

  return {
    record,
    decided: ready && record !== null,
    pending: ready && CONSENT_REQUIRED && record === null,
    ready,
  }
}
