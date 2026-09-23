/**
 * Account deletion, as an ordered list of steps.
 *
 * ── THE SHAPE OF THE PROBLEM ────────────────────────────────────────────
 *
 * Firestore has no cross-collection transaction that could span this, and
 * Firebase Authentication is a separate system again. So a deletion is not
 * atomic and pretending it is would mean a half-deleted account that says
 * "success". What can be promised instead is three properties, and every
 * decision below serves one of them:
 *
 *   RESUMABLE   Each step is safe to run twice and finds its own work by
 *               query, so a request that died halfway is finished by asking
 *               again. Nothing depends on remembering what already happened.
 *
 *   LAST THING  The Firebase Auth user is deleted at the very end. While it
 *               exists the person can still sign in and retry; the moment it
 *               is gone there is nothing left to retry. A failure anywhere
 *               earlier therefore leaves an account that still works and a
 *               list of exactly which step to blame.
 *
 *   READ FIRST  Steps that need the profile (the API key hash, the Polar
 *               customer id, the subscription ids) all run before the step
 *               that deletes it. Reordering them is the one edit here that
 *               would turn a clean deletion into an orphaned index.
 *
 * ── WHAT IS KEPT ────────────────────────────────────────────────────────
 *
 * Purchase records stay, with the person cut loose from them — see
 * `purchaseTombstone` — because /privacy says invoice records are kept for
 * as long as tax law requires. That is the one place this file writes
 * instead of deletes, and `policy.ts` says why for every collection.
 *
 * No `server-only` and no Admin SDK: the steps talk to an `AccountStore`.
 */

import { createHash } from 'node:crypto'
import type { AccountStore } from './store'
import {
  loadTeams,
  planTeamAction,
  purchaseTombstone,
  redactedEventPatch,
  webhookEventPaths,
} from './billing'

/* ------------------------------------------------------------------ *
 *  Confirmation
 * ------------------------------------------------------------------ */

// The comparison itself is in ./confirm, which the browser also imports so the
// button enables exactly when the server would accept. Re-exported here so the
// server side has one place to import the whole deletion vocabulary from.
export { confirmationMatches, normaliseEmail } from './confirm'

/**
 * The document id both mailing-list collections use for an address.
 *
 * Same function as `idFor` in `firebase/subscribers.ts` and `docId` in
 * `api/newsletter/route.ts`: SHA-256 of the trimmed, lowercased address.
 * Restated because both of those are inside modules that import the Admin
 * SDK. `deletion.test.ts` pins the digest so a change to either original
 * fails there rather than silently orphaning list entries.
 */
export function subscriberDocId(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
}

/* ------------------------------------------------------------------ *
 *  Steps
 * ------------------------------------------------------------------ */

export interface DeletionContext {
  uid: string
  /** The account email as Firebase Authentication has it, if it does. */
  email: string | null
  /** A Firestore Timestamp in production; anything in a test. */
  now: unknown
}

export interface DeletionStep {
  id: string
  /** For the person: what this step does, in a few words. */
  label: string
  /** Collection names this step is responsible for. Checked against policy. */
  covers: string[]
  /**
   * A fatal failure stops the run. A non-fatal one is reported and the run
   * continues — used only where failing must not trap someone in an account
   * they have asked to leave, and where the failure is reported honestly.
   */
  fatal: boolean
  run: () => Promise<string | void>
}

export type StepStatus = 'done' | 'failed' | 'skipped' | 'warning'

export interface StepOutcome {
  id: string
  label: string
  status: StepStatus
  detail?: string
  error?: string
}

export interface DeletionResult {
  /** True only when every fatal step finished, including the Auth deletion. */
  ok: boolean
  steps: StepOutcome[]
  /** Things that did not block deletion but need a human. */
  manualFollowUp: string[]
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null
}

/**
 * The deletion plan, in the only order that is safe.
 *
 * Built lazily: nothing here touches the store until a step runs, so
 * constructing the plan to inspect it (the test does) costs nothing.
 */
