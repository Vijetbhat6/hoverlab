/**
 * The full primitive catalog, including every primitive's source.
 *
 * ⚠️  SERVER / BUILD-TIME USE ONLY.
 *
 * Importing this from a `'use client'` component ships ~160 KB of TSX to
 * the browser to render cards that only need a name and a category. Client
 * components should import `./primitive-index` instead.
 *
 * Safe importers: route handlers, server components, `generateMetadata`,
 * `generateStaticParams` and build scripts.
 */

import 'server-only'

import { PRIMITIVE_CATALOG } from './catalog'
import GENERATED_SOURCES from './generated-primitive-sources.json'
import type { ArtifactFile } from '../artifact-types'
import type { Primitive, PrimitiveCategory } from './primitive-types'

const sources = GENERATED_SOURCES as Record<string, ArtifactFile[]>

/**
 * Catalog metadata joined to the inlined source.
 *
 * `scripts/build-artifact-sources.mjs` fails the build when the two lists
 * disagree, so the lookup below is total in practice; the `?? []` guards a
 * dev tree where the script has not been re-run, not an expected case.
 */
export const PRIMITIVES: Primitive[] = PRIMITIVE_CATALOG.map((p) => ({
  ...p,
  level: 'primitive' as const,
  files: sources[p.id] ?? [],
}))

/** How many primitives exist. */
export const PRIMITIVE_COUNT = PRIMITIVES.length

const BY_ID = new Map(PRIMITIVES.map((p) => [p.id, p]))

/** Look up a single primitive by id. Returns undefined for unknown ids. */
export function getPrimitive(id: string): Primitive | undefined {
  return BY_ID.get(id)
}

/** Primitives in one category, in catalog order. */
export function primitivesInCategory(category: PrimitiveCategory): Primitive[] {
  return PRIMITIVES.filter((p) => p.category === category)
}

/**
 * The primitive's only file — what the detail page shows and the copy
 * button copies. Every primitive is single-file by design: a control that
 * needs three files to paste is a block.
 */
export function primaryFile(primitive: Primitive): ArtifactFile | undefined {
  return primitive.files[0]
}
