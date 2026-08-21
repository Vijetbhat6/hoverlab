import 'server-only'
import { createHash } from 'node:crypto'
import { getSession } from '@/lib/session'
import { getEntitlements, FREE_ENTITLEMENTS, type Entitlements } from './entitlements'
import type { QuotaSubject } from './quota'

/**
 * Resolve a request to the thing its quota is charged against.
 *
 * Signed in, that is the uid. Anonymous, it is a salted hash of the client
 * IP — a bucket, not an identity. Two properties matter and both come from
 * the salt:
 *
 *   - the stored value is not reversible to an IP, so a leaked `quotas`
 *     collection is a list of opaque strings rather than a list of
 *     addresses;
 *   - the hash is stable for a day's counting but useless for correlating
 *     across deployments, because the salt is deployment-scoped.
 *
 * Truncated to 32 hex characters. The full digest carries no more
 * information for this purpose, and a shorter key keeps the document id
 * readable when someone is looking at the collection in the console.
 */

/**
 * Salt for the IP hash.
 *
 * Falls back to a constant when unset rather than throwing: an unsalted
 * hash still meters correctly, and a quota check is not worth 500-ing a
 * download over. The fallback is not a secret and is not pretended to be.
 */
const IP_SALT = process.env.QUOTA_IP_SALT ?? 'hoverlab:quota:unsalted'

/**
 * Client IP, from the proxy headers this app actually sits behind.
 *
 * `x-forwarded-for` is a list appended to by each hop, so the FIRST entry
 * is the client and the rest are proxies. Vercel also sets
 * `x-real-ip`, which is already resolved and is preferred when present.
 *
 * A spoofed header can only ever move a visitor to a different anonymous
 * bucket, which is why this does not try harder: the defence against
 * someone forging IPs to reset their own counter is that signing in is
 * free and gives them more exports anyway.
 */
function clientIp(request: Request): string {
  const real = request.headers.get('x-real-ip')
  if (real) return real.trim()

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }

  // No proxy headers at all — local development, or a direct connection.
  // Everyone lands in one bucket, which is correct for a machine serving
  // one developer and harmless anywhere else.
  return 'unknown'
}

export interface RequestSubject {
  subject: QuotaSubject
  entitlements: Entitlements
  /** The signed-in user id, or null. */
  userId: string | null
}

/** Who is asking, and what they are entitled to. */
export async function resolveRequestSubject(request: Request): Promise<RequestSubject> {
  const session = await getSession()

  if (session) {
    return {
      subject: { kind: 'user', key: session.uid },
      entitlements: await getEntitlements(session.uid),
      userId: session.uid,
    }
  }

  const key = createHash('sha256')
    .update(`${IP_SALT}:${clientIp(request)}`)
    .digest('hex')
    .slice(0, 32)

  return {
    subject: { kind: 'anonymous', key },
    entitlements: FREE_ENTITLEMENTS,
    userId: null,
  }
}
