/**
 * The SVG toolkit's engine — optimise, convert, and generate.
 *
 * Four jobs that are always four different websites: an optimiser, an
 * SVG-to-JSX converter, a pattern generator and a wave generator. They are
 * one module here because they are one pipeline in practice — you optimise
 * the file you were handed, then you convert it to the form your codebase
 * takes, and the shapes you generate go through exactly the same two steps
 * on the way out.
 *
 * Deliberately string-based rather than DOM-based.
 *
 * A `DOMParser` optimiser is more correct and cannot run here: this module is
 * imported by a Node test runner (`npm test`) as well as by the browser, and
 * half the value of the optimiser is being able to pin its behaviour in
 * tests. So every pass is a narrow, documented transformation on the source
 * text, each one reversible in the head, and anything that would need a real
 * tree — merging paths, collapsing nested transforms, converting shapes to
 * paths — is deliberately absent rather than approximated. An optimiser that
 * silently breaks one icon in fifty is worse than one that does less.
 *
 * The other consequence of that choice is honesty about what ran: every pass
 * reports what it removed, so the output is a list of decisions rather than a
 * smaller number you have to trust.
 */

/* ============================================================
 *  Shared helpers
 * ============================================================ */

/** Bytes of a UTF-8 string — what a file size actually is. */
export function byteLength(text: string): number {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text).length
  return Buffer.byteLength(text, 'utf8')
}

/**
 * Round a number to `precision` decimals and drop the trailing zeros.
 *
 * `0.10000000000000009` is what floating point hands back from a rotation,
 * and it costs eighteen bytes to say `0.1`. `Number()` on the fixed string is
 * what removes the trailing zeros — `toFixed` alone would emit `1.000`.
 */
export function roundTo(value: number, precision: number): number {
  const factor = 10 ** precision
  return Number((Math.round(value * factor) / factor).toFixed(precision))
}

/**
 * Every number in a string of path or transform data, rounded.
 *
 * The pattern deliberately matches the exponent form (`1e-5`) too: Illustrator
 * emits it, and a naive `[\d.]+` match would round the mantissa and leave the
 * exponent behind, turning a hairline offset into a visible one.
 */
function roundNumbersIn(text: string, precision: number): string {
  return text.replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi, (match) => {
    const value = Number(match)
    if (!Number.isFinite(value)) return match
    return String(roundTo(value, precision))
  })
}

/* ============================================================
 *  1. Optimiser
 * ============================================================ */

export interface OptimizeOptions {
  /** Decimal places kept on path, transform and geometry numbers. */
  precision: number
  /**
   * Drop `<title>` and `<desc>`.
   *
   * Off by default, which is the opposite of what most optimisers do. A
   * `<title>` is the accessible name of an inline SVG — it is the difference
   * between "graphic" and "Download invoice" in a screen reader — and the
   * usual default quietly deletes it to save nine bytes.
   */
  stripTitles: boolean
  /** Drop `width`/`height` from the root so the SVG scales to its box. */
  stripDimensions: boolean
  /** Replace every literal fill and stroke colour with `currentColor`. */
  useCurrentColor: boolean
  /** Remove `id` attributes nothing references. */
  stripUnusedIds: boolean
  /** Remove `<script>`, `on*` handlers and `javascript:` URLs. */
  stripScripts: boolean
}

export const DEFAULT_OPTIMIZE_OPTIONS: OptimizeOptions = {
  precision: 2,
  stripTitles: false,
  stripDimensions: true,
  useCurrentColor: false,
  stripUnusedIds: true,
  stripScripts: true,
}

export interface OptimizePass {
  /** What this pass did, in the past tense, for the report. */
  label: string
  /** How many bytes it saved. Can be negative in theory; never is. */
  saved: number
  /** How many things it touched, when counting them means anything. */
  count: number
}

export interface OptimizeResult {
  output: string
  /** Source size in bytes. */
  before: number
  /** Output size in bytes. */
  after: number
  /** Per-pass report, in the order the passes ran. */
  passes: OptimizePass[]
  /** Things the reader should know, e.g. that the input carried a script. */
  warnings: string[]
}

/** Attribute prefixes that belong to an editor and to nothing else. */
const EDITOR_NAMESPACES = [
  'inkscape',
  'sodipodi',
  'sketch',
  'illustrator',
  'serif',
  'figma',
]

/**
 * Attributes whose value is the spec default, so writing them changes nothing.
 *
 * Kept short on purpose. `fill="black"` is NOT here: black is the initial
 * value, but only when nothing up the tree has set `fill` — and inline SVG is
 * routinely dropped inside something that has. Removing it would recolour the
 * icon on exactly the pages that use `currentColor` inheritance properly.
 *
 * An empty `value` means "remove this attribute whatever it says", which is
 * only correct for attributes that are pure editor bookkeeping.
 */
const DEFAULT_ATTRIBUTES: Array<[attribute: string, value: string]> = [
  ['version', '1\\.[01]'],
  ['x', '0(?:px)?'],
  ['y', '0(?:px)?'],
  ['enable-background', ''],
]

