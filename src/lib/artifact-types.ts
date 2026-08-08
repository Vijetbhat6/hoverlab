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
 * Kept as data on the artifact rather than derived from its level, because
 * the free/pro line does not fall neatly between tiers — some blocks are
 * free lead-ins and some effects are premium.
 */
export type ArtifactTier = 'free' | 'pro'

/* ------------------------------------------------------------------ *
 *  Source files
 * ------------------------------------------------------------------ */

/** A language tag, used for syntax highlighting and export filenames. */
export type SourceLang = 'tsx' | 'jsx' | 'ts' | 'js' | 'css' | 'html' | 'vue' | 'svelte' | 'json'

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

/**
 * A named alternative — "dark", "compact", "centered".
 *
 * Variants are presentation switches on one artifact, not separate
 * artifacts: they share an id, a page and a set of favorites. Anything that
 * differs structurally enough to deserve its own URL should be its own
 * artifact instead.
 */
export interface ArtifactVariant {
  id: string
  label: string
  description?: string
}

/** Frameworks an artifact's source can be emitted for. */
export type Framework = 'react' | 'vue' | 'svelte' | 'html'

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

  /** Pre-rendered ports of `files`, when they exist. */
  frameworks?: Partial<Record<Framework, ArtifactFile[]>>

  variants?: ArtifactVariant[]

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

  /** Preview needs its full width — sections and pages, not atoms. */
  fullBleed?: boolean
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
