/**
 * The filters on /browse, as pure functions over URL parameters.
 *
 * ── WHAT IS A FACET HERE, AND WHAT IS NOT ───────────────────────────────
 *
 * A facet is a filter whose answer is a fact about the artifact that the
 * catalog can back up. Three qualify:
 *
 *   fw     which frameworks the artifact reaches — read from the same
 *          `FRAMEWORK_STORIES` matrix the /frameworks pages print, so this
 *          filter cannot say something those pages do not.
 *   a11y   whether it passed the static accessibility audit — read from the
 *          generated audit report.
 *   color  which hue its source is dominated by — read from the build-time
 *          colour table (see `./color`).
 *
 * One that was asked for does not:
 *
 *   licence  Every artifact in the catalog is under the same licence. What
 *            differs is the *holder's* plan (free or commercial), which is a
 *            property of the buyer, not of an effect or a block — the
 *            terms in `@/lib/license` are identical for all 4,000-odd of
 *            them. The one thing that does vary per artifact is `tier`
 *            (free or pro), and six of seven templates are the only Pro
 *            ones; that is a plan gate, not a licence, and it is already
 *            visible on the card. A licence filter would have one option
 *            that matched everything, which is a control that looks like it
 *            does something and does not.
 *
 * ── THE ACCESSIBILITY FILTER IS BINARY, AND WHY ─────────────────────────
 *
 * The brief asked for accessibility "level". The audit does not produce
 * levels: every one of the 417 audited artifacts passes all 18 rules with no
 * findings, so there is no gradient to filter on, and inventing an
 * A / AA split from which rules are *tagged* A or AA would be describing the
 * rulebook, not the artifact. What genuinely differs is coverage: blocks and
 * pages were audited; effects, primitives and templates were not. So the
 * filter is "passed the static audit", and it is worded as evidence — the
 * report's own `publishable` flag is false, meaning no conformance claim has
 * been cleared for publication, and this filter must not read as one.
 */

import { FRAMEWORK_STORIES } from '@/lib/frameworks'
import type { ArtifactLevel } from '@/lib/artifact-types'
import { isColorBucket, type ColorBucket } from './color'

/** The minimum a hit has to expose for a facet to judge it. */
export interface FacetSubject {
  id: string
  level: ArtifactLevel
}

/* ------------------------------------------------------------------ *
 *  Framework
 * ------------------------------------------------------------------ */

export interface FrameworkFacet {
  id: string
  label: string
}

/** Every framework the site has a story for, in the story's own order. */
export const FRAMEWORK_FACETS: readonly FrameworkFacet[] = FRAMEWORK_STORIES.map((f) => ({
  id: f.id,
  label: f.label,
}))

/**
 * Whether an artifact reaches a framework, at any rung of support.
 *
 * Effects and blocks come straight from the matrix (`full` and `markup` both
 * count — a Vue wrapper around a block's markup is the honest thing the
 * catalog ships, and the /frameworks page says so at length). Pages follow
 * blocks, because that is what the matrix's own comment says they are.
 *
 * Primitives and templates are not in the matrix. Both ship as React source,
 * and nothing converts them, so they answer `react` and nothing else. That is
 * conservative on purpose: a primitive that happens to be all Tailwind
 * classes may well work in another framework, but "may well" is not something
 * a filter can promise.
 */
export function supportsFramework(level: ArtifactLevel, framework: string): boolean {
  const story = FRAMEWORK_STORIES.find((f) => f.id === framework)
  if (!story) return false
  switch (level) {
    case 'effect':
      return story.effects !== 'none'
    case 'block':
    case 'page':
      return story.blocks !== 'none'
    case 'primitive':
    case 'template':
      return framework === 'react'
  }
}

/* ------------------------------------------------------------------ *
 *  Parameters
 * ------------------------------------------------------------------ */

export interface Facets {
  fw?: string
  a11y?: 'audited'
  color?: ColorBucket
}

/**
 * Narrow untrusted query values to real ones. Anything unrecognised is
 * dropped rather than rejected: a mistyped `?fw=` should show the unfiltered
 * catalog, not an empty page that reads as "nothing supports that".
 */
export function parseFacets(params: {
  fw?: string | null
  a11y?: string | null
  color?: string | null
}): Facets {
  const out: Facets = {}
  if (params.fw && FRAMEWORK_FACETS.some((f) => f.id === params.fw)) out.fw = params.fw
  if (params.a11y === 'audited') out.a11y = 'audited'
  if (isColorBucket(params.color)) out.color = params.color
  return out
}

/** The facets back as query parameters, empty ones omitted. */
export function facetParams(facets: Facets): Record<string, string> {
  const out: Record<string, string> = {}
  if (facets.fw) out.fw = facets.fw
  if (facets.a11y) out.a11y = facets.a11y
  if (facets.color) out.color = facets.color
  return out
}

/* ------------------------------------------------------------------ *
 *  The predicate
 * ------------------------------------------------------------------ */

/** The data a facet needs, injected so this module stays testable and light. */
export interface FacetData {
  /** `level:id` for every artifact that passed the static audit. */
  audited: ReadonlySet<string>
  /** Effect ids whose source is dominated by a bucket. */
  effectsByColor: (bucket: ColorBucket) => ReadonlySet<string>
}

export function auditKey(level: string, id: string): string {
  return `${level}:${id}`
}

/**
 * One predicate for every active facet, or undefined when none is active.
 *
 * Facets combine with AND. Note what the a11y and colour facets do to the
 * other tiers: colour is a property of an effect's stylesheet, so choosing a
 * colour leaves only effects; the audit covers blocks and pages, so choosing
 * it leaves only those. The page says so next to the control — the
 * alternative, keeping unaudited artifacts in the list, would present
 * "we did not check this" as if it were a pass.
 */
export function facetPredicate(
  facets: Facets,
  data: FacetData,
): ((hit: FacetSubject) => boolean) | undefined {
  const { fw, a11y, color } = facets
  if (!fw && !a11y && !color) return undefined

  const colored = color ? data.effectsByColor(color) : null

  return (hit) => {
    if (fw && !supportsFramework(hit.level, fw)) return false
    if (a11y && !data.audited.has(auditKey(hit.level, hit.id))) return false
    if (colored && !(hit.level === 'effect' && colored.has(hit.id))) return false
    return true
  }
}