/**
 * Optimise an SVG, reporting every pass.
 *
 * Passes run in a fixed order because they depend on each other: the metadata
 * strip has to run before the id sweep (an unused id may only become unused
 * once the editor's own elements are gone), and whitespace collapse runs last
 * so it cleans up after everything that left a gap behind.
 */
export function optimizeSvg(
  source: string,
  options: OptimizeOptions = DEFAULT_OPTIMIZE_OPTIONS,
): OptimizeResult {
  const before = byteLength(source)
  const passes: OptimizePass[] = []
  const warnings: string[] = []
  let svg = source

  /** Run one pass and record what it cost or saved. */
  const pass = (
    label: string,
    fn: (input: string) => { output: string; count: number },
  ) => {
    const sizeBefore = byteLength(svg)
    const { output, count } = fn(svg)
    svg = output
    const saved = sizeBefore - byteLength(svg)
    if (count > 0 || saved !== 0) passes.push({ label, saved, count })
  }

  pass('Removed the XML prolog and doctype', (input) => {
    let count = 0
    const output = input
      .replace(/<\?xml[\s\S]*?\?>/gi, () => {
        count++
        return ''
      })
      .replace(/<!DOCTYPE[^>]*>/gi, () => {
        count++
        return ''
      })
    return { output, count }
  })

  pass('Removed comments', (input) => {
    let count = 0
    const output = input.replace(/<!--[\s\S]*?-->/g, () => {
      count++
      return ''
    })
    return { output, count }
  })

  pass('Removed editor metadata', (input) => {
    let count = 0
    let output = input.replace(/<metadata[\s\S]*?<\/metadata>/gi, () => {
      count++
      return ''
    })

    /*
      Inkscape and friends write whole elements in their own namespace —
      `<sodipodi:namedview>` carries the zoom level of the window the file was
      last saved from, which is not artwork by any definition.
    */
    for (const ns of EDITOR_NAMESPACES) {
      const element = new RegExp(
        `<${ns}:[a-z-]+[\\s\\S]*?(?:/>|</${ns}:[a-z-]+>)`,
        'gi',
      )
      output = output.replace(element, () => {
        count++
        return ''
      })
      const attribute = new RegExp(`\\s${ns}:[a-z-]+="[^"]*"`, 'gi')
      output = output.replace(attribute, () => {
        count++
        return ''
      })
      const namespaceDecl = new RegExp(`\\sxmlns:${ns}="[^"]*"`, 'gi')
      output = output.replace(namespaceDecl, () => {
        count++
        return ''
      })
    }

    /*
      `data-name` is Illustrator's layer name. A `class` written by an editor
      is usually `cls-1` and looks equally disposable, but a class can be
      styled from a stylesheet outside the file, so it stays. Layer names
      cannot be referenced by anything.
    */
    output = output.replace(/\sdata-name="[^"]*"/gi, () => {
      count++
      return ''
    })
    return { output, count }
  })

  if (options.stripScripts) {
    pass('Removed scripts and event handlers', (input) => {
      let count = 0
      const output = input
        .replace(/<script[\s\S]*?<\/script>/gi, () => {
          count++
          return ''
        })
        .replace(/<script[^>]*\/>/gi, () => {
          count++
          return ''
        })
        .replace(/\son[a-z]+="[^"]*"/gi, () => {
          count++
          return ''
        })
        .replace(/\son[a-z]+='[^']*'/gi, () => {
          count++
          return ''
        })
        .replace(/(href|xlink:href)="\s*javascript:[^"]*"/gi, () => {
          count++
          return ''
        })
      if (count > 0) {
        warnings.push(
          `Removed ${count} script or inline event handler. An SVG is a document, and a document can run code — which is why this pass is on by default.`,
        )
      }
      return { output, count }
    })
  } else if (/<script[\s>]|\son[a-z]+=/i.test(svg)) {
    warnings.push(
      'This file carries a script or an inline event handler and you have that pass turned off. Do not inline it into a page you did not write.',
    )
  }

  if (options.stripTitles) {
    pass('Removed <title> and <desc>', (input) => {
      let count = 0
      const output = input
        .replace(/<title[\s\S]*?<\/title>/gi, () => {
          count++
          return ''
        })
        .replace(/<desc[\s\S]*?<\/desc>/gi, () => {
          count++
          return ''
        })
      if (count > 0) {
        warnings.push(
          'A <title> is the accessible name of an inline SVG. If this graphic carries meaning, give it one back — and if it does not, mark the SVG aria-hidden.',
        )
      }
      return { output, count }
    })
  }

  pass('Removed default attributes', (input) => {
    let count = 0
    let output = input
    for (const [attribute, value] of DEFAULT_ATTRIBUTES) {
      const pattern = new RegExp(`\\s${attribute}="${value || '[^"]*'}"`, 'gi')
      output = output.replace(pattern, () => {
        count++
        return ''
      })
    }
    output = output.replace(/\sxml:space="preserve"/gi, () => {
      count++
      return ''
    })
    // `xmlns:xlink` is dead weight once nothing in the file uses `xlink:`.
    if (!/xlink:/i.test(output.replace(/\sxmlns:xlink="[^"]*"/gi, ''))) {
      output = output.replace(/\sxmlns:xlink="[^"]*"/gi, () => {
        count++
        return ''
      })
    }
    return { output, count }
  })

  if (options.stripDimensions) {
    pass('Removed width and height from the root', (input) => {
      let count = 0
      if (!/<svg[^>]*\sviewBox=/i.test(input)) {
        warnings.push(
          'width and height were kept: this SVG has no viewBox, and without one they are the only thing giving it a size.',
        )
        return { output: input, count: 0 }
      }
      const output = input.replace(/<svg[^>]*>/i, (tag) =>
        tag
          .replace(/\swidth="[^"]*"/i, () => {
            count++
            return ''
          })
          .replace(/\sheight="[^"]*"/i, () => {
            count++
            return ''
          }),
      )
      return { output, count }
    })
  }

  if (options.stripUnusedIds) {
    pass('Removed unreferenced ids', (input) => {
      let count = 0
      /*
        An id is referenced three ways: `url(#id)` from a fill or a filter,
        `href="#id"` from a `<use>` or an `<a>`, and `#id` from a stylesheet
        inside the file. Anything not matched by one of those is a leftover
        layer name from the editor.

        The sweep is skipped entirely when the file carries a `<style>`, since
        a selector can reach an id in ways this does not model — `[id^="ic"]`
        being the obvious one — and a wrong removal here is an invisible icon.
      */
      if (/<style[\s>]/i.test(input)) return { output: input, count: 0 }

      const referenced = new Set<string>()
      for (const match of input.matchAll(/url\(\s*['"]?#([^)'"\s]+)/gi)) {
        referenced.add(match[1])
      }
      for (const match of input.matchAll(/(?:xlink:)?href="#([^"]+)"/gi)) {
        referenced.add(match[1])
      }
      for (const match of input.matchAll(/\sbegin="([^"]*)"/gi)) {
        // SMIL syncbases: `begin="other.end"` names another element by id.
        const id = match[1].split('.')[0]?.trim()
        if (id) referenced.add(id)
      }

      const output = input.replace(/\sid="([^"]+)"/gi, (whole, id: string) => {
        if (referenced.has(id)) return whole
        count++
        return ''
      })
      return { output, count }
    })
  }

  if (options.useCurrentColor) {
    pass('Swapped literal colours for currentColor', (input) => {
      let count = 0
      /*
        `fill="none"` is structural, not a colour — on a stroked icon it is
        what stops the path being filled in — so it is exempt, as is a `url()`
        reference to a gradient. Everything else becomes `currentColor`, which
        is what lets one file work in both themes.
      */
      const output = input.replace(
        /(fill|stroke)="(?!none"|currentColor"|url\()[^"]+"/gi,
        (whole) => {
          count++
          return `${whole.slice(0, whole.indexOf('='))}="currentColor"`
        },
      )
      return { output, count }
    })
  }

  pass(`Rounded numbers to ${options.precision} decimals`, (input) => {
    let count = 0
    const output = input.replace(
      /\s(d|points|transform|gradientTransform|patternTransform|viewBox|cx|cy|r|rx|ry|x1|y1|x2|y2|width|height|x|y|stroke-width|offset|fx|fy|stroke-dasharray|stroke-dashoffset)="([^"]*)"/gi,
      (whole, attribute: string, value: string) => {
        const rounded = roundNumbersIn(value, options.precision)
        if (rounded === value) return whole
        count++
        return ` ${attribute}="${rounded}"`
      },
    )
    return { output, count }
  })

  pass('Collapsed whitespace', (input) => {
    let count = 0
    /*
      Text nodes are the reason this pass is conditional. `>  <` between two
      shapes is whitespace; between two `<tspan>`s it is a space the reader
      sees. A file carrying any text element keeps its inter-tag whitespace —
      a rendered label with its spaces eaten is a far worse outcome than a
      slightly larger file.
    */
    const hasText = /<text[\s>]|<tspan[\s>]|<textPath[\s>]/i.test(input)
    let output = input
    if (!hasText) {
      output = output.replace(/>\s+</g, () => {
        count++
        return '><'
      })
    }
    output = output
      .replace(/\s{2,}/g, () => {
        count++
        return ' '
      })
      .replace(/\s+\/>/g, () => {
        count++
        return '/>'
      })
      .trim()
    return { output, count }
  })

  return { output: svg, before, after: byteLength(svg), passes, warnings }
}

