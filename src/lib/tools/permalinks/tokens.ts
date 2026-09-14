/**
 * Permalink spec for /tools/tokens — the shadcn/Tailwind token generator.
 *
 * `?hue=250&chroma=0.19&radius=0.625`
 *
 * Four numbers, and the whole theme falls out of them. That makes this the
 * tool whose permalink is most obviously worth having: a theme used to be
 * describable only as a 600-character base64 blob, and it is actually three
 * numbers a person can read, compare and hand-edit.
 *
 * `buildScheme` moved here from the page rather than being reimplemented,
 * because the server now needs it too — the gallery card and the meta
 * description both quote real token values. Two copies of the lightness
 * ladder is exactly how a "generator" starts emitting tokens that are
 * subtly not the ones the catalog was designed against.
 */

import { num, type ToolPermalink } from '@/lib/tools/permalink'

export interface TokenState {
  /** Brand hue, 0–360. */
  hue: number
  /** Brand chroma, 0–0.3 — how saturated the accent is. */
  chroma: number
  /** Corner radius in rem. */
  radius: number
  /** How far the neutrals are tinted toward the brand hue, 0–0.03. */
  neutralChroma: number
}

export const TOKEN_DEFAULTS: TokenState = {
  hue: 250,
  chroma: 0.19,
  radius: 0.625,
  neutralChroma: 0.006,
}

