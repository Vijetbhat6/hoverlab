/**
 * Avatars — drawn from a seed, in four styles.
 *
 * Untitled UI's 370 free avatars are photographs of people. They are lovely
 * and we cannot ship them: a photographic avatar is a real person's face
 * being used to stand in for a fictional user, which needs a release from
 * that person and a licence chain for the photograph, and the moment the set
 * ends up in a customer's shipped product neither of those covers it. Every
 * "free avatar pack" on the web quietly has this problem.
 *
 * So these are drawn, and they are drawn *from a seed*. The function is
 * `(seed, style, palette) => SVG`, which has four consequences worth the
 * trouble:
 *
 *   - Nobody's likeness is involved, because nobody's likeness is involved.
 *   - The set is as large as the caller needs. 370 is the number the grid
 *     shows, not the number of files in a folder.
 *   - The same seed is the same face forever, so `avatar(user.id)` is a
 *     stable identity for a row that has no uploaded picture — which is the
 *     actual job most people want an avatar pack for.
 *   - A palette change is one edit.
 *
 * The one rule that is easy to get wrong: **skin and hair tones do not
 * respond to the colour scheme.** Background and clothing do — an avatar on a
 * dark page needs a dark plate behind it. But a face that gets darker when
 * the reader turns on dark mode is a person changing colour, which is both
 * absurd and offensive, and it is exactly what falls out of running the whole
 * drawing through one palette. So the figure is drawn in fixed literals and
 * only the plate and the shirt reference the palette's variables.
 */

import {
  escapeXml,
  paletteById,
  svgDocument,
  swatchFor,
  swatchRef,
  paletteStyle,
  paletteScopeClass,
  componentName,
  type AssetScheme,
} from './asset-types'
import { svgToJsx, svgToDataUri } from '../svg-tools'

/* ============================================================
 *  Deterministic picking
 * ============================================================ */

/**
 * FNV-1a, 32-bit.
 *
 * Not for security — for the property that matters here, which is that two
 * seeds differing in one character land in unrelated places. `seed.length %
 * n` and `charCodeAt(0) % n` both look random and both produce a grid where
 * every "Alex" is the same face as every "Amy".
 */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * A stream of independent picks from one seed.
 *
 * Each call advances the state, so `pick(hair)` and `pick(mouth)` are not
 * correlated. Deriving every feature from `hash % n` directly does correlate
 * them — with two lists of the same length you get a set where the hair
 * always predicts the mouth, and the grid looks like eight avatars repeated.
 */
function picker(seed: string) {
  let state = hashSeed(seed) || 1
  return function next<T>(from: readonly T[]): T {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    return from[state % from.length]
  }
}

/* ============================================================
 *  Styles
 * ============================================================ */

export type AvatarStyle = 'face' | 'beam' | 'ring' | 'blocks'

export interface AvatarStyleMeta {
  id: AvatarStyle
  name: string
  note: string
}

export const AVATAR_STYLES: AvatarStyleMeta[] = [
  {
    id: 'face',
    name: 'Face',
    note: 'A drawn character. The one to use where the design needs to read as a person — a testimonial, a team grid, a comment thread.',
  },
  {
    id: 'beam',
    name: 'Beam',
    note: 'Overlapping soft shapes. No face at all, which is the honest choice for a user you have never met and the reason most products now default to something like it.',
  },
  {
    id: 'ring',
    name: 'Ring',
    note: 'Concentric arcs. Reads as a token rather than a person, and survives being rendered at 20px in a table cell, which the face does not.',
  },
  {
    id: 'blocks',
    name: 'Blocks',
    note: 'A mirrored 5×5 grid — the identicon shape. Maximum distinguishability per pixel, for a dense list where the avatar is a wayfinding mark and nothing else.',
  },
]

/* ---------------------------- Tones ------------------------------ */

/**
 * Illustrative, not a taxonomy.
 *
 * Six tones spread across the range, chosen so any two are distinguishable at
 * 24px. They are explicitly not an attempt to enumerate human skin colour —
 * a drawn avatar is a drawing, and a set of six swatches presented as the
 * categories of people would be worse than one of twenty.
 */
