/**
 * GET /api/newsletter/unsubscribe?token=… → an HTML confirmation
 *
 * The "unsubscribe in one click" half of the promise in the signup band.
 * One click means one GET: no login, no "are you sure", no preference
 * centre. The token is issued at signup and stored beside the address (see
 * ../route.ts), so this link can be dropped into the footer of every email
 * the list ever sends.
 *
 * It answers with HTML rather than JSON because the only thing that will
 * ever open it is a mail client's browser, and a page of raw JSON reads as
 * a failure to the person who clicked. The markup is inline and
 * self-contained — an unsubscribe page that depends on the app's CSS
 * bundle is a page that breaks in the one context it exists for.
 *
 * Unknown and already-used tokens get the same confirmation as a valid
 * one. There is nothing to gain by telling a stranger holding a guessed
 * token whether it matched something, and someone clicking twice should
 * not be told they failed.
 */

import { FieldValue } from 'firebase-admin/firestore'
import { adminDb, isAdminConfigured } from '@/lib/firebase/admin'

export const runtime = 'nodejs'

const COLLECTION = 'newsletterSubscribers'

function page(title: string, body: string, status: number): Response {
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
<style>
  :root { color-scheme: light dark; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    padding: 2rem; background: #fafbfb; color: #111a19;
    font: 16px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  main { max-width: 32rem; text-align: center; }
  h1 { font-size: 1.5rem; margin: 0 0 .75rem; letter-spacing: -.01em; }
  p { margin: 0; color: #41514e; }
  a { color: #00674c; margin-top: 1.5rem; display: inline-block; }
  @media (prefers-color-scheme: dark) {
    body { background: #0c1211; color: #e8efed; }
    p { color: #a7b6b3; }
    a { color: #4fd6a8; }
  }
</style>
</head>
<body><main><h1>${title}</h1><p>${body}</p>
<a href="/">Back to Hoverlab</a></main></body>
</html>`,
    {
      status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    },
  )
}

export async function GET(req: Request): Promise<Response> {
  const token = new URL(req.url).searchParams.get('token')?.trim()

  if (!token) {
    return page(
      'Link incomplete',
      'This unsubscribe link is missing its token. Reply to any email from us and we will remove you by hand.',
      400,
    )
  }

  if (!isAdminConfigured()) {
    return page(
      'Something went wrong',
      'We could not reach the mailing list just now, so nothing changed. Please try the link again shortly.',
      503,
    )
  }

  try {
    const matches = await adminDb()
      .collection(COLLECTION)
      .where('unsubscribeToken', '==', token)
      .limit(1)
      .get()

    if (!matches.empty) {
      await matches.docs[0]!.ref.set(
        { status: 'unsubscribed', unsubscribedAt: FieldValue.serverTimestamp() },
        { merge: true },
      )
    }
  } catch (err) {
    console.error('[newsletter/unsubscribe] failed:', err)
    return page(
      'Something went wrong',
      'We could not complete that just now, so nothing changed. Please try the link again shortly.',
      503,
    )
  }

  return page(
    "You're unsubscribed",
    'That address will not hear from us again. No confirmation email is coming — that would rather defeat the point.',
    200,
  )
}
