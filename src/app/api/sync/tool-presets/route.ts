/**
 * GET    /api/sync/tool-presets            → { presets: ToolPreset[] }
 * GET    /api/sync/tool-presets?tool=/tools/tokens
 * PUT    /api/sync/tool-presets            body { preset } → { preset }
 * DELETE /api/sync/tool-presets?id=<id>    → { ok: true }
 *
 * Auth required, and free — see the note at the top of `lib/tool-presets.ts`
 * for why saved tool state is deliberately not a paid feature.
 *
 * PUT writes ONE preset. The other /api/sync routes replace their whole
 * collection, which is right for favourites and for the bundle because the
 * client holds the entire list. It would be wrong here: a tool page knows
 * about its own presets and nothing else, so a wholesale write from
 * /tools/tokens would delete everything saved from /tools/spacing.
 */

import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { getCurrentUser } from '@/lib/session'
import {
  getToolPresets,
  saveToolPreset,
  deleteToolPreset,
} from '@/lib/firebase/tool-presets'
import { isToolId, rejectionReason, sanitizeToolPreset } from '@/lib/tool-presets'

export const runtime = 'nodejs'

const UNAUTHORIZED = { error: 'Sign in to keep presets across devices.' }

async function handleGet(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json(UNAUTHORIZED, { status: 401 })

  const presets = await getToolPresets(user.id)

  // Filtering here rather than in the query: the read is the whole
  // collection either way (see the note in firebase/tool-presets.ts), and
  // doing it in one place means the unfiltered list stays available for the
  // account page without a second code path.
  const tool = new URL(req.url).searchParams.get('tool')
  if (tool === null) return NextResponse.json({ presets })
  if (!isToolId(tool)) {
    return NextResponse.json({ error: 'Unknown tool.' }, { status: 400 })
  }
  return NextResponse.json({ presets: presets.filter((p) => p.tool === tool) })
}

async function handlePut(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json(UNAUTHORIZED, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { preset } = (body ?? {}) as { preset?: unknown }

  // The reason, not just the refusal. "That did not save" with no
  // explanation is what makes people stop trusting a save button, and every
  // rejection here has a cause the user can act on.
  const reason = rejectionReason(preset)
  if (reason) return NextResponse.json({ error: reason }, { status: 400 })

  // Timestamps come from the server, never from the client — otherwise a
  // preset could backdate itself to the top of a list sorted by updatedAt.
  const clean = sanitizeToolPreset(preset, new Date().toISOString())
  if (!clean) {
    return NextResponse.json({ error: 'That preset is not one we can store.' }, { status: 400 })
  }

  const result = await saveToolPreset(user.id, clean)
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 409 })

  return NextResponse.json({ preset: result.preset })
}

async function handleDelete(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json(UNAUTHORIZED, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: '`id` is required.' }, { status: 400 })

  // Idempotent: deleting something already gone answers 200. The client
  // calls this from an optimistic UI, and a 404 on a second click would
  // surface as an error for an outcome the user already has.
  await deleteToolPreset(user.id, id)
  return NextResponse.json({ ok: true })
}

export const GET = withJsonErrors('sync/tool-presets', handleGet)
export const PUT = withJsonErrors('sync/tool-presets', handlePut)
export const DELETE = withJsonErrors('sync/tool-presets', handleDelete)
