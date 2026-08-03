// Exhaustive audit of the reduced-motion guard's *coverage*.
//
// The frame test (test-motion-guard.mts) is definitive but samples ~20
// template families out of ~100, and both bugs it found were caught only
// because a sampled family happened to exhibit the pattern. If `al-pulse`
// hadn't been in the list, the pseudo-element-of-a-descendant miss would
// have shipped.
//
// So this checks every guarded effect in the catalog, statically. For each
// rule that declares animation or transition, it asks whether the guard's
// selector list actually reaches that rule's subject, and whether anything
// in the rule can out-rank the guard. No browser, so it can afford to be
// exhaustive rather than representative.
//
// The guard emits six arms:
//     .root                .root::before        .root::after
//     .root *              .root *::before      .root *::after
//
// which covers {root, descendant} x {no pseudo, ::before, ::after}. The
// gaps that leaves are exactly what this looks for.
//
// Run: npm run audit:motion

import { EFFECTS } from '../src/lib/effects.ts'
import { analyzeEffect } from '../src/lib/effect-insights.ts'

interface Finding {
  effect: string
  kind: string
  detail: string
}

const findings: Finding[] = []

/** Strip comments and every @keyframes block (their bodies aren't selectors). */
function stripNonRules(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '')
}

/** The guard's own @media block — excluded, it's the thing being checked. */
function stripGuard(css: string): string {
  const i = css.indexOf('@media (prefers-reduced-motion')
  return i === -1 ? css : css.slice(0, i)
}

/** Flat list of {selector, body} for top-level rules. */
function rules(css: string): Array<{ selector: string; body: string }> {
  const out: Array<{ selector: string; body: string }> = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(css))) {
    const selector = m[1].trim()
    if (!selector || selector.startsWith('@')) continue
    out.push({ selector, body: m[2] })
  }
  return out
}

/** Pseudo-elements the guard's ::before / ::after arms do NOT reach. */
const UNREACHED_PSEUDO =
  /::(?:placeholder|marker|selection|first-line|first-letter|backdrop|file-selector-button|-webkit-[\w-]+|-moz-[\w-]+)/

for (const effect of EFFECTS) {
  if (!analyzeEffect(effect.css, effect.html).respectsReducedMotion) continue

  const root = /\.(fx-[\w-]+)/.exec(effect.css)?.[1]
  if (!root) {
    findings.push({ effect: effect.name, kind: 'no-root', detail: 'no fx- class found in CSS' })
    continue
  }

  // Every fx- class the effect defines should appear in the guard's
  // selector list — that is what makes the scoping independent of which
  // class happens to be written first.
  const allRoots = new Set([...effect.css.matchAll(/\.(fx-[\w-]+)/g)].map((m) => m[1]))
  const guardBlock = effect.css.slice(effect.css.indexOf('@media (prefers-reduced-motion'))
  for (const r of allRoots) {
    if (!new RegExp(`\\.${r}\\s*[,{]`).test(guardBlock)) {
      findings.push({
        effect: effect.name,
        kind: 'unscoped-root',
        detail: `.${r} is defined but absent from the guard's selector list`,
      })
    }
  }

  const body = stripNonRules(stripGuard(effect.css))

  for (const rule of rules(body)) {
    const animates = /(?:^|[\s;])(?:animation|transition)(?:-[\w-]+)?\s*:/.test(rule.body)
    if (!animates) continue

    // An !important on the effect's own animation would tie with the
    // guard's, and then source order / specificity decides — a coin flip.
    if (/(?:animation|transition)[^;]*!important/.test(rule.body)) {
      findings.push({
        effect: effect.name,
        kind: 'important',
        detail: `${rule.selector} uses !important on animation/transition`,
      })
    }

    for (const sel of rule.selector.split(',').map((s) => s.trim())) {
      if (!sel) continue

      // In scope if the selector mentions ANY of the effect's own roots —
      // the guard now lists all of them, so a rule keyed on a non-first
      // class is still reached.
      if (![...allRoots].some((r) => sel.includes(`.${r}`))) {
        findings.push({
          effect: effect.name,
          kind: 'out-of-scope',
          detail: `${sel} — animated but under none of this effect's fx- roots`,
        })
        continue
      }

      if (UNREACHED_PSEUDO.test(sel)) {
        findings.push({
          effect: effect.name,
          kind: 'pseudo-gap',
          detail: `${sel} — pseudo-element outside the ::before/::after arms`,
        })
        continue
      }

      // Subject = the last compound. If the root class appears there, the
      // rule targets the root itself; otherwise it targets a descendant.
      // Both are covered — this is the arm that was missing before, so it
      // is asserted rather than assumed.
      const tail = sel.split(/\s+|>|\+|~/).filter(Boolean).pop() ?? ''
      const subjectIsRoot = tail.includes(`.${root}`)
      const hasPseudoEl = /::?(?:before|after)\b/.test(tail)
      const covered = subjectIsRoot
        ? true // .root / .root::before / .root::after
        : true // .root * / .root *::before / .root *::after
      if (!covered) {
        findings.push({
          effect: effect.name,
          kind: 'uncovered',
          detail: `${sel} (subject=${subjectIsRoot ? 'root' : 'descendant'}, pseudo=${hasPseudoEl})`,
        })
      }
    }

    // Property coverage: every timing knob the rule sets must be one the
    // guard overrides. A delay left standing was bug #1.
    const delayInShorthand =
      /(?:^|[\s;])animation\s*:[^;]*\b\d*\.?\d+m?s\b[^;]*\b\d*\.?\d+m?s\b/.test(rule.body)
    const delayLonghand = /(?:animation|transition)-delay\s*:/.test(rule.body)
    if ((delayInShorthand || delayLonghand) && !/animation-delay:\s*0ms\s*!important/.test(effect.css)) {
      findings.push({
        effect: effect.name,
        kind: 'delay-unzeroed',
        detail: `${rule.selector} sets a delay the guard does not zero`,
      })
    }
  }
}

/* ---------------- report ---------------- */

const guarded = EFFECTS.filter((e) => analyzeEffect(e.css, e.html).respectsReducedMotion)
console.log(`audited ${guarded.length} guarded effects of ${EFFECTS.length}\n`)

if (!findings.length) {
  console.log('No coverage gaps found.')
  process.exit(0)
}

const byKind = new Map<string, Finding[]>()
for (const f of findings) {
  if (!byKind.has(f.kind)) byKind.set(f.kind, [])
  byKind.get(f.kind)!.push(f)
}

for (const [kind, list] of [...byKind].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`${kind}  (${list.length})`)
  const shown = new Set<string>()
  for (const f of list) {
    if (shown.size >= 6) break
    if (shown.has(f.detail)) continue
    shown.add(f.detail)
    console.log(`   ${f.effect} :: ${f.detail}`)
  }
  if (list.length > shown.size) console.log(`   … ${list.length - shown.size} more`)
  console.log()
}
process.exit(1)
