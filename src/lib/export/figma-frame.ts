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
 * is also not a component import: what arrives is a group of rectangles and
 * text layers, not an instance with props.
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

export type FrameNode = FrameRect | FrameText

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

  const body = frame.nodes.map((node, i) =>
    node.kind === 'rect' ? rectElement(node, names[i]) : textElement(node, names[i]),
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

function numeric(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
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

  const rootStyle = getComputedStyle(root)
  const background = normalizeColor(rootStyle.backgroundColor, ctx)

  const walk = (el: Element) => {
    if (nodes.length >= maxNodes) return
    if (SKIPPED_TAGS.has(el.tagName)) return

    const style = getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') return

    const opacity = numeric(style.opacity || '1')
    if (opacity === 0) return

    const box = el.getBoundingClientRect()
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
        /*
         * SVG places text on its baseline; the DOM gives a box. Approximating
         * the baseline as the box top plus the font size is close enough for
         * a frame a designer will nudge anyway, and much closer than using
         * the box top raw — which would float every label above its own
         * button by most of a line.
         */
        const align = style.textAlign
        const anchor = align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start'
        const anchorX = anchor === 'middle' ? x + box.width / 2 : anchor === 'end' ? x + box.width : x

        nodes.push({
          kind: 'text',
          name: text.length > 40 ? `${text.slice(0, 40)}…` : text,
          x: anchorX,
          y: y + fontSize,
          text,
          fill,
          fontFamily: trimFontStack(style.fontFamily),
          fontSize,
          fontWeight: numeric(style.fontWeight) || 400,
          letterSpacing: style.letterSpacing === 'normal' ? 0 : numeric(style.letterSpacing),
          anchor,
        })
      }
    }

    for (const child of Array.from(el.children)) walk(child)
  }

  for (const child of Array.from(root.children)) walk(child)

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
