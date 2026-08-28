/**
 * Code as a picture — the tokenizer, the themes, and the renderer.
 *
 * Everything here draws to a canvas, including the on-screen preview. That is
 * the point rather than an implementation detail: the usual way to build this
 * is to style a `<pre>` and then screenshot the DOM through an SVG
 * `foreignObject`, which quietly re-renders under different font metrics and
 * hands you a file that is not the thing you approved. One layout function,
 * called once for the preview and once at export scale, cannot drift.
 *
 * The highlighter is ours and small. A real grammar engine is megabytes and
 * wants a network request for its themes, and this site's whole claim about
 * the tools is that they run in the tab with nothing uploaded — a claim worth
 * more here than in most places, because the input is somebody's source code.
 * The cost is honest: this is a scanner, not a parser. It knows strings,
 * comments, numbers, keywords and the shapes of tags and properties, and it
 * will colour a keyword used as a property name. For a snippet in a slide or
 * a release note, that is the right trade.
 *
 * Nothing in this file touches the DOM beyond the canvas context it is given,
 * so the layout maths is testable (`code-image.test.ts`) and the same numbers
 * decide the preview, the PNG and the SVG.
 */

export type TokenKind =
  | 'plain'
  | 'comment'
  | 'string'
  | 'number'
  | 'keyword'
  | 'fn'
  | 'punct'
  | 'tag'
  | 'attr'
  | 'prop'

export interface Token {
  text: string
  kind: TokenKind
}

export type CodeLanguage = 'tsx' | 'css' | 'html' | 'json' | 'shell' | 'plain'

export const LANGUAGES: { id: CodeLanguage; name: string }[] = [
  { id: 'tsx', name: 'TypeScript / JSX' },
  { id: 'css', name: 'CSS' },
  { id: 'html', name: 'HTML' },
  { id: 'json', name: 'JSON' },
  { id: 'shell', name: 'Shell' },
  { id: 'plain', name: 'Plain text' },
]

const JS_KEYWORDS = new Set(
  `await async break case catch class const continue default delete do else export extends
   finally for from function if implements import in instanceof interface let new of return
   satisfies static super switch this throw try type typeof var void while yield as enum
   readonly public private protected declare namespace true false null undefined`.split(/\s+/),
)

const SHELL_KEYWORDS = new Set(
  `if then else elif fi for in do done while case esac function return export local
   set unset source alias cd echo exit`.split(/\s+/),
)

const JSON_LITERALS = new Set(['true', 'false', 'null'])

