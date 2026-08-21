/**
 * `hoverlab.config.json` — the project's brand, read from disk.
 *
 * Written by the design-system export on hoverlab.dev/design-system. Its
 * presence in a project root is what lets `hoverlab add` emit an effect in
 * the project's colours rather than in Hoverlab's.
 *
 * WHAT THIS CAN AND CANNOT DO, because the difference is the whole reason
 * the export ships five files rather than one:
 *
 *   blocks, pages, templates   Nothing to do. They style themselves through
 *                              design tokens, so they already follow
 *                              whatever `tokens.css` says. The config is
 *                              not consulted for them and does not need to
 *                              be.
 *   effects                    Hand-written CSS with literal colours in it,
 *                              which is exactly the rung tokens cannot
 *                              reach. The catalog's customisation supports
 *                              a hue rotation and a saturation shift, so
 *                              the brand is applied as a DELTA from the
 *                              catalog's own brand.
 *
 * That delta is an approximation and is described as one wherever it is
 * surfaced. Rotating a hue moves every colour in the effect, including ones
 * that were deliberately neutral, and it cannot reproduce an arbitrary
 * OKLCH lightness. The exact answer for a single effect is the AI recolour
 * on the site, which rewrites the CSS rather than filtering it. This is the
 * free, offline, good-enough version — and for the overwhelmingly common
 * case, an accent-coloured button in a brand that is not emerald, it is
 * the right answer.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'

const CONFIG_NAME = 'hoverlab.config.json'

/**
 * The catalog's own brand, which every effect's CSS is authored against.
 *
 * Mirrors DEFAULT_BRAND_COLOR on the site. Duplicated rather than fetched
 * because the CLI is dependency-free and offline-capable by design, and
 * because a delta computed against a moving reference would silently
 * re-tint every previously installed effect the day the default changed.
 */
const CATALOG_BRAND = { hue: 160, chroma: 0.2 }

/** How far up to look for a config before giving up. */
const MAX_DEPTH = 6

/**
 * Find and read the nearest `hoverlab.config.json`, walking upward.
 *
 * Upward rather than cwd-only, so `hoverlab add` works from inside
 * `src/components` in a project whose config sits at the root — which is
 * where the export tells people to put it.
 *
 * Returns null for absent, unreadable or malformed. A broken config must
 * never stop an install: the effect still lands, just in catalog colours.
 */
export async function readProjectConfig(cwd = process.cwd()) {
  let dir = path.resolve(cwd)

  for (let depth = 0; depth < MAX_DEPTH; depth++) {
    try {
      const raw = await fs.readFile(path.join(dir, CONFIG_NAME), 'utf8')
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        return { ...parsed, path: path.join(dir, CONFIG_NAME) }
      }
    } catch {
      /* Not here, or not readable. Keep walking. */
    }

    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  return null
}

/**
 * The customisation that moves an effect onto a project's brand.
 *
 * Returns null when there is no config, no brand in it, or the brand is
 * the catalog's own — in which case there is nothing to apply and saying
 * "applied your brand" would be noise.
 *
 * Hue is a rotation, so the value is the signed difference in degrees,
 * normalised into the -180..180 the customiser accepts. Saturation is a
 * percentage shift derived from the chroma ratio and clamped, which is the
 * roughest part of this and the reason the whole module says
 * "approximation" out loud.
 */
export function brandCustomization(config) {
  const brand = config?.brand
  if (!brand || typeof brand !== 'object') return null

  const hue = Number(brand.hue)
  const chroma = Number(brand.chroma)
  if (!Number.isFinite(hue)) return null

  // Normalise the rotation to the short way round the wheel: a brand at
  // hue 10 against a catalog at 160 is -150, not +210.
  let hueDelta = Math.round(hue - CATALOG_BRAND.hue)
  hueDelta = ((((hueDelta + 180) % 360) + 360) % 360) - 180

  let satDelta = 0
  if (Number.isFinite(chroma) && chroma > 0) {
    satDelta = Math.round((chroma / CATALOG_BRAND.chroma - 1) * 100)
    satDelta = Math.max(-100, Math.min(100, satDelta))
  }

  if (hueDelta === 0 && satDelta === 0) return null

  return {
    hue: hueDelta,
    saturation: satDelta,
    scale: 1,
    speed: 1,
    /** For the line the CLI prints. Not part of the customisation. */
    name: typeof brand.name === 'string' ? brand.name : null,
  }
}
