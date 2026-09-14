/**
 * Fails the build on a DOM id that is not unique per instance.
 *
 * WHY THIS EXISTS, AND WHY `check:ids` IS NOT ENOUGH.
 *
 * `check-duplicate-ids.mts` renders the catalog surfaces and looks for two
 * elements with the same id. That catches a collision *that is already
 * happening*. It cannot catch the much larger latent case: a block that
 * emits `id="pricing-heading"` and is currently used on exactly one page.
 * Nothing is wrong today; it becomes wrong the moment a second page uses
 * the block, or the moment a customer renders the section twice on one
 * screen — and then it is their bug, in their project, and they have no
 * idea it came from here.
 *
 * That is not hypothetical. Adding twenty pages in September put fourteen
 * blocks on one surface a second time and turned twenty-five ids into real
 * duplicates overnight; adding nineteen more pages did it again to four
 * more. Both times the fix was mechanical and both times it was found by
 * accident, after the fact.
 *
 * WHAT A DUPLICATED ID ACTUALLY COSTS. `aria-labelledby`, `aria-controls`
 * and `<label for>` all resolve to *the first element in the document with
 * that id*. So the second copy of a section is announced with the first
 * copy's heading, and clicking the second copy's label focuses the first
 * copy's input. It is a 1.3.1 and 4.1.2 failure that looks fine on screen,
 * which is exactly the kind of thing a catalog has to catch mechanically.
 *
 * THE RULE. Every id a block emits must be rooted in a per-instance value:
 *
 *   - `React.useId()`          in a client component
 *   - `instanceId(...props)`   in a server component, where hooks are not
 *                              available — a hash of props that differ
 *                              between instances
 *
 * "Rooted in" is transitive, so a helper built from one of those is fine:
 *
 *     const uid = React.useId()
 *     const listboxId = `${uid}-listbox`      // safe, derived
 *     const rowId = (n: number) => `${uid}-row-${n}`
 *
 * WHAT IS DELIBERATELY NOT CHECKED. Ids inside a template literal that is
 * a *string* rather than JSX — the inline SVG data URIs a couple of blocks
 * build — are skipped. Those ids live inside one `<svg>` in one `src`
 * attribute and never reach the surrounding document, so they cannot
 * collide with anything. `avatar-crop-upload` is the block that made this
 * distinction necessary.
 *
 * Run: npx tsx scripts/check-literal-ids.mts
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const SOURCES = join(process.cwd(), 'src', 'lib', 'blocks', 'sources')

/** Attributes whose value becomes, or points at, a document id. */
const ID_ATTRS = ['id', 'htmlFor', 'aria-labelledby', 'aria-controls', 'aria-describedby']

/**
 * Blank out template-literal *contents* so the scanner only sees JSX.
 *
 * Keeps the backticks and any `${…}` markers in place positionally by
 * replacing characters with spaces rather than deleting them, so reported
 * line numbers still line up with the file.
 */
function maskStringTemplates(source: string): string {
  const out = source.split('')
  let i = 0

  while (i < source.length) {
    if (source[i] === '`') {
      let j = i + 1
      let depth = 0
      while (j < source.length) {
        if (source[j] === '\\') {
          j += 2
          continue
        }
        if (source[j] === '$' && source[j + 1] === '{') depth++
        if (source[j] === '}' && depth > 0) depth--
        if (source[j] === '`' && depth === 0) break
        j++
      }
      // Only mask literals that look like markup or a data URI — a plain
      // `${uid}-hint` is an id expression and must stay visible.
      const body = source.slice(i + 1, j)
      if (/<\/?[a-z]|data:image/i.test(body)) {
        for (let k = i + 1; k < j; k++) if (out[k] !== '\n') out[k] = ' '
      }
      i = j + 1
      continue
    }
    i++
  }

  return out.join('')
}