const SKIN = ['#f3d2bc', '#e8b894', '#c68863', '#a2653f', '#75492c', '#4a2c1a'] as const
const HAIR = ['#1f1a17', '#3b2a20', '#6b4a2f', '#a8703c', '#c9a227', '#8a8f98', '#e8e3dd'] as const

/* ============================================================
 *  Features
 * ============================================================ */

/*
  Geometry notes, once, for all of it:

  The viewBox is 64×64 and the figure is drawn to a 64×64 grid with the head
  centred at (32, 30). Everything is circles, ellipses, rects and short paths
  — no curves that need to be eyeballed — because these are generated in
  thousands of combinations and a shape that only looks right next to one
  hairstyle is a bug that appears in a customer's grid rather than in ours.

  The plate is a full-bleed rect with a radius rather than a circle, so the
  caller decides the shape with `border-radius` on the element. A circle baked
  into the file cannot be made square again; a square can always be clipped.
*/

/**
 * Hair, in two pieces, and the two pieces are the whole lesson.
 *
 * The first draft drew every hairstyle as one path on top of the head. It
 * works for a crop and a fringe, which only occupy the forehead, and it fails
 * completely for anything with volume: "long" and "afro" are shapes that are
 * mostly *behind* the head, so drawn on top they paint a solid block over the
 * face. Eyes and mouth then land on that block and the avatar reads as a
 * person wearing a mask.
 *
 * So a style is `back` (drawn before the head, and therefore occluded by it)
 * and `front` (drawn after, and therefore only ever a hairline). Volume goes
 * in `back` and can be as large as it likes — the head paints over its middle
 * and leaves exactly the silhouette that was wanted.
 */
interface HairStyle {
  back?: string
  front?: string
}

const HAIR_STYLES: readonly HairStyle[] = [
  // Short crop
  { front: 'M15 28a17 17 0 0 1 34 0c0-12-7-17-17-17s-17 5-17 17Z' },
  // Side part
  { front: 'M15 27c0-11 7-16 17-16 4 0 9 1 12 5-6 1-13 3-17 8-4 4-9 4-12 3Z' },
  // Buzz
  { front: 'M16 26a16 16 0 0 1 32 0c-2-9-8-14-16-14s-14 5-16 14Z' },
  // Long, past the shoulders
  {
    back: 'M12 32c0-14 9-21 20-21s20 7 20 21c0 9 1 15 3 21H9c2-6 3-12 3-21Z',
    front: 'M15 27c0-11 7-16 17-16s17 5 17 16c-3-4-8-6-12-5-5 1-10 1-14-1-3-1-6 2-8 6Z',
  },
  // Bun
  {
    front:
      'M15 28a17 17 0 0 1 34 0c0-12-7-17-17-17s-17 5-17 17Zm17-22a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z',
  },
  // Curls
  {
    front:
      'M15 29a17 17 0 0 1 34 0c-1-4-4-5-6-4 1-4-2-7-5-6 0-4-4-6-7-4-3-2-7 0-7 4-3-1-6 2-5 6-2-1-5 0-4 4Z',
  },
  // Fringe
  { front: 'M15 27c0-11 7-16 17-16s17 5 17 16c-3-3-7-5-11-4-4 1-8 1-12 0-4-1-8 1-11 4Z' },
  // Afro
  {
    back: 'M32 4c12 0 21 9 21 20s-9 20-21 20-21-9-21-20S20 4 32 4Z',
    front: 'M16 26a16 16 0 0 1 32 0c-3-8-9-12-16-12s-13 4-16 12Z',
  },
  // Top knot with undercut
  {
    front:
      'M18 26c0-10 6-15 14-15s14 5 14 15c-2-6-6-9-14-9s-12 3-14 9Zm14-18c-3 0-5-2-5-4s2-3 5-3 5 1 5 3-2 4-5 4Z',
  },
  // Bald — the empty entry is deliberate and must stay in the list
  {},
]

