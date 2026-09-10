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
 * The file is now in `prebuild`, but only its second half can fail a build,
 * and the split is deliberate.
 *
 * Physical utilities stay a report. A build that failed because someone
 * typed `pl-2` would be a build that gets its check deleted — the fix is
 * one flag away, so the failure would be pure friction and it would teach
 * people to route around the script.
 *
 * Directional icons DO fail it (PART TWO, below). There is no `--fix` for
 * them and there cannot be one: whether a glyph mirrors depends on what it
 * means at its call site, so an unruled icon is a question, not a typo. The
 * cost of ignoring it is an Arabic reader seeing an arrow point at the
 * thing they just came from, which is the sort of bug that never shows up
 * in a screenshot anyone on this team takes.
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

/**
 * The same source with every comment blanked to spaces.
 *
 * Offsets are preserved so a match found here can be applied to the original
 * text, and that is the entire trick: the scanner needs to see the code
 * without the prose, but the rewriter must still edit the real file.
 *
 * This is a bug fix, not a tidy-up. `STRING_LITERAL` starts a string at the
 * first quote character it meets, and an English apostrophe in a docblock —
 * "a screen reader's table commands" — is a quote character. From there the
 * scanner is one quote out of phase for the rest of the file: it reads code
 * as string and string as code, and every className after it is invisible.
 *
 * The failure was silent and it was partial, which is the worst combination.
 * A run over the catalog rewrote 15 of the 19 physical `text-left` tokens
 * and reported "15 rewritten" — a green, confident, wrong number. The four
 * it skipped were skipped because of where an apostrophe happened to fall in
 * a comment nine lines from the top of the file, so the same input would
 * have produced a different answer after any unrelated edit to the prose.
 */
function maskComments(source: string): string {
  const blank = (m: string) => m.replace(/[^\n\r]/g, ' ')
  return source
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:])\/\/[^\n\r]*/g, (m, lead: string) => lead + blank(m.slice(lead.length)))
}

interface Finding {
  file: string
  from: string
  to: string
}

function processFile(name: string, fix: boolean): Finding[] {
  const path = join(SOURCES, name)
  const source = readFileSync(path, 'utf8')
  const findings: Finding[] = []

  // Find literals in the comment-blanked copy; rewrite the real one. Offsets
  // line up because `maskComments` replaces character-for-character.
  const masked = maskComments(source)
  let out = ''
  let cursor = 0

  for (const match of masked.matchAll(STRING_LITERAL)) {
    const start = match.index!
    const end = start + match[0].length
    const quote = match[1]!
    const body = source.slice(start + 1, end - 1)

    // Only strings that look like class lists. A sentence in a description
    // has spaces and punctuation; a class list is tokens separated by
    // single spaces, and every token here has to be one we recognise.
    if (!/[a-z]/.test(body)) continue

    let changed = false
    const tokens = body.split(/(\s+)/).map((token) => {
      if (!token.trim()) return token
      const converted = convertToken(token)
      if (!converted) return token
      changed = true
      findings.push({ file: name, from: token, to: converted })
      return converted
    })

    if (!changed) continue
    out += source.slice(cursor, start) + quote + tokens.join('') + quote
    cursor = end
  }

  const next = out + source.slice(cursor)
  if (fix && next !== source) writeFileSync(path, next, 'utf8')
  return findings
}

/* ══ PART TWO: DIRECTIONAL ICONS ═════════════════════════════════════════
 *
 * Logical properties mirror the *layout*. They do nothing to a glyph: an
 * `<ArrowRight />` beside a "Next" button still points right in Arabic,
 * where next is to the left. Seen first in the RTL screenshot of
 * `settings-audit-log`, where a before → after arrow kept pointing at the
 * "before".
 *
 * This half of the file used to end with a count — "68 directional icon
 * imports across 57 blocks" — and the sentence "counted, named, and left
 * for a person". That was the right call at the time and the wrong shape to
 * leave it in. A number that only goes up is not a queue, it is a statistic
 * about a queue; this one sat at 68 for a month because nothing in it told
 * anyone which of the 68 needed what.
 *
 * So the judgement has been made, call site by call site, and written down
 * below. What replaces the count is not a codemod either — it is a ledger,
 * plus a check that the code still agrees with it:
 *
 *   - every directional icon in the catalog has a recorded decision and a
 *     reason;
 *   - `mirror` icons must carry an RTL class at every call site;
 *   - `keep` icons must carry one at none, so a future blanket codemod
 *     cannot quietly flip a Return-key glyph;
 *   - an icon nobody has ruled on fails the run.
 *
 * That last rule is the one that earns its keep. The old detector knew nine
 * icon names, and the catalog had grown six it had never heard of —
 * `ChevronsLeft` and `ChevronsRight` on the first/last-page buttons, plus
 * `Send`, `Undo2` and `LogOut`. So the honest number was never 68. It was
 * 90, and 22 of them were invisible to the thing doing the counting.
 *
 * ── HOW THE MIRROR IS SPELT ──────────────────────────────────────────────
 *
 * `rtl:rotate-180`, except where the element already rotates. Tailwind v4
 * emits `rotate` as its own CSS property, so two rotate utilities on one
 * element fight and the winner is a source-order accident. Where a chevron
 * rotates to show an open state the RTL class goes on the CLOSED state only
 * — `open ? 'rotate-90' : 'rtl:rotate-180'` — because a chevron that has
 * swung down is pointing at the floor, and the floor is not mirrored.
 *
 * A hover nudge (`group-hover:translate-x-0.5`, the arrow leaning towards
 * where it is about to take you) needs its own RTL form. `translate` is
 * also a separate property, applied in the unmirrored outer space, so it
 * does not come along with the rotation.
 */