export function buildDeletionSteps(store: AccountStore, ctx: DeletionContext): DeletionStep[] {
  const { uid } = ctx
  const userPath = `users/${uid}`

  return [
    {
      id: 'billing-records',
      label: 'Detach purchase records from your account',
      covers: ['purchases', 'webhookEvents', 'polarCustomers'],
      fatal: true,
      async run() {
        const profile = (await store.getDoc(userPath))?.data ?? null
        const purchases = await store.list('purchases', { userId: uid })
        const customers = await store.list('polarCustomers', { userId: uid })
        const teams = await loadTeams(store, uid, profile)

        // Every id Polar could have quoted back to us about this person.
        const subscriptions = new Set<string>()
        for (const team of teams) {
          if (text(team.data.ownerId) !== uid) continue
          const sub = text(team.data.polarSubscriptionId)
          if (sub) subscriptions.add(sub)
        }
        const plusSub = text(profile?.plusSubscriptionId)
        if (plusSub) subscriptions.add(plusSub)

        const orders = new Set(purchases.map((p) => p.id))
        for (const team of teams) {
          const order = text(team.data.polarOrderId)
          if (order && text(team.data.ownerId) === uid) orders.add(order)
        }
        const checkouts = purchases
          .map((p) => text(p.data.polarCheckoutId))
          .filter((id): id is string => id !== null)
        const customerIds = new Set(customers.map((c) => c.id))
        const linked = text(profile?.polarCustomerId)
        if (linked) customerIds.add(linked)

        // Payloads first, purchases second. A failure between the two leaves
        // purchases still pointing at this account, so the retry finds the
        // same order ids and blanks the same payloads again.
        const paths = webhookEventPaths({
          orders: [...orders],
          subscriptions: [...subscriptions],
          checkouts,
          customers: [...customerIds],
        })
        for (const path of paths) await store.patch(path, redactedEventPatch(ctx.now))

        for (const purchase of purchases) {
          await store.patch(purchase.path, purchaseTombstone(ctx.now))
        }
        await store.removeWhere('polarCustomers', { userId: uid })

        return `${purchases.length} purchase record(s) kept without your identity`
      },
    },
    {
      id: 'workspaces',
      label: 'Leave or close your workspaces',
      covers: ['teams', 'members', 'brandPresets'],
      fatal: true,
      async run() {
        const profile = (await store.getDoc(userPath))?.data ?? null
        const teams = await loadTeams(store, uid, profile)
        const counts = { delete: 0, orphan: 0, leave: 0 }

        for (const team of teams) {
          const action = planTeamAction(uid, team)
          counts[action] += 1

          if (action === 'delete') {
            await store.removeTree(`teams/${team.id}`)
            continue
          }

          await store.leaveTeam(team.id, uid)
          // A preset someone else's colleagues still use stays; the pointer
          // back to the person who made it does not.
          const authored = await store.list(`teams/${team.id}/brandPresets`, { createdBy: uid })
          for (const preset of authored) await store.patch(preset.path, { createdBy: null })

          if (action === 'orphan') {
            await store.patch(`teams/${team.id}`, {
              ownerId: null,
              inviteCode: undefined,
              ownerDeletedAt: ctx.now,
            })
          }
        }

        return `${counts.delete} closed, ${counts.leave + counts.orphan} left`
      },
    },
    {
      id: 'api-key',
      label: 'Revoke your licence key',
      covers: ['apiKeys'],
      fatal: true,
      async run() {
        const profile = (await store.getDoc(userPath))?.data ?? null
        const hash = text(record(profile?.apiKey).hash)
        if (hash) await store.remove(`apiKeys/${hash}`)
        // The profile is the source of truth, but an index row whose profile
        // side was rotated away half-way is still a live key for this uid.
        const removed = await store.removeWhere('apiKeys', { userId: uid })
        return hash || removed ? 'key revoked' : 'no key'
      },
    },
    {
      id: 'passkeys',
      label: 'Remove your passkeys',
      covers: ['passkeys', 'webauthnChallenges'],
      fatal: true,
      async run() {
        const removed = await store.removeWhere('passkeys', { uid })
        await store.removeWhere('webauthnChallenges', { uid })
        return `${removed} passkey(s) removed`
      },
    },
    {
      id: 'usage-counters',
      label: 'Remove your usage counters',
      covers: ['quotas'],
      fatal: true,
      async run() {
        // `kind` is in the filter so an anonymous bucket whose salted hash
        // happened to equal a uid could never be swept up. It cannot, but
        // the guard costs one equality clause.
        const removed = await store.removeWhere('quotas', { subject: uid, kind: 'user' })
        return `${removed} counter(s) removed`
      },
    },
    {
      id: 'shares',
      label: 'Turn off your public collection links',
      covers: ['collectionShares', 'sharedCollections'],
      fatal: true,
      async run() {
        // Public side first: the moment it is gone the link stops resolving,
        // which is the part that matters if the second delete then fails.
        const publicRows = await store.removeWhere('sharedCollections', { uid })
        const ownerRows = await store.removeWhere('collectionShares', { uid })
        return `${Math.max(publicRows, ownerRows)} link(s) removed`
      },
    },
    {
      id: 'feedback',
      label: 'Remove feedback you signed with your email',
      covers: ['feedback'],
      fatal: true,
      async run() {
        const profile = (await store.getDoc(userPath))?.data ?? null
        const emails = new Set<string>()
        if (ctx.email) emails.add(ctx.email.trim().toLowerCase())
        const onProfile = text(profile?.email)
        if (onProfile) emails.add(onProfile.trim().toLowerCase())

        // Stored lowercased (see validateFeedback). Rows sent without an
        // email carry nothing that ties them to anyone and are not touched.
        let removed = 0
        for (const email of emails) removed += await store.removeWhere('feedback', { email })
        return `${removed} report(s) removed`
      },
    },
    {
      id: 'mailing-list',
      label: 'Remove you from the mailing list',
      covers: ['subscribers', 'newsletterSubscribers'],
      fatal: true,
      async run() {
        const profile = (await store.getDoc(userPath))?.data ?? null
        const emails = new Set<string>()
        if (ctx.email) emails.add(ctx.email.trim().toLowerCase())
        const onProfile = text(profile?.email)
        if (onProfile) emails.add(onProfile.trim().toLowerCase())

        for (const email of emails) {
          const id = subscriberDocId(email)
          await store.remove(`subscribers/${id}`)
          await store.remove(`newsletterSubscribers/${id}`)
        }
        return `${emails.size} address(es) checked`
      },
    },
    {
      id: 'mail-provider',
      label: 'Remove you from the email delivery provider',
      covers: [],
      // Not fatal. A provider outage, or a key that has since been
      // rotated, must not leave someone unable to delete their account. It
      // is reported as a follow-up and the person is told, in words, so it
      // is a known loose end rather than a silent one.
      fatal: false,
      async run() {
        if (!ctx.email) return 'no address on record'
        const result = await store.removeMailContact(ctx.email)
        return result === 'not-configured' ? 'no provider configured' : result
      },
    },
    {
      id: 'profile',
      label: 'Delete your profile and everything saved to it',
      covers: [
        'users',
        'favorites',
        'bundle',
        'collections',
        'toolPresets',
        'creditLedger',
        'renewals',
      ],
      fatal: true,
      async run() {
        await store.removeTree(userPath)
      },
    },
    {
      id: 'sessions',
      label: 'Sign you out everywhere',
      covers: [],
      fatal: true,
      async run() {
        await store.revokeSessions(uid)
      },
    },
    {
      // LAST. See the header: while this has not run, the account can still
      // be signed into and the whole thing retried.
      id: 'auth-account',
      label: 'Delete your sign-in account',
      covers: [],
      fatal: true,
      async run() {
        await store.deleteAuthUser(uid)
      },
    },
  ]
}

