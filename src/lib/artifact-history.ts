'use client'

/**
 * Shared shape for the two "what was I just looking at" lists — recently
 * viewed and copy history.
 *
 * Both stored an `effectId` and nothing else, which is why neither could
 * record a block. Widening them needed the same three decisions twice, so
 * they are made once here.
 *
 * Entries denormalize name and category rather than storing an id and
 * resolving it at read time. That is deliberate: resolving would mean
 * importing a catalog into every surface that renders a rail, and the
 * effect index alone is ~772 KB. A stale name on a renamed artifact is a
 * cheaper problem than that.
 */

import { levelOf, artifactHref, type ArtifactLevel } from '@/lib/artifact-types'

/** A remembered artifact, at any rung of the ladder. */
export interface ArtifactRef {
  id: string
  name: string
  category: string
  /**
   * Absent means `'effect'` — the same default as `levelOf()`, and what
   * makes every entry written before blocks existed still resolve.
   */
  level?: ArtifactLevel
}

/** What `record(...)` accepts. Effect callers pass exactly what they always did. */
export interface RecordableArtifact {
  id: string
  name: string
  category: string
  level?: ArtifactLevel
}

/**
 * Legacy entries, as written before the ladder existed.
 *
 * Kept as a type rather than deleted so the migration below is checked
 * rather than a cast: these are real objects sitting in real localStorage.
 */
interface LegacyEntry {
  effectId?: string
  effectName?: string
  effectCategory?: string
}

/**
 * Normalize one stored entry, migrating the legacy `effect*` field names.
 *
 * Returns null for anything unrecognizable. Dropping a junk entry is right
 * here — this is ephemeral working memory, and a rail that throws on one
 * malformed row is worse than one that quietly shows the other seven.
 */
export function normalizeRef(raw: unknown): ArtifactRef | null {
  if (!raw || typeof raw !== 'object') return null
  const entry = raw as ArtifactRef & LegacyEntry

  const id = entry.id ?? entry.effectId
  const name = entry.name ?? entry.effectName
  const category = entry.category ?? entry.effectCategory
  if (!id || !name) return null

  return {
    id,
    name,
    category: category ?? '',
    level: entry.level,
  }
}

/** Route for a remembered artifact — `/effect/x`, `/block/y`, and so on. */
export function refHref(ref: ArtifactRef): string {
  return artifactHref({ id: ref.id, level: ref.level })
}

/** The rung, resolving the `'effect'` default. */
export function refLevel(ref: ArtifactRef): ArtifactLevel {
  return levelOf(ref)
}
