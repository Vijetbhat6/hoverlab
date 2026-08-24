import 'server-only'

/**
 * Saved designer-tool presets in Firestore.
 *
 *   users/{uid}/toolPresets/{presetId}
 *     { id, tool, name, state, createdAt, updatedAt }
 *
 * One document per preset, with `tool` as a field rather than a path
 * segment. A nested `users/{uid}/tools/{tool}/presets/{id}` would read
 * marginally better and would make "all my presets" a collection-group
 * query with a composite index behind it — for a per-account list that is
 * two hundred documents at its cap and is already being read whole.
 *
 * Unlike `brand-library.ts` this does NOT replace the collection wholesale.
 * A tool page knows about its own presets and nothing else, so a wholesale
 * PUT from /tools/tokens would delete every preset saved from /tools/spacing.
 * Writes here are per-preset, and the only bulk operation is a delete the
 * user asked for by id.
 */

import { adminDb } from '@/lib/firebase/admin'
import { Timestamp, type Firestore } from 'firebase-admin/firestore'
import {
  sanitizeToolPreset,
  sortToolPresets,
  TOOL_PRESET_LIMITS,
  type ToolPreset,
} from '@/lib/tool-presets'

function presets(db: Firestore, uid: string) {
  return db.collection('users').doc(uid).collection('toolPresets')
}

/** Same rejection rule as collections — ids are ours, so they can be strict. */
function docId(id: string): string | null {
  if (!id || id.length > 64) return null
  if (!/^[A-Za-z0-9_-]+$/.test(id)) return null
  if (id.startsWith('__')) return null
  return id
}

function iso(value: unknown, fallback: string): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  return typeof value === 'string' ? value : fallback
}

/**
 * Every preset on the account, newest-touched first.
 *
 * Reads the whole collection rather than filtering by tool in the query.
 * The cap is two hundred documents of a few hundred bytes each, one
 * composite index is one more thing to deploy, and the client wants the
 * count across all tools anyway to tell someone they are near the limit.
 */
export async function getToolPresets(uid: string): Promise<ToolPreset[]> {
  const snap = await presets(adminDb(), uid).get()
  const now = new Date().toISOString()

  const list = snap.docs.flatMap((doc) => {
    const data = doc.data()
    const createdAt = iso(data.createdAt, now)
    const clean = sanitizeToolPreset(
      { ...data, id: doc.id, createdAt },
      iso(data.updatedAt, createdAt),
    )
    return clean ? [clean] : []
  })

  return sortToolPresets(list)
}

/** What a write was refused for, when it was. */
export type SaveRefusal =
  | { ok: true; preset: ToolPreset }
  | { ok: false; reason: string }

/**
 * Create or overwrite one preset.
 *
 * The caps are enforced here rather than in the route because this is the
 * only place that can see the existing count, and a check that races the
 * write it guards is not a check. Firestore has no cheap conditional
 * insert, so this reads the ids first — at these sizes a `select()` with no
 * fields is one small round trip, and the failure mode of a lost race is a
 * user holding 201 presets rather than 200.
 */
export async function saveToolPreset(
  uid: string,
  preset: ToolPreset,
): Promise<SaveRefusal> {
  const key = docId(preset.id)
  if (!key) return { ok: false, reason: 'That preset id is not one we can store.' }

  const db = adminDb()
  const target = presets(db, uid)

  const existing = await target.get()
  const isOverwrite = existing.docs.some((doc) => doc.id === key)

  if (!isOverwrite) {
    if (existing.size >= TOOL_PRESET_LIMITS.perAccount) {
      return {
        ok: false,
        reason: `You have ${TOOL_PRESET_LIMITS.perAccount} saved presets, which is the limit. Delete one to save another.`,
      }
    }
    const forTool = existing.docs.filter((doc) => doc.data().tool === preset.tool).length
    if (forTool >= TOOL_PRESET_LIMITS.perTool) {
      return {
        ok: false,
        reason: `You have ${TOOL_PRESET_LIMITS.perTool} presets saved for this tool, which is the limit. Delete one to save another.`,
      }
    }
  }

  await target.doc(key).set({
    id: preset.id,
    tool: preset.tool,
    name: preset.name,
    state: preset.state,
    createdAt: Timestamp.fromDate(new Date(preset.createdAt)),
    updatedAt: Timestamp.fromDate(new Date(preset.updatedAt)),
  })

  return { ok: true, preset }
}

/** Delete one preset. Silent when it was already gone. */
export async function deleteToolPreset(uid: string, id: string): Promise<void> {
  const key = docId(id)
  if (!key) return
  await presets(adminDb(), uid).doc(key).delete()
}
