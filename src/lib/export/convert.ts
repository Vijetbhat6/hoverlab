/**
 * Someone else's markup, converted.
 *
 * `./index` exports a *catalog effect* to five frameworks. This exports an
 * arbitrary paste to the same five, and the difference is entirely in what
 * you can assume. A catalog effect is markup we wrote: one root element,
 * classes we named, a stylesheet that exists, no scripts, no inline
 * styles, no `onclick`. A paste has none of those guarantees — it is a
 * fragment ripped out of a page, or a whole document with a `<head>` still
 * attached, or a Figma export that is nothing but inline styles.
 *
 * So this module is mostly the part `exportEffect` never needed: work out
 * what was actually handed over, normalise it into something the builders
 * can take, and — the part that matters — say out loud what changed on the
 * way through.
 *
 * THE WARNINGS ARE THE PRODUCT
 *
 * Every converter on the web will turn `class` into `className`. What none
 * of them do is tell you that the `<script>` you pasted was dropped, that
 * your `onclick` is now an arrow function closing over globals that have
 * to exist, or that `!important` inside a style attribute cannot survive
 * the trip into a React style object. Those are the three things that make
 * converted code fail *after* it compiles, which is the expensive kind of
 * failure. They are reported per conversion, from the actual input, and
 * never from a static list of caveats.
 */

import {
  type ExportFile,
  type FrameworkId,
  frameworkMeta,
} from './index'
import {
  type HtmlElement,
  type HtmlNode,
  isElement,
  isJsxEventAttr,
  parseHtml,
  renderMarkup,
  walkElements,
} from './html-parse'
import {
  buildReact,
  buildStyledComponents,
  buildSvelte,
  buildVue,
  pascalCase,
} from './frameworks'
import { cssToTailwind } from './tailwind'

/** The targets /tools/convert offers. A subset of `FrameworkId`. */
export type ConvertTarget =
  | 'react'
  | 'vue'
  | 'svelte'
  | 'styled-components'
  | 'tailwind'

export const CONVERT_TARGETS: readonly ConvertTarget[] = [
  'react',
  'vue',
  'svelte',
  'styled-components',
  'tailwind',
] as const

export function isConvertTarget(value: string): value is ConvertTarget {
  return (CONVERT_TARGETS as readonly string[]).includes(value)
}

/* ------------------------------------------------------------------ *
 *  Untangling the paste
 * ------------------------------------------------------------------ */

export interface SplitSource {
  /** Markup, with `<style>`, `<script>` and any document shell removed. */
  html: string
  /** Everything that was inside a `<style>` element, in source order. */
  css: string
  /** How many `<style>` blocks were lifted out. */
  styleBlocks: number
  /** How many `<script>` blocks were discarded. */
  scriptBlocks: number
  /** True when a full document was pasted and `<body>` was unwrapped. */
  unwrappedDocument: boolean
}

const STYLE_BLOCK = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi
const SCRIPT_BLOCK = /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi
const BODY_BLOCK = /<body\b[^>]*>([\s\S]*?)<\/body\s*>/i

/**
 * Pull one paste apart into markup and stylesheet.
 *
 * People paste what they have, and what they have is usually one blob:
 * "view source, select, copy". Asking them to separate the `<style>` by
 * hand before the tool will work is the kind of friction that sends
 * someone back to the search results, so the tool does it.
 *
 * The document shell goes too. A component that returns `<html>` is not a
 * component, and a `<head>` full of meta tags converted to JSX is noise
 * nobody asked for — so when a `<body>` is present, its contents are the
 * markup and everything around it is dropped.
 */
export function splitSource(raw: string): SplitSource {
  const collected: string[] = []
  let styleBlocks = 0

  let html = raw.replace(STYLE_BLOCK, (_match, body: string) => {
    styleBlocks++
    if (body.trim()) collected.push(body.trim())
    return ''
  })

  let scriptBlocks = 0
  html = html.replace(SCRIPT_BLOCK, () => {
    scriptBlocks++
    return ''
  })

  const body = BODY_BLOCK.exec(html)
  const unwrappedDocument = body !== null
  if (body) html = body[1]

  // A leftover doctype or bare <html> from a fragment that had no </body>.
  html = html
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/<\/?(?:html|head|body)\b[^>]*>/gi, '')

  return {
    html: html.trim(),
    css: collected.join('\n\n'),
    styleBlocks,
    scriptBlocks,
    unwrappedDocument,
  }
}

/* ------------------------------------------------------------------ *
 *  What is in there
 * ------------------------------------------------------------------ */

