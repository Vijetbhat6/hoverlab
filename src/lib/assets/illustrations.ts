/**
 * Illustrations — an isometric renderer, and scenes described as solids.
 *
 * Flowbite ships 50-odd 3D SVG illustrations in light and dark: two files per
 * picture, a hundred files, and a palette change that is a hundred edits. The
 * doubling is the part worth fixing rather than copying. An illustration that
 * adapts is ONE file whose colours are custom properties with a
 * `prefers-color-scheme` block — it works inline, it works in an `<img>`, it
 * works opened from disk, and there is no second file to link by mistake,
 * which is the actual failure mode of every two-file set (a dark page with
 * the light asset on it, shipped).
 *
 * The drawing half is a projection and a handful of solids. Scenes are a list
 * of boxes, cylinders and balls at grid coordinates, so a scene is twelve
 * lines of data rather than four hundred path commands — which is what makes
 * a new one cheap, and what keeps all of them consistent with each other.
 * Hand-drawn sets drift: the light source moves, the angle shifts by two
 * degrees, and by the twentieth illustration they no longer look related. A
 * renderer cannot do that.
 *
 * The projection, once: a true 30° isometric. Unit vectors on screen are
 * x → (+0.866, +0.5), y → (−0.866, +0.5), z → (0, −1). A circle lying in the
 * XY plane therefore images to an axis-aligned ellipse of ratio √3 : 1, which
 * is where the magic numbers in `isoEllipse` come from — they are derived, not
 * eyeballed.
 *
 * Shading is three fixed overlays rather than three computed colours, because
 * the fills are `var()` references and there is no arithmetic available on
 * them. A white wash on the top face and a black wash on the left face give
 * the same read as lightened and darkened fills, and they keep working when
 * the palette underneath changes — including when it changes at
 * `prefers-color-scheme`, which is precisely when computed shades would have
 * had to be recomputed.
 */

import {
  componentName,
  paletteById,
  paletteStyle,
  paletteScopeClass,
  svgDocument,
  swatchFor,
  swatchRef,
  type AssetScheme,
  type SwatchKey,
} from './asset-types'
import { svgToDataUri, svgToJsx } from '../svg-tools'

/* ============================================================
 *  Projection
 * ============================================================ */

/** Screen px per grid unit. */
const U = 16
const COS30 = 0.8660254
/** Derived in the module docblock. */
const ELLIPSE_RX = 1.2247449
const ELLIPSE_RY = 0.7071068

export interface Point {
  x: number
  y: number
}

