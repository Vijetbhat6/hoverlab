/**
 * The export-meter numbers, with no `server-only` import.
 *
 * Split out of `./quota` for the same reason `./invite-code` is split out
 * of `./workspace`: the limits are copy as much as they are policy. The
 * pricing page has to say "10 a day" and the bundle drawer has to say how
 * many are left, and both are client components that cannot import a
 * module which reaches for the Firestore Admin SDK.
 *
 * Enforcement lives in `./quota` and only there. Nothing here is trusted —
 * a client that edits these numbers gets different copy and the same
 * server-side answer.
 */

/**
 * Exports per UTC day, by what the caller holds.
 *
 * The anonymous number is small because it is the one bucket that cannot
 * be attributed to a person; the signed-in number is deliberately several
 * times larger, so "sign in" is a real answer when someone hits the wall
 * rather than a redirect to a paywall wearing a different hat.
 *
 * Ten is chosen to sit above a normal day's work and below a scrape. A
 * developer assembling one project's UI exports two or three bundles; a
 * person emptying the catalog needs hundreds.
 */
export const DAILY_EXPORTS = {
  anonymous: 3,
  free: 10,
  /** Pro, Studio and Team. The licence is what removes the meter. */
  paid: Number.POSITIVE_INFINITY,
} as const

/**
 * What kind of packaging action is being charged.
 *
 * Recorded on the quota document but not counted separately — the limit is
 * on exports as a whole, because a per-kind limit would let someone take
 * the same volume by alternating formats.
 */
export type QuotaAction = 'bundle-zip' | 'bundle-css' | 'bundle-html' | 'artifact-zip'

const QUOTA_ACTIONS = new Set<string>([
  'bundle-zip',
  'bundle-css',
  'bundle-html',
  'artifact-zip',
])

export function isQuotaAction(value: unknown): value is QuotaAction {
  return typeof value === 'string' && QUOTA_ACTIONS.has(value)
}

/* ------------------------------------------------------------------ *
 *  Meters
 * ------------------------------------------------------------------ */

/**
 * Independent daily counters.
 *
 * Two things needed metering and they are not the same thing, so they do
 * not share a number:
 *
 *   exports    bulk takes — a bundle archive, a template zip. The limit
 *              exists to make the free tier finite. See `./quota`.
 *   aiSearch   natural-language search. The limit exists because the
 *              endpoint costs real tokens per call and takes no
 *              credentials, so without one it is a free ranking model for
 *              anyone who finds it.
 *
 * Folding them into one counter would mean searching for a button spent
 * part of someone's download allowance, which is incoherent to the person
 * watching it go down.
 *
 * AI search is far more generous than exports because it is a browse
 * action: it happens ten times while someone looks for one thing, and a
 * search that runs out mid-session breaks the funnel the whole business
 * sits on. It is a ceiling against abuse, not a lever.
 */
export const METERS = {
  exports: { prefix: 'e', limits: DAILY_EXPORTS },
  aiSearch: {
    prefix: 's',
    limits: { anonymous: 15, free: 40, paid: Number.POSITIVE_INFINITY },
  },
} as const

export type MeterId = keyof typeof METERS