const EYES: readonly string[] = [
  // Dots
  '<circle cx="25" cy="30" r="1.8" fill="#2b2b2b" /><circle cx="39" cy="30" r="1.8" fill="#2b2b2b" />',
  // Closed, content
  '<path d="M22 30q3 2.5 6 0M36 30q3 2.5 6 0" stroke="#2b2b2b" stroke-width="1.6" fill="none" stroke-linecap="round" />',
  // Open, with a lid line
  '<circle cx="25" cy="30" r="2.4" fill="#fff" stroke="#2b2b2b" stroke-width="1.2" /><circle cx="39" cy="30" r="2.4" fill="#fff" stroke="#2b2b2b" stroke-width="1.2" /><circle cx="25" cy="30.4" r="1.1" fill="#2b2b2b" /><circle cx="39" cy="30.4" r="1.1" fill="#2b2b2b" />',
  // Almond
  '<path d="M22 30q3-3 6 0q-3 3-6 0Zm14 0q3-3 6 0q-3 3-6 0Z" fill="#2b2b2b" />',
  // Wide
  '<circle cx="25" cy="30" r="2.8" fill="#fff" stroke="#2b2b2b" stroke-width="1.2" /><circle cx="39" cy="30" r="2.8" fill="#fff" stroke="#2b2b2b" stroke-width="1.2" /><circle cx="25.6" cy="30" r="1.3" fill="#2b2b2b" /><circle cx="39.6" cy="30" r="1.3" fill="#2b2b2b" />',
]

const MOUTHS: readonly string[] = [
  '<path d="M28 38q4 3.5 8 0" stroke="#9a5b4a" stroke-width="1.8" fill="none" stroke-linecap="round" />',
  '<path d="M29 38h6" stroke="#9a5b4a" stroke-width="1.8" fill="none" stroke-linecap="round" />',
  '<ellipse cx="32" cy="38.5" rx="2.4" ry="2" fill="#9a5b4a" />',
  '<path d="M27 37q5 5 10 0Z" fill="#9a5b4a" />',
  '<path d="M28 39q4-3 8 0" stroke="#9a5b4a" stroke-width="1.8" fill="none" stroke-linecap="round" />',
]

const FACIAL_HAIR: readonly ((hair: string) => string)[] = [
  () => '',
  // Stubble
  (hair) => `<path d="M22 34q10 10 20 0q-2 11-10 11t-10-11Z" fill="${hair}" opacity="0.22" />`,
  // Full beard
  (hair) => `<path d="M21 32q0 16 11 16t11-16q-3 8-11 8t-11-8Z" fill="${hair}" />`,
  // Moustache
  (hair) => `<path d="M27 35q5 2.5 10 0q-2 2.5-5 2.5t-5-2.5Z" fill="${hair}" />`,
]

const ACCESSORIES: readonly ((accent: string) => string)[] = [
  () => '',
  // Glasses
  (accent) =>
    `<g fill="none" stroke="${accent}" stroke-width="1.6"><circle cx="25" cy="30" r="5" /><circle cx="39" cy="30" r="5" /><path d="M30 30h4M20 29l-4-2M44 29l4-2" /></g>`,
  // Headphones
  (accent) =>
    `<g fill="${accent}"><path d="M16 31a16 16 0 0 1 32 0v2h-3v-2a13 13 0 0 0-26 0v2h-3Z" /><rect x="13" y="31" width="6" height="10" rx="3" /><rect x="45" y="31" width="6" height="10" rx="3" /></g>`,
  // Earrings
  (accent) => `<circle cx="16" cy="34" r="1.8" fill="${accent}" /><circle cx="48" cy="34" r="1.8" fill="${accent}" />`,
  // Cap
  (accent) =>
    `<g fill="${accent}"><path d="M16 24a16 16 0 0 1 32 0Z" /><path d="M46 24h8a2 2 0 0 1 0 4H44Z" /></g>`,
]

