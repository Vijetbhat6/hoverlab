/**
 * Absolutely positioned descendants escaping a horizontal scroll container.
 *
 * ── WHY THIS MATTERS ────────────────────────────────────────────────────
 *
 * `overflow-x-auto` only clips an absolutely positioned descendant when the
 * scroll container is ALSO that descendant's containing block — that is,
 * when it is itself positioned. A static one does not establish a containing
 * block, so the descendant resolves against some ancestor further up, lays
 * out at its static position, and is painted wherever that happens to be.
 * The scroller clips nothing.
 *
 * Tailwind's `sr-only` is `position: absolute`. So a screen-reader label in
 * a right-hand table cell, inside a static `overflow-x-auto` wrapper whose
 * table is wider than its box, escapes the scroller and pushes the document
 * out — giving the whole PAGE a horizontal scrollbar on a phone, pointing at
 * nothing a sighted visitor can see. The table was always clipped correctly.
 * The screen-reader text was not.
 *
 * This is not hypothetical and it is not new. `/compare` carries a
 * load-bearing comment about it: those labels came to rest 640px into a
 * 390px viewport. On 2026-09-10 the same bug was found in seven catalog
 * blocks — six of them scrolling a real page sideways, with `kanban-board`
 * putting assignee names at 959px and `testimonial-carousel` ratings at
 * 1042px on a 390px screen.
 *
 * ── WHY A STATIC CHECK, AND NOT A BROWSER ONE ───────────────────────────
 *
 * It was found in a browser, and a browser is the wrong tool for keeping it
 * out. Rendering `/block/<id>` does NOT reproduce it: a block's demo props
 * are usually narrow enough that the scroller never overflows, so the
 * escape has nothing to escape past. `/block/comparison-table` measured
 * perfectly clean at 390px while `/page/enterprise-landing-page`, which
 * passes the same block wider data, was scrolling 18px. A per-block render
 * pass returns a confident false all-clear — which is presumably how this
 * survived in the catalog after `/compare` was fixed.
 *
 * The defect is structural, so it is decidable from the source: a scroll
 * container, unpositioned, with an absolutely positioned descendant. No dev
 * server, no browser, no flake, and it covers every block, page and template
 * at once instead of whichever routes someone thought to open.
 *
 * ── WHAT IT DOES NOT FLAG, AND WHY ──────────────────────────────────────
 *
 * A `<caption className="sr-only">` alone is not reported. A caption is
 * always the table's first child, so it lays out at the left edge and can
 * never travel rightward past the scroller. It escapes by a sub-pixel, is
 * invisible, and moves nothing. Reporting it would spend a catalog revision
 * — which customers see through `hoverlab outdated` — on nothing at all.
 *
 * ── HOW IT IS USED ──────────────────────────────────────────────────────
 *
 *     npx tsx scripts/check-overflow-clip.mts
 *
 * Exits 1 on a finding. The fix is always the same one word: add `relative`
 * to the scroll container.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import ts from 'typescript'

const ROOT = process.cwd()

/** Where components live. Everything under these is parsed. */
const ROOTS = [
  join(ROOT, 'src/lib/blocks/sources'),
  join(ROOT, 'src/lib/pages/sources'),
  join(ROOT, 'src/lib/templates'),
  join(ROOT, 'src/components'),
  join(ROOT, 'src/app'),
]

/**
 * Utilities that make a box SCROLL on the inline axis.
 *
 * `overflow-hidden` is deliberately not here. A clipping card whose content
 * fits has nothing laying out beyond its edge, so nothing escapes and
 * nothing moves — including it reported 28 decorative cards and buried the
 * eight real findings. The bug needs content wider than the box, and that
 * is what a scroller is for.
 */
const SCROLLS = /(^|\s)(overflow-auto|overflow-x-auto|overflow-x-scroll|overflow-scroll)(\s|$)/

/** Utilities that make a box a containing block for abspos descendants. */
const POSITIONED = /(^|\s)(relative|absolute|fixed|sticky)(\s|$)/

/** Utilities whose computed position is absolute. `sr-only` is the sneaky one. */
const ABSOLUTE = /(^|\s)(absolute|sr-only)(\s|$)/

