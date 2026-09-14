/**
 * One grid of search hits, dispatching each level to that tier's own card.
 *
 * Lifted out of `/browse`, which had the only copy, because `/ui/[slug]`
 * renders exactly the same thing and a second copy would have drifted. It
 * is a Server Component with no state — the cards it renders carry whatever
 * interactivity they need.
 *
 * Deliberately not a single unified card: a block card shows a line count
 * and a dependency list, a page card shows how many blocks it is made of, a
 * template card shows routes. Flattening those into one card would mean
 * showing the union (noise) or the intersection (nothing useful).
 *
 * The primitive branch is new rather than moved. `/browse` fell through to
 * the block branch for every level it did not name, which meant
 * `?level=primitive` looked up 36 primitive ids in the *block* index, got
 * `undefined` for all of them and rendered an empty grid — a whole rung of
 * the ladder invisible on the surface built to make the rungs visible.
 */

import { EffectStaticCard } from '@/components/effect-static-card'
import { PrimitiveCard } from '@/components/primitives/primitive-card'
import { BlockCard } from '@/components/blocks/block-card'
import { PageCard } from '@/components/pages/page-card'
import { TemplateCard } from '@/components/templates/template-card'
import { getEffect } from '@/lib/effects'
import { getPrimitiveMeta } from '@/lib/primitives/primitive-index'
import { getBlockMeta } from '@/lib/blocks/block-index'
import { getPageMeta } from '@/lib/pages/page-index'
import { getTemplateMeta } from '@/lib/templates/template-index'
import { hoverPeekCssFor } from '@/lib/hover-peek-css'
import type { BrowseHit } from '@/lib/browse'
import type { ArtifactLevel } from '@/lib/artifact-types'

/**
 * Every effect preview's CSS, plus the hover-to-play rules derived from it,
 * as one string for a single document-level <style>.
 *
 * Class names are globally unique per effect (`fx-<slug>-<seq>`), so
 * concatenating them cannot collide. Returns '' when there are no effects
 * in the list, so the caller can skip the tag entirely.
 */
export function effectCssFor(hits: BrowseHit[]): string {
  const css = hits
    .filter((hit) => hit.level === 'effect')
    .map((hit) => getEffect(hit.id)?.css ?? '')
    .filter(Boolean)
  if (css.length === 0) return ''
  return [css.join('\n'), hoverPeekCssFor(css)].filter(Boolean).join('\n')
}

export function ArtifactResultGrid({
  level,
  items,
}: {
  level: ArtifactLevel
  items: BrowseHit[]
}) {
  if (level === 'effect') {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((hit) => {
          const effect = getEffect(hit.id)
          return effect ? <EffectStaticCard key={hit.id} effect={effect} /> : null
        })}
      </div>
    )
  }

  if (level === 'primitive') {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((hit) => {
          const primitive = getPrimitiveMeta(hit.id)
          return primitive ? <PrimitiveCard key={hit.id} primitive={primitive} /> : null
        })}
      </div>
    )
  }

  if (level === 'template') {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((hit) => {
          const template = getTemplateMeta(hit.id)
          return template ? <TemplateCard key={hit.id} template={template} /> : null
        })}
      </div>
    )
  }

  if (level === 'page') {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((hit) => {
          const page = getPageMeta(hit.id)
          return page ? <PageCard key={hit.id} page={page} /> : null
        })}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((hit) => {
        const block = getBlockMeta(hit.id)
        return block ? <BlockCard key={hit.id} block={block} /> : null
      })}
    </div>
  )
}
