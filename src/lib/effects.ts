/**
 * The FULL effect catalog — hand-crafted + all 1,600+ generated effects,
 * including every effect's `html` and `css` payload.
 *
 * ⚠️  SERVER / BUILD-TIME USE ONLY.
 *
 * Importing this module from a `'use client'` component pulls the entire
 * 1.6 MB generated-effects.json into the browser bundle. That was the
 * cause of the 1.7 MB client chunk that shipped on both `/` and
 * `/library` — ~1.6 MB of JavaScript the browser had to download, parse,
 * and keep in memory before the grid could paint.
 *
 * Client components should import from `./effect-index` instead, which
 * carries metadata only (~255 KB) and is enough for search, filtering,
 * sorting, and counts. When a client actually needs an effect's markup
 * and CSS, fetch it through `useEffectDetails()` / `/api/effects/batch`.
 *
 * Safe importers: route handlers, server components, `generateMetadata`,
 * `generateStaticParams`, OG image routes, and build scripts.
 */

import GENERATED_RAW from "./generated-effects.json";
import { HANDCRAFTED } from "./effects-handcrafted";
import { withMotionGuard } from "./effect-insights";
import type { Effect } from "./effect-types";

export type { Effect, EffectCategory } from "./effect-types";
export { CATEGORIES } from "./effect-types";

/* Mark all hand-crafted effects as featured (curated picks). */
const FEATURED_HANDCRAFTED: Effect[] = HANDCRAFTED.map((e) => ({
  ...e,
  css: withMotionGuard(e.css),
  featured: true,
}));

/* ============================================================
 *  Generated effects (loaded from static JSON, built by
 *  scripts/generate-effects.mjs). Re-run that script to
 *  regenerate the catalog.
 * ========================================================== */
/**
 * A third of the catalog animates forever, and none of the generated CSS
 * carries a motion opt-out. Rather than bake one into the JSON — which
 * would miss the hand-written effects and be lost on the next regenerate —
 * the guard is applied here, once, as the catalog is assembled. See
 * `withMotionGuard`.
 */
const GENERATED: Effect[] = (GENERATED_RAW as Effect[]).map((e) => ({
  ...e,
  css: withMotionGuard(e.css),
}));

/**
 * Full catalog: hand-crafted (featured) + generated.
 * Total count is over 1,600.
 */
export const EFFECTS: Effect[] = [...FEATURED_HANDCRAFTED, ...GENERATED];

/** Total effect count, exposed for the hero badge. */
export const TOTAL_COUNT = EFFECTS.length;

/** O(1) id → effect lookup, built once per server process. */
const BY_ID: Map<string, Effect> = new Map(EFFECTS.map((e) => [e.id, e]));

/** Look up a single effect by id. Returns undefined for unknown ids. */
export function getEffect(id: string): Effect | undefined {
  return BY_ID.get(id);
}

/**
 * Look up many effects by id, preserving the caller's ordering and
 * silently dropping ids that no longer exist in the catalog.
 * Used by the /api/effects/batch route.
 */
export function getEffects(ids: string[]): Effect[] {
  const out: Effect[] = [];
  for (const id of ids) {
    const e = BY_ID.get(id);
    if (e) out.push(e);
  }
  return out;
}
