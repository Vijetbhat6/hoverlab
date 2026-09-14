/**
 * Permalink spec for /tools/shadow.
 *
 * `?layers=0/1/2/0@000000@5,0/8/24/-4@000000@15&surface=dark`
 *
 * The hardest of the six to encode, and the one where the readability rule
 * had to be argued rather than assumed. A shadow layer is eight fields, a
 * stack is up to eight layers, and the honest question was whether a URL
 * carrying sixty-four numbers is readable in any useful sense.
 *
 * It is, but only because the layer form matches how the CSS itself is
 * written. `0/8/24/-4@000000@15` is `0px 8px 24px -4px rgba(0,0,0,0.15)` in
 * the same order, so somebody who can read a `box-shadow` can read this
 * without a key — which is the actual test, not character count.
 *
 * ── WHY DISABLED LAYERS STILL TRAVEL ────────────────────────────────────
 *
 * The tempting simplification is to write only the enabled layers, since
 * they are the only ones that render. It is wrong for one reason: the
 * address bar is kept in sync with the working state, so a link that
 * dropped the muted layers would silently delete them from somebody's
 * editing session the next time they reloaded. The `x` prefix costs one
 * character and makes the round trip lossless.
 */

import { hexToRgb } from '@/lib/color-tools'
import { hex, int, num, oneOf, list, type Codec, type ToolPermalink } from '@/lib/tools/permalink'

export type ShadowMode = 'box' | 'text'

/**
 * `match` paints the stage in the card's own colour.
 *
 * Not a preview nicety — it is the precondition for neumorphism. That style
 * is two shadows derived from the surface behind the element, and previewing
 * it on a stage that is a different colour shows something that cannot exist
 * anywhere the CSS is actually pasted.
 */
export type Surface = 'light' | 'dark' | 'match'

export const SHADOW_MODES: readonly ShadowMode[] = ['box', 'text']
export const SHADOW_SURFACES: readonly Surface[] = ['light', 'dark', 'match']

export interface ShadowLayer {
  id: string
  enabled: boolean
  inset: boolean
  x: number
  y: number
  blur: number
  spread: number
  color: string
  opacity: number
}

export interface ShadowState {
  layers: ShadowLayer[]
  mode: ShadowMode
  surface: Surface
  cardColor: string
  textColor: string
}

let layerCounter = 0
export function newLayerId(): string {
  return `l${++layerCounter}`
}

export function defaultLayers(): ShadowLayer[] {
  return [
    {
      id: newLayerId(),
      enabled: true,
      inset: false,
      x: 0,
      y: 1,
      blur: 2,
      spread: 0,
      color: '#000000',
      opacity: 0.05,
    },
    {
      id: newLayerId(),
      enabled: true,
      inset: false,
      x: 0,
      y: 1,
      blur: 4,
      spread: -1,
      color: '#000000',
      opacity: 0.1,
    },
    {
      id: newLayerId(),
      enabled: true,
      inset: false,
      x: 0,
      y: 8,
      blur: 24,
      spread: -4,
      color: '#000000',
      opacity: 0.15,
    },
  ]
}

/**
 * Called once, at module scope, so the ids in it are stable.
 *
 * `defaultLayers()` mints ids from a counter, and this object is spread on
 * every restore — calling it per render would hand React a new key for the
 * same row on every keystroke.
 */
export const SHADOW_DEFAULTS: ShadowState = {
  layers: defaultLayers(),
  mode: 'box',
  surface: 'light',
  cardColor: '#ffffff',
  // Separate from cardColor: the card default (white) would make the text
  // preview invisible on the light surface.
  textColor: '#18181b',
}

/**
 * One layer, as `[flags]x/y/blur/spread@rrggbb@opacity`.
 *
 * Ids are minted under a `u` prefix rather than from `layerCounter`, for the
 * same reason the gradient stops are: the counter and this function are two
 * independent id sources writing into one array, and a URL-born layer must
 * not collide with one added afterwards. Deterministic, because this parse
 * runs on the server and the result crosses to the client as a prop.
 */
let urlLayerSeq = 0
const px = num(-200, 200, 1)
const blurPx = num(0, 400, 1)
const pct = int(0, 100)

