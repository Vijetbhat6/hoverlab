/**
 * Joining a kit's id lists against the four catalogs.
 *
 * Split from `./catalog` so that file stays data-only and reviewable as
 * data — the same split `blocks/catalog.ts` and `blocks/block-index.ts`
 * have, for the same reason.
 *
 * Everything here reads the *index* modules rather than the catalogs. A kit
 * page renders names, categories and descriptions and no source at all, and
 * the indexes are what carry those without dragging 1.6 MB of CSS and 53 KB
 * of TSX behind them.
 *
 * The output is flat and serializable on purpose: the kit page is a server
 * component, and the one interactive thing on it — "add the whole kit to
 * your bundle" — is a client island that has to receive these rows as
 * props. Anything not rendered stays out.
 */

import { BLOCK_INDEX } from '@/lib/blocks/block-index'
import { EFFECT_INDEX } from '@/lib/effect-index'
import { PAGE_INDEX } from '@/lib/pages/page-index'
import { TEMPLATE_INDEX } from '@/lib/templates/template-index'
import {
  ARTIFACT_LEVELS,
  LEVEL_LABEL,
  artifactHref,
  type ArtifactLevel,
} from '@/lib/artifact-types'
import type { Kit, KitContents } from '@/lib/kits/catalog'

/** One item of a kit, flattened to what a row shows. */
export interface KitItem {
  id: string
  level: ArtifactLevel
  name: string
  category: string
  description: string
  href: string
}

/** A kit's items at one rung, with the label the heading uses. */
export interface KitGroup {
  level: ArtifactLevel
  /** "Templates", "Blocks" — plural, from LEVEL_LABEL. */
  label: string
  items: KitItem[]
}

/**
 * Which array of `KitContents` feeds which rung.
 *
 * Keyed by `ArtifactLevel` so the iteration order below can come from
 * `ARTIFACT_LEVELS` rather than from a second list that could disagree
 * with it. That constant runs effect → template, and a kit reads the other
 * way: the assembled thing first, then the screens, then the sections,
 * then the polish — descending order of "how much of the job does this one
 * item do". Hence the reversed copy in `kitGroups`, which is a copy
 * because `reverse()` mutates and that array is shared.
 */
const FIELD: Record<ArtifactLevel, keyof KitContents> = {
  template: 'templates',
  page: 'pages',
  block: 'blocks',
  effect: 'effects',
}

/**
 * Every index, behind one lookup.
 *
 * Built once at module load. Each index is already a module-level constant,
 * so this is four map constructions and no copying of the records
 * themselves.
 */
const BY_LEVEL: Record<ArtifactLevel, Map<string, KitItem>> = {
  template: indexOf('template', TEMPLATE_INDEX),
  page: indexOf('page', PAGE_INDEX),
  block: indexOf('block', BLOCK_INDEX),
  effect: indexOf('effect', EFFECT_INDEX),
}

function indexOf(
  level: ArtifactLevel,
  records: ReadonlyArray<{ id: string; name: string; category: string; description: string }>,
): Map<string, KitItem> {
  return new Map(
    records.map((r) => [
      r.id,
      {
        id: r.id,
        level,
        name: r.name,
        category: r.category,
        description: r.description,
        href: artifactHref({ id: r.id, level }),
      },
    ]),
  )
}

/**
 * A kit's contents, grouped by rung, top rung first.
 *
 * Unknown ids are dropped rather than rendered as a broken row — but they
 * are not *tolerated*: `scripts/check-kits.mts` fails the build on one, so
 * the only way to reach this branch is a catalog that changed under a
 * running dev server. Dropping is the right behaviour there; shipping it is
 * what the check script exists to prevent.
 *
 * Empty groups are omitted, so a kit with no effects renders no effects
 * heading rather than an empty one.
 */
export function kitGroups(kit: Kit): KitGroup[] {
  const groups: KitGroup[] = []

  for (const level of [...ARTIFACT_LEVELS].reverse()) {
    const ids = kit.contents[FIELD[level]] ?? []
    const items = ids
      .map((id) => BY_LEVEL[level].get(id))
      .filter((item): item is KitItem => item !== undefined)

    if (items.length > 0) {
      groups.push({ level, label: LEVEL_LABEL[level].many, items })
    }
  }

  return groups
}

/** Every item in a kit, flattened — what the bundle button sends. */
export function kitItems(kit: Kit): KitItem[] {
  return kitGroups(kit).flatMap((g) => g.items)
}

/**
 * How many pieces a kit holds.
 *
 * Derived rather than declared, so a count on a card can never disagree
 * with the list on the page behind it.
 */
export function kitSize(kit: Kit): number {
  return kitItems(kit).length
}

/**
 * The one-line inventory a card shows: "1 template · 6 pages · 14 blocks".
 *
 * Built from the groups rather than the raw arrays, so an id that stopped
 * resolving is missing from the summary as well as from the list.
 */
export function kitSummary(kit: Kit): string {
  return kitGroups(kit)
    .map((g) => {
      const label = g.items.length === 1 ? LEVEL_LABEL[g.level].one : LEVEL_LABEL[g.level].many
      return `${g.items.length} ${label.toLowerCase()}`
    })
    .join(' · ')
}