type Ruling = 'mirror' | 'keep' | 'symmetric'

interface IconRule {
  ruling: Ruling
  why: string
  /** Blocks where this icon's ruling does not apply, id → reason. */
  except?: Record<string, string>
}

/**
 * The adjudication.
 *
 * Keyed by icon rather than by call site because that is how it came out,
 * not because it has to be: each of these icons is used in exactly one
 * sense across the catalog today. `except` exists for the day that stops
 * being true — an `ArrowRight` used as a trend indicator belongs there
 * rather than forcing the whole icon to be reclassified.
 */
const ICONS: Record<string, IconRule> = {
  /* ── Mirrored: these run along the reading axis ─────────────────────── */
  ArrowRight: {
    ruling: 'mirror',
    why: 'forward — CTA, continue, next, and the source→target arrow in a column mapping or an audit diff. All of it runs with the text.',
  },
  ArrowLeft: {
    ruling: 'mirror',
    why: 'back — "back to sign in", "previous page", docs pagination.',
  },
  ChevronRight: {
    ruling: 'mirror',
    why: 'breadcrumb separator, row affordance, and the closed state of a disclosure. Each points at content lying towards the end edge.',
  },
  ChevronLeft: {
    ruling: 'mirror',
    why: 'previous, in a carousel, a stepper, a pager or a month view.',
  },
  ChevronsRight: {
    ruling: 'mirror',
    why: 'last page — the end of a sequence, which moves with the sequence.',
  },
  ChevronsLeft: { ruling: 'mirror', why: 'first page.' },
  CornerDownRight: {
    ruling: 'mirror',
    why: 'a nesting elbow: the indent it draws runs from the start edge inwards.',
  },
  Undo2: {
    ruling: 'mirror',
    why: 'undo runs backwards through a history whose forward direction is the reading direction.',
  },
  Send: { ruling: 'mirror', why: 'the paper plane leaves along the reading direction.' },
  LogOut: {
    ruling: 'mirror',
    why: 'an arrow leaving through a door, and the door is on the end edge.',
  },

  /* ── Not mirrored, each for its own reason ──────────────────────────── */
  CornerDownLeft: {
    ruling: 'keep',
    why: 'this is the Return key. It is a picture of a physical object on a physical keyboard, and that keyboard does not rearrange itself for Arabic — mirroring it draws a key no keyboard has.',
  },
  ArrowUpRight: {
    ruling: 'keep',
    why: 'the launch idiom — "opens elsewhere" — or the rising half of a trend. Neither meaning is about reading order: the diagonal is the point, and up is up.',
  },
  ArrowDownRight: {
    ruling: 'keep',
    why: 'the falling half of that trend pair. Mirroring one arrow of a matched up/down set breaks the pair.',
  },
  ExternalLink: {
    ruling: 'keep',
    why: 'same family as ArrowUpRight and the same argument. Leaving the site is not a direction the text has an opinion about.',
  },
  Play: {
    ruling: 'keep',
    why: 'transport controls run along the media timeline, not the text. Every RTL platform ships play pointing the same way, and a mirrored play button reads as rewind.',
  },
  ArrowLeftRight: {
    ruling: 'symmetric',
    why: 'a two-headed arrow. Mirroring it is a no-op, so the class would be noise a reader has to stop and check.',
  },
}

/** Any class that turns a glyph around. */
const MIRROR_CLASS = /\brtl:(?:-?rotate-|-?scale-x-|-scale-)/

/**
 * Whether an icon name looks directional enough to demand a ruling.
 *
 * Deliberately broader than `ICONS`, because its job is to catch the icon
 * nobody has thought about yet. Matched on camel-case words rather than as
 * a substring, so `Copyright` and `Highlighter` do not trip on "right".
 */
