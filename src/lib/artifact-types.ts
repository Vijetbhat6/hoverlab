/**
 * The shared vocabulary for everything Hoverlab ships.
 *
 * Hoverlab used to have exactly one kind of thing — an `Effect`: a name, a
 * category, a blob of HTML and a blob of CSS. That model is right for 4,300
 * atoms and wrong for everything above them. A pricing section is not one
 * element with one stylesheet; it is several files, a dependency list, a
 * couple of variants, and a preview that only a real React render can show.
 *
 * `Artifact` is the base every tier shares:
 *
 *   effect    a single element            html + css            ~4,300
 *   block     a full section              files[] + component     →400
 *   page      a composed screen           files[] + composedOf     →80
 *   template  a multi-page starter        files[] + composedOf     →20
 *
 * Search, favorites, bundles, compare and the public API all work against
 * this one type, so a new tier costs a `level` value rather than a parallel
 * stack of near-identical modules.
 *
 * This module is deliberately DATA-FREE — the same discipline as
 * `effect-types.ts`. Client bundles import the types and the tiny helpers
 * here without pulling a catalog in behind them.
 */

/* ------------------------------------------------------------------ *
 *  Levels
 * ------------------------------------------------------------------ */

/** Rungs of the ladder, ordered atom → assembly. */
export type ArtifactLevel = 'effect' | 'block' | 'page' | 'template'

export const ARTIFACT_LEVELS: readonly ArtifactLevel[] = [
  'effect',
  'block',
  'page',
  'template',
] as const

/** Singular / plural labels for headings, chips and breadcrumbs. */
export const LEVEL_LABEL: Record<ArtifactLevel, { one: string; many: string }> = {
  effect: { one: 'Effect', many: 'Effects' },
  block: { one: 'Block', many: 'Blocks' },
  page: { one: 'Page', many: 'Pages' },
  template: { one: 'Template', many: 'Templates' },
}

/**
 * Which plan an artifact needs. Absent means `'free'`.
 *
 * This IS a gate now, and it is enforced in exactly one place in the
 * catalog: six of the seven templates. Every effect, every block, every
 * page and `marketing-site` are free at every surface — browse, copy,
 * `/api/v1`, `hoverlab add` — and that is not expected to change, because
 * they are the funnel.
 *
 * This comment used to say the opposite, and the reason it gave was
 * correct: `/api/v1` took no credentials and `/api/templates/{id}/download`
 * was `force-static`, so a website-side check would be walked around by the
 * CLI and by the archive URL. "Selling individual artifacts means
 * authenticating the API first" was the conclusion, and it is what
 * `billing/api-key.ts` now does. Both routes resolve a licence, and the
 * download route is no longer static.
 *
 * Where the check lives:
 *   lib/api/artifacts.ts                 withholds file bodies, keeps metadata
 *   api/v1/templates/{id}                resolves a key or a session
 *   api/v1/artifacts/{id}                same, since it can return a template
 *   api/templates/{id}/download          402 without a licence
 *
 * Note the shape of the gate: an unlicensed caller still gets the name,
 * category, description, dependency list, route table and file COUNT. What
 * Pro buys is the source, not the knowledge that it exists — a template
 * nobody can find is a template nobody buys.
 *
 * What Pro sells alongside this is narrower than an earlier draft of this
 * comment claimed. `canUseProFeatures` lifts the bundle cap and carries the
 * commercial licence; it does not gate export formats or brand presets,
 * because neither could be gated honestly — `/api/v1` hands every format to
 * any caller and brand presets recolour this site's own chrome. See the
 * note on `canUseProFeatures` in `billing/entitlements.ts`, which is the
 * authoritative list.
 */
export type ArtifactTier = 'free' | 'pro'

/* ------------------------------------------------------------------ *
 *  Source files
 * ------------------------------------------------------------------ */

/**
 * A language tag, used for syntax highlighting and export filenames.
 *
 * `md` is here because templates ship documentation as part of the project
 * — a README and a getting-started guide are files in the tree like any
 * other, and the file browser has to be able to render them.
 */
export type SourceLang =
  | 'tsx'
  | 'jsx'
  | 'ts'
  | 'js'
  | 'css'
  | 'html'
  | 'vue'
  | 'svelte'
  | 'json'
  | 'md'