const IDENT_START = /[A-Za-z_$@#-]/
const IDENT_BODY = /[A-Za-z0-9_$-]/

/**
 * Source into rows of coloured runs.
 *
 * One pass over the whole string rather than one per line, because the three
 * things that span lines — block comments, template literals, HTML tags — are
 * exactly the three a per-line scanner gets wrong, and getting them wrong
 * shows up as a page of green after one stray `/*`.
 */
export function tokenize(code: string, lang: CodeLanguage): Token[][] {
  const lines: Token[][] = [[]]

  function push(text: string, kind: TokenKind) {
    if (!text) return
    const parts = text.split('\n')
    parts.forEach((part, n) => {
      if (n > 0) lines.push([])
      if (part) lines[lines.length - 1]!.push({ text: part, kind })
    })
  }

  if (lang === 'plain') {
    push(code, 'plain')
    return lines
  }

  let i = 0
  /** Inside a `{ … }` declaration block — CSS only, and the whole reason it can tell a property from a selector. */
  let inCssBlock = false
  /** Inside `<… >` — HTML only, and what separates an attribute from body text. */
  let inHtmlTag = false

  const rest = () => code.slice(i)
  const peekNonSpace = (from: number) => {
    let j = from
    while (j < code.length && /\s/.test(code[j]!)) j++
    return code[j] ?? ''
  }

  /** Reads to the end of a quoted run, tolerating escapes and an unclosed tail. */
  function readString(quote: string): string {
    let j = i + 1
    while (j < code.length) {
      if (code[j] === '\\') j += 2
      else if (code[j] === quote) return code.slice(i, ++j)
      // A single-quoted string is not allowed to span lines in any of these
      // languages; stopping at the newline keeps one stray apostrophe from
      // painting the rest of the file.
      else if (code[j] === '\n' && quote !== '`') return code.slice(i, j)
      else j++
    }
    return code.slice(i)
  }

  while (i < code.length) {
    const c = code[i]!
    const two = code.slice(i, i + 2)

    // Whitespace is a run of its own so column maths stays exact.
    if (/\s/.test(c)) {
      const m = /^\s+/.exec(rest())![0]
      push(m, 'plain')
      i += m.length
      continue
    }

    // Comments ------------------------------------------------------------
    if (lang === 'html' && code.startsWith('<!--', i)) {
      const end = code.indexOf('-->', i)
      const text = end === -1 ? rest() : code.slice(i, end + 3)
      push(text, 'comment')
      i += text.length
      continue
    }
    if (two === '/*' && (lang === 'tsx' || lang === 'css')) {
      const end = code.indexOf('*/', i + 2)
      const text = end === -1 ? rest() : code.slice(i, end + 2)
      push(text, 'comment')
      i += text.length
      continue
    }
    if (two === '//' && lang === 'tsx') {
      const text = /^[^\n]*/.exec(rest())![0]
      push(text, 'comment')
      i += text.length
      continue
    }
    if (c === '#' && lang === 'shell') {
      const text = /^[^\n]*/.exec(rest())![0]
      push(text, 'comment')
      i += text.length
      continue
    }

    // Strings ---------------------------------------------------------------
    if (c === '"' || c === "'" || (c === '`' && lang === 'tsx')) {
      const text = readString(c)
      // A JSON key is a string in a position, not a different kind of string.
      const isKey = lang === 'json' && peekNonSpace(i + text.length) === ':'
      push(text, isKey ? 'prop' : 'string')
      i += text.length
      continue
    }

    // HTML tag boundaries ---------------------------------------------------
    if (lang === 'html' && c === '<') {
      const m = /^<\/?[A-Za-z][A-Za-z0-9-]*/.exec(rest())
      if (m) {
        push(m[0], 'tag')
        i += m[0].length
        inHtmlTag = true
        continue
      }
    }
    if (lang === 'html' && (c === '>' || two === '/>')) {
      const text = two === '/>' ? two : c
      push(text, 'tag')
      i += text.length
      inHtmlTag = false
      continue
    }

    // Numbers, including CSS hex colours and dimensions ---------------------
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(code[i + 1] ?? ''))) {
      const m = /^[0-9.]+(?:[a-z%]+)?/i.exec(rest())![0]
      push(m, 'number')
      i += m.length
      continue
    }
    if (lang === 'css' && c === '#' && /^#[0-9a-f]{3,8}\b/i.test(rest())) {
      const m = /^#[0-9a-f]{3,8}/i.exec(rest())![0]
      push(m, 'number')
      i += m.length
      continue
    }

    // Identifiers -----------------------------------------------------------
    // A CSS class selector is one word, not a dot followed by a word. The dot
    // only joins in when a letter follows, so `.5rem` still reads as a number
    // — and this sits after the number branch so it never gets the chance.
    const isCssClass =
      lang === 'css' && c === '.' && /[A-Za-z_-]/.test(code[i + 1] ?? '')
    if (IDENT_START.test(c) || isCssClass) {
      let j = i + 1
      while (j < code.length && IDENT_BODY.test(code[j]!)) j++
      const word = code.slice(i, j)
      const next = peekNonSpace(j)
      push(word, identKind(word, next, lang, { inCssBlock, inHtmlTag }))
      i = j
      continue
    }

    // Punctuation, and the two characters that change CSS's mind ------------
    if (lang === 'css' && c === '{') inCssBlock = true
    if (lang === 'css' && c === '}') inCssBlock = false
    push(c, 'punct')
    i += 1
  }

  return lines
}

