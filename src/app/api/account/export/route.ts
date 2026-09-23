/**
 * GET /api/account/export → a JSON file of everything held about the caller
 *
 * The self-serve half of the right of access and of data portability. Before
 * this route, /privacy said to email for a copy, which means a person waiting
 * on a human for something the database can produce in a second.
 *
 * What is in it, and what is deliberately not, is decided in
 * `lib/account/export.ts` and `lib/account/policy.ts`; this file is the
 * doorway: who may ask, how often, and how the answer is delivered.
 *
 *  - Signed in only, and only ever the caller's own uid. There is no
 *    parameter that names another account.
 *  - Rate limited per account per day (`lib/account/limits.ts`).
 *  - `Cache-Control: private, no-store`, so no shared cache or back/forward
 *    cache keeps a copy of someone's data past the request.
 *  - Sent as an attachment. The file name carries the date and nothing that
 *    identifies the account, because it will be attached to emails.
 *
 * GET rather than POST because it is a read and a plain link is the
 * simplest thing that works. That is safe: a cross-site GET cannot read the
 * response, and the cookie's SameSite=Lax means the browser only sends it on
 * a top-level navigation that the person sees.
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { isAdminConfigured } from '@/lib/firebase/admin'
import { consumeAccountAction, firestoreAccountStore } from '@/lib/account/firestore-store'
import { gatherExport, exportFileName } from '@/lib/account/export'
import { secondsUntilReset } from '@/lib/account/limits'
import {
  NO_STORE,
  json,
  notConfigured,
  rateLimited,
  supportEmail,
  unauthenticated,
} from '@/lib/account/route-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthenticated()
  if (!isAdminConfigured()) return notConfigured()

  try {
    const limit = await consumeAccountAction(session.uid, 'export')
    if (!limit.ok) return rateLimited(secondsUntilReset(), 'data downloads')

    const now = new Date()
    const document = await gatherExport(firestoreAccountStore(), session.uid, now)

    return new NextResponse(JSON.stringify(document, null, 2), {
      status: 200,
      headers: {
        ...NO_STORE,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${exportFileName(now)}"`,
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('[account/export] failed:', err)
    return json(
      {
        error:
          'We could not assemble your data just now. Nothing was changed. Try again in a minute, or email us and we will send it by hand.',
        code: 'export_failed',
        supportEmail: supportEmail(),
      },
      500,
    )
  }
}
