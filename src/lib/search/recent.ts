/**
 * Recent searches for the command palette.
 *
 * A convenience, and treated as one: it lives in `localStorage`, which can
 * be missing, full, blocked or throw outright (private windows, blocked site
 * data, the thumbnail renderer), so every read and write is wrapped and the
 * palette works identically with none of it. Nothing about it is sent
 * anywhere — it is a list of strings in the visitor's own browser, and
 * clearing it is one control.
 *
 * The list logic is pure and takes the storage as an argument, so the
 * behaviour that matters — dedupe, order, the cap — is tested without a DOM.
 */

export const RECENT_KEY = 'hoverlab:recent-searches'
export const RECENT_MAX = 6

/** The slice of `Storage` this needs, so a test can pass a Map-backed stub. */
export interface RecentStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/**
 * Add a query to the front of the list.
 *
 * A repeat moves to the front rather than appearing twice (compared without
 * regard to case or surrounding space), anything under two characters is
 * not worth remembering, and the list is capped. The stored casing is the
 * latest one typed.
 */
export function pushRecent(list: readonly string[], query: string, max = RECENT_MAX): string[] {
  const q = query.trim().replace(/\s+/g, ' ').slice(0, 80)
  if (q.length < 2) return [...list]
  const key = q.toLowerCase()
  return [q, ...list.filter((x) => x.toLowerCase() !== key)].slice(0, max)
}

/** Validate whatever came out of storage: it is untrusted, whoever wrote it. */
export function parseRecent(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((x): x is string => typeof x === 'string' && x.trim().length >= 2)
      .slice(0, RECENT_MAX)
  } catch {
    return []
  }
}

function defaultStore(): RecentStore | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export function readRecent(store: RecentStore | null = defaultStore()): string[] {
  try {
    return parseRecent(store?.getItem(RECENT_KEY) ?? null)
  } catch {
    return []
  }
}

/** Record a query and return the new list. Never throws. */
export function rememberSearch(query: string, store: RecentStore | null = defaultStore()): string[] {
  const next = pushRecent(readRecent(store), query)
  try {
    store?.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    /* storage full or blocked — the in-memory list still works this session */
  }
  return next
}

export function clearRecent(store: RecentStore | null = defaultStore()): void {
  try {
    store?.removeItem(RECENT_KEY)
  } catch {
    /* nothing to clear if storage is unavailable */
  }
}
