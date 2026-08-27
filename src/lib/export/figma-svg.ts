/**
 * The design system as something you can paste into Figma.
 *
 * The gap this closes is small and specific. `design-system.ts` already
 * emits W3C DTCG token files, and the panel says what they are for: those
 * are what Figma's *variable import* reads. Reading them costs a plugin, a
 * file, an import dialog and a designer who knows all three exist. Nobody
 * evaluating a component library on a Tuesday afternoon does that.
 *
 * Figma parses SVG off the clipboard natively — copy SVG source, press
 * paste, get layers. No plugin, no file, no account. So this builds one
 * artboard's worth of SVG whose every element is a primitive Figma
 * understands: `<rect>` becomes a rectangle, `<text>` becomes editable
 * text, `id` becomes the layer name. Two seconds and the palette is on the
 * canvas, in the brand the visitor just picked.
 *
 * WHAT IT IS NOT. It is not a screenshot of a component and it is not a
 * component import — the catalog is CSS, and CSS hover and motion do not
 * exist in a static frame. /figma is careful about that limit and so is
 * this: what travels is the palette, the radius scale and the fonts, which
 * is exactly the part a designer needs to draw the next screen in a way
 * the code can already build.
 *
 * FREE, deliberately, while the file bundle is Pro. The zip is derived
 * per-customer and is the thing worth paying for; this is a lead magnet
 * pointed at the audience that picks these libraries. Uiverse sells a
 * comparable paste path. Giving it away is the counter.
 *
 * CONSTRAINTS THE FORMAT IMPOSES, all of them load-bearing:
 *   - Colours must be hex. Figma's SVG parser does not know `oklch()` and
 *     will not resolve a CSS variable, so everything is resolved through
 *     `resolveTokens` first.
 *   - No `<style>` block and no class attributes. Presentation has to be
 *     on the element or it is lost on import.
 *   - `id` is the layer name. Naming them after the tokens is what makes
 *     the pasted result navigable instead of forty anonymous rectangles.
 *
 * Isomorphic and dependency-free, like its neighbours: the browser builds
 * this on a click, and a route or the CLI could build the same string.
 */

import { resolveTokens, type ResolvedToken, type Theme } from '@/lib/export/design-system'
import { DEFAULT_BRAND_COLOR, type BrandColor } from '@/lib/brand-presets'
import tokens from '@/lib/generated-dna.json'

/* ------------------------------------------------------------------ *
 *  Geometry
 * ------------------------------------------------------------------ */

const PAD = 48
const WIDTH = 1200
const COL_WIDTH = 520
const COL_GAP = 16
const ROW_HEIGHT = 52
const SWATCH = 40
const HEADER_HEIGHT = 132
/** Height of the "Light" / "Dark" label above each palette column. */
const COL_HEADER = 44

/**
 * The radius scale, mirroring `globals.css`.
 *
 * Kept as arithmetic on the one `--radius` value rather than four literals
 * for the same reason the CSS does it that way: the four are one decision,
 * and a sheet that hard-coded them would drift the first time the base
 * moved.
 */
function radiusScale(): Array<{ name: string; px: number }> {
  const base = Number.parseFloat(tokens.radius) * 16 || 12
  return [
    { name: 'sm', px: base - 4 },
    { name: 'md', px: base - 2 },
    { name: 'lg', px: base },
    { name: 'xl', px: base + 4 },
  ]
}

/**
 * The two families the templates actually load, from `globals.css`.
 *
 * Named rather than sampled from a scale: there is no type-scale token in
 * this design system — sizes come from Tailwind's defaults at the call
 * site — and inventing one for the sheet would put a claim on a designer's
 * canvas that no stylesheet here backs.
 */
const FONTS: Array<{ role: string; family: string; sample: string }> = [
  { role: 'Sans — headings and UI', family: 'Geist', sample: 'The quick brown fox' },
  { role: 'Mono — code and numbers', family: 'JetBrains Mono', sample: 'npx hoverlab add' },
]

/* ------------------------------------------------------------------ *
 *  SVG primitives
 * ------------------------------------------------------------------ */

