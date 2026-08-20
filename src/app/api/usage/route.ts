import { NextResponse } from 'next/server'
import { recordUsage, MAX_IDS_PER_REPORT, type UsageKind } from '@/lib/usage'

/**
 * Report that artifacts were copied or installed.
 *
 * POST { ids: string[], kind: 'copy' | 'install' } → { recorded }
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
  const kind: UsageKind = body.kind === 'install' ? 'install' : 'copy'

  if (!ids.length) return NextResponse.json({ recorded: 0 })
  if (ids.length > MAX_IDS_PER_REPORT) ids.length = MAX_IDS_PER_REPORT

  try {
    const recorded = await recordUsage(ids, kind)
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
