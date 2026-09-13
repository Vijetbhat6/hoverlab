/**
 * The hand-crafted effects, with their markup and CSS, available
 * synchronously on the client.
 *
 * Split out of `effect-index.ts` deliberately. Anything that imported
 * `getBundledEffect` — the landing showcase, `useEffectDetails` — used to
 * reach through that module, and importing it at all drags in the 772 KB
 * generated metadata index whether or not the caller wants a single
 * hand-written effect. This module depends only on `effects-handcrafted`,
 * so `/` can render its showcase without paying for the catalog.
 *
 * These ~64 effects are bundled in full because they're the curated set
 * the landing page and the "Featured" filter render immediately; shipping
 * them means those paths never wait on a network round-trip. Everything
 * generated resolves lazily via `useEffectDetails()` / `/api/effects/batch`.
 */

import { HANDCRAFTED } from './effects-handcrafted'
import { SHADER_EFFECTS } from './shaders/shader-effects'
import { withMotionGuard } from './effect-insights'
import type { Effect } from './effect-types'

export const BUNDLED_EFFECTS: Effect[] = [
  ...HANDCRAFTED.map((e) => ({
    ...e,
    // The same motion guard the server-side catalog applies, so a bundled
    // effect rendered straight from the client matches what /api/effects
    // would have returned for it. See `withMotionGuard`.
    css: withMotionGuard(e.css),
    featured: true,
  })),
  /*
   * The shader tier is bundled too, and it is cheap to: markup plus a
   * fallback gradient is ~13 KB for all fifteen, because the part that is
   * actually big — the GLSL — is not here. It lives in `shaders/registry`,
   * which `<ShaderRuntime>` dynamic-imports the first time it sees a shader
   * canvas, so a visitor who never scrolls to one never downloads it.
   *
   * Bundling matters more here than for a CSS effect: a shader whose markup
   * arrives a round-trip late is a canvas that boots a round-trip late, and
   * the landing showcase would show a gradient and then jump.
   */
  ...SHADER_EFFECTS,
]

const BY_ID = new Map(BUNDLED_EFFECTS.map((e) => [e.id, e]))

/**
 * Get a full effect synchronously, if it happens to be one of the bundled
 * hand-crafted ones. Returns undefined for generated effects — those must
 * go through `useEffectDetails()` / `/api/effects/batch`.
 */
export function getBundledEffect(id: string): Effect | undefined {
  return BY_ID.get(id)
}
