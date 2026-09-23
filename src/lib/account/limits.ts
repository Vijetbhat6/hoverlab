/**
 * Ceilings on the three account endpoints, and the pure half of enforcing
 * them.
 *
 * WHY THESE EXIST. Each of these routes is expensive in a way an ordinary
 * read is not. The export reads dozens to thousands of documents and runs on
 * a host that bills per function call. Deletion is irreversible and, if it
 * could be hammered, is also a way to grind a Firestore project. The portal
 * route makes an authenticated call to Polar on the operator's token, and a
 * loop against it would burn the operator's rate limit with Polar rather
 * than the caller's.
 *
 * WHY THESE NUMBERS. They are ceilings on abuse, not on use: nobody
 * legitimately downloads their data six times in a day. Deletion allows ten
 * because a retry after a partial failure is the designed recovery path and
 * must not lock someone out of finishing.
 *
 * Counted per signed-in account per UTC day in the existing `quotas`
 * collection, under a document id that cannot collide with a meter's (see
 * `limitDocPath`) and that carries `subject: uid, kind: 'user'`, which is
 * precisely what the deletion sweep removes. The counter therefore cleans up
 * after itself when the account goes.
 */

export type AccountAction = 'export' | 'delete' | 'portal'

export const ACCOUNT_LIMITS: Record<AccountAction, number> = {
  export: 5,
  delete: 10,
  portal: 30,
}

/** UTC day, matching every other counter in `quotas`. */
export function dayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}

/**
 * Where a day's count lives.
 *
 * `acct-` cannot be the start of a meter segment (those are a single
 * letter, then `u` or `a`, then `_`), so this never shares a document with
 * an export or search counter.
 */
export function limitDocPath(uid: string, action: AccountAction, day: string): string {
  return `quotas/${day}__acct-${action}_${uid}`
}

/** Seconds until the next UTC midnight, for `Retry-After`. Never below 1. */
export function secondsUntilReset(now: Date = new Date()): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  return Math.max(1, Math.ceil((next - now.getTime()) / 1000))
}

/** The whole decision, given what was already counted. */
export function decide(
  action: AccountAction,
  alreadyUsed: number,
): { ok: boolean; used: number; limit: number } {
  const limit = ACCOUNT_LIMITS[action]
  return alreadyUsed >= limit
    ? { ok: false, used: alreadyUsed, limit }
    : { ok: true, used: alreadyUsed + 1, limit }
}