/* ============================================================
 *  2. Preview sanitiser
 * ============================================================ */

/**
 * The version of a pasted SVG that is safe to put in the DOM.
 *
 * The optimiser's script pass is an option the user can turn off; this is
 * not. Anything pasted into this tool is rendered live so you can see what
 * you are optimising, and `innerHTML` does not execute a `<script>` but very
 * much does fire `<svg onload>` and `<image onerror>`. Someone pasting a file
 * they were sent should not be running its author's code, whatever the
 * optimiser settings say.
 *
 * `<foreignObject>` goes too: it is a hole in the SVG through which arbitrary
 * HTML — an iframe included — enters the page.
 */
export function sanitizeSvgForPreview(source: string): string {
  return source
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]*\/>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/(href|xlink:href)\s*=\s*"\s*javascript:[^"]*"/gi, '')
    .replace(/(href|xlink:href)\s*=\s*'\s*javascript:[^']*'/gi, '')
}

/** Whether the input looks like an SVG at all, for the empty-state message. */
export function looksLikeSvg(source: string): boolean {
  return /<svg[\s>]/i.test(source)
}

/* ============================================================
 *  3. Data URI
 * ============================================================ */

/**
 * An SVG as a CSS-safe data URI.
 *
 * URL-encoded rather than base64, which is the part everyone gets wrong.
 * Base64 inflates the payload by a third and makes it unreadable and
 * un-diffable; a URL-encoded SVG is usually *smaller* than its base64 form
 * and still legible in the stylesheet. Only five characters actually have to
 * be escaped for a CSS `url()` — the rest is superstition copied from
 * `encodeURIComponent`, which escapes the spaces and slashes too and costs
 * three bytes each time it does.
 *
 * Double quotes inside the markup are rewritten as single quotes first, so
 * the whole thing can sit inside a double-quoted `url("…")` untouched.
 */
