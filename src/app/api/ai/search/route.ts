import { NextResponse } from 'next/server'
import { complete, isAiConfigured } from '@/lib/ai/claude'
import { resolveRequestSubject } from '@/lib/billing/request-subject'
import { consumeQuota, refundQuota, METERS } from '@/lib/billing/quota'

/**
 * AI-powered natural-language effect search.
 *
 * The client pre-filters the catalog (substring match on name + tags +
 * category + description) down to a candidate pool of at most ~80
 * effects, then sends that pool here alongside the user's natural-
 * language query. We ask the LLM to rank the candidates by semantic
 * relevance to the query and return a JSON array of effect IDs.
 *
 * Why pre-filter on the client?
 *  - Keeps the LLM prompt small (~80 effects × ~80 chars ≈ 6KB) so
 *    latency and cost stay low.
 *  - The client already has the full catalog in memory (it renders
 *    the grid), so it's the natural place to do cheap substring
 *    filtering.
 *  - The LLM's job is purely semantic ranking — its strength.
 *
 * Request body:
 *   { query: string, candidates: Array<{ id, name, category, description }> }
 *
 * Response:
 *   { ids: string[] }   // ranked effect IDs, most relevant first
 *                     // empty array if the LLM returned nothing usable
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
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Candidate {
  id: string
  name: string
  category: string
  description: string
}

interface SearchRequestBody {
  query?: unknown
  candidates?: unknown
}

export async function POST(request: Request) {
  let body: SearchRequestBody
  try {
    body = (await request.json()) as SearchRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const query = typeof body.query === 'string' ? body.query.trim() : ''
  const candidatesRaw = Array.isArray(body.candidates) ? body.candidates : []

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }
  if (candidatesRaw.length === 0) {
    return NextResponse.json({ ids: [] })
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

  // Sanitize + cap candidates to keep the prompt bounded.
  const candidates: Candidate[] = candidatesRaw
    .slice(0, 80)
    .map((c) => {
      if (typeof c !== 'object' || c === null) return null
      const obj = c as Record<string, unknown>
      const id = typeof obj.id === 'string' ? obj.id : ''
      const name = typeof obj.name === 'string' ? obj.name : ''
      const category = typeof obj.category === 'string' ? obj.category : ''
      const description =
        typeof obj.description === 'string' ? obj.description : ''
      if (!id) return null
      return { id, name, category, description }
    })
    .filter((c): c is Candidate => c !== null && c.id !== '')

  if (candidates.length === 0) {
    return NextResponse.json({ ids: [] })
  }

  // Build a compact catalog for the prompt. Each effect on one line:
  //   "btn-gradient | Buttons | Gradient Shift Button | Smooth hue-shift on hover"
  const catalog = candidates
    .map(
      (c) =>
        `${c.id} | ${c.category} | ${c.name} | ${c.description.slice(0, 120)}`,
    )
    .join('\n')

  const systemPrompt = `You are an expert frontend developer helping a user find the right CSS effect in a library.

You will receive:
  1. A user's natural-language description of what they want (the "query").
  2. A catalog of candidate effects, one per line, in the format:
       <id> | <category> | <name> | <description>

Your job: rank the candidates by how well they match the user's intent. Consider:
  - Semantic match (e.g. "button that pulses" → effects with pulse/breathe animations on buttons)
  - Category relevance (e.g. "loader" queries should prefer Loaders)
  - Visual / interaction fit (e.g. "subtle" → prefer understated effects over flashy ones)

Return ONLY a JSON object of this exact shape, no markdown, no explanation:
  {"ids": ["effect-id-1", "effect-id-2", ...]}

Rules:
  - Return between 0 and 20 IDs, most relevant first.
  - Only include IDs that appear in the candidate catalog.
  - If nothing matches, return {"ids": []}.
  - Do NOT include any text before or after the JSON.`

  const userPrompt = `Query: ${query}

Candidate catalog (${candidates.length} effects):
${catalog}

Return the ranked JSON now.`

  try {
    // Lowest effort of the three AI routes, and the only one where latency
    // is felt directly — someone is watching a search box. Ranking twenty
    // ids out of eighty is the kind of work that does not improve with more
    // deliberation, so paying for more would buy a slower search.
    const raw = await complete({
      system: systemPrompt,
      user: userPrompt,
      maxTokens: 8000,
      effort: 'low',
    })

    const ids = parseIdsResponse(raw, candidates)

    return NextResponse.json({ ids })
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

/**
 * Parse the LLM's response into a list of valid effect IDs.
 *
 * The LLM is instructed to return strict JSON, but we defensively
 * handle common failure modes:
 *  - JSON wrapped in markdown code fences
 *  - Trailing prose after the JSON
 *  - The IDs field missing or malformed
 *
 * We also filter the result against the candidate IDs so the LLM
 * can't hallucinate IDs that don't exist.
 */
function parseIdsResponse(raw: string, candidates: Candidate[]): string[] {
  const validIds = new Set(candidates.map((c) => c.id))
  const trimmed = raw.trim()

  // Strip markdown code fences if present (```json ... ``` or ``` ... ```).
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const jsonText = fenceMatch ? fenceMatch[1].trim() : trimmed

  // Find the first {...} block — tolerates trailing prose.
  const braceStart = jsonText.indexOf('{')
  const braceEnd = jsonText.lastIndexOf('}')
  if (braceStart === -1 || braceEnd === -1 || braceEnd <= braceStart) {
    return []
  }

  try {
    const parsed = JSON.parse(
      jsonText.slice(braceStart, braceEnd + 1),
    ) as unknown
    if (!parsed || typeof parsed !== 'object') return []
    const idsField = (parsed as { ids?: unknown }).ids
    if (!Array.isArray(idsField)) return []
    return idsField
      .filter((id): id is string => typeof id === 'string' && validIds.has(id))
      .slice(0, 20)
  } catch {
    return []
  }
}
