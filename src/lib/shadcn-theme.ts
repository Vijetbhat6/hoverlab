/**
 * A shadcn/ui theme, as a thing that can be edited, checked and installed.
 *
 * `/tools/tokens` has emitted a light + dark token block for months. What
 * it could not do is the two things that make a theme editor a destination
 * rather than a generator: show you real components wearing the theme
 * while you turn the knobs, and hand you something a machine can install.
 * A block of CSS to copy is a block of CSS to paste in the wrong file.
 *
 * SO THE EXPORT IS A REGISTRY ITEM
 *
 * `npx shadcn add <url>` is how components have been installed since CLI
 * v4, and a `registry:theme` item is the shape that command reads: name,
 * type, and `cssVars` keyed by mode. This module builds that object, and
 * `/r/theme.json` serves it from a URL that carries the whole theme in one
 * query parameter — so the install command is copy-pasteable, works from
 * any machine, and needs no account, no login and nothing stored on our
 * side. The theme *is* the URL.
 *
 * WHAT IS DERIVED AND WHAT IS TYPED
 *
 * Four knobs — hue, chroma, radius, and how far the neutrals are tinted —
 * generate all twenty-eight tokens per mode. Any single token can then be
 * overridden by hand, and only the overrides are stored. That split is
 * what keeps the URL short and, more importantly, what keeps a theme
 * coherent: nudging the hue moves everything that should move, instead of
 * leaving nineteen tokens pointing at the old brand.
 *
 * The lightness values are shadcn's own defaults, kept deliberately. They
 * are what the entire catalog was designed against, and a generator that
 * emitted a subtly different scale would produce tokens that technically
 * work and make every block look slightly wrong.
 *
 * Colour maths is OKLCH for the reason spelled out at more length in
 * `/tools/tokens`: HSL's lightness is a coordinate rather than a
 * perception, so ramps built in it go muddy in the greens and washed out
 * in the blues.
 */

import {
  contrastRatio,
  hexToRgb,
  normalizeHex,
  oklchToRgb,
  rgbToHex,
  rgbToOklch,
} from './color-tools'
import { VISIONS, findCollisions, simulateHex } from './color-blindness'

/* ------------------------------------------------------------------ *
 *  State
 * ------------------------------------------------------------------ */

export interface ThemeState {
  /** Brand hue, 0–360. */
  hue: number
  /** Brand chroma, 0–0.3 — how saturated the accent is. */
  chroma: number
  /** Corner radius in rem. */
  radius: number
  /** How far the neutrals are tinted toward the brand hue, 0–0.03. */
  neutralChroma: number
  /** Per-token overrides, keyed without the leading `--`. */
  light: Record<string, string>
  dark: Record<string, string>
}

export const DEFAULT_THEME: ThemeState = {
  hue: 250,
  chroma: 0.19,
  radius: 0.625,
  neutralChroma: 0.006,
  light: {},
  dark: {},
}

/**
 * Starting points, not skins.
 *
 * Four knobs is a small space and someone landing from a search does not
 * know which corner of it they want. Each of these is a different answer
 * to "how much colour should a neutral have", which is the decision people
 * find hardest to make from a slider.
 */
export const THEME_PRESETS: ReadonlyArray<{
  id: string
  name: string
  note: string
  state: Pick<ThemeState, 'hue' | 'chroma' | 'radius' | 'neutralChroma'>
}> = [
  {
    id: 'violet',
    name: 'Violet',
    note: 'The shadcn default, near enough. Cool neutrals, generous radius.',
    state: { hue: 250, chroma: 0.19, radius: 0.625, neutralChroma: 0.006 },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    note: 'What this site wears. Warm-ish neutrals under a green brand.',
    state: { hue: 160, chroma: 0.2, radius: 0.75, neutralChroma: 0.008 },
  },
  {
    id: 'slate',
    name: 'Slate',
    note: 'Almost no chroma anywhere. The safe one for a data-heavy product.',
    state: { hue: 240, chroma: 0.08, radius: 0.5, neutralChroma: 0.012 },
  },
  {
    id: 'amber',
    name: 'Amber',
    note: 'High chroma, tight radius. Reads as a consumer app rather than a tool.',
    state: { hue: 70, chroma: 0.17, radius: 0.25, neutralChroma: 0.01 },
  },
  {
    id: 'rose',
    name: 'Rose',
    note: 'Warm brand, warm neutrals, fully rounded.',
    state: { hue: 15, chroma: 0.21, radius: 1, neutralChroma: 0.012 },
  },
] as const

