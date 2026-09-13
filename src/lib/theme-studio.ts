/**
 * Live theming across the catalog — four axes, one control, every preview.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────
 *
 * This repo already had most of a theme system and no way to use it. The
 * brand picker moved one axis (`lib/brand-presets.ts`). `lib/theme-shape.ts`
 * argued at length that hue alone is not a design system and exposed radius,
 * density and type scale — to an export nothing ever called. Template
 * palettes (`lib/templates/palettes.ts`) carried whole token maps, scoped to
 * one card at a time. Three good pieces, all of them behind an API or a
 * download, none of them above the grid where somebody is actually deciding
 * whether this catalog suits their product.
 *
 * So this is not a new theme engine. It is the missing control surface, and
 * the cheapest way to make 285 blocks feel like several thousand: the same
 * sections, in your colours, your neutrals, your typeface and your corners,
 * without installing anything.
 *
 * ── THE FOUR AXES, AND WHY EXACTLY THESE ────────────────────────────────
 *
 *   accent   the brand hue. Already plumbed — `--brand-*` feed --primary,
 *            --ring and --accent. Reused verbatim rather than duplicated.
 *   base     the NEUTRALS, which are what actually make two products look
 *            different. Everyone changes their accent; almost nobody
 *            changes their greys, which is why every startup site looks
 *            like the same site in a different colour.
 *   font     the typeface. One variable, and it moves more of the page's
 *            character than the accent does.
 *   radius   corner radius. One token that cascades to every rounded-*
 *            utility through `@theme inline`.
 *
 * Density and type scale are deliberately NOT here. They exist in
 * `theme-shape.ts` and they belong in an export, because a catalog whose
 * gutters move under you while you browse is a catalog you cannot compare
 * two cards in. The axes above all change how a component *looks*; those two
 * change how the page *lays out*, and that is a different promise.
 *
 * ── WHY EVERY AXIS IS AN INPUT AND NOT AN OUTPUT ────────────────────────
 *
 * Each of these writes a small number of theme-INDEPENDENT variables onto
 * <html>, and `globals.css` derives the finished light and dark tokens from
 * them. That indirection is not decoration, it is forced: an inline style on
 * <html> beats every stylesheet rule on the same element, so writing a
 * finished `--background` inline would override the `.dark` rule too and the
 * theme toggle would stop working. Inputs can be inline because they mean
 * the same thing in both themes; outputs cannot.
 *
 * DATA-FREE and dependency-free, so client components can import it and the
 * preset list can be rendered on the server.
 */

import {
  clamp,
  coerceBrandColor,
  normalizeHue,
  type BrandColor,
  DEFAULT_BRAND_COLOR,
} from './brand-presets'

/* ------------------------------------------------------------------ *
 *  Axis: neutrals
 * ------------------------------------------------------------------ */

/**
 * The neutral half of a theme.
 *
 * Two hues rather than one, because the catalog's greys were never one hue
 * and flattening them would be a downgrade sold as a feature. Light surfaces
 * are warm and light ink is cool; in dark the two swap over. See the long
 * note beside `--base-warm-hue` in `globals.css`.
 *
 * `chroma` is a MULTIPLIER on the per-token amounts already in the
 * stylesheet, not an absolute. 0 is a true grey, 1 is what ships, 3 is
 * visibly tinted. Relative keeps the careful proportions between a
 * background at 0.005 and a card at 0.012 instead of flattening both.
 */
export interface ThemeBase {
  warmHue: number
  coolHue: number
  chroma: number
}

export const DEFAULT_BASE: ThemeBase = { warmHue: 90, coolHue: 250, chroma: 1 }

export interface BasePreset extends ThemeBase {
  id: string
  name: string
  note: string
}

export const BASE_PRESETS: BasePreset[] = [
  {
    id: 'stone',
    ...DEFAULT_BASE,
    name: 'Stone',
    note: 'Warm paper, cool ink. The catalog default, and the safest neutral for a product that has to look calm.',
  },
  {
    id: 'zinc',
    warmHue: 90,
    coolHue: 250,
    chroma: 0,
    name: 'Zinc',
    note: 'A true grey with no hue at all. Reads as tooling and infrastructure — and it is the honest choice if your brand colour is loud.',
  },
  {
    id: 'slate',
    warmHue: 250,
    coolHue: 250,
    chroma: 1.6,
    name: 'Slate',
    note: 'Cool in both directions. The blue-grey that most dashboards land on, here on purpose rather than by accident.',
  },
  {
    id: 'sand',
    warmHue: 70,
    coolHue: 55,
    chroma: 2.4,
    name: 'Sand',
    note: 'Warm surfaces and warm ink. Editorial rather than technical; the one that stops a page looking like every other SaaS page.',
  },
  {
    id: 'moss',
    warmHue: 140,
    coolHue: 175,
    chroma: 1.8,
    name: 'Moss',
    note: 'A green-grey that pairs with almost any accent without competing. Quiet enough to read all day.',
  },
]

