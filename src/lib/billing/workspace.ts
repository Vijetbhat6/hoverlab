import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { generateInviteCode, normalizeInviteCode } from './invite-code'

/**
 * Workspaces — the seats behind Studio and Team.
 *
 * A workspace is a `teams/{id}` document. Two kinds share it:
 *
 *   kind 'studio'  a one-time license covering N people, status 'lifetime'
 *   kind 'team'    a per-seat subscription, status from Polar
 *
 * Both need the same thing from this module: a way for the buyer to let
 * other people in. Seats are claimed with a code rather than an emailed
 * invitation on purpose — an invite flow needs a mail sender, a token
 * table, an expiry policy and a bounce story before anyone can use their
 * second seat, whereas a code can be pasted into Slack the minute the
 * receipt arrives. It can be rotated if it leaks, and it can never let more
 * people in than the license was sold for.
 *
 * Seat accounting lives in `seatsUsed` on the workspace document rather than
 * being counted from the members subcollection, because the check and the
 * write have to happen in one transaction: two people redeeming the last
 * seat at the same moment would both count nine members and both join.
 *
 * The code generator and parser live in `./invite-code`, which carries no
 * `server-only` import, so they can be unit tested without a Firestore.
 */

export { generateInviteCode, normalizeInviteCode }

/** A workspace, as the account UI needs to render it. */
export interface Workspace {
  id: string
  name: string
  kind: 'studio' | 'team'
  /** Seats the license or subscription pays for. */
  seats: number
  /** Seats claimed so far, including the owner. */
  seatsUsed: number
  /** True when the current user owns it — only they see the code. */
  isOwner: boolean
  /** Present for the owner only. */
  inviteCode: string | null
}

/** Statuses that still entitle a seat. Mirrors `teamIsLive` in entitlements.ts. */
function isLive(status: unknown, currentPeriodEnd: unknown): boolean {
  if (status === 'active' || status === 'lifetime') return true
  if (status === 'past_due' || status === 'canceled') {
    const end =
      currentPeriodEnd instanceof Timestamp ? currentPeriodEnd.toDate() : null
    return end !== null && end.getTime() > Date.now()
  }
  return false
}

/**
 * The live workspace this user belongs to, or null.
 *
 * Reads `teamIds` off the profile — the same single-document path
 * `getEntitlements()` uses, for the same reason: a collection-group query
 * across every members subcollection needs a composite index and spends a
 * query on a hot path.
 */
export async function getWorkspaceForUser(userId: string): Promise<Workspace | null> {
  const db = adminDb()
  const profile = await db.collection('users').doc(userId).get()
  const teamIds: string[] = Array.isArray(profile.data()?.teamIds)
    ? profile.data()!.teamIds.filter((id: unknown): id is string => !!id && typeof id === 'string')
    : []
  if (!teamIds.length) return null

  const snaps = await db.getAll(...teamIds.map((id) => db.collection('teams').doc(id)))
  for (const snap of snaps) {
    if (!snap.exists) continue
    const t = snap.data() ?? {}
    if (!isLive(t.subscriptionStatus, t.currentPeriodEnd)) continue

    const isOwner = t.ownerId === userId
    return {
      id: snap.id,
      name: typeof t.name === 'string' ? t.name : 'Workspace',
      kind: t.kind === 'studio' ? 'studio' : 'team',
      seats: typeof t.seats === 'number' ? t.seats : 1,
      seatsUsed: typeof t.seatsUsed === 'number' ? t.seatsUsed : 1,
      isOwner,
      // Anyone with the code can take a seat, so it is the owner's to hand
      // out and nobody else's to read.
      inviteCode: isOwner && typeof t.inviteCode === 'string' ? t.inviteCode : null,
    }
  }
  return null
}

/** Why a redemption failed, in terms the UI can put in front of a person. */
export type JoinResult =
  | { ok: true; workspace: Workspace }
  | { ok: false; reason: 'invalid' | 'expired' | 'full' | 'already' }

/**
 * Claim a seat with an invite code.
 *
 * The seat count and the membership write happen in one transaction, so the
 * last seat cannot be handed to two people who redeem at the same instant.
 */
export async function joinWorkspaceByCode(
  userId: string,
  rawCode: string,
): Promise<JoinResult> {
  const code = normalizeInviteCode(rawCode)
  if (!code) return { ok: false, reason: 'invalid' }

  const db = adminDb()
  const found = await db
    .collection('teams')
    .where('inviteCode', '==', code)
    .limit(1)
    .get()
  if (found.empty) return { ok: false, reason: 'invalid' }

  const teamRef = found.docs[0]!.ref

  const outcome = await db.runTransaction(async (tx) => {
    const snap = await tx.get(teamRef)
    const t = snap.data() ?? {}

    // Re-read inside the transaction: a subscription can lapse between the
    // lookup above and the write below, and a lapsed workspace must not
    // gain members.
    if (!isLive(t.subscriptionStatus, t.currentPeriodEnd)) {
      return { ok: false, reason: 'expired' } as const
    }

    const memberRef = teamRef.collection('members').doc(userId)
    if ((await tx.get(memberRef)).exists) {
      return { ok: false, reason: 'already' } as const
    }

    const seats = typeof t.seats === 'number' ? t.seats : 1
    const seatsUsed = typeof t.seatsUsed === 'number' ? t.seatsUsed : 1
    if (seatsUsed >= seats) return { ok: false, reason: 'full' } as const

    tx.set(memberRef, { userId, role: 'member', joinedAt: Timestamp.now() })
    tx.update(teamRef, { seatsUsed: seatsUsed + 1 })
    tx.update(db.collection('users').doc(userId), {
      teamIds: FieldValue.arrayUnion(teamRef.id),
    })
    return { ok: true } as const
  })

  if (!outcome.ok) return outcome

  const workspace = await getWorkspaceForUser(userId)
  return workspace
    ? { ok: true, workspace }
    : // The write landed but the read-back didn't find it, which can only
      // mean the workspace lapsed in between. Report it rather than
      // claiming a seat the user does not have.
      { ok: false, reason: 'expired' }
}

/**
 * Replace a workspace's invite code. Owner-only; enforced by the caller,
 * which is the only place that knows who is asking.
 */
export async function rotateInviteCode(teamId: string): Promise<string> {
  const code = generateInviteCode()
  await adminDb().collection('teams').doc(teamId).update({ inviteCode: code })
  return code
}
