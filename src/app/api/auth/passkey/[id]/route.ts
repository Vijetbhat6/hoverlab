/**
 * DELETE /api/auth/passkey/[id]  — forget a passkey
 * PATCH  /api/auth/passkey/[id]  — rename it. Body: { name }
 *
 * `id` is the base64url credential id. It travels in the URL, so it is
 * encoded by the client and decoded here; ownership is enforced in the store
 * rather than trusted from the path.
 */

import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { getCurrentUser } from '@/lib/session'
import {
  deletePasskey,
  listPasskeys,
  renamePasskey,
  toPublicPasskey,
} from '@/lib/firebase/passkeys'

export const runtime = 'nodejs'

const MAX_NAME = 60

type Context = { params: Promise<{ id: string }> }

async function handleDelete(_req: Request, ctx: Context) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }

  const { id } = await ctx.params
  const removed = await deletePasskey(decodeURIComponent(id), user.id)
  if (!removed) {
    return NextResponse.json({ error: 'No such passkey.' }, { status: 404 })
  }

  const all = await listPasskeys(user.id)
  return NextResponse.json({ passkeys: all.map(toPublicPasskey) })
}

async function handlePatch(req: Request, ctx: Context) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { name } = (body ?? {}) as { name?: unknown }
  const trimmed = typeof name === 'string' ? name.trim().slice(0, MAX_NAME) : ''
  if (!trimmed) {
    return NextResponse.json({ error: 'Give the passkey a name.' }, { status: 400 })
  }

  const { id } = await ctx.params
  const renamed = await renamePasskey(decodeURIComponent(id), user.id, trimmed)
  if (!renamed) {
    return NextResponse.json({ error: 'No such passkey.' }, { status: 404 })
  }

  const all = await listPasskeys(user.id)
  return NextResponse.json({ passkeys: all.map(toPublicPasskey) })
}

export const DELETE = withJsonErrors('auth/passkey/[id]', handleDelete)
export const PATCH = withJsonErrors('auth/passkey/[id]', handlePatch)
