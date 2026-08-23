/**
 * Schema.org builders for the catalog's detail and hub pages.
 *
 * Only /category/[slug] emitted structured data before this module existed,
 * which left the ~1,000 pages that are the actual long-tail landing surface
 * — every effect, block, page and template — as untyped HTML. A crawler
 * could read them; it could not tell that each one is a piece of source
 * code, what language it is in, whether it costs money, or where it sits in
 * the hierarchy.
 *
 * Three shapes cover everything here:
 *
 *   SoftwareSourceCode  one artifact. The closest schema.org type to "a
 *                       snippet you can copy", and the one that carries
 *                       `programmingLanguage`, `codeRepository` and
 *                       `license` — the three facts a developer searching
 *                       for a snippet actually filters on.
 *   BreadcrumbList      where the page sits. Google renders this as the
 *                       path line under the title in results, which is
 *                       worth more on a deep catalog URL than on a shallow
 *                       one: "Hoverlab › Blocks › Pricing" beats a raw
 *                       slug.
 *   ItemList            a hub page's contents.
 *
 * Every URL is absolute. Relative URLs are legal in the surrounding HTML
 * but meaningless inside a JSON-LD blob, which is parsed out of context.
 *
 * Data-only and dependency-free apart from `absoluteUrl`, so a Server
 * Component can build the object and hand it to <JsonLd> without either of
 * them pulling a catalog into a bundle.
 */

import { absoluteUrl } from '@/lib/site'
import { LEVEL_LABEL, type ArtifactLevel } from '@/lib/artifact-types'

/** The organization every page attributes itself to. */
export const PUBLISHER = {
  '@type': 'Organization',
  name: 'Hoverlab',
  url: absoluteUrl('/'),
} as const

/** Hub URL for each rung — the plural route, and the breadcrumb's parent. */
const LEVEL_HUB: Record<ArtifactLevel, string> = {
  effect: '/library',
  block: '/blocks',
  page: '/pages',
  template: '/templates',
}

/**
 * The language a rung's source is written in.
 *
 * Effects are the odd one out: they are two languages, and the one people
 * search for is CSS. Everything above them is a `.tsx` file.
 */
const LEVEL_LANGUAGE: Record<ArtifactLevel, string> = {
  effect: 'CSS',
  block: 'TypeScript',
  page: 'TypeScript',
  template: 'TypeScript',
}

export interface BreadcrumbStep {
  name: string
  /** Site-relative path. Omit on the final crumb — the page itself. */
  path?: string
}

/**
 * A BreadcrumbList.
 *
 * The last item keeps its `item` URL only when a path is given. Google
 * accepts a trailing crumb without one, and leaving it off is the honest
 * encoding of "you are here".
 */
export function breadcrumbLd(steps: BreadcrumbStep[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: steps.map((step, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: step.name,
      ...(step.path ? { item: absoluteUrl(step.path) } : {}),
    })),
  }
}

export interface ArtifactLdInput {
  level: ArtifactLevel
  id: string
  name: string
  description: string
  /** Display category ("Buttons", "Marketing"). Used as `applicationCategory`. */
  category: string
  keywords?: readonly string[]
  /** npm packages the artifact needs. Empty for every effect. */
  dependencies?: readonly string[]
  /** ISO date the artifact first appeared in the catalog, when known. */
  datePublished?: string
}

/**
 * One artifact, as SoftwareSourceCode.
 *
 * `isAccessibleForFree: true` is a deliberate claim and it is currently
 * true of every artifact: the catalog is readable, copyable and installable
 * without paying (see the tier note in `artifact-types.ts`). If per-artifact
 * gating ever lands, this flag has to move with it — a paywall behind a
 * free-content declaration is exactly the mismatch Google penalises.
 *
 * No `license` property yet. Schema.org wants a URL, and pointing one at a
 * page that does not exist is worse than omitting the field: it is a
 * machine-readable 404 attached to every artifact in the catalog. Add it
 * the moment the licence is published as a document.
 */
export function artifactLd(input: ArtifactLdInput) {
  const path = `/${input.level}/${input.id}`
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    '@id': absoluteUrl(path),
    name: input.name,
    description: input.description,
    url: absoluteUrl(path),
    programmingLanguage: LEVEL_LANGUAGE[input.level],
    applicationCategory: input.category,
    isAccessibleForFree: true,
    publisher: PUBLISHER,
    ...(input.keywords?.length ? { keywords: [...input.keywords].join(', ') } : {}),
    ...(input.dependencies?.length
      ? { softwareRequirements: [...input.dependencies].join(', ') }
      : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
  }
}

/**
 * The standard crumb trail for a detail page: Home › <Hub> › <Name>.
 *
 * Callers with a real category hub (blocks and effects both have one) pass
 * it as `middle` so the trail matches the navigation a visitor sees rather
 * than a flattened version of it.
 */
export function artifactBreadcrumbLd(
  level: ArtifactLevel,
  name: string,
  middle?: BreadcrumbStep,
) {
  return breadcrumbLd([
    { name: 'Home', path: '/' },
    { name: LEVEL_LABEL[level].many, path: LEVEL_HUB[level] },
    ...(middle ? [middle] : []),
    { name },
  ])
}

/**
 * An ItemList for a hub page.
 *
 * `numberOfItems` is the true total while `itemListElement` is capped —
 * listing 800 entries inline would add more bytes to the document than the
 * page's own content for no ranking gain, and the per-item pages carry the
 * detail anyway.
 */
export function itemListLd(
  name: string,
  path: string,
  items: Array<{ name: string; path: string }>,
  total = items.length,
  cap = 25,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url: absoluteUrl(path),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: total,
      itemListElement: items.slice(0, cap).map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        url: absoluteUrl(item.path),
      })),
    },
  }
}
