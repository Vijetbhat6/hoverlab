import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

/**
 * How often each artifact is actually used.
 *
 * The catalog had no server-side usage data at all. `analytics.ts` is
 * client-side PostHog, which answers product questions in a dashboard but
 * cannot be read by the site — so "most used this week" was unbuildable,
 * and every browse surface was sorted by category and curation alone.
 *
 * What counts as usage is deliberately narrow: a copy or an install. Not a
 * page view. Views measure how well a page ranks in search, and sorting a
 * catalog by that just promotes whatever already ranks — the signal a
 * visitor wants is what other people took, not what other people landed on.
 *
 * ── VIEWS AND SAVES ARE COUNTED, AND STILL DO NOT RANK ──────────────────
 *
 * Cards now show views and saves alongside copies, which is a different
 * question from what the paragraph above settles. "How many people looked
 * at this" is worth printing on a tile — it is how a visitor tells a
 * well-trodden block from one nobody has opened — and it is still the wrong
 * thing to sort by, for exactly the reason given: it is a measure of
 * search, fed back into search.
 *
 * So they are counted into their OWN fields and deliberately kept out of
 * `recent7`, which is the only number `topUsage` and the Popular sort ever
 * read. Adding views to the window would have been the one-line version and
 * would have quietly turned the ranking into a traffic chart.
 *
 * Saves are the third signal and the most deliberate of the three: saving
 * costs a click and means "I want this later", which is a stronger
 * statement than a copy and much stronger than a view. It is a net count —
 * unsaving decrements — so it reads as "how many people are holding this"
 * rather than "how many ever touched the heart".
 *
 * Firestore layout:
 *   usage/{artifactId}  { total, installs, copies, recent7, days: {…},
 *                         views, saves }
 *
 * `recent7` is maintained on write rather than computed on read. A rolling
 * window cannot be summed incrementally — yesterday's number has to fall
 * out — so each write recomputes it from the `days` map it already has in
 * hand. That makes the trending query a single indexed `orderBy` instead of
 * a scan over the whole catalog.
 *
 * This is an unauthenticated counter, so it is gameable in the way every
 * unauthenticated counter is. The mitigations are proportionate rather than
 * cryptographic: a cap on ids per request, one report per artifact per
 * session on the client, and the fact that the prize for cheating is a
 * higher position in a list of CSS snippets.
 */

export type UsageKind = 'copy' | 'install'

/**
 * The signals that are displayed but never ranked.
 *
 * Separate type from `UsageKind` rather than three more members of it, so
 * that the compiler is what stops a view from reaching `recordUsage` and
 * landing in the ranking window. The distinction is the whole design; a
 * union with five members would make it a convention.
 */
export type SignalKind = 'view' | 'save' | 'unsave'

/** Days kept in the per-artifact map. Enough for the window, plus slack. */
const RETAIN_DAYS = 10

/** Ids accepted in one report. A copy-all could otherwise send hundreds. */
export const MAX_IDS_PER_REPORT = 20

function dayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

/** The last 7 day-keys, most recent first. */
function windowKeys(now = new Date()): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i)
    return dayKey(d)
  })
}

/**
 * Record usage for one or more artifacts.
 *
 * Failures are swallowed by the caller, not here: a counter that throws
 * must never fail the request that was doing the real work, but this
 * module should still say what went wrong to the logs.
 */
export async function recordUsage(ids: string[], kind: UsageKind): Promise<number> {
  const unique = [...new Set(ids.filter((id) => typeof id === 'string' && id))].slice(
    0,
    MAX_IDS_PER_REPORT,
  )
  if (!unique.length) return 0

  const db = adminDb()
  const today = dayKey()
  const keep = new Set(windowKeys())

  await Promise.all(
    unique.map(async (id) => {
      const ref = db.collection('usage').doc(id)
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref)
        const data = snap.data() ?? {}
        const days: Record<string, number> = { ...(data.days ?? {}) }

        days[today] = (days[today] ?? 0) + 1

        // Drop anything outside the window plus slack, so the document
        // cannot grow without bound for an artifact used every day.
        for (const key of Object.keys(days)) {
          if (!keep.has(key) && Object.keys(days).length > RETAIN_DAYS) delete days[key]
        }

        const recent7 = windowKeys().reduce((sum, key) => sum + (days[key] ?? 0), 0)

        tx.set(
          ref,
          {
            days,
            recent7,
            total: FieldValue.increment(1),
            [kind === 'install' ? 'installs' : 'copies']: FieldValue.increment(1),
            updatedAt: Timestamp.now(),
          },
          { merge: true },
        )
      })
    }),
  )

  return unique.length
}

/**
 * Record a view or a save.
 *
 * Deliberately not a transaction, unlike `recordUsage`. That one has to
 * read the `days` map before it can recompute the rolling window; this one
 * only ever adds to a counter, and `FieldValue.increment` is commutative —
 * so it is a single blind write with no read, no contention, and no retry
 * loop. Which matters, because a view fires on every detail-page load and a
 * transaction per page view would be the most expensive thing on the site.
 *
 * `unsave` decrements. Firestore has no floor on an increment, so a net
 * count can in principle go negative — a browser that had a save in
 * localStorage from before this counter existed, then unsaves it, reports a
 * decrement whose matching increment was never recorded. `saveCount()`
 * clamps on read rather than this clamping on write: a write that wanted to
 * read first would give back the transaction we just removed, for a number
 * that is an ornament on a card.
 */
