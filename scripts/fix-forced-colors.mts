/**
 * Codemod: give forced-colors-mode a real edge to draw.
 *
 * The stress matrix's `forced-colors` condition found two shapes of the
 * same defect across the block and primitive sources:
 *
 *   1. A decorative, text-free element (a status dot, a legend swatch, a
 *      progress fill, a chart bar) whose only visible boundary is its
 *      `background-color` and nothing else — no border, no outline, no
 *      background-image. Windows high-contrast mode replaces backgrounds
 *      with the page colour, so the shape disappears entirely.
 *   2. A native form control with no border at all, for the same reason.
 *
 * The fix is the standard one: add a `border` whose colour is
 * `transparent`. In every normal browser that is invisible — Tailwind's
 * own preflight already sets `border-style: solid` on every element, so
 * this only supplies a colour, and a transparent one paints nothing. Under
 * `forced-colors: active`, the browser overrides `border-color` to a
 * system colour on ANY element that has a border style and width, transparent
 * or not — so the same class that changes nothing everywhere else becomes
 * a real, visible edge exactly where forced-colors mode needs one. This is
 * a documented technique, not a guess (search "forced colors transparent
 * border").
 *
 * ── SCOPE, AND WHY IT IS SAFE TO RUN WIDE ───────────────────────────────
 *
 * `border border-transparent` cannot make a normal render look different —
 * it has no color, so worst case a false-positive match is a no-op. That
 * is what allows this to run across every block and primitive source
 * automatically rather than needing a human to approve every file: the
 * risk of a wrong match is zero visual regression, only a wasted class.
 *
 * ── WHAT IS MATCHED, PRECISELY ──────────────────────────────────────────
 *
 * Reuses the same text-safe JSX reader `hoverlab review`'s RTL rule uses
 * (`packages/cli/src/review/jsx.mjs`), not a naive tag regex, for the same
 * reason that file gives: a `[^>]*` scanner stops at the first `>` inside
 * an inline handler and mis-slices the tag.
 *
 *   SHAPE:  <span|div|button|a|li|td|th className="...">  — self-closing
 *           or with only whitespace/comment content — whose className has
 *           a `bg-<color>` utility, no `border`/`outline` substring, and is
 *           not an icon wrapper (no `<svg`/`<img` inside the body).
 *   FIELD:  <input|textarea|select className="...">, not `type="hidden|
 *           checkbox|radio|range|color|file"`, className has no `border`
 *           substring.
 *
 * Only a plain string-literal `className="…"` is rewritten. A dynamic
 * `className={...}` (a `cn()` call, a template literal, a conditional) is
 * left alone and listed at the end for manual review — guessing inside an
 * expression is exactly the wrong place to be mechanical.
 *
 * NOTE ON THIS COMMENT ITSELF: nowhere in this file spells out an actual
 * `bg-` arbitrary-value background-image utility as literal text, even in
 * prose. Tailwind's content scanner is a plain text search over every file
 * in its scan path, comments included — it does not parse JavaScript, so a
 * docstring mentioning one as an example is exactly as visible to it as a
 * real `className`, and it will try to compile an arbitrary background
 * image utility whose "url" is literally three dots into `url(...)`, which
 * breaks every page's CSS build. Found the hard way: this file said so in
 * its own header comment and took the shared dev server down for every
 * session using it.
 *
 *     npx tsx scripts/fix-forced-colors.mts            report only
 *     npx tsx scripts/fix-forced-colors.mts --write     apply the edits
 *     npx tsx scripts/fix-forced-colors.mts --only field.tsx,other.tsx
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { elementBody, maskComments, openingTag, stringLiterals } from '../packages/cli/src/review/jsx.mjs'

const WRITE = process.argv.includes('--write')
const ONLY = process.argv.includes('--only')
  ? process.argv[process.argv.indexOf('--only') + 1].split(',')
  : null

const DIRS = [join('src', 'lib', 'blocks', 'sources'), join('src', 'lib', 'primitives', 'sources')]

const SHAPE_TAGS = ['span', 'div', 'button', 'a', 'li', 'td', 'th']
const FIELD_TAGS = ['input', 'textarea', 'select']
const SKIP_TYPES = ['hidden', 'checkbox', 'radio', 'range', 'color', 'file']

/*
 * A real fill, not merely something spelled `bg-...`.
 *
 * Tailwind overloads the `bg-` prefix for several background PROPERTIES
 * that are not colour: gradient direction (`bg-gradient-to-br`), repeat,
 * attachment, clip, blend mode, size and position. The live detector never
 * flags any of those — a gradient sets `background-image`, which already
 * counts as `hasEdge` in `measure.ts` — so matching them here would edit
 * elements the actual crawl never reported, for no effect. An arbitrary
 * background-image utility (an arbitrary `url(` fill, or the `image:`
 * variant) is the same case in the bracket-value form — see
 * `BG_ARBITRARY_IMAGE` below for the exact pattern, spelled as a regex
 * rather than in prose for the reason explained above the imports.
 */
