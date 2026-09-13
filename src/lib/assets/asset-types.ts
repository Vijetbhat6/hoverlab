/**
 * Free assets — the taxonomy, the palettes and the SVG serialiser.
 *
 * This is the fifth surface on the site, and deliberately NOT a fifth
 * `ArtifactLevel`. An effect, primitive, block, page and template are all
 * *code you install*; they carry a licence, a registry entry, a props table,
 * an a11y evidence row and a Figma frame. An avatar is a file. Wiring files
 * into that machinery would cost more to maintain than the files are worth,
 * and the whole point of this surface is that it costs nothing to keep.
 *
 * Which leads to the one rule that shapes every file in this directory:
 * **nothing here is hand-drawn 370 times.** Untitled UI ships 370 avatars
 * and 180 logos as 550 files; Flowbite ships its illustrations twice over,
 * once for light and once for dark. Those are real assets and a real
 * maintenance bill — a palette change is 550 edits. Here each family is a
 * renderer plus a table of parameters, so the catalog's size is a number in
 * a loop and a palette change is one line.
 *
 * The same reasoning settles light and dark. An asset that adapts is one
 * file with an internal `<style>` and a `prefers-color-scheme` block: it
 * works inline, it works in an `<img>`, it works opened straight from disk,
 * and there is no second file to forget. `scheme: 'light' | 'dark'` is still
 * offered, because a file destined for a fixed-background slide deck should
 * not change under the reader.
 *
 * DATA-FREE of React, like the other `*-types` modules — every function here
 * is string building over plain data and runs in Node, which is what makes
 * it testable.
 */

/* ------------------------------------------------------------------ *
 *  Families
 * ------------------------------------------------------------------ */

export type AssetFamily = 'animated-icons' | 'avatars' | 'logos' | 'illustrations'

export const ASSET_FAMILIES: readonly AssetFamily[] = [
  'animated-icons',
  'avatars',
  'logos',
  'illustrations',
] as const

export interface AssetFamilyMeta {
  id: AssetFamily
  /** Singular and plural, for prose that counts. */
  label: { one: string; many: string }
  /** The one-line promise on the hub card. */
  blurb: string
  /**
   * What this family is generated *from*. Shown on the family page, because
   * "2,160 animated icons" is only credible once you can see it is 180 icons
   * crossed with twelve motions rather than a claim about a folder.
   */
  derivation: string
  /** Formats the detail panel can hand over. */
  formats: readonly AssetFormat[]
}

export type AssetFormat = 'svg' | 'jsx' | 'css' | 'png' | 'data-uri'

export const ASSET_FORMAT_LABEL: Record<AssetFormat, string> = {
  svg: 'SVG',
  jsx: 'JSX',
  css: 'CSS',
  png: 'PNG',
  'data-uri': 'Data URI',
}

/* ------------------------------------------------------------------ *
 *  Palettes
 * ------------------------------------------------------------------ */

/**
 * One palette, stated twice.
 *
 * Hex, not `oklch()`, and not `var(--primary)`. These files leave the site:
 * they get opened in Figma, dropped into Illustrator, pasted into an email
 * and attached to a Keynote. A token reference resolves to nothing outside
 * the app it came from, and `oklch()` is still missing from enough SVG
 * rasterisers that a file using it renders black in exactly the tools a
 * designer reaches for. The site's own tokens are a superset of these hues;
 * the loss is the last few percent of chroma, which no avatar needs.
 *
 * `dark` is not `light` inverted. Inverting lightness keeps the hue and
 * destroys the relationship — a mark whose accent was the brightest thing in
 * the composition becomes the dimmest. Each scheme is seated on its own
 * background and keeps the same *ordering* of ink over accent over base.
 */
export interface AssetSwatch {
  /** The plate the asset sits on. Transparent assets never paint it. */
  bg: string
  /** The largest area of colour. */
  base: string
  /** The one thing the eye should land on. */
  accent: string
  /** Strokes, outlines and type. */
  ink: string
  /** A wash of `base`, for shading and second surfaces. */
  tint: string
}

export interface AssetPalette {
  id: string
  name: string
  light: AssetSwatch
  dark: AssetSwatch
}