/* ------------------------------------------------------------------ *
 *  Axis: typeface
 * ------------------------------------------------------------------ */

/**
 * The typefaces on offer, and what each one costs.
 *
 * `stack` is written straight into `--app-font-sans`, the live indirection
 * behind Tailwind's baked `--font-sans`. Two of the five are
 * already loaded by the root layout and one downloads nothing at all, which
 * is why the list is short: a font picker with twenty options is twenty
 * network requests in service of a preview.
 */
export interface FontChoice {
  id: string
  name: string
  note: string
  /** The value written to --app-font-sans. */
  stack: string
}

export const FONT_CHOICES: FontChoice[] = [
  {
    id: 'geist',
    name: 'Geist',
    note: 'The catalog default. A neutral grotesque that gets out of the way.',
    stack: 'var(--font-geist-sans)',
  },
  {
    id: 'system',
    name: 'System',
    note: 'Whatever the reader already has. Downloads nothing, renders instantly, and looks native on every platform.',
    stack:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  {
    id: 'grotesk',
    name: 'Space Grotesk',
    note: 'Wider apertures and a squarer eye. Reads as product rather than as platform.',
    stack: 'var(--font-space-grotesk)',
  },
  {
    id: 'serif',
    name: 'Source Serif',
    note: 'A text serif, not a display one. Turns a marketing page editorial without hurting a data table.',
    stack: 'var(--font-source-serif)',
  },
  {
    id: 'mono',
    name: 'JetBrains Mono',
    note: 'Everything monospaced. A deliberate, loud choice that suits exactly one kind of developer tool.',
    stack: 'var(--font-jetbrains-mono)',
  },
]

export function fontById(id: string): FontChoice {
  return FONT_CHOICES.find((f) => f.id === id) ?? FONT_CHOICES[0]!
}

/* ------------------------------------------------------------------ *
 *  Axis: radius
 * ------------------------------------------------------------------ */

/** Radius stops, in rem. Named, because "0.75" is not a decision anyone makes. */
export const RADIUS_STOPS: { rem: number; name: string }[] = [
  { rem: 0, name: 'Square' },
  { rem: 0.25, name: 'Slight' },
  { rem: 0.5, name: 'Soft' },
  { rem: 0.75, name: 'Default' },
  { rem: 1, name: 'Round' },
  { rem: 1.5, name: 'Pill' },
]

/* ------------------------------------------------------------------ *
 *  The whole theme
 * ------------------------------------------------------------------ */

export interface ThemeStudioValue {
  accent: BrandColor
  base: ThemeBase
  fontId: string
  radiusRem: number
}

export const DEFAULT_THEME: ThemeStudioValue = {
  accent: DEFAULT_BRAND_COLOR,
  base: DEFAULT_BASE,
  fontId: 'geist',
  radiusRem: 0.75,
}

/**
 * A named, browsable theme.
 *
 * Names are our own and describe the look, not a company. A preset called
 * after somebody else's product is a claim about that product — that this is
 * their palette, blessed by them — and it is not one we are in a position to
 * make. Describing the feeling is also more useful: "Warehouse" tells you
 * when to reach for it, and a company name only tells you who to imitate.
 */
export interface ThemePreset extends ThemeStudioValue {
  id: string
  name: string
  note: string
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'default',
    name: 'Hoverlab',
    note: 'The catalog as it ships. Emerald on warm paper, 12px corners, Geist.',
    accent: DEFAULT_BRAND_COLOR,
    base: DEFAULT_BASE,
    fontId: 'geist',
    radiusRem: 0.75,
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    note: 'No hue anywhere except the accent, and the accent is nearly grey too. For a tool that should look like an instrument rather than a brand.',
    accent: { hue: 250, chroma: 0.02, lightL: 0.35, darkL: 0.82 },
    base: { warmHue: 90, coolHue: 250, chroma: 0 },
    fontId: 'system',
    radiusRem: 0.25,
  },
  {
    id: 'terminal',
    name: 'Terminal',
    note: 'Square corners, monospaced everything, a cold grey base. The look a developer tool earns rather than borrows.',
    accent: { hue: 155, chroma: 0.16, lightL: 0.45, darkL: 0.78 },
    base: { warmHue: 250, coolHue: 250, chroma: 1.6 },
    fontId: 'mono',
    radiusRem: 0,
  },
  {
    id: 'editorial',
    name: 'Editorial',
    note: 'A text serif on warm paper with generous corners. For anything whose job is to be read rather than operated.',
    accent: { hue: 25, chroma: 0.16, lightL: 0.45, darkL: 0.72 },
    base: { warmHue: 70, coolHue: 55, chroma: 2.4 },
    fontId: 'serif',
    radiusRem: 1,
  },
  {
    id: 'console',
    name: 'Console',
    note: 'Blue-grey neutrals, tight corners, a high-chroma indigo. The dashboard default, chosen deliberately this time.',
    accent: { hue: 265, chroma: 0.2, lightL: 0.5, darkL: 0.72 },
    base: { warmHue: 250, coolHue: 250, chroma: 1.6 },
    fontId: 'geist',
    radiusRem: 0.375,
  },
  {
    id: 'storefront',
    name: 'Storefront',
    note: 'Pill corners, a warm rose accent and a sandy base — the commerce look, where the product photography carries the colour.',
    accent: { hue: 12, chroma: 0.2, lightL: 0.52, darkL: 0.72 },
    base: { warmHue: 70, coolHue: 55, chroma: 2.4 },
    fontId: 'grotesk',
    radiusRem: 1.5,
  },
  {
    id: 'clinic',
    name: 'Clinic',
    note: 'A quiet moss base under a clear blue. Built for screens that carry consequences and should not shout on any of them.',
    accent: { hue: 225, chroma: 0.14, lightL: 0.46, darkL: 0.76 },
    base: { warmHue: 140, coolHue: 175, chroma: 1.8 },
    fontId: 'system',
    radiusRem: 0.5,
  },
  {
    id: 'warehouse',
    name: 'Warehouse',
    note: 'Amber on true grey with square corners. An operations tool, where the accent has to survive being the only colour on a dense screen.',
    accent: { hue: 70, chroma: 0.17, lightL: 0.48, darkL: 0.8 },
    base: { warmHue: 90, coolHue: 250, chroma: 0 },
    fontId: 'grotesk',
    radiusRem: 0.25,
  },
]

