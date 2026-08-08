/**
 * Client-safe template metadata.
 *
 * Same split as the tiers below — but note what this module does NOT do:
 * it never touches `./templates`, because that module assembles whole
 * projects out of the page and block catalogs and importing it from the
 * client would drag ~250 KB of other people's source along with it.
 *
 * The counts here are therefore computed from the *indexes*, not from the
 * assembled files. They agree because both derive from the same route and
 * `composedOf` data.
 */

import { TEMPLATE_CATALOG } from './catalog'
import LINE_COUNTS from './generated-template-stats.json'
import { PAGE_INDEX } from '../pages/page-index'
import {
  TEMPLATE_CATEGORIES,
  type TemplateCategory,
  type TemplateMeta,
} from './template-types'

const scaffolding = LINE_COUNTS as Record<string, { lines: number; files: number }>

const PAGE_BY_ID = new Map(PAGE_INDEX.map((p) => [p.id, p]))

/** Distinct block ids reachable from a set of page ids. */
function blockIdsFor(pageIds: string[]): Set<string> {
  const seen = new Set<string>()
  for (const pageId of pageIds) {
    for (const blockId of PAGE_BY_ID.get(pageId)?.composedOf ?? []) {
      seen.add(blockId)
    }
  }
  return seen
}

export const TEMPLATE_INDEX: TemplateMeta[] = TEMPLATE_CATALOG.map((t) => {
  const pageIds = [...new Set(t.routes.map((r) => r.pageId))]
  const blockIds = blockIdsFor(pageIds)

  const pageLines = pageIds.reduce((n, id) => n + (PAGE_BY_ID.get(id)?.lines ?? 0), 0)

  return {
    ...t,
    level: 'template' as const,
    composedOf: pageIds,
    blockCount: blockIds.size,
    // Scaffolding + one file per route + one per distinct block + the
    // generated GETTING-STARTED.md. Matches what `assembleFiles` produces
    // on the server. The scaffolding count comes from the generated stats
    // rather than being hard-coded, so adding a file to `files/_shared/`
    // cannot silently make this wrong.
    fileCount: (scaffolding[t.id]?.files ?? 0) + t.routes.length + blockIds.size + 1,
    // Block line counts are not in this index — `block-index` has them, but
    // importing it here would pull its metadata into every client bundle
    // that only wanted a template card. Scaffolding + pages is the honest
    // partial, and the detail page shows the real total.
    lines: (scaffolding[t.id]?.lines ?? 0) + pageLines,
  }
})

/** How many templates exist. */
export const TEMPLATE_COUNT = TEMPLATE_INDEX.length

const BY_ID = new Map(TEMPLATE_INDEX.map((t) => [t.id, t]))

/** Look up a single template's metadata by id. */
export function getTemplateMeta(id: string): TemplateMeta | undefined {
  return BY_ID.get(id)
}

/** Templates in one category, in catalog order. */
export function templatesInCategory(category: TemplateCategory): TemplateMeta[] {
  return TEMPLATE_INDEX.filter((t) => t.category === category)
}

/** Categories that actually have templates in them, in taxonomy order. */
export function populatedTemplateCategories(): TemplateCategory[] {
  return TEMPLATE_CATEGORIES.filter((c) => templatesInCategory(c).length > 0)
}

/**
 * Templates that include a given page — the upward drill-down from the
 * pages tier, mirroring `pagesUsingBlock` one rung down.
 */
export function templatesUsingPage(pageId: string): TemplateMeta[] {
  return TEMPLATE_INDEX.filter((t) => t.composedOf.includes(pageId))
}
