/**
 * The shader tier as `Effect` records — metadata, markup and fallback CSS.
 *
 * Client-safe and ~13 KB, which is why it is separate from `./shaders`:
 * this is what the effect index and the bundled-effects module import, and
 * neither of them wants the 70 KB of TSX that the detail page shows.
 *
 * A shader effect is a real `Effect`, not a parallel type. It has `html` and
 * `css` like every other record, and they are honest: the html is the
 * canvas the runtime looks for, and the css paints a gradient in the
 * design's own colours that a visitor without WebGL keeps. So every surface
 * that already renders effects — `/browse`, the category hubs, the bundle
 * drawer, compare, the playground, the public API, the CLI — renders these
 * with no changes at all, and the ones that run JavaScript additionally get
 * the shader.
 *
 * What `renderer` buys on top of that is the ability to *say* which it is:
 * the filter on `/library`, the spec row on the detail page, and the honest
 * split in the counts (see `check-claimed-counts.mts`, which used to claim
 * every effect in the catalog was CSS).
 */

import GENERATED_MARKUP from './generated-shader-markup.json'
import { SHADER_CATALOG } from './catalog'
import type { Effect } from '../effect-types'

interface MarkupEntry {
  html: string
  css: string
  /** Line count of the design's own file, for the card's stat line. */
  lines: number
}

const markup = GENERATED_MARKUP as Record<string, MarkupEntry>

/**
 * Every shader effect, without its source files.
 *
 * `previewClass` is doing real work here. The card, the static card and the
 * detail stage all pass it through `cn()` after their own padding class, so
 * `p-0` wins on merge and a shader fills its preview box instead of sitting
 * in the middle of it with a 16px frame — which is right for a button and
 * wrong for a background. `darkSurface` is deliberately left off: it would
 * force `bg-slate-950` and take `previewClass` out of the running, and the
 * canvas paints its own background anyway.
 */
export const SHADER_EFFECTS: Effect[] = SHADER_CATALOG.map((record) => {
  const m = markup[record.id]
  if (!m) {
    // Only reachable in a dev tree where the build script has not been run
    // since a record was added. Loud, because the alternative is an effect
    // that renders as an empty box on every surface.
    throw new Error(
      `[shaders] no generated markup for "${record.id}" — run \`npm run build:shaders\``,
    )
  }

  return {
    id: record.id,
    name: record.name,
    category: record.category,
    description: record.description,
    tags: record.tags,
    featured: record.featured,
    renderer: record.renderer,
    html: m.html,
    css: m.css,
    previewClass: 'p-0 bg-transparent',
    /*
     * Zero dependencies, and worth stating rather than leaving absent: the
     * three files are React and the DOM. Every competitor's equivalent
     * ships three.js or ogl, which is 150 KB before the first pixel.
     */
    deps: [],
  }
})

/** Line count of a shader effect's own file, for the card's stat line. */
export function shaderLines(id: string): number {
  return markup[id]?.lines ?? 0
}

const BY_ID = new Map(SHADER_EFFECTS.map((e) => [e.id, e]))

/** Look up one shader effect. Returns undefined for a CSS effect's id. */
export function getShaderEffect(id: string): Effect | undefined {
  return BY_ID.get(id)
}
