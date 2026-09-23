/**
 * Icon sheets for Figma — one SVG per category, every icon a named layer.
 *
 * Pure and Node-testable, like the rest of `lib/assets`: no React, no
 * filesystem. `scripts/build-icon-sheets.mts` reads Lucide's geometry and
 * category snapshot and calls into this; the page never imports it.
 *
 * ── WHAT ARRIVES IN FIGMA, STATED PLAINLY ───────────────────────────────
 *
 * A sheet is a grid of 24×24 icons. Each icon is a group whose `id` is the
 * icon's name — Figma reads `id` as the layer name, the same convention the
 * block kit relies on — plus a transparent 24×24 rectangle so the group keeps
 * its full bounds however little the drawing covers (a `minus` is 14px wide;
 * without the rectangle it would paste 14px wide and not line up in a grid).
 *
 * The drawings stay STROKES, not outlined shapes. That is the point of using
 * an outline icon set in Figma: select some, change the stroke colour or
 * weight once. Outlining them would make them look identical and edit worse.
 *
 * What it is not: components, and not variants. There is no size or weight
 * axis, because Figma already has one (scale, and the stroke panel); faking a
 * 16/20/24 matrix as thirty-odd extra frames per icon would be bulk, not
 * function.
 *
 * ── WHY STROKE ATTRIBUTES LIVE ON THE ROOT ──────────────────────────────
 *
 * Repeating them on 3,000 groups costs ~290 KB for nothing: presentation
 * attributes inherit down an SVG tree and Figma's importer honours that, as
 * every icon set that downloads as a single `<svg stroke=…>` shows. The one
 * place inheritance would be WRONG is the bounds rectangle, which would
 * inherit the stroke and paste as a visible box around every icon. It states
 * `stroke="none"` itself, and a test pins that.
 */

/** One drawable element of an icon: a tag and its attributes. */
export type IconNode = [string, Record<string, string | number>]

export interface SheetIcon {
  slug: string
  nodes: IconNode[]
}

export const SHEET = {
  /** Lucide's design grid. */
  icon: 24,
  gap: 16,
  columns: 20,
  stroke: '#000000',
  strokeWidth: 2,
} as const

/**
 * The only elements Lucide draws with. An unknown tag THROWS rather than being
 * skipped: dropping it would ship an icon that is quietly missing a stroke,
 * and nothing downstream would notice until a designer did.
 */
const DRAWABLE = new Set(['path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse'])