export function project(x: number, y: number, z: number): Point {
  return {
    x: round((x - y) * COS30 * U),
    y: round(((x + y) * 0.5 - z) * U),
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

function isoEllipse(r: number): { rx: number; ry: number } {
  return { rx: round(r * ELLIPSE_RX * U), ry: round(r * ELLIPSE_RY * U) }
}

function poly(points: Point[]): string {
  return points.map((p) => `${p.x} ${p.y}`).join(' L ')
}

/* ============================================================
 *  Solids
 * ============================================================ */

export type Tone = SwatchKey

interface Common {
  /** Grid position of the solid's near-bottom corner. */
  x: number
  y: number
  z: number
  tone: Tone
}

export interface BoxSolid extends Common {
  kind: 'box'
  w: number
  d: number
  h: number
}

export interface CylSolid extends Common {
  kind: 'cyl'
  r: number
  h: number
}

export interface BallSolid extends Common {
  kind: 'ball'
  r: number
}

/**
 * A shape drawn in screen space, after everything else.
 *
 * The escape hatch, and it is needed: a tick, a question mark and the lens of
 * a magnifier are flat graphic marks, not objects in the scene. Projecting
 * them would make them lie on a face of a box, which is a different and much
 * worse drawing. Coordinates are relative to the scene's own origin.
 */
export interface Decal {
  kind: 'decal'
  /** Raw SVG, with `{{tone}}` placeholders for palette references. */
  svg: string
  /**
   * Which side of the solids this is drawn on. Defaults to `front`.
   *
   * `back` exists for contact shadows, which are decals by nature — they are
   * flat marks on the ground plane — but must be painted before anything
   * stands on them. A shadow drawn last is a grey smear across the object
   * casting it.
   */
  layer?: 'back' | 'front'
}

export type Solid = BoxSolid | CylSolid | BallSolid | Decal

/**
 * Painter order.
 *
 * Back to front by `x + y + z`. It is exact for scenes whose solids do not
 * interpenetrate, which is every scene here — and rather than build a
 * depth-sorting BSP for twelve pictures, the constraint is stated and the
 * scenes respect it. Decals always last, by definition.
 */
function depthSorted(solids: Solid[]): Solid[] {
  const objects = solids.filter((s): s is BoxSolid | CylSolid | BallSolid => s.kind !== 'decal')
  const decals = solids.filter((s): s is Decal => s.kind === 'decal')
  return [
    ...decals.filter((d) => d.layer === 'back'),
    ...objects.sort((a, b) => a.x + a.y + a.z - (b.x + b.y + b.z)),
    ...decals.filter((d) => d.layer !== 'back'),
  ]
}

const TOP_WASH = '#ffffff'
const SIDE_WASH = '#000000'

function renderBox(b: BoxSolid, fill: string): string {
  const { x, y, z, w, d, h } = b
  // Eight corners, named by face.
  const top = [
    project(x, y, z + h),
    project(x + w, y, z + h),
    project(x + w, y + d, z + h),
    project(x, y + d, z + h),
  ]
  /*
    Only two vertical faces are ever visible, and which two is fixed by the
    projection rather than by choice: screen depth is `x + y`, so the near
    corner of any box is always `(x + w, y + d)` and the visible faces are the
    ones meeting there. Drawing the `y` face instead of the `y + d` face is
    the classic isometric bug — it renders, it looks almost right, and the
    shading ends up on the wrong side of every solid in the scene.
  */
  const right = [
    project(x + w, y, z + h),
    project(x + w, y, z),
    project(x + w, y + d, z),
    project(x + w, y + d, z + h),
  ]
  const left = [
    project(x, y + d, z + h),
    project(x, y + d, z),
    project(x + w, y + d, z),
    project(x + w, y + d, z + h),
  ]
  return [
    `    <path d="M ${poly(left)} Z" fill="${fill}" />`,
    `    <path d="M ${poly(left)} Z" fill="${SIDE_WASH}" opacity="0.22" />`,
    `    <path d="M ${poly(right)} Z" fill="${fill}" />`,
    `    <path d="M ${poly(right)} Z" fill="${SIDE_WASH}" opacity="0.1" />`,
    `    <path d="M ${poly(top)} Z" fill="${fill}" />`,
    `    <path d="M ${poly(top)} Z" fill="${TOP_WASH}" opacity="0.18" />`,
  ].join('\n')
}

function renderCyl(c: CylSolid, fill: string): string {
  const { x, y, z, r, h } = c
  const centreTop = project(x, y, z + h)
  const centreBottom = project(x, y, z)
  const { rx, ry } = isoEllipse(r)
  // The body is the silhouette: straight down both sides, closed by the near
  // half of the bottom ellipse. Drawing a rect plus an ellipse instead leaves
  // a visible seam wherever the fill is translucent.
  const body = [
    `M ${round(centreTop.x - rx)} ${centreTop.y}`,
    `L ${round(centreBottom.x - rx)} ${centreBottom.y}`,
    `A ${rx} ${ry} 0 0 0 ${round(centreBottom.x + rx)} ${centreBottom.y}`,
    `L ${round(centreTop.x + rx)} ${centreTop.y}`,
    'Z',
  ].join(' ')
  return [
    `    <path d="${body}" fill="${fill}" />`,
    `    <path d="${body}" fill="${SIDE_WASH}" opacity="0.16" />`,
    `    <ellipse cx="${centreTop.x}" cy="${centreTop.y}" rx="${rx}" ry="${ry}" fill="${fill}" />`,
    `    <ellipse cx="${centreTop.x}" cy="${centreTop.y}" rx="${rx}" ry="${ry}" fill="${TOP_WASH}" opacity="0.18" />`,
  ].join('\n')
}

function renderBall(b: BallSolid, fill: string): string {
  const c = project(b.x, b.y, b.z + b.r)
  const r = round(b.r * U * 1.05)
  return [
    `    <circle cx="${c.x}" cy="${c.y}" r="${r}" fill="${fill}" />`,
    `    <circle cx="${round(c.x - r * 0.3)}" cy="${round(c.y - r * 0.35)}" r="${round(
      r * 0.55,
    )}" fill="${TOP_WASH}" opacity="0.18" />`,
  ].join('\n')
}

/* ============================================================
 *  Scenes
 * ============================================================ */

export interface Scene {
  id: string
  name: string
  /** Where this picture belongs. The reason to pick it. */
  use: string
  /** viewBox, chosen per scene so nothing is clipped and nothing floats. */
  viewBox: string
  solids: Solid[]
}

const box = (
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  h: number,
  tone: Tone = 'base',
): BoxSolid => ({ kind: 'box', x, y, z, w, d, h, tone })

const cyl = (x: number, y: number, z: number, r: number, h: number, tone: Tone = 'base'): CylSolid => ({
  kind: 'cyl',
  x,
  y,
  z,
  r,
  h,
  tone,
})

const ball = (x: number, y: number, z: number, r: number, tone: Tone = 'accent'): BallSolid => ({
  kind: 'ball',
  x,
  y,
  z,
  r,
  tone,
})

const decal = (svg: string, layer: 'back' | 'front' = 'front'): Decal => ({
  kind: 'decal',
  svg,
  layer,
})

/** A soft contact shadow. Without one, every solid looks like it is falling. */
function shadow(x: number, y: number, r: number): Decal {
  const c = project(x, y, 0)
  const { rx, ry } = isoEllipse(r)
  return decal(
    `    <ellipse cx="${c.x}" cy="${c.y}" rx="${rx}" ry="${ry}" fill="${SIDE_WASH}" opacity="0.08" />`,
    'back',
  )
}

export const SCENES: Scene[] = [
  {
    id: 'empty-inbox',
    name: 'Empty inbox',
    use: 'An empty state for a list that will fill up — an inbox, a queue, a feed. The tray is open and the one item is leaving, which reads as "nothing here yet" rather than "something went wrong".',
    viewBox: '-120 -150 240 220',
    solids: [
      shadow(1, 1, 2.6),
      box(-1.5, -1.5, 0, 3, 3, 0.4, 'tint'),
      box(-1.5, -1.5, 0.4, 3, 0.3, 0.9, 'base'),
      box(-1.5, 1.2, 0.4, 3, 0.3, 0.9, 'base'),
      box(-1.5, -1.2, 0.4, 0.3, 2.4, 0.9, 'base'),
      box(1.2, -1.2, 0.4, 0.3, 2.4, 0.9, 'base'),
      box(-0.8, -0.8, 2.6, 1.6, 1.2, 0.18, 'accent'),
    ],
  },
  {
    id: 'no-results',
    name: 'No results',
    use: 'A search that matched nothing. The grid says the data exists; the lens says the query is the problem — which is the distinction a plain "no results" never makes.',
    viewBox: '-130 -130 260 210',
    solids: [
      shadow(0.5, 0.5, 3),
      box(-2, -2, 0, 4, 4, 0.3, 'tint'),
      box(-1.6, -1.6, 0.3, 1.4, 1.4, 0.5, 'base'),
      box(0.2, -1.6, 0.3, 1.4, 1.4, 0.5, 'base'),
      box(-1.6, 0.2, 0.3, 1.4, 1.4, 0.5, 'base'),
      decal(
        `    <g fill="none" stroke="{{accent}}" stroke-width="7" stroke-linecap="round">
      <circle cx="26" cy="-54" r="30" fill="{{bg}}" fill-opacity="0.65" />
      <path d="M48 -33 L70 -12" />
    </g>`,
      ),
    ],
  },
  {
    id: 'page-not-found',
    name: 'Page not found',
    use: 'A 404. A stack with one block missing is the only 404 drawing that says what actually happened — the address is fine, the thing it points at is gone.',
    viewBox: '-120 -170 240 230',
    solids: [
      shadow(0, 0, 2.2),
      box(-1.2, -1.2, 0, 2.4, 2.4, 0.7, 'base'),
      box(-1.2, -1.2, 0.7, 2.4, 2.4, 0.7, 'base'),
      box(-1.2, -1.2, 2.1, 2.4, 2.4, 0.7, 'accent'),
      decal(
        `    <g stroke="{{ink}}" stroke-width="3" stroke-linecap="round" opacity="0.45" stroke-dasharray="6 7" fill="none">
      <path d="M-36 -42 L0 -63 L36 -42" />
    </g>`,
      ),
    ],
  },
  {
    id: 'server-error',
    name: 'Server error',
    use: 'A 500. One rack leaning against the others — a fault, not an absence, and not the reader’s fault either.',
    viewBox: '-140 -190 280 250',
    solids: [
      shadow(0, 0, 3),
      box(-2.2, -0.6, 0, 1.2, 1.2, 3.4, 'base'),
      box(-0.6, -0.6, 0, 1.2, 1.2, 3.4, 'base'),
      box(1, -0.6, 0, 1.2, 1.2, 2.2, 'accent'),
      decal(
        `    <g stroke="{{accent}}" stroke-width="6" stroke-linecap="round">
      <path d="M52 -92 L52 -70" />
      <path d="M52 -58 L52 -56" />
    </g>`,
      ),
    ],
  },
  {
    id: 'offline',
    name: 'Offline',
    use: 'A dropped connection. The gap is drawn, so the picture distinguishes "we cannot reach the server" from "the server said no".',
    viewBox: '-150 -140 300 210',
    solids: [
      shadow(-1.4, -1.4, 1.4),
      shadow(1.4, 1.4, 1.4),
      box(-2.6, -2.6, 0, 1.8, 1.8, 1, 'base'),
      box(0.8, 0.8, 0, 1.8, 1.8, 1, 'base'),
      decal(
        `    <g stroke="{{accent}}" stroke-width="5" stroke-linecap="round" fill="none">
      <path d="M-34 -6 L-12 -18" stroke-dasharray="5 9" />
      <path d="M14 -32 L36 -44" stroke-dasharray="5 9" />
      <path d="M-8 -40 L12 -20 M12 -40 L-8 -20" />
    </g>`,
      ),
    ],
  },
  {
    id: 'success',
    name: 'Success',
    use: 'A completed action — a paid invoice, a finished import, a submitted form. A podium rather than a bare tick, so it reads as an outcome that is now in place.',
    viewBox: '-130 -160 260 220',
    solids: [
      shadow(0, 0, 2.4),
      box(-1.6, -1.6, 0, 3.2, 3.2, 0.4, 'tint'),
      cyl(0, 0, 0.4, 1.4, 0.8, 'accent'),
      decal(
        `    <path d="M-22 -34 L-6 -19 L24 -54" fill="none" stroke="{{bg}}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />`,
      ),
    ],
  },
  {
    id: 'upload',
    name: 'Upload',
    use: 'Files on their way up. Three blocks at three heights, so the picture implies progress without pretending to show a percentage.',
    viewBox: '-130 -200 260 260',
    solids: [
      shadow(0, 0, 2.6),
      box(-1.8, -1.8, 0, 3.6, 3.6, 0.35, 'tint'),
      box(-0.6, -0.6, 0.8, 1.2, 1.2, 0.3, 'base'),
      box(-0.6, -0.6, 2, 1.2, 1.2, 0.3, 'base'),
      box(-0.6, -0.6, 3.2, 1.2, 1.2, 0.3, 'accent'),
    ],
  },
  {
    id: 'payment',
    name: 'Payment',
    use: 'Billing, checkout and plan screens. A card and coins, which is the one money metaphor that does not date or localise badly.',
    viewBox: '-150 -130 300 200',
    solids: [
      shadow(0, 0, 2.8),
      box(-2.4, -1.4, 0, 4.4, 2.8, 0.25, 'accent'),
      cyl(2.2, 0.8, 0, 0.7, 0.22, 'base'),
      cyl(2.2, 0.8, 0.22, 0.7, 0.22, 'base'),
      cyl(2.2, 0.8, 0.44, 0.7, 0.22, 'base'),
      // No magnetic stripe. A skewed rect laid on the card's top face needs
      // the full projection to sit flat, and a decal cannot have it — the
      // first attempt read as a scratch across the card rather than a stripe.
      // A card with no stripe is still a card.
    ],
  },
  {
    id: 'schedule',
    name: 'Schedule',
    use: 'A calendar, a booking flow, a reminder. One cell is raised rather than coloured, because a raised cell still reads when the image is printed or seen by someone who cannot tell the accent from the base.',
    viewBox: '-140 -140 280 200',
    solids: [
      shadow(0, 0, 3),
      box(-2.4, -2.4, 0, 4.8, 4.8, 0.3, 'tint'),
      box(-2, -2, 0.3, 1.2, 1.2, 0.25, 'base'),
      box(-0.6, -2, 0.3, 1.2, 1.2, 0.25, 'base'),
      box(0.8, -2, 0.3, 1.2, 1.2, 0.25, 'base'),
      box(-2, -0.6, 0.3, 1.2, 1.2, 0.25, 'base'),
      box(-0.6, -0.6, 0.3, 1.2, 1.2, 0.8, 'accent'),
      box(0.8, -0.6, 0.3, 1.2, 1.2, 0.25, 'base'),
      box(-2, 0.8, 0.3, 1.2, 1.2, 0.25, 'base'),
      box(-0.6, 0.8, 0.3, 1.2, 1.2, 0.25, 'base'),
      box(0.8, 0.8, 0.3, 1.2, 1.2, 0.25, 'base'),
    ],
  },
  {
    id: 'team',
    name: 'Team',
    use: 'An invite screen, an empty team list, an org page. Three figures of the same size — nobody is the manager, which is the right default for a product illustration.',
    viewBox: '-150 -150 300 210',
    solids: [
      shadow(0, 0, 3),
      box(-2.2, -2.2, 0, 4.4, 4.4, 0.3, 'tint'),
      cyl(-1.1, -0.4, 0.3, 0.45, 1, 'base'),
      ball(-1.1, -0.4, 1.3, 0.42, 'accent'),
      cyl(0.4, -1.1, 0.3, 0.45, 1, 'base'),
      ball(0.4, -1.1, 1.3, 0.42, 'accent'),
      cyl(0.8, 0.8, 0.3, 0.45, 1, 'base'),
      ball(0.8, 0.8, 1.3, 0.42, 'accent'),
    ],
  },
  {
    id: 'security',
    name: 'Security',
    use: 'Permissions, two-factor, an access-denied screen. A closed shackle on a solid block, rather than a shield — a shield promises protection, a lock describes a state.',
    viewBox: '-120 -180 240 240',
    solids: [
      shadow(0, 0, 2),
      box(-1.4, -1.4, 0, 2.8, 2.8, 1.8, 'base'),
      /*
        The shackle has to *meet* the block, and the number that decides
        whether it does is not guessable from the scene: the top face of a box
        of height h spans screen y from `-(x+y+h)·U` at its far corner to
        `(x+y-h)·U` at its near one. For this block that is −51 to −6, so the
        shackle's feet sit at −50. The first draft had them at −74, which is
        23px of clear air, and the picture read as a padlock hovering above an
        unrelated cube.
      */
      decal(
        `    <g fill="none" stroke="{{accent}}" stroke-width="10" stroke-linecap="round">
      <path d="M-19 -50 L-19 -72 A19 19 0 0 1 19 -72 L19 -50" />
    </g>
    <circle cx="-19" cy="6" r="6" fill="{{bg}}" opacity="0.85" />`,
      ),
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    use: 'A dashboard with no data yet, or a reporting feature’s marketing slot. Three bars rising, which is the only chart shape that survives being this small.',
    viewBox: '-140 -190 280 250',
    solids: [
      shadow(0, 0, 2.8),
      box(-2.2, -2.2, 0, 4.4, 4.4, 0.3, 'tint'),
      box(-1.7, -0.5, 0.3, 1, 1, 1.2, 'base'),
      box(-0.5, -0.5, 0.3, 1, 1, 2.1, 'base'),
      box(0.7, -0.5, 0.3, 1, 1, 3, 'accent'),
    ],
  },
]

export function sceneById(id: string): Scene | undefined {
  return SCENES.find((s) => s.id === id)
}

/* ============================================================
 *  Rendering
 * ============================================================ */

export interface IllustrationOptions {
  sceneId: string
  paletteId?: string
  scheme?: AssetScheme
  /** Rendered width in px. The aspect ratio comes from the scene. */
  width?: number
  /**
   * The accessible name.
   *
   * Defaults to the scene's name. An illustration is usually decorative —
   * it sits above a heading that already says "No results" — so the panel
   * offers `aria-hidden` markup too, and says which is which. Getting this
   * wrong in the common direction (a long `alt` describing the drawing)
   * makes a screen reader recite a picture of a tray.
   */
  title?: string | null
}

export function buildIllustrationSvg(options: IllustrationOptions): string {
  const scene = sceneById(options.sceneId)
  if (!scene) throw new Error(`illustrations: no scene "${options.sceneId}"`)

  const palette = paletteById(options.paletteId ?? 'indigo')
  const scheme = options.scheme ?? 'auto'
  const swatch = swatchFor(palette, scheme)
  const ref = (tone: Tone) => swatchRef(tone, swatch)

  const body = depthSorted(scene.solids)
    .map((s) => {
      if (s.kind === 'box') return renderBox(s, ref(s.tone))
      if (s.kind === 'cyl') return renderCyl(s, ref(s.tone))
      if (s.kind === 'ball') return renderBall(s, ref(s.tone))
      // Decals name their tones by placeholder so a scene stays readable.
      return s.svg.replace(/\{\{(\w+)\}\}/g, (_m, tone: string) => ref(tone as Tone))
    })
    .join('\n')

  const [, , vbW, vbH] = scene.viewBox.split(' ').map(Number)
  const width = options.width ?? 320
  const height = Math.round((vbH / vbW) * width)

  return svgDocument({
    viewBox: scene.viewBox,
    body: `  <g>\n${body}\n  </g>`,
    style: paletteStyle(palette, scheme),
    title: options.title === undefined ? scene.name : options.title,
    rootAttrs: ` width="${width}" height="${height}" class="${paletteScopeClass(palette, scheme)}"`,
  })
}

export function buildIllustrationJsx(options: IllustrationOptions): string {
  const scene = sceneById(options.sceneId)
  return svgToJsx(buildIllustrationSvg(options), {
    componentName: componentName(scene?.name ?? 'scene', 'illustration'),
    typescript: true,
    currentColor: false,
    spreadProps: true,
  })
}

export function buildIllustrationDataUri(options: IllustrationOptions): string {
  return svgToDataUri(buildIllustrationSvg(options))
}

export function illustrationFileName(scene: Scene, paletteId: string): string {
  return `${scene.id}-${paletteId}.svg`
}

export function searchScenes(query: string): Scene[] {
  const q = query.trim().toLowerCase()
  if (!q) return SCENES
  return SCENES.filter(
    (s) => s.name.toLowerCase().includes(q) || s.id.includes(q) || s.use.toLowerCase().includes(q),
  )
}
