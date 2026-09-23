/**
 * A rendered block, as layers a designer can paste into Figma.
 *
 * ── THE GAP THIS CLOSES ─────────────────────────────────────────────────
 *
 * `/compare` carries the admission in its own data: design files are "the
 * row we lose outright". Flowbite, Shadcnblocks, Untitled UI, Preline and
 * Tailwind Plus all ship a Figma kit; we shipped a token file. `figma-svg.ts`
 * closed half of it by putting the *palette* on the canvas. This closes the
 * other half by putting the *layout* there — the boxes, the radii, the type
 * and the real colours of an actual block, arranged the way it actually
 * renders.
 *
 * ── WHY IT READS THE DOM RATHER THAN THE SOURCE ─────────────────────────
 *
 * A block is React and Tailwind. Its geometry does not exist anywhere until
 * a browser has laid it out: `grid-cols-3 gap-6` is not a rectangle until
 * something computes it. Any attempt to derive a frame from the source would
 * be a second, worse layout engine that disagreed with the preview sitting
 * on the same page.
 *
 * So the input is the preview itself. `collectFrameNodes` walks the live
 * subtree and records what a browser already worked out — positions from
 * `getBoundingClientRect`, everything else from `getComputedStyle`. What
 * pastes into Figma is what the reader is looking at.
 *
 * ── WHAT IT IS NOT ──────────────────────────────────────────────────────
 *
 * A static frame. Hover states, transitions and animation do not exist in
 * SVG and are not smuggled in — the same limit `/figma` already states about
 * `match_design`, and the same one `figma-svg.ts` states about effects. It
 * is also not a component import: what arrives is rectangles, text layers and
 * icon groups of real vector paths, not an instance with props.
 *
 * Text is placed where the browser DREW it (a range over its text nodes, with
 * the font's own ascent for the baseline), not at its element's box. Checked
 * against an independent baseline probe: 0.00px error on 116 layers.
 *
 * ── FORMAT CONSTRAINTS, all load-bearing ────────────────────────────────
 *
 *   - Colours must be hex or rgba. Figma's SVG parser does not resolve
 *     `oklch()`, `color-mix()` or a CSS variable, and this catalog's tokens
 *     are all three. `normalizeColor` is what makes that safe, and it needs
 *     a browser to do it.
 *   - No `<style>` block, no classes. Presentation must be on the element
 *     or it is dropped on import.
 *   - `id` becomes the layer name. Naming layers after their role is what
 *     makes the paste navigable rather than ninety anonymous rectangles.
 *
 * The serialization half is pure and unit-tested; only `collectFrameNodes`
 * touches the DOM.
 */

/* ------------------------------------------------------------------ *
 *  The intermediate form
 * ------------------------------------------------------------------ */

export interface FrameRect {
  kind: 'rect'
  name: string
  x: number
  y: number
  width: number
  height: number
  /** Already normalized to hex/rgba, or null for no fill. */
  fill: string | null
  stroke: string | null
  strokeWidth: number
  /** Uniform corner radius in px. */
  radius: number
  opacity: number
}

export interface FrameText {
  kind: 'text'
  name: string
  x: number
  /** Baseline, not the box top — SVG text is positioned by its baseline. */
  y: number
  text: string
  fill: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  letterSpacing: number
  /** `start` | `middle` | `end`, derived from CSS text-align. */
  anchor: 'start' | 'middle' | 'end'
}

/**
 * One shape inside a traced icon. `attrs` carries geometry (`d`, `cx`, `points`,
 * …) and only the paint that differs from the enclosing group, so a Lucide
 * icon's four paths do not each restate `stroke-linecap="round"`.
 */
export interface FrameIconShape {
  tag: string
  attrs: Record<string, string>
  children: FrameIconShape[]
}

/**
 * An inline `<svg>` — in practice a Lucide icon — as real vector geometry.
 *
 * The walker used to see an `<svg>` as an element with no fill and no border
 * and emit nothing, so every chevron, check mark and menu glyph in both kits
 * was simply absent. This carries the shapes across instead of a bitmap or a
 * placeholder box, which is what makes them recolourable and resizable once
 * they land in Figma.
 */
export interface FrameIcon {
  kind: 'icon'
  name: string
  /** Top-left of the LAYOUT box, before any CSS transform. */
  x: number
  y: number
  width: number
  height: number
  /** The svg's own coordinate system; the shapes are written in these units. */
  viewBox: { x: number; y: number; width: number; height: number }
  /** `preserveAspectRatio="none"` stretches; everything else fits and centres. */
  stretch: boolean
  /**
   * A CSS transform (`rotate-180` on an open chevron, an RTL flip) as the
   * matrix `[a b c d e f]`, applied about the box centre as CSS does. Null
   * when there is none, which is nearly always.
   */
  matrix: [number, number, number, number, number, number] | null
  opacity: number
  /** Already normalized; `'none'` rather than null so the group states it. */
  fill: string
  stroke: string
  strokeWidth: number
  strokeLinecap: string
  strokeLinejoin: string
  shapes: FrameIconShape[]
}

export type FrameNode = FrameRect | FrameText | FrameIcon

export interface Frame {
  name: string
  width: number
  height: number
  nodes: FrameNode[]
  /** Page background, painted as the bottom-most rectangle. */
  background: string | null
}

