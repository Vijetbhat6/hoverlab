/**
 * POST /api/account/delete   body { confirmEmail } → { ok, steps, manualFollowUp }
 *
 * Self-serve account deletion, the right to erasure without an email thread.
 *
 * The request has to clear four things, in this order, and each refusal is a
 * different status so the dialog can say the right thing:
 *
 *   401  no valid session. The cookie is expired in the response, because a
 *        stale one still reads as "signed in" to proxy.ts.
 *   403  a browser says the request came from another site.
 *   429  the daily ceiling (`lib/account/limits.ts`).
 *   400  `confirmEmail` does not match the account email. Case-insensitive.
 *   409  something still charges the person, or a workspace they own still
 *        has other people in it. NOTHING has been deleted at this point, and
 *        the body says which blocker and what to do about it.
 *
 * Only then does deletion start. It is not atomic — see
 * `lib/account/deletion.ts` — so a failure comes back as 500 with the
 * outcome of every step rather than a bare error, the session stays valid,
 * and asking again resumes. The sign-in account is deleted last so that is
 * always possible.
 *
 * Deliberately uses `getSession()` and not `getCurrentUser()`. The latter
 * treats "no profile document" as a revoked session, which is exactly the
 * state a half-finished deletion leaves behind; the retry has to be able to
 * get through it.
 *
 * Purchase records are kept, with the person cut loose from them. What
 * /privacy promises about that is the reason, and `lib/account/policy.ts`
 * holds it as data.
 */

import { getSession, buildExpiredSessionCookie } from '@/lib/session'
import { isAdminConfigured } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'
import { consumeAccountAction, firestoreAccountStore } from '@/lib/account/firestore-store'
import { buildDeletionSteps, confirmationMatches, executeSteps } from '@/lib/account/deletion'
import { findBlockers, loadTeams } from '@/lib/account/billing'
import { secondsUntilReset } from '@/lib/account/limits'
import {
  crossSiteRefused,
  isCrossSite,
  json,
  notConfigured,
  rateLimited,
  supportEmail,
  unauthenticated,
} from '@/lib/account/route-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return unauthenticated(true)
  if (isCrossSite(request)) return crossSiteRefused()
  if (!isAdminConfigured()) return notConfigured()

  let body: { confirmEmail?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return json({ error: 'Invalid JSON body.', code: 'bad_request' }, 400)
  }

  try {
    const limit = await consumeAccountAction(session.uid, 'delete')
    if (!limit.ok) return rateLimited(secondsUntilReset(), 'deleting an account')

    const store = firestoreAccountStore()

    // The Auth record is the authority on the address: the session token's
    // copy can be a sign-in old, and the profile's copy is what a later step
    // deletes.
    const auth = await store.getAuthRecord(session.uid)
    const email = auth?.email ?? (session.email || null)

    if (!email) {
      return json(
        {
          error:
            'This account has no email address on record, so it cannot be confirmed here. Email us and we will delete it by hand.',
          code: 'no_email',
          supportEmail: supportEmail(),
        },
        409,
      )
    }

    if (!confirmationMatches(body.confirmEmail, email)) {
      return json(
        {
          error: 'That is not the email address on this account. Nothing was deleted.',
          code: 'confirmation_mismatch',
        },
        400,
      )
    }

    const profile = (await store.getDoc(`users/${session.uid}`))?.data ?? null
    const teams = await loadTeams(store, session.uid, profile)
    const blockers = findBlockers({ uid: session.uid, profile, teams })
    if (blockers.length > 0) {
      return json(
        {
          error: blockers[0]!.message,
          code: 'blocked',
          blockers,
          supportEmail: supportEmail(),
        },
        409,
      )
    }

    const result = await executeSteps(
      buildDeletionSteps(store, {
        uid: session.uid,
        email,
        now: Timestamp.now(),
      }),
      (message, err) => console.error(message, err),
    )

    if (!result.ok) {
      return json(
        {
          ok: false,
          error:
            'Your account was not fully deleted. Some of your data may already be gone, and you are still signed in — try again and it will pick up where it stopped. If it keeps failing, email us.',
          code: 'partial',
          steps: result.steps,
          supportEmail: supportEmail(),
        },
        500,
      )
    }

    const res = json({
      ok: true,
      steps: result.steps,
      manualFollowUp: result.manualFollowUp,
    })
    res.headers.set('Set-Cookie', buildExpiredSessionCookie())
    return res
  } catch (err) {
    console.error('[account/delete] failed before or between steps:', err)
    return json(
      {
        ok: false,
        error:
          'We could not complete that. If any of your data was deleted, retrying will finish the job. Email us if it keeps failing.',
        code: 'failed',
        supportEmail: supportEmail(),
      },
      500,
    )
  }
}
