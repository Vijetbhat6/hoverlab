/**
 * Logos — invented brands, for the mockup you are filling in.
 *
 * The reason a free logo pack exists at all: a logo cloud, a testimonial
 * attribution, an integrations grid and an invoice header all need a company
 * that is not real. What people reach for instead is a row of actual
 * trademarks — Google, Stripe, Airbnb — which is trademark use in a published
 * design, on a page that frequently implies a customer relationship that does
 * not exist. It is the single most common legal mistake in a landing page.
 *
 * So: invented names, generated marks. Nobody's trademark, no attribution,
 * and the set is a crossing of thirty names with six mark families rather
 * than a folder of 180 files.
 *
 * Two decisions that are easy to get wrong:
 *
 *   - **A `mono` variant ships alongside the coloured one**, because that is
 *     what a logo cloud actually needs. Six brand colours in a strip reads as
 *     a fruit bowl; every real logo wall is one muted ink. Generators that
 *     only emit the brand colour guarantee the consumer hand-edits every file.
 *
 *   - **The wordmark is `<text>`, not outlines**, and the limitation is stated
 *     rather than hidden: a downloaded file renders the name in the reader's
 *     own sans-serif, so it is a *placeholder* wordmark and will shift between
 *     machines. Converting type to paths needs a font binary and a glyph
 *     rasteriser, which is a real dependency to ship for a fake logo. The
 *     mark-only lockup has no such problem and is the default.
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
} from './asset-types'
import { svgToDataUri, svgToJsx } from '../svg-tools'
import { hashSeed } from './avatars'

/* ============================================================
 *  Mark families
 * ============================================================ */

export type LogoFamily = 'monogram' | 'orbit' | 'prism' | 'stack' | 'aperture' | 'knot'

export interface LogoFamilyMeta {
  id: LogoFamily
  name: string
  note: string
}

export const LOGO_FAMILIES: LogoFamilyMeta[] = [
  {
    id: 'monogram',
    name: 'Monogram',
    note: 'The initial in a rounded tile. The most common real-world shape by a distance, and the only family that still reads at 16px in a browser tab.',
  },
  {
    id: 'orbit',
    name: 'Orbit',
    note: 'A ring with one satellite. Says platform, network, integration — which is why half of developer-tooling has one.',
  },
  {
    id: 'prism',
    name: 'Prism',
    note: 'Two overlapping triangles with a multiply blend. The 2019–2023 house style: gradient-adjacent, abstract, says nothing, looks current.',
  },
  {
    id: 'stack',
    name: 'Stack',
    note: 'Offset bars. Reads as layers or as data, and is the family that survives being set in one colour with no loss at all.',
  },
  {
    id: 'aperture',
    name: 'Aperture',
    note: 'Rotational blades around a centre. Busy at small sizes and excellent large — for a mark that has to carry a hero rather than a favicon.',
  },
  {
    id: 'knot',
    name: 'Knot',
    note: 'Two interlocking rounded squares. The partnership and merge shape, and the one that looks most like it cost money.',
  },
]

export function logoFamilyById(id: string): LogoFamilyMeta {
  return LOGO_FAMILIES.find((f) => f.id === id) ?? LOGO_FAMILIES[0]
}

/* ============================================================
 *  Marks
 * ============================================================ */

/*
  Every mark is drawn inside a 32×32 box with two units of padding, so the
  optical weight is comparable across families and a lockup can place the
  wordmark at a fixed offset without measuring anything.
*/
const MARK_BOX = 32

/**
 * The four colours a mark may draw with.
 *
 * `bg` is in here for one reason, and it is a bug that shipped in the first
 * draft: the monogram's letter was `#ffffff`, which is correct on a coloured
 * tile in light mode and **invisible** on the mono variant in dark mode,
 * where the tile is the near-white ink. A knocked-out glyph must be the
 * colour of the page behind the mark, never a literal white.
 */
interface MarkColors {
  accent: string
  base: string
  bg: string
  ink: string
}

type MarkFn = (seed: number, c: MarkColors) => string

