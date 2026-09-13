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
 * ── WHAT --fix DOES NOT TOUCH, AND WHY ──────────────────────────────────
 *
 * `left-` and `right-` positioning is never rewritten automatically. Two
 * reasons, and the second is the one that would have caused a bug:
 *
 *   - `left-1/2 -translate-x-1/2` is the standard centring idiom. Rewriting
 *     `left-1/2` to `start-1/2` sets `inset-inline-start`, which in RTL
 *     resolves to `right: 50%` while `-translate-x-1/2` still moves left —
 *     so the element lands off-centre in exactly one direction.
 *   - Some positioning is genuinely physical. A decorative blob in a hero
 *     corner does not need to migrate across the layout when the language
 *     changes.
 *
 * Those are judgement calls, so they are ruled by hand in PART THREE and
 * the build checks the code still agrees. What `--fix` covers is the set
 * with no judgement in it: padding, margin, text alignment, floats, borders
 * and corner radii, where the logical form is simply correct and the
 * physical form is simply a habit.
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
 * Directional icons DO fail it (PART TWO, below), and so do physical
 * positions and horizontal movement (PART THREE). There is no `--fix` for
 * either and there cannot be one: whether a glyph mirrors, or a badge
 * follows the text, depends on what it means where it sits, so an unruled
 * one is a question, not a typo. The cost of ignoring it is an Arabic
 * reader seeing an arrow point at the thing they just came from, or a
 * search icon sitting on top of the words they are typing — the sort of
 * bug that never shows up in a screenshot anyone on this team takes.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/*
  The mappings, the icon ledger and the source walkers live in
  `packages/cli/src/review` — the same place the accessibility rules went,
  for the same reason. They are the engine behind `hoverlab review`, and a
  second copy here would drift: the CLI would tell somebody their `pl-4`
  was fine on a day this build was failing on it, and nothing would catch
  the disagreement.

  What stays here is what is genuinely about THIS catalog — the per-block
  `PHYSICAL` rulings in PART THREE, and the `except` overlay below. Those
  are judgements about our own components and mean nothing in anyone
  else's repo.
*/
import {
  lineAt,
  maskComments,
  openingTag,
  splitVariants,
  stringLiterals,
} from '../packages/cli/src/review/jsx.mjs'
import {
  ICONS as RULINGS,
  MIRROR_CLASS,
  convertToken,
  fixSpacing,
  looksDirectional,
} from '../packages/cli/src/review/rtl.mjs'

const ROOT = process.cwd()
const SOURCES = join(ROOT, 'src/lib/blocks/sources')

/*
  PART ONE used to carry the physical→logical table, a variant splitter, a
  string-literal scanner and an offset-preserving comment mask. All four
  are now imported: `fixSpacing` is exactly this pass, generalised to take
  text rather than a filename.

  The comment mask is the one worth knowing about. `STRING_LITERAL` starts
  a string at the first quote it meets, and an English apostrophe in a
  docblock — "a screen reader's table commands" — is a quote character.
  From there the scanner is one quote out of phase for the rest of the
  file: it reads code as string and string as code, and every className
  after it is invisible. A run over the catalog rewrote 15 of the 19
  physical `text-left` tokens and reported a green, confident, wrong "15
  rewritten". That fix travelled with the code into `jsx.mjs`.
*/

interface Finding {
  file: string
  from: string
  to: string
}

function processFile(name: string, fix: boolean): Finding[] {
  const path = join(SOURCES, name)
  const source = readFileSync(path, 'utf8')
  const { source: next, rewrites } = fixSpacing(source)

  if (fix && next !== source) writeFileSync(path, next, 'utf8')

  return rewrites.map((rewrite) => ({ file: name, from: rewrite.from, to: rewrite.to }))
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

/**
 * Blocks where an icon’s ruling does not apply, icon → block id → reason.
 *
 * The rulings themselves are shared, because "does this glyph run with the
 * reading direction" is a question about the glyph and has the same answer
 * in every codebase. This overlay is not shared, because it is a statement
 * about OUR components: an `ArrowRight` used as a trend indicator belongs
 * here rather than forcing the whole icon to be reclassified for everyone.
 *
 * Empty today. Kept because the day it stops being empty is the day
 * somebody would otherwise reclassify a shared ruling to fix one block.
 */
const EXCEPT: Record<string, Record<string, string>> = {}

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

      const rule = RULINGS[icon]
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
      if (EXCEPT[icon]?.[block]) continue

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
    const rule = RULINGS[icon]
    console.log(
      `  ${String(set.size).padStart(4)}  ${icon.padEnd(16)} ${rule?.ruling ?? 'NO RULING'}`,
    )
  }

  return problems
}

/* ══ PART THREE: POSITIONS AND MOVEMENT ══════════════════════════════════
 *
 * Padding became logical months ago and positioning did not, so the two
 * disagreed at every corner where they meet. The search field is the
 * clearest case and there were eleven of them: the input reserves room
 * with `ps-9` — the right in Arabic — while the magnifier sat at `left-3`,
 * on top of the first letters typed. Timelines were the other shape: a
 * list ruled with `border-s` and a dot pinned at `-left-[2.3rem]`, so in
 * RTL the rail is on one side and the dots float over the other.
 *
 * Seventy-five positions were ruled by hand on 2026-09-11. What came out:
 *
 *   - most follow the text — search icons, close buttons, badges, sticky
 *     first columns, drawers, switch knobs, the toast corner — and are now
 *     `start-` or `end-`;
 *   - a `left-0 right-0` pair is `inset-x-0`, which says "full width"
 *     without naming a side;
 *   - `left-1/2 -translate-x-1/2` stays, for the reason in the header;
 *   - a blurred glow stays where it is, per block below, because it is
 *     light rather than layout.
 *
 * Movement is the same question. `translate-x-*` is physical: a switch
 * knob that slides right to mean "on" slides out of its track in RTL,
 * where it starts at the right. So a horizontal translate must travel with
 * an `rtl:` counterpart in the same class string, unless it is ruled below.
 *
 * NOT covered: inline `style={{ left }}`. The one case in the catalog is
 * `selection-ai-toolbar`, which positions from `getBoundingClientRect()` —
 * a measured physical coordinate, correct as physical.
 */

