/**
 * What happens to each Firestore collection when someone exports their data
 * or deletes their account.
 *
 * ── WHY THIS IS A TABLE AND NOT A COMMENT ───────────────────────────────
 *
 * The deletion route is only as complete as its author's memory of which
 * collections exist. Every feature that stores something per user adds one
 * (`toolPresets`, `passkeys`, `quotas`, `apiKeys` all arrived after the
 * account model did), and the failure mode is silent: the feature works, the
 * account "deletes", and a year later somebody finds a collection still
 * holding an email address for a person who was told it was gone.
 *
 * So the rule is mechanical. `policy.test.ts` scans `src/` for every
 * collection name the code reads or writes and fails unless it appears in
 * this file with a stated reason. Adding a collection therefore forces the
 * question "what happens to it when the person leaves?" at the moment it is
 * cheapest to answer, in the same commit, instead of never.
 *
 * Deliberately no `server-only` import and no Firestore import: the table
 * is data, and the test that guards it has to be able to load it.
 *
 * ── THE THREE ANSWERS ───────────────────────────────────────────────────
 *
 *   delete        removed outright when the account is deleted.
 *   pseudonymise  KEPT, because a law requires it, with everything that
 *                 identifies the person taken out. Today: purchase records
 *                 (tax law, six to eight years — /privacy says so) and the
 *                 idempotency claims that the webhook needs in order not to
 *                 re-grant a paid order.
 *   ignore        holds no personal data at all, with the reason written
 *                 down so "ignored" is a finding and not a shrug.
 *
 * `exported` is a separate question: does the data-download include it?
 * Everything personal is exported. What is not is listed with a reason in
 * `NOT_EXPORTED`, which the file itself carries so the person reading their
 * download is told what is absent and why rather than left to assume.
 */

export type ErasureAction = 'delete' | 'pseudonymise' | 'ignore'

export interface CollectionPolicy {
  /** Where it lives, for a human reading this table. */
  where: string
  action: ErasureAction
  /** Whether the data download includes what this holds about the person. */
  exported: boolean
  /** Why. Required; the test rejects an empty one. */
  reason: string
  /**
   * True for a collection the code no longer reads or writes but whose old
   * rows may still exist in production. Exempt from the "no stale entries"
   * check, and only ever for that reason — deletion still sweeps it.
   */
  legacy?: boolean
}

/**
 * Every collection or subcollection name the app touches.
 *
 * Keyed by the literal passed to `.collection()`. A name that exists at two
 * paths (`brandPresets`, under both a user and a team) is one entry, because
 * the drift scan sees the string, not the path — its `where` names both.
 */
