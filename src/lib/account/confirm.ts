/**
 * The typed-email check, with nothing in it a browser cannot import.
 *
 * Lives apart from `deletion.ts` because that module reaches for
 * `node:crypto` (to hash mailing-list ids), and a client component that
 * imports it would drag Node built-ins into the bundle. The dialog needs the
 * SAME comparison the server makes — so the button enables exactly when the
 * server would accept — and two copies of a comparison are how "the button
 * says yes and the server says no" happens.
 */

/** Case-insensitive, whitespace-insensitive, Unicode-normalised. */
export function normaliseEmail(value: string): string {
  return value.normalize('NFKC').trim().toLowerCase()
}

/**
 * Does what was typed match the account email?
 *
 * The typed-email step exists so that a click cannot delete an account, and
 * so that someone on a shared machine cannot delete the wrong one. It is a
 * speed bump and not authentication: the session cookie is the credential.
 * An account with no email on record can never be confirmed, which is
 * correct — there is nothing to compare against, and guessing "yes" would
 * defeat the point.
 */
export function confirmationMatches(typed: unknown, accountEmail: unknown): boolean {
  if (typeof typed !== 'string' || typeof accountEmail !== 'string') return false
  const expected = normaliseEmail(accountEmail)
  if (!expected) return false
  return normaliseEmail(typed) === expected
}
