/**
 * A tiny, dependency-free HTML parser + renderer.
 *
 * Why not DOMParser? The original `html-to-react.ts` used it, which pinned
 * the whole conversion to the browser. Every consumer added since —
 * the `/api/v1` codegen routes, the CLI (`npx hoverlab add …`), the MCP
 * server, and the ZIP builder — runs in Node, where DOMParser doesn't
 * exist. Rather than pull in jsdom (3 MB, and a server-only dependency
 * inside a module the client also imports), we parse the subset of HTML
 * the catalog actually contains.
 *
 * That subset is small and verifiable: every one of the 1,616 effects uses
 * plain elements (a, button, div, h2, h4, input, label, nav, p, span),
 * five attributes (class, for, id, placeholder, type), the boolean
 * `checked`, and no comments. The parser handles rather more than that —
 * quoted/unquoted/bare attributes, void elements, raw-text elements,
 * comments, doctypes, and unclosed tags — so hand-written and
 * community-submitted effects don't hit a cliff.
 *
 * The tree is deliberately mutable and carries parent links: the Tailwind
 * converter walks it, matches CSS selectors against it, and annotates
 * nodes in place.
 */

export interface HtmlAttr {
  name: string
  /** `null` for boolean attributes written bare, e.g. `checked`. */
  value: string | null
}

export interface HtmlElement {
  type: 'element'
  tag: string
  attrs: HtmlAttr[]
  children: HtmlNode[]
  /** Set by the parser; `null` on the synthetic root. Not JSON-safe (cyclic). */
  parent: HtmlElement | null
}

export interface HtmlText {
  type: 'text'
  value: string
}

export interface HtmlComment {
  type: 'comment'
  value: string
}

export type HtmlNode = HtmlElement | HtmlText | HtmlComment

/** Elements that never have children and must self-close in JSX. */
export const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
])

/** Elements whose content is text, not markup — never re-parsed as tags. */
const RAW_TEXT_ELEMENTS = new Set(['script', 'style', 'textarea', 'title'])

/**
 * Elements that implicitly close a previously-open element of the same
 * kind. Keeps `<p>a<p>b` from nesting, which would otherwise corrupt the
 * structural selector matching downstream.
 */
const AUTO_CLOSE: Record<string, Set<string>> = {
  li: new Set(['li']),
  p: new Set(['p']),
  td: new Set(['td', 'th']),
  th: new Set(['td', 'th']),
  tr: new Set(['tr']),
  option: new Set(['option']),
}

/* ------------------------------------------------------------------ *
 *  Parsing
 * ------------------------------------------------------------------ */

interface OpenTag {
  tag: string
  attrs: HtmlAttr[]
  selfClosing: boolean
  /** Index just past the closing `>`. */
  end: number
}

function isNameStart(ch: string): boolean {
  return /[A-Za-z]/.test(ch)
}

/**
 * Parse an opening tag starting at `start` (which must point at `<`).
 * Returns null when the `<` isn't actually a tag, so the caller can treat
 * it as literal text.
 */
function parseOpenTag(src: string, start: number): OpenTag | null {
  let i = start + 1
  if (i >= src.length || !isNameStart(src[i])) return null

  const nameStart = i
  while (i < src.length && !/[\s/>]/.test(src[i])) i++
  const tag = src.slice(nameStart, i).toLowerCase()

  const attrs: HtmlAttr[] = []
  let selfClosing = false

  for (;;) {
    while (i < src.length && /\s/.test(src[i])) i++
    if (i >= src.length) break

    if (src[i] === '>') {
      i++
      break
    }
    if (src[i] === '/' && src[i + 1] === '>') {
      selfClosing = true
      i += 2
      break
    }
    // Stray '/' inside the tag — skip it.
    if (src[i] === '/') {
      i++
      continue
    }

    // Attribute name: everything up to whitespace, '=', '/', or '>'.
    const attrStart = i
    while (i < src.length && !/[\s=/>]/.test(src[i])) i++
    const name = src.slice(attrStart, i)
    if (!name) {
      i++
      continue
    }

    while (i < src.length && /\s/.test(src[i])) i++

    if (src[i] !== '=') {
      // Bare boolean attribute, e.g. `checked`.
      attrs.push({ name, value: null })
      continue
    }

    i++ // consume '='
    while (i < src.length && /\s/.test(src[i])) i++

    const quote = src[i]
    if (quote === '"' || quote === "'") {
      i++
      const valueStart = i
      while (i < src.length && src[i] !== quote) i++
      attrs.push({ name, value: src.slice(valueStart, i) })
      i++ // consume closing quote
    } else {
      const valueStart = i
      while (i < src.length && !/[\s>]/.test(src[i])) i++
      attrs.push({ name, value: src.slice(valueStart, i) })
    }
  }

  return { tag, attrs, selfClosing, end: i }
}