export interface SourceFacts {
  /** Top-level elements. More than one needs a fragment in React. */
  rootCount: number
  elementCount: number
  /** Elements carrying a `style` attribute. */
  inlineStyled: number
  /** `!important` inside a style attribute — unreachable from a style object. */
  importantInStyle: number
  /** Inline handlers this renderer can spell as React props. */
  knownHandlers: string[]
  /** Inline handlers it cannot, which are left exactly as authored. */
  unknownHandlers: string[]
  /** Class names that appear in the markup, for the "no CSS given" hint. */
  classNames: string[]
}

export function inspectSource(html: string): SourceFacts {
  const nodes = parseHtml(html)
  const elements = walkElements(nodes)
  // Whitespace between two pasted siblings is a text node; it does not
  // make the fragment two-rooted.
  const roots = nodes.filter((n): n is HtmlElement => isElement(n))

  const facts: SourceFacts = {
    rootCount: roots.length,
    elementCount: elements.length,
    inlineStyled: 0,
    importantInStyle: 0,
    knownHandlers: [],
    unknownHandlers: [],
    classNames: [],
  }

  const classes = new Set<string>()
  const known = new Set<string>()
  const unknown = new Set<string>()

  for (const el of elements) {
    for (const attr of el.attrs) {
      const name = attr.name.toLowerCase()
      if (name === 'style' && attr.value) {
        facts.inlineStyled++
        if (/!\s*important/i.test(attr.value)) facts.importantInStyle++
      }
      if (name === 'class' && attr.value) {
        for (const cls of attr.value.split(/\s+/).filter(Boolean)) classes.add(cls)
      }
      if (name.startsWith('on') && name.length > 2 && attr.value !== null) {
        ;(isJsxEventAttr(name) ? known : unknown).add(name)
      }
    }
  }

  facts.classNames = [...classes]
  facts.knownHandlers = [...known].sort()
  facts.unknownHandlers = [...unknown].sort()
  return facts
}

/* ------------------------------------------------------------------ *
 *  Converting
 * ------------------------------------------------------------------ */

export interface ConvertInput {
  /** Markup. May still contain `<style>`; `splitSource` is applied first. */
  html: string
  /** Stylesheet given separately. Merged after anything lifted from the HTML. */
  css: string
  /** What the component should be called. Sanitised, never trusted. */
  name: string
}

export interface ConvertResult {
  target: ConvertTarget
  label: string
  files: ExportFile[]
  /** Every file joined, with banner comments when there is more than one. */
  clipboard: string
  /** Standing caveats about this target — from the builders. */
  notes: string[]
  /** Findings about *this input*. The reason to use this over a regex. */
  warnings: string[]
  facts: SourceFacts
  /** The markup and stylesheet the conversion actually ran on. */
  resolved: { html: string; css: string }
}

/** A component name that is a valid identifier, whatever was typed. */
export function componentNameFrom(input: string): string {
  const name = pascalCase(input.trim() || 'Component')
  return name || 'Component'
}

/**
 * Warnings that apply to any target.
 *
 * Kept separate from the per-target ones below so a caveat about the input
 * is never phrased as a caveat about React.
 */
function sharedWarnings(split: SplitSource, facts: SourceFacts): string[] {
  const out: string[] = []

  if (split.scriptBlocks) {
    out.push(
      `${split.scriptBlocks} <script> block${split.scriptBlocks === 1 ? '' : 's'} removed. Script tags do not run when rendered by a framework — move that code into the component itself.`,
    )
  }
  if (split.unwrappedDocument) {
    out.push(
      'A full HTML document was pasted, so the contents of <body> were taken and the rest dropped. Anything that lived in <head> is not in the output.',
    )
  }
  if (split.styleBlocks) {
    out.push(
      `${split.styleBlocks} <style> block${split.styleBlocks === 1 ? '' : 's'} lifted out of the markup and used as the stylesheet.`,
    )
  }
  if (facts.unknownHandlers.length) {
    out.push(
      `Left exactly as written: ${facts.unknownHandlers.join(', ')}. There is no reliable React spelling for these, and inventing one would give you a handler that never fires.`,
    )
  }

  return out
}

