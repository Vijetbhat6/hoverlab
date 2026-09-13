/**
 * The shader tier with its source files attached.
 *
 * ⚠️  SERVER / BUILD-TIME USE ONLY — the same rule, and the same reason, as
 * `blocks/blocks.ts`. This carries ~70 KB of TSX so the detail page can
 * show it and the zip export can write it; a `'use client'` component that
 * only needs to draw a card should import `./shader-effects`.
 *
 * Safe importers: route handlers, server components, `generateMetadata`,
 * `generateStaticParams`, OG image routes, and build scripts.
 */

import GENERATED_SOURCES from './generated-shader-sources.json'
import { SHADER_EFFECTS } from './shader-effects'
import type { ArtifactFile } from '../artifact-types'
import type { Effect } from '../effect-types'

interface EmittedSources {
  /** The runtime and the surface, stored once rather than fifteen times. */
  shared: ArtifactFile[]
  /** Each design's own file, by id. */
  own: Record<string, ArtifactFile>
}

const sources = GENERATED_SOURCES as unknown as EmittedSources

/**
 * Shader effects, each with the three files a buyer copies.
 *
 * Design first: `primaryFile()` takes `files[0]`, and that is what the
 * detail page opens on and what the copy button copies. The two shared
 * files follow, and the second shader anybody adds needs only the first of
 * the three — which is the argument for splitting them at all.
 */
export const SHADER_EFFECTS_WITH_SOURCE: Effect[] = SHADER_EFFECTS.map((e) => {
  const own = sources.own[e.id]
  return {
    ...e,
    files: own ? [own, ...sources.shared] : [...sources.shared],
  }
})

const BY_ID = new Map(SHADER_EFFECTS_WITH_SOURCE.map((e) => [e.id, e]))

/** One shader effect with its files. Undefined for a CSS effect's id. */
export function getShaderWithSource(id: string): Effect | undefined {
  return BY_ID.get(id)
}