/**
 * Parse an HTML fragment into a node tree.
 *
 * Never throws: malformed input degrades to text nodes rather than
 * failing an export the user is waiting on.
 */
export function parseHtml(src: string): HtmlNode[] {
  const root: HtmlElement = {
    type: 'element',
    tag: '#root',
    attrs: [],
    children: [],
    parent: null,
  }
  const stack: HtmlElement[] = [root]
  const top = () => stack[stack.length - 1]

  const pushText = (value: string) => {
    if (!value) return
    top().children.push({ type: 'text', value })
  }

  let i = 0
  while (i < src.length) {
    const lt = src.indexOf('<', i)
    if (lt === -1) {
      pushText(src.slice(i))
      break
    }
    if (lt > i) pushText(src.slice(i, lt))

    // Comment
    if (src.startsWith('<!--', lt)) {
      const close = src.indexOf('-->', lt + 4)
      const value = src.slice(lt + 4, close === -1 ? src.length : close)
      top().children.push({ type: 'comment', value })
      i = close === -1 ? src.length : close + 3
      continue
    }

    // Doctype / CDATA / processing instruction — dropped.
    if (src[lt + 1] === '!' || src[lt + 1] === '?') {
      const close = src.indexOf('>', lt)
      i = close === -1 ? src.length : close + 1
      continue
    }

    // Closing tag
    if (src[lt + 1] === '/') {
      const close = src.indexOf('>', lt)
      const name = src
        .slice(lt + 2, close === -1 ? src.length : close)
        .trim()
        .toLowerCase()
      // Unwind to the nearest matching open element. If there is no match
      // the stray close tag is ignored rather than popping the root.
      for (let s = stack.length - 1; s > 0; s--) {
        if (stack[s].tag === name) {
          stack.length = s
          break
        }
      }
      i = close === -1 ? src.length : close + 1
      continue
    }

    const open = parseOpenTag(src, lt)
    if (!open) {
      pushText('<')
      i = lt + 1
      continue
    }

    // Implicit close, e.g. `<li>a<li>b`.
    const autoCloses = AUTO_CLOSE[open.tag]
    if (autoCloses && stack.length > 1 && autoCloses.has(top().tag)) {
      stack.pop()
    }

    const el: HtmlElement = {
      type: 'element',
      tag: open.tag,
      attrs: open.attrs,
      children: [],
      parent: top(),
    }
    top().children.push(el)
    i = open.end

    if (open.selfClosing || VOID_ELEMENTS.has(open.tag)) continue

    if (RAW_TEXT_ELEMENTS.has(open.tag)) {
      // Content is literal until the matching close tag.
      const closeIdx = src.toLowerCase().indexOf(`</${open.tag}`, i)
      const text = src.slice(i, closeIdx === -1 ? src.length : closeIdx)
      if (text) el.children.push({ type: 'text', value: text })
      if (closeIdx === -1) {
        i = src.length
      } else {
        const gt = src.indexOf('>', closeIdx)
        i = gt === -1 ? src.length : gt + 1
      }
      continue
    }

    stack.push(el)
  }

  return root.children
}

/* ------------------------------------------------------------------ *
 *  Tree helpers
 * ------------------------------------------------------------------ */

export function isElement(node: HtmlNode): node is HtmlElement {
  return node.type === 'element'
}

/** Every element in the tree, in document order. */
export function walkElements(nodes: HtmlNode[]): HtmlElement[] {
  const out: HtmlElement[] = []
  const visit = (list: HtmlNode[]) => {
    for (const node of list) {
      if (!isElement(node)) continue
      out.push(node)
      visit(node.children)
    }
  }
  visit(nodes)
  return out
}

