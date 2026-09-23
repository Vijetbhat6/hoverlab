import 'server-only'

import type { ArtifactLevel } from '@/lib/artifact-types'
import { getEffectMeta } from '@/lib/effect-index'
import { getPrimitiveMeta } from '@/lib/primitives/primitive-index'
import { getBlockMeta } from '@/lib/blocks/block-index'
import { getPageMeta } from '@/lib/pages/page-index'
import { getTemplateMeta } from '@/lib/templates/template-index'

/**
 * Does `(level, id)` name a real artifact?
 *
 * Answered from the metadata indexes, not the full catalogs: an index is
 * enough to say an id exists and does not carry every block's source or every
 * effect's CSS into the function that answers a thumbs-up. The same lookups
 * back the detail pages and the browse grid, so "exists" here means "has a
 * page".
 *
 * Kept out of `validate.ts` so that module stays free of catalog imports and
 * testable without loading them; the route hands this in as the `exists`
 * argument.
 */
export function artifactExists(level: ArtifactLevel, id: string): boolean {
  switch (level) {
    case 'effect':
      return getEffectMeta(id) !== undefined
    case 'primitive':
      return getPrimitiveMeta(id) !== undefined
    case 'block':
      return getBlockMeta(id) !== undefined
    case 'page':
      return getPageMeta(id) !== undefined
    case 'template':
      return getTemplateMeta(id) !== undefined
  }
}