const SHIRTS: readonly ((fill: string, ink: string) => string)[] = [
  // Crew neck
  (fill) => `<path d="M14 64c0-9 8-14 18-14s18 5 18 14Z" fill="${fill}" />`,
  // Collar
  (fill, ink) =>
    `<path d="M14 64c0-9 8-14 18-14s18 5 18 14Z" fill="${fill}" /><path d="M26 51l6 7 6-7" fill="none" stroke="${ink}" stroke-width="1.6" opacity="0.5" />`,
  // V-neck
  (fill) => `<path d="M14 64c0-9 8-14 18-14s18 5 18 14Z" fill="${fill}" /><path d="M27 51l5 8 5-8" fill="#ffffff" opacity="0.18" />`,
  // Hoodie
  (fill, ink) =>
    `<path d="M12 64c0-10 9-15 20-15s20 5 20 15Z" fill="${fill}" /><path d="M32 50v9" stroke="${ink}" stroke-width="1.4" opacity="0.45" />`,
]

/* ============================================================
 *  Rendering
 * ============================================================ */

export interface AvatarOptions {
  seed: string
  style?: AvatarStyle
  paletteId?: string
  scheme?: AssetScheme
  size?: number
  /**
   * The accessible name, or `null` for a decorative avatar.
   *
   * Null is the right default and the opposite of what avatar libraries do.
   * An avatar next to a name is decorative — announcing "avatar of Jordan
   * Reyes" immediately before the text "Jordan Reyes" is the most common
   * double-announcement in a user list. A name is only correct when the
   * avatar is the *only* identification, which the caller knows and this
   * function cannot.
   */
  title?: string | null
}

interface ResolvedAvatar {
  seed: string
  style: AvatarStyle
  size: number
  scheme: AssetScheme
  paletteId: string
}

function resolveAvatar(o: AvatarOptions): ResolvedAvatar {
  return {
    seed: o.seed,
    style: o.style ?? 'face',
    size: o.size ?? 96,
    scheme: o.scheme ?? 'auto',
    paletteId: o.paletteId ?? 'indigo',
  }
}

function plate(fill: string): string {
  return `  <rect width="64" height="64" rx="12" fill="${fill}" />`
}

function faceBody(seed: string, accentRef: string, inkRef: string): string {
  const pick = picker(seed)
  const skin = pick(SKIN)
  const hair = pick(HAIR)
  const style = pick(HAIR_STYLES)
  const eyes = pick(EYES)
  const mouth = pick(MOUTHS)
  const beard = pick(FACIAL_HAIR)(hair)
  const accessory = pick(ACCESSORIES)(accentRef)
  const shirt = pick(SHIRTS)(accentRef, inkRef)

  // Painter order, and every line of it matters: shirt, the hair that is
  // behind the head, the ears, the head itself, the beard on the jaw, the
  // hairline, then the features, then anything worn.
  return [
    shirt,
    style.back && `  <path d="${style.back}" fill="${hair}" />`,
    `  <circle cx="17" cy="32" r="3" fill="${skin}" />`,
    `  <circle cx="47" cy="32" r="3" fill="${skin}" />`,
    `  <ellipse cx="32" cy="31" rx="15" ry="17" fill="${skin}" />`,
    beard && `  ${beard}`,
    style.front && `  <path d="${style.front}" fill="${hair}" />`,
    `  ${eyes}`,
    `  ${mouth}`,
    accessory && `  ${accessory}`,
  ]
    .filter(Boolean)
    .join('\n')
}

/*
  The abstract styles only ever draw with `accent` and `base`, never with
  `ink` and never with the plate's own `tint`.

  That is a contrast rule rather than a taste one. `ink` is near-black in
  light and near-white in dark, so an `ink` blob covering half the tile
  inverts between schemes and reads as a different avatar; `base` against a
  `tint` plate is two steps of the same hue and produces a tile that looks
  blank at 24px. Both were in the first version and both showed up as
  "some of these are empty" the moment the set was seen as a grid.
*/
function beamBody(seed: string, accent: string, base: string): string {
  const cx = 20 + (hashSeed(`${seed}x`) % 24)
  const cy = 20 + (hashSeed(`${seed}y`) % 24)
  const rot = hashSeed(`${seed}r`) % 90
  return [
    `  <circle cx="${cx}" cy="${cy}" r="22" fill="${accent}" />`,
    `  <rect x="${64 - cx - 10}" y="${cy - 4}" width="34" height="34" rx="10" fill="${base}" transform="rotate(${rot} 32 32)" opacity="0.9" />`,
    `  <circle cx="${64 - cx}" cy="${64 - cy}" r="10" fill="${accent}" opacity="0.75" />`,
  ].join('\n')
}