/* ------------------------------------------------------------------ *
 *  Serialization — pure
 * ------------------------------------------------------------------ */

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Two decimals is below Figma's own snapping threshold and halves the bytes. */
function round(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Layer names must be unique enough to navigate, and they come from CSS
 * roles that repeat — nine "button" rectangles in a pricing block is
 * normal. Suffixed on collision rather than deduplicated, because all nine
 * are real layers.
 */
function uniqueNames(nodes: FrameNode[]): string[] {
  const counts = new Map<string, number>()
  return nodes.map((node) => {
    const seen = counts.get(node.name) ?? 0
    counts.set(node.name, seen + 1)
    return seen === 0 ? node.name : `${node.name} ${seen + 1}`
  })
}

function rectElement(node: FrameRect, name: string): string {
  const attrs = [
    `id="${escapeXml(name)}"`,
    `x="${round(node.x)}"`,
    `y="${round(node.y)}"`,
    `width="${round(node.width)}"`,
    `height="${round(node.height)}"`,
  ]

  if (node.radius > 0) attrs.push(`rx="${round(node.radius)}"`)
  attrs.push(`fill="${node.fill ?? 'none'}"`)

  if (node.stroke && node.strokeWidth > 0) {
    attrs.push(`stroke="${node.stroke}"`, `stroke-width="${round(node.strokeWidth)}"`)
  }
  if (node.opacity < 1) attrs.push(`opacity="${round(node.opacity)}"`)

  return `  <rect ${attrs.join(' ')} />`
}

function textElement(node: FrameText, name: string): string {
  const attrs = [
    `id="${escapeXml(name)}"`,
    `x="${round(node.x)}"`,
    `y="${round(node.y)}"`,
    `fill="${node.fill}"`,
    // Quoted family names survive the round-trip; an unquoted stack with a
    // space in it does not.
    `font-family="${escapeXml(node.fontFamily)}"`,
    `font-size="${round(node.fontSize)}"`,
  ]

  if (node.fontWeight !== 400) attrs.push(`font-weight="${node.fontWeight}"`)
  if (node.letterSpacing !== 0) attrs.push(`letter-spacing="${round(node.letterSpacing)}"`)
  if (node.anchor !== 'start') attrs.push(`text-anchor="${node.anchor}"`)

  return `  <text ${attrs.join(' ')}>${escapeXml(node.text)}</text>`
}

/** Three decimals: a transform's scale is a ratio, and 0.667 vs 0.67 shows at 24px. */
function round3(value: number): number {
  return Math.round(value * 1000) / 1000
}

function shapeElement(shape: FrameIconShape, depth: number): string[] {
  const pad = '  '.repeat(depth)
  const attrs = Object.entries(shape.attrs)
    .map(([key, value]) => ` ${key}="${escapeXml(value)}"`)
    .join('')

  if (shape.children.length === 0) return [`${pad}<${shape.tag}${attrs} />`]
  return [
    `${pad}<${shape.tag}${attrs}>`,
    ...shape.children.flatMap((child) => shapeElement(child, depth + 1)),
    `${pad}</${shape.tag}>`,
  ]
}

/**
 * The transform that places the icon's viewBox inside its layout box, then
 * applies the element's own CSS transform about that box's centre.
 *
 * Right to left, a point in viewBox units is: scaled and centred into the
 * box (`preserveAspectRatio`'s default, `xMidYMid meet`), moved to its place
 * relative to the centre, transformed, and moved to the box's position in the
 * frame. One `transform` attribute, so Figma imports one group.
 */
export function iconTransform(node: FrameIcon): string {
  const { x, y, width, height, viewBox } = node
  const sx = width / viewBox.width
  const sy = height / viewBox.height
  const fit = node.stretch ? { x: sx, y: sy } : { x: Math.min(sx, sy), y: Math.min(sx, sy) }
  const offsetX = (width - viewBox.width * fit.x) / 2 - viewBox.x * fit.x
  const offsetY = (height - viewBox.height * fit.y) / 2 - viewBox.y * fit.y

  const parts = [`translate(${round3(x)} ${round3(y)})`]
  if (node.matrix) {
    const [a, b, c, d, e, f] = node.matrix.map(round3)
    parts.push(
      `translate(${round3(width / 2)} ${round3(height / 2)})`,
      `matrix(${a} ${b} ${c} ${d} ${e} ${f})`,
      `translate(${round3(-width / 2)} ${round3(-height / 2)})`,
    )
  }
  // A square icon in a square box needs no centring; leave the no-op out.
  if (Math.abs(offsetX) > 0.0005 || Math.abs(offsetY) > 0.0005) {
    parts.push(`translate(${round3(offsetX)} ${round3(offsetY)})`)
  }
  parts.push(`scale(${round3(fit.x)} ${round3(fit.y)})`)
  return parts.join(' ')
}

function iconElement(node: FrameIcon, name: string): string[] {
  const attrs = [
    `id="${escapeXml(name)}"`,
    `transform="${iconTransform(node)}"`,
    `fill="${node.fill}"`,
    `stroke="${node.stroke}"`,
  ]

  if (node.stroke !== 'none') {
    attrs.push(
      `stroke-width="${round3(node.strokeWidth)}"`,
      `stroke-linecap="${node.strokeLinecap}"`,
      `stroke-linejoin="${node.strokeLinejoin}"`,
    )
  }
  if (node.opacity < 1) attrs.push(`opacity="${round(node.opacity)}"`)

  return [
    `  <g ${attrs.join(' ')}>`,
    ...node.shapes.flatMap((shape) => shapeElement(shape, 2)),
    '  </g>',
  ]
}

/**
 * One artboard's worth of SVG.
 *
 * A single flat list rather than nested `<g>` groups mirroring the DOM.
 * Figma imports groups faithfully, which is the problem: a Tailwind block is
 * fifteen levels of layout divs, and the pasted result would be fifteen
 * levels of single-child groups that a designer has to click through to
 * reach anything. Flat and well-named is the more useful artboard.
 */
export function serializeFrame(frame: Frame): string {
  const names = uniqueNames(frame.nodes)

  const body = frame.nodes.flatMap((node, i) =>
    node.kind === 'rect'
      ? [rectElement(node, names[i])]
      : node.kind === 'icon'
        ? iconElement(node, names[i])
        : [textElement(node, names[i])],
  )

  const background = frame.background
    ? [
        `  <rect id="${escapeXml(frame.name)} background" x="0" y="0" ` +
          `width="${round(frame.width)}" height="${round(frame.height)}" fill="${frame.background}" />`,
      ]
    : []

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${round(frame.width)}" ` +
      `height="${round(frame.height)}" viewBox="0 0 ${round(frame.width)} ${round(frame.height)}" ` +
      `id="${escapeXml(frame.name)}">`,
    ...background,
    ...body,
    '</svg>',
  ].join('\n')
}

