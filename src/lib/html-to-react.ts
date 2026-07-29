/**
 * Convert plain HTML + CSS into a ready-to-paste React component.
 *
 * Strategy:
 *  - Parse the HTML with the DOMParser (available in browsers; Node has it
 *    via jsdom but we don't depend on that here — this function only runs
 *    client-side, triggered from the CodeBlock's "Copy as React" button).
 *  - Walk the parsed tree, converting each element to JSX:
 *      • class → className
 *      • for   → htmlFor
 *      • Self-close void elements (<input> → <input />)
 *      • Leave text nodes alone.
 *  - Wrap the JSX in a function component that injects the CSS via a
 *    <style> tag. This is the simplest pattern that works for any CSS
 *    that uses class selectors — no CSS modules, no styled-components,
 *    no build step required.
 *  - Component name is derived from the effect ID (PascalCase).
 *
 * The output is opinionated but practical: paste into any React app
 * (Next.js, CRA, Vite) and it just works.
 */

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
])

const ATTR_MAP: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
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
  maxlength: 'maxLength',
  minlength: 'minLength',
  placeholder: 'placeholder',
}

function pascalCase(id: string): string {
  // "btn-gradient" → "BtnGradient", "fx_loader_3" → "FxLoader3"
  const parts = id.split(/[-_\s]+/).filter(Boolean)
  let name = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('')
  // Strip non-alphanumeric (except letters/digits).
  name = name.replace(/[^A-Za-z0-9]/g, '')
  // Ensure it starts with a letter.
  if (!name || /^[0-9]/.test(name)) name = `Effect${name}`
  return name
}

function escapeJsxText(text: string): string {
  // Escape curly braces, <, >, and backticks in text content.
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
}

function attrToString(name: string, value: string | null, indent: string): string {
  const jsxName = ATTR_MAP[name.toLowerCase()] ?? name.toLowerCase()
  if (value === null) return ` ${jsxName}`
  // Escape any embedded quotes.
  const v = value.replace(/"/g, '&quot;')
  return `${indent}  ${jsxName}="${v}"`
}

function domNodeToJsx(node: ChildNode, indent: string): string {
  if (node.nodeType === 3 /* Node.TEXT_NODE */) {
    const text = node.textContent ?? ''
    const trimmed = text.trim()
    if (!trimmed) return ''
    return `${indent}${escapeJsxText(text)}`
  }
  if (node.nodeType !== 1 /* Node.ELEMENT_NODE */) return ''
  const el = node as Element
  const tag = el.tagName.toLowerCase()
  const isVoid = VOID_ELEMENTS.has(tag)

  // Build attribute lines.
  const attrLines: string[] = []
  for (const attr of Array.from(el.attributes)) {
    attrLines.push(`  ${ATTR_MAP[attr.name.toLowerCase()] ?? attr.name.toLowerCase()}="${attr.value.replace(/"/g, '&quot;')}"`)
  }
  const attrString = attrLines.length > 0
    ? attrLines.map((l) => `\n${indent}${l}`).join('') + `\n${indent}`
    : ''

  if (isVoid) {
    return `${indent}<${tag}${attrLines.length > 0 ? '\n' + attrLines.map((l) => `${indent}${l}`).join('\n') + '\n' + indent : ''} />`
  }

  // Process children.
  const childNodes = Array.from(el.childNodes)
  const childLines = childNodes
    .map((c) => domNodeToJsx(c, indent + '  '))
    .filter((s) => s.length > 0)
  if (childLines.length === 0) {
    return `${indent}<${tag}${attrString}></${tag}>`
  }
  // If the only child is a single text node, inline it.
  if (
    childLines.length === 1 &&
    childNodes[0]?.nodeType === 3 &&
    !childLines[0].includes('\n')
  ) {
    const text = (childNodes[0].textContent ?? '').trim()
    return `${indent}<${tag}${attrString.replace(/\s+$/, '')}${attrString ? '' : ' '}>${escapeJsxText(text)}</${tag}>`
  }
  return [
    `${indent}<${tag}${attrString}>`,
    ...childLines,
    `${indent}</${tag}>`,
  ].join('\n')
}

export interface ReactConversionOptions {
  effectId: string
  html: string
  css: string
  /** Optional: include a leading comment block with effect metadata. */
  includeHeaderComment?: boolean
}

export function convertToReactComponent({
  effectId,
  html,
  css,
  includeHeaderComment = true,
}: ReactConversionOptions): string {
  if (typeof document === 'undefined') {
    throw new Error('convertToReactComponent can only run in the browser (needs DOMParser).')
  }
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<root>${html}</root>`, 'text/html')
  const root = doc.querySelector('root')!
  const componentName = pascalCase(effectId)

  // Convert each top-level child of <root>.
  const jsxParts: string[] = []
  for (const child of Array.from(root.childNodes)) {
    const jsx = domNodeToJsx(child, '    ')
    if (jsx) jsxParts.push(jsx)
  }
  const jsxBody = jsxParts.join('\n')

  // Escape the CSS for embedding inside a template literal.
  const cssEscaped = css.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')

  const header = includeHeaderComment
    ? `/**
 * ${componentName} — generated by Hoverlab from effect "${effectId}".
 * Paste this file into your React app (Next.js, CRA, Vite, Remix, etc.)
 * and import { ${componentName} } from './${componentName}'.
 *
 * The CSS is injected via a <style> tag so the class-based selectors work
 * globally — the same as in the original demo. For production, consider
 * moving the CSS into a CSS module or styled-components.
 */
`
    : ''

  return `${header}export function ${componentName}() {
  return (
    <>
      <style>{\`${cssEscaped}\`}</style>
${jsxBody}
    </>
  )
}
`
}