function ringBody(seed: string, accent: string, base: string): string {
  const rings = 3 + (hashSeed(`${seed}n`) % 3)
  /*
    Concentric rings alone give three distinct pictures — one per ring count —
    and a grid of them reads as three images repeated, which is the failure
    the whole generator exists to avoid. Drifting the centre a little per ring
    turns the same three counts into an eccentric target that differs seed by
    seed. The drift is capped at 6 units so the outermost ring always stays
    inside the tile.
  */
  const dx = ((hashSeed(`${seed}dx`) % 13) - 6) / 4
  const dy = ((hashSeed(`${seed}dy`) % 13) - 6) / 4
  const out: string[] = []
  for (let i = 0; i < rings; i++) {
    const r = 26 - i * (22 / rings)
    // The outermost ring is always the accent, so every tile has one strong
    // edge no matter how the rest alternates.
    out.push(
      `  <circle cx="${round1(32 + dx * i)}" cy="${round1(32 + dy * i)}" r="${round1(r)}" fill="${
        i % 2 === 0 ? accent : base
      }" />`,
    )
  }
  return out.join('\n')
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * The identicon grid, mirrored about the vertical axis.
 *
 * Mirroring halves the entropy and is worth it: an asymmetric 5×5 of random
 * cells reads as noise, and a symmetric one reads as a mark. That is the
 * whole trick behind every identicon that has ever looked deliberate.
 */
function blocksBody(seed: string, fill: string): string {
  const h = hashSeed(seed)
  const cells: string[] = []
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 5; row++) {
      const bit = (h >>> (col * 5 + row)) & 1
      if (!bit) continue
      for (const c of col === 2 ? [2] : [col, 4 - col]) {
        cells.push(
          `  <rect x="${2 + c * 12}" y="${2 + row * 12}" width="12" height="12" fill="${fill}" />`,
        )
      }
    }
  }
  // A seed whose bits all land on zero would render an empty tile. One
  // guaranteed cell is cheaper than rejecting and rehashing the seed, and
  // keeps the function total.
  if (cells.length === 0) cells.push(`  <rect x="26" y="26" width="12" height="12" fill="${fill}" />`)
  return cells.join('\n')
}

export function buildAvatarSvg(options: AvatarOptions): string {
  const r = resolveAvatar(options)
  const palette = paletteById(r.paletteId)
  const swatch = swatchFor(palette, r.scheme)
  const bg = swatchRef('tint', swatch)
  const accent = swatchRef('accent', swatch)
  const ink = swatchRef('ink', swatch)
  const base = swatchRef('base', swatch)

  const body =
    r.style === 'face'
      ? faceBody(r.seed, accent, ink)
      : r.style === 'beam'
        ? beamBody(r.seed, accent, base)
        : r.style === 'ring'
          ? ringBody(r.seed, accent, base)
          : blocksBody(r.seed, accent)

  return svgDocument({
    viewBox: '0 0 64 64',
    size: r.size,
    body: [plate(bg), body].join('\n'),
    style: paletteStyle(palette, r.scheme),
    title: options.title === undefined ? null : options.title,
    rootAttrs: ` class="${paletteScopeClass(palette, r.scheme)}"`,
  })
}

export function buildAvatarJsx(options: AvatarOptions): string {
  const r = resolveAvatar(options)
  return svgToJsx(buildAvatarSvg(options), {
    componentName: componentName('avatar', r.style, r.seed),
    typescript: true,
    currentColor: false,
    spreadProps: true,
  })
}

export function buildAvatarDataUri(options: AvatarOptions): string {
  return svgToDataUri(buildAvatarSvg(options))
}