const BG_NON_COLOR =
  /\bbg-(gradient-to-[a-z]{1,2}|clip-[a-z]+|blend-[a-z]+|origin-[a-z]+|repeat(-[a-z]+)?|no-repeat|auto|cover|contain|fixed|local|scroll|top|bottom|left|right|center)\b/
const BG_ARBITRARY_IMAGE = /\bbg-\[(url\(|image:)/
const BG_UTILITY = /\bbg-(?!transparent\b|none\b|inherit\b|current\b)[a-z][\w-]*(?:\/\d{1,3})?\b/
/*
 * `border-0` and `border-none` (likewise `outline-0`/`outline-none`) REMOVE
 * an edge — Tailwind's naming makes "the word border is present" and "there
 * is a border" opposite things. Stripping those tokens before testing is
 * what keeps `outline-none` from reading as "already has an edge", which is
 * exactly backwards and would have left `ai-inline-suggestion`'s textarea
 * unfixed.
 */
const EDGE_REMOVED = /\b(border|outline)(-[trblxsy]+)?-(0|none)\b/g
const HAS_EDGE = /\b(border|outline)\b/
const HAS_ADJUST = /forced-color-adjust/
const TYPE_ATTR = /type=["']([a-z]+)["']/

interface Edit {
  file: string
  line: number
  kind: 'shape' | 'field'
  before: string
  after: string
}

interface Skip {
  file: string
  line: number
  reason: string
}

const edits: Edit[] = []
const skipped: Skip[] = []

function lineOf(source: string, index: number): number {
  let line = 1
  for (let i = 0; i < index && i < source.length; i++) if (source[i] === '\n') line++
  return line
}

/** Every opening tag of `tagName`, as `{ tag, start }` — same regex `openingTags` uses, offset kept. */
function tagsWithOffsets(source: string, tagName: string): Array<{ tag: string; start: number }> {
  const out: Array<{ tag: string; start: number }> = []
  const open = new RegExp(`<${tagName}(?=[\\s/>])`, 'g')
  for (const match of source.matchAll(open)) {
    const tag = openingTag(source, match.index)
    if (tag !== null) out.push({ tag, start: match.index })
  }
  return out
}

/**
 * The className's string-literal value, or null if it is dynamic.
 *
 * `stringLiterals` matches from an opening quote to the first matching
 * closing quote with no notion of `${}` interpolation, so a template
 * literal `` `...${expr}...` `` comes back as ONE literal whose body
 * contains the interpolation's own source text verbatim — editing that
 * text would be reading and rewriting JavaScript as if it were a class
 * list. A backtick with no `${` in it behaves exactly like a plain string
 * and is safe to treat the same way; anything with `${` is dynamic, full
 * stop, and is left for manual review.
 */
function classNameValue(
  tag: string,
  literalsByStart: Map<number, { end: number; body: string }>,
  tagStart: number,
): { value: string; offsetInTag: number } | null {
  const m = /\bclassName\s*=\s*/.exec(tag)
  if (!m) return null
  const afterEq = tagStart + m.index + m[0].length
  const lit = literalsByStart.get(afterEq)
  if (!lit) return null // dynamic, or the quote character was not the start of a literal here
  if (lit.body.includes('${')) return null // a template literal with real interpolation
  return { value: lit.body, offsetInTag: m.index + m[0].length }
}

/**
 * The element has no visible text anywhere in its subtree, at any depth,
 * and nothing dynamic that COULD be text.
 *
 * This is deliberately NOT "no children" — the live detector's rule is
 * `el.textContent.trim() === ''`, which a progress-bar TRACK wrapping a
 * coloured FILL satisfies perfectly (`<div className="bg-muted"><div
 * className="bg-primary" /></div>`, neither has a letter in it) even
 * though the outer element is not empty. An earlier version of this
 * function required "no children at all" and missed exactly that shape —
 * found by hand on `billing-credit-balance.tsx`, where the fill (a direct
 * self-closing child) got fixed by the first pass and the track around it,
 * one level up with a child instead of text, did not.
 *
 * It is, just as deliberately, NOT "strip every `{...}` and see what's
 * left" — that was tried, and it wrongly cleared hundreds of primary
 * buttons whose visible label is exactly a `{children}` or `{label}`
 * expression the static source cannot resolve. A live crawl sees the
 * hydrated DOM, where that expression has already become real text and
 * the real detector correctly never flags the button; a codemod scanning
 * bare source text has no such view. So ANY `{...}` surviving in the body
 * — anything but a comment — disqualifies the element. That is stricter
 * than the live detector in exactly the cases it cannot tell apart from
 * source alone, and it is why `billing-credit-balance.tsx`'s track (whose
 * child carries a `style={{ width: ... }}` expression) still needed the
 * hand fix rather than this pass finding it too.
 */
function hasNoVisibleText(source: string, tag: string, tagStart: number, tagName: string): boolean {
  if (tag.trimEnd().endsWith('/>')) return true

  const bodyStart = tagStart + tag.length
  const body = elementBody(source, bodyStart, tagName)
  if (body === null) return false // no matching close tag found — do not guess
  const maskedBody = maskComments(body)

  let stripped = ''
  for (let i = 0; i < maskedBody.length; ) {
    const ch = maskedBody[i]
    if (ch === '<') {
      const rest = openingTag(maskedBody, i)
      if (rest === null) return false // malformed — refuse to guess
      i += rest.length
      continue
    }
    if (ch === '{') return false // a real expression: unknowable from source alone
    stripped += ch
    i++
  }
  return stripped.trim() === ''
}

/**
 * The element has a descendant that is not plain DOM markup.
 *
 * Named for its original, narrower purpose (`<svg>`/`<img>` icons), but the
 * real reason it exists is broader: JSX's own convention is that a
 * lowercase tag is a DOM element and a capitalised one is a component
 * (`<Sparkles />`), and a component is a black box to a source-text scan —
 * it might render an icon, a badge, a whole subtree with real words in it.
 * Every lucide-react icon in this catalog is used exactly that way, so a
 * decorative icon badge (`<div className="rounded-full bg-primary/10">
 * <Sparkles /></div>`) reads, at the source level, as "no text, no svg,
 * therefore empty" — and is exactly wrong, because after React renders it
 * the DOM has a real `<svg>` inside, which the LIVE detector's own icon
 * exclusion already catches (`el.querySelector('svg, img, …')`). A block
 * this codemod cannot see is fixed is a block the live crawl never flagged
 * in the first place; matching it here would be editing files that were
 * never broken. Any capitalised tag is therefore excluded, same as an icon.
 */
function hasIconChild(source: string, tag: string, tagStart: number, tagName: string): boolean {
  if (tag.trimEnd().endsWith('/>')) return false
  // Same-name nesting handled by `elementBody`, for the same reason
  // `hasNoVisibleText` needs it: a naive first-`</tagName>` search can stop
  // at an INNER element of the same tag name and miss (or wrongly catch)
  // an icon that sits past it.
  const body = elementBody(source, tagStart + tag.length, tagName)
  if (body === null) return false
  if (/<(svg|img|canvas|video|picture)[\s/>]/i.test(body)) return true
  return /<[A-Z][\w.]*[\s/>]/.test(body)
}

function addClass(value: string, addition: string): string {
  return `${value} ${addition}`.trim()
}

function hasRealEdge(className: string): boolean {
  return HAS_EDGE.test(className.replace(EDGE_REMOVED, ''))
}

function processFile(path: string): { source: string; changed: boolean } {
  const original = readFileSync(path, 'utf8')
  let source = original
  const masked = maskComments(source)
  let changed = false
  const literalsByStart = new Map(stringLiterals(masked).map((lit) => [lit.start, { end: lit.end, body: lit.body }]))

  // Work from the end of the file backwards so earlier offsets stay valid
  // as later ones are rewritten.
  type Candidate = { start: number; tag: string; tagName: string; kind: 'shape' | 'field' }
  const candidates: Candidate[] = []

  for (const tagName of SHAPE_TAGS) {
    for (const { tag, start } of tagsWithOffsets(masked, tagName)) candidates.push({ start, tag, tagName, kind: 'shape' })
  }
  for (const tagName of FIELD_TAGS) {
    for (const { tag, start } of tagsWithOffsets(masked, tagName)) candidates.push({ start, tag, tagName, kind: 'field' })
  }
  candidates.sort((a, b) => b.start - a.start)

  for (const { start, tag, tagName, kind } of candidates) {
    const cls = classNameValue(tag, literalsByStart, start)
    const line = lineOf(source, start)

    if (kind === 'field') {
      const typeMatch = TYPE_ATTR.exec(tag)
      if (typeMatch && SKIP_TYPES.includes(typeMatch[1])) continue
      if (!cls) {
        if (/className\s*=\s*\{/.test(tag)) {
          skipped.push({ file: path, line, reason: `<${tagName}> has a dynamic className — review by hand` })
        }
        continue
      }
      if (hasRealEdge(cls.value)) continue
    } else {
      // No static className at all, or a dynamic `className={...}` — there
      // is no string to read a bg- utility out of, so nothing to judge.
      if (!cls) continue
      if (!BG_UTILITY.test(cls.value)) continue
      if (BG_ARBITRARY_IMAGE.test(cls.value)) continue
      // Only skip for a NON-colour bg- utility if there is no OTHER,
      // colour-bearing bg- utility also present (`bg-primary bg-repeat-x`
      // is still a real fill; `bg-gradient-to-br from-x to-y` is not, once
      // the gradient-stop utilities are set aside).
      const withoutNonColor = cls.value.replace(new RegExp(BG_NON_COLOR, 'g'), '')
      if (!BG_UTILITY.test(withoutNonColor)) continue
      if (hasRealEdge(cls.value) || HAS_ADJUST.test(cls.value)) continue
      if (!hasNoVisibleText(source, tag, start, tagName)) continue
      if (hasIconChild(source, tag, start, tagName)) continue
    }

    const valueStart = start + cls.offsetInTag + 1 // +1 for the opening quote
    const before = source.slice(valueStart, valueStart + cls.value.length)
    const addition = 'border border-transparent'
    const after = addClass(before, addition)
    source = source.slice(0, valueStart) + after + source.slice(valueStart + before.length)
    changed = true
    edits.push({ file: path, line, kind, before, after })
  }

  return { source, changed }
}

let files: string[] = []
for (const dir of DIRS) {
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.tsx')) continue
    if (ONLY && !ONLY.includes(name)) continue
    files.push(join(dir, name))
  }
}

let touchedFiles = 0
for (const file of files) {
  const { source, changed } = processFile(file)
  if (!changed) continue
  touchedFiles++
  if (WRITE) writeFileSync(file, source)
}

console.log(`fix-forced-colors: ${edits.length} edit(s) in ${touchedFiles} file(s) (${edits.filter((e) => e.kind === 'shape').length} shapes, ${edits.filter((e) => e.kind === 'field').length} fields).`)
if (!WRITE) console.log('  (dry run — pass --write to apply)')

const byFile = new Map<string, Edit[]>()
for (const e of edits) byFile.set(e.file, [...(byFile.get(e.file) ?? []), e])
for (const [file, list] of byFile) {
  console.log(`\n  ${file}`)
  for (const e of list.sort((a, b) => a.line - b.line)) {
    console.log(`    L${e.line} [${e.kind}]  "${e.before}"  ->  "${e.after}"`)
  }
}

if (skipped.length > 0) {
  console.log(`\n${skipped.length} left for manual review (dynamic className):`)
  for (const s of skipped.slice(0, 30)) console.log(`  ${s.file}:${s.line}  ${s.reason}`)
}
