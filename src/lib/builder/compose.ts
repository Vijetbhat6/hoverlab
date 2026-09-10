/**
 * Blocks in, a page source out.
 *
 * ── THE GAP THIS CLOSES ─────────────────────────────────────────────────
 *
 * `/compare` concedes it in its own data: React Bits ships a Landing
 * Builder, Shadcnblocks a page builder, UI8 a Forge. We shipped the parts a
 * builder composes — 1,111 effects, 250 blocks, 43 pages, 21 templates,
 * kits over the top — and nothing that composes them. Every rung of the
 * ladder was built except the one where a visitor assembles their own.
 *
 * The catalog already proves the composition works: a page in `pages/` IS
 * its blocks, imported by name and rendered in order, and `composedOf`
 * records exactly that. This module is that same act performed by the
 * reader instead of by us.
 *
 * ── WHY THE COMPOSITION LIVES IN THE URL ────────────────────────────────
 *
 * A builder is the obvious place to require an account — it is where a
 * competitor would put the wall, and where saved state is most tempting to
 * charge for. Putting the whole composition in the query string means a
 * layout is a link: shareable into a team channel, pasteable into a ticket,
 * openable by someone with no account, and diffable by eye. It also means
 * this file is a pure function of a string, which is why it can be tested
 * without a browser or a database.
 *
 * It costs us the ability to save a composition server-side, which is the
 * correct thing to lose. `/compare` argues that the only thing we withhold
 * is the licence to ship; a builder that withheld your own layout would
 * make that sentence false.
 *
 * ── WHY THE GENERATED SOURCE IS SHAPED LIKE A CATALOG PAGE ──────────────
 *
 * The output imports from `@/components/<id>` and wraps in the same
 * `<main className="min-h-screen bg-background text-foreground">` that the
 * hand-authored pages use, because it has to drop into the project the CLI
 * has already been writing into. `npx hoverlab add hero-split` puts a file
 * at `components/hero-split.tsx`; a composed page that imported from
 * anywhere else would be a second convention for the same act.
 */

import BLOCK_EXPORTS from '../blocks/generated-block-exports.json'
import { BLOCK_INDEX } from '../blocks/block-index'

const EXPORTS = (BLOCK_EXPORTS as { exports: Record<string, string> }).exports

/**
 * How many sections one composition may hold.
 *
 * Not a product limit dressed up as a constant — a bound on work the server
 * does for an anonymous string. `/builder` renders every chosen block live,
 * so the query parameter is an instruction to render N real React trees.
 * Uncapped, `?b=` with all 250 ids pasted in renders the entire block
 * catalog on one request, and does it again for every reload.
 *
 * Thirty is far past any real page — the longest hand-authored page in the
 * catalog composes eight blocks — so it never binds on honest use.
 */
export const MAX_SECTIONS = 30

/** Query parameter the composition travels in. */
export const COMPOSITION_PARAM = 'b'

export interface Composition {
  /** Block ids, in render order. Duplicates are allowed and meaningful. */
  ids: string[]
  /**
   * Ids that were asked for and could not be used, in the order given.
   *
   * Surfaced rather than swallowed. A shared link outlives the catalog
   * entry it names — a block gets renamed and someone's saved layout
   * silently loses a section. Telling the reader which id no longer
   * resolves is the difference between a broken link and a lossy one.
   */
  dropped: string[]
  /** True when the request was longer than `MAX_SECTIONS`. */
  truncated: boolean
}

/**
 * Read a composition out of a query parameter.
 *
 * Deliberately total: every malformed input resolves to an empty
 * composition rather than throwing. This runs on a server route whose input
 * is a URL any stranger can type, so the only acceptable behaviour for
 * garbage is an empty builder.
 */
export function parseComposition(raw: string | string[] | undefined): Composition {
  const text = Array.isArray(raw) ? raw[0] : raw
  if (typeof text !== 'string' || text.length === 0) {
    return { ids: [], dropped: [], truncated: false }
  }

  const requested = text
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0)

  const ids: string[] = []
  const dropped: string[] = []

  for (const id of requested) {
    if (ids.length >= MAX_SECTIONS) break
    if (id in EXPORTS) ids.push(id)
    else dropped.push(id)
  }

  return { ids, dropped, truncated: requested.length > MAX_SECTIONS }
}

/** Write a composition back into a query parameter. */
export function serializeComposition(ids: string[]): string {
  return ids.slice(0, MAX_SECTIONS).join(',')
}

/** The `/builder` href for a given list of blocks. */
export function builderHref(ids: string[]): string {
  if (ids.length === 0) return '/builder'
  return `/builder?${COMPOSITION_PARAM}=${serializeComposition(ids)}`
}