/* ------------------------------------------------------------------ *
 *  Collection — browser only
 * ------------------------------------------------------------------ */

function hex2(value: number): string {
  return value.toString(16).padStart(2, '0')
}

/**
 * Any CSS colour, as something Figma can parse.
 *
 * ── WHY THIS PAINTS A PIXEL ─────────────────────────────────────────────
 *
 * The obvious version of this function assigns to `ctx.fillStyle` and reads
 * the string back, on the assumption that the canvas serializes to
 * `#rrggbb`. That was the first version, and it shipped `oklch()` straight
 * into the SVG: Chrome's canvas accepts CSS Color 4 and serializes it back
 * in the *same* notation it was given. Figma's SVG parser does not know
 * `oklch()`, so every brand-coloured layer pasted as black. The frame looked
 * right in every check that did not open Figma.
 *
 * So the colour is rasterized instead. One pixel, `copy` compositing so the
 * fill replaces alpha rather than blending with it, then `getImageData`.
 * Whatever notation the token was written in — `oklch()`, `color-mix(in
 * oklab, …)`, a bare keyword — what comes back is the sRGB the screen is
 * actually showing, which is the only thing that can be written as hex.
 *
 * The string round-trip is still here, but only as a validity test: an
 * unparseable value leaves `fillStyle` untouched, and seeding twice with
 * different colours is what distinguishes "rejected" from "really is
 * black".
 *
 * Returns null for anything fully transparent, which is the common case:
 * most elements in a Tailwind tree have no background at all, and a
 * `fill="none"` rectangle for each would bury the real layers.
 */
export function normalizeColor(value: string, ctx: CanvasRenderingContext2D): string | null {
  const input = value.trim()
  if (!input || input === 'none' || input === 'transparent') return null

  ctx.fillStyle = '#000000'
  ctx.fillStyle = input
  const first = ctx.fillStyle

  ctx.fillStyle = '#ffffff'
  ctx.fillStyle = input
  if (ctx.fillStyle !== first) return null

  const previous = ctx.globalCompositeOperation
  ctx.globalCompositeOperation = 'copy'
  ctx.fillStyle = input
  ctx.fillRect(0, 0, 1, 1)
  ctx.globalCompositeOperation = previous

  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  if (a === 0) return null

  // Hex where it is opaque, because that is what a designer reads in the
  // Figma inspector; rgba only where the alpha is load-bearing.
  return a === 255
    ? `#${hex2(r)}${hex2(g)}${hex2(b)}`
    : `rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 1000) / 1000})`
}

interface CollectOptions {
  /** Layers smaller than this in either dimension are dropped. */
  minSize?: number
  /** Hard cap on layers, so a dense page cannot produce an unusable paste. */
  maxNodes?: number
  /**
   * Characters this frame may measure to find wrapped line breaks.
   *
   * Bounds the one part of the walk whose cost is per character rather than
   * per element. Past it, wrapped text falls back to a single line — the
   * behaviour before line splitting existed, rather than a loss.
   */
  textBudget?: number
}

/** Elements that never carry visual meaning of their own. */
const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'BR'])

/**
 * A layer name from an element, in the vocabulary a designer would use.
 *
 * Prefers the semantics the block already declares — a role, a heading
 * level, a tag — over the class list, which in a Tailwind block is forty
 * utilities and names nothing.
 */
function layerName(el: Element): string {
  const role = el.getAttribute('role')
  if (role) return role

  const tag = el.tagName.toLowerCase()
  if (/^h[1-6]$/.test(tag)) return `heading ${tag[1]}`

  switch (tag) {
    case 'button':
      return 'button'
    case 'a':
      return 'link'
    case 'input':
    case 'textarea':
    case 'select':
      return 'field'
    case 'img':
    case 'svg':
      return 'image'
    case 'li':
      return 'list item'
    case 'p':
      return 'paragraph'
    case 'section':
    case 'header':
    case 'footer':
    case 'nav':
    case 'aside':
    case 'article':
      return tag
    default:
      return 'container'
  }
}