export function svgToDataUri(svg: string, base64 = false): string {
  const collapsed = svg.replace(/\s*\n\s*/g, ' ').trim()
  if (base64) {
    /*
      `btoa` is byte-oriented and throws on anything above U+00FF, which an
      SVG carrying a non-ASCII `<title>` immediately is. Encoding to UTF-8
      bytes first is what makes the round trip survive those files.
    */
    const bytes =
      typeof TextEncoder !== 'undefined'
        ? new TextEncoder().encode(collapsed)
        : new Uint8Array(Buffer.from(collapsed, 'utf8'))
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
    const encoded =
      typeof btoa !== 'undefined'
        ? btoa(binary)
        : Buffer.from(collapsed, 'utf8').toString('base64')
    return `data:image/svg+xml;base64,${encoded}`
  }
  const escaped = collapsed
    .replace(/"/g, "'")
    .replace(/%/g, '%25')
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/&/g, '%26')
  return `data:image/svg+xml,${escaped}`
}

/* ============================================================
 *  4. SVG → JSX
 * ============================================================ */

/**
 * SVG attributes whose JSX spelling is not just the camelCase of the original.
 *
 * The general rule — hyphens become camelCase — covers `stroke-width` and its
 * two hundred relatives, so only the exceptions are listed: the ones with a
 * namespace colon, the ones React renamed outright, and the handful whose
 * capitalisation is already correct in SVG and must survive the pass.
 */
const ATTRIBUTE_RENAMES: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  'xlink:href': 'xlinkHref',
  'xlink:title': 'xlinkTitle',
  'xlink:show': 'xlinkShow',
  'xlink:actuate': 'xlinkActuate',
  'xml:space': 'xmlSpace',
  'xml:lang': 'xmlLang',
  'xmlns:xlink': 'xmlnsXlink',
  tabindex: 'tabIndex',
  'accent-height': 'accentHeight',
}

/** SVG attributes that are already camelCase in the spec — leave them alone. */
const CAMEL_ALREADY = new Set([
  'viewBox',
  'preserveAspectRatio',
  'gradientUnits',
  'gradientTransform',
  'patternUnits',
  'patternContentUnits',
  'patternTransform',
  'clipPathUnits',
  'maskUnits',
  'maskContentUnits',
  'markerWidth',
  'markerHeight',
  'markerUnits',
  'refX',
  'refY',
  'spreadMethod',
  'stdDeviation',
  'baseFrequency',
  'numOctaves',
  'primitiveUnits',
  'filterUnits',
  'startOffset',
  'textLength',
  'lengthAdjust',
  'pathLength',
  'requiredExtensions',
  'systemLanguage',
  'attributeName',
  'repeatCount',
  'repeatDur',
  'keySplines',
  'keyTimes',
  'calcMode',
])

/** `stroke-width` → `strokeWidth`, `data-x` and `aria-x` left alone. */
export function attributeToJsx(name: string): string {
  if (ATTRIBUTE_RENAMES[name]) return ATTRIBUTE_RENAMES[name]
  if (CAMEL_ALREADY.has(name)) return name
  // `data-*` and `aria-*` keep their hyphens in JSX — renaming them would
  // emit an attribute React passes straight through under the wrong name.
  if (/^(data|aria)-/i.test(name)) return name.toLowerCase()
  return name.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())
}