const layerCodec: Codec<ShadowLayer> = {
  toParam: (l) => {
    const flags = `${l.enabled ? '' : 'x'}${l.inset ? 'i' : ''}`
    const quad = [l.x, l.y, l.blur, l.spread].map((n) => px.toParam(n)).join('/')
    return `${flags}${quad}@${hex.toParam(l.color)}@${pct.toParam(Math.round(l.opacity * 100))}`
  },
  fromParam: (raw) => {
    const m = /^([xi]*)(.+)$/.exec(raw.trim())
    if (!m) return null
    const flags = m[1]!
    const [geometry, colorPart, opacityPart] = m[2]!.split('@')
    if (!geometry) return null

    const quad = geometry.split('/')
    if (quad.length !== 4) return null
    const x = px.fromParam(quad[0]!)
    const y = px.fromParam(quad[1]!)
    const blur = blurPx.fromParam(quad[2]!)
    const spread = px.fromParam(quad[3]!)
    if (x === null || y === null || blur === null || spread === null) return null

    // Colour and opacity both default rather than reject: `0/2/8/0` is a
    // reasonable thing to type, and black at 15% is what a shadow is.
    const color = colorPart ? hex.fromParam(colorPart) : '#000000'
    const opacity = opacityPart === undefined ? 15 : pct.fromParam(opacityPart)
    if (color === null || opacity === null) return null

    return {
      id: `u${++urlLayerSeq}`,
      enabled: !flags.includes('x'),
      inset: flags.includes('i'),
      x,
      y,
      blur,
      spread,
      color,
      opacity: opacity / 100,
    }
  },
}

