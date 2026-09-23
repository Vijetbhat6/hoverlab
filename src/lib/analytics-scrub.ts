/**
 * Keeps secret share links out of analytics.
 *
 * `/c/<token>` is a capability URL: whoever holds it can read the collection
 * behind it, and the only thing that revokes it is the owner. PostHog records
 * the address of every page it sees (`$current_url`, `$pathname`,
 * `$referrer`, the `$initial_*` pair) and, with click capture on, the `href` of
 * every link that is clicked. With consent given, that would copy the secret
 * into a third party's database on the first visit — quietly turning "anyone
 * with the link" into "anyone with the link, and everyone with access to the
 * analytics project".
 *
 * So the token is replaced before an event leaves the browser. The path shape
 * survives (`/c/[shared]`), which keeps "someone opened a shared collection"
 * countable without recording which one.
 *
 * Deliberately a walk over every string rather than a list of property names:
 * a list is what a new PostHog property, or an autocapture `$elements` chain
 * nested three levels down, would walk straight past.
 *
 * The pattern is the shape of the token, not its exact length, so a change to
 * how long the tokens are cannot un-scrub old links that are still live. 16
 * characters is below any token this app issues and above anything a real
 * path segment under `/c/` would be.
 */

const SHARE_TOKEN = /\/c\/[A-Za-z0-9_-]{16,}/g
const REPLACEMENT = '/c/[shared]'

/** Guards against a cyclic or absurdly deep payload; real events are shallow. */
const MAX_DEPTH = 6

function scrubValue(value: unknown, depth: number): unknown {
  if (typeof value === 'string') return value.replace(SHARE_TOKEN, REPLACEMENT)
  if (depth >= MAX_DEPTH || value === null || typeof value !== 'object') return value

  if (Array.isArray(value)) return value.map((item) => scrubValue(item, depth + 1))

  const out: Record<string, unknown> = {}
  for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
    out[key] = scrubValue(inner, depth + 1)
  }
  return out
}

/** The shape PostHog hands to `before_send`. Only what this function touches. */
export interface ScrubbableEvent {
  properties?: Record<string, unknown>
  $set?: Record<string, unknown>
  $set_once?: Record<string, unknown>
}

/**
 * Returns the event with share tokens removed from every string in it.
 *
 * Returns the same object it was given when it is null (PostHog passes null to
 * a later `before_send` after an earlier one dropped the event), and never
 * drops an event itself: a scrub that could lose data would be a reason to
 * remove it.
 */
export function scrubSharedLinks<T extends ScrubbableEvent | null>(event: T): T {
  if (!event) return event
  const next = { ...event } as ScrubbableEvent
  if (event.properties) next.properties = scrubValue(event.properties, 0) as Record<string, unknown>
  if (event.$set) next.$set = scrubValue(event.$set, 0) as Record<string, unknown>
  if (event.$set_once) next.$set_once = scrubValue(event.$set_once, 0) as Record<string, unknown>
  return next as T
}