/** `fill:red;stroke-width:2` → `{ fill: 'red', strokeWidth: '2' }`. */
export function styleStringToJsx(style: string): string {
  const entries = style
    .split(';')
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
      const separator = declaration.indexOf(':')
      if (separator === -1) return null
      const property = declaration.slice(0, separator).trim()
      const value = declaration.slice(separator + 1).trim()
      // A custom property keeps its exact spelling and needs quoting as a
      // key; everything else is camelCased the way React expects.
      const key = property.startsWith('--')
        ? `'${property}'`
        : property.replace(/-([a-z])/g, (_m, letter: string) => letter.toUpperCase())
      return `${key}: '${value.replace(/'/g, "\\'")}'`
    })
    .filter((entry): entry is string => entry !== null)

  return `{{ ${entries.join(', ')} }}`
}

export interface JsxOptions {
  /** PascalCase name for the emitted component. */
  componentName: string
  /** Emit a typed `React.SVGProps<SVGSVGElement>` signature. */
  typescript: boolean
  /**
   * Rewrite literal fills and strokes to `currentColor`.
   *
   * Separate from the optimiser's version of the same option because this is
   * where it usually matters: an icon inside a React codebase is coloured by
   * the `text-*` class on whatever renders it.
   */
  currentColor: boolean
  /** Spread `...props` onto the root so callers can pass className and size. */
  spreadProps: boolean
}

export const DEFAULT_JSX_OPTIONS: JsxOptions = {
  componentName: 'Icon',
  typescript: true,
  currentColor: true,
  spreadProps: true,
}

/**
 * A pasted SVG as a React component.
 *
 * This is the pass that fails in the browser without warning if you skip it:
 * `class`, `stroke-width` and `stroke-linecap` are all silently dropped or
 * warned about by React, so a hand-pasted SVG renders as a black blob with no
 * error telling you why.
 */
export function svgToJsx(source: string, options: JsxOptions = DEFAULT_JSX_OPTIONS): string {
  let markup = sanitizeSvgForPreview(source)
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim()

  if (options.currentColor) {
    markup = markup.replace(
      /(fill|stroke)="(?!none"|currentColor"|url\()[^"]+"/gi,
      (whole) => `${whole.slice(0, whole.indexOf('='))}="currentColor"`,
    )
  }

  // Every attribute on every tag, renamed. The tag body is matched rather
  // than the whole document so text content is never touched.
  markup = markup.replace(/<([a-zA-Z][\w:-]*)((?:\s+[^<>]*?)?)(\/?)>/g, (
    _whole,
    tag: string,
    attributes: string,
    selfClose: string,
  ) => {
    const converted = attributes.replace(
      /\s([\w:-]+)(?:=("[^"]*"|'[^']*'))?/g,
      (_attr, name: string, rawValue: string | undefined) => {
        if (rawValue === undefined) {
          // A bare attribute is boolean in HTML and has to be written as
          // `name={true}` in JSX, which is the one form React accepts.
          return ` ${attributeToJsx(name)}={true}`
        }
        const value = rawValue.slice(1, -1)
        if (name.toLowerCase() === 'style') {
          return ` style=${styleStringToJsx(value)}`
        }
        return ` ${attributeToJsx(name)}="${value.replace(/"/g, '&quot;')}"`
      },
    )
    return `<${tag}${converted}${selfClose ? ' /' : ''}>`
  })

  // Void SVG elements written HTML-style (`<path ...>`) are legal in an HTML
  // document and a syntax error in JSX. Close them.
  markup = markup.replace(
    /<(path|circle|ellipse|line|polyline|polygon|rect|stop|use|image|feGaussianBlur|feOffset|feBlend|feColorMatrix|feTurbulence|feDisplacementMap|animate|animateTransform)([^>]*[^/])>/g,
    '<$1$2 />',
  )

  if (options.spreadProps) {
    markup = markup.replace(/^<svg/, '<svg {...props}')
  }

  const indented = markup
    .split('\n')
    .map((line) => (line.trim() ? `      ${line.trim()}` : ''))
    .filter(Boolean)
    .join('\n')

  /*
    The parameter only exists when something spreads it. A component that
    declares `props` and never reads it is what `noUnusedParameters` and every
    lint config in this repo will reject at the call site, which turns a copy
    -paste into a build failure for no reason.
  */
  const parameter = options.spreadProps
    ? options.typescript
      ? 'props: React.SVGProps<SVGSVGElement>'
      : 'props'
    : ''

  // The React type import is only needed for the props type.
  const importLine =
    options.typescript && options.spreadProps ? "import type * as React from 'react'\n\n" : ''

  return `${importLine}export function ${options.componentName}(${parameter}) {
  return (
${indented}
  )
}
`
}

/* ============================================================
 *  5. Patterns
 * ============================================================ */

export type PatternKind =
  | 'dots'
  | 'grid'
  | 'lines'
  | 'crosshatch'
  | 'checkers'
  | 'triangles'
  | 'zigzag'
  | 'plus'
  | 'circles'
  | 'waves'

