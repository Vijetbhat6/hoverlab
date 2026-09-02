/**
 * The non-colour half of a design system: corner radius, spacing density
 * and type scale.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────
 *
 * The brand picker moves one axis — hue — and calls the result a design
 * system. It is not one. Two products with the same accent colour and
 * different radii, gutters and type scales do not look remotely alike, and
 * the three below are the axes that actually carry that difference. Untitled
 * UI and Tailwind Plus sell whole theme systems on exactly this; the export
 * here has accepted a `radius` option since it was written and nothing has
 * ever passed one.
 *
 * ── WHY THESE THREE, AND NOT MORE ───────────────────────────────────────
 *
 * Because in Tailwind v4 each of them is a single token that moves
 * everything downstream of it, which means a slider here restyles the whole
 * catalog rather than one component:
 *
 *   radius    `--radius`, which `@theme inline` maps to radius-sm/md/lg/xl.
 *   density   `--spacing`, the base unit every `p-*`, `gap-*`, `m-*` and
 *             `size-*` utility multiplies. v4 made this one number; in v3
 *             it was a hand-written scale and this control would have been
 *             a hundred lines of table.
 *   type      the `--text-*` ramp. Not one token, but a ramp derived from
 *             one ratio, which is the same thing from the user's side.
 *
 * Anything else — shadow depth, border width, letter spacing — would be a
 * fourth slider that moves less than any of these three. The point is to
 * cover the difference between two products, not to expose every variable.
 *
 * ── SCALES ARE MULTIPLIERS, NOT ABSOLUTE VALUES ─────────────────────────
 *
 * `density: 0.85` means "85% of the catalog's gutters", not "3.4px". The
 * catalog's own values are the reference, so a preset stays meaningful if
 * the base theme is ever retuned, and a customer's export cannot drift into
 * proportions no block was designed against.
 *
 * Pure and dependency-free, like its neighbours in `lib/export`.
 */

export interface ThemeShape {
  /** Base corner radius in rem. */
  radiusRem: number
  /** Multiplier on the base spacing unit. 1 is the catalog's own. */
  density: number
  /** Multiplier on the type ramp. 1 is the catalog's own. */
  typeScale: number
}

export const DEFAULT_THEME_SHAPE: ThemeShape = {
  radiusRem: 0.75,
  density: 1,
  typeScale: 1,
}

export interface ShapePreset extends ThemeShape {
  id: string
  name: string
  /** One sentence on what this shape reads as. */
  note: string
}

/**
 * Four named shapes, chosen to be recognisably different from each other
 * rather than to fill a grid. A preset a user cannot tell apart from the
 * default is a preset that makes the control look broken.
 */
export const SHAPE_PRESETS: ShapePreset[] = [
  {
    id: 'default',
    name: 'Hoverlab',
    note: 'The catalog as it ships — 12px corners, standard gutters.',
    ...DEFAULT_THEME_SHAPE,
  },
  {
    id: 'sharp',
    name: 'Sharp',
    note: 'Square corners and tighter gutters. Reads as technical, dense, developer-facing.',
    radiusRem: 0.125,
    density: 0.9,
    typeScale: 0.97,
  },
  {
    id: 'soft',
    name: 'Soft',
    note: 'Large corners and generous spacing. Reads as consumer, calm, marketing-led.',
    radiusRem: 1.25,
    density: 1.15,
    typeScale: 1.05,
  },
  {
    id: 'compact',
    name: 'Compact',
    note: 'Small corners, tight gutters, smaller type. For dashboards that show a lot at once.',
    radiusRem: 0.375,
    density: 0.8,
    typeScale: 0.92,
  },
]

/* ------------------------------------------------------------------ *
 *  Bounds
 * ------------------------------------------------------------------ */

/**
 * Ranges, enforced rather than suggested.
 *
 * A density of 0.2 does not produce a compact design system, it produces
 * one where every label touches its border and half the blocks overlap.
 * These are the bounds inside which the catalog still holds together, and
 * `coerceThemeShape` is what stops an API caller stepping outside them.
 */
export const SHAPE_BOUNDS = {
  radiusRem: { min: 0, max: 2 },
  density: { min: 0.75, max: 1.35 },
  typeScale: { min: 0.85, max: 1.2 },
} as const

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Round to three places — enough for a multiplier, short enough to read. */
function tidy(value: number): number {
  return Math.round(value * 1000) / 1000
}

/**
 * Coerce arbitrary input into a shape inside the supported bounds.
 *
 * Mirrors `coerceBrandColor` next door, and for the same reason: this is
 * reached from a public API route, so "trust the caller" is not available.
 */
export function coerceThemeShape(input: unknown): ThemeShape {
  if (!input || typeof input !== 'object') return DEFAULT_THEME_SHAPE
  const raw = input as Partial<Record<keyof ThemeShape, unknown>>

  const read = (key: keyof ThemeShape): number => {
    const value = Number(raw[key])
    if (!Number.isFinite(value)) return DEFAULT_THEME_SHAPE[key]
    const { min, max } = SHAPE_BOUNDS[key]
    return tidy(clamp(value, min, max))
  }

  return {
    radiusRem: read('radiusRem'),
    density: read('density'),
    typeScale: read('typeScale'),
  }
}

