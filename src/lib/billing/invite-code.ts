/**
 * Workspace invite codes — generating them and reading them back.
 *
 * Split out of `workspace.ts` so it can be tested: that module is
 * `server-only` and pulls in the Firestore admin SDK, and these two
 * functions are pure string handling that deserves a test of its own. They
 * are also the part most likely to be got wrong, since one end has to
 * accept whatever a person pastes and the other has to stay unguessable.
 */

/**
 * Alphabet for invite codes: no O/0, I/1, or U.
 *
 * The first two pairs are what people mistype when copying a code out of a
 * screenshot; U is dropped so the generator cannot spell anything
 * unfortunate. 31 symbols over 8 characters is ~40 bits — far more than a
 * code guarded by a seat limit needs.
 */
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTVWXYZ23456789'

/** A fresh workspace invite code, e.g. "HL-7K2M-9QPX". */
export function generateInviteCode(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  const body = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
  return `HL-${body.slice(0, 4)}-${body.slice(4, 8)}`
}

/**
 * Normalize whatever the user pasted, or null if it cannot be a code.
 *
 * People paste codes lowercased, with stray spaces, and with the hyphens
 * lost to a line wrap; none of that should be a failed redemption. Every
 * non-alphanumeric character is dropped before comparison and the hyphens
 * are re-inserted, so "hl 7k2m 9qpx" and "HL-7K2M-9QPX" are the same code.
 *
 * Returning null rather than throwing keeps the caller's error path one
 * branch: an unparseable code and a code for a workspace that does not
 * exist are the same answer to the person typing it.
 */
export function normalizeInviteCode(raw: string): string | null {
  const bare = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!bare.startsWith('HL') || bare.length !== 10) return null
  const body = bare.slice(2)
  if (![...body].every((ch) => CODE_ALPHABET.includes(ch))) return null
  return `HL-${body.slice(0, 4)}-${body.slice(4, 8)}`
}