function identKind(
  word: string,
  next: string,
  lang: CodeLanguage,
  ctx: { inCssBlock: boolean; inHtmlTag: boolean },
): TokenKind {
  switch (lang) {
    case 'tsx':
      if (JS_KEYWORDS.has(word)) return 'keyword'
      if (next === '(') return 'fn'
      if (/^[A-Z]/.test(word)) return 'tag'
      return 'plain'
    case 'css':
      if (word.startsWith('@')) return 'keyword'
      if (ctx.inCssBlock) return next === ':' ? 'prop' : next === '(' ? 'fn' : 'plain'
      return 'tag'
    case 'html':
      return ctx.inHtmlTag ? 'attr' : 'plain'
    case 'json':
      return JSON_LITERALS.has(word) ? 'keyword' : 'plain'
    case 'shell':
      if (SHELL_KEYWORDS.has(word)) return 'keyword'
      if (word.startsWith('-')) return 'attr'
      return 'plain'
    default:
      return 'plain'
  }
}

/* ============================================================
 *  Themes
 * ========================================================== */

export interface CodeTheme {
  id: string
  name: string
  /** True when the card is dark — decides the chrome and the default backdrop. */
  dark: boolean
  bg: string
  chrome: string
  gutter: string
  token: Record<TokenKind, string>
  /** The two stops of the default backdrop behind the card. */
  backdrop: [string, string]
}

function theme(
  id: string,
  name: string,
  dark: boolean,
  bg: string,
  chrome: string,
  gutter: string,
  backdrop: [string, string],
  token: Record<TokenKind, string>,
): CodeTheme {
  return { id, name, dark, bg, chrome, gutter, backdrop, token }
}

export const CODE_THEMES: CodeTheme[] = [
  theme(
    'midnight',
    'Midnight',
    true,
    '#0f1729',
    '#16203a',
    '#3c4a6b',
    ['#1e293b', '#0b1120'],
    {
      plain: '#dbe3f4',
      comment: '#6b7a9b',
      string: '#7fd1a6',
      number: '#f0b071',
      keyword: '#8ab4ff',
      fn: '#c9a5ff',
      punct: '#8494b4',
      tag: '#6fd7e2',
      attr: '#f7a8c4',
      prop: '#8ab4ff',
    },
  ),
  theme(
    'graphite',
    'Graphite',
    true,
    '#17181c',
    '#202128',
    '#4a4c56',
    ['#3f4147', '#131418'],
    {
      plain: '#e3e4e8',
      comment: '#75777f',
      string: '#a8cf8e',
      number: '#e0a678',
      keyword: '#9db9e8',
      fn: '#e6c07b',
      punct: '#8f919a',
      tag: '#7fc7c0',
      attr: '#dda1b6',
      prop: '#9db9e8',
    },
  ),
  theme(
    'paper',
    'Paper',
    false,
    '#ffffff',
    '#f2f2f4',
    '#b6b8c0',
    ['#e9ecf2', '#cfd6e4'],
    {
      plain: '#24262e',
      comment: '#8a8d99',
      string: '#1f7a4d',
      number: '#a2591b',
      keyword: '#2b52c4',
      fn: '#7226a8',
      punct: '#6b6e79',
      tag: '#0f6d78',
      attr: '#b02a6b',
      prop: '#2b52c4',
    },
  ),
  theme(
    'terminal',
    'Terminal',
    true,
    '#08110c',
    '#0d1a12',
    '#2c4a36',
    ['#123021', '#050b07'],
    {
      plain: '#c6f0d4',
      comment: '#4e7a5e',
      string: '#9ff5b8',
      number: '#e8e07a',
      keyword: '#69e39a',
      fn: '#a8f0d8',
      punct: '#6ba57e',
      tag: '#8ce8c0',
      attr: '#d7f0a0',
      prop: '#69e39a',
    },
  ),
]

/* ============================================================
 *  Layout
 * ========================================================== */

export type BackdropKind = 'theme' | 'solid' | 'none'