export const ASSET_PALETTES: AssetPalette[] = [
  {
    id: 'slate',
    name: 'Slate',
    light: { bg: '#f8fafc', base: '#cbd5e1', accent: '#475569', ink: '#0f172a', tint: '#e2e8f0' },
    dark: { bg: '#0f172a', base: '#334155', accent: '#94a3b8', ink: '#f1f5f9', tint: '#1e293b' },
  },
  {
    id: 'indigo',
    name: 'Indigo',
    light: { bg: '#f5f3ff', base: '#c7d2fe', accent: '#4f46e5', ink: '#1e1b4b', tint: '#e0e7ff' },
    dark: { bg: '#1e1b4b', base: '#4338ca', accent: '#a5b4fc', ink: '#eef2ff', tint: '#312e81' },
  },
  {
    id: 'teal',
    name: 'Teal',
    light: { bg: '#f0fdfa', base: '#99f6e4', accent: '#0f766e', ink: '#042f2e', tint: '#ccfbf1' },
    dark: { bg: '#042f2e', base: '#0f766e', accent: '#5eead4', ink: '#f0fdfa', tint: '#134e4a' },
  },
  {
    id: 'amber',
    name: 'Amber',
    light: { bg: '#fffbeb', base: '#fde68a', accent: '#b45309', ink: '#451a03', tint: '#fef3c7' },
    dark: { bg: '#451a03', base: '#b45309', accent: '#fcd34d', ink: '#fffbeb', tint: '#78350f' },
  },
  {
    id: 'rose',
    name: 'Rose',
    light: { bg: '#fff1f2', base: '#fecdd3', accent: '#be123c', ink: '#4c0519', tint: '#ffe4e6' },
    dark: { bg: '#4c0519', base: '#be123c', accent: '#fda4af', ink: '#fff1f2', tint: '#881337' },
  },
  {
    id: 'violet',
    name: 'Violet',
    light: { bg: '#faf5ff', base: '#e9d5ff', accent: '#7e22ce', ink: '#3b0764', tint: '#f3e8ff' },
    dark: { bg: '#3b0764', base: '#7e22ce', accent: '#d8b4fe', ink: '#faf5ff', tint: '#581c87' },
  },
]

export const DEFAULT_PALETTE_ID = 'indigo'

export function paletteById(id: string): AssetPalette {
  return ASSET_PALETTES.find((p) => p.id === id) ?? ASSET_PALETTES[1]
}

/** Which scheme's colours an asset is drawn in. `auto` follows the reader. */
export type AssetScheme = 'light' | 'dark' | 'auto'

export const SWATCH_KEYS = ['bg', 'base', 'accent', 'ink', 'tint'] as const
export type SwatchKey = (typeof SWATCH_KEYS)[number]

/** The custom-property name a swatch key is published under inside an SVG. */
export function swatchVar(key: SwatchKey): string {
  return `--a-${key}`
}

/**
 * The colour expression a shape should use for `key`.
 *
 * Always a `var()` with the literal as its fallback, which is what makes one
 * file serve all three schemes. In `auto` the variable is redefined by a
 * media query and the fallback never fires; in a fixed scheme the variable is
 * defined once and the fallback still never fires. The fallback exists for
 * the third case nobody plans for — an `<img>` in a renderer that strips
 * `<style>`, where a `var()` with no fallback collapses to `none` and the
 * asset disappears rather than merely looking wrong.
 */
export function swatchRef(key: SwatchKey, swatch: AssetSwatch): string {
  return `var(${swatchVar(key)}, ${swatch[key]})`
}

/** The swatch an asset is drawn against. `auto` draws against light. */
export function swatchFor(palette: AssetPalette, scheme: AssetScheme): AssetSwatch {
  return scheme === 'dark' ? palette.dark : palette.light
}

function varBlock(swatch: AssetSwatch, indent: string): string {
  return SWATCH_KEYS.map((k) => `${indent}${swatchVar(k)}: ${swatch[k]};`).join('\n')
}

/**
 * The class the palette's variables are defined on.
 *
 * This is the fix for a bug that only appears once two assets share a page,
 * which is to say: only in production.
 *
 * The obvious selector is `:root`, and in a standalone `.svg` file it is
 * correct — the root of that document *is* the `<svg>`. But an inlined SVG is
 * not a document. Its `<style>` is a stylesheet of the **host page**, and
 * `:root` there means the `<html>`, so every inlined asset writes its palette
 * to the same global variables and the last one in the DOM silently repaints
 * all of them. Six illustrations in six palettes render as six copies of
 * whichever came last, with nothing in the console.
 *
 * `svg { … }` has exactly the same problem for exactly the same reason.
 *
 * So the variables are defined on a class that is keyed by palette and
 * scheme. Two assets that share both share the rule and can safely define it
 * twice; two that differ cannot collide. It still works in a standalone file,
 * where the class is on the root element, and it degrades to the literal
 * fallbacks in `swatchRef` anywhere the class is lost.
 */
export function paletteScopeClass(palette: AssetPalette, scheme: AssetScheme): string {
  return `a-${palette.id}-${scheme}`
}