const MARKS: Record<LogoFamily, MarkFn> = {
  monogram: (seed, { accent, bg }) =>
    // The letter is not drawn — it is `<text>`, for the same reason the
    // wordmark is, and it is a single glyph so the variance between fonts is
    // small enough not to matter.
    [
      `  <rect width="32" height="32" rx="${8 + (seed % 3) * 2}" fill="${accent}" />`,
      `  <text x="16" y="22" text-anchor="middle" font-family="${FONT_STACK}" font-size="17" font-weight="700" fill="${bg}">{{INITIAL}}</text>`,
    ].join('\n'),

  orbit: (seed, { accent, base }) => {
    const angle = (seed % 8) * 45
    return [
      `  <circle cx="16" cy="16" r="10" fill="none" stroke="${base}" stroke-width="3.5" />`,
      `  <circle cx="16" cy="16" r="10" fill="none" stroke="${accent}" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="20 43" transform="rotate(${angle} 16 16)" />`,
      `  <circle cx="26" cy="16" r="4" fill="${accent}" transform="rotate(${angle} 16 16)" />`,
    ].join('\n')
  },

  prism: (seed, { accent, base }) => {
    // The second triangle leans left or right off the first. Both stay inside
    // the box at either lean, which is why the offset is 5 and not 8.
    const lean = seed % 2 === 0 ? 5 : -5
    return [
      `  <path d="M16 3 L29 27 L3 27 Z" fill="${base}" />`,
      `  <path d="M${16 + lean} 9 L${29 + lean} 29 L${3 + lean} 29 Z" fill="${accent}" style="mix-blend-mode: multiply" opacity="0.85" />`,
    ].join('\n')
  },

  stack: (seed, { accent, base }) => {
    const rows = 3 + (seed % 2)
    const out: string[] = []
    for (let i = 0; i < rows; i++) {
      const w = 26 - i * 4
      const x = 3 + (i % 2 === 0 ? 0 : 4)
      out.push(
        `  <rect x="${x}" y="${4 + i * 7}" width="${w}" height="5" rx="2.5" fill="${
          i === 0 ? accent : base
        }" />`,
      )
    }
    return out.join('\n')
  },

  /*
    Blades with gaps between them.

    The first version filled the whole circle — each wedge spanning a full
    360/n — which is not an aperture, it is a pie chart, and it read as one.
    An aperture is legible because of the gaps: the blades have to stop short
    of each other. `SPAN` is the fraction of its slot each blade occupies, and
    0.62 is the point where the shape still reads as closing at four blades
    and has not become a windmill at three.
  */
  aperture: (seed, { accent, base }) => {
    const blades = 3 + (seed % 3)
    const slot = 360 / blades
    const span = slot * 0.62
    const rad = (deg: number) => (deg * Math.PI) / 180
    const at = (deg: number, r: number) =>
      `${Math.round((16 + r * Math.sin(rad(deg))) * 100) / 100} ${
        Math.round((16 - r * Math.cos(rad(deg))) * 100) / 100
      }`
    const out: string[] = []
    for (let i = 0; i < blades; i++) {
      const start = slot * i
      out.push(
        `  <path d="M ${at(start, 5)} L ${at(start, 14)} A 14 14 0 0 1 ${at(
          start + span,
          14,
        )} L ${at(start + span, 5)} A 5 5 0 0 0 ${at(start, 5)} Z" fill="${
          i === 0 ? accent : base
        }" />`,
      )
    }
    return out.join('\n')
  },

  knot: (seed, { accent, base }) => {
    const gap = 2 + (seed % 3)
    return [
      `  <rect x="3" y="3" width="17" height="17" rx="5" fill="none" stroke="${base}" stroke-width="4" />`,
      `  <rect x="${9 + gap}" y="${9 + gap}" width="17" height="17" rx="5" fill="none" stroke="${accent}" stroke-width="4" />`,
    ].join('\n')
  },
}

const FONT_STACK =
  'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'

/* ============================================================
 *  Lockups
 * ============================================================ */

export type LogoLockup = 'mark' | 'horizontal' | 'stacked'

export const LOGO_LOCKUPS: { id: LogoLockup; name: string; note: string }[] = [
  { id: 'mark', name: 'Mark only', note: 'The square. For a favicon, an avatar slot or a dense grid.' },
  {
    id: 'horizontal',
    name: 'Horizontal',
    note: 'Mark then name. The navbar lockup, and the one a logo cloud wants.',
  },
  {
    id: 'stacked',
    name: 'Stacked',
    note: 'Mark above name, centred. For a card, a footer column or a sign-in screen.',
  },
]

