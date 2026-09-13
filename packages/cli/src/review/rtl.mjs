/**
 * Right-to-left defects: layout, glyphs and movement.
 *
 * WHY THIS MATTERS
 *
 * `pl-4` is "padding on the left", always, in every language. `ps-4` is
 * "padding at the start", which is the left in English and the right in
 * Arabic, Hebrew, Farsi and Urdu. A component written entirely in physical
 * properties cannot be used right-to-left at all: the labels sit on the
 * wrong side of their inputs, the chevrons point away from the thing they
 * open, and every gutter is mirrored.
 *
 * Tailwind has had the logical equivalents for years and they cost nothing
 * — `ps-4` compiles to `padding-inline-start`, supported since 2019. There
 * is no trade-off here, only a habit.
 *
 * THREE RULES, BECAUSE IT IS THREE DIFFERENT PROBLEMS
 *
 * They are separated because the confidence in each is different, and a
 * reviewer that presents a certainty and a judgement call in the same voice
 * gets both ignored.
 *
 *   1. SPACING is mechanical. Padding, margin, text alignment, floats,
 *      borders and corner radii have an unambiguous logical form. There is
 *      no judgement in it, so this rule ships a fix and `--fix` applies it.
 *
 *   2. GLYPHS are a meaning question. Logical properties mirror the
 *      *layout*; they do nothing to a picture. An `<ArrowRight />` beside a
 *      "Next" button still points right in Arabic, where next is to the
 *      left. But `CornerDownLeft` is the Return key — a picture of a
 *      physical object on a physical keyboard, and that keyboard does not
 *      rearrange itself for Arabic. So this rule carries a ledger of
 *      rulings with the reason for each, and asks about anything unruled
 *      rather than inferring a ruling from the name.
 *
 *   3. POSITION AND MOVEMENT are judgement calls with two known-safe
 *      exemptions. `left-1/2 -translate-x-1/2` is the centring idiom and
 *      rewriting half of it lands the element off-centre in exactly one
 *      direction; a blurred glow in a hero corner is lighting rather than
 *      layout and nothing reads from it. Everything else is reported for a
 *      person.
 *
 * The ledger in `ICONS` below is the part worth having. It was not derived
 * from a spec — each ruling was made call site by call site over a real
 * catalog, and the reasons are kept verbatim because the reason is the
 * useful part. A count of directional icons is a statistic about a queue;
 * a ruling with a reason is something someone can act on.
 */

import { lineAt, maskComments, openingTag, splitVariants, stringLiterals } from './jsx.mjs'

/* ══ ONE: SPACING ═════════════════════════════════════════════════════════ */

/**
 * Physical → logical, for the utilities where the mapping is unambiguous.
 *
 * Order matters: longer prefixes first, so `border-l-2` is not matched by
 * the `border-l` rule with the `-2` left dangling.
 */
const MAPPINGS = [
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

  // Floats and clears, which Tailwind v4 spells with the logical keywords.
  [/^float-left$/, 'float-start'],
  [/^float-right$/, 'float-end'],
  [/^clear-left$/, 'clear-start'],
  [/^clear-right$/, 'clear-end'],
]

/** The logical form of a class token, or null when there is no mapping. */
export function convertToken(token) {
  const { prefix, base } = splitVariants(token)

  for (const [pattern, replacement] of MAPPINGS) {
    if (pattern.test(base)) {
      return prefix + base.replace(pattern, replacement)
    }
  }
  return null
}

/**
 * Rewrite every physical spacing utility in a source to its logical form.
 *
 * Returns the new text and the list of rewrites, so a caller can report
 * what it did without diffing. Literals are found in the comment-masked
 * copy and applied to the real one — offsets line up because `maskComments`
 * replaces character-for-character, and that is the whole reason it exists.
 *
 * @returns {{ source: string, rewrites: { from: string, to: string, line: number }[] }}
 */
export function fixSpacing(source) {
  const masked = maskComments(source)
  const rewrites = []
  let out = ''
  let cursor = 0

  for (const literal of stringLiterals(masked)) {
    const body = source.slice(literal.start + 1, literal.end - 1)

    // Only strings that could be class lists. A string with no lowercase
    // letter cannot contain a utility.
    if (!/[a-z]/.test(body)) continue

    let changed = false
    const tokens = body.split(/(\s+)/).map((token) => {
      if (!token.trim()) return token
      const converted = convertToken(token)
      if (!converted) return token
      changed = true
      rewrites.push({ from: token, to: converted, line: lineAt(source, literal.start) })
      return converted
    })

    if (!changed) continue
    out += source.slice(cursor, literal.start) + literal.quote + tokens.join('') + literal.quote
    cursor = literal.end
  }

  return { source: out + source.slice(cursor), rewrites }
}