/* ------------------------------------------------------------------ *
 *  Applying, clearing, reading back
 * ------------------------------------------------------------------ */

/** The custom properties this module owns. Nothing else writes them. */
const PROPERTIES = [
  '--brand-hue',
  '--brand-chroma',
  '--brand-light-l',
  '--brand-dark-l',
  '--base-warm-hue',
  '--base-cool-hue',
  '--base-chroma',
  '--app-font-sans',
  '--radius',
] as const

/**
 * Apply a theme to the document.
 *
 * Every value here is theme-independent by construction — see the docblock.
 * Safe to call on the server, where it is a no-op.
 */
export function applyThemeToDocument(value: ThemeStudioValue): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--brand-hue', String(value.accent.hue))
  root.style.setProperty('--brand-chroma', String(value.accent.chroma))
  root.style.setProperty('--brand-light-l', String(value.accent.lightL))
  root.style.setProperty('--brand-dark-l', String(value.accent.darkL))
  root.style.setProperty('--base-warm-hue', String(value.base.warmHue))
  root.style.setProperty('--base-cool-hue', String(value.base.coolHue))
  root.style.setProperty('--base-chroma', String(value.base.chroma))
  root.style.setProperty('--app-font-sans', fontById(value.fontId).stack)
  root.style.setProperty('--radius', `${value.radiusRem}rem`)
}

/** Remove every override, restoring the stylesheet's own values. */
export function clearThemeFromDocument(): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  for (const property of PROPERTIES) root.style.removeProperty(property)
}

/**
 * Validate an unknown value into a theme, or null if it cannot be salvaged.
 *
 * Used when reading `localStorage`, which is a place other software writes
 * and a place a half-finished migration leaves rubbish. Each axis falls back
 * on its own, so a corrupt radius does not throw away a valid accent.
 */
export function coerceTheme(raw: unknown): ThemeStudioValue | null {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, unknown>

  const accent = coerceBrandColor(v.accent) ?? DEFAULT_THEME.accent

  const rawBase = (v.base ?? {}) as Record<string, unknown>
  const base: ThemeBase = {
    warmHue:
      typeof rawBase.warmHue === 'number'
        ? normalizeHue(rawBase.warmHue)
        : DEFAULT_BASE.warmHue,
    coolHue:
      typeof rawBase.coolHue === 'number'
        ? normalizeHue(rawBase.coolHue)
        : DEFAULT_BASE.coolHue,
    chroma:
      typeof rawBase.chroma === 'number'
        ? clamp(rawBase.chroma, 0, 4)
        : DEFAULT_BASE.chroma,
  }

  const fontId =
    typeof v.fontId === 'string' && FONT_CHOICES.some((f) => f.id === v.fontId)
      ? v.fontId
      : DEFAULT_THEME.fontId

  const radiusRem =
    typeof v.radiusRem === 'number' ? clamp(v.radiusRem, 0, 2) : DEFAULT_THEME.radiusRem

  return { accent, base, fontId, radiusRem }
}