/** The element's own text, excluding text inside its element children. */
function ownText(el: Element): string {
  let out = ''
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === 3) out += child.textContent ?? ''
  }
  return out.replace(/\s+/g, ' ').trim()
}

/** One visual line of text, as the browser actually drew it. */
interface TextLine {
  text: string
  /** Relative to the viewport; the caller subtracts the frame origin. */
  left: number
  top: number
  width: number
}

/**
 * The element's own text, split into the lines a browser wrapped it onto.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────
 *
 * SVG `<text>` does not wrap. Neither does Figma's text layer on import at
 * a fixed position. So emitting one `<text>` per element — which is what
 * this did — is correct only for text that already fits on one line, and
 * silently wrong for everything else: a hero headline the browser drew on
 * three lines arrived as a single line running several thousand pixels off
 * the side of the artboard, straight through whatever it crossed.
 *
 * It looked fine in every check that did not open the frame, because the
 * SVG was valid and the string was complete. It was only visible once the
 * whole catalog was traced at once and the headlines were seen overflowing.
 *
 * ── HOW ─────────────────────────────────────────────────────────────────
 *
 * A `Range` over a text node reports the geometry the browser gave it, so
 * the line breaks are read back rather than recomputed. Walking one
 * character at a time and watching for the top edge to jump is what finds
 * them; a second measurement per completed line gets that line's real box.
 *
 * Deliberately NOT a re-implementation of line breaking. Where the words
 * broke depends on the font, the available width, hyphenation and the
 * browser's own algorithm, and a second guess at it would disagree with the
 * preview sitting on the same page — the mistake `figma-frame.ts` avoids
 * everywhere else by measuring instead of deriving.
 */
function ownTextLines(el: Element, budget: { left: number }): TextLine[] {
  const doc = el.ownerDocument
  if (!doc) return []

  const lines: TextLine[] = []

  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType !== 3) continue
    const raw = child.textContent ?? ''
    if (!raw.trim()) continue

    /*
     * A cap on measurement, not on output. Each character costs a range
     * measurement, and a frame is copied on a click a reader is waiting
     * through. Past the budget the remaining text falls back to one line,
     * which is the old behaviour rather than a loss.
     */
    if (budget.left <= 0) {
      const range = doc.createRange()
      range.selectNodeContents(child)
      const box = range.getBoundingClientRect()
      const text = raw.replace(/\s+/g, ' ').trim()
      if (text) lines.push({ text, left: box.left, top: box.top, width: box.width })
      continue
    }

    const range = doc.createRange()
    let lineStart = 0
    let lineTop: number | null = null

    const flush = (end: number) => {
      const text = raw.slice(lineStart, end).replace(/\s+/g, ' ').trim()
      if (!text) return
      range.setStart(child, lineStart)
      range.setEnd(child, end)
      const box = range.getBoundingClientRect()
      lines.push({ text, left: box.left, top: box.top, width: box.width })
    }

    for (let i = 0; i < raw.length; i++) {
      if (budget.left <= 0) break
      budget.left -= 1

      range.setStart(child, i)
      range.setEnd(child, i + 1)
      const rect = range.getBoundingClientRect()

      // Collapsed whitespace at a line break has no box at all. Skipping it
      // keeps it from being read as a line of its own.
      if (rect.width === 0 && rect.height === 0) continue

      const top = Math.round(rect.top)
      if (lineTop === null) {
        lineTop = top
        lineStart = i
        continue
      }

      // More than a rounding wobble means the browser moved to a new line.
      if (Math.abs(top - lineTop) > 1) {
        flush(i)
        lineStart = i
        lineTop = top
      }
    }

    if (lineTop !== null) flush(raw.length)
  }

  return lines
}

/**
 * Where the element's own text was actually drawn, as one box.
 *
 * ── WHY THE ELEMENT'S BOX IS THE WRONG ANCHOR ───────────────────────────
 *
 * Single-line text used to be placed at its element's box: `x = box.left`,
 * `y = box.top + fontSize`. That is the text only when the element has no
 * padding and no centring. A label in a `px-4` button is drawn 16px inside its
 * box, and a `justify-center` label is drawn in the middle of it, so both
 * pasted 16px or more to the left of where the browser showed them. It was
 * the same error in every frame in both kits, and invisible in any check that
 * did not overlay the frame on the page.
 *
 * ── HOW ─────────────────────────────────────────────────────────────────
 *
 * One `Range` per text node, not one per character: an element is a single
 * measurement here, which is why this can run on every label without a
 * budget. `getClientRects` rather than the bounding box, because collapsed
 * whitespace produces empty rects that would drag the left edge to the box.
 * Returns null for an element whose text has no geometry, and the caller
 * falls back to the box it used before.
 */