/** `oklch(L C H)` with the precision the CSS actually needs. */
export function oklch(l: number, c: number, h: number): string {
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`
}

export interface Scheme {
  label: string
  tokens: Array<{ name: string; value: string; swatch: boolean }>
}

/**
 * Build one scheme's token list.
 *
 * The lightness values are the shadcn defaults, kept deliberately: they are
 * what the whole catalog was designed against, and a "generator" that emits
 * a subtly different scale would produce tokens that technically work and
 * make every block look slightly wrong.
 */
export function buildScheme(state: TokenState, dark: boolean): Scheme {
  const { hue, chroma, radius, neutralChroma } = state
  const n = (l: number) => oklch(l, neutralChroma, hue)

  const tokens = dark
    ? [
        { name: '--background', value: n(0.145), swatch: true },
        { name: '--foreground', value: n(0.985), swatch: true },
        { name: '--card', value: n(0.205), swatch: true },
        { name: '--card-foreground', value: n(0.985), swatch: true },
        { name: '--popover', value: n(0.205), swatch: true },
        { name: '--popover-foreground', value: n(0.985), swatch: true },
        { name: '--primary', value: oklch(0.72, chroma, hue), swatch: true },
        { name: '--primary-foreground', value: n(0.145), swatch: true },
        { name: '--secondary', value: n(0.269), swatch: true },
        { name: '--secondary-foreground', value: n(0.985), swatch: true },
        { name: '--muted', value: n(0.269), swatch: true },
        { name: '--muted-foreground', value: n(0.708), swatch: true },
        { name: '--accent', value: n(0.269), swatch: true },
        { name: '--accent-foreground', value: n(0.985), swatch: true },
        { name: '--destructive', value: oklch(0.704, 0.191, 22.2), swatch: true },
        { name: '--border', value: 'oklch(1 0 0 / 10%)', swatch: false },
        { name: '--input', value: 'oklch(1 0 0 / 15%)', swatch: false },
        { name: '--ring', value: oklch(0.556, chroma * 0.4, hue), swatch: true },
      ]
    : [
        { name: '--background', value: oklch(1, 0, 0), swatch: true },
        { name: '--foreground', value: n(0.145), swatch: true },
        { name: '--card', value: oklch(1, 0, 0), swatch: true },
        { name: '--card-foreground', value: n(0.145), swatch: true },
        { name: '--popover', value: oklch(1, 0, 0), swatch: true },
        { name: '--popover-foreground', value: n(0.145), swatch: true },
        { name: '--primary', value: oklch(0.52, chroma, hue), swatch: true },
        { name: '--primary-foreground', value: n(0.985), swatch: true },
        { name: '--secondary', value: n(0.97), swatch: true },
        { name: '--secondary-foreground', value: n(0.205), swatch: true },
        { name: '--muted', value: n(0.97), swatch: true },
        { name: '--muted-foreground', value: n(0.556), swatch: true },
        { name: '--accent', value: n(0.97), swatch: true },
        { name: '--accent-foreground', value: n(0.205), swatch: true },
        { name: '--destructive', value: oklch(0.577, 0.245, 27.3), swatch: true },
        { name: '--border', value: n(0.922), swatch: true },
        { name: '--input', value: n(0.922), swatch: true },
        { name: '--ring', value: oklch(0.708, chroma * 0.4, hue), swatch: true },
      ]

  if (!dark) tokens.unshift({ name: '--radius', value: `${radius}rem`, swatch: false })

  return { label: dark ? 'Dark' : 'Light', tokens }
}

/**
 * The colour name an OKLCH hue reads as.
 *
 * Approximate on purpose — it exists so a <title> can say "violet" instead
 * of "hue 280", which is the difference between a result somebody clicks
 * and one they scroll past. Nothing depends on it being exact.
 */
export function hueName(hue: number): string {
  const h = ((hue % 360) + 360) % 360
  const names: Array<[number, string]> = [
    [15, 'red'],
    [45, 'orange'],
    [75, 'amber'],
    [110, 'lime'],
    [150, 'green'],
    [175, 'emerald'],
    [195, 'teal'],
    [220, 'cyan'],
    [245, 'blue'],
    [275, 'indigo'],
    [300, 'violet'],
    [325, 'fuchsia'],
    [345, 'pink'],
    [360, 'red'],
  ]
  return names.find(([max]) => h < max)?.[1] ?? 'red'
}

/** Five representative token values, read off the scheme itself. */
export function tokenSwatches(state: TokenState): string[] {
  const light = buildScheme(state, false)
  const value = (name: string) => light.tokens.find((t) => t.name === name)?.value ?? ''
  return [
    value('--primary'),
    value('--ring'),
    value('--secondary'),
    value('--border'),
    value('--foreground'),
  ].filter(Boolean)
}

export const TOKENS_PERMALINK: ToolPermalink<TokenState> = {
  href: '/tools/tokens',
  defaults: TOKEN_DEFAULTS,
  fields: {
    hue: { param: 'hue', codec: num(0, 360, 1) },
    chroma: { param: 'chroma', codec: num(0, 0.3, 3) },
    radius: { param: 'radius', codec: num(0, 2, 3) },
    neutralChroma: { param: 'neutral', codec: num(0, 0.03, 3) },
  },

  describe(state) {
    const name = hueName(state.hue)
    const light = buildScheme(state, false)
    const primary = light.tokens.find((t) => t.name === '--primary')?.value ?? ''
    const tinted = state.neutralChroma > 0.002 ? ', neutrals tinted toward the brand' : ''
    return {
      title: `${name} shadcn theme — hue ${state.hue}, radius ${state.radius}rem — Hoverlab`,
      description: `A complete shadcn/Tailwind token set built on ${primary}${tinted}, with a ${state.radius}rem radius and matching light and dark scales. Every block in the catalog is styled against these names, so pasting them themes all of it at once.`,
    }
  },

  swatches: tokenSwatches,

  /*
    The eight themes worth linking to, chosen so the set spans the two
    decisions people actually make here — how saturated the accent is, and
    how round the corners are — rather than eight points around the hue
    wheel.
  */
  gallery: [
    {
      slug: 'indigo-default',
      name: 'Indigo, 0.625rem',
      note: 'The shadcn default, which is what the catalog is designed against.',
      state: {},
    },
    {
      slug: 'emerald-soft',
      name: 'Emerald, soft corners',
      note: 'Hue 165 at a full 1rem radius. Friendly without being a toy.',
      state: { hue: 165, chroma: 0.17, radius: 1 },
    },
    {
      slug: 'slate-square',
      name: 'Near-neutral, square',
      note: 'Almost no chroma and a 0 radius. The enterprise setting, and a fair test of whether a layout works without colour.',
      state: { hue: 240, chroma: 0.05, radius: 0, neutralChroma: 0 },
    },
    {
      slug: 'rose-warm',
      name: 'Rose, warm neutrals',
      note: 'Hue 10 with the greys pulled toward it. The tint is subtle and it is the whole difference between a theme and a swapped accent.',
      state: { hue: 10, chroma: 0.2, radius: 0.75, neutralChroma: 0.012 },
    },
    {
      slug: 'amber-editorial',
      name: 'Amber, tight radius',
      note: 'A warm accent at 0.25rem — print-adjacent, and the corners stay out of the way.',
      state: { hue: 70, chroma: 0.16, radius: 0.25, neutralChroma: 0.01 },
    },
    {
      slug: 'cyan-vivid',
      name: 'Cyan, maximum chroma',
      note: 'Chroma pushed to 0.26. Shows where OKLCH starts clipping out of the sRGB gamut.',
      state: { hue: 210, chroma: 0.26, radius: 0.5 },
    },
    {
      slug: 'violet-pill',
      name: 'Violet, pill corners',
      note: 'A 1.5rem radius makes every button a pill. Consumer, playful, and hard to undo later.',
      state: { hue: 290, chroma: 0.2, radius: 1.5, neutralChroma: 0.008 },
    },
    {
      slug: 'forest-cool',
      name: 'Forest, cool neutrals',
      note: 'A deep green accent with greys tinted the same way — the most "designed" theme in the set.',
      state: { hue: 150, chroma: 0.13, radius: 0.5, neutralChroma: 0.014 },
    },
  ],
}
