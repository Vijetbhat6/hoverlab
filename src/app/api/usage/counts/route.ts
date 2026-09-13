import { NextResponse } from 'next/server'
import { usageSnapshot } from '@/lib/usage'

/**
 * GET /api/usage/counts — the whole visible ranking, as one map.
 *
 * `{ counts: { [id]: { recent, total } }, window: '7d' }`
 *
 * Under /api/usage rather than /api/v1 for the same reason the sibling GET
 * is: this is what lets a statically rendered card show a number, not part
 * of the public contract. `/api/v1/trending` is the contract, it answers a
 * different question — a ranked, resolved, linkable list — and it would be
 * the wrong shape here anyway, because a card needs a lookup and not an
 * order.
 *
 * ── WHY ONE REQUEST AND NOT ONE PER CARD ────────────────────────────────
 *
 * Every catalog grid is prerendered, so the numbers arrive after the HTML.
 * A per-card fetch would put 250 requests and 250 Firestore reads behind
 * one view of /blocks. This is a single indexed read of the top slice,
 * cached at the edge, shared by every card on the page and by every visitor
 * inside the cache window.
 *
 * ── WHY THE MAP IS PARTIAL ──────────────────────────────────────────────
 *
 * Only artifacts with a non-zero week appear. That is what makes the map a
 * fixed size no matter how large the catalog grows, and it is also the
 * honest shape: a missing id means "not counted", which is what the client
 * renders — nothing — rather than a zero that would read as a measurement.
 *
 * Always 200, even when Firestore is unreachable. The failure mode of a
 * card ornament is that the ornament is absent.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const counts = await usageSnapshot()
    return NextResponse.json(
      { counts, window: '7d' },
      {
        /*
         * Five minutes, and stale-while-revalidate for an hour. A copy
         * count is a browsing aid, not a dashboard: nobody can tell a
         * five-minute-old number from a live one, and the alternative is a
         * Firestore read for every visitor to the busiest page on the site.
         */
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600',
        },
      },
    )
  } catch (err) {
    console.error('[api/usage/counts] failed to read:', err)
    return NextResponse.json({ counts: {}, window: '7d' })
  }
}