/** Warnings that only mean something once the target is known. */
function targetWarnings(
  target: ConvertTarget,
  facts: SourceFacts,
  css: string,
): string[] {
  const out: string[] = []
  const jsxTarget = target === 'react' || target === 'styled-components'

  if (jsxTarget && facts.inlineStyled) {
    out.push(
      `${facts.inlineStyled} inline style attribute${facts.inlineStyled === 1 ? '' : 's'} rewritten as style objects. A style string is a runtime error in React, not a warning.`,
    )
  }
  if (jsxTarget && facts.importantInStyle) {
    out.push(
      `!important cannot be expressed in a React style object, and ${facts.importantInStyle} of these declarations used it. Those rules will now lose to anything more specific — move them into the stylesheet.`,
    )
  }
  if (jsxTarget && facts.knownHandlers.length) {
    out.push(
      `${facts.knownHandlers.join(', ')} became arrow functions. The code inside them still refers to whatever it referred to before, so those globals have to exist where the component is used.`,
    )
  }
  if (target === 'react' && facts.rootCount > 1) {
    out.push(
      `${facts.rootCount} top-level elements, so the component returns a fragment.`,
    )
  }
  if (target === 'styled-components' && facts.rootCount > 1) {
    out.push(
      'More than one top-level element, so the styles are nested under a wrapping <div> that was not in your markup.',
    )
  }
  if ((target === 'vue' || target === 'svelte') && !css.trim() && facts.classNames.length) {
    out.push(
      'No stylesheet was given, so the component is markup-only. The class names are preserved and will match whatever global CSS you already have.',
    )
  }

  return out
}

function banner(path: string, language: string): string {
  if (language === 'html' || language === 'vue' || language === 'svelte') {
    return `<!-- ${path} -->`
  }
  if (language === 'css') return `/* ${path} */`
  return `// ${path}`
}

function toClipboard(files: ExportFile[]): string {
  if (files.length === 1) return files[0].code
  return files
    .map((f) => `${banner(f.path, f.language)}\n${f.code.trim()}`)
    .join('\n\n')
}

/**
 * Convert one paste to one target.
 *
 * Never throws. The parser degrades malformed markup to text rather than
 * failing, and everything downstream of it takes whatever the parser
 * produced — a converter that 500s on a stray `<` is a converter nobody
 * comes back to.
 */
export function convertSource(input: ConvertInput, target: ConvertTarget): ConvertResult {
  const split = splitSource(input.html)
  // The stylesheet the user typed wins the tail position: a `<style>` in
  // the pasted markup is usually the original, and edits go in the CSS box.
  const css = [split.css, input.css.trim()].filter(Boolean).join('\n\n')
  const facts = inspectSource(split.html)

  const componentName = componentNameFrom(input.name)
  const id = kebabCase(componentName)

  const frameworkInput = {
    id,
    name: componentName,
    description: 'Converted from HTML and CSS.',
    html: split.html,
    css,
    provenance: 'Converted by Hoverlab (hoverlab.dev/tools/convert) from HTML and CSS.',
  }

  let files: ExportFile[]
  let notes: string[]

  switch (target) {
    case 'react': {
      const built = buildReact(frameworkInput)
      files = [{ path: `${componentName}.tsx`, language: 'tsx', code: built.code }]
      notes = built.notes
      break
    }
    case 'vue': {
      const built = buildVue(frameworkInput)
      files = [{ path: `${componentName}.vue`, language: 'vue', code: built.code }]
      notes = built.notes
      break
    }
    case 'svelte': {
      const built = buildSvelte(frameworkInput)
      files = [{ path: `${componentName}.svelte`, language: 'svelte', code: built.code }]
      notes = built.notes
      break
    }
    case 'styled-components': {
      const built = buildStyledComponents(frameworkInput)
      files = [{ path: `${componentName}.tsx`, language: 'tsx', code: built.code }]
      notes = built.notes
      break
    }
    case 'tailwind': {
      const built = cssToTailwind(split.html, css, { effectId: id })
      files = [{ path: `${id}.html`, language: 'html', code: built.markup + '\n' }]
      if (built.css) {
        files.push({ path: `${id}.css`, language: 'css', code: built.css })
      }
      notes = built.notes
      break
    }
    default: {
      const never: never = target
      throw new Error(`Unsupported target: ${String(never)}`)
    }
  }

  return {
    target,
    label: frameworkMeta(target as FrameworkId).label,
    files,
    clipboard: toClipboard(files),
    notes,
    warnings: [...sharedWarnings(split, facts), ...targetWarnings(target, facts, css)],
    facts,
    resolved: { html: split.html, css },
  }
}

/** `ProductCard` → `product-card`, for file names and the Tailwind sheet. */
export function kebabCase(name: string): string {
  return (
    name
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'component'
  )
}

/** Formatted HTML, for the "what it ran on" view. */
export function normalizedHtml(html: string): string {
  const nodes: HtmlNode[] = parseHtml(html)
  return renderMarkup(nodes)
}