export function getAttr(el: HtmlElement, name: string): string | null | undefined {
  const found = el.attrs.find((a) => a.name.toLowerCase() === name.toLowerCase())
  return found ? found.value : undefined
}

export function setAttr(el: HtmlElement, name: string, value: string | null): void {
  const found = el.attrs.find((a) => a.name.toLowerCase() === name.toLowerCase())
  if (found) found.value = value
  else el.attrs.push({ name, value })
}

export function removeAttr(el: HtmlElement, name: string): void {
  const idx = el.attrs.findIndex((a) => a.name.toLowerCase() === name.toLowerCase())
  if (idx !== -1) el.attrs.splice(idx, 1)
}

export function classList(el: HtmlElement): string[] {
  const value = getAttr(el, 'class')
  if (!value) return []
  return value.split(/\s+/).filter(Boolean)
}

/** Element children only — what `:nth-child` / `+` operate on. */
export function elementChildren(el: HtmlElement): HtmlElement[] {
  return el.children.filter(isElement)
}

/**
 * The single root element of a fragment, if there is exactly one (ignoring
 * whitespace-only text). Several exporters special-case this: it's what
 * lets styled-components attach to the real root tag instead of adding a
 * wrapper div.
 */
export function singleRoot(nodes: HtmlNode[]): HtmlElement | null {
  const meaningful = nodes.filter(
    (n) => n.type !== 'text' || n.value.trim().length > 0,
  )
  if (meaningful.length === 1 && isElement(meaningful[0])) return meaningful[0]
  return null
}

/* ------------------------------------------------------------------ *
 *  Rendering
 * ------------------------------------------------------------------ */

/** Attribute name remaps applied when rendering JSX. */
const JSX_ATTR_MAP: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  minlength: 'minLength',
  contenteditable: 'contentEditable',
  crossorigin: 'crossOrigin',
  autocomplete: 'autoComplete',
  autocapitalize: 'autoCapitalize',
  autocorrect: 'autoCorrect',
  spellcheck: 'spellCheck',
  srcset: 'srcSet',
  usemap: 'useMap',
  datetime: 'dateTime',
  enctype: 'encType',
  formaction: 'formAction',
  formmethod: 'formMethod',
  formtarget: 'formTarget',
  formenctype: 'formEncType',
  formnovalidate: 'formNoValidate',
  novalidate: 'noValidate',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  hreflang: 'hrefLang',
  accesskey: 'accessKey',
  srclang: 'srcLang',
}

/**
 * JSX attributes whose value must be an expression, not a string —
 * `checked="checked"` is a React warning, `checked={true}` is not.
 */
const JSX_BOOLEAN_ATTRS = new Set([
  'checked', 'disabled', 'readonly', 'required', 'selected',
  'multiple', 'autofocus', 'hidden', 'open', 'novalidate', 'default',
])

/**
 * SVG elements whose names are camelCase.
 *
 * The parser lowercases tag names on purpose — the structural selector
 * matching downstream depends on it — and in an HTML document that is
 * harmless, because the HTML parser case-corrects known SVG elements on
 * the way in. JSX has no such repair: `<lineargradient>` is an unknown
 * lowercase element, React renders it into the SVG namespace verbatim, and
 * the gradient silently does not exist. So the casing is put back at the
 * point of rendering, which is the only place it matters.
 */
const SVG_TAG_CASE: Record<string, string> = Object.fromEntries(
  [
    'animateMotion', 'animateTransform', 'clipPath', 'feBlend', 'feColorMatrix',
    'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting',
    'feDisplacementMap', 'feDistantLight', 'feDropShadow', 'feFlood', 'feFuncA',
    'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge',
    'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting',
    'feSpotLight', 'feTile', 'feTurbulence', 'foreignObject', 'linearGradient',
    'radialGradient', 'textPath',
  ].map((tag) => [tag.toLowerCase(), tag]),
)

/**
 * SVG attributes that are camelCase rather than dash-case.
 *
 * The dashed ones (`stroke-width`, `clip-rule`) need no table — the
 * general dash-to-camel rule in `jsxAttrName` covers them, and covers the
 * HTML stragglers (`http-equiv`, `accept-charset`) with the same line.
 * These are the ones no rule can derive, and they are only consulted when
 * the source wrote them in lowercase; markup that already says `viewBox`
 * keeps its own casing.
 */