export interface CodeImageOptions {
  code: string
  language: CodeLanguage
  theme: CodeTheme
  fontSize: number
  /** Outer breathing room around the card, in CSS pixels. */
  padding: number
  /** Inside the card, around the text. */
  inset: number
  radius: number
  chrome: boolean
  title: string
  lineNumbers: boolean
  /** Wrap point, in characters. Keeps one long line from making a mural. */
  maxChars: number
  backdrop: BackdropKind
  backdropColor: string
  shadow: boolean
}

export interface CodeImageLayout {
  width: number
  height: number
  cardX: number
  cardY: number
  cardWidth: number
  cardHeight: number
  chromeHeight: number
  gutterWidth: number
  lineHeight: number
  /** Rows after wrapping — what actually gets drawn. */
  rows: Token[][]
  /** The 1-based source line each row belongs to; 0 for a wrapped continuation. */
  rowNumbers: number[]
  charWidth: number
}

/** The stack, in the order every browser here resolves it. */
export const MONO_STACK =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'

export function fontFor(size: number): string {
  return `${size}px ${MONO_STACK}`
}

/**
 * Break a row at the wrap column, keeping runs intact where possible.
 *
 * Continuation lines are indented to the original's leading whitespace so a
 * wrapped argument list still reads as belonging to its call. Splitting mid
 * token is accepted rather than avoided: a 200-character string literal has
 * no good break point, and refusing to wrap it is how you get an image nobody
 * can read at slide size.
 */
export function wrapRow(row: Token[], maxChars: number): Token[][] {
  const total = row.reduce((n, t) => n + t.text.length, 0)
  if (total <= maxChars) return [row]

  const leading = /^\s*/.exec(row[0]?.kind === 'plain' ? (row[0]?.text ?? '') : '')![0]
  const indent = leading.length + 2 <= maxChars - 8 ? leading + '  ' : ''

  const out: Token[][] = []
  let current: Token[] = []
  let width = 0

  const start = () => {
    out.push(current)
    current = indent ? [{ text: indent, kind: 'plain' }] : []
    width = indent.length
  }

  for (const token of row) {
    let text = token.text
    while (width + text.length > maxChars) {
      const room = maxChars - width
      if (room > 0) {
        current.push({ text: text.slice(0, room), kind: token.kind })
        text = text.slice(room)
      }
      start()
    }
    if (text) {
      current.push({ text, kind: token.kind })
      width += text.length
    }
  }
  out.push(current)
  return out
}

/**
 * Every number the renderer needs, decided once.
 *
 * `measure` is handed in rather than assumed so the caller supplies a real
 * canvas context — and so this is callable from a test with a stub, which is
 * where the wrapping and gutter maths actually get checked.
 */
export function layout(
  opts: CodeImageOptions,
  measure: (text: string) => number,
): CodeImageLayout {
  const charWidth = measure('M')
  const lineHeight = Math.round(opts.fontSize * 1.55)
  const source = tokenize(opts.code.replace(/\t/g, '  '), opts.language)

  const rows: Token[][] = []
  const rowNumbers: number[] = []
  source.forEach((row, n) => {
    wrapRow(row, opts.maxChars).forEach((piece, k) => {
      rows.push(piece)
      rowNumbers.push(k === 0 ? n + 1 : 0)
    })
  })

  const digits = String(source.length).length
  const gutterWidth = opts.lineNumbers ? Math.ceil((digits + 2) * charWidth) : 0

  const longest = rows.reduce(
    (n, row) => Math.max(n, row.reduce((w, t) => w + t.text.length, 0)),
    0,
  )
  const textWidth = Math.ceil(longest * charWidth)
  const chromeHeight = opts.chrome ? Math.round(opts.fontSize * 2.4) : 0

  const cardWidth = Math.max(220, gutterWidth + textWidth + opts.inset * 2)
  const cardHeight = chromeHeight + rows.length * lineHeight + opts.inset * 2

  return {
    width: Math.ceil(cardWidth + opts.padding * 2),
    height: Math.ceil(cardHeight + opts.padding * 2),
    cardX: opts.padding,
    cardY: opts.padding,
    cardWidth,
    cardHeight,
    chromeHeight,
    gutterWidth,
    lineHeight,
    rows,
    rowNumbers,
    charWidth,
  }
}

