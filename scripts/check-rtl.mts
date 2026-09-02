/**
 * Physical-direction Tailwind utilities in the block catalog.
 *
 * ── WHY THIS MATTERS ────────────────────────────────────────────────────
 *
 * `pl-4` is "padding on the left", always, in every language. `ps-4` is
 * "padding at the start", which is the left in English and the right in
 * Arabic, Hebrew, Farsi and Urdu. A catalog written entirely in physical
 * properties cannot be used right-to-left at all: the labels sit on the
 * wrong side of their inputs, the chevrons point away from the thing they
 * open, and every gutter is mirrored.
 *
 * Tailwind has had logical equivalents for years and they cost nothing —
 * `ps-4` compiles to `padding-inline-start`, which browsers have supported
 * since 2019. There is no trade-off here, only a habit.
 *
 * ── WHAT THIS DOES NOT FLAG, AND WHY ────────────────────────────────────
 *
 * `left-` and `right-` positioning is left alone. Two reasons, and the
 * second is the one that would have caused a bug:
 *
 *   - `left-1/2 -translate-x-1/2` is the standard centring idiom. Rewriting
 *     `left-1/2` to `start-1/2` sets `inset-inline-start`, which in RTL
 *     resolves to `right: 50%` while `-translate-x-1/2` still moves left —
 *     so the element lands off-centre in exactly one direction.
 *   - Some positioning is genuinely physical. A decorative blob in a hero
 *     corner does not need to migrate across the layout when the language
 *     changes.
 *
 * Those are judgement calls, so they stay judgement calls. What this script
 * covers is the set with no judgement in it: padding, margin, text
 * alignment, borders and corner radii, where the logical form is simply
 * correct and the physical form is simply a habit.
 *
 * ── HOW IT IS USED ──────────────────────────────────────────────────────
 *
 *     npx tsx scripts/check-rtl.mts           report
 *     npx tsx scripts/check-rtl.mts --fix     rewrite the safe ones
 *
 * Not wired into `prebuild`. It is a codemod with a report mode, not a gate
 * — and a build that failed because someone typed `pl-2` would be a build
 * that gets its check deleted.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const SOURCES = join(ROOT, 'src/lib/blocks/sources')

/**
 * Physical → logical, for the utilities where the mapping is unambiguous.
 *
 * Order matters: longer prefixes first, so `border-l-2` is not matched by
 * the `border-l` rule with the `-2` left dangling.
 */
const MAPPINGS: Array<[RegExp, string]> = [
  // Corner radii. `rounded-l-*` → `rounded-s-*`, and the per-corner forms.
  [/^rounded-tl(-|$)/, 'rounded-ss$1'],
  [/^rounded-tr(-|$)/, 'rounded-se$1'],
  [/^rounded-br(-|$)/, 'rounded-ee$1'],
  [/^rounded-bl(-|$)/, 'rounded-es$1'],
  [/^rounded-l(-|$)/, 'rounded-s$1'],
  [/^rounded-r(-|$)/, 'rounded-e$1'],

  // Borders — width and colour both take the logical side.
  [/^border-l(-|$)/, 'border-s$1'],
  [/^border-r(-|$)/, 'border-e$1'],

  // Padding and margin, including the negative margins.
  [/^pl-/, 'ps-'],
  [/^pr-/, 'pe-'],
  [/^ml-/, 'ms-'],
  [/^mr-/, 'me-'],
  [/^-ml-/, '-ms-'],
  [/^-mr-/, '-me-'],

  // Text alignment.
  [/^text-left$/, 'text-start'],
  [/^text-right$/, 'text-end'],
]

/** Split a class token into its variant prefixes and its base utility. */
function splitVariants(token: string): { prefix: string; base: string } {
  const index = token.lastIndexOf(':')
  return index === -1
    ? { prefix: '', base: token }
    : { prefix: token.slice(0, index + 1), base: token.slice(index + 1) }
}

function convertToken(token: string): string | null {
  const { prefix, base } = splitVariants(token)

  for (const [pattern, replacement] of MAPPINGS) {
    if (pattern.test(base)) {
      return prefix + base.replace(pattern, replacement)
    }
  }
  return null
}

/**
 * Every class-like string literal in a source file.
 *
 * Blocks build class names three ways — a `className="..."` attribute, a
 * template literal, and a lookup table of strings — so this walks quoted
 * strings generally rather than parsing JSX. A false positive would have to
 * be a string that happens to contain a bare `pl-4` token and is not a
 * class list, which does not occur in this catalog and which the `--fix`
 * diff would show immediately.
 */
