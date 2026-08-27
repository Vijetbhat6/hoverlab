'use client'

/**
 * The visitor's cookie decision — read it, write it, and tell everyone who
 * is gating on it.
 *
 * Deliberately knows nothing about PostHog or React. The banner writes
 * here, `analytics-provider` reads here, and neither imports the other;
 * that is what lets the gate be checked by looking at one small file
 * instead of tracing a prop through a tree.
 *
 * WHAT IS STORED, AND WHY THAT IS ALLOWED. One localStorage entry holding
 * the categories that were allowed and when. Storing the answer is itself
 * strictly necessary — the alternative is asking again on every page, which
 * no consent regime requires and every visitor hates — so it is written
 * whichever way the decision goes, including a refusal. It is not a
 * tracking id: it is the same two words for everyone who clicks the same
 * button.
 *
 * VERSION exists because the question can change. If a category is added,
 * a decision taken against the old list is not consent to the new one, so
 * a bumped version reads as "no decision" and the banner returns. Bump it
 * when CATEGORIES changes in a way that widens what is being asked for;
 * do not bump it for a copy edit.
 *
 * Everything is wrapped in try/catch. Safari with cookies blocked throws on
 * the mere act of touching localStorage, and a privacy-conscious browser
 * setting must not be the thing that white-screens the site.
 */

/** Where the decision lives. Same `hoverlab:` prefix as every other preference. */
export const CONSENT_STORAGE_KEY = 'hoverlab:cookie-consent'

/** Bump when the categories being asked about change. See the note above. */
export const CONSENT_VERSION = 1

/** Fired on `window` after a decision, so listeners in this tab react at once. */
export const CONSENT_EVENT = 'hoverlab:consent-change'

export type ConsentCategoryId = 'essential' | 'analytics'

/** The two categories this site actually has. */
export const CONSENT_CATEGORIES: readonly ConsentCategoryId[] = ['essential', 'analytics']

/** Cannot be refused, so it is never offered as a choice. */
export const ESSENTIAL_CATEGORIES: readonly ConsentCategoryId[] = ['essential']

/**
 * Is there anything to ask about?
 *
 * Analytics is the only refusable category, and it does not exist without a
 * PostHog key — local dev, CI and forks all run without one. Asking those
 * visitors to consent to storage that will never be written would be a
 * banner about nothing, and the copy naming PostHog would be false. So the
 * question, the banner, and the menu item that reopens it are all gated on
 * this. Deployments that set the key get the banner; nobody else does.
 */
export const CONSENT_REQUIRED = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY)

export interface ConsentRecord {
  version: number
  allowed: ConsentCategoryId[]
  /** ISO timestamp. Kept because "when was this given" is the first thing asked in a complaint. */
  at: string
}

function isCategory(value: unknown): value is ConsentCategoryId {
  return typeof value === 'string' && (CONSENT_CATEGORIES as readonly string[]).includes(value)
}

/**
 * The stored decision, or null when there is none to honour.
 *
 * Returns null — not a refusal — for a missing entry, unparseable JSON, or
 * a record from an older version. All three mean the same thing to every
 * caller: nothing has been agreed to, so ask, and gate everything
 * non-essential off in the meantime.
 */
export function readConsent(): ConsentRecord | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null

    const { version, allowed, at } = parsed as Partial<ConsentRecord>
    if (version !== CONSENT_VERSION) return null
    if (!Array.isArray(allowed)) return null

    return {
      version: CONSENT_VERSION,
      // Filter rather than reject: an id we have since removed should not
      // invalidate a decision that still answers the question we ask now.
      allowed: allowed.filter(isCategory),
      at: typeof at === 'string' ? at : '',
    }
  } catch {
    return null
  }
}

/**
 * Persist a decision and announce it.
 *
 * `essential` is forced in regardless of what was passed. It is not a
 * choice, and a record that omits it would read as "refused everything",
 * which is not a state this site can be in — you cannot sign in without it.
 */
export function recordConsent(allowed: readonly ConsentCategoryId[]): ConsentRecord {
  const unique = Array.from(new Set<ConsentCategoryId>([...ESSENTIAL_CATEGORIES, ...allowed]))
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    allowed: unique.filter(isCategory),
    at: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record))
    } catch {
      // Storage refused. The decision still applies for this page's
      // lifetime through the event below; it just cannot be remembered.
    }
    window.dispatchEvent(new CustomEvent<ConsentRecord>(CONSENT_EVENT, { detail: record }))
  }

  return record
}

/** Forget the decision, so the banner asks again. Used by "Ask me again". */
export function clearConsent(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY)
  } catch {
    // Nothing to do — see recordConsent.
  }
  window.dispatchEvent(new CustomEvent<null>(CONSENT_EVENT, { detail: null }))
}

/** True only for a stored decision that names analytics. Absence is a no. */
export function allowsAnalytics(record: ConsentRecord | null): boolean {
  return Boolean(record?.allowed.includes('analytics'))
}

/**
 * Call `listener` whenever the decision changes, in this tab or another.
 *
 * The `storage` half is what stops two open tabs disagreeing: refusing in
 * one and leaving the other capturing would make the refusal a lie in every
 * tab but the one it was clicked in.
 */
export function subscribeConsent(listener: (record: ConsentRecord | null) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const onLocal = (event: Event) => {
    listener((event as CustomEvent<ConsentRecord | null>).detail ?? null)
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== CONSENT_STORAGE_KEY) return
    listener(readConsent())
  }

  window.addEventListener(CONSENT_EVENT, onLocal)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CONSENT_EVENT, onLocal)
    window.removeEventListener('storage', onStorage)
  }
}