export const PATTERN_LABELS: Record<PatternKind, string> = {
  dots: 'Dots — a polka field',
  grid: 'Grid — ruled squares',
  lines: 'Lines — one direction',
  crosshatch: 'Crosshatch — lines both ways',
  checkers: 'Checkers — alternating squares',
  triangles: 'Triangles — a tiled sawtooth',
  zigzag: 'Zigzag — a chevron run',
  plus: 'Plus — a field of crosses',
  circles: 'Circles — outlined rings',
  waves: 'Waves — repeating swells',
}

export interface PatternState {
  kind: PatternKind
  /** Tile size in px — the period of the repeat. */
  size: number
  /** Line width or dot radius, depending on the shape. */
  weight: number
  /** Rotation of the whole tile, in degrees. */
  angle: number
  foreground: string
  background: string
  /** Foreground opacity, 0–1. A pattern is nearly always a texture. */
  opacity: number
}

export const DEFAULT_PATTERN_STATE: PatternState = {
  kind: 'dots',
  size: 24,
  weight: 2,
  angle: 0,
  foreground: '#0f172a',
  background: '#ffffff',
  opacity: 0.18,
}

/**
 * The marks inside one tile.
 *
 * Every shape is drawn to be seamless at the tile edge, which is the whole
 * difference between a pattern and a picture of one. Anything crossing an
 * edge is drawn again on the opposite side — the dots at the four corners,
 * the wave's leading and trailing half-period — so the tile can be repeated
 * with no seam and no scaling.
 */
function patternMarks(state: PatternState): string {
  const { kind, size: s, weight: w, foreground: fg } = state
  const half = s / 2
  const stroke = `stroke="${fg}" stroke-width="${w}" fill="none"`

  switch (kind) {
    case 'dots':
      // A dot at each corner plus one in the middle: at the corners the
      // neighbouring tiles each contribute a quarter, which is what makes the
      // spacing even instead of doubling at the seam.
      return [
        `<circle cx="0" cy="0" r="${w}" fill="${fg}"/>`,
        `<circle cx="${s}" cy="0" r="${w}" fill="${fg}"/>`,
        `<circle cx="0" cy="${s}" r="${w}" fill="${fg}"/>`,
        `<circle cx="${s}" cy="${s}" r="${w}" fill="${fg}"/>`,
        `<circle cx="${half}" cy="${half}" r="${w}" fill="${fg}"/>`,
      ].join('')
    case 'grid':
      return `<path d="M${s} 0 L0 0 0 ${s}" ${stroke}/>`
    case 'lines':
      return `<path d="M0 ${half} L${s} ${half}" ${stroke}/>`
    case 'crosshatch':
      return `<path d="M0 ${half} L${s} ${half} M${half} 0 L${half} ${s}" ${stroke}/>`
    case 'checkers':
      return [
        `<rect x="0" y="0" width="${half}" height="${half}" fill="${fg}"/>`,
        `<rect x="${half}" y="${half}" width="${half}" height="${half}" fill="${fg}"/>`,
      ].join('')
    case 'triangles':
      return `<path d="M0 ${s} L${half} 0 L${s} ${s} Z" fill="${fg}"/>`
    case 'zigzag':
      return `<path d="M0 ${s} L${half} 0 L${s} ${s}" ${stroke}/>`
    case 'plus': {
      const arm = s / 4
      return `<path d="M${half} ${half - arm} L${half} ${half + arm} M${half - arm} ${half} L${half + arm} ${half}" ${stroke} stroke-linecap="round"/>`
    }
    case 'circles':
      return `<circle cx="${half}" cy="${half}" r="${Math.max(1, half - w)}" ${stroke}/>`
    case 'waves': {
      const q = s / 4
      // One full period across the tile, drawn from edge to edge so the two
      // halves meet with a continuous tangent at the seam.
      return `<path d="M0 ${half} q${q} -${half} ${half} 0 q${q} ${half} ${half} 0" ${stroke}/>`
    }
  }
}

