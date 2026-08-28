/**
 * Starting stacks for the shadow builder — and the neumorphism it needed to
 * be able to make at all.
 *
 * The builder was a blank three-layer stack and eight sliders. That is the
 * right tool for someone who knows what they are building and the wrong one
 * for everyone else, because the interesting shadows are not "one layer,
 * tuned" — they are conventions. An elevation ramp is three layers with a
 * specific relationship between them. Neumorphism is two layers whose
 * colours are derived from the surface behind them, which is the part no
 * amount of dragging a colour picker gets you to by accident: get it wrong
 * by a few percent and it reads as a smudge rather than a moulded surface.
 *
 * So the presets that need to be computed are computed, from the element's
 * own colour, and the one that has a hard requirement (the element and the
 * page must be the same colour, or the illusion collapses) sets that up
 * rather than leaving it as a note nobody reads.
 *
 * The honest caveat travels with it: neumorphism is a low-contrast style by
 * construction, and `neumorphicWarning` says so when the chosen base cannot
 * carry it. A tool that emits an unusable control without comment is worse
 * than one that does not emit it.
 */

import { hexToHsl, hslToHex, normalizeHex } from '@/lib/color-tools'

/** One shadow layer, without the bookkeeping the editor adds. */
export interface ShadowSpec {
  inset: boolean
  x: number
  y: number
  blur: number
  spread: number
  color: string
  opacity: number
}

export interface ShadowPreset {
  id: string
  name: string
  /** Which editor mode it belongs to — `text-shadow` has no inset or spread. */
  mode: 'box' | 'text'
  blurb: string
  /** Built from the element's own colour, for the ones that must be. */
  layers: (base: string) => ShadowSpec[]
  /**
   * Set when the preset only reads correctly on a backdrop matching the
   * element. Applying it switches the preview surface to `match`.
   */
  needsMatchingSurface?: boolean
}

const black = (
  y: number,
  blur: number,
  spread: number,
  opacity: number,
  x = 0,
): ShadowSpec => ({ inset: false, x, y, blur, spread, color: '#000000', opacity })

/**
 * How far the derived pair moves from the base, in lightness percent.
 *
 * Eight is the number that reads as moulded rather than painted at the
 * default 8px offset. It is deliberately not exposed as a slider: the pair
 * has to stay symmetrical around the base or the light stops coming from one
 * direction, and two sliders that must be kept equal is one slider wearing a
 * disguise.
 */
const NEUMORPHIC_SHIFT = 8

/** The lighter and darker halves of a neumorphic pair, and what was possible. */
export interface NeumorphicPair {
  light: string
  dark: string
  /**
   * The smaller of the two shifts actually achieved.
   *
   * A base near white cannot be lightened and a base near black cannot be
   * darkened, so one half of the pair silently collapses onto the surface and
   * the element ends up lit from one side only. This is that, measured.
   */
  shift: number
}

export function neumorphicPair(base: string): NeumorphicPair | null {
  const hsl = hexToHsl(normalizeHex(base) ?? base)
  if (!hsl) return null
  const up = Math.min(100, hsl.l + NEUMORPHIC_SHIFT)
  const down = Math.max(0, hsl.l - NEUMORPHIC_SHIFT)
  return {
    light: hslToHex({ ...hsl, l: up }),
    dark: hslToHex({ ...hsl, l: down }),
    shift: Math.min(up - hsl.l, hsl.l - down),
  }
}

/**
 * The two shadows, lit from the top left.
 *
 * Full opacity, because the colours themselves are the effect — dropping a
 * translucent black over the surface gives you a drop shadow that happens to
 * be soft, which is a different look and the one people accidentally build
 * when they try this by hand.
 */
export function neumorphicLayers(
  base: string,
  { pressed = false, distance = 8, blur = 16 } = {},
): ShadowSpec[] {
  const pair = neumorphicPair(base)
  if (!pair) return []
  const common = { inset: pressed, blur, spread: 0, opacity: 1 }
  return [
    { ...common, x: distance, y: distance, color: pair.dark },
    { ...common, x: -distance, y: -distance, color: pair.light },
  ]
}

/**
 * Why this base will not work, or null.
 *
 * Shown live rather than only on apply, because the colour is a picker the
 * visitor keeps dragging — and dragging it to white is exactly how the effect
 * dies without saying anything.
 */
export function neumorphicWarning(base: string): string | null {
  const pair = neumorphicPair(base)
  if (!pair) return null
  if (pair.shift >= NEUMORPHIC_SHIFT) return null
  const hsl = hexToHsl(normalizeHex(base) ?? base)
  const tooLight = (hsl?.l ?? 50) > 50
  return tooLight
    ? 'This colour is too close to white to lighten, so the highlight has nowhere to go and the element reads as lit from one side. Pull the card colour down a few percent.'
    : 'This colour is too close to black to darken, so the shadow has nowhere to go and the element reads as lit from one side. Lift the card colour a few percent.'
}

