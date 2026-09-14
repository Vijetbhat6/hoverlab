/**
 * Reading an export back.
 *
 * ── THE CLAIM THIS MODULE IS HERE TO TEST ───────────────────────────────
 *
 * Every effect page says the same thing in four different spellings: here
 * is your Vue component, your Svelte component, your Tailwind markup, your
 * stylesheet. A reader has never had any way to check it. The code block
 * is shown as *text*, the preview above it is rendered from the original
 * HTML and CSS, and the only thing connecting the two is our word.
 *
 * That is a bad position for the one feature the catalog is differentiated
 * on. So: render the export too, beside the original, and let the reader
 * look at both.
 *
 * ── THE RULE THAT MAKES IT A PROOF INSTEAD OF A DEMO ────────────────────
 *
 * Nothing here reads the effect's own `html` or `css`. It calls
 * `exportEffect` and then parses the generated *file* back — the template
 * out of the SFC, the style block out of the Svelte component, the class
 * attributes out of the Tailwind markup. If `buildVue` drops an attribute
 * or mangles a keyframe, the damage is in the file, so it is in the
 * rendering, so it is on the screen.
 *
 * Feeding the right-hand frame from the same inputs the left one uses
 * would produce two identical frames forever and prove nothing. That is
 * the one change to this file that would quietly destroy it.
 *
 * ── WHY THESE FOUR TARGETS ──────────────────────────────────────────────
 *
 * CSS, Vue, Svelte and Tailwind are the exports that are *declarative* —
 * markup plus a stylesheet, with the framework contributing scoping rather
 * than behaviour. A browser can be made to render them honestly.
 *
 * React and styled-components cannot be. Their output is a JavaScript
 * module whose CSS only exists once a runtime has run it; anything this
 * module could render for them would be a re-rendering of the input
 * wearing their name, which is exactly the fake proof described above.
 * They are absent on purpose, and the panel says so and points at the
 * sandbox, which does run them.
 *
 * ── WHAT STANDS IN FOR THE COMPILERS ────────────────────────────────────
 *
 * Vue and Svelte scope component styles, and we are not running either
 * compiler. Each `scope*` function below implements the documented rule,
 * and every deviation is recorded in `limits` and shown to the reader
 * rather than buried here. The deviations are small and deliberate: the
 * point is that a caveat on screen is worth more than an emulation that
 * silently flatters us.
 */

import {
  type ExportInput,
  type FrameworkId,
  exportEffect,
} from './index'
import {
  type CssRule,
  atBlockToCss,
  parseCss,
  ruleToCss,
} from './css-parse'
import {
  type HtmlElement,
  type HtmlNode,
  parseHtml,
  renderMarkup,
  setAttr,
  walkElements,
} from './html-parse'
import { matchComplex, parseSelector } from './selector'
import { utilityStylesheet } from './tailwind-utilities'

export const VERIFY_TARGETS = ['css', 'vue', 'svelte', 'tailwind'] as const
export type VerifyTarget = (typeof VERIFY_TARGETS)[number]

export function isVerifyTarget(value: string): value is VerifyTarget {
  return (VERIFY_TARGETS as readonly string[]).includes(value)
}

/** Export targets the panel cannot render, and what to do instead. */
export const UNVERIFIABLE_TARGETS: Record<string, string> = {
  react:
    'A React component only has styles once React has mounted it. Open the StackBlitz sandbox from the Code tab — that runs the real thing.',
  'styled-components':
    'styled-components generates its CSS at runtime from a tagged template literal. Open the StackBlitz sandbox from the Code tab — that runs the real thing.',
  html: 'The standalone HTML file is the original document with the CSS inlined; opening it in a browser is the check.',
}

export interface VerifyFinding {
  /** `problem` is about the export; `gap` is about this reader. */
  kind: 'problem' | 'gap' | 'note'
  message: string
}

export interface VerifySide {
  /** Markup for the sandbox body. */
  html: string
  /** Stylesheet for the sandbox head. */
  css: string
}