/** The complete tileable SVG for a pattern, as markup. */
export function buildPatternSvg(state: PatternState): string {
  const { size, angle, background, opacity } = state
  /*
    Rotation lives on the <pattern> element rather than on the marks. Rotating
    the marks inside a fixed tile breaks the seam — the shape leaves the tile
    at one angle and re-enters it at another. `patternTransform` rotates the
    tiling lattice itself, so a 30° hatch stays seamless at 30°.
  */
  const transform = angle ? ` patternTransform="rotate(${angle})"` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <defs>
    <pattern id="p" width="${size}" height="${size}" patternUnits="userSpaceOnUse"${transform}>
      ${patternMarks(state)}
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="${background}"/>
  <rect width="100%" height="100%" fill="url(#p)" opacity="${opacity}"/>
</svg>`
}

/**
 * The CSS that uses it.
 *
 * The background colour is set as a real CSS colour rather than being baked
 * into the SVG, so the same data URI works on any surface and a theme change
 * costs one property instead of a re-encode. The SVG in the URI therefore
 * carries only the marks.
 */
export function buildPatternCss(state: PatternState, selector = '.pattern'): string {
  const marksOnly = `<svg xmlns="http://www.w3.org/2000/svg" width="${state.size}" height="${state.size}" viewBox="0 0 ${state.size} ${state.size}">${
    state.angle
      ? `<g transform="rotate(${state.angle} ${state.size / 2} ${state.size / 2})">${patternMarks(state)}</g>`
      : patternMarks(state)
  }</svg>`

  return `${selector} {
  background-color: ${state.background};
  background-image: url("${svgToDataUri(marksOnly)}");
  background-size: ${state.size}px ${state.size}px;
  /* The marks carry the opacity, not the element — an opacity here would
     fade whatever content sits on top of the pattern as well. */
  opacity: 1;
}`
}

/* ============================================================
 *  6. Waves
 * ============================================================ */

/** The viewBox every wave is drawn in. It scales; the numbers stay readable. */
export const WAVE_WIDTH = 1200

export type WaveKind = 'wave' | 'swell' | 'arc' | 'peaks' | 'blob'

export const WAVE_LABELS: Record<WaveKind, string> = {
  wave: 'Wave — repeating humps',
  swell: 'Swell — one long asymmetric rise',
  arc: 'Arc — a single soft curve',
  peaks: 'Peaks — hard points',
  blob: 'Blob — a closed organic shape',
}

export interface WaveState {
  kind: WaveKind
  /** Height of the SVG in px — how much page the shape occupies. */
  height: number
  /** How far the shape reaches into that height, as a percentage. */
  amplitude: number
  /** Humps or points across the width. */
  count: number
  /** Stacked copies at falling amplitude and opacity. */
  layers: number
  flipX: boolean
  flipY: boolean
  color: string
  /** Emit `currentColor` instead of the literal, so one snippet fits themes. */
  useCurrentColor: boolean
  /** Blob only: how far the radius wanders, 0–1. */
  randomness: number
  /** Blob only: which shape you get. Same seed, same blob, every render. */
  seed: number
}

export const DEFAULT_WAVE_STATE: WaveState = {
  kind: 'wave',
  height: 160,
  amplitude: 50,
  count: 3,
  layers: 2,
  flipX: false,
  flipY: false,
  color: '#6366f1',
  useCurrentColor: false,
  randomness: 0.35,
  seed: 7,
}

/**
 * A deterministic pseudo-random sequence.
 *
 * `Math.random()` would give a different blob on every render — including the
 * re-render caused by dragging an unrelated slider — so the shape could never
 * be tuned. A seed is also the only way the emitted SVG matches what was on
 * screen when it was copied.
 */
function seeded(seed: number): () => number {
  let state = (seed * 9301 + 49297) % 233280
  return () => {
    state = (state * 9301 + 49297) % 233280
    return state / 233280
  }
}

const trim = (value: number) => Math.round(value * 10) / 10

/**
 * The filled path for one wave layer.
 *
 * Written as a profile across the top edge and closed down the right side,
 * along the bottom and back up the left, so the fill is always the area
 * below the curve. `height + 1` on the closing edge overshoots by a pixel,
 * which is what kills the antialiased hairline where the shape meets whatever
 * is under it.
 */
export function buildWavePath(
  kind: Exclude<WaveKind, 'blob'>,
  height: number,
  amplitudePercent: number,
  count: number,
): string {
  const a = (amplitudePercent / 100) * height
  const W = WAVE_WIDTH
  const close = `L${W},${trim(height + 1)} L0,${trim(height + 1)} Z`

  switch (kind) {
    case 'wave': {
      // Quadratic humps rather than a sampled sine: four numbers per hump
      // instead of forty, and the difference from a true sine at these
      // amplitudes is well under a pixel.
      const segment = W / count
      const mid = height - a / 2
      let d = `M0,${trim(mid)}`
      for (let i = 0; i < count; i++) {
        const direction = i % 2 === 0 ? -1 : 1
        d += ` q${trim(segment / 2)},${trim(direction * a)} ${trim(segment)},0`
      }
      return `${d} ${close}`
    }
    case 'swell':
      return `M0,${trim(height)} C${trim(W * 0.2)},${trim(height - a * 1.9)} ${trim(W * 0.55)},${trim(height - a * 0.1)} ${W},${trim(height - a * 0.8)} ${close}`
    case 'arc':
      return `M0,${trim(height)} C${trim(W * 0.25)},${trim(height - a * 1.6)} ${trim(W * 0.75)},${trim(height - a * 1.6)} ${W},${trim(height)} ${close}`
    case 'peaks': {
      const segment = W / count
      let d = `M0,${trim(height)}`
      for (let i = 0; i < count; i++) {
        d += ` L${trim(segment * (i + 0.5))},${trim(height - a)} L${trim(segment * (i + 1))},${trim(height)}`
      }
      return `${d} ${close}`
    }
  }
}

/**
 * A closed organic blob, as a smooth cubic path through `count` points.
 *
 * Control points are placed along the tangent at each vertex — a quarter of
 * the arc length either side — which is the standard construction for a
 * Catmull-Rom-like curve through a ring of points. Placing them radially
 * instead gives the lumpy, star-shaped thing that most blob generators emit.
 */
export function buildBlobPath(
  count: number,
  randomness: number,
  seed: number,
  size = 200,
): string {
  const points = Math.max(3, Math.min(12, count))
  const random = seeded(seed)
  const centre = size / 2
  const baseRadius = size * 0.38

  const vertices = Array.from({ length: points }, (_, i) => {
    const angle = (i / points) * Math.PI * 2
    const radius = baseRadius * (1 - randomness / 2 + random() * randomness)
    return {
      x: centre + Math.cos(angle) * radius,
      y: centre + Math.sin(angle) * radius,
      angle,
      radius,
    }
  })

  // Tangent handle length for a circular arc of this step: the classic
  // 4/3·tan(θ/4)·r, which reproduces a circle exactly when the radii match.
  const step = (Math.PI * 2) / points
  const handle = (4 / 3) * Math.tan(step / 4)

  let d = `M${trim(vertices[0].x)},${trim(vertices[0].y)}`
  for (let i = 0; i < points; i++) {
    const from = vertices[i]
    const to = vertices[(i + 1) % points]
    const c1x = from.x - Math.sin(from.angle) * handle * from.radius
    const c1y = from.y + Math.cos(from.angle) * handle * from.radius
    const c2x = to.x + Math.sin(to.angle) * handle * to.radius
    const c2y = to.y - Math.cos(to.angle) * handle * to.radius
    d += ` C${trim(c1x)},${trim(c1y)} ${trim(c2x)},${trim(c2y)} ${trim(to.x)},${trim(to.y)}`
  }
  return `${d} Z`
}

export interface WaveLayer {
  d: string
  opacity: number
}

/** The layers a wave renders as, back to front. */
export function buildWaveLayers(state: WaveState): WaveLayer[] {
  // Pulled out of the object so the early return below narrows it: a check on
  // `state.kind` narrows the property, not the variable the later call reads.
  const { kind } = state

  if (kind === 'blob') {
    /*
      Layered blobs are the same blob at shrinking scale, not different
      blobs — different ones read as three shapes that happen to overlap,
      whereas one shape echoed reads as depth.
    */
    return Array.from({ length: state.layers }, (_, i) => ({
      d: buildBlobPath(state.count + 2, state.randomness, state.seed + i, 200 - i * 26),
      opacity: i === 0 ? 1 : Number((1 - i * 0.4).toFixed(2)),
    })).reverse()
  }

  return Array.from({ length: state.layers }, (_, i) => ({
    d: buildWavePath(
      kind,
      state.height,
      state.amplitude * (1 - i * 0.28),
      Math.max(1, state.count + i),
    ),
    opacity: i === 0 ? 1 : Number((1 - i * 0.4).toFixed(2)),
  })).reverse()
}

/**
 * The wave as standalone SVG markup.
 *
 * Flipping is a translate followed by a scale rather than a scale plus a
 * `transform-origin`. `scale(-1,1)` mirrors about the SVG's origin, which is
 * its top-left corner, so on its own it flips the shape straight out of the
 * viewBox; the usual fix is a presentation attribute React will not accept in
 * its hyphenated form anyway. Translating by the width first lands the
 * mirrored shape exactly where it started and needs no origin at all.
 */
export function buildWaveSvg(state: WaveState): string {
  const layers = buildWaveLayers(state)
  const fill = state.useCurrentColor ? 'currentColor' : state.color
  const isBlob = state.kind === 'blob'
  const viewBox = isBlob ? '0 0 200 200' : `0 0 ${WAVE_WIDTH} ${state.height}`
  const width = isBlob ? 200 : WAVE_WIDTH
  const height = isBlob ? 200 : state.height

  const transform =
    state.flipX || state.flipY
      ? ` transform="translate(${state.flipX ? width : 0}, ${state.flipY ? height : 0}) scale(${state.flipX ? -1 : 1}, ${state.flipY ? -1 : 1})"`
      : ''

  const paths = layers
    .map(
      (layer) =>
        `    <path d="${layer.d}" fill="${fill}"${layer.opacity < 1 ? ` opacity="${layer.opacity}"` : ''}/>`,
    )
    .join('\n')

  /*
    `display:block` is in the style attribute rather than in a note for the
    reader to act on. An <svg> is an inline element, so it sits on a text
    baseline and leaves two or three pixels of the parent's background
    showing underneath — the single most common way a wave ships broken.
  */
  return `<svg
  viewBox="${viewBox}"
  ${isBlob ? '' : 'preserveAspectRatio="none"\n  '}xmlns="http://www.w3.org/2000/svg"
  style="display:block;width:100%${isBlob ? '' : `;height:${state.height}px`}"
  aria-hidden="true"
  focusable="false"
>
  <g${transform}>
${paths}
  </g>
</svg>`
}
