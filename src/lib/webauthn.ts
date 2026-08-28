import 'server-only'

/**
 * WebAuthn / passkey plumbing that is not about storage.
 *
 * Two things live here, both of which are easy to get subtly wrong and
 * therefore worth having in exactly one place:
 *
 *  1. The relying party identity (rpID / origin / rpName). A passkey is
 *     permanently bound to the rpID it was created under, so a value that
 *     drifts between environments does not produce an error — it produces a
 *     credential the browser silently refuses to offer, months later, with
 *     no diagnostic beyond "no passkeys available".
 *
 *  2. The challenge lifecycle. A challenge must be unpredictable, bound to
 *     the browser that asked for it, and usable exactly once.
 */

import { randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'

/* ============================================================
 *  Relying party
 * ========================================================== */

export interface RelyingParty {
  /** The effective domain — no scheme, no port. What the passkey binds to. */
  rpID: string
  /** Scheme + host + port. What `clientDataJSON.origin` must equal. */
  origin: string
  /** Shown in the browser's passkey prompt. */
  rpName: string
}

export const RP_NAME = 'Hoverlab'

/**
 * Derive the relying party from the incoming request rather than from
 * configuration.
 *
 * The tempting alternative is `siteUrl` from lib/site.ts, and it is wrong
 * here for a mundane reason: that value is the *canonical* origin, which is
 * exactly what it should be for sitemaps and share cards, and exactly what
 * it should not be for WebAuthn. Locally it says localhost:3000 while the
 * dev server runs on another port; on a preview deploy it says the
 * production domain while the browser is on a vercel.app host. Either
 * mismatch fails verification with "unexpected registration response
 * origin", which reads like a bug in the passkey and is not.
 *
 * Trusting the Host header is safe in this specific shape. The classic
 * objection — an attacker forges Host — does not reach anything here,
 * because a forged Host can only come from the attacker's own HTTP client,
 * and the value it buys them is options for an rpID they already control.
 * No victim credential is signable under it: the passkey the victim holds
 * is bound to the real domain and its authenticator will not assert for
 * another. Browsers cannot be made to send a Host they are not visiting, so
 * a real user's request always carries the real one.
 *
 * The Origin header is still cross-checked when present, so a cross-site
 * page cannot coax this endpoint into minting options for someone else's
 * domain.
 */
export function relyingPartyFrom(req: Request): RelyingParty {
  const host = requestHost(req)
  if (!host) {
    throw new WebAuthnConfigError(
      'The request carried no Host header, so the passkey domain cannot be determined.',
    )
  }

  // Hostname without the port: `localhost:3007` → `localhost`. IPv6 literals
  // arrive bracketed (`[::1]:3007`), hence the explicit bracket handling
  // rather than a naive split on the last colon.
  const hostname = host.startsWith('[')
    ? host.slice(0, host.indexOf(']') + 1)
    : host.split(':')[0]!

  const proto = requestProto(req, hostname)
  const origin = `${proto}://${host}`

  const sent = req.headers.get('origin')
  if (sent && sent !== 'null' && sent !== origin) {
    throw new WebAuthnConfigError(
      `This request came from ${sent}, which is not ${origin}. Passkeys only ` +
        'work on the site they were created for.',
    )
  }

  return { rpID: hostname.replace(/^\[|\]$/g, ''), origin, rpName: RP_NAME }
}

/** Thrown for setup problems, which callers answer with 400 rather than 500. */
export class WebAuthnConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WebAuthnConfigError'
  }
}

function requestHost(req: Request): string | null {
  // x-forwarded-host is what Vercel and every other proxy sets; `host` is
  // the origin server's own name behind them. Order matters: behind a proxy
  // the raw Host is the internal one, which is not what the browser sees.
  const forwarded = req.headers.get('x-forwarded-host')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return req.headers.get('host')
}

function requestProto(req: Request, hostname: string): string {
  const forwarded = req.headers.get('x-forwarded-proto')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  // WebAuthn requires a secure context, and browsers treat localhost as one
  // over plain http. Everything else is https.
  return isLocalhost(hostname) ? 'http' : 'https'
}

function isLocalhost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === '::1' ||
    hostname.endsWith('.localhost')
  )
}

/* ============================================================
 *  Naming
 * ========================================================== */

/**
 * A default label for a newly registered passkey.
 *
 * WebAuthn deliberately tells the server nothing about the device — that is
 * the privacy property, and it is worth more than a tidy label. So this is a
 * guess from the User-Agent, offered as a starting point that the person can
 * rename. "Passkey" alone is what a list of three of them should never say.
 */
