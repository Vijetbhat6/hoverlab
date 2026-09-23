/**
 * The narrow interface the export and deletion logic talk to.
 *
 * Path-based, generic, and a dozen methods wide, so that everything with a
 * decision in it (what to include, what to redact, which step goes first,
 * what counts as blocking) lives in pure functions that a test can drive
 * against an in-memory implementation. The Firestore-backed implementation is
 * `firestore-store.ts`; it is the only file in this feature that imports the
 * Admin SDK.
 *
 * WHY NOT TEST AGAINST THE FIRESTORE EMULATOR. There is none in this repo and
 * this feature must not need one to be verified. The interface is small
 * enough that the in-memory fake in the tests is a page long, and the
 * behaviours that matter here — order of steps, what survives, what a retry
 * does — are properties of the plan, not of Firestore.
 */

/** A document, with the path it lives at. */
export interface Doc {
  /** Last path segment. */
  id: string
  /** Full path, `users/abc/favorites/xyz`. */
  path: string
  data: Record<string, unknown>
}

/** What Firebase Authentication knows. Never includes credentials. */
export interface AuthRecord {
  uid: string
  email: string | null
  displayName: string | null
  emailVerified: boolean
  createdAt: string | null
  lastSignInAt: string | null
  /** Provider ids, e.g. `password`, `google.com`. */
  providers: string[]
}

export type MailRemoval = 'removed' | 'absent' | 'not-configured'

export interface AccountStore {
  getDoc(path: string): Promise<Doc | null>
  /**
   * Documents in a collection (`passkeys`, `users/abc/favorites`), optionally
   * narrowed by equality on fields. Equality-only, so no composite index is
   * ever required.
   */
  list(path: string, where?: Record<string, unknown>): Promise<Doc[]>
  /** Names of the subcollections under a document. */
  listSubcollections(path: string): Promise<string[]>
  /**
   * Merge fields into an existing document. A value of `undefined` deletes
   * that field. Missing documents are left missing rather than created.
   */
  patch(path: string, fields: Record<string, unknown>): Promise<void>
  /** Delete one document. Resolves whether or not it existed. */
  remove(path: string): Promise<void>
  /** Delete every document matching the equality filter. Returns the count. */
  removeWhere(path: string, where: Record<string, unknown>): Promise<number>
  /** Delete a document and every subcollection beneath it. */
  removeTree(path: string): Promise<void>
  /**
   * Take one member out of a workspace: delete their member document and
   * give the seat back, in one transaction, never going below one.
   */
  leaveTeam(teamId: string, uid: string): Promise<void>

  getAuthRecord(uid: string): Promise<AuthRecord | null>
  revokeSessions(uid: string): Promise<void>
  /** Deleting a user that is already gone is success. */
  deleteAuthUser(uid: string): Promise<void>

  /** Remove an address from the external mailing provider, if there is one. */
  removeMailContact(email: string): Promise<MailRemoval>
}