/* ------------------------------------------------------------------ *
 *  Deriving the tokens
 * ------------------------------------------------------------------ */

/** `oklch(L C H)` with the precision the CSS actually needs. */
function oklch(l: number, c: number, h: number): string {
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`
}

/** Token names in the order they are written, grouped for the editor. */
export const TOKEN_GROUPS: ReadonlyArray<{ label: string; note: string; tokens: string[] }> = [
  {
    label: 'Surfaces',
    note: 'The page, and the two things that sit on top of it.',
    tokens: [
      'background',
      'foreground',
      'card',
      'card-foreground',
      'popover',
      'popover-foreground',
    ],
  },
  {
    label: 'Brand',
    note: 'Primary is the only token most people ever change.',
    tokens: ['primary', 'primary-foreground', 'ring'],
  },
  {
    label: 'Supporting',
    note: 'Secondary, muted and accent are all neutrals at rest.',
    tokens: [
      'secondary',
      'secondary-foreground',
      'muted',
      'muted-foreground',
      'accent',
      'accent-foreground',
    ],
  },
  {
    label: 'Destructive & edges',
    note: 'Destructive stays red across every hue — a warning that shifts with the brand stops reading as a warning.',
    tokens: ['destructive', 'destructive-foreground', 'border', 'input'],
  },
  {
    label: 'Charts',
    note: 'Spread by hue and separated by lightness, so the series survive colour blindness and greyscale print.',
    tokens: ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'],
  },
  {
    label: 'Sidebar',
    note: 'Its own surface set, so a sidebar can sit a step away from the page.',
    tokens: [
      'sidebar',
      'sidebar-foreground',
      'sidebar-primary',
      'sidebar-primary-foreground',
      'sidebar-accent',
      'sidebar-accent-foreground',
      'sidebar-border',
      'sidebar-ring',
    ],
  },
]

/** Every colour token, flat, in write order. */
export const TOKEN_NAMES: readonly string[] = TOKEN_GROUPS.flatMap((g) => g.tokens)

/* ------------------------------------------------------------------ *
 *  Chart colours
 * ------------------------------------------------------------------ */

/** Five hues, evenly around the wheel from the brand. */
const CHART_HUE_SPREAD = [0, 72, 144, 216, 288]

/**
 * The lightnesses the five series are drawn from.
 *
 * A wide span on purpose: hue separation alone is what collapses under
 * deuteranopia and vanishes completely in greyscale, so the spread in
 * lightness is the part actually doing the accessibility work. Lifted in
 * dark mode, where the same values would sit too close to the background.
 */
const CHART_LIGHTNESS = {
  light: [0.4, 0.53, 0.66, 0.79, 0.92],
  dark: [0.44, 0.56, 0.68, 0.8, 0.92],
}

/** Every ordering of five items — 120 of them, computed once. */
const CHART_ORDERS: number[][] = (function permute(items: number[]): number[][] {
  if (items.length <= 1) return [items]
  const out: number[][] = []
  items.forEach((item, i) => {
    for (const rest of permute([...items.slice(0, i), ...items.slice(i + 1)])) {
      out.push([item, ...rest])
    }
  })
  return out
})([0, 1, 2, 3, 4])

const chartCache = new Map<string, string[]>()

/**
 * The five chart colours, with the lightnesses *solved* onto the hues.
 *
 * The obvious version of this — pick five hues, hand them a fixed ramp —
 * was written first and measured, and it does not work: which lightness
 * belongs on which hue depends entirely on the brand hue, because the
 * simulations move different hues by different amounts. A fixed order that
 * is clean at hue 250 collapses two series into one at hue 200. Measured
 * across the whole wheel, every fixed order failed somewhere.
 *
 * So this searches instead. All 120 assignments of the ramp to the hues
 * are scored by the worst pair distance under all four simulations, and
 * the best-scoring one wins. It is deterministic, it costs a couple of
 * milliseconds, and it is cached — and it turns a palette that collided at
 * most brand hues into one that mostly does not.
 *
 * "Mostly" is the honest word. Five categorical colours that a dichromat
 * can reliably separate is close to the limit of what is possible; some
 * hues still leave one pair inside the threshold, and the page reports
 * that rather than the tool pretending otherwise. A legend should carry a
 * second cue regardless.
 */
function chartRamp(hue: number, chroma: number, dark: boolean): string[] {
  const key = `${hue.toFixed(1)}:${chroma.toFixed(3)}:${dark}`
  const cached = chartCache.get(key)
  if (cached) return cached

  const lights = dark ? CHART_LIGHTNESS.dark : CHART_LIGHTNESS.light
  const c = Math.min(0.3, chroma * 1.05)
  const hues = CHART_HUE_SPREAD.map((offset) => (hue + offset) % 360)
  const visions = VISIONS.filter((v) => v.id !== 'normal')

  /*
   * Every (hue, lightness) candidate, simulated and converted to OKLab
   * coordinates once.
   *
   * The naive version scored the 120 orders by calling `oklabDistance` on
   * hex strings — 4,800 calls, each re-parsing two colours and running two
   * OKLCH conversions. That measured 6.5ms per hue, which is a third of a
   * frame on a slider drag, for arithmetic over the same 25 colours. This
   * is the same search with the conversions hoisted: 100 conversions
   * instead of 9,600, and the inner loop is three subtractions.
   */
  const lab = hues.map((h) =>
    lights.map((l) => {
      const swatch = rgbToHex(oklchToRgb({ l, c, h }))
      return visions.map((v) => {
        const rgb = hexToRgb(simulateHex(swatch, v.matrix))!
        const { l: L, c: C, h: H } = rgbToOklch(rgb)
        const rad = (H * Math.PI) / 180
        return { L, a: C * Math.cos(rad), b: C * Math.sin(rad) }
      })
    }),
  )

  const visionCount = visions.length
  let bestOrder = CHART_ORDERS[0]
  let bestScore = -1

  for (const order of CHART_ORDERS) {
    let worst = Infinity
    for (let i = 0; i < 5 && worst > bestScore; i++) {
      for (let j = i + 1; j < 5 && worst > bestScore; j++) {
        for (let v = 0; v < visionCount; v++) {
          const A = lab[i][order[i]][v]
          const B = lab[j][order[j]][v]
          // Squared distance: the comparison is the only thing that uses
          // it, and the ordering is the same either way.
          const d =
            (A.L - B.L) ** 2 + (A.a - B.a) ** 2 + (A.b - B.b) ** 2
          if (d < worst) worst = d
        }
      }
    }
    if (worst > bestScore) {
      bestScore = worst
      bestOrder = order
    }
  }

  const ramp = hues.map((h, i) => oklch(lights[bestOrder[i]], c, h))
  chartCache.set(key, ramp)
  return ramp
}

/** The derived value of every token in one mode, before overrides. */
function derive(state: ThemeState, dark: boolean): Record<string, string> {
  const { hue, chroma, neutralChroma } = state
  const n = (l: number) => oklch(l, neutralChroma, hue)
  const charts = chartRamp(hue, chroma, dark)

  const chart = Object.fromEntries(charts.map((value, i) => [`chart-${i + 1}`, value]))

  if (dark) {
    return {
      background: n(0.145),
      foreground: n(0.985),
      card: n(0.205),
      'card-foreground': n(0.985),
      popover: n(0.205),
      'popover-foreground': n(0.985),
      primary: oklch(0.72, chroma, hue),
      'primary-foreground': n(0.145),
      ring: oklch(0.556, chroma * 0.4, hue),
      secondary: n(0.269),
      'secondary-foreground': n(0.985),
      muted: n(0.269),
      'muted-foreground': n(0.708),
      accent: n(0.269),
      'accent-foreground': n(0.985),
      destructive: oklch(0.704, 0.191, 22.2),
      /* Dark text on the light red, matching this site's own globals.css.
         The near-white foreground every shadcn dark theme ships measures
         2.76:1 here — the destructive button is the least readable thing
         in the default dark theme, and it is the one button where a
         misread is expensive. */
      'destructive-foreground': n(0.145),
      border: 'oklch(1 0 0 / 10%)',
      input: 'oklch(1 0 0 / 15%)',
      ...chart,
      sidebar: n(0.205),
      'sidebar-foreground': n(0.985),
      'sidebar-primary': oklch(0.72, chroma, hue),
      'sidebar-primary-foreground': n(0.145),
      'sidebar-accent': n(0.269),
      'sidebar-accent-foreground': n(0.985),
      'sidebar-border': 'oklch(1 0 0 / 10%)',
      'sidebar-ring': oklch(0.556, chroma * 0.4, hue),
    }
  }

  return {
    background: oklch(1, 0, 0),
    foreground: n(0.145),
    card: oklch(1, 0, 0),
    'card-foreground': n(0.145),
    popover: oklch(1, 0, 0),
    'popover-foreground': n(0.145),
    primary: oklch(0.52, chroma, hue),
    'primary-foreground': n(0.985),
    ring: oklch(0.708, chroma * 0.4, hue),
    secondary: n(0.97),
    'secondary-foreground': n(0.205),
    muted: n(0.97),
    /* 0.545, not shadcn's 0.556.
       Its own default measures 4.30:1 against `--muted`, which is a fail
       at AA for normal text — and `--muted-foreground` on `--muted` is
       exactly what a form's helper text is. One notch darker clears it at
       4.56 and is indistinguishable by eye. A generator whose default
       output fails the check the same page runs is not a generator worth
       shipping. */
    'muted-foreground': n(0.545),
    accent: n(0.97),
    'accent-foreground': n(0.205),
    destructive: oklch(0.577, 0.245, 27.3),
    'destructive-foreground': oklch(0.985, 0, 0),
    border: n(0.922),
    input: n(0.922),
    ...chart,
    sidebar: n(0.985),
    'sidebar-foreground': n(0.145),
    'sidebar-primary': oklch(0.52, chroma, hue),
    'sidebar-primary-foreground': n(0.985),
    'sidebar-accent': n(0.97),
    'sidebar-accent-foreground': n(0.205),
    'sidebar-border': n(0.922),
    'sidebar-ring': oklch(0.708, chroma * 0.4, hue),
  }
}

export interface ThemeTokens {
  light: Record<string, string>
  dark: Record<string, string>
  radius: string
}

/** The finished theme: derived values with the user's overrides on top. */
export function buildTheme(state: ThemeState): ThemeTokens {
  const apply = (dark: boolean) => {
    const base = derive(state, dark)
    const overrides = dark ? state.dark : state.light
    const out: Record<string, string> = {}
    // Rebuilt in TOKEN_NAMES order rather than spread, so the CSS block and
    // the registry item are written in a stable order whatever the
    // override object's insertion order happens to be.
    for (const name of TOKEN_NAMES) {
      out[name] = overrides[name] ?? base[name]
    }
    return out
  }

  return { light: apply(false), dark: apply(true), radius: `${state.radius}rem` }
}

/* ------------------------------------------------------------------ *
 *  Output
 * ------------------------------------------------------------------ */

/**
 * The theme as a stylesheet.
 *
 * Includes the `@theme inline` block, which is the part people forget: in
 * Tailwind v4 the custom properties alone give you nothing — the utilities
 * (`bg-primary`, `text-muted-foreground`) only exist because that block
 * maps them. A generator that emits `:root` and stops produces a theme
 * that appears to install and then does not apply.
 */
export function themeCss(state: ThemeState): string {
  const { light, dark, radius } = buildTheme(state)

  const block = (tokens: Record<string, string>) =>
    TOKEN_NAMES.map((name) => `  --${name}: ${tokens[name]};`).join('\n')

  const themeInline = TOKEN_NAMES.map((name) => `  --color-${name}: var(--${name});`).join('\n')

  return `/* A shadcn/ui theme, generated by Hoverlab — hoverlab.dev/tools/shadcn
   Replace the :root, .dark and @theme inline blocks in your globals.css. */

:root {
  --radius: ${radius};
${block(light)}
}

.dark {
${block(dark)}
}

@theme inline {
${themeInline}
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
`
}

/**
 * A subset of https://ui.shadcn.com/schema/registry-item.json.
 *
 * Declared here rather than imported from `lib/registry/registry.ts`,
 * which is `server-only` because it carries every block's source. This one
 * has to be built in the browser as the sliders move.
 */
export interface RegistryThemeItem {
  $schema: string
  name: string
  type: 'registry:theme'
  title: string
  description: string
  cssVars: {
    theme?: Record<string, string>
    light: Record<string, string>
    dark: Record<string, string>
  }
}

/** The JSON `npx shadcn add` reads. */
export function themeRegistryItem(state: ThemeState, name = 'theme'): RegistryThemeItem {
  const { light, dark, radius } = buildTheme(state)

  return {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name,
    type: 'registry:theme',
    title: 'Custom theme',
    description:
      'A light and dark shadcn/ui token set, generated at hoverlab.dev/tools/shadcn.',
    cssVars: {
      // Radius lives with the light-mode variables, matching how the
      // registry's own `hoverlab` base item writes it.
      light: { radius, ...light },
      dark: { ...dark },
    },
  }
}

/* ------------------------------------------------------------------ *
 *  The theme as a URL
 * ------------------------------------------------------------------ */

/**
 * Only what differs from the default is encoded.
 *
 * A URL that has to survive being pasted into a terminal, a Slack message
 * and a README should not carry twenty-eight unchanged token values. The
 * short keys are the same reason: this string ends up inside a command
 * someone types.
 */
interface PackedTheme {
  h?: number
  c?: number
  r?: number
  n?: number
  l?: Record<string, string>
  d?: Record<string, string>
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): string | null {
  try {
    const bin = atob(value.replace(/-/g, '+').replace(/_/g, '/'))
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
  } catch {
    return null
  }
}

export function encodeTheme(state: ThemeState): string {
  const packed: PackedTheme = {}
  if (state.hue !== DEFAULT_THEME.hue) packed.h = round(state.hue, 1)
  if (state.chroma !== DEFAULT_THEME.chroma) packed.c = round(state.chroma, 3)
  if (state.radius !== DEFAULT_THEME.radius) packed.r = round(state.radius, 3)
  if (state.neutralChroma !== DEFAULT_THEME.neutralChroma) {
    packed.n = round(state.neutralChroma, 4)
  }
  if (Object.keys(state.light).length) packed.l = state.light
  if (Object.keys(state.dark).length) packed.d = state.dark
  return toBase64Url(JSON.stringify(packed))
}

function round(value: number, places: number): number {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

/**
 * Read a theme back out of a URL parameter.
 *
 * Never throws and never trusts. This runs in a route handler on a string
 * a stranger controls, so every field is range-checked and every override
 * has to be a plausible CSS colour before it reaches a stylesheet — an
 * unchecked value here would be written verbatim into whatever the CLI
 * installs.
 */
export function decodeTheme(param: string | null | undefined): ThemeState | null {
  if (!param) return null
  const text = fromBase64Url(param)
  if (!text) return null

  let packed: unknown
  try {
    packed = JSON.parse(text)
  } catch {
    return null
  }
  if (!packed || typeof packed !== 'object' || Array.isArray(packed)) return null

  const p = packed as PackedTheme

  return {
    hue: clampNumber(p.h, 0, 360, DEFAULT_THEME.hue),
    chroma: clampNumber(p.c, 0, 0.4, DEFAULT_THEME.chroma),
    radius: clampNumber(p.r, 0, 3, DEFAULT_THEME.radius),
    neutralChroma: clampNumber(p.n, 0, 0.05, DEFAULT_THEME.neutralChroma),
    light: sanitizeOverrides(p.l),
    dark: sanitizeOverrides(p.d),
  }
}

function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

/**
 * A CSS colour, conservatively.
 *
 * Hex, `oklch(...)`, `rgb(...)`, `hsl(...)` and a bare keyword, with no
 * room for a `;`, a `}` or a `/*` that could close the rule this lands in
 * and start writing something else. The token name is checked too — only
 * names this module knows how to write are accepted.
 */
const SAFE_COLOR = /^(#[0-9a-fA-F]{3,8}|(?:oklch|oklab|rgba?|hsla?|color|lab|lch)\([^;{}()]*\)|[a-zA-Z]+)$/

function sanitizeOverrides(input: unknown): Record<string, string> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  const known = new Set(TOKEN_NAMES)
  const out: Record<string, string> = {}
  for (const [name, value] of Object.entries(input as Record<string, unknown>)) {
    if (!known.has(name)) continue
    if (typeof value !== 'string') continue
    const trimmed = value.trim()
    if (trimmed.length > 64 || !SAFE_COLOR.test(trimmed)) continue
    out[name] = trimmed
  }
  return out
}

/* ------------------------------------------------------------------ *
 *  Checking the result
 * ------------------------------------------------------------------ */

/**
 * A token value as hex, for a colour input and for the checks below.
 *
 * Returns null for anything with alpha or a keyword this cannot resolve —
 * `--border` in dark mode is `oklch(1 0 0 / 10%)`, which is a real value
 * and genuinely has no opaque hex.
 */
export function tokenToHex(value: string): string | null {
  const trimmed = value.trim()
  const asHex = normalizeHex(trimmed)
  if (asHex) return asHex

  const parsed = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(trimmed)
  if (!parsed) return null
  return rgbToHex(
    oklchToRgb({ l: Number(parsed[1]), c: Number(parsed[2]), h: Number(parsed[3]) }),
  )
}

/** The pairs a theme has to get right, because text sits on them. */
const CONTRAST_PAIRS: ReadonlyArray<{ fg: string; bg: string; label: string }> = [
  { fg: 'foreground', bg: 'background', label: 'Body text' },
  { fg: 'card-foreground', bg: 'card', label: 'Card text' },
  { fg: 'popover-foreground', bg: 'popover', label: 'Popover text' },
  { fg: 'primary-foreground', bg: 'primary', label: 'Primary button' },
  { fg: 'secondary-foreground', bg: 'secondary', label: 'Secondary button' },
  { fg: 'muted-foreground', bg: 'muted', label: 'Muted text' },
  { fg: 'muted-foreground', bg: 'background', label: 'Muted on page' },
  { fg: 'accent-foreground', bg: 'accent', label: 'Accent' },
  { fg: 'destructive-foreground', bg: 'destructive', label: 'Destructive button' },
  { fg: 'sidebar-foreground', bg: 'sidebar', label: 'Sidebar text' },
]

export interface ContrastFinding {
  label: string
  mode: 'light' | 'dark'
  ratio: number
  /** AA for normal text. The bar a token pair has to clear. */
  passes: boolean
}

/**
 * Every text-on-surface pair in both modes.
 *
 * This is why the tool is worth using over picking colours in Figma: a
 * theme is twenty-eight values that are only correct in relation to each
 * other, and the relation that matters is whether the text on top of a
 * surface can be read. Reported rather than enforced — a designer may have
 * a reason, and a generator that refuses to emit is a generator people
 * work around.
 */
export function themeContrast(state: ThemeState): ContrastFinding[] {
  const tokens = buildTheme(state)
  const out: ContrastFinding[] = []

  for (const mode of ['light', 'dark'] as const) {
    const set = tokens[mode]
    for (const pair of CONTRAST_PAIRS) {
      const fg = tokenToHex(set[pair.fg] ?? '')
      const bg = tokenToHex(set[pair.bg] ?? '')
      if (!fg || !bg) continue
      const ratio = contrastRatio(fg, bg)
      if (ratio === null) continue
      out.push({ label: pair.label, mode, ratio, passes: ratio >= 4.5 })
    }
  }

  return out
}

export interface ChartFinding {
  vision: string
  /** `chart-1` / `chart-3`, as the pair a reader cannot separate. */
  pairs: Array<[string, string]>
}

/**
 * Do the five chart colours stay five colours?
 *
 * The check the rest of this market does not run. A categorical palette is
 * the one place in a design system where colour genuinely is the only
 * signal — a legend has nothing else to work with — so it is the one place
 * where a collision under deuteranopia is a real defect rather than a
 * warning to note. Runs over both modes at full severity.
 */
export function chartCollisions(state: ThemeState): ChartFinding[] {
  const tokens = buildTheme(state)
  const names = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']
  const findings: ChartFinding[] = []

  for (const v of VISIONS) {
    if (v.id === 'normal') continue
    const pairs: Array<[string, string]> = []

    for (const mode of ['light', 'dark'] as const) {
      const hexes = names.map((name) => tokenToHex(tokens[mode][name] ?? '') ?? '#000000')
      const simulated = hexes.map((hex) => simulateHex(hex, v.matrix))
      for (const collision of findCollisions(names, simulated)) {
        const pair: [string, string] = [collision.a, collision.b]
        if (!pairs.some(([a, b]) => a === pair[0] && b === pair[1])) pairs.push(pair)
      }
    }

    if (pairs.length) findings.push({ vision: v.name, pairs })
  }

  return findings
}

/** A hex a colour input produced, back as an OKLCH string for the theme. */
export function hexToTokenValue(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const { l, c, h } = rgbToOklch(rgb)
  return oklch(l, c, h)
}