export interface VerifyReport {
  target: VerifyTarget
  label: string
  /** The generated files this rendering was read out of. */
  files: { path: string; language: string }[]
  /** What the original side of the comparison renders. */
  original: VerifySide
  /** What the export renders, read back out of the generated files. */
  converted: VerifySide
  /** One sentence naming the transform that stood in for the compiler. */
  method: string
  /** What a clean result here does not prove. Always non-empty. */
  limits: string[]
  findings: VerifyFinding[]
}

/**
 * The scope markers.
 *
 * Fixed rather than hashed from the content. A real compiler derives these
 * from the file path, and a value that changed per effect would make the
 * rendering non-reproducible for no gain — nothing here depends on the
 * marker being unique, because the sandbox contains exactly one component.
 */
const VUE_SCOPE = 'data-v-hoverlab'
const SVELTE_SCOPE = 'svelte-hoverlab'

/* ------------------------------------------------------------------ *
 *  Selector surgery
 * ------------------------------------------------------------------ */

/** Indent every non-empty line of a block. */
function indentBlock(text: string, indent: string): string {
  return text
    .split('\n')
    .map((line) => (line.trim() ? indent + line : ''))
    .join('\n')
}

/**
 * Index of the last combinator in a complex selector, or -1.
 *
 * Depth-aware, because `>` and spaces both appear inside `[attr="a b"]`
 * and `:not(.a > .b)`, where they are not combinators.
 */
function lastCombinatorIndex(selector: string): number {
  let depth = 0
  let quote: string | null = null
  let found = -1

  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i]
    if (quote) {
      if (ch === '\\') i++
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") quote = ch
    else if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    else if (depth === 0 && /[\s>+~]/.test(ch)) found = i
  }

  return found
}

/**
 * Where the scope marker goes inside a compound selector.
 *
 * Both compilers put it after the last real simple selector and before any
 * pseudo — `.btn:hover` becomes `.btn[data-v-x]:hover`, not
 * `.btn:hover[data-v-x]`. The difference is not cosmetic: the second form
 * is a different selector for `::before`, which cannot take an attribute
 * after it.
 */