/** True when two themes are the same to the precision anyone can see. */
export function themeEquals(a: ThemeStudioValue, b: ThemeStudioValue): boolean {
  return (
    Math.abs(a.accent.hue - b.accent.hue) < 0.5 &&
    Math.abs(a.accent.chroma - b.accent.chroma) < 0.001 &&
    Math.abs(a.accent.lightL - b.accent.lightL) < 0.001 &&
    Math.abs(a.accent.darkL - b.accent.darkL) < 0.001 &&
    Math.abs(a.base.warmHue - b.base.warmHue) < 0.5 &&
    Math.abs(a.base.coolHue - b.base.coolHue) < 0.5 &&
    Math.abs(a.base.chroma - b.base.chroma) < 0.001 &&
    a.fontId === b.fontId &&
    Math.abs(a.radiusRem - b.radiusRem) < 0.001
  )
}

/** The preset a theme currently matches, if any. */
export function matchingPreset(value: ThemeStudioValue): ThemePreset | null {
  return THEME_PRESETS.find((preset) => themeEquals(preset, value)) ?? null
}

/* ------------------------------------------------------------------ *
 *  Export
 * ------------------------------------------------------------------ */

/**
 * The theme as CSS you can paste into your own `globals.css`.
 *
 * Deliberately the INPUTS, not the finished tokens. Nine declarations that
 * keep working when the derivation is improved, rather than eighty that
 * freeze today's arithmetic into somebody else's stylesheet — and if you
 * want the finished tokens, `/api/v1/dna/{id}` already serves them.
 */
export function themeCss(value: ThemeStudioValue): string {
  const font = fontById(value.fontId)
  return [
    ':root {',
    `  /* accent */`,
    `  --brand-hue: ${value.accent.hue};`,
    `  --brand-chroma: ${value.accent.chroma};`,
    `  --brand-light-l: ${value.accent.lightL};`,
    `  --brand-dark-l: ${value.accent.darkL};`,
    '',
    `  /* neutrals — warm surfaces and cool ink in light, swapped in dark */`,
    `  --base-warm-hue: ${value.base.warmHue};`,
    `  --base-cool-hue: ${value.base.coolHue};`,
    `  --base-chroma: ${value.base.chroma};`,
    '',
    `  /* type and shape */`,
    `  --app-font-sans: ${font.stack};`,
    `  --radius: ${value.radiusRem}rem;`,
    '}',
  ].join('\n')
}

/** A swatch colour for a preset chip, in the light theme. */
export function accentSwatch(accent: BrandColor): string {
  return `oklch(${accent.lightL} ${accent.chroma} ${accent.hue})`
}

/** A surface colour for a preset chip, in the light theme. */
export function baseSwatch(base: ThemeBase): string {
  return `oklch(0.96 ${0.005 * base.chroma} ${base.warmHue})`
}

/**
 * The six colours a preset's thumbnail draws itself with.
 *
 * ── WHY THIS IS NOT THE REAL DERIVATION ─────────────────────────────────
 *
 * A card showing eight themes at once cannot use the document's tokens,
 * because there is only one document and it has one theme. The obvious fix
 * is a scoped stylesheet per card that redefines the finished tokens — what
 * `components/templates/palette-scope.tsx` does — but that means copying
 * the derivation out of `globals.css` into TypeScript, where the two would
 * drift the first time either is tuned and nothing would catch it.
 *
 * So these are DELIBERATELY approximate and deliberately decorative: six
 * inline colours for a thumbnail, light theme only, using the same
 * lightnesses as the real tokens but making no claim to be them. The
 * accurate preview is the live one further down the page, which is the real
 * catalog rendered in whichever theme is actually applied.
 *
 * If you need the finished tokens as data, `/api/v1/dna/{id}` serves them.
 */
export interface ThumbnailColors {
  page: string
  card: string
  border: string
  ink: string
  muted: string
  accent: string
  onAccent: string
}

export function thumbnailColors(value: ThemeStudioValue): ThumbnailColors {
  const { base, accent } = value
  const c = (amount: number) => (amount * base.chroma).toFixed(4)
  return {
    page: `oklch(0.99 ${c(0.005)} ${base.warmHue})`,
    card: 'oklch(1 0 0)',
    border: `oklch(0.9 ${c(0.005)} ${base.coolHue})`,
    ink: `oklch(0.15 ${c(0.01)} ${base.coolHue})`,
    muted: `oklch(0.47 ${c(0.01)} ${base.coolHue})`,
    accent: accentSwatch(accent),
    onAccent: 'oklch(0.99 0 0)',
  }
}