const SVG_ATTR_CASE: Record<string, string> = Object.fromEntries(
  [
    'viewBox', 'preserveAspectRatio', 'gradientUnits', 'gradientTransform',
    'spreadMethod', 'patternUnits', 'patternContentUnits', 'patternTransform',
    'clipPathUnits', 'maskUnits', 'maskContentUnits', 'markerWidth', 'markerHeight',
    'markerUnits', 'refX', 'refY', 'startOffset', 'textLength', 'lengthAdjust',
    'pathLength', 'baseFrequency', 'numOctaves', 'stitchTiles', 'surfaceScale',
    'specularConstant', 'specularExponent', 'diffuseConstant', 'kernelMatrix',
    'primitiveUnits', 'filterUnits', 'stdDeviation', 'xChannelSelector',
    'yChannelSelector', 'tableValues', 'edgeMode', 'attributeName', 'repeatCount',
    'calcMode', 'keyTimes', 'keySplines', 'keyPoints',
  ].map((attr) => [attr.toLowerCase(), attr]),
)

/**
 * The JSX spelling of one attribute name.
 *
 * Order matters. The explicit map wins (`class` is never `class`), then
 * dash-case becomes camelCase — except `data-*` and `aria-*`, which JSX
 * takes literally and which are the only dashed names React does not
 * rewrite. Anything the source already spelled with a capital is left
 * alone, so hand-written `viewBox` survives without a table entry.
 */
function jsxAttrName(original: string): string {
  const lower = original.toLowerCase()
  const mapped = JSX_ATTR_MAP[lower]
  if (mapped) return mapped

  if (lower.startsWith('data-') || lower.startsWith('aria-')) return lower

  if (lower.includes('-')) {
    // `-webkit-box-orient` → `WebkitBoxOrient`, `stroke-width` → `strokeWidth`.
    const camel = lower.replace(/-([a-z0-9])/g, (_m, ch: string) => ch.toUpperCase())
    return lower.startsWith('-') ? camel.charAt(0).toUpperCase() + camel.slice(1) : camel
  }

  if (original !== lower) return original
  return SVG_ATTR_CASE[lower] ?? lower
}

/**
 * Inline event handlers, in React's spelling.
 *
 * `onclick="save()"` is the second-commonest way a paste breaks: JSX has no
 * `onclick` prop, so the handler is dropped on the floor with no error at
 * all — the button renders and does nothing, which is far harder to
 * diagnose than a crash. React's names are camelCase over the DOM event
 * word, and the word boundaries are not derivable (`onmouseover` is
 * `onMouseOver`, not `onMouseover`), so they are listed.
 *
 * Anything not listed is left exactly as authored and reported by the
 * caller, because a guessed handler name is a handler that silently does
 * not fire.
 */
const JSX_EVENT_MAP: Record<string, string> = {
  onclick: 'onClick', ondblclick: 'onDoubleClick', onmousedown: 'onMouseDown',
  onmouseup: 'onMouseUp', onmouseover: 'onMouseOver', onmouseout: 'onMouseOut',
  onmouseenter: 'onMouseEnter', onmouseleave: 'onMouseLeave', onmousemove: 'onMouseMove',
  oncontextmenu: 'onContextMenu', onkeydown: 'onKeyDown', onkeyup: 'onKeyUp',
  onkeypress: 'onKeyPress', onfocus: 'onFocus', onblur: 'onBlur', onchange: 'onChange',
  oninput: 'onInput', onsubmit: 'onSubmit', onreset: 'onReset', onselect: 'onSelect',
  onscroll: 'onScroll', onwheel: 'onWheel', oncopy: 'onCopy', oncut: 'onCut',
  onpaste: 'onPaste', ondrag: 'onDrag', ondragstart: 'onDragStart', ondragend: 'onDragEnd',
  ondragover: 'onDragOver', ondrop: 'onDrop', ontouchstart: 'onTouchStart',
  ontouchend: 'onTouchEnd', ontouchmove: 'onTouchMove', onload: 'onLoad',
  onerror: 'onError', ontransitionend: 'onTransitionEnd', onanimationend: 'onAnimationEnd',
}

