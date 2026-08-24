'use client'

/**
 * Tell the server an artifact was copied.
 *
 * Separate from `analytics.ts`, which sends the same moment to PostHog.
 * That is a product-analytics dashboard we read; this is a counter the
 * SITE reads, to sort a Trending list. One of them can be switched off
 * without a key configured and the other cannot.
 *
 * Reported at most once per artifact per page session. Someone who copies
 * the CSS, then the HTML, then both together has decided once, and letting
 * that count three times would rank the effects with the most copy buttons
 * rather than the ones people want.
 *
 * Fire-and-forget in the strongest sense: no await, no error surface, and
 * `keepalive` so the request survives the navigation that often follows a
 * copy.
 */

const reported = new Set<string>()

export function reportUsage(id: string | null | undefined, kind: 'copy' | 'install' = 'copy') {
  if (!id || typeof window === 'undefined') return

  const key = `${kind}:${id}`
  if (reported.has(key)) return
  reported.add(key)

  try {
    void fetch('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id], kind }),
      keepalive: true,
    }).catch(() => {
      // A counter is never worth a message to the user. If it failed, the
      // artifact is simply one use less popular than it really is.
    })
  } catch {
    /* no fetch (very old browser, or a blocked request) — nothing to do */
  }
}