export interface LogoOptions {
  name: string
  family?: LogoFamily
  lockup?: LogoLockup
  paletteId?: string
  scheme?: AssetScheme
  /**
   * One ink instead of the palette.
   *
   * Not a greyscale filter — it redraws the mark with `accent` and `base`
   * collapsed onto the same colour, which is what a real single-colour logo
   * variant is. Desaturating the coloured version leaves two different greys
   * and a mark that looks like a printing error.
   */
  mono?: boolean
  /** Rendered height in px. Width follows the lockup. */
  height?: number
  title?: string | null
}

interface ResolvedLogo {
  name: string
  family: LogoFamily
  lockup: LogoLockup
  paletteId: string
  scheme: AssetScheme
  mono: boolean
  height: number
}

function resolveLogo(o: LogoOptions): ResolvedLogo {
  return {
    name: o.name,
    family: o.family ?? 'monogram',
    lockup: o.lockup ?? 'horizontal',
    paletteId: o.paletteId ?? 'indigo',
    scheme: o.scheme ?? 'auto',
    mono: o.mono ?? false,
    height: o.height ?? 32,
  }
}

/**
 * Width of the wordmark, estimated.
 *
 * There is no text measurement available here — no DOM, no font metrics — so
 * the viewBox is sized from a per-character average. It is approximate by
 * construction, and the consequence is deliberately chosen: the estimate runs
 * slightly WIDE, so a long name ends with a little too much space rather than
 * being clipped by the viewBox. Erring the other way truncates the brand
 * name, which is the one thing a logo must never do.
 */
