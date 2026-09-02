/**
 * Template taxonomy and types — Tier 4, the top of the ladder.
 *
 * A template is a project: routing, layout, theme tokens and several pages,
 * arranged so `npm install && npm run dev` produces something that runs.
 *
 * The type that carries the weight here is `TemplateRoute`. A bag of pages
 * is not a project — what makes it one is knowing that `dashboard-overview`
 * lives at `/dashboard` and `error-404-page` is the `not-found` special
 * case. That mapping drives the preview's route switcher, the assembled
 * file tree, and the routes table in each README.
 *
 * DATA-FREE, like the tiers below it.
 */

import type { Artifact, ArtifactFile } from '../artifact-types'
import { toSlug } from '../artifact-types'

/* ------------------------------------------------------------------ *
 *  Categories
 * ------------------------------------------------------------------ */

/**
 * `Landing Pages` is deliberately not folded into `Marketing`.
 *
 * Marketing holds *sites* — several routes with a landing page among them,
 * bought by someone who needs a whole web presence. Landing Pages holds
 * single-argument projects bought by someone who has one thing to launch,
 * and they are shopped differently: the visitor is comparing four opening
 * screens, not four sitemaps. Merging them would put a docs site and a
 * waitlist page in the same grid section, where the only honest sort order
 * is "which of these is a landing page".
 */
export type TemplateCategory =
  | 'Full Product'
  | 'Landing Pages'
  | 'Marketing'
  | 'Internal Tools'
  | 'Commerce'

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'Full Product',
  'Landing Pages',
  'Marketing',
  'Internal Tools',
  'Commerce',
]

/* ------------------------------------------------------------------ *
 *  Routes
 * ------------------------------------------------------------------ */

/**
 * One route in the template's project.
 *
 * `path` is the URL. `file` is where the page source lands in the project —
 * usually derived from the path, but not always: Next's `not-found.tsx` is
 * a special file at the app root rather than a `/not-found` route, which is
 * exactly the case that makes storing the file path worthwhile instead of
 * computing it.
 */
export interface TemplateRoute {
  path: string
  /** Page id from the pages catalog. */
  pageId: string
  /** Destination inside the generated project, e.g. `app/pricing/page.tsx`. */
  file: string
  /** Shown on the route switcher tab. */
  label: string
}

/* ------------------------------------------------------------------ *
 *  The Template type
 * ------------------------------------------------------------------ */

/**
 * A template has no `previewComponent` of its own.
 *
 * A project cannot render as one element — it is several screens, and the
 * honest preview is a route switcher that shows each in turn. So the
 * preview is assembled from the *pages* registry via `routes`, and this
 * tier needs no registry at all. That is the payoff for having built the
 * rungs in order.
 */
export interface Template
  extends Omit<
    Artifact,
    | 'level'
    | 'category'
    | 'html'
    | 'css'
    | 'files'
    | 'tags'
    | 'deps'
    | 'composedOf'
    | 'previewComponent'
  > {
  level: 'template'
  category: TemplateCategory
  /** Every file in the generated project, assembled in `templates.ts`. */
  files: ArtifactFile[]
  tags: string[]
  deps: string[]
  routes: TemplateRoute[]
  /**
   * Which page to show as this template's thumbnail, when the first route is
   * the wrong answer.
   *
   * Cards default to `routes[0]`, which is right for most templates: the
   * screen you land on is the screen you are deciding about. It breaks when
   * two templates legitimately start from the same page — SaaS Starter and
   * Marketing Site both open on `saas-landing-page`, so both cards rendered
   * a pixel-identical thumbnail and the grid looked like it was repeating
   * itself. Naming a different screen here is how the smaller one shows what
   * makes it different rather than what it shares.
   */
  previewPageId?: string
  /**
   * Palette id from `./palettes`, or undefined for the shared indigo.
   *
   * Optional rather than required because the seven original templates are
   * app shells that genuinely should look alike — a dashboard and an admin
   * panel are the same product with different routes, and giving each one a
   * different accent would be variety for its own sake. It is the landing
   * templates that must not match, so they are the ones that set it.
   *
   * Naming a palette here does two things at once: `templates.ts` swaps the
   * generated project's `globals.css` for that palette's, and the card and
   * detail preview scope the same colours onto the live React so the site
   * shows what the download will look like.
   */
  palette?: string
  /** Page ids, derived from `routes` — the rung immediately below. */
  composedOf: string[]
}

/** A template without its files — what the client-side index carries. */
export interface TemplateMeta
  extends Omit<Template, 'files' | 'frameworks' | 'html' | 'css'> {
  /** Total lines across every file in the project. */
  lines: number
  /** How many files the assembled project contains. */
  fileCount: number
  /** Distinct block ids reachable through this template's pages. */
  blockCount: number
}

/* ------------------------------------------------------------------ *
 *  Slugs
 * ------------------------------------------------------------------ */

/** `"Internal Tools"` → `"internal-tools"`. */
export function templateCategorySlug(category: TemplateCategory): string {
  return toSlug(category)
}

const BY_SLUG = new Map<string, TemplateCategory>(
  TEMPLATE_CATEGORIES.map((c) => [templateCategorySlug(c), c]),
)

/** Resolve a URL slug back to its template category. */
export function templateCategoryFromSlug(
  slug: string,
): TemplateCategory | undefined {
  return BY_SLUG.get(slug.toLowerCase())
}