/** @returns {object[]} */
export function reviewRtlSpacing(source) {
  const { rewrites } = fixSpacing(source)

  return rewrites.map(({ from, to, line }) => ({
    rule: 'physical-spacing-utility',
    family: 'rtl',
    sc: '1.3.2',
    severity: 'advisory',
    line,
    message: `${from} is physical — it stays on the left in Arabic, Hebrew, Farsi and Urdu`,
    fix: `Use ${to}, which resolves to the reading direction. No behaviour changes left-to-right.`,
    edit: { from, to },
  }))
}

/* ══ TWO: GLYPHS ══════════════════════════════════════════════════════════ */

/**
 * The adjudication.
 *
 * Keyed by icon rather than by call site because each of these is used in
 * exactly one sense in practice. The reasons are load-bearing: a reviewer
 * that says "mirror this" without saying why is asking to be obeyed, and
 * the whole point of a ledger is that the next person can disagree with a
 * ruling on its merits.
 *
 * @type {Record<string, { ruling: 'mirror' | 'keep' | 'symmetric', why: string }>}
 */
export const ICONS = {
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
export const MIRROR_CLASS = /\brtl:(?:-?rotate-|-?scale-x-|-scale-)/

/**
 * Whether an icon name looks directional enough to demand a ruling.
 *
 * Deliberately broader than `ICONS`, because its job is to catch the icon
 * nobody has thought about yet. Matched on camel-case words rather than as
 * a substring, so `Copyright` and `Highlighter` do not trip on "right".
 *
 * This breadth earned its keep once already: an earlier detector knew nine
 * icon names and the catalog had grown six it had never heard of, so the
 * honest count was never the one it reported.
 */
const DIRECTIONAL_WORDS = new Set([
  'Left', 'Right', 'Forward', 'Backward', 'Rewind', 'Undo', 'Redo', 'Reply',
  'Indent', 'Outdent', 'Send', 'Play', 'Skip', 'Next', 'Previous', 'Corner',
  'Move', 'External',
])

const DIRECTIONAL_NAMES = new Set(['LogIn', 'LogOut', 'Import', 'Export'])

export function looksDirectional(name) {
  if (DIRECTIONAL_NAMES.has(name)) return true
  return (name.match(/[A-Z][a-z]*/g) ?? []).some((word) => DIRECTIONAL_WORDS.has(word))
}

/**
 * Icon components imported in a source, by name.
 *
 * Read from the import statements rather than from the JSX, so a bare word
 * in prose cannot be mistaken for a component. Any named import counts —
 * the icon set is not assumed to be lucide, because the mirroring question
 * is the same whichever set draws the arrow.
 */
function importedComponents(source) {
  const names = new Set()
  for (const match of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"][^'"]+['"]/g)) {
    for (const part of match[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop()?.trim()
      if (name && /^[A-Z]/.test(name)) names.add(name)
    }
  }
  return [...names]
}

/** @returns {object[]} */
export function reviewRtlIcons(source) {
  const code = maskComments(source)
  const findings = []

  for (const icon of importedComponents(code)) {
    if (!looksDirectional(icon)) continue
    const rule = ICONS[icon]

    for (const match of code.matchAll(new RegExp(`<${icon}(?=[\\s/>])`, 'g'))) {
      const tag = openingTag(code, match.index)
      if (tag === null) continue
      const mirrored = MIRROR_CLASS.test(tag)
      const line = lineAt(code, match.index)

      if (!rule) {
        findings.push({
          rule: 'directional-icon-unruled',
          family: 'rtl',
          sc: '1.3.2',
          severity: 'advisory',
          line,
          message: `<${icon}> looks directional and has no ruling`,
          fix:
            'Decide whether this glyph runs with the reading direction or depicts a ' +
            'physical object, then add rtl:rotate-180 or leave it — but decide it, do ' +
            'not infer it from the name. A Return-key glyph and a "next" chevron both ' +
            'point left and want opposite answers.',
        })
        continue
      }

      if (rule.ruling === 'mirror' && !mirrored) {
        findings.push({
          rule: 'directional-icon-not-mirrored',
          family: 'rtl',
          sc: '1.3.2',
          severity: 'advisory',
          line,
          message: `<${icon}> points the wrong way in RTL — ${rule.why}`,
          fix:
            'Add rtl:rotate-180. Where the element already rotates to show an open ' +
            'state, put the RTL class on the CLOSED state only — two rotate utilities ' +
            'on one element fight, and Tailwind v4 resolves that by source order, ' +
            'which is an accident rather than a decision.',
        })
      }

      if (rule.ruling !== 'mirror' && mirrored) {
        findings.push({
          rule: 'directional-icon-wrongly-mirrored',
          family: 'rtl',
          sc: '1.3.2',
          severity: 'advisory',
          line,
          message: `<${icon}> is mirrored but should not be — ${rule.why}`,
          fix: 'Remove the rtl: class from this call site.',
        })
      }
    }
  }

  return findings
}

/* ══ THREE: POSITION AND MOVEMENT ═════════════════════════════════════════ */

/**
 * Padding usually goes logical long before positioning does, and then the
 * two disagree at every corner where they meet. The search field is the
 * clearest case: the input reserves room with `ps-9` — the right in Arabic
 * — while the magnifier sits at `left-3`, on top of the first letters
 * typed. Timelines are the other shape: a list ruled with `border-s` and a
 * dot pinned at `-left-[2.3rem]`, so in RTL the rail is on one side and the
 * dots float over the other.
 *
 * NOT covered: inline `style={{ left }}`. A coordinate measured from
 * `getBoundingClientRect()` is a physical pixel and is correct as physical.
 */
const POSITION = /^-?(?:left|right)-/
const SLIDE = /^-?translate-x-/

/** Tokens of one string literal, template-literal interpolations included. */
function classTokens(body) {
  return body
    .split(/[\s'"`{}$]+/)
    .filter(Boolean)
    .map((token) => ({ token, ...splitVariants(token) }))
}

/** @returns {object[]} */
export function reviewRtlPositions(source) {
  const masked = maskComments(source)
  const findings = []

  for (const literal of stringLiterals(masked)) {
    const tokens = classTokens(literal.body)
    if (tokens.length === 0) continue

    const bases = new Set(tokens.map((t) => t.base))
    const line = lineAt(source, literal.start)

    /*
      The centring idiom, exempt. `left-1/2 -translate-x-1/2` centres an
      element; rewriting `left-1/2` to `start-1/2` sets inset-inline-start,
      which in RTL resolves to `right: 50%` while `-translate-x-1/2` still
      moves left — so the element lands off-centre in exactly one direction.
      Both halves are physical and the pair is right either way.
    */
    const centring =
      (bases.has('left-1/2') || bases.has('right-1/2')) &&
      [...bases].some((b) => /^-?translate-x-1\/2$/.test(b))

    const fullWidth = bases.has('left-0') && bases.has('right-0')

    for (const { token, prefix, base } of tokens) {
      if (POSITION.test(base)) {
        if (centring) continue

        if (fullWidth) {
          // Only report once, on the `left-0`, or the pair produces two
          // findings for one edit.
          if (base !== 'left-0') continue
          findings.push({
            rule: 'physical-position',
            family: 'rtl',
            sc: '1.3.2',
            severity: 'advisory',
            line,
            message: 'left-0 right-0 names both sides to mean "full width"',
            fix: `Use ${prefix}inset-x-0, which says full width without naming a side.`,
            edit: { from: 'left-0 right-0', to: `${prefix}inset-x-0` },
          })
          continue
        }

        const logical = token.replace(/left-/, 'start-').replace(/right-/, 'end-')
        findings.push({
          rule: 'physical-position',
          family: 'rtl',
          sc: '1.3.2',
          severity: 'advisory',
          line,
          message: `${token} pins this to a physical side, so it will not follow the text`,
          fix:
            `If it follows the text — a search icon, a close button, a badge, a drawer, ` +
            `a sticky first column — use ${logical}. If it is lighting rather than ` +
            `layout, like a blurred glow in a corner, physical is correct: nothing reads ` +
            `from it, and moving it would re-light the design for no reader.`,
        })
      }

      if (SLIDE.test(base)) {
        // A horizontal translate must travel with an `rtl:` counterpart in
        // the same class string. A switch knob that slides right to mean
        // "on" slides out of its track in RTL, where it starts at the right.
        if (prefix.includes('rtl:')) continue
        const hasCounterpart = tokens.some(
          (t) => t.prefix.includes('rtl:') && SLIDE.test(t.base),
        )
        if (hasCounterpart) continue
        if (centring) continue

        findings.push({
          rule: 'physical-movement',
          family: 'rtl',
          sc: '1.3.2',
          severity: 'advisory',
          line,
          message: `${token} moves right in every language`,
          fix:
            'Add an rtl: counterpart in the same class string. `translate` is its own ' +
            'CSS property applied in the unmirrored outer space, so it does not come ' +
            'along with a logical layout the way padding does.',
        })
      }
    }
  }

  return findings
}

/** Every RTL finding for one source. */
export function reviewRtl(source) {
  return [
    ...reviewRtlSpacing(source),
    ...reviewRtlIcons(source),
    ...reviewRtlPositions(source),
  ]
}
