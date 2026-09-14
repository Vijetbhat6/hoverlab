/**
 * Permalink spec for /tools/palette.
 *
 * `?base=10b981&scheme=triadic` — and because `generatePalette` is a pure
 * function of exactly those two values, the server can render the five
 * swatches the link resolves to without a browser. That is what makes the
 * permalink a document rather than a bookmark: the colours are in the HTML.
 */

import {
  generatePalette,
  normalizeHex,
  type PaletteScheme,
} from '@/lib/color-tools'
import { hex, oneOf, type ToolPermalink } from '@/lib/tools/permalink'

export interface PaletteState {
  base: string
  scheme: PaletteScheme
}

export const PALETTE_SCHEMES: readonly PaletteScheme[] = [
  'analogous',
  'complementary',
  'triadic',
  'split-complementary',
  'tetradic',
  'monochromatic',
  'shades',
]

export const PALETTE_DEFAULTS: PaletteState = { base: '#10b981', scheme: 'analogous' }

/**
 * The five colours a state resolves to.
 *
 * Guarded with `normalizeHex` because `describe` and `swatches` both run on
 * the server against a value that came off a URL, and the page's own
 * derivation does the same guard on the way out — see the comment on
 * `base` in the tool. One unreadable hex should produce the default
 * palette, not five copies of a broken string.
 */
export function paletteColors(state: PaletteState): string[] {
  const base = normalizeHex(state.base) ?? PALETTE_DEFAULTS.base
  return generatePalette(base, state.scheme).colors
}

const SCHEME_LABEL: Record<PaletteScheme, string> = {
  analogous: 'analogous',
  complementary: 'complementary',
  triadic: 'triadic',
  'split-complementary': 'split-complementary',
  tetradic: 'tetradic',
  monochromatic: 'monochromatic',
  shades: 'shades-and-tints',
}

export const PALETTE_PERMALINK: ToolPermalink<PaletteState> = {
  href: '/tools/palette',
  defaults: PALETTE_DEFAULTS,
  fields: {
    base: { param: 'base', codec: hex },
    scheme: { param: 'scheme', codec: oneOf(PALETTE_SCHEMES) },
  },

  describe(state) {
    const base = (normalizeHex(state.base) ?? PALETTE_DEFAULTS.base).toUpperCase()
    const colors = paletteColors(state)
    const label = SCHEME_LABEL[state.scheme]
    return {
      title: `${base} ${label} palette — 5 colours — Hoverlab`,
      description: `A ${label} palette built from ${base}: ${colors
        .map((c) => c.toUpperCase())
        .join(', ')}. Copy it as CSS custom properties, a Tailwind theme, JSON or an .ase swatch file, or open it in the generator and retune the base.`,
    }
  },

  swatches: paletteColors,

  /*
    Twelve starting points rather than twelve finished palettes. Each is a
    base colour people search for by name plus the harmony that flatters it,
    so the link lands on something worth keeping rather than on a
    demonstration of the control.
  */
  gallery: [
    {
      slug: 'emerald-analogous',
      name: 'Emerald, analogous',
      note: 'The catalog default. Five neighbours of #10B981 — the safest harmony there is.',
      state: { base: '#10b981', scheme: 'analogous' },
    },
    {
      slug: 'indigo-triadic',
      name: 'Indigo, triadic',
      note: 'Three-way split off #6366F1. Enough separation for a chart series.',
      state: { base: '#6366f1', scheme: 'triadic' },
    },
    {
      slug: 'rose-complementary',
      name: 'Rose, complementary',
      note: 'One accent and its opposite. What a two-colour brand actually needs.',
      state: { base: '#f43f5e', scheme: 'complementary' },
    },
    {
      slug: 'amber-analogous',
      name: 'Amber, analogous',
      note: 'Warm run from #F59E0B through orange. Reads as one family at a glance.',
      state: { base: '#f59e0b', scheme: 'analogous' },
    },
    {
      slug: 'sky-monochromatic',
      name: 'Sky, monochromatic',
      note: 'One hue at five lightnesses — the shape a UI scale wants.',
      state: { base: '#0ea5e9', scheme: 'monochromatic' },
    },
    {
      slug: 'violet-split-complementary',
      name: 'Violet, split-complementary',
      note: 'The complement, softened. Contrast without the collision.',
      state: { base: '#8b5cf6', scheme: 'split-complementary' },
    },
    {
      slug: 'teal-tetradic',
      name: 'Teal, tetradic',
      note: 'Two complementary pairs. The widest spread here, and the hardest to balance.',
      state: { base: '#14b8a6', scheme: 'tetradic' },
    },
    {
      slug: 'slate-shades',
      name: 'Slate, shades and tints',
      note: 'A neutral ramp off #64748B — borders, surfaces and muted text in one go.',
      state: { base: '#64748b', scheme: 'shades' },
    },
    {
      slug: 'crimson-triadic',
      name: 'Crimson, triadic',
      note: 'Hot base, evenly spaced. Loud on purpose.',
      state: { base: '#dc2626', scheme: 'triadic' },
    },
    {
      slug: 'lime-complementary',
      name: 'Lime, complementary',
      note: '#84CC16 against its opposite — the pairing that makes a highlight read as one.',
      state: { base: '#84cc16', scheme: 'complementary' },
    },
    {
      slug: 'fuchsia-analogous',
      name: 'Fuchsia, analogous',
      note: 'Pink through purple. The gradient-era palette, as five flat swatches.',
      state: { base: '#d946ef', scheme: 'analogous' },
    },
    {
      slug: 'navy-monochromatic',
      name: 'Navy, monochromatic',
      note: 'A single deep blue, laddered. What a dark-mode surface stack is made of.',
      state: { base: '#1e3a8a', scheme: 'monochromatic' },
    },
  ],
}
