import { NextResponse } from 'next/server'
import { getEffects } from '@/lib/effects'

/**
 * Resolve effect ids to their full records (including `html` and `css`).
 *
 * The client ships only the metadata index (`@/lib/effect-index`), so it
 * can search and filter the whole catalog without downloading 1.6 MB of
 * CSS. When effects actually need to render — the 24 cards on the current
 * library page, the compare drawer, a bundle export — the client asks for
 * exactly those ids here.
 *
 * POST body:  { ids: string[] }         // max 200 per request
 * Response:   { effects: Effect[] }     // unknown ids silently dropped
 *
 * The catalog is static and public, so responses are immutable and
 * aggressively cacheable. GET is also supported (`?ids=a,b,c`) so a
 * response can sit in the browser's HTTP cache and the service worker's
 * cache across sessions.
 */

export const runtime = 'nodejs'

/** Cap per request so a malicious caller can't ask for the whole catalog at once. */
const MAX_IDS = 200

/** Immutable: an effect's CSS never changes without its id changing. */
const CACHE_CONTROL = 'public, max-age=31536000, immutable'

function resolve(ids: unknown): NextResponse {
  if (!Array.isArray(ids)) {
    return NextResponse.json(
      { error: '`ids` must be an array of strings' },
      { status: 400 },
    )
  }

  const clean = ids
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
    .slice(0, MAX_IDS)

  if (clean.length === 0) {
    return NextResponse.json({ effects: [] })
  }

  return NextResponse.json(
    { effects: getEffects(clean) },
    { headers: { 'Cache-Control': CACHE_CONTROL } },
  )
}

export async function POST(request: Request) {
  let body: { ids?: unknown }
  try {
    body = (await request.json()) as { ids?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  return resolve(body.ids)
}

export async function GET(request: Request) {
  const param = new URL(request.url).searchParams.get('ids')
  if (!param) {
    return NextResponse.json({ error: '`ids` query param is required' }, { status: 400 })
  }
  return resolve(param.split(',').map((s) => s.trim()).filter(Boolean))
}