/**
 * One file of a multi-file artifact.
 *
 * `path` is relative to wherever the user drops the artifact — e.g.
 * `components/pricing-section.tsx`. Keeping it relative means the zip
 * export, the CLI and the copy-to-clipboard flow all agree on layout
 * without any of them knowing the user's project structure.
 */
export interface ArtifactFile {
  path: string
  lang: SourceLang
  source: string
}

/* ------------------------------------------------------------------ *
 *  The base type
 * ------------------------------------------------------------------ */

export interface Artifact {
  id: string
  name: string

  /**
   * Which rung of the ladder this sits on.
   *
   * Optional, and absent means `'effect'` — read it through `levelOf()`
   * rather than touching it directly. The catalog holds 4,300 generated
   * effect records and a 2,000-line hand-written literal, none of which
   * carry the field; defaulting costs nothing at load time, where stamping
   * every record would cost a pass over the whole catalog on every import.
   */
  level?: ArtifactLevel

  /**
   * Category name, scoped to the level — effects use `EffectCategory`,
   * blocks use `BlockCategory`. Typed as `string` here so the base does not
   * have to know every level's taxonomy; each level narrows it.
   */
  category: string

  description: string

  /** Free-text tags for search and filtering. */
  tags?: string[]

  /** Curated pick — what the "Featured" filters surface. */
  featured?: boolean

  /** Plan required. Absent means free. */
  tier?: ArtifactTier

  /* -- Preview: an artifact carries exactly one of these two -------- */

  /**
   * Inline preview markup. How effects render: injected into a preview
   * surface alongside `css`, no React involved.
   */
  html?: string

  /** Stylesheet paired with `html`. */
  css?: string

  /**
   * Registry key of a React component that renders this artifact's preview.
   * How blocks and above render — a pricing section is real components with
   * real props, and re-expressing it as a string of HTML would preview a
   * different thing than the source the user copies.
   */
  previewComponent?: string

  /* -- Source ------------------------------------------------------- */

  /**
   * The files a user actually copies. Effects leave this unset: their
   * `html` + `css` is both the preview and the deliverable.
   */
  files?: ArtifactFile[]

  /** npm packages the source imports, e.g. `["lucide-react"]`. */
  deps?: string[]

  /* -- Composition -------------------------------------------------- */

  /**
   * Ids of the artifacts one rung down that this is built from — a template
   * lists its pages, a page its blocks, a block its effects.
   *
   * This is what makes the ladder navigable in both directions: drill down
   * from a template to the button inside it, or climb from an effect to
   * everything using it (see `composedOfIndex`). Beginners take the stairs;
   * pros jump straight to the rung they want.
   */
  composedOf?: string[]

  /** Preview surface hints, shared by every level. */
  previewClass?: string
  darkSurface?: boolean
}

/* ------------------------------------------------------------------ *
 *  Helpers
 * ------------------------------------------------------------------ */

/** An artifact's level, resolving the `'effect'` default. */
export function levelOf(a: Pick<Artifact, 'level'>): ArtifactLevel {
  return a.level ?? 'effect'
}

/** An artifact's tier, resolving the `'free'` default. */
export function tierOf(a: Pick<Artifact, 'tier'>): ArtifactTier {
  return a.tier ?? 'free'
}

/** True when the artifact previews as injected markup rather than React. */
export function hasInlinePreview(
  a: Pick<Artifact, 'html' | 'css'>,
): a is Pick<Artifact, 'html' | 'css'> & { html: string } {
  return typeof a.html === 'string' && a.html.length > 0
}

/**
 * Route for an artifact's detail page.
 *
 * Effects keep `/effect/[slug]` — those URLs are the product's long-tail
 * SEO surface and several thousand of them are indexed. Everything else
 * follows the same `/{level}/{id}` shape.
 */
export function artifactHref(a: Pick<Artifact, 'id' | 'level'>): string {
  return `/${levelOf(a)}/${a.id}`
}

/**
 * URL slug for a category name — `"Inputs & Hover"` → `"inputs-hover"`.
 *
 * Shared by every level's taxonomy so `/category/...` and `/blocks/...`
 * slugify identically. Derived rather than stored, which keeps adding a
 * category to a single edit.
 */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
