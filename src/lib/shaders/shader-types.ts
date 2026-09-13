/**
 * The second kind of effect.
 *
 * Every one of the catalog's 1,047 CSS effects is a declaration set applied
 * to an element: the browser paints it, the user copies it, and it costs
 * nothing. That is the right substrate for a hover state, a transition, a
 * loader — and it is structurally incapable of an aurora, a dithered
 * gradient, a metaball field or a hyperspeed tunnel. Those are per-pixel
 * functions, and a per-pixel function needs a surface that runs code.
 *
 * So an effect now declares how it is *rendered* rather than being assumed
 * to be CSS:
 *
 *   css      html + css, injected into a preview surface     the other 1,047
 *   webgl    a fragment shader over a fullscreen triangle
 *   canvas   a 2D draw call per frame
 *
 * `renderer` is absent on every stored record, and absent means `'css'` —
 * the same defaulting discipline as `level` on `Artifact`, and for the same
 * reason: the generated catalog predates the field, and stamping 1,047 rows
 * to say "still CSS" would cost a pass over the catalog on every import to
 * express nothing.
 *
 * DATA-FREE on purpose, like `effect-types.ts` and `artifact-types.ts`. The
 * GLSL lives in `./sources/*`, the metadata in `./catalog.ts`, and a client
 * that only needs to know a renderer exists pays for neither. The program
 * types are re-exported from `./runtime` rather than restated here: they
 * describe the shipped file's contract, and a second copy of an interface
 * is a second thing to keep in step.
 */

export type {
  ShaderPalette,
  ShaderProgram,
  GLProgram,
  Canvas2DProgram,
  Canvas2DFrame,
} from './runtime'

import type { ShaderProgram } from './runtime'

/* ------------------------------------------------------------------ *
 *  Renderers
 * ------------------------------------------------------------------ */

/** How an effect paints itself. Absent on a record means `'css'`. */
export type EffectRenderer = 'css' | 'webgl' | 'canvas'

export const EFFECT_RENDERERS: readonly EffectRenderer[] = [
  'css',
  'webgl',
  'canvas',
] as const

/**
 * Labels for filter chips and the detail page's spec row.
 *
 * `webgl` and `canvas` read as one thing to a visitor — "this one runs" —
 * so the filter groups them (see `isShaderRenderer`) while the spec row
 * still names which, because that is the difference between a fragment
 * shader you can paste into Shadertoy and a draw loop you can step through
 * in a debugger.
 */
export const RENDERER_LABEL: Record<EffectRenderer, string> = {
  css: 'CSS',
  webgl: 'Fragment shader',
  canvas: 'Canvas 2D',
}

/** The renderer of a record, resolving the `'css'` default. */
export function rendererOf(a: { renderer?: EffectRenderer }): EffectRenderer {
  return a.renderer ?? 'css'
}

/** True for the renderers that need a live surface rather than a stylesheet. */
export function isShaderRenderer(r: EffectRenderer | undefined): boolean {
  return r === 'webgl' || r === 'canvas'
}

/** The renderer a program implies, for stamping catalog records. */
export function rendererOfProgram(program: ShaderProgram): EffectRenderer {
  return program.kind
}

/* ------------------------------------------------------------------ *
 *  The preview contract
 * ------------------------------------------------------------------ */

/**
 * The attribute that marks a canvas as wanting a shader.
 *
 * Effect markup reaches the page as a string, through
 * `dangerouslySetInnerHTML`, on surfaces this module has never heard of —
 * `/browse`, the category hubs, the bundle drawer, the compare tray, the
 * playground. Rewiring each of them to mount a React component per shader
 * would be six edits now and a seventh one forgotten later.
 *
 * So the markup carries a plain `<canvas data-hoverlab-shader="aurora">`,
 * and one client component at the root finds them. A surface that renders
 * effect HTML gets working shaders without knowing shaders exist.
 */
export const SHADER_ATTR = 'data-hoverlab-shader'

/** `[data-hoverlab-shader]`, for `querySelectorAll`. */
export const SHADER_SELECTOR = `[${SHADER_ATTR}]`
