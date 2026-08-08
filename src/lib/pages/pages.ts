/**
 * The full page catalog, including every page's source.
 *
 * ⚠️  SERVER / BUILD-TIME USE ONLY. Client components should import
 * `./page-index` instead.
 */

import 'server-only'

import { PAGE_CATALOG } from './catalog'
import GENERATED_SOURCES from './generated-page-sources.json'
import type { ArtifactFile } from '../artifact-types'
import type { Page, PageCategory } from './page-types'

const sources = GENERATED_SOURCES as Record<string, ArtifactFile[]>

export const PAGES: Page[] = PAGE_CATALOG.map((p) => ({
  ...p,
  level: 'page' as const,
  files: sources[p.id] ?? [],
}))

/** How many pages exist. */
export const PAGE_COUNT = PAGES.length

const BY_ID = new Map(PAGES.map((p) => [p.id, p]))

/** Look up a single page by id. Returns undefined for unknown ids. */
export function getPage(id: string): Page | undefined {
  return BY_ID.get(id)
}

/** Pages in one category, in catalog order. */
export function pagesInCategory(category: PageCategory): Page[] {
  return PAGES.filter((p) => p.category === category)
}

/** The page's entry file — what the detail page shows and the copy copies. */
export function primaryFile(page: Page): ArtifactFile | undefined {
  return page.files[0]
}