/** Names bound to a per-instance root, closed transitively. */
function perInstanceNames(source: string): Set<string> {
  const names = new Set<string>()

  // Seeds: any binding whose initialiser *mentions* a per-instance root.
  // Mentions, not equals — the common shape wraps the call rather than
  // assigning it bare:
  //     const headingId = `stats-timeline-heading-${instanceId(heading)}`
  for (const m of source.matchAll(
    /(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*([^\n]*)/g,
  )) {
    if (/(?:React\.)?useId\s*\(|instanceId\s*\(/.test(m[2])) names.add(m[1])
  }

  // Closure: anything whose initialiser mentions a known per-instance name.
  // Re-run until it stops growing, so a chain of two or three helpers works.
  for (let pass = 0; pass < 8; pass++) {
    const before = names.size
    for (const m of source.matchAll(
      /(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*([^\n]*(?:\n(?![ \t]*(?:const|let|return|\}))[^\n]*)*)/g,
    )) {
      const [, name, init] = m
      if (names.has(name)) continue
      for (const known of names) {
        if (new RegExp(`\\b${known}\\b`).test(init)) {
          names.add(name)
          break
        }
      }
    }
    if (names.size === before) break
  }

  return names
}

type Finding = { block: string; line: number; attr: string; value: string }

const findings: Finding[] = []
let scanned = 0

for (const file of readdirSync(SOURCES).sort()) {
  if (!file.endsWith('.tsx')) continue

  const block = file.replace(/\.tsx$/, '')
  const raw = readFileSync(join(SOURCES, file), 'utf8')
  const source = maskStringTemplates(raw)
  const safe = perInstanceNames(source)
  scanned++

  for (const attr of ID_ATTRS) {
    // attr="literal"  — always wrong, there is no instance in it at all.
    for (const m of source.matchAll(new RegExp(`\\b${attr}="([^"]+)"`, 'g'))) {
      findings.push({
        block,
        line: source.slice(0, m.index).split('\n').length,
        attr,
        value: `"${m[1]}"`,
      })
    }

    // attr={…} — safe only if the expression mentions a per-instance name.
    for (const m of source.matchAll(new RegExp(`\\b${attr}=\\{([^}]*(?:\\}[^}]*)??)\\}`, 'g'))) {
      const expr = m[1]
      if (!expr.trim()) continue

      // Mentions a per-instance root, directly or through a helper: safe.
      if ([...safe].some((n) => new RegExp(`\\b${n}\\b`).test(expr))) continue

      /*
        Otherwise it is only a finding when a hard-coded root is visible
        here. Two shapes qualify:

          a template whose first chunk is literal text — `row-${i}` — which
          is the same id in every instance of the block; and

          a bare identifier that resolves to a plain string constant, which
          is the same thing written one line further away.

        An expression this file cannot resolve — `id={id}`, `id={field.id}` —
        is deliberately NOT flagged. Those are parameters of a sub-component
        inside the block, and whether they are unique is decided by the
        caller a few lines up, which this check can already see. Flagging
        them would bury the real findings in noise, and noise is how a
        check like this gets switched off.
      */
      const literalRootedTemplate = /`\s*[A-Za-z0-9_-]/.test(expr)

      const bareName = expr.trim().match(/^([A-Za-z_$][\w$]*)$/)?.[1]
      const resolvesToStringConst =
        bareName != null &&
        new RegExp(`(?:const|let)\\s+${bareName}\\s*=\\s*['"]`).test(source)

      if (!literalRootedTemplate && !resolvesToStringConst) continue

      findings.push({
        block,
        line: source.slice(0, m.index).split('\n').length,
        attr,
        value: `{${expr.trim().split('\n')[0]}}`,
      })
    }
  }
}

if (findings.length === 0) {
  console.log(
    `check-literal-ids: ${scanned} blocks, every emitted id is rooted in useId() or instanceId().`,
  )
  process.exit(0)
}

const byBlock = new Map<string, Finding[]>()
for (const f of findings) {
  const list = byBlock.get(f.block)
  if (list) list.push(f)
  else byBlock.set(f.block, [f])
}

console.error(
  `check-literal-ids: ${findings.length} id(s) in ${byBlock.size} of ${scanned} blocks are not unique per instance.\n`,
)

for (const [block, list] of [...byBlock.entries()].sort()) {
  console.error(`  ${block}`)
  for (const f of list) {
    console.error(`    ${f.line}  ${f.attr}=${f.value}`)
  }
}

console.error(
  [
    '',
    'Every id a block emits has to be unique to the instance, because a block',
    'can be rendered twice on one document — two pages on a catalog hub, or one',
    'page using the section twice. aria-labelledby and <label for> resolve to the',
    'FIRST element with a given id, so the second copy is labelled by the first.',
    '',
    '  client component:  const uid = React.useId()',
    '  server component:  const uid = instanceId(heading, eyebrow)   // hash of props',
    '',
    'then build every id from it:  id={`${uid}-heading`}',
  ].join('\n'),
)

process.exit(1)
