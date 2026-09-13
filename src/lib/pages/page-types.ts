/**
 * Page taxonomy and types — Tier 3 of the ladder in `artifact-types.ts`.
 *
 * A page is a whole screen assembled from blocks: not "a pricing table" but
 * "the pricing page", nav and footer and FAQ included. It is the rung where
 * a visitor stops assembling and starts editing.
 *
 * This is also the first tier where `composedOf` carries real weight. A
 * block is not built out of catalog effects — it is Tailwind markup that
 * happens to resemble them — so populating `composedOf` on a block would be
 * fiction. A page genuinely *is* its blocks: the source imports them by
 * name, and the ids listed in the catalog are the ones the file renders.
 * That makes the drill-down navigable in both directions and, more usefully,
 * keeps it honest.
 *
 * DATA-FREE, like `block-types.ts`.
 */

import type { Artifact, ArtifactFile } from '../artifact-types'
import { toSlug } from '../artifact-types'

/* ------------------------------------------------------------------ *
 *  Categories
 * ------------------------------------------------------------------ */

export type PageCategory =
  | 'Marketing Pages'
  | 'App Screens'
  | 'Auth Screens'
  | 'Account & Billing'
  | 'System Pages'
  | 'Commerce Pages'

export const PAGE_CATEGORIES: PageCategory[] = [
  'Marketing Pages',
  'App Screens',
  'Auth Screens',
  'Account & Billing',
  'Commerce Pages',
  'System Pages',
]

/* ------------------------------------------------------------------ *
 *  The Page type
 * ------------------------------------------------------------------ */

/**
 * A page is an `Artifact` that previews as a React render and declares the
 * blocks it is made of.
 *
 * `composedOf` is required here, unlike on the base — a page that lists no
 * blocks is either mis-authored or is really a block wearing the wrong
 * label, and both are worth a type error rather than a silent empty rail.
 */
export interface Page
  extends Omit<
    Artifact,
    'level' | 'category' | 'html' | 'css' | 'files' | 'tags' | 'deps' | 'composedOf'
  > {
  level: 'page'
  category: PageCategory
  previewComponent: string
  files: ArtifactFile[]
  /**
   * Required, unlike on the base — every page is authored by hand, so an
   * empty list is a real answer ("no dependencies") and an absent one is an
   * oversight. Same call as `Block`.
   */
  tags: string[]
  deps: string[]
  /** Block ids this page renders. Must match what the source imports. */
  composedOf: string[]
  /**
   * The page this one is a second take on — set on take 02 only, naming
   * take 01's id.
   *
   * One layout is a bet. Two takes of the same page type turn that bet
   * into a choice, which is the difference between a template and a
   * catalog: the reader stops asking "is this the layout?" and starts
   * asking "which of these two is mine?".
   *
   * Deliberately one-directional. The alternative — a symmetric `takes:
   * string[]` on both — has to be edited in two places to stay true, and
   * the half that gets forgotten is the half that renders a dead link.
   * Take 01 never mentions its sibling; the index derives that with
   * `takesOfPage`, so the pair cannot fall out of step.
   *
   * Not chainable: a take 02 may not itself be a take of a take. See
   * `scripts/check-page-takes.mts`, which fails the build on a self-
   * reference, a chain, or an id that resolves to nothing.
   */
  takeOf?: string
}

/** A page without its source — what the client-side index carries. */
export interface PageMeta extends Omit<Page, 'files' | 'frameworks' | 'html' | 'css'> {
  /** Line count of the page's source, shown on the card. */
  lines: number
}

/* ------------------------------------------------------------------ *
 *  Slugs
 * ------------------------------------------------------------------ */

/** `"Account & Billing"` → `"account-billing"`. */
export function pageCategorySlug(category: PageCategory): string {
  return toSlug(category)
}

const BY_SLUG = new Map<string, PageCategory>(
  PAGE_CATEGORIES.map((c) => [pageCategorySlug(c), c]),
)

/** Resolve a URL slug back to its page category, or undefined if unknown. */
export function pageCategoryFromSlug(slug: string): PageCategory | undefined {
  return BY_SLUG.get(slug.toLowerCase())
}