function compoundInsertIndex(compound: string): number {
  let depth = 0
  let quote: string | null = null

  for (let i = 0; i < compound.length; i++) {
    const ch = compound[i]
    if (quote) {
      if (ch === '\\') i++
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") quote = ch
    else if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    else if (ch === ':' && depth === 0) return i
  }

  return compound.length
}

/**
 * Append a scope marker to a selector's subject compound.
 *
 * Only the subject, never the ancestors. Every element in the sandbox
 * carries the marker, so `.card .title` and `.card .title[data-v-x]` match
 * exactly the same elements — and marking one compound adds the same
 * specificity to every rule in the sheet, which keeps the original cascade
 * order intact. Marking each compound, as Svelte does for descendant
 * selectors, adds a different amount per rule and can reorder two rules
 * that were previously decided by source order.
 */
function scopeSelector(selector: string, marker: string): string {
  const trimmed = selector.trim()
  if (!trimmed) return trimmed

  const cut = lastCombinatorIndex(trimmed)
  const head = cut === -1 ? '' : trimmed.slice(0, cut + 1)
  const subject = cut === -1 ? trimmed : trimmed.slice(cut + 1)
  const at = compoundInsertIndex(subject)

  return `${head}${subject.slice(0, at)}${marker}${subject.slice(at)}`
}

/**
 * Re-emit a stylesheet with every selector rewritten.
 *
 * At-blocks — `@keyframes` above all — pass through untouched, and
 * conditional rules keep their `@media` wrapper. Returns null when the
 * sheet parses to nothing at all, so the caller can ship the CSS raw and
 * say why rather than render a blank frame.
 */
function transformSelectors(
  css: string,
  transform: (selector: string) => string,
): string | null {
  const parsed = parseCss(css)
  if (!parsed.rules.length && !parsed.atBlocks.length) return null

  const parts: string[] = []

  for (const block of parsed.atBlocks) parts.push(atBlockToCss(block))
  for (const statement of parsed.statements) parts.push(`${statement};`)

  for (const rule of parsed.rules) {
    const scoped: CssRule = { ...rule, selectors: rule.selectors.map(transform) }
    let text = ruleToCss({ ...scoped, atContext: [] })

    /*
     * One block per level, innermost first. Joining the contexts into a
     * single prelude — `@media x @supports y { … }` — is not a shorter way
     * to write the same thing, it is invalid CSS, and the browser drops the
     * whole rule. That would show up as the export missing styles it has,
     * which is the verifier accusing the exporter of its own bug.
     */
    for (let i = rule.atContext.length - 1; i >= 0; i--) {
      text = `${rule.atContext[i]} {\n${indentBlock(text, '  ')}\n}`
    }

    parts.push(text)
  }

  return parts.join('\n\n')
}

/* ------------------------------------------------------------------ *
 *  Single-file-component parsing
 * ------------------------------------------------------------------ */

/**
 * Pull one top-level block out of a component file.
 *
 * Deliberately not a regex over the whole file: a `<style>` inside the
 * markup — or the word `</template>` inside a text node — would end the
 * block early, and "the generator emitted markup that closes its own
 * wrapper" is precisely a bug this panel should catch rather than trip
 * over. So the closing tag is found from the end.
 */
function sfcBlock(
  source: string,
  tag: string,
  /**
   * Where to start looking. A Vue SFC's `<style>` is read from *after* the
   * template, because a `<style>` element inside the markup would otherwise
   * be found first and the block would run from there to the last
   * `</style>` in the file — swallowing the template's tail and the real
   * stylesheet together.
   */
  from = 0,
): { attrs: string; body: string } | null {
  const rest = source.slice(from)
  const open = rest.match(new RegExp(`<${tag}(\\s[^>]*)?>`))
  if (!open || open.index === undefined) return null

  const start = from + open.index + open[0].length
  const end = source.lastIndexOf(`</${tag}>`)
  if (end < start) return null

  return { attrs: (open[1] ?? '').trim(), body: source.slice(start, end) }
}

/** The markup left once every `<style>` block is removed. */
function withoutStyleBlocks(source: string): string {
  return source.replace(/<style(\s[^>]*)?>[\s\S]*?<\/style>/gi, '')
}

/* ------------------------------------------------------------------ *
 *  Per-target rehydration
 * ------------------------------------------------------------------ */

/** Put the scope marker on every element in a fragment. */
function markElements(
  html: string,
  apply: (el: HtmlElement) => void,
): string {
  const nodes: HtmlNode[] = parseHtml(html)
  for (const el of walkElements(nodes)) apply(el)
  return renderMarkup(nodes, { indent: '' })
}

interface Rehydrated {
  side: VerifySide
  method: string
  limits: string[]
  findings: VerifyFinding[]
}

function rehydrateVue(source: string): Rehydrated {
  const findings: VerifyFinding[] = []

  const template = sfcBlock(source, 'template')
  if (!template) {
    return {
      side: { html: '', css: '' },
      method: 'The single-file component could not be read.',
      limits: [],
      findings: [
        {
          kind: 'problem',
          message:
            'The generated file has no <template> block, so it is not a valid single-file component and Vue would refuse to compile it.',
        },
      ],
    }
  }

  const style = sfcBlock(source, 'style', source.lastIndexOf('</template>'))
  const scoped = style ? /\bscoped\b/.test(style.attrs) : false
  if (style && !scoped) {
    findings.push({
      kind: 'problem',
      message:
        'The <style> block is not marked `scoped`, so these rules would leak into the rest of the host application. The export is documented as scoped.',
    })
  }

  const marker = `[${VUE_SCOPE}]`
  const html = markElements(template.body, (el) => setAttr(el, VUE_SCOPE, ''))

  let css = ''
  if (style) {
    const transformed = transformSelectors(style.body, (s) => scopeSelector(s, marker))
    if (transformed === null) {
      css = style.body
      findings.push({
        kind: 'gap',
        message:
          'The style block could not be parsed into rules, so it is applied unscoped. Compare the two frames with that in mind.',
      })
    } else {
      css = transformed
    }
  }

  return {
    side: { html, css },
    method: `Vue's scoping rule, applied by hand: every element in the <template> gets ${marker}, and every selector's subject gets it too.`,
    limits: [
      'Vue also suffixes @keyframes names inside a scoped block so they cannot collide with animations elsewhere. That rename is invisible on screen and is not done here.',
      'Vue is not running. This shows that the template and the scoped stylesheet describe the original — not that a Vue build of them boots.',
    ],
    findings,
  }
}

function rehydrateSvelte(source: string): Rehydrated {
  const findings: VerifyFinding[] = []

  const style = sfcBlock(source, 'style')
  const markupSource = withoutStyleBlocks(source)
  const marker = `.${SVELTE_SCOPE}`

  const nodes: HtmlNode[] = parseHtml(markupSource)
  const elements = walkElements(nodes)
  const roots = nodes.filter((n): n is HtmlElement => n.type === 'element')

  if (!elements.length) {
    findings.push({
      kind: 'problem',
      message: 'The generated component has no markup outside its <style> block.',
    })
  }

  for (const el of elements) {
    const existing = el.attrs.find((a) => a.name.toLowerCase() === 'class')
    setAttr(el, 'class', existing?.value ? `${existing.value} ${SVELTE_SCOPE}` : SVELTE_SCOPE)
  }
  const html = renderMarkup(nodes, { indent: '' })

  let css = ''
  if (style) {
    /*
     * The unused-selector prune is Svelte's most-reported surprise, and
     * `buildSvelte` already warns about it in the abstract. Here it can be
     * answered concretely: a selector is checked against this component's
     * own markup exactly as the compiler checks it — structurally, with
     * `:hover` and `::before` ignored, because those depend on state the
     * compiler cannot see either.
     */
    const pruned: string[] = []
    for (const rule of parseCss(style.body).rules) {
      for (const selectorText of rule.selectors) {
        const selector = parseSelector(selectorText)
        if (selector.unsupported) continue
        const hit = elements.some((el) => matchComplex(el, selector, roots) !== null)
        if (!hit) pruned.push(selectorText)
      }
    }

    if (pruned.length) {
      findings.push({
        kind: 'note',
        message: `Svelte will report ${pruned.length} unused selector${
          pruned.length === 1 ? '' : 's'
        } and remove ${pruned.length === 1 ? 'it' : 'them'} from the build (${pruned
          .slice(0, 3)
          .join(', ')}${pruned.length > 3 ? ', …' : ''}). ${
          pruned.length === 1 ? 'It matches' : 'They match'
        } nothing in this component's own markup. Wrap ${
          pruned.length === 1 ? 'it' : 'them'
        } in :global(…) to keep ${pruned.length === 1 ? 'it' : 'them'}.`,
      })
    }

    const transformed = transformSelectors(style.body, (s) => scopeSelector(s, marker))
    if (transformed === null) {
      css = style.body
      findings.push({
        kind: 'gap',
        message:
          'The style block could not be parsed into rules, so it is applied unscoped. Compare the two frames with that in mind.',
      })
    } else {
      css = transformed
    }
  }

  return {
    side: { html, css },
    method: `Svelte's scoping rule, applied by hand: every element gets the class ${SVELTE_SCOPE}, and every selector's subject gets ${marker}.`,
    limits: [
      'Svelte also adds its class to the leading compound of a descendant selector. Only the subject is marked here, which matches the same elements and keeps every rule at the same relative specificity.',
      'Unused selectors are reported rather than removed, so the frame shows what the source asks for even where the compiler would drop it.',
    ],
    findings,
  }
}

function rehydrateTailwind(markup: string, companion: string): Rehydrated {
  const findings: VerifyFinding[] = []
  const sheet = utilityStylesheet(markup, companion)

  const gaps = sheet.unresolved.filter((u) => u.reason === 'unknown')
  const broken = sheet.unresolved.filter((u) => u.reason === 'not-a-utility')

  if (broken.length) {
    findings.push({
      kind: 'problem',
      message: `${broken.length} class${broken.length === 1 ? '' : 'es'} ${
        broken.length === 1 ? 'is' : 'are'
      } not a Tailwind utility and would compile to nothing in a real project: ${broken
        .map((u) => u.className)
        .slice(0, 5)
        .join(', ')}${broken.length > 5 ? ', …' : ''}.`,
    })
  }

  if (gaps.length) {
    findings.push({
      kind: 'gap',
      message: `${gaps.length} class${gaps.length === 1 ? '' : 'es'} could not be resolved by this reader, so ${
        gaps.length === 1 ? 'its' : 'their'
      } styles are missing from the right-hand frame: ${gaps
        .map((u) => u.className)
        .slice(0, 5)
        .join(', ')}${gaps.length > 5 ? ', …' : ''}. That is a gap here, not necessarily a fault in the conversion.`,
    })
  }

  return {
    side: { html: markup, css: [companion, sheet.css].filter(Boolean).join('\n\n') },
    method: `The ${sheet.resolved} utility class${
      sheet.resolved === 1 ? '' : 'es'
    } on this markup, resolved to CSS by a reader written from Tailwind's own output rather than from the converter's table.`,
    limits: [
      'Tailwind sorts its output by property; this puts base utilities before variants and otherwise keeps the order the classes appear in. Two utilities setting the same property could therefore resolve the other way round in a real build — which is why the converter collapses those rather than relying on order.',
      'The companion stylesheet is included as shipped, so anything that stayed CSS is being compared as CSS.',
    ],
    findings,
  }
}

/* ------------------------------------------------------------------ *
 *  Entry point
 * ------------------------------------------------------------------ */

/**
 * Build both sides of the comparison for one export target.
 *
 * The left side is the effect as authored. The right side is read back out
 * of `exportEffect`'s files — see the header for why that indirection is
 * the whole feature.
 */
export function verifyExport(input: ExportInput, target: VerifyTarget): VerifyReport {
  const result = exportEffect(input, target as FrameworkId)
  const file = (ext: string) => result.files.find((f) => f.path.endsWith(`.${ext}`))

  let rehydrated: Rehydrated

  switch (target) {
    case 'css': {
      const markup = file('html')
      const stylesheet = file('css')
      rehydrated = {
        side: { html: markup?.code ?? '', css: stylesheet?.code ?? '' },
        method:
          'The two files as shipped: the stylesheet linked, the markup pasted. Nothing stands in for a compiler because there is not one.',
        limits: [
          'This is the export with the least between it and the original, which is exactly why a difference here would matter most: it could only come from the markup being re-formatted on the way out.',
        ],
        findings: markup?.code.trim()
          ? []
          : [{ kind: 'problem', message: 'The export produced no markup file.' }],
      }
      break
    }

    case 'vue': {
      const sfc = file('vue')
      rehydrated = sfc
        ? rehydrateVue(sfc.code)
        : {
            side: { html: '', css: '' },
            method: 'No .vue file was produced.',
            limits: [],
            findings: [{ kind: 'problem', message: 'The export produced no .vue file.' }],
          }
      break
    }

    case 'svelte': {
      const component = file('svelte')
      rehydrated = component
        ? rehydrateSvelte(component.code)
        : {
            side: { html: '', css: '' },
            method: 'No .svelte file was produced.',
            limits: [],
            findings: [{ kind: 'problem', message: 'The export produced no .svelte file.' }],
          }
      break
    }

    case 'tailwind': {
      const markup = file('html')
      const companion = file('css')
      rehydrated = markup
        ? rehydrateTailwind(markup.code, companion?.code ?? '')
        : {
            side: { html: '', css: '' },
            method: 'No markup file was produced.',
            limits: [],
            findings: [{ kind: 'problem', message: 'The export produced no markup file.' }],
          }
      break
    }
  }

  return {
    target,
    label: result.label,
    files: result.files.map((f) => ({ path: f.path, language: f.language })),
    original: { html: input.html, css: input.css },
    converted: rehydrated.side,
    method: rehydrated.method,
    limits: [
      ...rehydrated.limits,
      'Both frames show the resting state. Hover, focus and checked rules are in the stylesheet on both sides and are compared as CSS, but nothing here presses the button.',
    ],
    findings: rehydrated.findings,
  }
}