export function shapeEquals(a: ThemeShape, b: ThemeShape): boolean {
  return (
    a.radiusRem === b.radiusRem && a.density === b.density && a.typeScale === b.typeScale
  )
}

export function findShapePreset(shape: ThemeShape): ShapePreset | null {
  return SHAPE_PRESETS.find((preset) => shapeEquals(preset, shape)) ?? null
}

/* ------------------------------------------------------------------ *
 *  CSS
 * ------------------------------------------------------------------ */

/**
 * The catalog's type ramp, in rem, as Tailwind v4 ships it.
 *
 * Restated here rather than parsed out of `globals.css` because these are
 * Tailwind's own defaults, which the site does not override — there is no
 * `--text-*` block to extract, so there is nothing that could drift. A
 * project that *does* override them keeps its own values: this emits a
 * ramp, and the last definition wins.
 */
const TYPE_RAMP: Array<[string, number, number]> = [
  // [name, size rem, line-height rem]
  ['xs', 0.75, 1],
  ['sm', 0.875, 1.25],
  ['base', 1, 1.5],
  ['lg', 1.125, 1.75],
  ['xl', 1.25, 1.75],
  ['2xl', 1.5, 2],
  ['3xl', 1.875, 2.25],
  ['4xl', 2.25, 2.5],
  ['5xl', 3, 1],
  ['6xl', 3.75, 1],
]

/** The catalog's base spacing unit, which `density` multiplies. */
const BASE_SPACING_REM = 0.25

function rem(value: number): string {
  // Trailing zeros stripped: `1rem`, not `1.000rem`.
  return `${Number(value.toFixed(4))}rem`
}

/**
 * The shape as a `@theme` block.
 *
 * `@theme` rather than `:root`, because `--spacing` and the `--text-*` ramp
 * are Tailwind *theme* variables: they have to be visible to the utility
 * generator, and a `:root` declaration would set a custom property that no
 * utility reads. `--radius` is the exception — it is this project's own
 * variable, consumed through `var()` — so it is emitted in both places.
 *
 * Returns an empty string for the default shape. A file full of
 * declarations that restate the defaults is noise, and a customer who has
 * not touched the sliders should not be handed one.
 */
export function shapeCss(shape: ThemeShape): string {
  if (shapeEquals(shape, DEFAULT_THEME_SHAPE)) return ''

  const lines: string[] = []

  if (shape.radiusRem !== DEFAULT_THEME_SHAPE.radiusRem) {
    lines.push(`  --radius: ${rem(shape.radiusRem)};`)
  }

  if (shape.density !== DEFAULT_THEME_SHAPE.density) {
    lines.push(
      `  /* Density ${shape.density}× — every p-*, gap-*, m-* and size-* utility. */`,
      `  --spacing: ${rem(BASE_SPACING_REM * shape.density)};`,
    )
  }

  if (shape.typeScale !== DEFAULT_THEME_SHAPE.typeScale) {
    lines.push(`  /* Type ${shape.typeScale}× — the whole ramp, kept proportional. */`)
    for (const [name, size, leading] of TYPE_RAMP) {
      lines.push(
        `  --text-${name}: ${rem(size * shape.typeScale)};`,
        `  --text-${name}--line-height: ${rem(leading * shape.typeScale)};`,
      )
    }
  }

  return `@theme {\n${lines.join('\n')}\n}\n`
}

/**
 * The same shape, as the variables themselves rather than as a stylesheet.
 *
 * WHY BOTH EXIST. `shapeCss` writes a file for a human to paste, so it
 * carries comments, omits anything at its default, and is a string.
 * A shadcn registry item wants the `cssVars.theme` object instead — the
 * CLI merges it into whatever the project already has, and a comment or an
 * omitted default has nowhere to go in JSON.
 *
 * DIFFERENT ON PURPOSE, IN ONE RESPECT. This emits the *complete* set,
 * including values equal to the catalog's own, where `shapeCss` emits
 * nothing for those. A preset is a design system someone is adopting
 * wholesale, and a preset that silently inherits `--spacing` from whatever
 * the project had before is not the design system it advertised — the
 * radius would move and the gutters would not. The stylesheet can assume a
 * Hoverlab project underneath it; a registry item cannot assume anything.
 */
export function shapeThemeVars(shape: ThemeShape): Record<string, string> {
  const vars: Record<string, string> = {
    '--radius': rem(shape.radiusRem),
    '--spacing': rem(BASE_SPACING_REM * shape.density),
  }

  for (const [name, size, leading] of TYPE_RAMP) {
    vars[`--text-${name}`] = rem(size * shape.typeScale)
    vars[`--text-${name}--line-height`] = rem(leading * shape.typeScale)
  }

  return vars
}

/** A one-line human summary, for a UI that has to say what is selected. */
export function describeShape(shape: ThemeShape): string {
  const preset = findShapePreset(shape)
  if (preset) return `${preset.name} — ${preset.note}`

  const parts = [`${Math.round(shape.radiusRem * 16)}px corners`]
  if (shape.density !== 1) parts.push(`${Math.round(shape.density * 100)}% spacing`)
  if (shape.typeScale !== 1) parts.push(`${Math.round(shape.typeScale * 100)}% type`)
  return `Custom — ${parts.join(', ')}`
}