/* ============================================================
 *  The browsable set
 * ============================================================ */

/**
 * Invented names, used as the seeds.
 *
 * Seeds could be `avatar-001`, and the faces would be identical. Names are
 * here because the grid is also where someone copies a *row* of placeholder
 * data — a name, a role and a face that belong together — and because
 * `avatar('Priya Raman')` is a seed a reader can check is stable.
 *
 * Deliberately spread across naming traditions. A placeholder set of thirty
 * Anglophone names is how a product ends up with a sign-up form that breaks
 * on a diacritic.
 */
const GIVEN = [
  'Amara', 'Priya', 'Jonas', 'Yusuf', 'Mei', 'Tomás', 'Nadia', 'Kofi', 'Sofia', 'Arjun',
  'Leila', 'Hugo', 'Zainab', 'Ravi', 'Elif', 'Mateo', 'Ingrid', 'Hiro', 'Chiara', 'Omar',
  'Anika', 'Dmitri', 'Fatima', 'Liam', 'Sanne', 'Tariq', 'Yuki', 'Camila', 'Noah', 'Aisha',
  'Bogdan', 'Marisol', 'Kenji', 'Thandiwe', 'Rafael', 'Ayla', 'Soren', 'Nia', 'Pablo', 'Ines',
]
const FAMILY = [
  'Okonkwo', 'Raman', 'Lindqvist', 'Demir', 'Chen', 'Ferreira', 'Haddad', 'Mensah', 'Duarte', 'Iyer',
  'Nasser', 'Moreau', 'Bello', 'Kapoor', 'Yilmaz', 'Castillo', 'Halvorsen', 'Tanaka', 'Ricci', 'Aziz',
  'Mbeki', 'Petrov', 'Rahimi', 'Walsh', 'de Vries', 'Farouk', 'Sato', 'Quintero', 'Hansen', 'Diallo',
]
const ROLES = [
  'Product designer', 'Staff engineer', 'Head of support', 'Data analyst', 'Founder',
  'Content lead', 'Solutions architect', 'QA engineer', 'Recruiter', 'Finance lead',
]

export interface AvatarEntry {
  /** `face-amara-okonkwo`. The URL slug and the download name. */
  id: string
  seed: string
  style: AvatarStyle
  name: string
  role: string
}

/**
 * The grid, built rather than listed.
 *
 * Every style gets every name, which is what makes "370 avatars" a shape
 * rather than a claim: four styles across ninety-three name pairings, and the
 * count is the length of this array.
 */
export const AVATAR_SET: AvatarEntry[] = (() => {
  const out: AvatarEntry[] = []
  const pairs: { name: string; role: string }[] = []
  for (let i = 0; i < 93; i++) {
    const name = `${GIVEN[i % GIVEN.length]} ${FAMILY[(i * 7) % FAMILY.length]}`
    pairs.push({ name, role: ROLES[i % ROLES.length] })
  }
  for (const style of AVATAR_STYLES) {
    for (const p of pairs) {
      out.push({
        id: `${style.id}-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        seed: p.name,
        style: style.id,
        name: p.name,
        role: p.role,
      })
    }
  }
  return out
})()

export function avatarById(id: string): AvatarEntry | undefined {
  return AVATAR_SET.find((a) => a.id === id)
}

/** `face-amara-okonkwo.svg`. */
export function avatarFileName(entry: AvatarEntry): string {
  return `avatar-${entry.id}.svg`
}

export function searchAvatars(query: string): AvatarEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return AVATAR_SET
  return AVATAR_SET.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q) ||
      a.style.includes(q),
  )
}

/** Used by the detail panel's "as data" sample. */
export function avatarPlaceholderRow(entry: AvatarEntry): string {
  return `{ name: ${JSON.stringify(entry.name)}, role: ${JSON.stringify(
    entry.role,
  )}, avatar: avatar(${JSON.stringify(entry.seed)}) }`
}

/** Escaped for a `<title>` when the caller does want a name. */
export function avatarTitle(entry: AvatarEntry): string {
  return escapeXml(entry.name)
}