const DIRECTIONAL_WORDS = new Set([
  'Left',
  'Right',
  'Forward',
  'Backward',
  'Rewind',
  'Undo',
  'Redo',
  'Reply',
  'Indent',
  'Outdent',
  'Send',
  'Play',
  'Skip',
  'Next',
  'Previous',
  'Corner',
  'Move',
  'External',
])

const DIRECTIONAL_NAMES = new Set(['LogIn', 'LogOut', 'Import', 'Export'])

function looksDirectional(name: string): boolean {
  if (DIRECTIONAL_NAMES.has(name)) return true
  return (name.match(/[A-Z][a-z]*/g) ?? []).some((word) => DIRECTIONAL_WORDS.has(word))
}

/** One opening tag as raw text, brace- and quote-aware. */
function openingTag(source: string, start: number): string {
  let depth = 0
  let quote: string | null = null
  for (let i = start; i < source.length; i++) {
    const ch = source[i]!
    if (quote) {
      if (ch === '\\') i++
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') quote = ch
    else if (ch === '{') depth++
    else if (ch === '}') depth--
    else if (ch === '>' && depth === 0) return source.slice(start, i + 1)
  }
  return source.slice(start)
}

interface IconProblem {
  block: string
  line: number
  icon: string
  message: string
}

function auditDirectionalIcons(): IconProblem[] {
  const problems: IconProblem[] = []
  const seen = new Map<string, Set<string>>()

  for (const name of files) {
    const block = name.replace(/\.tsx$/, '')
    const source = readFileSync(join(SOURCES, name), 'utf8')
    const code = maskComments(source)

    const imports = /^import\s+\{([^}]*)\}\s+from\s+'lucide-react'/ms.exec(code)
    const imported = imports
      ? imports[1]!
          .split(',')
          .map((raw) => raw.trim())
          .filter(Boolean)
      : []

    for (const icon of imported) {
      if (!looksDirectional(icon)) continue

      if (!seen.has(icon)) seen.set(icon, new Set())
      seen.get(icon)!.add(block)

      const rule = ICONS[icon]
      if (!rule) {
        problems.push({
          block,
          line: 1,
          icon,
          message:
            'no ruling. Decide whether this glyph runs with the reading direction, then ' +
            'add it to ICONS with the reason — do not infer one from the name',
        })
        continue
      }
      if (rule.except?.[block]) continue

      for (const match of code.matchAll(new RegExp(`<${icon}(?=[\\s/>])`, 'g'))) {
        const tag = openingTag(code, match.index!)
        const mirrored = MIRROR_CLASS.test(tag)
        const line = code.slice(0, match.index!).split('\n').length

        if (rule.ruling === 'mirror' && !mirrored) {
          problems.push({
            block,
            line,
            icon,
            message: `ruled "mirror" (${rule.why}) but this call site carries no rtl: class`,
          })
        }
        if (rule.ruling !== 'mirror' && mirrored) {
          problems.push({
            block,
            line,
            icon,
            message: `ruled "${rule.ruling}" (${rule.why}) but this call site mirrors it`,
          })
        }
      }
    }
  }

  const counts = [...seen.entries()].sort((a, b) => b[1].size - a[1].size)
  const total = counts.reduce((sum, [, blocks]) => sum + blocks.size, 0)
  const blockCount = new Set(counts.flatMap(([, set]) => [...set])).size

  console.log(
    `\ncheck-rtl: ${total} directional icon import${total === 1 ? '' : 's'} across ` +
      `${blockCount} blocks${problems.length ? '' : ', all adjudicated'}.`,
  )
  for (const [icon, set] of counts) {
    const rule = ICONS[icon]
    console.log(
      `  ${String(set.size).padStart(4)}  ${icon.padEnd(16)} ${rule?.ruling ?? 'NO RULING'}`,
    )
  }

  return problems
}

/* ══ DRIVER ══════════════════════════════════════════════════════════════ */

const fix = process.argv.includes('--fix')
const files = readdirSync(SOURCES).filter((name) => name.endsWith('.tsx'))

const all: Finding[] = []
for (const name of files) all.push(...processFile(name, fix))

if (all.length === 0) {
  console.log(`check-rtl: ${files.length} blocks, no physical-direction utilities.`)
} else {
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
}

const problems = auditDirectionalIcons()

if (problems.length > 0) {
  console.error(
    `\ncheck-rtl: ${problems.length} icon ${problems.length === 1 ? 'problem' : 'problems'}.\n`,
  )
  for (const problem of problems) {
    console.error(
      `  src/lib/blocks/sources/${problem.block}.tsx:${problem.line}  <${problem.icon}>`,
    )
    console.error(`    ${problem.message}`)
  }
  process.exitCode = 1
}
