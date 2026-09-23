/**
 * Turn Firestore documents into something safe to hand a person as JSON.
 *
 * Two jobs, both easy to get subtly wrong:
 *
 *  1. Timestamps. A Firestore `Timestamp` serialises with `JSON.stringify`
 *     as `{"_seconds":…,"_nanoseconds":…}`, which is correct and useless to
 *     anyone opening the file. They become ISO strings.
 *
 *  2. Secrets. The export is "everything we hold about you", and a few
 *     things we hold are credentials rather than data: the SHA-256 of the
 *     licence key (lookup is by that hash, so having it is having the key's
 *     index), passkey public keys, unsubscribe tokens, workspace invite
 *     codes. Handing those to the account holder is harmless; handing them to
 *     whoever gets hold of a downloaded file, a shared screen or a support
 *     ticket attachment is not. They are dropped by name, at every depth.
 *
 * A deny-list is the wrong tool on its own — the next credential someone
 * adds to a document would be exported by default — so the two collections
 * that carry the most sensitive material (`passkeys` and the subscriber
 * lists) go through explicit allow-lists in `export.ts` instead, and this
 * deny-list is the second line of defence for everything else.
 *
 * Duck-typed on purpose: no `firebase-admin` import, so this loads in a
 * plain test with no credentials and no `server-only` boundary.
 */

/** Key names that are credentials or credential-equivalents. */
export const SECRET_KEYS: ReadonlySet<string> = new Set([
  'hash',
  'publicKey',
  'unsubscribeToken',
  'inviteCode',
  'token',
  'secret',
  'password',
  'passwordHash',
  'privateKey',
  'accessToken',
  'refreshToken',
])

interface TimestampLike {
  toDate: () => Date
}

function isTimestampLike(value: unknown): value is TimestampLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  )
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/**
 * JSON-safe deep copy with timestamps as ISO strings and secrets removed.
 *
 * Anything that cannot be represented honestly (raw bytes, functions,
 * document references) is dropped instead of being stringified into
 * something misleading, and `undefined` is dropped because JSON has no such
 * value.
 */
export function toPlain(value: unknown): unknown {
  if (value === null) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString()
  }
  if (isTimestampLike(value)) {
    const date = value.toDate()
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }
  if (Array.isArray(value)) {
    return value.map((item) => toPlain(item)).filter((item) => item !== undefined)
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {}
    for (const [key, inner] of Object.entries(value)) {
      if (SECRET_KEYS.has(key)) continue
      const plain = toPlain(inner)
      if (plain !== undefined) out[key] = plain
    }
    return out
  }
  switch (typeof value) {
    case 'string':
    case 'boolean':
      return value
    case 'number':
      return Number.isFinite(value) ? value : null
    default:
      // undefined, function, symbol, bigint, class instances (Buffer,
      // DocumentReference, GeoPoint...) — nothing here we can vouch for.
      return undefined
  }
}

/** `toPlain` for a document's data, always an object. */
export function plainDoc(data: Record<string, unknown> | undefined): Record<string, unknown> {
  const out = toPlain(data ?? {})
  return isPlainObject(out) ? out : {}
}

/** Copy only the named keys, then serialise. The allow-list form. */
export function pick(
  data: Record<string, unknown> | undefined,
  keys: readonly string[],
): Record<string, unknown> {
  const source = data ?? {}
  const subset: Record<string, unknown> = {}
  for (const key of keys) {
    if (key in source) subset[key] = source[key]
  }
  return plainDoc(subset)
}