export function escapeXml(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** One `<path … />`, without Lucide's React-only `key` attribute. */
export function elementMarkup([tag, attrs]: IconNode): string {
  if (!DRAWABLE.has(tag)) throw new Error(`icon-sheets: unsupported element <${tag}>`)
  const rendered = Object.entries(attrs)
    .filter(([name]) => name !== 'key')
    .map(([name, value]) => `${name}="${escapeXml(value)}"`)
    .join(' ')
  return `<${tag} ${rendered} />`
}

export interface CellOptions {
  columns?: number
  icon?: number
  gap?: number
}

/** Top-left corner of the nth icon in a sheet. */
export function cellPosition(index: number, options: CellOptions = {}) {
  const columns = options.columns ?? SHEET.columns
  const pitch = (options.icon ?? SHEET.icon) + (options.gap ?? SHEET.gap)
  return { x: (index % columns) * pitch, y: Math.floor(index / columns) * pitch }
}

/** Overall size of a sheet holding `count` icons. */
export function sheetSize(count: number, options: CellOptions = {}) {
  const columns = Math.min(options.columns ?? SHEET.columns, Math.max(count, 1))
  const rows = Math.max(Math.ceil(count / (options.columns ?? SHEET.columns)), 1)
  const icon = options.icon ?? SHEET.icon
  const gap = options.gap ?? SHEET.gap
  return { width: columns * icon + (columns - 1) * gap, height: rows * icon + (rows - 1) * gap }
}

/** One icon as a named group at (x, y). */
export function iconGroup(icon: SheetIcon, x: number, y: number): string {
  const name = escapeXml(icon.slug)
  const size = SHEET.icon
  return [
    `  <g id="${name}" transform="translate(${x} ${y})">`,
    `    <rect id="${name} bounds" width="${size}" height="${size}" fill="none" stroke="none" />`,
    ...icon.nodes.map((node) => `    ${elementMarkup(node)}`),
    '  </g>',
  ].join('\n')
}

export interface SheetOptions {
  /** Shown as the artboard name in Figma. */
  name: string
  /** Emitted verbatim as an XML comment. Must not contain a double hyphen. */
  license: string
  columns?: number
}

/** The whole sheet. Icons keep the order they are given. */
export function buildSheet(icons: SheetIcon[], options: SheetOptions): string {
  if (options.license.includes('--')) {
    throw new Error('icon-sheets: a licence containing "--" would end the XML comment early')
  }
  const seen = new Set<string>()
  for (const icon of icons) {
    if (seen.has(icon.slug)) throw new Error(`icon-sheets: "${icon.slug}" appears twice in one sheet`)
    seen.add(icon.slug)
  }

  const columns = options.columns ?? SHEET.columns
  const { width, height } = sheetSize(icons.length, { columns })
  const groups = icons.map((icon, i) => {
    const { x, y } = cellPosition(i, { columns })
    return iconGroup(icon, x, y)
  })

  return [
    `<!--\n${options.license.trim()}\n-->`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
      `viewBox="0 0 ${width} ${height}" id="${escapeXml(options.name)}" ` +
      `fill="none" stroke="${SHEET.stroke}" stroke-width="${SHEET.strokeWidth}" ` +
      `stroke-linecap="round" stroke-linejoin="round">`,
    ...groups,
    '</svg>',
    '',
  ].join('\n')
}

/**
 * A single row of icons for the page — the same drawings, but in
 * `currentColor` so they follow the theme instead of being black on black.
 * A separate function on purpose: the file a designer downloads must never
 * depend on a CSS colour it will not be inside a page to receive.
 */
export function buildSampleSvg(icons: SheetIcon[]): string {
  const pitch = SHEET.icon + 8
  const width = icons.length * pitch - 8
  const groups = icons.map(
    (icon, i) =>
      `<g transform="translate(${i * pitch} 0)">${icon.nodes.map(elementMarkup).join('')}</g>`,
  )
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${SHEET.icon}" ` +
    `viewBox="0 0 ${width} ${SHEET.icon}" fill="none" stroke="currentColor" ` +
    `stroke-width="${SHEET.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" ` +
    `aria-hidden="true">${groups.join('')}</svg>`
  )
}

/* ------------------------------------------------------------------ *
 *  Categories
 * ------------------------------------------------------------------ */

/**
 * Editorial order, not an alphabetical one: what a product designer reaches
 * for first. Everything not listed follows alphabetically, so a category
 * Lucide adds later still appears — it just is not promoted by name.
 */
export const CATEGORY_PRIORITY = [
  'arrows',
  'account',
  'files',
  'communication',
  'layout',
  'design',
  'development',
  'charts',
  'finance',
  'security',
  'devices',
  'notifications',
  'time',
  'navigation',
  'shopping',
  'text',
  'multimedia',
  'social',
  'connectivity',
  'tools',
] as const

const LABELS: Record<string, string> = {
  'food-beverage': 'Food & beverage',
  development: 'Development',
}

/** `food-beverage` → `Food & beverage`; anything else is title-cased. */
export function categoryLabel(slug: string): string {
  if (LABELS[slug]) return LABELS[slug]
  return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')
}

export function orderCategories(slugs: string[]): string[] {
  const priority = CATEGORY_PRIORITY.filter((c) => slugs.includes(c))
  const rest = slugs.filter((s) => !(CATEGORY_PRIORITY as readonly string[]).includes(s)).sort()
  return [...priority, ...rest]
}

/** File name for a category's sheet. */
export function sheetFileName(category: string): string {
  return `lucide-${category}.svg`
}
