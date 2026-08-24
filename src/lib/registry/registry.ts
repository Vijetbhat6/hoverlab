/**
 * The shadcn-compatible registry — Hoverlab on the rail everyone else is on.
 *
 * ⚠️  SERVER / BUILD-TIME USE ONLY. Pulls in `blocks.ts` and `pages.ts`,
 *     which carry every source file.
 *
 * WHY THIS EXISTS
 *
 * `npx shadcn add` is now how components are installed, and since CLI v4
 * (March 2026) an agent reaches registries through the shadcn MCP server
 * without a human ever opening a browser. registry.directory indexes 76
 * public registries; Magic UI, Origin UI, Cult UI and Tailark are all
 * reachable that way and Hoverlab was not. This module is the fix, and it is
 * catch-up rather than novelty: free agent access is table stakes in this
 * market, not a differentiator.
 *
 * WHAT IT PUBLISHES
 *
 *   /registry.json        the discovery document — every item, no sources
 *   /r/{name}.json        one item, with its source inlined
 *
 * Three kinds of item:
 *
 *   hoverlab              `registry:base` — the whole design system in one
 *                         install: light and dark CSS variables lifted from
 *                         globals.css, radius, icon library.
 *   {block id}            `registry:block` — one section component.
 *   {page id}             `registry:page`  — a full route, targeted at
 *                         app/{id}/page.tsx.
 *
 * Effects are deliberately NOT here yet. They are raw CSS, and shadcn's
 * `css` field wants a nested object, so shipping 835 of them means writing
 * and validating a CSS-to-AST conversion — a separate job with its own
 * failure modes. Blocks and pages map across losslessly today; effects can
 * follow once the conversion is proven rather than assumed.
 *
 * WHERE FILES LAND
 *
 * Blocks install to `components/{id}.tsx`, not `components/hoverlab/{id}.tsx`.
 * That is not a style preference — pages import their blocks as
 * `@/components/{id}`, so a namespaced subdirectory would break every page
 * install until the imports were rewritten. Matching the path the source
 * already assumes means no rewriting and nothing to keep in step.
 */

import 'server-only'

import { BLOCKS } from '../blocks/blocks'
import { PAGES } from '../pages/pages'
import type { Artifact, ArtifactFile } from '../artifact-types'
import { registryDepIds, unresolvedLocalImports } from './deps'
import TOKENS from './generated-tokens.json'

/* ------------------------------------------------------------------ *
 *  Types — a subset of https://ui.shadcn.com/schema/registry-item.json
 * ------------------------------------------------------------------ */

export type RegistryItemType =
  | 'registry:base'
  | 'registry:block'
  | 'registry:component'
  | 'registry:page'

export interface RegistryFile {
  path: string
  type: RegistryItemType | 'registry:component' | 'registry:page'
  /** Absent in the discovery document, present when the item is fetched. */
  content?: string
  /** Required by the schema for `registry:page` and `registry:file`. */
  target?: string
}

export interface RegistryItem {
  name: string
  type: RegistryItemType
  title: string
  description: string
  categories?: string[]
  /** npm packages. */
  dependencies?: string[]
  /** Other registry items, as absolute URLs so no client config is needed. */
  registryDependencies?: string[]
  files?: RegistryFile[]
  cssVars?: { theme?: Record<string, string>; light?: Record<string, string>; dark?: Record<string, string> }
  iconLibrary?: string
  docs?: string
  meta?: Record<string, unknown>
}

/* ------------------------------------------------------------------ *
 *  Names
 * ------------------------------------------------------------------ */

/**
 * Re-exported from `./name`, which has no `server-only` import — the
 * install command is rendered on the client and needs the same string.
 */
import { REGISTRY_NAME } from './name'
export { REGISTRY_NAME }

const BLOCK_BY_ID = new Map(BLOCKS.map((b) => [b.id, b]))
const PAGE_BY_ID = new Map(PAGES.map((p) => [p.id, p]))

/**
 * Block and page ids share one namespace here, so they must not collide.
 *
 * They do not today (121 blocks, 21 pages, zero overlap) and the ids are
 * hand-authored, so this is the cheap guard that keeps it that way: a
 * collision would silently make one of the two unreachable by name.
 */
const COLLISIONS = BLOCKS.filter((b) => PAGE_BY_ID.has(b.id)).map((b) => b.id)
if (COLLISIONS.length) {
  throw new Error(
    `registry: block and page ids collide — ${COLLISIONS.join(', ')}. ` +
      'Rename one side; the registry addresses both by bare id.',
  )
}

/* ------------------------------------------------------------------ *
 *  Dependency resolution
 * ------------------------------------------------------------------ */

/**
 * Registry dependencies, read from the source rather than the catalog.
 *
 * `PageMeta.composedOf` lists the same block ids and would be the obvious
 * source — but its own docblock says nothing validates it, and a page whose
 * rail is one block short is a cosmetic bug while a page install missing a
 * dependency is a broken build in someone else's project. The imports are
 * what the file actually needs, so the imports are what ships.
 *
 * Two import shapes resolve to registry items:
 *
 *   `@/components/{id}`  a page pulling in its blocks, or one block reusing
 *                        another (`hero-centered` inside a landing page).
 *   `./{id}`             the same thing, relatively — `product-buy-box`
 *                        imports `./product-grid`. Both land in
 *                        `components/`, so the relative path still resolves
 *                        after install; it is still a dependency.
 */
const KNOWN_IDS: ReadonlySet<string> = new Set([...BLOCK_BY_ID.keys(), ...PAGE_BY_ID.keys()])