/** The `<style>` that carries the palette, scoped by `paletteScopeClass`. */
export function paletteStyle(palette: AssetPalette, scheme: AssetScheme): string {
  const cls = `.${paletteScopeClass(palette, scheme)}`
  if (scheme === 'auto') {
    return [
      '  <style>',
      `    ${cls} {`,
      varBlock(palette.light, '      '),
      '    }',
      '    @media (prefers-color-scheme: dark) {',
      `      ${cls} {`,
      varBlock(palette.dark, '        '),
      '      }',
      '    }',
      '  </style>',
    ].join('\n')
  }
  return [
    '  <style>',
    `    ${cls} {`,
    varBlock(scheme === 'dark' ? palette.dark : palette.light, '      '),
    '    }',
    '  </style>',
  ].join('\n')
}

/* ------------------------------------------------------------------ *
 *  Serialising
 * ------------------------------------------------------------------ */

/** XML-escape text bound for a `<title>` or `<desc>`. */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export interface SvgDocumentOptions {
  viewBox: string
  /** Rendered width and height. Omit for a purely responsive asset. */
  size?: number
  /** The drawing, already indented two spaces. */
  body: string
  /** A `<style>` block, or `''`. */
  style?: string
  /**
   * The accessible name.
   *
   * A `<title>` is what makes an inline SVG announce itself, and it is what
   * a standalone file shows as its tooltip. It is also the single most
   * commonly deleted element in the SVG toolchain — every optimiser preset
   * drops it to save bytes. `optimizeSvg` here keeps it on purpose (see
   * `svg-tools.ts`), and these documents ship with one.
   *
   * Pass `null` for a decorative asset, which also gets `aria-hidden`.
   */
  title: string | null
  /** Extra root attributes, already formatted as ` k="v"`. */
  rootAttrs?: string
}

export function svgDocument({
  viewBox,
  size,
  body,
  style = '',
  title,
  rootAttrs = '',
}: SvgDocumentOptions): string {
  const dims = size ? ` width="${size}" height="${size}"` : ''
  const a11y = title === null ? ' aria-hidden="true" focusable="false"' : ' role="img"'
  const head = `<svg xmlns="http://www.w3.org/2000/svg"${dims} viewBox="${viewBox}"${a11y}${rootAttrs}>`
  const lines = [head]
  if (title !== null) lines.push(`  <title>${escapeXml(title)}</title>`)
  if (style) lines.push(style)
  lines.push(body)
  lines.push('</svg>')
  return lines.filter(Boolean).join('\n')
}

/** `Bell` + `swing` → `BellSwingIcon`. Stable, and a legal identifier. */
export function componentName(...parts: string[]): string {
  const joined = parts
    .join(' ')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
  return /^[0-9]/.test(joined) ? `Asset${joined}` : joined
}

/** `bell` + `swing` → `bell-swing`. The download filename and the URL slug. */
export function assetSlug(...parts: string[]): string {
  return parts
    .join('-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const ASSET_FAMILY_META: Record<AssetFamily, AssetFamilyMeta> = {
  'animated-icons': {
    id: 'animated-icons',
    label: { one: 'animated icon', many: 'animated icons' },
    blurb:
      'Every icon in the browser, crossed with every motion in the catalog — animated per path, not as a spinning box, and guarded for reduced motion before you paste it.',
    derivation: 'the icon browser × the motion families the catalog’s own effects are built from',
    formats: ['svg', 'jsx', 'css'],
  },
  avatars: {
    id: 'avatars',
    label: { one: 'avatar', many: 'avatars' },
    blurb:
      'Drawn, not photographed, and generated from a seed — so a placeholder face is nobody’s face, and the set is as large as you need it to be.',
    derivation: 'a seed crossed with face, hair, accessory and palette tables',
    formats: ['svg', 'jsx', 'png', 'data-uri'],
  },
  logos: {
    id: 'logos',
    label: { one: 'logo', many: 'logos' },
    blurb:
      'Fictional company marks and wordmarks for the mockup you are filling in. Invented names, invented shapes, nobody’s trademark.',
    derivation: 'mark families crossed with invented brand names and palettes',
    formats: ['svg', 'jsx', 'png', 'data-uri'],
  },
  illustrations: {
    id: 'illustrations',
    label: { one: 'illustration', many: 'illustrations' },
    blurb:
      'Isometric scenes for empty states, error pages and onboarding — one file each, light and dark decided by the reader rather than by which file you linked.',
    derivation: 'an isometric renderer crossed with scenes described as stacked solids',
    formats: ['svg', 'jsx', 'png', 'data-uri'],
  },
}
