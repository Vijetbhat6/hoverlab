/**
 * Colour vision deficiency simulation.
 *
 * Two surfaces need this and they ask different questions of it. The
 * contrast checker asks about *one pair* — does this text still stand off
 * this background for someone who cannot see red — and the simulator asks
 * about *a whole palette*, where the failure is two categories collapsing
 * into one colour. Both are the same transform underneath, so it lives
 * here rather than being typed twice with the matrices drifting by a
 * decimal place.
 *
 * ON THE MODEL
 *
 * This is the Machado, Oliveira & Fernandes (2009) linear transform,
 * applied in linear-light sRGB, which is what the well-known simulators
 * use. It is a good model and it is not an eye. Two limits, stated here
 * and repeated on both pages rather than buried:
 *
 *   - Anomalous trichromacy at partial severity is interpolated towards
 *     identity instead of using the paper's per-severity matrices. Close,
 *     not exact.
 *   - A pass here means "no obvious collision", never "accessible".
 *     Colour should not be the only cue carrying a meaning, and no
 *     simulation can tell you whether you added a second one.
 *
 * The transform is only meaningful in linear light. Applying the matrix to
 * gamma-encoded values — which plenty of web simulators do — gives visibly
 * wrong, over-dark results.
 */

import { hexToRgb, rgbToHex, rgbToOklch, type RGB } from './color-tools'

export type VisionId =
  | 'normal'
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'achromatopsia'

export interface Vision {
  id: VisionId
  name: string
  /** Roughly how many people, so a finding has a size attached. */
  prevalence: string
  /** What is missing, and which pairs it collapses. Shown verbatim. */
  what: string
  /** Row-major 3x3 in linear-light sRGB. Identity for `normal`. */
  matrix: readonly number[]
}

export const IDENTITY: readonly number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1]

export const VISIONS: readonly Vision[] = [
  {
    id: 'normal',
    name: 'Typical vision',
    prevalence: 'the baseline',
    what: 'Your colours as authored.',
    matrix: IDENTITY,
  },
  {
    id: 'deuteranopia',
    name: 'Deuteranopia',
    prevalence: '~6% of men',
    what:
      'No functioning green cone. By far the most common form, and the one that collapses red-versus-green — which is exactly the pair most status colours use.',
    matrix: [
      0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294,
      0.968881,
    ],
  },
  {
    id: 'protanopia',
    name: 'Protanopia',
    prevalence: '~1% of men',
    what:
      'No functioning red cone. Similar confusions to deuteranopia, plus reds darken markedly — a red that looked bold becomes a muddy low-contrast brown.',
    matrix: [
      0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116,
      1.051998,
    ],
  },
  {
    id: 'tritanopia',
    name: 'Tritanopia',
    prevalence: '~0.01%, and not sex-linked',
    what:
      'No functioning blue cone. Rare, and it breaks blue-versus-green rather than red-versus-green — the pair a palette that was fixed for deuteranopia often lands on.',
    matrix: [
      1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367,
      0.3039,
    ],
  },
  {
    id: 'achromatopsia',
    name: 'Achromatopsia',
    prevalence: 'very rare — but this is also greyscale print',
    what:
      'No colour at all. Worth checking even though it is rare, because it is the same view as a black-and-white printout, a failing monitor, and a screenshot run through a greyscale filter.',
    matrix: [0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722],
  },
] as const

const VISION_BY_ID = new Map(VISIONS.map((v) => [v.id, v]))

/** One vision by id, falling back to typical vision rather than throwing. */
export function vision(id: VisionId): Vision {
  return VISION_BY_ID.get(id) ?? VISIONS[0]
}

/* sRGB <-> linear light. */
function toLinear(c: number): number {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

function toSrgb(c: number): number {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
  return Math.round(Math.min(1, Math.max(0, v)) * 255)
}

/**
 * Interpolate a matrix towards identity for partial severity.
 *
 * `severity` is 0-1. At 0 this returns identity, so a severity slider at
 * zero shows the colours untouched rather than something subtly shifted.
 */
export function atSeverity(matrix: readonly number[], severity: number): number[] {
  const t = Math.min(1, Math.max(0, severity))
  return matrix.map((v, i) => IDENTITY[i] + (v - IDENTITY[i]) * t)
}

/** The matrix for one vision type at one severity. */
export function visionMatrix(id: VisionId, severity = 1): number[] {
  const base = vision(id).matrix
  return id === 'normal' ? [...IDENTITY] : atSeverity(base, severity)
}

/** Apply a simulation matrix to a colour. Unparseable input comes back as-is. */
export function simulateHex(hex: string, matrix: readonly number[]): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const [r, g, b] = [toLinear(rgb.r), toLinear(rgb.g), toLinear(rgb.b)]
  const out: RGB = {
    r: toSrgb(matrix[0] * r + matrix[1] * g + matrix[2] * b),
    g: toSrgb(matrix[3] * r + matrix[4] * g + matrix[5] * b),
    b: toSrgb(matrix[6] * r + matrix[7] * g + matrix[8] * b),
  }
  return rgbToHex(out)
}

/** Convenience: simulate by vision id rather than by matrix. */
export function simulateVision(hex: string, id: VisionId, severity = 1): string {
  return simulateHex(hex, visionMatrix(id, severity))
}

/**
 * Perceptual distance in OKLab.
 *
 * OKLab rather than plain RGB distance because RGB distance is not a
 * measure of anything a person experiences — two colours 40 units apart in
 * RGB can be obviously different or indistinguishable depending entirely on
 * where they sit. OKLab is built so that euclidean distance approximates
 * perceived difference, which is the question being asked here.
 */
export function oklabDistance(a: string, b: string): number {
  const ra = hexToRgb(a)
  const rb = hexToRgb(b)
  if (!ra || !rb) return 1
  const toLab = (rgb: RGB) => {
    const { l, c, h } = rgbToOklch(rgb)
    return {
      L: l,
      a: c * Math.cos((h * Math.PI) / 180),
      b: c * Math.sin((h * Math.PI) / 180),
    }
  }
  const A = toLab(ra)
  const B = toLab(rb)
  return Math.sqrt((A.L - B.L) ** 2 + (A.a - B.a) ** 2 + (A.b - B.b) ** 2)
}

/**
 * Where "these two are now the same colour" starts.
 *
 * Calibrated against the case that matters: two categorical series in a
 * chart, seen as small swatches in a legend rather than as large blocks
 * side by side. 0.10 in OKLab is around where that pairing stops being
 * reliably separable at a glance; 0.05 is where it is plainly gone.
 */
export const COLLISION_THRESHOLD = 0.1
export const SEVERE_THRESHOLD = 0.05

export interface Collision<T> {
  a: T
  b: T
  distance: number
  /** Below `SEVERE_THRESHOLD` — not "hard to tell apart", but gone. */
  severe: boolean
}

/**
 * Every pair in a list that lands too close together once simulated.
 *
 * Takes the already-simulated hexes alongside the items they belong to, so
 * the caller keeps whatever labels it has and this stays free of UI types.
 */
export function findCollisions<T>(items: T[], simulated: string[]): Collision<T>[] {
  const out: Collision<T>[] = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const distance = oklabDistance(simulated[i], simulated[j])
      if (distance < COLLISION_THRESHOLD) {
        out.push({ a: items[i], b: items[j], distance, severe: distance < SEVERE_THRESHOLD })
      }
    }
  }
  return out
}