function describe(err: unknown): string {
  if (err instanceof Error && err.message) return err.message.slice(0, 300)
  return 'Unknown error'
}

/**
 * Run the plan and report every step.
 *
 * A fatal failure stops the run and marks everything after it `skipped`, so
 * the response always accounts for the whole plan: what happened, what
 * broke, and what was never attempted. Nothing is thrown out of here.
 */
export async function executeSteps(
  steps: DeletionStep[],
  log: (message: string, err: unknown) => void = () => {},
): Promise<DeletionResult> {
  const outcomes: StepOutcome[] = []
  const manualFollowUp: string[] = []
  let stoppedAt: string | null = null

  for (const step of steps) {
    if (stoppedAt) {
      outcomes.push({
        id: step.id,
        label: step.label,
        status: 'skipped',
        detail: `Not attempted because "${stoppedAt}" failed.`,
      })
      continue
    }

    try {
      const detail = await step.run()
      outcomes.push({
        id: step.id,
        label: step.label,
        status: 'done',
        ...(detail ? { detail } : {}),
      })
    } catch (err) {
      log(`[account/delete] step ${step.id} failed:`, err)
      if (step.fatal) {
        stoppedAt = step.id
        outcomes.push({
          id: step.id,
          label: step.label,
          status: 'failed',
          error: describe(err),
        })
      } else {
        manualFollowUp.push(`${step.label}: ${describe(err)}`)
        outcomes.push({
          id: step.id,
          label: step.label,
          status: 'warning',
          error: describe(err),
        })
      }
    }
  }

  return { ok: stoppedAt === null, steps: outcomes, manualFollowUp }
}
