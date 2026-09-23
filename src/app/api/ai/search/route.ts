import { NextResponse } from 'next/server'
import { complete, isAiConfigured } from '@/lib/ai/claude'
import { resolveRequestSubject } from '@/lib/billing/request-subject'
import { consumeQuota, refundQuota, METERS } from '@/lib/billing/quota'
import { EFFECT_INDEX } from '@/lib/effect-index'
import { searchEffects } from '@/lib/search/effects'
import { validateImage, MAX_IMAGE_BYTES, type ValidImage } from '@/lib/ai/search-image'
import {
  MAX_QUERY_LENGTH,
  executeSearch,
  prepareSearch,
  type RetrievalDeps,
  type SearchCandidate,
} from '@/lib/ai/search-request'

/**
 * AI-powered natural-language effect search, with an optional screenshot.
 *
 * The server chooses the candidates and the model ranks them. Candidate
 * retrieval used to happen in the browser — a substring match capped at 80,
 * with 80 featured effects as the fallback — which meant a conceptual query
 * with no literal hit was ranked against eighty effects that had nothing to
 * do with it. It now runs here, on the catalog, through the same
 * typo-tolerant, synonym-aware engine as /library and the palette
 * (`@/lib/search`), taking the best ~80 by score. The featured fallback
 * survives only for a query the lexical score finds truly nothing for.
 * Everything about *what* is asked and how the reply is read lives in
 * `@/lib/ai/search-request` as pure functions; this file is the I/O.
 *
 * Request body:
 *   { query?: string, image?: string }
 *     query   free text, up to 300 characters
 *     image   PNG / JPEG / WebP as a data URL or base64, up to 1.5 MB
 *             decoded, checked by magic number rather than declared type
 *   At least one is required. A stale client that still sends `candidates`
 *   is served normally — the field is ignored, never trusted.
 *
 * Response:
 *   { ids: string[], source: 'lexical' | 'featured' }
 *     ids     ranked effect IDs, most relevant first; empty if nothing usable
 *     source  where the model's candidate pool came from
 *
 * GET answers `{ configured: boolean }` and nothing else, so the page can
 * show an honest disabled state instead of learning by failing a search. It
 * is cacheable at the edge, because a function call is a metered thing on
 * this host and a status check that costs one per page view would be a
 * strange thing to spend them on.
 *
 * METERED, and it was not. This route takes no credentials, calls a model
 * on every request and had no limit of any kind, which made it a free
 * ranking LLM for anyone who found it in the network tab. It now spends
 * from a daily counter keyed to the session or a hashed IP.
 *
 * Metered rather than gated, and on its own counter rather than the export
 * one, because this is a browse action: someone looking for a button
 * searches ten times to find it. The limit is a ceiling against abuse, not
 * a lever on the funnel — see METERS in `billing/quota-limits.ts`. Pro,
 * Studio, Team and Pro+ have no limit here at all.
 *
 * A screenshot search costs the same one search as a text one. Vision input
 * costs more tokens per call, but the counter is a ceiling against abuse
 * rather than a price, and a second unit would mean two charges and two
 * refunds per request for a cost model this route does not have a place for.
 * The size cap is what bounds it.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Body ceiling, checked from the header before anything is read. The image
 * is 4/3 larger as base64, and the rest of the body is a short string; a
 * request claiming more than this is refused without being parsed.
 */
const MAX_BODY_BYTES = Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 4_096

interface SearchRequestBody {
  query?: unknown
  image?: unknown
}

/** Featured effects as candidates — computed once, the index never changes. */
const FEATURED: SearchCandidate[] = EFFECT_INDEX.filter((e) => e.featured).map((e) => ({
  id: e.id,
  name: e.name,
  category: e.category,
  description: e.description,
}))

/**
 * `any` mode: a conceptual query only has to reach the pool, and a pool built
 * from documents that match *most* of the words beats one that needs all of
 * them. The model does the precise ranking.
 */
const RETRIEVAL: RetrievalDeps = {
  search: (query, limit) =>
    searchEffects(query, { mode: 'any', limit }).map(({ doc }) => ({
      id: doc.id,
      name: doc.name,
      category: doc.category,
      description: doc.description,
    })),
  featured: FEATURED,
}

/** Effect ids for a list of keywords, best first — the screenshot top-up. */
function topUp(keywords: string[]): string[] {
  return searchEffects(keywords.join(' '), { mode: 'any', limit: 30 }).map((h) => h.doc.id)
}

export async function GET() {
  return NextResponse.json(
    { configured: isAiConfigured() },
    {
      headers: {
        // Short at the edge: an environment change should show up within
        // minutes, and a status read must not cost a function call each time.
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    },
  )
}

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request is too large' }, { status: 413 })
  }

  let body: SearchRequestBody
  try {
    body = (await request.json()) as SearchRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const query =
    typeof body.query === 'string' ? body.query.trim().slice(0, MAX_QUERY_LENGTH) : ''

  let image: ValidImage | undefined
  if (body.image !== undefined && body.image !== null && body.image !== '') {
    const checked = validateImage(body.image)
    if (!checked.ok) {
      return NextResponse.json({ error: checked.message, reason: checked.reason }, { status: 400 })
    }
    image = checked
  }

  if (!query && !image) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

  /*
   * No key, no search — and crucially, no charge. Checked before the meter
   * rather than caught after it, because a deployment without a key would
   * otherwise burn a user's daily allowance on a call that cannot happen.
   *
   * `ids: []` so the client falls back to substring search, which is what
   * it does for every other failure here. A visitor gets ordinary search
   * instead of an error, which is the correct outcome when the semantic
   * layer is simply not switched on.
   */
  if (!isAiConfigured()) {
    return NextResponse.json(
      { ids: [], error: 'AI search is not configured' },
      { status: 503, headers: { 'Cache-Control': 'private, no-store' } },
    )
  }

  // Built before the charge: a request with nothing to rank must cost nothing.
  const prepared = prepareSearch(query, image, RETRIEVAL)
  if (!prepared) {
    return NextResponse.json({ ids: [] })
  }

  /*
   * Charged after the request is known to be well-formed and before the
   * model is called. A malformed body must not cost a search, and a search
   * that reaches the model must always be counted.
   */
  const { subject, entitlements } = await resolveRequestSubject(request)
  const quota = await consumeQuota(subject, entitlements, 'ai-search', 'aiSearch')
  if (!quota.ok) {
    return NextResponse.json(
      {
        // `ids: []` alongside the error so a client that ignores the status
        // degrades to ordinary substring search rather than rendering an
        // empty result set as "nothing matched".
        ids: [],
        error:
          subject.kind === 'user'
            ? `That's ${quota.state.limit} AI searches for today.`
            : 'That is the AI search limit for this connection today.',
        resetsAt: quota.state.resetsAt,
        offer: subject.kind === 'user' ? 'plus' : 'signin',
        signedInLimit: METERS.aiSearch.limits.free,
      },
      { status: 429, headers: { 'Cache-Control': 'private, no-store' } },
    )
  }

  try {
    const ids = await executeSearch(prepared, complete, topUp)
    return NextResponse.json({ ids, source: prepared.source })
  } catch (err) {
    // The search was charged before the call; an outage on our side must
    // not spend it. Same order, and the same reasoning, as the credit
    // spend in /api/ai/variant.
    await refundQuota(subject, 'aiSearch').catch(() => {})
    console.error('[/api/ai/search] LLM call failed:', err)
    return NextResponse.json(
      { ids: [], error: 'AI search is temporarily unavailable' },
      { status: 502 },
    )
  }
}
