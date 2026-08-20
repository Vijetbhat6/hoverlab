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
 * Firestore layout:
 *   usage/{artifactId}  { total, installs, copies, recent7, days: {…} }
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

export interface UsageCount {
  id: string
  /** Uses in the last seven days. */
  recent: number
  /** Uses since counting began. */
  total: number
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

  return snap.docs
    .map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        recent: typeof data.recent7 === 'number' ? data.recent7 : 0,
        total: typeof data.total === 'number' ? data.total : 0,
      }
    })
    .filter((entry) => entry.recent > 0)
}

/** Usage for one artifact, or null when it has never been used. */
export async function usageFor(id: string): Promise<UsageCount | null> {
  const snap = await adminDb().collection('usage').doc(id).get()
  if (!snap.exists) return null
  const data = snap.data() ?? {}
  return {
    id,
    recent: typeof data.recent7 === 'number' ? data.recent7 : 0,
    total: typeof data.total === 'number' ? data.total : 0,
  }
}