/** True for an attribute this renderer knows how to spell as a React prop. */
export function isJsxEventAttr(name: string): boolean {
  return name.toLowerCase() in JSX_EVENT_MAP
}

/** `font-size` → `fontSize`; `--brand` stays as it is; `-webkit-x` → `WebkitX`. */
function styleProperty(name: string): string {
  const prop = name.trim()
  if (prop.startsWith('--')) return prop
  const camel = prop.replace(/-([a-zA-Z0-9])/g, (_m, ch: string) => ch.toUpperCase())
  // A leading dash survived the replace as a capital: `-webkit-` → `Webkit`.
  return prop.startsWith('-') ? camel.charAt(0).toUpperCase() + camel.slice(1) : camel
}

/**
 * Split a style attribute on `;`, ignoring the ones inside `url(...)`,
 * `var(--x, ;)` or a quoted string. `background: url(a;b.png)` is rare and
 * splitting it produces two declarations that are both wrong.
 */
function splitDeclarations(value: string): string[] {
  const out: string[] = []
  let depth = 0
  let quote: string | null = null
  let current = ''

  for (const ch of value) {
    if (quote) {
      current += ch
      if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      current += ch
      continue
    }
    if (ch === '(') depth++
    if (ch === ')') depth = Math.max(0, depth - 1)
    if (ch === ';' && depth === 0) {
      out.push(current)
      current = ''
      continue
    }
    current += ch
  }
  out.push(current)
  return out.map((d) => d.trim()).filter(Boolean)
}

/**
 * `style="color: red"` as a JSX expression.
 *
 * This is the single most common way a pasted snippet breaks in React:
 * `style` takes an object, and a string throws at render with an error
 * that names the prop but not the file. Rendered as `{{ … }}` here so the
 * output runs rather than compiles-and-crashes.
 *
 * Returns null when there is nothing convertible, so the caller can drop
 * the attribute rather than emit `style={{}}`.
 */
export function styleAttrToJsx(value: string): string | null {
  const entries: string[] = []

  for (const decl of splitDeclarations(value)) {
    const colon = decl.indexOf(':')
    if (colon < 0) continue
    const name = decl.slice(0, colon).trim()
    const raw = decl.slice(colon + 1).trim()
    if (!name || !raw) continue

    const key = styleProperty(name)
    // Custom properties and anything camelCase-unsafe need quoting.
    const quotedKey = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : `'${key}'`
    entries.push(`${quotedKey}: '${raw.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`)
  }

  return entries.length ? `{{ ${entries.join(', ')} }}` : null
}

export interface RenderOptions {
  /** Emit JSX rather than HTML: className, self-closed voids, `{}` escaped. */
  jsx?: boolean
  /** Starting indentation for top-level nodes. */
  indent?: string
  /** One level of indentation. */
  indentUnit?: string
  /**
   * Override the rendered class attribute per element. Return `undefined`
   * to keep the original, or `''` to drop the attribute entirely. Used by
   * the Tailwind exporter to swap semantic classes for utilities.
   */
  classOverride?: (el: HtmlElement) => string | undefined
  /**
   * React controlled-input escape hatch: when true, `checked` / `value` on
   * inputs render as `defaultChecked` / `defaultValue` so React doesn't
   * warn about an input with a value and no onChange.
   */
  reactUncontrolled?: boolean
}