export function describeDevice(userAgent: string | null): string {
  if (!userAgent) return 'Passkey'

  const platform =
    /iPhone|iPad|iPod/i.test(userAgent) ? 'iOS'
    : /Macintosh|Mac OS X/i.test(userAgent) ? 'macOS'
    : /Android/i.test(userAgent) ? 'Android'
    : /Windows/i.test(userAgent) ? 'Windows'
    : /CrOS/i.test(userAgent) ? 'ChromeOS'
    : /Linux/i.test(userAgent) ? 'Linux'
    : null

  // Order matters: Edge and Opera both claim to be Chrome, and Chrome claims
  // to be Safari. Testing the most specific first is the only way through.
  const browser =
    /Edg\//i.test(userAgent) ? 'Edge'
    : /OPR\//i.test(userAgent) ? 'Opera'
    : /Firefox\//i.test(userAgent) ? 'Firefox'
    : /Chrome\//i.test(userAgent) ? 'Chrome'
    : /Safari\//i.test(userAgent) ? 'Safari'
    : null

  if (browser && platform) return `${browser} on ${platform}`
  return browser ?? platform ?? 'Passkey'
}

/* ============================================================
 *  Challenges
 * ========================================================== */

export const CHALLENGE_COOKIE_NAME = 'cssfx:webauthn'

/** Long enough to reach for a phone or a security key, short enough to matter. */
const CHALLENGE_TTL_SECONDS = 5 * 60

const CHALLENGES = 'webauthnChallenges'

export type ChallengePurpose = 'register' | 'login'

/**
 * Challenges live in Firestore, with only their document id in the cookie.
 *
 * Putting the challenge itself in the cookie would be smaller and needs no
 * round trip, and it is the common shape — but it makes the browser the
 * authority on what was asked, and a challenge the client can choose is a
 * challenge that can be replayed. Anyone holding a captured assertion could
 * set the cookie back to the challenge it answered and sign in again. A
 * server-held document that is deleted the moment it is read cannot be
 * replayed: the second attempt finds nothing.
 *
 * `expiresAt` is a Firestore Timestamp so a TTL policy on this collection
 * can sweep abandoned attempts (Firestore console → TTL). Nothing depends
 * on that sweep — expiry is enforced on read — it only keeps the collection
 * from growing forever.
 */
export async function issueChallenge(
  challenge: string,
  purpose: ChallengePurpose,
  uid: string | null,
): Promise<void> {
  const id = randomBytes(24).toString('base64url')
  await adminDb()
    .collection(CHALLENGES)
    .doc(id)
    .set({
      challenge,
      purpose,
      uid,
      expiresAt: Timestamp.fromMillis(Date.now() + CHALLENGE_TTL_SECONDS * 1000),
    })

  const store = await cookies()
  store.set(CHALLENGE_COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: CHALLENGE_TTL_SECONDS,
    secure: process.env.NODE_ENV === 'production',
  })
}

export interface ConsumedChallenge {
  challenge: string
  purpose: ChallengePurpose
  uid: string | null
}

/**
 * Read and destroy the pending challenge. Returns null when there is none,
 * when it has expired, or when it was issued for a different purpose —
 * callers treat all three the same way: start over.
 */
export async function consumeChallenge(
  purpose: ChallengePurpose,
): Promise<ConsumedChallenge | null> {
  const store = await cookies()
  const id = store.get(CHALLENGE_COOKIE_NAME)?.value
  store.delete(CHALLENGE_COOKIE_NAME)
  if (!id) return null

  const ref = adminDb().collection(CHALLENGES).doc(id)
  const snap = await ref.get()
  // Deleted unconditionally, including on the failure paths below: a
  // challenge that has been offered to a verifier once is spent whether or
  // not it verified, and leaving a rejected one alive would allow retries
  // against it.
  await ref.delete().catch(() => {})

  if (!snap.exists) return null
  const data = snap.data() ?? {}

  const expiresAt =
    data.expiresAt instanceof Timestamp ? data.expiresAt.toMillis() : 0
  if (expiresAt < Date.now()) return null
  if (data.purpose !== purpose) return null
  if (typeof data.challenge !== 'string' || !data.challenge) return null

  return {
    challenge: data.challenge,
    purpose,
    uid: typeof data.uid === 'string' ? data.uid : null,
  }
}