function ownTextBox(el: Element): { left: number; top: number; width: number } | null {
  const doc = el.ownerDocument
  if (!doc) return null

  const range = doc.createRange()
  let left = Infinity
  let right = -Infinity
  let top = Infinity

  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType !== 3 || !(child.textContent ?? '').trim()) continue
    range.selectNodeContents(child)
    for (const rect of Array.from(range.getClientRects())) {
      if (rect.width === 0 && rect.height === 0) continue
      left = Math.min(left, rect.left)
      right = Math.max(right, rect.right)
      top = Math.min(top, rect.top)
    }
  }

  return Number.isFinite(left) ? { left, top, width: right - left } : null
}

/**
 * Distance from the top of a text run's box to its baseline, in px.
 *
 * A `Range` reports the run's content box, whose top sits one font ascent
 * above the baseline; SVG positions text by its baseline. The old
 * approximation, `top + fontSize`, was fitted to an element box that included
 * line-height leading and is only close for one font at one size. The canvas
 * knows the real ascent of the font actually used, and asking it is one
 * measurement per distinct font, cached for one walk — not longer, or a click
 * before a web font loaded would keep the fallback metrics for the whole session.
 */
function fontAscent(
  ctx: CanvasRenderingContext2D,
  style: CSSStyleDeclaration,
  fontSize: number,
  cache: Map<string, number>,
) {
  const font = `${style.fontStyle} ${style.fontWeight} ${fontSize}px ${style.fontFamily}`
  const cached = cache.get(font)
  if (cached !== undefined) return cached

  ctx.font = font
  const ascent = ctx.measureText('Hg').fontBoundingBoxAscent
  // A browser without the metric, or a font that has not loaded, reports 0 or
  // undefined. Fall back to the shape of a typical sans rather than a baseline
  // on the top edge.
  const resolved = Number.isFinite(ascent) && ascent > 0 ? ascent : fontSize * 0.95
  cache.set(font, resolved)
  return resolved
}