function wordmarkWidth(name: string, fontSize: number): number {
  const narrow = (name.match(/[iIlLjt1.,' ]/g) ?? []).length
  const wide = (name.match(/[mMwW]/g) ?? []).length
  const units = name.length - narrow - wide + narrow * 0.45 + wide * 1.45
  return Math.ceil(units * fontSize * 0.58)
}

function markFor(r: ResolvedLogo, colors: MarkColors): string {
  const seed = hashSeed(`${r.name}:${r.family}`)
  const body = MARKS[r.family](seed, colors)
  const initial = r.name.trim().charAt(0).toUpperCase() || 'A'
  return body.replace('{{INITIAL}}', initial)
}

export function buildLogoSvg(options: LogoOptions): string {
  const r = resolveLogo(options)
  const palette = paletteById(r.paletteId)
  const swatch = swatchFor(palette, r.scheme)

  const ink = swatchRef('ink', swatch)
  const mark = markFor(r, {
    accent: r.mono ? ink : swatchRef('accent', swatch),
    base: r.mono ? ink : swatchRef('base', swatch),
    bg: swatchRef('bg', swatch),
    ink,
  })
  const fontSize = 17
  const wordWidth = wordmarkWidth(r.name, fontSize)

  let viewBox: string
  let body: string

  if (r.lockup === 'mark') {
    viewBox = `0 0 ${MARK_BOX} ${MARK_BOX}`
    body = mark
  } else if (r.lockup === 'horizontal') {
    const gap = 10
    const width = MARK_BOX + gap + wordWidth
    viewBox = `0 0 ${width} ${MARK_BOX}`
    body = [
      mark,
      `  <text x="${MARK_BOX + gap}" y="22" font-family="${FONT_STACK}" font-size="${fontSize}" font-weight="650" letter-spacing="-0.4" fill="${ink}">${escapeText(
        r.name,
      )}</text>`,
    ].join('\n')
  } else {
    const width = Math.max(MARK_BOX, wordWidth)
    const height = MARK_BOX + 20
    viewBox = `0 0 ${width} ${height}`
    body = [
      `  <g transform="translate(${(width - MARK_BOX) / 2} 0)">\n${mark}\n  </g>`,
      `  <text x="${width / 2}" y="${
        height - 3
      }" text-anchor="middle" font-family="${FONT_STACK}" font-size="14" font-weight="650" letter-spacing="-0.2" fill="${ink}">${escapeText(
        r.name,
      )}</text>`,
    ].join('\n')
  }

  const [, , vbW, vbH] = viewBox.split(' ').map(Number)
  // Height is the stated dimension and width follows, because a lockup lines
  // up with text beside it by cap height, never by total width.
  const scaled = Math.round((vbW / vbH) * r.height)

  return svgDocument({
    viewBox,
    body,
    style: paletteStyle(palette, r.scheme),
    title: options.title === undefined ? r.name : options.title,
    rootAttrs: ` width="${scaled}" height="${r.height}" class="${paletteScopeClass(palette, r.scheme)}"`,
  })
}

function escapeText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function buildLogoJsx(options: LogoOptions): string {
  const r = resolveLogo(options)
  return svgToJsx(buildLogoSvg(options), {
    componentName: componentName(r.name, 'logo'),
    typescript: true,
    currentColor: false,
    spreadProps: true,
  })
}

export function buildLogoDataUri(options: LogoOptions): string {
  return svgToDataUri(buildLogoSvg(options))
}

/* ============================================================
 *  The browsable set
 * ============================================================ */

/**
 * Thirty invented companies, each with the industry it is pretending to be
 * in.
 *
 * The industry is not decoration: a logo cloud is only convincing if the
 * companies look like they belong in the same sentence, and a filter by
 * industry is the only way to pick six that do. Names were checked to be
 * pronounceable and were deliberately built from common morphemes rather than
 * invented letter soup, which is what makes a fake brand read as fake.
 */
export interface LogoBrand {
  name: string
  industry: string
}

export const LOGO_BRANDS: LogoBrand[] = [
  { name: 'Northwind', industry: 'Logistics' },
  { name: 'Quartzly', industry: 'Analytics' },
  { name: 'Halyard', industry: 'Fintech' },
  { name: 'Meridia', industry: 'Healthcare' },
  { name: 'Cobalt Loop', industry: 'Infrastructure' },
  { name: 'Tessellate', industry: 'Design tools' },
  { name: 'Vantik', industry: 'Security' },
  { name: 'Orchard & Co', industry: 'Retail' },
  { name: 'Lumenpath', industry: 'Energy' },
  { name: 'Ferrous', industry: 'Manufacturing' },
  { name: 'Perihelion', industry: 'Space' },
  { name: 'Saltwater', industry: 'Hospitality' },
  { name: 'Kestrel Labs', industry: 'Biotech' },
  { name: 'Obsidia', industry: 'Data' },
  { name: 'Pivotal Yard', industry: 'Construction' },
  { name: 'Velour', industry: 'Fashion' },
  { name: 'Axiomatic', industry: 'Education' },
  { name: 'Birchwood', industry: 'Real estate' },
  { name: 'Cadence Nine', industry: 'Music' },
  { name: 'Driftless', industry: 'Travel' },
  { name: 'Ember Grid', industry: 'Utilities' },
  { name: 'Forthright', industry: 'Legal' },
  { name: 'Glasshouse', industry: 'Media' },
  { name: 'Hinterland', industry: 'Agriculture' },
  { name: 'Isobar', industry: 'Climate' },
  { name: 'Junction 12', industry: 'Transit' },
  { name: 'Kilnwork', industry: 'Ceramics' },
  { name: 'Longshore', industry: 'Shipping' },
  { name: 'Marrow', industry: 'Devtools' },
  { name: 'Nightjar', industry: 'Gaming' },
]

export interface LogoEntry {
  /** `northwind-orbit`. */
  id: string
  name: string
  industry: string
  family: LogoFamily
}

/**
 * Thirty brands × six families, generated brand-major so the grid groups by
 * company rather than by shape — which is the order someone picking six
 * plausible logos for one cloud needs.
 */
export const LOGO_SET: LogoEntry[] = LOGO_BRANDS.flatMap((brand) =>
  LOGO_FAMILIES.map((family) => ({
    id: `${brand.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${family.id}`,
    name: brand.name,
    industry: brand.industry,
    family: family.id,
  })),
)

export function logoById(id: string): LogoEntry | undefined {
  return LOGO_SET.find((l) => l.id === id)
}

export function logoFileName(entry: LogoEntry, lockup: LogoLockup, mono: boolean): string {
  return `logo-${entry.id}-${lockup}${mono ? '-mono' : ''}.svg`
}

export function searchLogos(query: string): LogoEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return LOGO_SET
  return LOGO_SET.filter(
    (l) =>
      l.name.toLowerCase().includes(q) ||
      l.industry.toLowerCase().includes(q) ||
      l.family.includes(q),
  )
}