export const COLLECTION_POLICY: Record<string, CollectionPolicy> = {
  users: {
    where: 'users/{uid}',
    action: 'delete',
    exported: true,
    reason:
      'The profile: email, name, entitlements, credit balance, Polar customer id, API key metadata. Removed with its whole subtree.',
  },
  favorites: {
    where: 'users/{uid}/favorites',
    action: 'delete',
    exported: true,
    reason: 'Saved state. Goes with the user document.',
  },
  bundle: {
    where: 'users/{uid}/bundle',
    action: 'delete',
    exported: true,
    reason: 'Saved state. Goes with the user document.',
  },
  collections: {
    where: 'users/{uid}/collections',
    action: 'delete',
    exported: true,
    reason: 'Named lists the person made. Goes with the user document.',
  },
  toolPresets: {
    where: 'users/{uid}/toolPresets',
    action: 'delete',
    exported: true,
    reason: 'Saved designer-tool presets. Goes with the user document.',
  },
  creditLedger: {
    where: 'users/{uid}/creditLedger',
    action: 'delete',
    exported: true,
    reason:
      'Which order granted which credits. The purchase itself is retained, pseudonymised, in `purchases`.',
  },
  renewals: {
    where: 'users/{uid}/renewals',
    action: 'delete',
    exported: true,
    reason:
      'Update-window renewal ledger. The purchase itself is retained, pseudonymised, in `purchases`.',
  },
  brandPresets: {
    where: 'users/{uid}/brandPresets and teams/{teamId}/brandPresets',
    action: 'delete',
    exported: true,
    reason:
      'Personal presets go with the user document. A shared workspace preset stays with the workspace, but its `createdBy` is cleared when the author leaves.',
  },
  teams: {
    where: 'teams/{teamId}',
    action: 'delete',
    exported: true,
    reason:
      'A workspace the person owns alone is deleted. One they merely belong to loses their membership. One that still has other members is either refused (while it is live) or kept with its owner cleared.',
  },
  members: {
    where: 'teams/{teamId}/members/{uid}',
    action: 'delete',
    exported: true,
    reason: 'The membership record. Removed on leaving, or with the workspace.',
  },
  apiKeys: {
    where: 'apiKeys/{sha256(key)}',
    action: 'delete',
    exported: true,
    reason:
      'The lookup index for the licence key: a hash and a user id. Exported as metadata only — the hash is a credential-equivalent and is never returned.',
  },
  passkeys: {
    where: 'passkeys/{credentialId}',
    action: 'delete',
    exported: true,
    reason:
      'Registered passkeys. The download lists name, dates and device type; the public key and signature counter are never included.',
  },
  webauthnChallenges: {
    where: 'webauthnChallenges/{id}',
    action: 'delete',
    exported: false,
    reason:
      'A one-shot login challenge that expires after five minutes and carries no personal data beyond the uid. Deleted if present; not worth listing.',
  },
  quotas: {
    where: 'quotas/{day}__{meter}{u|a}_{subject}',
    action: 'delete',
    exported: true,
    reason:
      'Per-day usage counters, keyed by uid for signed-in people. Anonymous rows are keyed by a salted IP hash and cannot be tied to an account, so they are neither exported nor deleted here.',
  },
  polarCustomers: {
    where: 'polarCustomers/{polarCustomerId}',
    action: 'delete',
    exported: true,
    reason:
      'Our own mapping from a Polar customer id to a uid. Polar keeps its own customer record as merchant of record; that is not ours to delete.',
  },
  subscribers: {
    where: 'subscribers/{sha256(email)}',
    action: 'delete',
    exported: true,
    legacy: true,
    reason:
      'The retired second mailing list. Nothing writes it any more (both signup routes now write newsletterSubscribers) but rows written before the merge are still there, unmailed. Found by the account email and deleted with it.',
  },
  newsletterSubscribers: {
    where: 'newsletterSubscribers/{sha256(email)}',
    action: 'delete',
    exported: true,
    reason:
      'The mailing list, with recorded consent, found by the account email. The unsubscribe token and the confirmation-token hash are not exported. Deleting the account deletes the entry outright rather than leaving an "unsubscribed" marker.',
  },
  feedback: {
    where: 'feedback/{autoId}',
    action: 'delete',
    exported: true,
    reason:
      'Problem reports from artifact pages. Not keyed by account: a row is tied to a person only when they typed an email to be replied to, so those rows (matched on the account email) are exported and deleted. Rows without an email cannot be attributed to anyone and stay. The salted IP hash on a row is never exported.',
  },
  collectionShares: {
    where: 'collectionShares/{uid}__{collectionId}',
    action: 'delete',
    exported: true,
    reason:
      'The owner side of a public share link, holding the link token. Deleted by uid; the export lists which collections were shared and when, never the token.',
  },
  sharedCollections: {
    where: 'sharedCollections/{sha256(token)}',
    action: 'delete',
    exported: true,
    reason:
      'The public lookup for a share link, carrying the owner uid. Deleted by uid, which is what makes the link stop resolving. Listed in the export alongside the owner-side row.',
  },
  rateLimits: {
    where: 'rateLimits/{policy}__{ipHash}__{window}',
    action: 'ignore',
    exported: false,
    reason:
      'Per-IP request counters keyed by a salted hash of the address, expiring within hours. Nothing links a row to an account, so there is nothing to export or delete for one.',
  },
  purchases: {
    where: 'purchases/{polarOrderId}',
    action: 'pseudonymise',
    exported: true,
    reason:
      'Invoice records are kept for tax law (six to eight years, as /privacy says). On deletion the link to the person is cut — the user id is cleared — and order id, plan, amount, currency and date stay.',
  },
  webhookEvents: {
    where: 'webhookEvents/{eventId}',
    action: 'pseudonymise',
    exported: true,
    reason:
      'The webhook claims an event id here so a retried delivery cannot re-grant a paid order, so the document must survive. The stored Polar payload, which holds the customer name, email and billing address, is blanked on deletion.',
  },
  usage: {
    where: 'usage/{artifactId}',
    action: 'ignore',
    exported: false,
    reason:
      'Aggregate counters per artifact (copies, views, saves). Keyed by artifact, not person; no uid, no email, no way back to an individual.',
  },
}

/** Names the drift test treats as "deleted", derived so there is one source. */
export const DELETED_COLLECTIONS = Object.entries(COLLECTION_POLICY)
  .filter(([, p]) => p.action === 'delete')
  .map(([name]) => name)

/** Kept on purpose, with the person taken out. */
export const RETAINED_COLLECTIONS = Object.entries(COLLECTION_POLICY)
  .filter(([, p]) => p.action === 'pseudonymise')
  .map(([name]) => name)

/** Holds nothing personal. */
export const IGNORED_COLLECTIONS = Object.entries(COLLECTION_POLICY)
  .filter(([, p]) => p.action === 'ignore')
  .map(([name]) => name)

export const EXPORTED_COLLECTIONS = Object.entries(COLLECTION_POLICY)
  .filter(([, p]) => p.exported)
  .map(([name]) => name)

/**
 * What the download does not contain, printed inside the download itself.
 *
 * An export that silently omits things reads as complete. Listing the gaps
 * is what makes it a statement rather than an assumption.
 */
export const NOT_EXPORTED: { what: string; why: string }[] = [
  {
    what: 'Your password',
    why: 'Firebase Authentication holds only a salted hash of it, and neither we nor you can read it back.',
  },
  {
    what: 'Passkey public keys and signature counters',
    why: 'They are credential material. Only the names and dates are listed.',
  },
  {
    what: 'Your licence key',
    why: 'Only a hash is stored, and it is never shown again. The prefix and dates are listed so you can tell which key is live.',
  },
  {
    what: 'Workspace invite codes and other members’ details',
    why: 'They belong to the workspace, not to you.',
  },
  {
    what: 'Per-artifact copy, view and save counts',
    why: 'They are aggregates with no link to any person.',
  },
  {
    what: 'Feedback you sent without an email address',
    why: 'Nothing on it ties it to your account, so we cannot tell it is yours. Reports signed with your account email are included.',
  },
  {
    what: 'Public share-link tokens',
    why: 'The token is the link itself. The list says which collections you shared and when.',
  },
  {
    what: 'Anonymous usage counters',
    why: 'They are keyed by a salted hash of an IP address and cannot be tied to your account.',
  },
  {
    what: 'Records held by Polar, PostHog, Resend or Google Firebase',
    why: 'Each keeps its own copy under its own terms; ask them, or ask us to.',
  },
  {
    what: 'Server logs',
    why: 'Held by the host for a short period and not searchable by account.',
  },
]
