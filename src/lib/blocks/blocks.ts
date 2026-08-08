/**
 * The full block catalog, including every block's source files.
 *
 * ⚠️  SERVER / BUILD-TIME USE ONLY.
 *
 * Importing this from a `'use client'` component ships ~53 KB of TSX to the
 * browser to render cards that only need a name and a category. Client
 * components should import `./block-index` instead.
 *
 * Safe importers: route handlers, server components, `generateMetadata`,
 * `generateStaticParams` and build scripts.
 */

import 'server-only'

import { BLOCK_CATALOG } from './catalog'
import GENERATED_SOURCES from './generated-block-sources.json'
import type { ArtifactFile } from '../artifact-types'
import type { Block, BlockCategory } from './block-types'

const sources = GENERATED_SOURCES as Record<string, ArtifactFile[]>

/**
 * Catalog metadata joined to the inlined source.
 *
 * `scripts/build-block-sources.mjs` fails the build when the two lists
 * disagree, so the lookup below is total in practice; the `?? []` is a
 * guard against a stale generated file in a dev tree where the script has
 * not been re-run, not an expected case.
 */
export const BLOCKS: Block[] = BLOCK_CATALOG.map((b) => ({
  ...b,
  level: 'block' as const,
  files: sources[b.id] ?? [],
}))

/** How many blocks exist. */
export const BLOCK_COUNT = BLOCKS.length

const BY_ID = new Map(BLOCKS.map((b) => [b.id, b]))

/** Look up a single block by id. Returns undefined for unknown ids. */
export function getBlock(id: string): Block | undefined {
  return BY_ID.get(id)
}

/** Blocks in one category, in catalog order. */
export function blocksInCategory(category: BlockCategory): Block[] {
  return BLOCKS.filter((b) => b.category === category)
}

/**
 * The block's primary file — the one the detail page shows first and the
 * copy button copies. Every block is single-file today; when one is not,
 * the first entry stays the entry point by convention.
 */
export function primaryFile(block: Block): ArtifactFile | undefined {
  return block.files[0]
}