const STRING_LITERAL = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/g

interface Finding {
  file: string
  from: string
  to: string
}

function processFile(name: string, fix: boolean): Finding[] {
  const path = join(SOURCES, name)
  const source = readFileSync(path, 'utf8')
  const findings: Finding[] = []

  const next = source.replace(STRING_LITERAL, (match, quote: string, body: string) => {
    // Only strings that look like class lists. A sentence in a description
    // has spaces and punctuation; a class list is tokens separated by
    // single spaces, and every token here has to be one we recognise.
    if (!/[a-z]/.test(body)) return match

    let changed = false
    const tokens = body.split(/(\s+)/).map((token) => {
      if (!token.trim()) return token
      const converted = convertToken(token)
      if (!converted) return token
      changed = true
      findings.push({ file: name, from: token, to: converted })
      return converted
    })

    return changed ? quote + tokens.join('') + quote : match
  })

  if (fix && next !== source) writeFileSync(path, next, 'utf8')
  return findings
}

const fix = process.argv.includes('--fix')
const files = readdirSync(SOURCES).filter((name) => name.endsWith('.tsx'))

const all: Finding[] = []
for (const name of files) all.push(...processFile(name, fix))

if (all.length === 0) {
  console.log(`check-rtl: ${files.length} blocks, no physical-direction utilities.`)
  reportDirectionalIcons()
  process.exit(0)
}

const byUtility = new Map<string, number>()
for (const finding of all) {
  const key = `${finding.from} → ${finding.to}`
  byUtility.set(key, (byUtility.get(key) ?? 0) + 1)
}

const touched = new Set(all.map((f) => f.file)).size

console.log(
  `check-rtl: ${all.length} physical-direction ${all.length === 1 ? 'utility' : 'utilities'} ` +
    `across ${touched} of ${files.length} blocks${fix ? ' — rewritten' : ''}.`,
)

for (const [key, count] of [...byUtility.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
  console.log(`  ${String(count).padStart(4)}  ${key}`)
}

if (!fix) {
  console.log('\nRun with --fix to rewrite them. Positioning (left-/right-) is')
  console.log('deliberately left alone — see the header for why.')
}

reportDirectionalIcons()

/**
 * Directional icons, reported and never rewritten.
 *
 * Logical properties mirror the *layout*. They do nothing to a glyph: an
 * `<ArrowRight />` beside a "Next" button still points right in Arabic,
 * where next is to the left. Seen in the RTL screenshot of
 * `settings-audit-log`, where a before → after arrow kept pointing at the
 * "before".
 *
 * This is advisory rather than a codemod for a reason that matters. Some of
 * these arrows are directional in the layout sense and should flip
 * (`rtl:rotate-180` or the mirrored icon); others are not — an external-link
 * arrow, a chevron in a numeric stepper, an upward trend indicator — and
 * flipping those would introduce bugs in the name of fixing one. There is no
 * rule that separates them, only reading the call site.
 *
 * So: counted, named, and left for a person.
 */
function reportDirectionalIcons(): void {
  const DIRECTIONAL =
    /\b(ArrowRight|ArrowLeft|ChevronRight|ChevronLeft|ArrowUpRight|ArrowDownLeft|CornerDownRight|MoveRight|MoveLeft)\b/g

  const byIcon = new Map<string, Set<string>>()

  for (const name of files) {
    const source = readFileSync(join(SOURCES, name), 'utf8')
    // Import lines only, so a word inside prose is not counted.
    const imports = source.match(/^import\s+\{[^}]*\}\s+from\s+'lucide-react'/ms)
    if (!imports) continue

    for (const match of imports[0].matchAll(DIRECTIONAL)) {
      const icon = match[0]
      if (!byIcon.has(icon)) byIcon.set(icon, new Set())
      byIcon.get(icon)!.add(name)
    }
  }

  if (byIcon.size === 0) return

  const total = [...byIcon.values()].reduce((sum, set) => sum + set.size, 0)
  console.log(
    `\ncheck-rtl: ADVISORY — ${total} directional icon ${total === 1 ? 'import' : 'imports'} ` +
      `across ${new Set([...byIcon.values()].flatMap((s) => [...s])).size} blocks.`,
  )
  console.log('  Logical properties mirror layout; they do not turn a glyph around.')
  for (const [icon, blocks] of [...byIcon.entries()].sort((a, b) => b[1].size - a[1].size)) {
    console.log(`  ${String(blocks.size).padStart(4)}  ${icon}`)
  }
  console.log('  Not rewritten: some of these should flip under rtl: and some must not.')
}