function numeric(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/* ------------------------------------------------------------------ *
 *  Inline SVG — icons
 * ------------------------------------------------------------------ */

const SVG_NS = 'http://www.w3.org/2000/svg'

/** Shape elements an icon may contain. Anything else means "not an icon". */
const ICON_SHAPES = new Set(['path', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'rect', 'g'])

/** Geometry that is copied verbatim; paint is resolved from computed style instead. */
const GEOMETRY_ATTRS = [
  'd',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'x',
  'y',
  'width',
  'height',
  'x1',
  'y1',
  'x2',
  'y2',
  'points',
  'transform',
]

/** More than this and it is an illustration, not an icon; left to the browser. */
const MAX_ICON_ELEMENTS = 64

interface IconPaint {
  fill: string
  stroke: string
  strokeWidth: number
  strokeLinecap: string
  strokeLinejoin: string
}

/**
 * The layer name a designer expects: `icon chevron-down`.
 *
 * lucide-react writes both `lucide-chevron-down` and, in newer releases,
 * `lucide-chevron-down-icon`. The unsuffixed one is the icon's name.
 */
function iconName(svg: Element): string {
  const classes = (svg.getAttribute('class') ?? '').split(/\s+/)
  const names = classes.filter((c) => c.startsWith('lucide-')).map((c) => c.slice(7))
  const name = names.find((n) => !n.endsWith('-icon')) ?? names[0]?.replace(/-icon$/, '')
  return name ? `icon ${name}` : 'icon'
}

/**
 * A CSS transform on the svg element as one matrix, or null for none.
 *
 * Modern CSS spreads a transform over four properties — Tailwind v4's
 * `rotate-180` sets `rotate`, not `transform` — so all of them are read, in
 * the order the spec composes them: translate, rotate, scale, transform.
 */
function elementMatrix(style: CSSStyleDeclaration): DOMMatrix | null {
  try {
    let m = new DOMMatrix()
    if (style.translate && style.translate !== 'none') {
      const [tx, ty = '0px'] = style.translate.split(/\s+/)
      m = m.multiply(new DOMMatrix(`translate(${tx}, ${ty})`))
    }
    if (style.rotate && style.rotate !== 'none') m = m.multiply(new DOMMatrix(`rotate(${style.rotate})`))
    if (style.scale && style.scale !== 'none') {
      const [sx, sy = sx] = style.scale.split(/\s+/)
      m = m.multiply(new DOMMatrix(`scale(${sx}, ${sy})`))
    }
    if (style.transform && style.transform !== 'none') m = m.multiply(new DOMMatrix(style.transform))
    return m.isIdentity ? null : m
  } catch {
    // A 3D rotation or a unit the constructor rejects: draw it untransformed
    // rather than lose the icon.
    return null
  }
}

/**
 * Trace an inline `<svg>` into vector layers, or return null to leave it alone.
 *
 * Fails closed. Anything this cannot reproduce faithfully — a gradient or
 * pattern paint, a mask, a filter, `<use>`, `<text>`, an embedded image, a
 * nested `<svg>` — makes the whole element ineligible and it stays untraced,
 * which is the old behaviour rather than a wrong picture. Shapes are read
 * from the browser's COMPUTED paint, so `stroke="currentColor"`, a Tailwind
 * `text-primary` and a `stroke-[1.5]` all arrive as the colour and width the
 * reader is looking at.
 */
function traceSvg(
  svg: Element,
  box: DOMRect,
  style: CSSStyleDeclaration,
  origin: DOMRect,
  color: (value: string) => string | null,
  opacity: number,
): FrameIcon | null {
  if (svg.namespaceURI !== SVG_NS || svg.localName !== 'svg') return null

  const elements = svg.querySelectorAll('*')
  if (elements.length === 0 || elements.length > MAX_ICON_ELEMENTS) return null

  const viewBoxAttr = (svg.getAttribute('viewBox') ?? '').trim().split(/[\s,]+/).map(Number)
  const [vx, vy, vw, vh] = viewBoxAttr
  const hasViewBox = viewBoxAttr.length === 4 && viewBoxAttr.every(Number.isFinite) && vw > 0 && vh > 0

  const layoutWidth = numeric(style.width) || box.width
  const layoutHeight = numeric(style.height) || box.height

  /*
   * `vector-effect: non-scaling-stroke` keeps a line a fixed number of screen
   * pixels however far its viewBox is stretched — how every sparkline and
   * chart gridline here is drawn, under `preserveAspectRatio="none"`. Figma's
   * importer has no such property, so the stroke would be scaled with the
   * geometry: a 2px line becomes 2 x the horizontal factor on a steep segment.
   * Under a UNIFORM scale that is correctable (divide the width by it). Under
   * a stretch it is not, and the honest answer is to leave the svg untraced.
   */
  const fitX = layoutWidth / (hasViewBox ? vw : layoutWidth)
  const fitY = layoutHeight / (hasViewBox ? vh : layoutHeight)
  const stretch = (svg.getAttribute('preserveAspectRatio') ?? '').trim() === 'none'
  const uniform = stretch ? Math.abs(fitX - fitY) <= 0.01 * Math.max(fitX, fitY) : true
  const strokeScale = stretch ? fitX : Math.min(fitX, fitY)

  const paintOf = (s: CSSStyleDeclaration): IconPaint | null => {
    if (s.fill.includes('url(') || s.stroke.includes('url(')) return null
    const nonScaling = s.vectorEffect === 'non-scaling-stroke'
    if (nonScaling && !uniform) return null
    return {
      fill: color(s.fill) ?? 'none',
      stroke: color(s.stroke) ?? 'none',
      strokeWidth: nonScaling ? numeric(s.strokeWidth) / strokeScale : numeric(s.strokeWidth),
      strokeLinecap: s.strokeLinecap || 'butt',
      strokeLinejoin: s.strokeLinejoin || 'miter',
    }
  }

  const rootPaint = paintOf(style)
  if (!rootPaint) return null

  let refused = false

  const trace = (el: Element, inherited: IconPaint): FrameIconShape | null => {
    const tag = el.localName
    if (!ICON_SHAPES.has(tag)) {
      // <title> and <desc> carry no pixels; everything else does or might.
      if (tag === 'title' || tag === 'desc') return null
      refused = true
      return null
    }

    const s = getComputedStyle(el)
    if (s.display === 'none' || s.visibility === 'hidden') return null
    if (
      (s.mask && s.mask !== 'none') ||
      (s.filter && s.filter !== 'none') ||
      (s.clipPath && s.clipPath !== 'none')
    ) {
      refused = true
      return null
    }

    const paint = paintOf(s)
    if (!paint) {
      refused = true
      return null
    }

    const attrs: Record<string, string> = {}
    for (const name of GEOMETRY_ATTRS) {
      const value = el.getAttribute(name)
      if (value !== null) attrs[name] = value
    }

    // Only what differs from the enclosing group, so a four-path icon states
    // its colour once. `opacity` is not inherited and is stated where it is.
    if (paint.fill !== inherited.fill) attrs.fill = paint.fill
    if (paint.stroke !== inherited.stroke) attrs.stroke = paint.stroke
    if (paint.stroke !== 'none') {
      if (paint.strokeWidth !== inherited.strokeWidth) attrs['stroke-width'] = String(round3(paint.strokeWidth))
      if (paint.strokeLinecap !== inherited.strokeLinecap) attrs['stroke-linecap'] = paint.strokeLinecap
      if (paint.strokeLinejoin !== inherited.strokeLinejoin) attrs['stroke-linejoin'] = paint.strokeLinejoin
    }
    const shapeOpacity = numeric(s.opacity || '1')
    if (shapeOpacity < 1) attrs.opacity = String(round3(shapeOpacity))

    const children: FrameIconShape[] = []
    for (const child of Array.from(el.children)) {
      const traced = trace(child, paint)
      if (traced) children.push(traced)
    }

    return { tag, attrs, children }
  }

  const shapes: FrameIconShape[] = []
  for (const child of Array.from(svg.children)) {
    const traced = trace(child, rootPaint)
    if (traced) shapes.push(traced)
  }
  if (refused || shapes.length === 0) return null

  // With a transform, the bounding box is the TRANSFORMED extent. The layout
  // box is the same shape centred on the same point, shifted by the
  // matrix's own translation, so it is recovered from the centre.
  const matrix = elementMatrix(style)
  const shiftX = matrix?.e ?? 0
  const shiftY = matrix?.f ?? 0
  const centreX = box.left + box.width / 2 - shiftX
  const centreY = box.top + box.height / 2 - shiftY

  return {
    kind: 'icon',
    name: iconName(svg),
    x: centreX - layoutWidth / 2 - origin.left,
    y: centreY - layoutHeight / 2 - origin.top,
    width: layoutWidth,
    height: layoutHeight,
    viewBox: hasViewBox
      ? { x: vx, y: vy, width: vw, height: vh }
      : { x: 0, y: 0, width: layoutWidth, height: layoutHeight },
    stretch,
    matrix: matrix ? [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f] : null,
    opacity,
    ...rootPaint,
    shapes,
  }
}

/**
 * The part of a computed font stack worth carrying across.
 *
 * `getComputedStyle` returns the whole cascade, which on this site ends in
 * four emoji fallbacks — `"Apple Color Emoji", "Segoe UI Emoji", …` — that
 * exist for glyph coverage and say nothing about the typeface. Figma reads
 * the first family it recognises, so the tail is pure noise in a layer
 * panel a designer has to read. Two families is enough to express "this
 * one, or a sans-serif".
 */
function trimFontStack(stack: string): string {
  return stack
    .split(',')
    .map((family) => family.trim())
    .filter((family) => !/emoji/i.test(family))
    .slice(0, 2)
    .join(', ')
}

/**
 * Walk a rendered subtree into frame nodes.
 *
 * Order is document order, which is also paint order closely enough for a
 * static frame: a child is emitted after its parent, so it lands on top,
 * which is what a designer expects from a pasted group.
 */
/** A rectangle in viewport coordinates, for tracking what an ancestor clips. */
interface ClipBox {
  left: number
  top: number
  right: number
  bottom: number
}

/** Whether two boxes share any area. Strict, so a zero-height clip contains nothing. */
function overlaps(a: DOMRect, b: ClipBox): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}

