/**
 * POST /api/feedback
 * body { level, id, kind, message?, email?, website? } → { ok: true }
 *
 * "Was this useful?" and "Report a problem", from every artifact detail
 * page. Stored in Firestore `feedback`, read with
 * `scripts/read-feedback.mts`. There is no admin UI on purpose: reading a
 * few reports a week does not need one, and there is no public display of
 * any of it — no ratings, no comments, no counts. Social proof stays absent
 * by design (the same call as the invented "1,200+ developers" line that
 * was removed from the newsletter band).
 *
 * What is stored, and nothing else:
 *   artifactId, level, kind, message, email (only if the person gave one and
 *   only on a problem report), ipHash, createdAt.
 *
 * `ipHash` is the salted hash from `lib/rate-limit.ts`, not an address. It
 * is here so one noisy source can be spotted and filtered when reading, and
 * it cannot be turned back into an IP. `email` is personal data and is
 * stored only because the person typed it to be replied to; it appears in
 * the privacy notice.
 *
 * Public and account-free, because a bug report from somebody who was not
 * willing to sign in is worth more than none. That makes it an open write
 * endpoint, so: per-IP rate limit first (10 an hour), a strict allow-list
 * on every field (`lib/feedback/validate.ts`), the artifact id checked
 * against the real catalogs, a body-size cap, and a honeypot.
 *
 * When Firestore is not configured the route says so with a 503 instead of
 * answering `ok` and dropping the report — the failure mode this project
 * has already had once with the newsletter form.
 */

import { NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { withJsonErrors } from '@/lib/route-errors'
import { adminDb, isAdminConfigured } from '@/lib/firebase/admin'
import { enforceRateLimit, rateLimitKey, RATE_LIMITS } from '@/lib/rate-limit'
import { artifactExists } from '@/lib/feedback/catalog'
import { MAX_BODY_CHARS, validateFeedback } from '@/lib/feedback/validate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const POST = withJsonErrors('api/feedback', async (req: Request) => {
  const limited = await enforceRateLimit(req, RATE_LIMITS.feedback)
  if (limited) return limited

  // Read as text so the size cap applies before any parsing. A declared
  // length is a hint; the read is what is measured.
  const raw = await req.text().catch(() => '')
  if (raw.length > MAX_BODY_CHARS) {
    return NextResponse.json({ error: 'That is too long.' }, { status: 413 })
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const verdict = validateFeedback(parsed, artifactExists)
  if (!verdict.ok) {
    if ('honeypot' in verdict) return NextResponse.json({ ok: true })
    return NextResponse.json({ error: verdict.error }, { status: verdict.status })
  }

  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          'Feedback is not configured on this deployment, so nothing was saved. ' +
          'Please try again later.',
      },
      { status: 503 },
    )
  }

  const { level, id, kind, message, email } = verdict.value

  await adminDb()
    .collection('feedback')
    .add({
      artifactId: id,
      level,
      kind,
      message,
      ...(email ? { email } : {}),
      ipHash: rateLimitKey(req),
      createdAt: FieldValue.serverTimestamp(),
    })

  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
})
