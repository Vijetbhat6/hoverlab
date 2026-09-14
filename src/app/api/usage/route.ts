import { NextResponse } from 'next/server'
import {
  recordSignal,
  recordUsage,
  usageFor,
  MAX_IDS_PER_REPORT,
  type SignalKind,
  type UsageKind,
} from '@/lib/usage'

/**
 * Report that artifacts were copied, installed, viewed or saved.
 *
 * POST { ids: string[], kind }  → { recorded }
 * GET  ?id=<artifact>           → { recent, total, views, saves }
 *
 * `kind` is one of `copy` and `install`, which feed the seven-day ranking
 * window, or one of `view`, `save` and `unsave`, which do not — see
 * `lib/usage.ts` for why the split is real rather than bookkeeping. The
 * route dispatches on it so that a caller cannot reach the ranking by
 * sending an unexpected string: anything unrecognized falls to `copy`
 * only after the signal kinds have had their chance to match.
 *
 * The GET is here rather than under /api/v1 because it is a page
 * ornament, not part of the public contract: detail pages are statically
 * rendered, so the count has to arrive after the HTML does, and nothing
 * outside this site has a reason to ask for one artifact's counter.
 *
 * Unauthenticated on purpose: the CLI has no account, copying needs no
 * account, and requiring one would mean the popularity signal only
 * reflected the minority of users who had signed in — which is a worse
 * distortion than the one that comes from leaving it open.
 *
 * Always answers 200 with a count, even when the write fails. A beacon
 * that reports an error teaches the client to retry, and no amount of
 * retrying a counter is worth a second request from someone who was trying
 * to copy a button.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ recent: 0, total: 0, views: 0, saves: 0 })

  try {
    const usage = await usageFor(id)
    return NextResponse.json(usage ?? { id, recent: 0, total: 0, views: 0, saves: 0 }, {
      // Briefly cacheable: a counter that lags by a minute is still true
      // enough for a line of small print, and the alternative is a
      // Firestore read on every detail-page view.
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=120' },
    })
  } catch (err) {
    console.error('[api/usage] failed to read:', err)
    return NextResponse.json({ id, recent: 0, total: 0, views: 0, saves: 0 })
  }
}

/** The kinds that are displayed but never ranked. */
const SIGNALS: readonly SignalKind[] = ['view', 'save', 'unsave']

export async function POST(request: Request) {
  let body: { ids?: unknown; kind?: unknown }
  try {
    body = (await request.json()) as { ids?: unknown; kind?: unknown }
  } catch {
    return NextResponse.json({ recorded: 0 })
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.filter((id): id is string => typeof id === 'string')
    : []
  if (!ids.length) return NextResponse.json({ recorded: 0 })
  if (ids.length > MAX_IDS_PER_REPORT) ids.length = MAX_IDS_PER_REPORT

  const signal = SIGNALS.find((k) => k === body.kind)
  const kind: UsageKind = body.kind === 'install' ? 'install' : 'copy'

  try {
    const recorded = signal
      ? await recordSignal(ids, signal)
      : await recordUsage(ids, kind)
    return NextResponse.json({ recorded })
  } catch (err) {
    console.error('[api/usage] failed to record:', err)
    return NextResponse.json({ recorded: 0 })
  }
}

/** CORS preflight, so the CLI and browser tools can both report. */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}