function intersect(clip: ClipBox | null, box: DOMRect): ClipBox {
  if (!clip) return { left: box.left, top: box.top, right: box.right, bottom: box.bottom }
  const left = Math.max(clip.left, box.left)
  const top = Math.max(clip.top, box.top)
  // Never inverted: an empty intersection is a zero-size box, which overlaps nothing.
  return {
    left,
    top,
    right: Math.max(left, Math.min(clip.right, box.right)),
    bottom: Math.max(top, Math.min(clip.bottom, box.bottom)),
  }
}

const CLIPPING = new Set(['hidden', 'clip'])

export function collectFrameNodes(root: HTMLElement, options: CollectOptions = {}): Frame {
  const minSize = options.minSize ?? 2
  const maxNodes = options.maxNodes ?? 600

  /*
   * `willReadFrequently` because `normalizeColor` calls `getImageData` once
   * per colour, and a page frame resolves several hundred. Without the hint
   * the browser keeps the surface on the GPU and every read stalls on a
   * readback — the difference between a frame that copies instantly and one
   * that visibly hangs the tab.
   */
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('figma-frame: a 2D canvas context is required to resolve colours')

  const origin = root.getBoundingClientRect()
  const nodes: FrameNode[] = []

  /*
   * Characters this frame may measure for line breaks, shared across every
   * text node in it. See `ownTextLines` — the cost is per character, and a
   * page-sized frame has a lot of them.
   */
  const textBudget = { left: options.textBudget ?? 4000 }

  const rootStyle = getComputedStyle(root)
  const background = normalizeColor(rootStyle.backgroundColor, ctx)

  /*
   * `normalizeColor` rasterizes a pixel per call. An icon reads fill and stroke
   * for every shape, and the same two or three colours repeat down a page, so
   * they are memoised for the length of one walk.
   */
  const ascents = new Map<string, number>()
  const colors = new Map<string, string | null>()
  const color = (value: string): string | null => {
    if (!colors.has(value)) colors.set(value, normalizeColor(value, ctx))
    return colors.get(value) ?? null
  }

  const walk = (el: Element, clip: ClipBox | null) => {
    if (nodes.length >= maxNodes) return
    if (SKIPPED_TAGS.has(el.tagName)) return

    const style = getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') return

    const opacity = numeric(style.opacity || '1')
    if (opacity === 0) return

    /*
     * Blurred decoration is dropped, subtree and all.
     *
     * Half this catalog's heroes float a `blur-3xl` circle behind the copy
     * as an ambient wash. A blur is not expressible in the SVG this writes,
     * so what pasted was the shape without the blur: a hard-edged, fully
     * opaque disc several hundred pixels across, sitting on top of the
     * headline it was supposed to be a faint glow behind. The reader sees a
     * broken frame, not a simplified one.
     *
     * Dropping it is the honest simplification. The wash contributes nothing
     * a designer would keep, and its absence reads as a clean frame while
     * its presence reads as a bug.
     */
    if (style.filter && style.filter.includes('blur(')) return

    const box = el.getBoundingClientRect()

    /*
     * Content that `overflow: hidden` hides is not drawn.
     *
     * The walker used to read only `display`, `visibility`, opacity and blur, so
     * a collapsed accordion panel — a zero-height `overflow-hidden` box whose
     * text is still laid out at its natural height — was emitted in full and
     * pasted as its own body copy piled on top of the headers beneath it. The
     * browser never shows that text; the frame must not either.
     *
     * Only `hidden` and `clip`, on both axes. A scroll container (`auto`,
     * `scroll`) really does contain content a designer may want to see, and
     * changing what every scrolling block traces is a larger decision than this
     * fix. Absolute and fixed elements are never dropped here: they can escape
     * an ancestor's clip, and telling whether they do needs the containing
     * block, which this walk does not track.
     */
    if (
      clip &&
      !overlaps(box, clip) &&
      style.position !== 'absolute' &&
      style.position !== 'fixed'
    ) {
      return
    }

    const x = box.left - origin.left
    const y = box.top - origin.top

    if (box.width >= minSize && box.height >= minSize) {
      const fill = normalizeColor(style.backgroundColor, ctx)
      const borderWidth = numeric(style.borderTopWidth)
      const stroke = borderWidth > 0 ? normalizeColor(style.borderTopColor, ctx) : null

      /*
       * An element with neither a fill nor a border is pure layout. Emitting
       * it would add a transparent rectangle over everything beneath it —
       * which in Figma is not invisible, it is an unclickable sheet of glass
       * between the designer and the layer they wanted.
       */
      if (fill || stroke) {
        /*
         * Clamped to half the shorter side.
         *
         * Tailwind's `rounded-full` is `border-radius: 9999px`, and a
         * percentage radius resolves against the box — either way the
         * computed value routinely comes back as tens of thousands of
         * pixels (33554400 was the real number on a 6px dot). CSS clamps
         * that to a capsule; SVG's `rx` has no such rule, and Figma imports
         * the literal, so a pill button arrives as a shape with a radius
         * larger than the artboard.
         */
        const radius = Math.min(
          numeric(style.borderTopLeftRadius),
          box.width / 2,
          box.height / 2,
        )

        nodes.push({
          kind: 'rect',
          name: layerName(el),
          x,
          y,
          width: box.width,
          height: box.height,
          fill,
          stroke,
          strokeWidth: borderWidth,
          radius,
          opacity,
        })
      }
    }

    const text = ownText(el)
    if (text && box.width >= minSize) {
      const fill = normalizeColor(style.color, ctx)
      const fontSize = numeric(style.fontSize)
      if (fill && fontSize > 0) {
        const align = style.textAlign
        const anchor: FrameText['anchor'] =
          align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start'
        const shared = {
          fill,
          fontFamily: trimFontStack(style.fontFamily),
          fontSize,
          fontWeight: numeric(style.fontWeight) || 400,
          letterSpacing: style.letterSpacing === 'normal' ? 0 : numeric(style.letterSpacing),
          anchor,
        }

        /*
         * Measure the wrapped lines only when the box is tall enough to hold
         * more than one. Almost every string in a UI is a single line —
         * labels, buttons, table cells — and paying a range measurement per
         * character for all of them would make the copy button perceptibly
         * slower to spare the few headlines that actually wrap.
         */
        const lineHeight = numeric(style.lineHeight) || fontSize * 1.2
        const measured =
          box.height >= lineHeight * 1.7 ? ownTextLines(el, textBudget) : []

        /*
         * Every text layer is positioned where the browser DREW it — the
         * measured line box — never at its element's box. A wrapped block
         * already was; a single line now is too, from one range over its text
         * nodes. See `ownTextBox` for the 16px error this replaced.
         *
         * A tall box holding one line (a `h-10` button) measures as a single
         * line above, so it takes the same path. The element's box is the
         * fallback only for text with no geometry at all.
         */
        let placed: TextLine[] = measured
        if (placed.length === 0) {
          const drawn = ownTextBox(el)
          placed = [
            {
              text,
              left: drawn?.left ?? box.left,
              top: drawn?.top ?? box.top,
              width: drawn?.width ?? box.width,
            },
          ]
        }

        /*
         * SVG places text on its baseline; a range gives the run's box, whose
         * top is one font ascent above it. Adding the font's real ascent puts
         * the baseline where the browser has it, per font and size, where the
         * old `top + fontSize` was right for one font at one leading.
         */
        const ascent = fontAscent(ctx, style, fontSize, ascents)
        const split = placed.length > 1

        for (const line of placed) {
          const lx = line.left - origin.left
          const anchorX =
            anchor === 'middle' ? lx + line.width / 2 : anchor === 'end' ? lx + line.width : lx
          const label = split ? line.text : text

          nodes.push({
            kind: 'text',
            name: label.length > 40 ? `${label.slice(0, 40)}…` : label,
            x: anchorX,
            y: line.top - origin.top + ascent,
            text: split ? line.text : text,
            ...shared,
          })
        }
      }
    }

    /*
     * An inline SVG is drawn, not descended into. `traceSvg` returns null for
     * anything it cannot reproduce faithfully, and then the walk carries on
     * exactly as it did before icons were traced.
     */
    if (el.namespaceURI === SVG_NS && el.localName === 'svg' && box.width >= minSize && box.height >= minSize) {
      const icon = traceSvg(el, box, style, origin, color, opacity)
      if (icon) {
        nodes.push(icon)
        return
      }
    }

    const clipsBoth = CLIPPING.has(style.overflowX) && CLIPPING.has(style.overflowY)
    const childClip = clipsBoth ? intersect(clip, box) : clip
    for (const child of Array.from(el.children)) walk(child, childClip)
  }

  for (const child of Array.from(root.children)) walk(child, null)

  return {
    name: root.dataset.figmaFrameName || 'Frame',
    width: origin.width,
    height: origin.height,
    nodes,
    background,
  }
}

/** The whole path, for a caller that just wants the string. */
export function frameToSvg(root: HTMLElement, name: string, options?: CollectOptions): string {
  const frame = collectFrameNodes(root, options)
  return serializeFrame({ ...frame, name })
}
