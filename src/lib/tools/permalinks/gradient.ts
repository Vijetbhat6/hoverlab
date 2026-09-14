/**
 * Permalink spec for /tools/gradient.
 *
 * `?type=conic&angle=90&stops=f43f5e@0,10b981@100`
 *
 * The stop list is the one field here that needed a codec of its own, and
 * it is worth reading the encoding closely because it is the only place in
 * this module set where readability and correctness pulled against each
 * other. `hex@position` won because it is the one form that survives being
 * read aloud, edited by hand in a pull request, and eyeballed in a diff —
 * all three of which are things a `#s=` blob cannot do and the entire
 * reason this exists.
 */

import { hex, int, flag, list, num, oneOf, type Codec, type ToolPermalink } from '@/lib/tools/permalink'

export type GradientType = 'linear' | 'radial' | 'conic'

export interface Stop {
  id: string
  color: string
  /** Position 0-100. */
  position: number
}

export interface GradientState {
  type: GradientType
  angle: number
  stops: Stop[]
  oklch: boolean
}

export const GRADIENT_TYPES: readonly GradientType[] = ['linear', 'radial', 'conic']

export const GRADIENT_DEFAULTS: GradientState = {
  type: 'linear',
  angle: 135,
  oklch: false,
  stops: [
    { id: 's1', color: '#f43f5e', position: 0 },
    { id: 's2', color: '#f59e0b', position: 50 },
    { id: 's3', color: '#10b981', position: 100 },
  ],
}

/**
 * One stop, as `rrggbb@position`.
 *
 * The id does not travel. It is a React key minted from a counter, not part
 * of the design — putting it in the URL would make two identical gradients
 * two different permalinks, which is the bug the whole "serialize, then
 * compare" rule in `toolQuery` exists to avoid.
 *
 * Ids are minted back on the way in under a `u` prefix, deliberately not
 * the `s` the tool's own counter uses. The counter and this function are
 * two independent id sources writing into one array, and `u` is what stops
 * a stop added after a link was opened from colliding with one that came
 * out of it. Deterministic rather than random, because this parse runs on
 * the server and the result is handed to the client as a prop — a random
 * id here would be a hydration mismatch on every shared gradient.
 */
let urlStopSeq = 0
const stopCodec: Codec<Stop> = {
  toParam: (stop) => `${hex.toParam(stop.color)}@${Math.round(stop.position)}`,
  fromParam: (raw) => {
    const [colorPart, positionPart] = raw.split('@')
    const color = colorPart ? hex.fromParam(colorPart) : null
    if (!color) return null
    // A stop with no position is legal and means 0 — `?stops=f00,00f` is a
    // reasonable thing to type, and refusing it would be pedantry.
    const position = positionPart === undefined ? 0 : int(0, 100).fromParam(positionPart)
    if (position === null) return null
    return { id: `u${++urlStopSeq}`, color, position }
  },
}

/**
 * The CSS declaration a state produces.
 *
 * Lifted out of the page so the server can put the real string in the meta
 * description and the gallery card. It was already the single source the
 * copy button, the PNG export and the preview all read from; it is now also
 * what the <title> is built on, so a permalink cannot advertise a gradient
 * that differs from the one it opens.
 */
export function gradientCss(state: GradientState): string {
  const sorted = [...state.stops].sort((a, b) => a.position - b.position)
  const stopsStr = sorted.map((s) => `${s.color} ${s.position}%`).join(', ')
  const interp = state.oklch ? ' in oklch' : ''
  if (state.type === 'linear') return `linear-gradient(${state.angle}deg${interp}, ${stopsStr})`
  if (state.type === 'radial') return `radial-gradient(circle${interp}, ${stopsStr})`
  return `conic-gradient(from ${state.angle}deg${interp}, ${stopsStr})`
}