const GLOW =
  'a blurred glow in a corner of the section. It is lighting, not layout: nothing reads from it, and moving it to the other corner would re-light the design for no reader.'

/** Physical classes that stay physical, block → exact token → why. */
const PHYSICAL: Record<string, Record<string, string>> = {
  'auth-signup-split': { '-right-16': GLOW },
  'bento-features': { '-right-12': GLOW },
  'cta-split-panel': { '-right-24': GLOW },
  'hero-app-download': { '-left-20': GLOW, 'right-0': GLOW },
  'hero-booking': { 'right-0': GLOW, 'left-1/4': GLOW },
  'hero-price-anchor': { 'left-1/3': GLOW, 'right-1/4': GLOW },
  'hero-split': { 'left-1/4': GLOW, 'right-1/5': GLOW },
  'hero-testimonial': { 'right-1/4': GLOW },
  'persona-cards': { '-right-12': GLOW },
  'community-band': {
    'group-hover:translate-x-0.5':
      'the up-and-out lean on an ArrowUpRight, which ICONS rules "keep". The glyph does not turn round, so its lean does not either.',
  },
  'selection-ai-toolbar': {
    '-translate-x-1/2':
      'centres the toolbar on an inline `left` measured from getBoundingClientRect(). Both halves are physical pixels, so the pair is right in either direction.',
  },
}

const POSITION = /^-?(?:left|right)-/
const SLIDE = /^-?translate-x-/

interface ClassToken {
  token: string
  prefix: string
  base: string
}

/**
 * Tokens of one string literal, template literals included.
 *
 * A backtick literal swallows the quoted strings inside its `${…}` — the
 * ternary halves of a class list — so the quotes and braces are separators
 * here. That is what lets `open ? 'translate-x-0' : 'translate-x-full'`
 * be seen at all.
 */
function classTokens(body: string): ClassToken[] {
  return body
    .split(/[\s'"`{}$]+/)
    .filter(Boolean)
    .map((token) => ({ token, ...splitVariants(token) }))
}

function auditPositions(): IconProblem[] {
  const problems: IconProblem[] = []
  const used = new Set<string>()
  let followed = 0
  let centred = 0
  let kept = 0

  for (const name of files) {
    const block = name.replace(/\.tsx$/, '')
    const code = maskComments(readFileSync(join(SOURCES, name), 'utf8'))
    const ruled = PHYSICAL[block] ?? {}

    for (const literal of stringLiterals(code)) {
      const tokens = classTokens(literal.body)
      const has = (base: string) => tokens.some((t) => t.base === base)
      const line = lineAt(code, literal.start)
      const problem = (token: string, message: string) =>
        problems.push({ block, line, icon: token, message })

      for (const { token, prefix, base } of tokens) {
        const isRtl = prefix.includes('rtl:')
        const isCentring =
          (base === 'left-1/2' && has('-translate-x-1/2')) ||
          (base === '-translate-x-1/2' && has('left-1/2'))

        if (POSITION.test(base)) {
          if (isCentring) centred++
          else if (ruled[token]) {
            kept++
            used.add(`${block} ${token}`)
          } else {
            problem(
              token,
              'physical position. Use start-/end- (a left-0 right-0 pair is inset-x-0), ' +
                'or add it to PHYSICAL with the reason it must not follow the text',
            )
          }
          continue
        }

        if (/^-?(?:start|end)-/.test(base) || base === 'inset-x-0') followed++

        if (!SLIDE.test(base) || isRtl || base === 'translate-x-0' || isCentring) continue
        const paired = tokens.some((t) => t.prefix.includes('rtl:') && SLIDE.test(t.base))
        if (paired) continue
        if (ruled[token]) {
          kept++
          used.add(`${block} ${token}`)
          continue
        }
        problem(
          token,
          'horizontal movement with no rtl: counterpart in the same class string. ' +
            'Add one (rtl:-translate-x-…), or rule it in PHYSICAL',
        )
      }
    }
  }

  // A ruling whose code has gone is a ruling waiting to excuse the wrong thing.
  for (const [block, tokens] of Object.entries(PHYSICAL)) {
    for (const token of Object.keys(tokens)) {
      if (used.has(`${block} ${token}`)) continue
      problems.push({
        block,
        line: 1,
        icon: token,
        message: 'PHYSICAL rules this token, but the block no longer uses it — delete the entry',
      })
    }
  }

  console.log(
    `\ncheck-rtl: positions — ${followed} follow the text, ${centred} centring ` +
      `idioms, ${kept} ruled physical${problems.length ? '' : ', none unruled'}.`,
  )
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
    console.log('never rewritten — it is ruled by hand in PART THREE.')
  }
}

const report = (label: string, found: IconProblem[], show: (token: string) => string) => {
  if (found.length === 0) return
  console.error(`\ncheck-rtl: ${found.length} ${label} ${found.length === 1 ? 'problem' : 'problems'}.\n`)
  for (const problem of found) {
    console.error(`  src/lib/blocks/sources/${problem.block}.tsx:${problem.line}  ${show(problem.icon)}`)
    console.error(`    ${problem.message}`)
  }
  process.exitCode = 1
}

report('icon', auditDirectionalIcons(), (icon) => `<${icon}>`)
report('position', auditPositions(), (token) => token)