function escapeJsxText(text: string): string {
  // `{` and `}` are JSX expression delimiters; `<` and `>` would open tags.
  return text
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttrValue(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function renderAttrs(el: HtmlElement, opts: RenderOptions): string {
  const parts: string[] = []

  for (const attr of el.attrs) {
    const lower = attr.name.toLowerCase()

    let value = attr.value
    if (lower === 'class' && opts.classOverride) {
      const override = opts.classOverride(el)
      if (override !== undefined) {
        if (override === '') continue // drop the attribute
        value = override
      }
    }

    if (!opts.jsx) {
      parts.push(value === null ? attr.name : `${attr.name}="${escapeAttrValue(value)}"`)
      continue
    }

    let name = jsxAttrName(attr.name)
    if (opts.reactUncontrolled && lower === 'checked') name = 'defaultChecked'
    if (opts.reactUncontrolled && lower === 'value' && el.tag === 'input') name = 'defaultValue'

    if (lower === 'style' && value !== null) {
      // A string here is a runtime throw in React, not a warning.
      const object = styleAttrToJsx(value)
      if (object) parts.push(`style=${object}`)
      continue
    }

    const eventName = JSX_EVENT_MAP[lower]
    if (eventName && value !== null) {
      // Wrapped rather than passed through: React wants a function, and
      // the body is the user's own code, so it is kept verbatim inside one.
      parts.push(`${eventName}={() => { ${value.trim().replace(/;$/, '')} }}`)
      continue
    }

    if (value === null) {
      // Bare boolean — JSX treats a valueless attribute as `true`.
      parts.push(name)
    } else if (JSX_BOOLEAN_ATTRS.has(lower)) {
      parts.push(`${name}={true}`)
    } else {
      parts.push(`${name}="${escapeAttrValue(value)}"`)
    }
  }

  // An element whose only class was overridden away can end up with none.
  if (opts.jsx && opts.classOverride && !el.attrs.some((a) => a.name.toLowerCase() === 'class')) {
    const override = opts.classOverride(el)
    if (override) parts.push(`className="${escapeAttrValue(override)}"`)
  } else if (!opts.jsx && opts.classOverride && !el.attrs.some((a) => a.name.toLowerCase() === 'class')) {
    const override = opts.classOverride(el)
    if (override) parts.push(`class="${escapeAttrValue(override)}"`)
  }

  return parts.length ? ' ' + parts.join(' ') : ''
}

/**
 * Render a node tree back to markup.
 *
 * Formatting rule: an element whose children are a single text node stays
 * on one line (`<button class="x">Click me</button>`); anything else gets
 * one child per line. That matches how the catalog's source is written, so
 * exported code diffs cleanly against what users see in the preview.
 */
export function renderMarkup(nodes: HtmlNode[], opts: RenderOptions = {}): string {
  const indentUnit = opts.indentUnit ?? '  '
  const jsx = opts.jsx === true

  /* SVG element names only get their casing back in JSX — see
     SVG_TAG_CASE. HTML output leaves them lowercase, which is what an HTML
     parser would hand back anyway. */
  const tagName = (tag: string): string => (jsx ? SVG_TAG_CASE[tag] ?? tag : tag)

  const renderNode = (node: HtmlNode, indent: string): string => {
    if (node.type === 'text') {
      const trimmed = node.value.trim()
      if (!trimmed) return ''
      return indent + (jsx ? escapeJsxText(trimmed) : trimmed)
    }
    if (node.type === 'comment') {
      const body = node.value.trim()
      return jsx ? `${indent}{/* ${body} */}` : `${indent}<!-- ${body} -->`
    }

    const attrs = renderAttrs(node, opts)
    const isVoid = VOID_ELEMENTS.has(node.tag)

    if (isVoid) {
      return `${indent}<${tagName(node.tag)}${attrs} />`
    }

    const meaningful = node.children.filter(
      (c) => c.type !== 'text' || c.value.trim().length > 0,
    )

    if (meaningful.length === 0) {
      return `${indent}<${tagName(node.tag)}${attrs}></${tagName(node.tag)}>`
    }

    // Single text child → keep it inline.
    if (meaningful.length === 1 && meaningful[0].type === 'text') {
      const text = meaningful[0].value.trim()
      return `${indent}<${tagName(node.tag)}${attrs}>${jsx ? escapeJsxText(text) : text}</${tagName(node.tag)}>`
    }

    const inner = meaningful
      .map((c) => renderNode(c, indent + indentUnit))
      .filter(Boolean)
      .join('\n')

    return `${indent}<${tagName(node.tag)}${attrs}>\n${inner}\n${indent}</${tagName(node.tag)}>`
  }

  return nodes
    .map((n) => renderNode(n, opts.indent ?? ''))
    .filter(Boolean)
    .join('\n')
}

/** Convenience: parse then re-render, normalizing formatting. */
export function formatHtml(src: string, indent = ''): string {
  return renderMarkup(parseHtml(src), { indent })
}
