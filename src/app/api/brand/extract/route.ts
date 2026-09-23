import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { enforceRateLimit, type RateLimitPolicy } from '@/lib/rate-limit'
import { extractBrandFromUrl, InvalidUrlError } from '@/lib/brand-extract/from-url'
import { BlockedTargetError, FetchFailedError } from '@/lib/brand-extract/safe-fetch'

/**
 * POST /api/brand/extract  body { url } → a BrandExtraction
 *
 * Reads a public website and returns its colour, typeface and corner radius,
 * each with where it came from and how far to trust it.
 *
 * Ungated on purpose, like every tool on this site. It is limited instead:
 * one call is up to seven outbound requests, so the budget is per network and
 * modest. The dangerous part — that this server fetches an address a visitor
 * chose — is fenced in `lib/brand-extract/safe-fetch.ts`, not here; this
 * route only maps its errors to statuses.
 *
 * POST although it changes nothing: the URL is somebody's input, and a GET
 * would put it in access logs and let a link on any page trigger our
 * outbound request.
 *
 * The URL is not stored and not logged. It goes nowhere but the fetch.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const POLICY: RateLimitPolicy = {
  name: 'brand-extract',
  limit: 12,
  windowSeconds: 10 * 60,
  message: 'That is a lot of sites from one network. Wait a few minutes and try again.',
}

/**
 * The limiter check, given two seconds.
 *
 * `enforceRateLimit` fails open when its store *errors*, and says why. It
 * does not fail open when the store *stalls* — a Firestore transaction with no
 * timeout — and a stall is what an unreachable database looks like from
 * outside. On a route whose whole job is to answer while a visitor waits, an
 * unbounded wait is a worse failure than a missing limit, so a slow limiter is
 * treated the way a broken one already is: allow the request, log it.
 */
const LIMITER_DEADLINE_MS = 2000

async function limiterVerdict(request: Request): Promise<Response | null> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const stalled = new Promise<null>((resolve) => {
    timer = setTimeout(() => {
      console.error('[brand-extract] rate limiter did not answer in time, allowing the request')
      resolve(null)
    }, LIMITER_DEADLINE_MS)
  })
  try {
    return await Promise.race([enforceRateLimit(request, POLICY), stalled])
  } finally {
    clearTimeout(timer)
  }
}

export const POST = withJsonErrors('brand-extract', async (request: Request) => {
  const limited = await limiterVerdict(request)
  if (limited) return limited

  let body: { url?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }
  if (typeof body.url !== 'string') {
    return NextResponse.json({ error: 'Send { "url": "https://…" }.' }, { status: 400 })
  }

  try {
    const extraction = await extractBrandFromUrl(body.url)
    return NextResponse.json(extraction, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof InvalidUrlError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof BlockedTargetError) {
      // 422, not 403: the request is well-formed and the answer is "not that".
      return NextResponse.json({ error: error.message }, { status: 422 })
    }
    if (error instanceof FetchFailedError) {
      return NextResponse.json({ error: error.message }, { status: 502 })
    }
    throw error
  }
})