/** XML-escape. Brand names arrive from a text input and land in markup. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * A layer id Figma can show in the layers panel.
 *
 * Ids have to be unique across the document or Figma dedupes them into
 * `name`, `name_2` — which is survivable but ugly, so every caller passes
 * a prefix.
 */
function layerId(...parts: string[]): string {
  return esc(parts.join('-').replace(/[^a-zA-Z0-9_-]/g, '-'))
}

function rect(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  opts: { rx?: number; stroke?: string } = {},
): string {
  const rx = opts.rx === undefined ? '' : ` rx="${opts.rx}"`
  const stroke = opts.stroke ? ` stroke="${opts.stroke}" stroke-width="1"` : ''
  return `<rect id="${layerId(id)}" x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${rx}${stroke}/>`
}

function text(
  id: string,
  x: number,
  y: number,
  content: string,
  opts: {
    size?: number
    weight?: number
    fill?: string
    family?: string
    anchor?: 'start' | 'middle' | 'end'
  } = {},
): string {
  const size = opts.size ?? 13
  const weight = opts.weight ?? 400
  const fill = opts.fill ?? '#0a0a0b'
  const family = opts.family ?? 'Geist, Inter, sans-serif'
  const anchor = opts.anchor ? ` text-anchor="${opts.anchor}"` : ''
  // `dominant-baseline` is deliberately absent: Figma ignores it on
  // import and the callers here pass a baseline y, so honouring it in one
  // renderer and not the other would put the text in two places.
  return (
    `<text id="${layerId(id)}" x="${x}" y="${y}" font-family="${family}" ` +
    `font-size="${size}" font-weight="${weight}" fill="${fill}"${anchor}>${esc(content)}</text>`
  )
}

/* ------------------------------------------------------------------ *
 *  The sheet
 * ------------------------------------------------------------------ */

export interface FigmaSheetOptions {
  /** Shown in the header, so a pasted board says whose brand it is. */
  name?: string
  /** Absolute site origin for the credit line. */
  origin?: string
}

export interface FigmaSheet {
  svg: string
  width: number
  height: number
  /** Tokens per theme — what the caller can honestly claim it copied. */
  tokenCount: number
}

/** One palette column: a titled panel of swatch + name + hex rows. */
function paletteColumn(
  theme: Theme,
  resolved: ResolvedToken[],
  x: number,
  y: number,
): string {
  // The panel behind the column is the theme's own background token, so
  // the dark palette is legible on a dark ground instead of a white one.
  const ground = resolved.find((t) => t.name === 'background')?.hex ?? '#ffffff'
  const ink = resolved.find((t) => t.name === 'foreground')?.hex ?? '#0a0a0b'
  const muted = resolved.find((t) => t.name === 'muted-foreground')?.hex ?? '#71717a'
  const height = COL_HEADER + resolved.length * ROW_HEIGHT + 16

  const parts: string[] = [
    `<g id="${layerId('palette', theme)}">`,
    rect(`${theme}-panel`, x, y, COL_WIDTH, height, ground, {
      rx: 16,
      // A 1px border, because `background` in light mode is pure white and
      // an unbordered white panel on Figma's white canvas is invisible.
      stroke: resolved.find((t) => t.name === 'border')?.hex ?? '#e4e4e7',
    }),
    text(`${theme}-title`, x + 20, y + 30, theme === 'light' ? 'Light' : 'Dark', {
      size: 15,
      weight: 600,
      fill: ink,
    }),
  ]

  resolved.forEach((token, index) => {
    const rowY = y + COL_HEADER + index * ROW_HEIGHT
    parts.push(
      rect(`${theme}-${token.name}`, x + 20, rowY, SWATCH, SWATCH, token.hex, {
        rx: 10,
        stroke: resolved.find((t) => t.name === 'border')?.hex ?? '#e4e4e7',
      }),
      text(`${theme}-${token.name}-name`, x + 76, rowY + 18, `--${token.name}`, {
        size: 13,
        weight: 500,
        fill: ink,
      }),
      text(
        `${theme}-${token.name}-hex`,
        x + 76,
        rowY + 34,
        token.clipped ? `${token.hex} · clipped to sRGB` : token.hex,
        { size: 11, fill: muted, family: 'JetBrains Mono, ui-monospace, monospace' },
      ),
    )
  })

  parts.push('</g>')
  return parts.join('\n  ')
}