export function layerToCss(l: ShadowLayer, mode: ShadowMode): string {
  const rgb = hexToRgb(l.color)
  if (!rgb) return ''
  // text-shadow has no inset or spread — those two are box-only.
  const parts = [
    mode === 'box' && l.inset ? 'inset' : '',
    `${l.x}px`,
    `${l.y}px`,
    `${l.blur}px`,
    mode === 'box' && l.spread !== 0 ? `${l.spread}px` : '',
    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${l.opacity.toFixed(2)})`,
  ].filter(Boolean)
  return parts.join(' ')
}

/** The whole stack, as the value of one `box-shadow` / `text-shadow`. */
export function shadowCss(state: ShadowState): string {
  const value = state.layers
    .filter((l) => l.enabled)
    .map((l) => layerToCss(l, state.mode))
    .filter(Boolean)
    .join(', ')
  return value || 'none'
}

export const SHADOW_PERMALINK: ToolPermalink<ShadowState> = {
  href: '/tools/shadow',
  defaults: SHADOW_DEFAULTS,
  fields: {
    layers: { param: 'layers', codec: list(layerCodec, 1, 8) },
    mode: { param: 'mode', codec: oneOf(SHADOW_MODES) },
    surface: { param: 'surface', codec: oneOf(SHADOW_SURFACES) },
    cardColor: { param: 'card', codec: hex },
    textColor: { param: 'ink', codec: hex },
  },

  describe(state) {
    const active = state.layers.filter((l) => l.enabled)
    const count = active.length
    const kind = state.mode === 'box' ? 'box-shadow' : 'text-shadow'
    const inset = active.some((l) => l.inset) && state.mode === 'box'
    const shape = inset ? `inset ${kind}` : kind
    return {
      title: `${count}-layer ${shape} — CSS generator — Hoverlab`,
      description: `${kind}: ${shadowCss(state)} — open it to retune each layer's offset, blur, spread and opacity, preview it on a light, dark or matched surface, and copy it as CSS or a Tailwind arbitrary value.`,
    }
  },

  // The shadow's own colours, deduplicated, plus the surface it is being
  // judged against — which is half of what makes a shadow look right.
  swatches: (state) => {
    const colors = state.layers.filter((l) => l.enabled).map((l) => l.color)
    return [...new Set([state.cardColor, ...colors])].slice(0, 6)
  },

  gallery: [
    {
      slug: 'elevation-3',
      name: 'Three-layer elevation',
      note: 'The default stack. Tight contact shadow, mid falloff, wide ambient — how a real elevation is built.',
      state: {},
    },
    {
      slug: 'hairline',
      name: 'Hairline',
      note: 'One 1px layer at 8%. A border that is not a border, and the most-used shadow in any dense UI.',
      state: {
        layers: [
          { id: 'p1', enabled: true, inset: false, x: 0, y: 1, blur: 2, spread: 0, color: '#0f172a', opacity: 0.08 },
        ],
      },
    },
    {
      slug: 'lifted-card',
      name: 'Lifted card',
      note: 'A big soft ambient with a negative spread, so it reads as height rather than as a halo.',
      state: {
        layers: [
          { id: 'p1', enabled: true, inset: false, x: 0, y: 2, blur: 4, spread: -1, color: '#0f172a', opacity: 0.06 },
          { id: 'p2', enabled: true, inset: false, x: 0, y: 20, blur: 40, spread: -12, color: '#0f172a', opacity: 0.22 },
        ],
      },
    },
    {
      slug: 'inset-well',
      name: 'Inset well',
      note: 'Two inset layers — the recessed input field, and the only shape `inset` is genuinely for.',
      state: {
        layers: [
          { id: 'p1', enabled: true, inset: true, x: 0, y: 2, blur: 4, spread: 0, color: '#0f172a', opacity: 0.1 },
          { id: 'p2', enabled: true, inset: true, x: 0, y: 1, blur: 1, spread: 0, color: '#0f172a', opacity: 0.06 },
        ],
        cardColor: '#f1f5f9',
      },
    },
    {
      slug: 'neumorphic',
      name: 'Neumorphic',
      note: 'One light and one dark offset on a matched surface. Preview it anywhere else and it is meaningless.',
      state: {
        layers: [
          { id: 'p1', enabled: true, inset: false, x: -8, y: -8, blur: 16, spread: 0, color: '#ffffff', opacity: 0.9 },
          { id: 'p2', enabled: true, inset: false, x: 8, y: 8, blur: 16, spread: 0, color: '#94a3b8', opacity: 0.5 },
        ],
        surface: 'match',
        cardColor: '#e2e8f0',
      },
    },
    {
      slug: 'glow-ring',
      name: 'Focus glow',
      note: 'A zero-offset coloured spread. What a focus ring looks like when it is a shadow instead of an outline.',
      state: {
        layers: [
          { id: 'p1', enabled: true, inset: false, x: 0, y: 0, blur: 0, spread: 3, color: '#3b82f6', opacity: 0.4 },
          { id: 'p2', enabled: true, inset: false, x: 0, y: 1, blur: 2, spread: 0, color: '#0f172a', opacity: 0.1 },
        ],
      },
    },
    {
      slug: 'dark-mode-elevation',
      name: 'Dark-mode elevation',
      note: 'Shadows barely read on dark surfaces. This is the stack that still does — deeper, wider, nearly opaque.',
      state: {
        layers: [
          { id: 'p1', enabled: true, inset: false, x: 0, y: 1, blur: 3, spread: 0, color: '#000000', opacity: 0.6 },
          { id: 'p2', enabled: true, inset: false, x: 0, y: 12, blur: 32, spread: -8, color: '#000000', opacity: 0.7 },
        ],
        surface: 'dark',
        cardColor: '#1e293b',
        textColor: '#e2e8f0',
      },
    },
    {
      slug: 'long-text-shadow',
      name: 'Text, hard offset',
      note: 'A zero-blur text-shadow — the poster look, where the offset is the whole effect.',
      state: {
        mode: 'text',
        layers: [
          { id: 'p1', enabled: true, inset: false, x: 3, y: 3, blur: 0, spread: 0, color: '#f43f5e', opacity: 1 },
        ],
        surface: 'light',
        textColor: '#0f172a',
      },
    },
    {
      slug: 'text-legibility',
      name: 'Text on an image',
      note: 'One soft dark shadow under light text. The minimum that keeps a hero headline readable over a photo.',
      state: {
        mode: 'text',
        layers: [
          { id: 'p1', enabled: true, inset: false, x: 0, y: 2, blur: 8, spread: 0, color: '#000000', opacity: 0.55 },
        ],
        surface: 'dark',
        textColor: '#ffffff',
      },
    },
  ],
}