export async function recordSignal(ids: string[], kind: SignalKind): Promise<number> {
  const unique = [...new Set(ids.filter((id) => typeof id === 'string' && id))].slice(
    0,
    MAX_IDS_PER_REPORT,
  )
  if (!unique.length) return 0

  const db = adminDb()
  const field = kind === 'view' ? 'views' : 'saves'
  const delta = kind === 'unsave' ? -1 : 1

  await Promise.all(
    unique.map((id) =>
      db
        .collection('usage')
        .doc(id)
        .set(
          { [field]: FieldValue.increment(delta), updatedAt: Timestamp.now() },
          { merge: true },
        ),
    ),
  )

  return unique.length
}

/** A net save count can drift below zero — see `recordSignal`. */
function saveCount(value: unknown): number {
  return typeof value === 'number' && value > 0 ? Math.round(value) : 0
}

export interface UsageCount {
  id: string
  /** Uses in the last seven days. */
  recent: number
  /** Uses since counting began. */
  total: number
  /** Detail-page views since counting began. Never part of the ranking. */
  views: number
  /** People currently holding this in favorites. Net of unsaves. */
  saves: number
}

/**
 * The most-used artifacts of the last seven days.
 *
 * Reads only the top `limit` documents, ordered by the maintained window
 * sum. Artifacts nobody has used have no document at all, which is why an
 * empty result is normal on a fresh deployment rather than an error.
 */
export async function topUsage(limit = 12): Promise<UsageCount[]> {
  const snap = await adminDb()
    .collection('usage')
    .orderBy('recent7', 'desc')
    .limit(Math.min(Math.max(limit, 1), 100))
    .get()

  return snap.docs.map(readCount).filter((entry) => entry.recent > 0)
}

/**
 * One `usage/{id}` document, in the shape the site renders.
 *
 * Exported so it can be tested without a Firestore. Every field is read
 * defensively: these documents are written by three different code paths
 * across two runtimes and some of them predate the fields being read here,
 * so a missing or wrong-typed value is a normal state of the data rather
 * than a corruption to throw on.
 */
export function parseUsageDoc(id: string, data: Record<string, unknown> | undefined): UsageCount {
  const raw = data ?? {}
  return {
    id,
    recent: typeof raw.recent7 === 'number' ? raw.recent7 : 0,
    total: typeof raw.total === 'number' ? raw.total : 0,
    views: typeof raw.views === 'number' && raw.views > 0 ? Math.round(raw.views) : 0,
    saves: saveCount(raw.saves),
  }
}

/** `parseUsageDoc`, against a Firestore snapshot. */
function readCount(doc: {
  id: string
  data: () => Record<string, unknown> | undefined
}): UsageCount {
  return parseUsageDoc(doc.id, doc.data())
}

/**
 * Fold the per-signal heads into the map a page renders.
 *
 * Separate from the queries so the part with the decisions in it — which
 * duplicates win, which documents are dropped — can be tested directly.
 * Order within a head is the query's; order between heads does not matter,
 * because every head returns the whole row and not just its own field.
 */
export function mergeUsageHeads(heads: UsageCount[][]): Record<string, UsageCount> {
  const out: Record<string, UsageCount> = {}
  for (const head of heads) {
    for (const count of head) {
      if (out[count.id]) continue
      // An artifact whose every counter is zero is not a measurement, it is
      // a document left behind by a decrement or by a write that only set
      // `updatedAt`. It carries no information a card could render.
      if (count.recent <= 0 && count.views <= 0 && count.saves <= 0) continue
      out[count.id] = count
    }
  }
  return out
}

/**
 * One page's worth of counters, as a map, for rendering numbers on cards.
 *
 * The grids are statically prerendered and the counters are not, so a card
 * cannot carry its number in the HTML — it has to arrive afterwards. Doing
 * that per card would mean one request per tile and a Firestore read per
 * request; this is the whole visible ranking in a single read, cached, so a
 * grid of 250 cards costs exactly what a grid of one does.
 *
 * Capped, which means the map is deliberately PARTIAL: an artifact with no
 * counters at all is absent rather than present with zeroes. Callers render
 * nothing for a missing id — see `UsageCount` — because "0 copies" on a
 * page nobody has visited yet reads as a verdict on the artifact rather
 * than on the counter's age.
 *
 * ── WHY THREE QUERIES AND NOT ONE ───────────────────────────────────────
 *
 * The card shows three different numbers and they rank three different
 * artifacts. A single `orderBy('recent7')` would return the most-copied
 * slice and nothing else, so a block with two thousand views and no copies
 * this week would fall outside the top slice and render no view count —
 * the number would be missing from exactly the artifacts that have the
 * most of it. Each signal therefore contributes its own head, and the union
 * is what the page gets.
 *
 * Three indexed reads, capped, behind a five-minute cache, shared by every
 * card on every grid. Still cheaper by two orders of magnitude than the
 * per-card fetch this exists to avoid.
 */
export async function usageSnapshot(limit = 500): Promise<Record<string, UsageCount>> {
  const capped = Math.min(Math.max(limit, 1), 1000)
  const usage = adminDb().collection('usage')

  const heads = await Promise.all(
    (['recent7', 'views', 'saves'] as const).map((field) =>
      usage.orderBy(field, 'desc').limit(capped).get(),
    ),
  )

  return mergeUsageHeads(heads.map((snap) => snap.docs.map(readCount)))
}

/** Usage for one artifact, or null when it has never been used. */
export async function usageFor(id: string): Promise<UsageCount | null> {
  const snap = await adminDb().collection('usage').doc(id).get()
  if (!snap.exists) return null
  return readCount(snap)
}