export const GRADIENT_PERMALINK: ToolPermalink<GradientState> = {
  href: '/tools/gradient',
  defaults: GRADIENT_DEFAULTS,
  fields: {
    type: { param: 'type', codec: oneOf(GRADIENT_TYPES) },
    // Not `int`: `?angle=22.5` is a real thing to want, and the rounding in
    // `num` keeps the URL from growing a float tail.
    angle: { param: 'angle', codec: num(0, 360, 1) },
    stops: { param: 'stops', codec: list(stopCodec, 2, 16) },
    oklch: { param: 'oklch', codec: flag },
  },

  describe(state) {
    const css = gradientCss(state)
    const count = state.stops.length
    const shape =
      state.type === 'linear'
        ? `${state.angle}° linear`
        : state.type === 'radial'
          ? 'radial'
          : `${state.angle}° conic`
    return {
      title: `${shape} gradient, ${count} stops — CSS generator — Hoverlab`,
      description: `background: ${css} — open it in the generator to drag the stops, switch the interpolation to OKLCH, and copy the CSS or export it as a PNG.`,
    }
  },

  swatches: (state) =>
    [...state.stops].sort((a, b) => a.position - b.position).map((s) => s.color),

  /*
    Chosen so the set teaches the control as well as supplying a gradient:
    the same three-stop sunset appears twice, once in sRGB and once in
    OKLCH, because the muddy midpoint that comparison exposes is the single
    most useful thing this tool has to say.
  */
  gallery: [
    {
      slug: 'sunset-135',
      name: 'Sunset, 135°',
      note: 'Rose through amber to emerald. The default, and a fair test of any interpolation.',
      state: {},
    },
    {
      slug: 'sunset-oklch',
      name: 'Sunset, in OKLCH',
      note: 'The same three stops interpolated in OKLCH. Compare the midpoint against the sRGB version above.',
      state: { oklch: true },
    },
    {
      slug: 'indigo-fade',
      name: 'Indigo fade, 160°',
      note: 'Two stops, one hue family. What a hero background should be and usually is not.',
      state: {
        angle: 160,
        stops: [
          { id: 'g1', color: '#312e81', position: 0 },
          { id: 'g2', color: '#6366f1', position: 100 },
        ],
      },
    },
    {
      slug: 'mesh-conic',
      name: 'Conic spectrum',
      note: 'A conic sweep through five hues — the cheapest convincing "mesh" there is.',
      state: {
        type: 'conic',
        angle: 0,
        stops: [
          { id: 'g1', color: '#f43f5e', position: 0 },
          { id: 'g2', color: '#f59e0b', position: 25 },
          { id: 'g3', color: '#10b981', position: 50 },
          { id: 'g4', color: '#3b82f6', position: 75 },
          { id: 'g5', color: '#f43f5e', position: 100 },
        ],
      },
    },
    {
      slug: 'radial-spotlight',
      name: 'Radial spotlight',
      note: 'Light centre falling to near-black. Drop it behind a dark hero.',
      state: {
        type: 'radial',
        stops: [
          { id: 'g1', color: '#334155', position: 0 },
          { id: 'g2', color: '#020617', position: 100 },
        ],
      },
    },
    {
      slug: 'sky-dawn',
      name: 'Dawn, 180°',
      note: 'Straight down, sky to horizon. Four stops, no hue crossing.',
      state: {
        angle: 180,
        stops: [
          { id: 'g1', color: '#0c4a6e', position: 0 },
          { id: 'g2', color: '#0ea5e9', position: 45 },
          { id: 'g3', color: '#fda4af', position: 80 },
          { id: 'g4', color: '#fed7aa', position: 100 },
        ],
      },
    },
    {
      slug: 'mono-sheen',
      name: 'Sheen, 105°',
      note: 'A near-flat grey ramp. The gradient you use when you do not want one.',
      state: {
        angle: 105,
        stops: [
          { id: 'g1', color: '#f8fafc', position: 0 },
          { id: 'g2', color: '#e2e8f0', position: 100 },
        ],
      },
    },
    {
      slug: 'citrus-45',
      name: 'Citrus, 45°',
      note: 'Lime into amber, interpolated in OKLCH so the middle stays saturated.',
      state: {
        angle: 45,
        oklch: true,
        stops: [
          { id: 'g1', color: '#84cc16', position: 0 },
          { id: 'g2', color: '#f59e0b', position: 100 },
        ],
      },
    },
    {
      slug: 'violet-haze',
      name: 'Violet haze, 210°',
      note: 'Three violets a few steps apart — depth without a colour change.',
      state: {
        angle: 210,
        stops: [
          { id: 'g1', color: '#a78bfa', position: 0 },
          { id: 'g2', color: '#7c3aed', position: 55 },
          { id: 'g3', color: '#4c1d95', position: 100 },
        ],
      },
    },
    {
      slug: 'teal-rose',
      name: 'Teal to rose, 120°',
      note: 'Near-complementary, which is where sRGB interpolation goes grey in the middle.',
      state: {
        angle: 120,
        stops: [
          { id: 'g1', color: '#14b8a6', position: 0 },
          { id: 'g2', color: '#f43f5e', position: 100 },
        ],
      },
    },
  ],
}
