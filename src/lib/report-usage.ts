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

/** The one place a counter report is actually sent. */
function post(id: string, kind: string) {
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

export function reportUsage(id: string | null | undefined, kind: 'copy' | 'install' = 'copy') {
  if (!id || typeof window === 'undefined') return

  const key = `${kind}:${id}`
  if (reported.has(key)) return
  reported.add(key)

  post(id, kind)
}

/**
 * Tell the server an artifact's page was looked at.
 *
 * ── WHY THIS DE-DUPES IN sessionStorage AND A COPY DOES NOT ─────────────
 *
 * `reportUsage` guards with a module-level Set, which lasts exactly as long
 * as the JS context: a hard reload counts a second copy. For a copy that is
 * right — someone who reloads and copies again has copied twice — and the
 * numbers are small enough that it barely matters either way.
 *
 * A view is the opposite on both counts. Reloading a page is not looking at
 * it twice, and a view fires on every detail-page load without anyone
 * deciding anything, so an in-memory guard would turn one visitor leaving a
 * tab open through a few refreshes into a view count. The tab's own session
 * is the honest unit, and `sessionStorage` is exactly that unit: per tab,
 * cleared when it closes, survives a reload.
 *
 * Storage that throws (private mode, blocked site data) falls through to
 * reporting the view. The failure of a de-dupe should be a slightly
 * generous count, not a missing one.
 */
export function reportView(id: string | null | undefined) {
  if (!id || typeof window === 'undefined') return

  const key = `hoverlab:viewed:${id}`
  try {
    if (window.sessionStorage.getItem(key)) return
    window.sessionStorage.setItem(key, '1')
  } catch {
    /* no session storage — count it, rather than dropping it */
  }

  post(id, 'view')
}

/**
 * Tell the server an artifact was saved to, or removed from, favorites.
 *
 * Not de-duped at all, deliberately: this is a net counter and each call is
 * one half of a matched pair. Swallowing the second press of a heart would
 * leave the increment standing with no decrement behind it, and the count
 * would only ever climb.
 *
 * Favorites are stored per browser, so the number this feeds is "saves
 * recorded", not "distinct people" — a visitor who saves the same block in
 * two browsers counts twice, and one who clears their storage and saves
 * again counts twice too. That is the same proportionate-not-cryptographic
 * bargain the copy counter makes, and for a smaller prize.
 */
export function reportSave(id: string | null | undefined, saved: boolean) {
  if (!id || typeof window === 'undefined') return
  post(id, saved ? 'save' : 'unsave')
}