/* ------------------------------------------------------------------ *
 *  Editing operations
 *
 *  Pure array transforms rather than component state, so the reorder
 *  buttons can be plain links: every edit is "here is the next list",
 *  and the next list is a URL. That is what makes the builder work with
 *  JavaScript disabled and makes the back button an undo stack.
 * ------------------------------------------------------------------ */

/** Insert `id` at the end. */
export function appendBlock(ids: string[], id: string): string[] {
  if (ids.length >= MAX_SECTIONS) return ids
  return [...ids, id]
}

/** Remove whatever is at `index`. Out-of-range is a no-op, not a throw. */
export function removeAt(ids: string[], index: number): string[] {
  if (index < 0 || index >= ids.length) return ids
  return [...ids.slice(0, index), ...ids.slice(index + 1)]
}

/**
 * Swap the entry at `index` with its neighbour in `direction`.
 *
 * Moving the first section up, or the last one down, returns the list
 * unchanged so the control can render as disabled rather than absent —
 * a row whose buttons appear and disappear as it moves is harder to use
 * than one whose buttons grey out.
 */
export function moveAt(ids: string[], index: number, direction: -1 | 1): string[] {
  const target = index + direction
  if (index < 0 || index >= ids.length) return ids
  if (target < 0 || target >= ids.length) return ids
  const next = [...ids]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

/* ------------------------------------------------------------------ *
 *  Source generation
 * ------------------------------------------------------------------ */

/** `my landing page` -> `MyLandingPage`. Always a valid component name. */
export function componentName(input: string): string {
  const cleaned = input
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('')

  // A name starting with a digit is not an identifier, and an empty one is
  // not a component. Both are reachable from free text ("2024 launch", "!!").
  if (cleaned.length === 0) return 'ComposedPage'
  return /^[0-9]/.test(cleaned) ? `Page${cleaned}` : cleaned
}

/** `my landing page` -> `my-landing-page.tsx`. */
export function fileName(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'composed-page'}.tsx`
}

/**
 * Every third-party package the chosen blocks import, deduped and sorted.
 *
 * Worth its own export because it is the question the generated file cannot
 * answer for itself: the imports say `lucide-react`, but nothing in the
 * source says "and you need to install it". Blocks in this catalog are
 * deliberately shallow — `react` and `lucide-react` and little else — and
 * showing that list is how a reader confirms it rather than taking our word.
 */
export function composedDeps(ids: string[]): string[] {
  const seen = new Set<string>()
  for (const id of ids) {
    const meta = BLOCK_INDEX.find((b) => b.id === id)
    for (const dep of meta?.deps ?? []) seen.add(dep)
  }
  return [...seen].sort()
}

export interface ComposeOptions {
  /** What the reader called it. Free text; sanitized here, not at the caller. */
  name?: string
  /** Absolute URL of the composition, recorded in the file's header. */
  shareUrl?: string
}

/**
 * Render the chosen blocks as a page source file.
 *
 * Duplicate ids are supported — two CTA sections on one page is a real
 * layout — so imports are deduped while usages are not.
 */
export function composePageSource(ids: string[], options: ComposeOptions = {}): string {
  const name = componentName(options.name ?? 'Composed Page')
  const usable = ids.filter((id) => id in EXPORTS)

  const uniqueIds: string[] = []
  for (const id of usable) if (!uniqueIds.includes(id)) uniqueIds.push(id)

  const imports = uniqueIds.map((id) => `import { ${EXPORTS[id]} } from '@/components/${id}'`)

  const body =
    usable.length === 0
      ? '      {/* No sections chosen yet. */}'
      : usable.map((id) => `      <${EXPORTS[id]} />`).join('\n')

  const deps = composedDeps(usable)

  const header = [
    '/**',
    ` * ${name} — composed from ${usable.length} Hoverlab block${usable.length === 1 ? '' : 's'}.`,
    ' *',
    ' * Install the sections this file imports:',
    ` *   ${installCommand(uniqueIds)}`,
    ...(deps.length
      ? [' *', ` * Packages the sections need: ${deps.join(', ')}`]
      : []),
    ...(options.shareUrl ? [' *', ` * Rebuild or edit this layout: ${options.shareUrl}`] : []),
    ' */',
  ]

  return [
    ...header,
    '',
    "import * as React from 'react'",
    ...imports,
    '',
    `export default function ${name}() {`,
    '  return (',
    '    <main className="min-h-screen bg-background text-foreground">',
    body,
    '    </main>',
    '  )',
    '}',
    '',
  ].join('\n')
}

/** The one command that installs every section in a composition. */
export function installCommand(ids: string[]): string {
  const unique: string[] = []
  for (const id of ids) if (!unique.includes(id) && id in EXPORTS) unique.push(id)
  if (unique.length === 0) return 'npx hoverlab add <block>'
  return `npx hoverlab add ${unique.join(' ')}`
}