interface Finding {
  file: string
  line: number
  scroller: string
  escapee: string
  escapeeTag: string
}

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (full.endsWith('.tsx')) out.push(full)
  }
  return out
}

/**
 * Every literal class name on one JSX element.
 *
 * `className` is often a template literal — `` `overflow-x-auto ${className}` ``
 * — or a conditional. Only the static text is inspected: an interpolated
 * value could contribute `relative` at runtime, but a scroll container whose
 * positioning depends on a caller's prop is not something to rely on, and in
 * practice these are all literal.
 */
function classesOf(node: ts.JsxOpeningLikeElement): string {
  const parts: string[] = []
  for (const attr of node.attributes.properties) {
    if (!ts.isJsxAttribute(attr)) continue
    if (attr.name.getText() !== 'className') continue
    const init = attr.initializer
    if (!init) continue
    const collect = (n: ts.Node) => {
      if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) parts.push(n.text)
      else if (ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) parts.push(n.text)
      n.forEachChild(collect)
    }
    collect(init)
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

function tagOf(node: ts.JsxOpeningLikeElement): string {
  return node.tagName.getText()
}

function check(file: string): Finding[] {
  const text = readFileSync(file, 'utf8')
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const findings: Finding[] = []

  /** Walk descendants of a scroller looking for an unclipped abspos box. */
  function scanInside(scroller: ts.Node, scrollerClasses: string) {
    const visit = (n: ts.Node) => {
      let opening: ts.JsxOpeningLikeElement | null = null
      if (ts.isJsxElement(n)) opening = n.openingElement
      else if (ts.isJsxSelfClosingElement(n)) opening = n

      if (opening) {
        const cls = classesOf(opening)
        if (ABSOLUTE.test(cls)) {
          const tag = tagOf(opening)
          // A <caption> is always first and always at the left edge.
          if (tag !== 'caption') {
            findings.push({
              file: relative(ROOT, file).replace(/\\/g, '/'),
              line: sf.getLineAndCharacterOfPosition(scroller.getStart()).line + 1,
              scroller: scrollerClasses.slice(0, 60),
              escapee: cls.slice(0, 40),
              escapeeTag: tag,
            })
          }
        } else if (POSITIONED.test(cls)) {
          /*
            Any positioned box — not just another scroller — becomes the
            containing block for everything absolute beneath it. Those boxes
            resolve against it, which is inside the scroller, so they are
            clipped correctly and the subtree is not our problem. Descending
            anyway was the other half of the noise.
          */
          return
        }
      }
      n.forEachChild(visit)
    }
    scroller.forEachChild(visit)
  }

  const visit = (n: ts.Node) => {
    let opening: ts.JsxOpeningLikeElement | null = null
    if (ts.isJsxElement(n)) opening = n.openingElement
    else if (ts.isJsxSelfClosingElement(n)) opening = n

    if (opening) {
      const cls = classesOf(opening)
      if (SCROLLS.test(cls) && !POSITIONED.test(cls)) scanInside(n, cls)
    }
    n.forEachChild(visit)
  }
  visit(sf)

  // One report per scroller, however many labels escape it.
  const seen = new Set<string>()
  return findings.filter((f) => {
    const key = `${f.file}:${f.line}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const files = ROOTS.flatMap((r) => walk(r))
const findings = files.flatMap(check)

if (findings.length === 0) {
  console.log(`check-overflow-clip: ${files.length} files, no escaping absolute descendants`)
  process.exit(0)
}

console.error(
  `check-overflow-clip: ${findings.length} scroll container${findings.length === 1 ? '' : 's'} that cannot clip what is inside\n`,
)
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}`)
  console.error(`    scroller: ${f.scroller}`)
  console.error(`    escapes:  <${f.escapeeTag} className="${f.escapee}">`)
}
console.error(
  '\n  Add `relative` to the scroll container. Without it the box is not a\n' +
    '  containing block, so it clips the content but not the absolutely\n' +
    '  positioned boxes inside — which then push the page sideways.',
)
process.exit(1)
