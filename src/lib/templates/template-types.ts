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
/**
 * `Account & Access` is the newest and the narrowest, and it earns the row.
 *
 * The screens in it — sign-in, sign-up, recovery, the second factor, the
 * invoice, the usage meter, the 403 — are the ones every product has and
 * nobody sets out to build. They are not a Full Product, because none of
 * them is the thing being sold; they are not Internal Tools, because the
 * customer is on the other side of them. Filed under either, they read as
 * offcuts. Filed together, they are what somebody actually searches for at
 * the point they need them, which is a fortnight before launch.
 */
export type TemplateCategory =
  | 'Full Product'
  | 'Landing Pages'
  | 'Marketing'
  | 'Internal Tools'
  | 'Commerce'
  | 'Account & Access'

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'Full Product',
  'Landing Pages',
  'Marketing',
  'Internal Tools',
  'Commerce',
  'Account & Access',
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
 *  Set pieces
 * ------------------------------------------------------------------ */

/**
 * The single distinctive screen a template is sold on.
 *
 * Kept as its own exported type rather than three inline fields because
 * the card, the detail page and the hub's index all render it, and a
 * shape spelled out in three places drifts on the first addition.
 */
export interface TemplateSetPiece {
  /** A noun phrase. Renders on a card, so keep it short. */
  name: string
  /** One sentence on why this is the hard part of the genre. */
  note: string
  /** Page id the set piece lives on. Must be one of the template's routes. */
  pageId: string
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
   * The one thing this template is sold on.
   *
   * REQUIRED IN PRACTICE, like `palette` — `templates.test.ts` fails the
   * build for a template without one, and it is optional in the type only
   * because the field arrived after the first twenty-one templates did.
   *
   * The reason it exists: a grid of thirty-two cards described as "a
   * landing page for X" is thirty-two rows of the same sentence with the
   * noun changed, and a visitor scanning it has no way to tell which one
   * is worth opening. Naming a single concrete set piece — the menu
   * typeset as a bill of fare, the agenda across three tracks, the map
   * beside the results, the CV that prints — gives them something to
   * recognise and, more usefully, gives us somewhere to be wrong. A
   * template that cannot name one distinctive screen probably should not
   * be a separate template.
   *
   * `name` is a noun phrase, not a sentence, and stays under about forty
   * characters because it renders on a card. `note` is one sentence on
   * why that piece is the hard part of the genre — it is the line that
   * has to earn the click, so it says something a competitor's page does
   * not, rather than restating the name.
   *
   * `pageId` names the screen the set piece is actually on, so the card
   * can link into it rather than to the template's front door. It is
   * validated against `routes`: naming a page the template does not
   * contain is the failure this field invites, and it is a type-level
   * lie about what somebody is about to download.
   */
  setPiece?: TemplateSetPiece
  /**
   * Palette id from `./palettes`. Every template names one.
   *
   * OPTIONAL IN THE TYPE, REQUIRED IN PRACTICE — `palettes.test.ts` fails
   * the build for a template that omits it. It stays optional here only
   * because the field arrived after the first seven templates did, and
   * widening it to required would be a lie about what the file has to
   * tolerate while a new template is being written.
   *
   * The reason it cannot be skipped: omitting it does *not* fall back to
   * the shared indigo on the site. The card thumbnail is live React inside
   * Hoverlab's own tokens, so a template with no palette renders in
   * Hoverlab's green — and a grid of those is one template photographed
   * from several angles.
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