function registryDepsFor(files: ArtifactFile[], origin: string): string[] {
  // Only ids the registry can actually serve. An import of some other local
  // module is a packaging bug worth surfacing, not a dependency to invent —
  // `registryAudit()` is what surfaces it.
  return registryDepIds(
    files.map((f) => f.source),
    KNOWN_IDS,
  ).map((id) => itemUrl(id, origin))
}

/** npm dependencies, from the catalog, with React itself left implicit. */
function npmDepsFor(artifact: Artifact & { deps?: string[] }): string[] {
  return (artifact.deps ?? []).filter((d) => d !== 'react')
}

/** Absolute URL of one item. Used for cross-references and by clients. */
export function itemUrl(name: string, origin: string): string {
  return `${origin.replace(/\/$/, '')}/r/${name}.json`
}

/* ------------------------------------------------------------------ *
 *  Item construction
 * ------------------------------------------------------------------ */

/**
 * The design system as a single install.
 *
 * `registry:base` is the v4 payload that carries variables, radius and icon
 * library together, so `npx shadcn add @hoverlab/hoverlab` themes a project
 * in one command instead of asking the user to copy a block of oklch by
 * hand. The values are generated from globals.css by
 * `scripts/build-registry-tokens.mjs` — never edited here.
 */
function baseItem(): RegistryItem {
  const { light, dark } = TOKENS as { light: Record<string, string>; dark: Record<string, string> }

  return {
    name: REGISTRY_NAME,
    type: 'registry:base',
    title: 'Hoverlab',
    description:
      'The Hoverlab design system: light and dark CSS variables, radius scale and icon library. Install this first and every Hoverlab block and page inherits it.',
    iconLibrary: 'lucide',
    cssVars: { light, dark },
    docs: 'Install this before any block or page so the tokens they reference exist. Blocks are plain React and Tailwind — no Radix, no runtime beyond lucide-react.',
  }
}

function blockItem(id: string, origin: string, withContent: boolean): RegistryItem | null {
  const block = BLOCK_BY_ID.get(id)
  if (!block) return null

  return {
    name: block.id,
    type: 'registry:block',
    title: block.name,
    description: block.description,
    categories: [block.category],
    dependencies: npmDepsFor(block),
    registryDependencies: registryDepsFor(block.files, origin),
    files: block.files.map((f) => ({
      path: `components/${f.path.replace(/^components\//, '')}`,
      type: 'registry:component' as const,
      ...(withContent ? { content: f.source } : {}),
    })),
    meta: { tier: 'block', href: `${origin.replace(/\/$/, '')}/block/${block.id}` },
  }
}

function pageItem(id: string, origin: string, withContent: boolean): RegistryItem | null {
  const page = PAGE_BY_ID.get(id)
  if (!page) return null

  return {
    name: page.id,
    type: 'registry:page',
    title: page.name,
    description: page.description,
    categories: [page.category],
    dependencies: npmDepsFor(page),
    registryDependencies: registryDepsFor(page.files, origin),
    files: page.files.map((f) => ({
      path: `app/${page.id}/page.tsx`,
      type: 'registry:page' as const,
      // `target` is required by the schema for pages, and is what makes the
      // route real rather than a component dropped somewhere. Every page
      // source has a default export, which is what a route file needs.
      target: `app/${page.id}/page.tsx`,
      ...(withContent ? { content: f.source } : {}),
    })),
    meta: { tier: 'page', href: `${origin.replace(/\/$/, '')}/page/${page.id}` },
  }
}

/* ------------------------------------------------------------------ *
 *  Public surface
 * ------------------------------------------------------------------ */

/** Every addressable item name, base first. */
export function registryItemNames(): string[] {
  return [REGISTRY_NAME, ...BLOCKS.map((b) => b.id), ...PAGES.map((p) => p.id)]
}

/**
 * One item by name, with sources inlined. `null` for an unknown name.
 */
export function buildRegistryItem(name: string, origin: string): RegistryItem | null {
  if (name === REGISTRY_NAME) return baseItem()
  return blockItem(name, origin, true) ?? pageItem(name, origin, true)
}

/**
 * The discovery document at `/registry.json`.
 *
 * Item definitions without file contents: registry.directory and the shadcn
 * MCP server read this to know what exists, then fetch `/r/{name}.json` for
 * the one item they want. Inlining 142 sources here would make the index
 * several megabytes and every consumer pay for it to answer "what have you
 * got".
 */
export function buildRegistryIndex(origin: string) {
  const items: RegistryItem[] = [
    baseItem(),
    ...BLOCKS.map((b) => blockItem(b.id, origin, false)!),
    ...PAGES.map((p) => pageItem(p.id, origin, false)!),
  ]

  return {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: REGISTRY_NAME,
    homepage: origin.replace(/\/$/, ''),
    items,
  }
}

/* ------------------------------------------------------------------ *
 *  Audit
 * ------------------------------------------------------------------ */

/**
 * Imports a published item makes that the registry cannot satisfy.
 *
 * An installed block that imports `@/components/site-header` compiles here
 * and fails in the user's project, and nothing about the install would say
 * why. This is the check that catches that class of packaging bug before it
 * ships; `scripts/check-registry.mts` fails the build on a non-empty result.
 */
export function registryAudit(): Array<{ item: string; unresolved: string }> {
  return unresolvedLocalImports(
    [...BLOCKS, ...PAGES].map((a) => ({ id: a.id, sources: a.files.map((f) => f.source) })),
    KNOWN_IDS,
  )
}
