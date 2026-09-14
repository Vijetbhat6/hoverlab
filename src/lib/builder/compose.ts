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
 * The first version of it chose sections and ordered them with two arrows,
 * and `/compare` said so in the row where the competitors won: theirs drag,
 * reorder, restyle and run. The operations below are the second version —
 * `insertAt`, `duplicateAt` and `moveTo` are what a pointer released over a
 * gap actually means, and the theme param is the "restyle" half. What has
 * not changed is where the answer lives.
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

/**
 * Query parameter the theme travels in.
 *
 * Same encoding `/tools/shadcn` puts in its install URL — `encodeTheme` from
 * `lib/shadcn-theme`. Deliberately opaque and deliberately not decoded in
 * this file: the composer's job is blocks, and pulling the colour maths in
 * here would make a module that is tested without a browser depend on
 * oklch conversion. The page decodes it and hands the result back as CSS.
 */
export const THEME_PARAM = 't'

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

/**
 * The `/builder` href for a given list of blocks, under a given theme.
 *
 * `theme` is threaded through every edit rather than being remembered
 * anywhere, because the URL is the only place state lives. An edit that
 * dropped it would silently reset the reader's colours the first time they
 * moved a section — the exact bug a client-side store would not have, and
 * the price of this design is paying attention to it at every call site.
 */
export function builderHref(ids: string[], theme?: string | null): string {
  /*
   * Assembled by hand rather than with URLSearchParams, which percent-
   * encodes the comma separating the ids. `?b=hero-split%2Clogo-strip` is
   * a correct URL and parses back identically, but the composition is meant
   * to be read and edited in the address bar and pasted into a channel —
   * an escape sequence where a comma should be costs that for nothing.
   * Ids are `[a-z0-9-]` by catalog rule and the theme param is base64url,
   * so neither half needs escaping.
   */
  const parts: string[] = []
  if (ids.length > 0) parts.push(`${COMPOSITION_PARAM}=${serializeComposition(ids)}`)
  if (theme) parts.push(`${THEME_PARAM}=${encodeURIComponent(theme)}`)
  return parts.length ? `/builder?${parts.join('&')}` : '/builder'
}

/* ------------------------------------------------------------------ *
 *  Editing operations
 *
 *  Pure array transforms rather than component state, so the reorder
 *  buttons can be plain links: every edit is "here is the next list",
 *  and the next list is a URL. That is what makes the builder work with
 *  JavaScript disabled and makes the back button an undo stack.
 *
 *  The drag surface calls these same functions and then navigates to the
 *  result, which is why adding dragging did not add a second source of
 *  truth: a drop is `moveTo`, and a `moveTo` is a URL. The pointer is a
 *  faster way to name the next list, not a different kind of edit.
 * ------------------------------------------------------------------ */

/** Insert `id` at the end. */
export function appendBlock(ids: string[], id: string): string[] {
  if (ids.length >= MAX_SECTIONS) return ids
  return [...ids, id]
}

/**
 * Insert `id` at `index`, pushing whatever was there down.
 *
 * `index` is clamped rather than validated: the callers are a drop target
 * and a keyboard handler, both of which compute positions from geometry
 * and both of which can legitimately arrive at -1 or at length + 1 when
 * the pointer is above the first row or below the last.
 */
export function insertAt(ids: string[], index: number, id: string): string[] {
  if (ids.length >= MAX_SECTIONS) return ids
  const at = Math.max(0, Math.min(index, ids.length))
  return [...ids.slice(0, at), id, ...ids.slice(at)]
}

/** Remove whatever is at `index`. Out-of-range is a no-op, not a throw. */
export function removeAt(ids: string[], index: number): string[] {
  if (index < 0 || index >= ids.length) return ids
  return [...ids.slice(0, index), ...ids.slice(index + 1)]
}

/**
 * Copy the section at `index` and put the copy directly below it.
 *
 * Duplicates were always legal in a composition — two CTAs on one page is a
 * real layout — but the only way to make one was to find the block in the
 * picker again, which for a page with a section already in it is the one
 * operation the reader has to search for something they can see.
 */
export function duplicateAt(ids: string[], index: number): string[] {
  if (index < 0 || index >= ids.length) return ids
  return insertAt(ids, index + 1, ids[index])
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

/**
 * Move the section at `from` so that it ends up at index `to`.
 *
 * The arbitrary-distance sibling of `moveAt`, and what dragging needs:
 * a pointer released over the seventh gap is not a sequence of swaps, and
 * expressing it as one would put six intermediate compositions in the
 * history stack for one gesture.
 *
 * `to` is where the section lands in the RESULT, not a gap index in the
 * input. The two differ by one whenever a section moves downward — drop
 * the first row into the gap before the fourth and it lands at index 2,
 * because removing it first shifted everything below up. Callers that
 * think in gaps convert once, at the call site, where the geometry is.
 *
 * Generic in the element, alone among the operations here, because the drag
 * surface applies the same permutation twice: once to the ids that become
 * the next URL, and once to a list of INDICES that reorders the
 * server-rendered previews optimistically. Both have to be the identical
 * transform or the outline and the canvas disagree about what just moved,
 * and one function is how that is guaranteed rather than reviewed.
 */
export function moveTo<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || from >= items.length) return items
  const target = Math.max(0, Math.min(to, items.length - 1))
  if (target === from) return items

  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(target, 0, moved)
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
  /**
   * The command that installs the theme this layout was composed under,
   * when it was composed under one.
   *
   * Recorded in the header rather than emitted into the component, because
   * a shadcn theme is a token sheet and a token sheet belongs in
   * `globals.css` — a page that carried its own colours would restyle
   * itself against the app it landed in. The file that leaves here has to
   * be able to say "and the colours came from somewhere else", or the
   * reader installs the sections, sees the default palette, and concludes
   * the builder lied about the preview.
   */
  themeCommand?: string
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
    ...(options.themeCommand
      ? [
          ' *',
          ' * Composed under a custom theme. The colours live in globals.css,',
          ' * not in this file — install them too:',
          ` *   ${options.themeCommand}`,
        ]
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