/**
 * Build the pasteable artboard.
 *
 * Returns a string rather than writing to the clipboard so the same
 * builder can be unit-tested, served from a route, or written to a file
 * by the CLI — none of which have a clipboard.
 */
export function buildFigmaSheet(
  brand: BrandColor = DEFAULT_BRAND_COLOR,
  options: FigmaSheetOptions = {},
): FigmaSheet {
  const light = resolveTokens(brand, 'light')
  const dark = resolveTokens(brand, 'dark')
  const name = options.name?.trim() || 'Hoverlab'
  const origin = (options.origin ?? 'https://hoverlab.dev').replace(/\/$/, '')

  const columnHeight = COL_HEADER + light.length * ROW_HEIGHT + 16
  const paletteY = HEADER_HEIGHT
  const radiusY = paletteY + columnHeight + 48
  // The radius row is 122px deep measured from `radiusY` (20 lead + 64 of
  // swatch + two label lines), so anything under ~150 here collides with
  // the Type heading. It did.
  const fontsY = radiusY + 172
  const height = fontsY + 152

  const scale = radiusScale()

  const body: string[] = [
    // The board itself. Pasting onto a dark Figma canvas without this
    // leaves black text floating on black.
    rect('board', 0, 0, WIDTH, height, '#ffffff', { rx: 24 }),

    text('title', PAD, 60, `${name} design system`, { size: 30, weight: 700 }),
    text(
      'subtitle',
      PAD,
      88,
      'Colours, radii and type — the same tokens every effect, block and page in the catalog is styled through.',
      { size: 13, fill: '#71717a' },
    ),
    text('credit', WIDTH - PAD, 60, origin.replace(/^https?:\/\//, ''), {
      size: 12,
      fill: '#71717a',
      anchor: 'end',
      family: 'JetBrains Mono, ui-monospace, monospace',
    }),

    paletteColumn('light', light, PAD, paletteY),
    paletteColumn('dark', dark, PAD + COL_WIDTH + COL_GAP, paletteY),

    text('radius-title', PAD, radiusY, 'Radius scale', { size: 15, weight: 600 }),
  ]

  scale.forEach((step, index) => {
    const x = PAD + index * 132
    const y = radiusY + 20
    body.push(
      rect(`radius-${step.name}`, x, y, 112, 64, '#f4f4f5', {
        rx: step.px,
        stroke: '#e4e4e7',
      }),
      text(`radius-${step.name}-label`, x, y + 86, `--radius-${step.name}`, {
        size: 12,
        weight: 500,
      }),
      text(`radius-${step.name}-px`, x, y + 102, `${step.px}px`, {
        size: 11,
        fill: '#71717a',
        family: 'JetBrains Mono, ui-monospace, monospace',
      }),
    )
  })

  body.push(text('fonts-title', PAD, fontsY, 'Type', { size: 15, weight: 600 }))

  FONTS.forEach((font, index) => {
    const y = fontsY + 34 + index * 56
    const mono = font.family !== 'Geist'
    body.push(
      text(`font-${index}-sample`, PAD, y + 16, font.sample, {
        size: 24,
        weight: mono ? 400 : 600,
        family: mono
          ? 'JetBrains Mono, ui-monospace, monospace'
          : 'Geist, Inter, sans-serif',
      }),
      text(`font-${index}-role`, PAD, y + 36, `${font.family} — ${font.role}`, {
        size: 11,
        fill: '#71717a',
      }),
    )
  })

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" fill="none">`,
    `  <title>${esc(name)} design system</title>`,
    ...body.map((part) => `  ${part}`),
    '</svg>',
  ].join('\n')

  return { svg, width: WIDTH, height, tokenCount: light.length }
}
