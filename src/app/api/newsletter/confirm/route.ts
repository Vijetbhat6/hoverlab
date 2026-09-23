/**
 * GET  /api/newsletter/confirm?token=…   → an HTML page
 * POST /api/newsletter/confirm           → { ok, outcome }   body { token }
 *
 * The second half of double opt-in: the link in the confirmation email.
 * Following it is what turns a `pending` subscriber into a `confirmed` one,
 * and `confirmed` is the only state the digest and the sequences ever mail
 * (see `lib/newsletter-state.ts`).
 *
 * GET answers with HTML for the same reason the unsubscribe link does: the
 * only thing that opens it is a mail client's browser, and a page of raw
 * JSON reads as a failure to the person who clicked. POST is there for a
 * client that would rather have JSON.
 *
 * GET changes state. That is normally a smell — a mail scanner that pre-
 * fetches every link in a message will "click" it. It is accepted here
 * because the scanner is, by construction, reading the mailbox of the
 * address the token was sent to: confirming through it still proves
 * somebody with access to that mailbox took part, which is the whole claim
 * double opt-in makes. What it must never do is un-do an opt-out, which is
 * why `decideConfirm` answers `unsubscribed` rather than resurrecting a row.
 *
 * Every outcome a person can arrive with has a page of its own: confirmed,
 * already confirmed (a second click, or a pre-fetch followed by the human),
 * invalid (mistyped, or replaced by a newer email), expired (seven days),
 * and unsubscribed since. "Already confirmed" is a success page, not an
 * error — nobody who clicked twice should be told they failed.
 */

import { confirmSubscription } from '@/lib/firebase/subscribers'
import { isAdminConfigured } from '@/lib/firebase/admin'
import { htmlPage } from '@/lib/newsletter-page'
import type { ConfirmOutcome } from '@/lib/newsletter-state'

export const runtime = 'nodejs'

type Outcome = ConfirmOutcome | 'unavailable' | 'missing'

const PAGES: Record<Outcome, { title: string; body: string; status: number }> = {
  confirmed: {
    title: "You're confirmed",
    body:
      'Thank you. From now on you will hear from us as the sign-up promised — ' +
      'and every email carries a one-click unsubscribe.',
    status: 200,
  },
  'already-confirmed': {
    title: 'Already confirmed',
    body: 'This address is already confirmed, so there is nothing more to do.',
    status: 200,
  },
  invalid: {
    title: "That link doesn't work",
    body:
      'It may have been cut off when it was copied, or replaced by a newer ' +
      'confirmation email. Sign up again from any form on the site and we will ' +
      'send a fresh link.',
    status: 400,
  },
  expired: {
    title: 'That link has expired',
    body:
      'Confirmation links last seven days. Sign up again from any form on the ' +
      'site and we will send a new one. Nothing was sent to you in the meantime.',
    status: 410,
  },
  unsubscribed: {
    title: "You've unsubscribed",
    body:
      'This address opted out after asking to join, so this link did not ' +
      're-subscribe it. If you have changed your mind, sign up again.',
    status: 409,
  },
  unavailable: {
    title: 'Something went wrong',
    body:
      'We could not reach the mailing list just now, so nothing changed. ' +
      'Please try the link again shortly.',
    status: 503,
  },
  missing: {
    title: 'Link incomplete',
    body:
      'This confirmation link is missing its token. Sign up again and we will ' +
      'send a fresh one.',
    status: 400,
  },
}

async function run(token: string | null | undefined): Promise<Outcome> {
  const trimmed = token?.trim()
  if (!trimmed) return 'missing'
  if (!isAdminConfigured()) return 'unavailable'
  return confirmSubscription(trimmed)
}

export async function GET(req: Request): Promise<Response> {
  const outcome = await run(new URL(req.url).searchParams.get('token'))
  const page = PAGES[outcome]
  return htmlPage(page.title, page.body, page.status)
}

export async function POST(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const body = (await req.json().catch(() => null)) as { token?: unknown } | null
  const token =
    typeof body?.token === 'string' ? body.token : url.searchParams.get('token')

  const outcome = await run(token)
  const ok = outcome === 'confirmed' || outcome === 'already-confirmed'
  return Response.json(
    { ok, outcome },
    { status: PAGES[outcome].status, headers: { 'Cache-Control': 'no-store' } },
  )
}
