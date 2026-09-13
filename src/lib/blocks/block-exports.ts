/**
 * Two readings of `generated-block-exports.json` that the builder already
 * needed and the detail page now does too.
 *
 * The JSON is derived from `registry.tsx` and verified against each
 * block's own source (see `scripts/build-block-exports.mjs`), which makes
 * it the one place that knows a block's true export symbol. 249 of the 250
 * are the PascalCased id and `empty-state-cta` exports `EmptyState`, so
 * deriving the name instead of reading it is a guess that is wrong exactly
 * once — and being wrong once is what makes it a guess.
 *
 * `lib/builder/compose.ts` reads the same file directly for the same
 * reason. This module exists so the second and third readers do not each
 * re-shape the JSON, and so the preview-props half has one parser rather
 * than one per caller.
 */

import BLOCK_EXPORTS from './generated-block-exports.json'

const EXPORTS = (BLOCK_EXPORTS as { exports: Record<string, string> }).exports
const PREVIEW_PROPS = (BLOCK_EXPORTS as { previewProps?: Record<string, string> })
  .previewProps ?? {}

/**
 * The symbol a block's source exports.
 *
 * Falls back to the id when a block is missing from the map, which the
 * generator makes impossible at build time — it throws rather than emit a
 * partial map — so the fallback exists only so a caller need not handle
 * undefined, never as a naming rule.
 */
export function blockExportName(id: string): string {
  return EXPORTS[id] ?? id
}

/**
 * The props `registry.tsx` passes a block so it can be previewed in place.
 *
 * Seven blocks are registered as `<CartDrawer embedded />` — overlays and
 * drawers that would otherwise portal or fix themselves to the viewport
 * and cover the page they are being previewed on. Anything rendering one
 * of those outside the registry has to pass the same prop or reproduce the
 * bug the prop exists to avoid.
 *
 * The generator captures the attribute text verbatim, and every one of
 * them today is a bare boolean. Bare names become `true`; anything more
 * complicated is ignored rather than half-parsed, because a wrong prop
 * here renders a wrong component, and the registry's own element is
 * unaffected either way.
 */
export function fixedPreviewProps(id: string): Record<string, unknown> {
  const raw = PREVIEW_PROPS[id]
  if (!raw) return {}

  const out: Record<string, unknown> = {}
  for (const token of raw.trim().split(/\s+/)) {
    if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(token)) out[token] = true
  }
  return out
}