/** `roundRect` is everywhere current, and this is the everywhere-else path. */
function roundedPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radius)
    return
  }
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

/**
 * Draw the whole card at `scale`.
 *
 * The canvas is sized by the caller; this sets the transform, so the same
 * function paints a 1× preview and a 3× export from one set of coordinates.
 */
export function render(
  ctx: CanvasRenderingContext2D,
  opts: CodeImageOptions,
  scale: number,
): CodeImageLayout {
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.font = fontFor(opts.fontSize)
  ctx.textBaseline = 'alphabetic'

  const l = layout(opts, (t) => ctx.measureText(t).width)
  const { theme: t } = opts

  ctx.clearRect(0, 0, l.width, l.height)

  // Backdrop
  if (opts.backdrop === 'theme') {
    const g = ctx.createLinearGradient(0, 0, l.width, l.height)
    g.addColorStop(0, t.backdrop[0])
    g.addColorStop(1, t.backdrop[1])
    ctx.fillStyle = g
    ctx.fillRect(0, 0, l.width, l.height)
  } else if (opts.backdrop === 'solid') {
    ctx.fillStyle = opts.backdropColor
    ctx.fillRect(0, 0, l.width, l.height)
  }

  // Card
  ctx.save()
  if (opts.shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
    ctx.shadowBlur = 40
    ctx.shadowOffsetY = 16
  }
  roundedPath(ctx, l.cardX, l.cardY, l.cardWidth, l.cardHeight, opts.radius)
  ctx.fillStyle = t.bg
  ctx.fill()
  ctx.restore()

  // Chrome. Clipped to the card so the bar's square bottom does not escape
  // the rounded top corners.
  if (opts.chrome) {
    ctx.save()
    roundedPath(ctx, l.cardX, l.cardY, l.cardWidth, l.cardHeight, opts.radius)
    ctx.clip()
    ctx.fillStyle = t.chrome
    ctx.fillRect(l.cardX, l.cardY, l.cardWidth, l.chromeHeight)
    ctx.restore()

    const r = Math.max(4, Math.round(opts.fontSize * 0.36))
    const cy = l.cardY + l.chromeHeight / 2
    ;['#ff5f57', '#febc2e', '#28c840'].forEach((color, n) => {
      ctx.beginPath()
      ctx.arc(l.cardX + opts.inset + n * (r * 3) + r, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
    })

    if (opts.title.trim()) {
      ctx.fillStyle = t.gutter
      ctx.textAlign = 'center'
      ctx.font = fontFor(Math.round(opts.fontSize * 0.85))
      ctx.fillText(opts.title.trim(), l.cardX + l.cardWidth / 2, cy + opts.fontSize * 0.3)
      ctx.textAlign = 'left'
      ctx.font = fontFor(opts.fontSize)
    }
  }

  // Text
  const originX = l.cardX + opts.inset + l.gutterWidth
  const originY = l.cardY + l.chromeHeight + opts.inset

  l.rows.forEach((row, n) => {
    const baseline = originY + n * l.lineHeight + opts.fontSize

    if (opts.lineNumbers && l.rowNumbers[n]) {
      ctx.fillStyle = t.gutter
      ctx.textAlign = 'right'
      ctx.fillText(
        String(l.rowNumbers[n]),
        l.cardX + opts.inset + l.gutterWidth - l.charWidth,
        baseline,
      )
      ctx.textAlign = 'left'
    }

    let x = originX
    for (const token of row) {
      ctx.fillStyle = t.token[token.kind]
      ctx.fillText(token.text, x, baseline)
      x += token.text.length * l.charWidth
    }
  })

  return l
}

/** A filename for the download, derived from the title or the language. */
export function downloadName(opts: Pick<CodeImageOptions, 'title' | 'language'>): string {
  const slug = opts.title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || `${opts.language}-snippet`}.png`
}