/**
 * Whether a stack is a derived pair rather than a drop shadow.
 *
 * Structural rather than remembered, so it survives a reload and a shared
 * link — the alternative was a flag on the state saying "a neumorphic preset
 * was applied once", which goes stale the moment anyone edits a layer. Two
 * opaque layers in a colour that is not black is what the style is; nothing
 * else in the builder produces that by accident.
 */
export function looksNeumorphic(
  layers: readonly Pick<ShadowSpec, 'color' | 'opacity'>[],
): boolean {
  if (layers.length !== 2) return false
  return layers.every(
    (l) => l.opacity >= 0.95 && (normalizeHex(l.color) ?? l.color) !== '#000000',
  )
}

/**
 * A base the effect can actually work on.
 *
 * Applied when a neumorphic preset is loaded onto a white or black card,
 * which is the common case — the builder's own default is white. Nudging
 * beats loading a preset that visibly does nothing.
 */
export function neumorphicBase(base: string): string {
  const hsl = hexToHsl(normalizeHex(base) ?? base)
  if (!hsl) return '#e0e5ec'
  // Lightness only. Pure white and pure black have no hue to speak of — HSL
  // reports zero, which is red — so adding saturation on the way out would
  // hand back a pink card nobody asked for.
  if (hsl.l > 92) return hslToHex({ ...hsl, l: 88 })
  if (hsl.l < 8) return hslToHex({ ...hsl, l: 14 })
  return normalizeHex(base) ?? base
}

export const SHADOW_PRESETS: ShadowPreset[] = [
  {
    id: 'subtle',
    name: 'Subtle',
    mode: 'box',
    blurb: 'A hairline lift. What a resting card wants — visible, not announced.',
    layers: () => [black(1, 2, 0, 0.06), black(1, 3, 0, 0.1)],
  },
  {
    id: 'elevated',
    name: 'Elevated',
    mode: 'box',
    blurb:
      'The three-layer ramp: a tight contact shadow, a mid one, and a wide soft one. Depth comes from the stack, never from one big blur.',
    layers: () => [black(1, 2, 0, 0.05), black(4, 8, -2, 0.1), black(12, 28, -6, 0.16)],
  },
  {
    id: 'floating',
    name: 'Floating',
    mode: 'box',
    blurb: 'Modals and popovers — far enough off the page that nothing behind it competes.',
    layers: () => [black(2, 4, -1, 0.06), black(10, 20, -6, 0.14), black(28, 60, -12, 0.22)],
  },
  {
    id: 'inner',
    name: 'Inset well',
    mode: 'box',
    blurb:
      'A pressed-in surface — inputs, tracks, anything that should read as recessed rather than raised.',
    layers: () => [
      { inset: true, x: 0, y: 2, blur: 4, spread: 0, color: '#000000', opacity: 0.08 },
      { inset: true, x: 0, y: 1, blur: 2, spread: 0, color: '#000000', opacity: 0.06 },
    ],
  },
  {
    id: 'neumorphic-raised',
    name: 'Neumorphic — raised',
    mode: 'box',
    blurb:
      'Two shadows derived from the surface itself: darker below right, lighter above left, as if the shape were pushed up out of the page. Only works when the element and the page are the same colour.',
    layers: (base) => neumorphicLayers(base),
    needsMatchingSurface: true,
  },
  {
    id: 'neumorphic-pressed',
    name: 'Neumorphic — pressed',
    mode: 'box',
    blurb:
      'The same pair turned inward. This is the state half of the style — a neumorphic button that never changes on press is a picture of a button.',
    layers: (base) => neumorphicLayers(base, { pressed: true }),
    needsMatchingSurface: true,
  },
  {
    id: 'text-lift',
    name: 'Soft lift',
    mode: 'text',
    blurb: 'Enough separation to keep a heading legible over a busy photograph.',
    layers: () => [
      { inset: false, x: 0, y: 1, blur: 2, spread: 0, color: '#000000', opacity: 0.3 },
      { inset: false, x: 0, y: 4, blur: 12, spread: 0, color: '#000000', opacity: 0.25 },
    ],
  },
  {
    id: 'text-glow',
    name: 'Neon glow',
    mode: 'text',
    blurb:
      'Three copies of the same colour at growing blurs. The tight one carries the colour, the wide one carries the light.',
    layers: (base) => [
      { inset: false, x: 0, y: 0, blur: 4, spread: 0, color: base, opacity: 0.9 },
      { inset: false, x: 0, y: 0, blur: 14, spread: 0, color: base, opacity: 0.6 },
      { inset: false, x: 0, y: 0, blur: 38, spread: 0, color: base, opacity: 0.4 },
    ],
  },
  {
    id: 'text-offset',
    name: 'Hard offset',
    mode: 'text',
    blurb: 'No blur at all — a solid duplicate behind the type. Poster lettering, not depth.',
    layers: () => [
      { inset: false, x: 4, y: 4, blur: 0, spread: 0, color: '#000000', opacity: 1 },
    ],
  },
]

export function shadowPresetsFor(mode: 'box' | 'text'): ShadowPreset[] {
  return SHADOW_PRESETS.filter((p) => p.mode === mode)
}
