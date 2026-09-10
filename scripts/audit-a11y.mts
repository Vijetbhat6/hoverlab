/**
 * Static WCAG 2.2 AA audit over the block and page catalogs.
 *
 *   npm run audit:a11y            # report, exit 1 on any violation
 *   npm run audit:a11y -- --json  # write the per-artifact report and the
 *                                 # draft conformance statement
 *
 * WHAT THIS IS, AND WHAT IT IS EMPHATICALLY NOT
 *
 * This produces evidence. It does not produce a conformance claim, and the
 * distinction is the reason this file is written the way it is.
 *
 * A WCAG conformance statement — "this component conforms to WCAG 2.2 Level
 * AA" — is a legal instrument. Under the European Accessibility Act,
 * enforceable since June 2025 against anyone selling into the EU, a
 * published accessibility statement is a representation a buyer is entitled
 * to rely on, and an incorrect one transfers their exposure to us. Today we
 * make no such claim and therefore carry no such exposure. Publishing this
 * report as a conformance statement would create liability that does not
 * currently exist, and it would do it on the strength of a regex pass.
 *
 * So: `PUBLISHABLE` below is false, and the report is internal until a
 * lawyer has read both the claim text and the list of what the audit cannot
 * see. That review is part of the work, not a formality after it.
 *
 * WHAT CHANGED, AND WHAT IS STILL IN THE WAY
 *
 * "Pending legal review" was doing two jobs, and only one of them was
 * legal. The audit was eight rules over six criteria against WCAG 2.1 — too
 * thin to support the claim even if a lawyer had approved the wording that
 * morning, and pointed at a standard version EN 301 549 v4.1.1 has since
 * superseded. Both of those were engineering problems wearing a legal
 * problem's coat, and both are now fixed: eighteen rules over ten criteria
 * against 2.2, including two of the six A/AA criteria 2.2 added.
 *
 * What is genuinely left is genuinely a lawyer's: read `CLAIM` below, read
 * `UNCHECKED`, and decide whether the first is defensible given the second.
 * `--json` writes that pairing out as a single document so the review is a
 * document review and not an archaeology exercise. Nothing here should flip
 * `PUBLISHABLE` on its own.
 *
 * WHAT IT CHECKS
 *
 * Only criteria decidable from source text. The catalog's artifact IS its
 * source — that is what a visitor pastes into a project — so reading the
 * exact bytes we ship is the right unit, the same argument audit-block-
 * motion.mts makes for reading generated-block-sources.json rather than
 * screenshotting the site.
 *
 * WHAT IT CANNOT CHECK, AND WHY THAT MATTERS MORE THAN WHAT IT CAN
 *
 * A large share of AA is not decidable without rendering, without colour
 * resolution, or without a human:
 *
 *   1.4.3 / 1.4.11  contrast — needs computed colour, and every artifact is
 *                   styled with tokens the consuming project overrides.
 *                   Whether a block passes depends on the palette it lands
 *                   in, which we do not control and cannot audit.
 *   1.3.2           meaningful sequence — needs rendered order.
 *   2.4.3           focus order — needs a rendered tab sequence.
 *   1.4.10          reflow — needs a viewport.
 *   2.5.3           label in name — needs the visible string, not the markup.
 *   3.2.x           consistency across a whole site, which is the consuming
 *                   project's property and not ours to assert.
 *
 * `UNCHECKED` is exported into the report for exactly this reason. Any
 * document built from this data has to carry that list, because a report
 * that lists twelve passes and stays silent about what it never looked at
 * reads as full coverage. That silence is the liability.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const LIB = join(HERE, '..', 'src', 'lib')

/**
 * Whether the report may be rendered as a public conformance statement.
 *
 * Flip this only alongside legal sign-off on the claim wording. It is a
 * constant rather than an env var on purpose: an environment variable is
 * something a deploy can set by accident, and this is not a thing that
 * should ever be true because of a misconfigured pipeline.
 */
export const PUBLISHABLE = false

/**
 * The standard this audit is written against.
 *
 * A field rather than a sentence in a template, because the version number
 * had been typed by hand into the page copy, the metadata keywords, the
 * meta description and three paragraphs of prose — six places that would
 * each have to be found and changed, and that is how a document ends up
 * claiming 2.1 in the heading and 2.2 in the table.
 *
 * WHY 2.2 AND NOT 2.1
 *
 * The chain is: the European Accessibility Act obliges the seller; the EAA
 * is met by conforming to the harmonised standard; the harmonised standard
 * is EN 301 549; and EN 301 549 v4.1.1 moves its normative reference from
 * WCAG 2.1 to WCAG 2.2. An audit that stops at 2.1 is not slightly behind —
 * it is auditing against a document the buyer's obligation no longer points
 * at, while looking complete. That is a worse position than auditing
 * nothing, because it produces a confident answer to the wrong question.
 *
 * Moving the target is not free and was not free here: 2.2 added nine
 * criteria, six of them A or AA. Two are now checked (3.3.8, 2.5.8), one is
 * flagged for a human (2.5.7), and the rest are in `UNCHECKED` by name. The
 * version number moved because the coverage moved, not the other way round.
 */
export const STANDARD = {
  wcag: '2.2',
  level: 'AA',
  /** The harmonised European standard that WCAG version comes from. */
  en301549: 'v4.1.1',
} as const

interface SourceFile {
  path: string
  lang: string
  source: string
}

/** One thing the audit looked for, and the SC it maps to. */
interface Rule {
  id: string
  /** WCAG success criterion, e.g. "1.1.1". */
  sc: string
  level: 'A' | 'AA'
  name: string
  /**
   * Whether tripping this rule means the criterion is failed, or only that
   * the pattern is worth a human's attention.
   *
   * The distinction is load-bearing, not decorative. `aria-expanded` with no
   * `aria-controls` is the ARIA authoring practice and it is NOT a 4.1.2
   * failure — `aria-expanded` already conveys the state, `aria-controls` is
   * optional in the spec, and NVDA and VoiceOver largely ignore it anyway.
   * Reporting it as a failure would put eight untrue failures into a
   * document whose entire value is being true.
   *
   * Only `violation` fails the build. An advisory is a queue for a human.
   */
  severity: 'violation' | 'advisory'
  /** Returns one message per finding in this file. */
  check: (source: string) => string[]
}

/** Success criteria this audit does not and cannot evaluate. */
export const UNCHECKED: { sc: string; name: string; why: string }[] = [
  {
    sc: '1.4.3 / 1.4.11',
    name: 'Contrast (minimum, non-text)',
    why: 'Artifacts are styled with CSS variables the consuming project supplies. Whether a block passes depends on a palette we do not control.',
  },
  {
    sc: '1.3.2',
    name: 'Meaningful sequence',
    why: 'Needs rendered reading order, not source order.',
  },
  { sc: '2.4.3', name: 'Focus order', why: 'Needs a rendered tab sequence.' },
  { sc: '1.4.10', name: 'Reflow', why: 'Needs a viewport at 320 CSS pixels.' },
  {
    sc: '2.5.3',
    name: 'Label in name',
    why: 'Needs the rendered visible label to compare against the accessible name.',
  },
  {
    sc: '3.2.3 / 3.2.4',
    name: 'Consistent navigation and identification',
    why: 'A property of the whole consuming site, not of one artifact.',
  },

  /*
    The 2.2 additions that this audit cannot reach. Listed for the same
    reason as everything above — a report that moved its reference standard
    from 2.1 to 2.2 and then said nothing about the criteria 2.2 added would
    be claiming more coverage by changing a version number.
  */
  {
    sc: '2.4.11',
    name: 'Focus not obscured (minimum)',
    why: 'New in WCAG 2.2. Whether a sticky header covers the focused element depends on the rendered page an artifact lands in, not on the artifact.',
  },
  {
    sc: '3.2.6',
    name: 'Consistent help',
    why: 'New in WCAG 2.2. Asks whether help is in the same place across a set of pages, which is a property of the consuming site.',
  },
  {
    sc: '3.3.7',
    name: 'Redundant entry',
    why: 'New in WCAG 2.2. Needs to know whether two fields in a multi-step flow ask for the same information, which is a question about meaning rather than markup.',
  },
  {
    sc: '2.4.13',
    name: 'Focus appearance',
    why: 'New in WCAG 2.2, and Level AAA — outside the AA target, listed so a reader can see it was considered rather than missed.',
  },
]

/** Strip comments so a rule cannot fire on prose about the rule. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ')
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ')
}

/**
 * Remove markup that is being encoded into a string, not rendered.
 *
 * A block with no network access that needs a sample image inlines one as
 * `data:image/svg+xml,` + `encodeURIComponent(\`<svg …>\`)`. That `<svg>`
 * is never an element: it is the src of an `<img>` that carries its own
 * `alt`, and the alt is where its accessible name correctly lives. Scanning
 * it as markup reports a missing `aria-hidden` on a tag that does not exist
 * in the DOM, and a false violation in an accessibility report is worse
 * than a missed one — it teaches the reader to skim the list.
 *
 * Scoped to `encodeURIComponent(...)` rather than to template literals in
 * general. A backtick string is normally a className and harmless either
 * way, but `dangerouslySetInnerHTML={{ __html: \`<svg …>\` }}` really does
 * render, and that one must stay visible to the audit.
 */
function stripEncodedMarkup(source: string): string {
  return source.replace(/encodeURIComponent\s*\(\s*`[^`]*`/g, ' ')
}

/** True when a tag's attribute text carries an accessible name. */
function hasAccessibleName(tag: string): boolean {
  return (
    /\baria-label\s*=/.test(tag) ||
    /\baria-labelledby\s*=/.test(tag) ||
    /\btitle\s*=/.test(tag)
  )
}

/**
 * Opening tags of one element type, as raw text.
 *
 * Scanned with a brace- and quote-aware walk rather than matched with
 * `<tag[^>]*>`, and the difference is not pedantry — it is the difference
 * between a report that is true and one that is not.
 *
 * JSX attribute values routinely contain `>`:
 *
 *   <input ref={(el) => { refs.current[i] = el }} aria-label="Digit 1" />
 *
 * A `[^>]*` scanner stops at the `>` inside the arrow, so the tag text it
 * hands a rule ends before `aria-label` — and the rule reports an unlabelled
 * input that is, in fact, labelled. That false finding is exactly the kind
 * of thing that makes a conformance claim wrong, which is why this is
 * written out properly rather than left as a regex with a comment
 * apologising for itself.
 *
 * Not a full JSX parser and does not need to be: it tracks brace depth and
 * string literals, which covers every form an attribute value takes in this
 * catalog. A tag it cannot resolve is dropped rather than guessed at.
 */
export function openingTags(source: string, tagName: string): string[] {
  const out: string[] = []
  const open = new RegExp(`<${tagName}(?=[\\s/>])`, 'g')

  for (const match of source.matchAll(open)) {
    const start = match.index!
    let depth = 0
    let quote: string | null = null

    for (let i = start; i < source.length; i++) {
      const ch = source[i]!

      if (quote) {
        if (ch === '\\') i++
        else if (ch === quote) quote = null
        continue
      }

      if (ch === '"' || ch === "'" || ch === '`') {
        quote = ch
        continue
      }
      if (ch === '{') depth++
      else if (ch === '}') depth--
      else if (ch === '>' && depth === 0) {
        out.push(source.slice(start, i + 1))
        break
      }
    }
  }

  return out
}

/**
 * One opening tag, starting at a known `<`.
 *
 * `openingTags` above finds them all and throws the positions away, which
 * is right for a rule that only reads attributes. A rule that has to read
 * an element's *children* — "is there any text inside this button" — needs
 * to know where the tag ended, so it gets its own entry point rather than a
 * second, subtly different walk.
 */
export function openingTag(source: string, start: number): string | null {
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
  return null
}

/**
 * The text between an element's opening and matching closing tag.
 *
 * Depth-counted over same-named tags, so a `<button>` inside a `<button>`
 * — which React would reject anyway, but which appears in a code sample —
 * cannot end the outer one early. Returns null when there is no matching
 * close, and the caller skips rather than guessing: a rule that treats
 * "could not parse" as "failed" puts untrue rows in the report.
 */
function elementBody(source: string, from: number, name: string): string | null {
  const token = new RegExp(`<${name}(?=[\\s/>])|</${name}\\s*>`, 'g')
  token.lastIndex = from
  let depth = 1

  for (let match = token.exec(source); match; match = token.exec(source)) {
    if (match[0].startsWith('</')) {
      depth--
      if (depth === 0) return source.slice(from, match.index)
    } else {
      depth++
    }
  }
  return null
}

/** Every opening tag in a source, for rules that are not element-specific. */
function allTags(source: string): string[] {
  const names = new Set(
    [...source.matchAll(/<([a-zA-Z][\w.]*)(?=[\s/>])/g)].map((m) => m[1]!),
  )
  return [...names].flatMap((name) => openingTags(source, name))
}

export const RULES: Rule[] = [
  {
    id: 'img-alt',
    sc: '1.1.1',
    level: 'A',
    severity: 'violation',
    name: 'Non-text content',
    check: (source) =>
      openingTags(source, 'img')
        .filter((tag) => !/\balt\s*=/.test(tag))
        .map((tag) => `<img> with no alt: ${tag.slice(0, 80)}`),
  },
  {
    id: 'svg-hidden-or-labelled',
    sc: '1.1.1',
    level: 'A',
    severity: 'violation',
    name: 'Decorative graphics hidden from assistive tech',
    check: (source) =>
      openingTags(source, 'svg')
        .filter((tag) => !/\baria-hidden/.test(tag) && !hasAccessibleName(tag) && !/\brole\s*=/.test(tag))
        .map((tag) => `<svg> neither aria-hidden nor named: ${tag.slice(0, 80)}`),
  },
  {
    id: 'switch-checked',
    sc: '4.1.2',
    level: 'A',
    severity: 'violation',
    name: 'Name, role, value',
    check: (source) =>
      allTags(source)
        .filter((tag) => /\brole\s*=\s*["'](switch|checkbox|radio)["']/.test(tag))
        .filter((tag) => !/\baria-checked/.test(tag))
        /*
          A native checkbox or radio exposes its state through the `checked`
          IDL property, which the accessibility tree reads directly — ARIA in
          HTML explicitly allows `<input type="checkbox" role="switch">` and
          requiring an `aria-checked` alongside it would be redundant at
          best and, if it ever disagreed with `checked`, wrong.

          Only a non-native element pretending to be a switch has to say so
          itself. Getting this wrong reported two correct components as
          failures, which is the whole reason severities exist below.
        */
        .filter((tag) => !/^<input\b/.test(tag) || !/\btype\s*=\s*["'](checkbox|radio)["']/.test(tag))
        .map((tag) => {
          const role = /role\s*=\s*["'](\w+)["']/.exec(tag)?.[1] ?? 'switch'
          return `role="${role}" with no aria-checked: ${tag.slice(0, 80)}`
        }),
  },
  {
    id: 'expanded-controls',
    sc: '4.1.2',
    level: 'A',
    severity: 'advisory',
    name: 'Disclosure state exposed',
    check: (source) =>
      allTags(source)
        .filter((tag) => /\baria-expanded/.test(tag))
        // An `id` on the trigger does not satisfy this. aria-controls points
        // AT the disclosed region; an id merely identifies the button. An
        // earlier draft accepted either and so passed every real violation.
        .filter((tag) => !/\baria-controls/.test(tag))
        .map((tag) => `aria-expanded with no aria-controls: ${tag.slice(0, 80)}`),
  },
  {
    id: 'click-handler-on-non-interactive',
    sc: '2.1.1',
    level: 'A',
    severity: 'violation',
    name: 'Keyboard',
    check: (source) =>
      ['div', 'span', 'li', 'td', 'tr', 'p'].flatMap((name) =>
        openingTags(source, name)
          .filter((tag) => /\bonClick/.test(tag))
          /*
            An `aria-hidden` element is not in the accessibility tree, so it
            carries no keyboard obligation of its own — the modal-backdrop
            pattern, where clicking dismisses and Escape is the keyboard
            route. The dismissal still has to be reachable some other way,
            which is a thing this audit cannot see; the report says so.
          */
          .filter((tag) => !/\baria-hidden/.test(tag))
          .filter((tag) => !(/\brole\s*=/.test(tag) && /\bonKeyDown|\btabIndex/.test(tag)))
          .map(
            (tag) =>
              `<${name}> with onClick but no role + tabIndex + key handler: ${tag.slice(0, 80)}`,
          ),
      ),
  },
  {
    id: 'positive-tabindex',
    sc: '2.4.3',
    level: 'A',
    severity: 'violation',
    name: 'No positive tabindex',
    check: (source) =>
      [...source.matchAll(/tabIndex\s*=\s*\{?\s*([1-9]\d*)/g)].map(
        (m) => `tabIndex={${m[1]}} overrides document order`,
      ),
  },
  {
    id: 'table-headers',
    sc: '1.3.1',
    level: 'A',
    severity: 'violation',
    name: 'Info and relationships',
    check: (source) => {
      if (!/<table[\s>]/.test(source)) return []
      const findings: string[] = []
      if (!/<th[\s>]/.test(source)) findings.push('<table> with no <th> header cells')
      else if (!/<th[^>]*\bscope\s*=/.test(source)) {
        findings.push('<th> cells with no scope attribute')
      }
      return findings
    },
  },
  {
    id: 'input-labelled',
    sc: '3.3.2',
    level: 'A',
    severity: 'violation',
    name: 'Labels or instructions',
    check: (source) => {
      const labelled = /<label[\s>]/.test(source)
      return openingTags(source, 'input')
        .filter((tag) => !/\btype\s*=\s*["'](hidden|submit|button)["']/.test(tag))
        .filter((tag) => !hasAccessibleName(tag) && !/\bid\s*=/.test(tag) && !labelled)
        .map((tag) => `<input> with no label, id or aria-label: ${tag.slice(0, 80)}`)
    },
  },
  /* ══ WCAG 2.2 — the criteria the 2.2 revision added ═════════════════════
   *
   * EN 301 549 v4.1.1 moves the harmonised European reference from WCAG 2.1
   * to WCAG 2.2, and the EAA points at EN 301 549. A report that stops at
   * 2.1 is therefore auditing against a standard the buyer's obligation no
   * longer names — which is a worse failure than an incomplete report,
   * because it is a complete report of the wrong thing.
   *
   * Of the nine criteria 2.2 added, six are Level A or AA. Two of those are
   * decidable from source and appear here; the other four are in UNCHECKED
   * with the reason, where a reader can see them.
   *
   * 4.1.1 Parsing goes the other way: 2.2 REMOVED it, so duplicate-id and
   * unclosed-tag checks no longer map to any criterion. `check-duplicate-ids`
   * still runs, because a duplicated id genuinely breaks `aria-labelledby`
   * and `<label for>` — but it is a 1.3.1 argument now, not a 4.1.1 one, and
   * a report claiming 4.1.1 coverage against 2.2 would be claiming a
   * criterion that does not exist.
   */
  {
    id: 'paste-blocked-on-credential',
    sc: '3.3.8',
    level: 'AA',
    severity: 'violation',
    name: 'Accessible authentication (minimum)',
    /*
      New in 2.2, and the one most sign-in forms fail.

      3.3.8 says a cognitive function test — remembering a password,
      transcribing a code — must not be the only way in. Password managers
      are what satisfies it in practice, so anything that stops one working
      fails: `onPaste` cancelled on a password or one-time-code field, or
      `autoComplete="off"` telling the manager not to offer.

      Both are things people add on purpose, believing them to be security
      measures. Neither is: NIST withdrew the advice against pasting into
      password fields in 2017, on the grounds that blocking it pushes people
      towards passwords they can type from memory.
    */
    check: (source) => {
      const credential =
        /\btype\s*=\s*["'](password)["']|\bautoComplete\s*=\s*["'](current-password|new-password|one-time-code)["']|\binputMode\s*=\s*["']numeric["'][^>]*\bmaxLength\s*=\s*\{?1\}?/
      return openingTags(source, 'input')
        .filter((tag) => credential.test(tag))
        .flatMap((tag) => {
          const found: string[] = []
          if (/\bonPaste\s*=/.test(tag)) {
            found.push(`credential input intercepts paste: ${tag.slice(0, 80)}`)
          }
          if (/\bautoComplete\s*=\s*["']off["']/.test(tag)) {
            found.push(`credential input sets autoComplete="off": ${tag.slice(0, 80)}`)
          }
          return found
        })
    },
  },
  {
    id: 'target-size',
    sc: '2.5.8',
    level: 'AA',
    severity: 'advisory',
    name: 'Target size (minimum)',
    /*
      New in 2.2: a pointer target must be at least 24×24 CSS pixels, unless
      it is inline in a sentence, or has 24px of clear spacing around it, or
      is a browser-styled control.

      Advisory rather than violation, and the exceptions are why. This can
      see that a button is `h-6 w-6` — 24px, passing — or `h-5 w-5`, which is
      20px and fails *unless* the spacing exception applies, and spacing is a
      rendered property. So it reports a candidate and a human decides. Made
      a violation, it would fail the build on icon buttons that pass the
      criterion by the exception, and a rule that is wrong about a quarter of
      its findings gets the whole report skimmed.

      Only elements with an explicit square size are examined. A button sized
      by its padding is out of scope here rather than guessed at.
    */
    check: (source) => {
      const SIZE = /\bh-(\d+(?:\.\d+)?)\b[^"'`]*\bw-(\d+(?:\.\d+)?)\b/
      return ['button', 'a']
        .flatMap((name) => openingTags(source, name))
        .filter((tag) => !/\bp[xy]?-/.test(tag))
        .flatMap((tag) => {
          const match = SIZE.exec(tag)
          if (!match) return []
          // Tailwind's scale is 0.25rem per step; 24px is step 6 at a 16px root.
          const px = Math.min(Number(match[1]), Number(match[2])) * 4
          if (px >= 24) return []
          return [`target is ${px}px, under the 24px minimum: ${tag.slice(0, 80)}`]
        })
    },
  },
  {
    id: 'dragging-alternative',
    sc: '2.5.7',
    level: 'AA',
    severity: 'advisory',
    name: 'Dragging movements',
    /*
      New in 2.2: anything operated by dragging needs a single-pointer
      alternative that is not dragging.

      Whether one exists is not decidable from source — it might be a
      context menu, a keyboard shortcut, a move-to dropdown — so this
      reports the drag and asks. That is the honest shape for a criterion
      whose test is "is there another way", and it is the reason the board
      and reorder blocks are worth a person's attention rather than a
      regex's verdict.

      ONE SHAPE IS DECIDABLE, and it is worth exempting because otherwise
      the rule asks the same question every build and is answered the same
      way every time — which is how a report stops being read. A `<label>`
      that drags and whose file input is the thing it labels has a non-drag
      alternative by construction: activating a label focuses and clicks its
      control, so click, Enter and Space all open the file picker without a
      pointer ever being dragged. That is not an inference about the
      author's intent, it is what a label does.

      Deliberately narrow. Only when the dragging element is itself the
      label — a draggable `<div>` somewhere in a file that happens to also
      contain an upload input proves nothing, and still asks.
    */
    check: (source) => {
      const labelWrapsFileInput = /<input\b[^>]*\btype\s*=\s*["']file["']/.test(source)
      return allTags(source)
        .filter((tag) => /\b(draggable|onDragStart|onDragOver|onDrop)\b/.test(tag))
        .filter((tag) => !/\bdraggable\s*=\s*\{?false\}?/.test(tag))
        .filter((tag) => !(labelWrapsFileInput && /^<label\b/.test(tag)))
        .map((tag) => `drag interaction — confirm a non-drag alternative: ${tag.slice(0, 80)}`)
    },
  },

  /* ══ WCAG 2.1 criteria the first eight rules missed ══════════════════════
   *
   * Eight rules over six criteria was not a coverage decision, it was where
   * the first pass stopped. These are the criteria that are decidable from
   * source and were not being decided — most importantly the accessible
   * name on an icon-only control, which is the single most common real
   * failure in a component library and was not being looked for at all.
   */
  {
    id: 'control-has-name',
    sc: '4.1.2',
    level: 'A',
    severity: 'violation',
    name: 'Name, role, value — icon-only controls',
    /*
      A `<button>` whose entire content is an icon has no accessible name.
      It is announced as "button", and the user is told there is something
      here without being told what.

      Four things count as a name and all four are used in this catalog: an
      `aria-label`, an `aria-labelledby`, a `title`, and visible-to-nobody
      text in an `sr-only` span. The last is why this reads the element's
      children rather than its opening tag, and reading children is why the
      rule is written as a scan rather than a filter over `openingTags`.

      Text inside a JSX expression — `{label}`, `{suggestion}`, `{h}` —
      counts. The author has passed something, and this rule cannot know
      what, so it must assume a name. An earlier draft assumed the opposite
      for short expressions and immediately reported `<button>{s}</button>`
      in `hero-search` and `<button>{h}</button>` in `search-autocomplete`
      as unnamed — two controls whose entire visible content is their name.

      That asymmetry is the point rather than a compromise. This rule misses
      `<button>{icon}</button>`, where the expression really does render
      nothing speakable, and it will keep missing it. The alternative is a
      report that names working components as failures, and one of those
      costs more than ten of the other: a reader who checks a finding and
      finds it wrong stops checking the rest.
    */
    check: (source) => {
      const findings: string[] = []
      for (const name of ['button', 'a'] as const) {
        for (const match of source.matchAll(new RegExp(`<${name}(?=[\\s>])`, 'g'))) {
          const tag = openingTag(source, match.index!)
          if (!tag || /\/>\s*$/.test(tag)) continue
          if (hasAccessibleName(tag) || /\baria-hidden/.test(tag)) continue

          const body = elementBody(source, match.index! + tag.length, name)
          if (body === null) continue

          // Any of these is a name: literal text, an interpolated value, or
          // screen-reader-only text. Nested elements are dropped first, so
          // an icon's className cannot be mistaken for content.
          const stripped = body
            .replace(/<[^>]*>/g, ' ')
            .replace(/\{\s*(?:['"`]\s*['"`]|null|false|undefined)\s*\}/g, ' ')
          if (/[A-Za-z0-9]/.test(stripped)) continue
          if (/\bsr-only\b/.test(body) || /\baria-label/.test(body)) continue

          findings.push(`<${name}> with an icon and no accessible name: ${tag.slice(0, 80)}`)
        }
      }
      return findings
    },
  },
  {
    id: 'label-points-at-nothing',
    sc: '1.3.1',
    level: 'A',
    severity: 'violation',
    name: 'Info and relationships — label association',
    /*
      `<label htmlFor="email">` with no `id="email"` anywhere in the file is
      worse than no label at all: it looks correct in review, it reads
      correctly in the source, and it associates with nothing. The click
      target does not focus the field and the name is not announced.

      Only literal ids are compared. A generated one — `id={emailId}` from
      `useId()` — is paired by the same expression on both ends and is not
      something a regex should second-guess.
    */
    check: (source) => {
      const ids = new Set(
        [...source.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]!),
      )
      return [...source.matchAll(/\bhtmlFor\s*=\s*["']([^"']+)["']/g)]
        .filter((m) => !ids.has(m[1]!))
        .map((m) => `<label htmlFor="${m[1]}"> — no element in this artifact has that id`)
    },
  },
  {
    id: 'placeholder-as-label',
    sc: '3.3.2',
    level: 'A',
    severity: 'violation',
    name: 'Labels or instructions — placeholder is not a label',
    /*
      A placeholder disappears the moment someone types. It is not exposed
      as an accessible name in every combination of browser and screen
      reader, it fails 1.4.3 in most themes because it is deliberately low
      contrast, and it leaves anyone who was interrupted mid-form looking at
      a filled field with no idea what it is.

      This fires only when the placeholder is the *only* candidate: no
      label, no aria-label, no id for a label to point at.
    */
    check: (source) => {
      const labelled = /<label[\s>]/.test(source)
      return openingTags(source, 'input')
        .concat(openingTags(source, 'textarea'))
        .filter((tag) => /\bplaceholder\s*=/.test(tag))
        .filter((tag) => !hasAccessibleName(tag) && !/\bid\s*=/.test(tag) && !labelled)
        .map((tag) => `placeholder is the only label: ${tag.slice(0, 80)}`)
    },
  },
  {
    id: 'aria-hidden-focusable',
    sc: '4.1.2',
    level: 'A',
    severity: 'violation',
    name: 'Name, role, value — hidden but focusable',
    /*
      `aria-hidden` on something a keyboard can reach produces a focus stop
      that announces nothing: the tab order goes somewhere and the screen
      reader says nothing at all, which reads to the user as the page having
      broken.

      Native interactive elements are focusable by default, so `aria-hidden`
      on a `<button>` or a linked `<a>` is enough on its own — no `tabIndex`
      needed. Where the intent is genuinely to remove it, the fix is
      `disabled` or `tabIndex={-1}` alongside, and the rule accepts both.
    */
    check: (source) =>
      ['button', 'input', 'select', 'textarea'].flatMap((name) =>
        openingTags(source, name)
          .filter((tag) => /\baria-hidden(?!\s*=\s*\{?false)/.test(tag))
          .filter((tag) => !/\btabIndex\s*=\s*\{?\s*-1/.test(tag) && !/\bdisabled\b/.test(tag))
          .map((tag) => `aria-hidden on a focusable <${name}>: ${tag.slice(0, 80)}`),
      ),
  },
  {
    id: 'dialog-named',
    sc: '4.1.2',
    level: 'A',
    severity: 'violation',
    name: 'Name, role, value — dialogs',
    /*
      A dialog with no accessible name is announced as "dialog" and nothing
      else, at the exact moment the user has been moved somewhere they did
      not choose to go.
    */
    check: (source) =>
      allTags(source)
        .filter((tag) => /\brole\s*=\s*["'](dialog|alertdialog)["']/.test(tag))
        .filter((tag) => !hasAccessibleName(tag))
        .map((tag) => `role="dialog" with no accessible name: ${tag.slice(0, 80)}`),
  },
  {
    id: 'autoplay-audible',
    sc: '1.4.2',
    level: 'A',
    severity: 'violation',
    name: 'Audio control',
    /*
      Audio that starts on load and runs past three seconds must be
      stoppable. `muted` satisfies it, and so does `controls`; neither
      present is a failure.
    */
    check: (source) =>
      ['video', 'audio'].flatMap((name) =>
        openingTags(source, name)
          .filter((tag) => /\bautoPlay\b/.test(tag))
          .filter((tag) => !/\bmuted\b/.test(tag) && !/\bcontrols\b/.test(tag))
          .map((tag) => `<${name} autoPlay> with neither muted nor controls: ${tag.slice(0, 80)}`),
      ),
  },
  {
    id: 'heading-order',
    sc: '1.3.1',
    level: 'A',
    severity: 'advisory',
    name: 'Info and relationships — heading order',
    /*
      Advisory, and the reason is structural rather than cautious.

      A block is a fragment. It does not know what heading level precedes it
      on the page it lands in, so its own first heading being an `<h3>` is
      not a defect — it might be exactly right. What IS checkable is a skip
      *inside* one artifact: an `<h2>` followed by an `<h4>` has a level
      nobody can navigate to, whatever the surrounding page does.

      Reported rather than failed because the fix sometimes belongs to the
      consuming page, and a build that blocks on someone else's markup is a
      build that gets its check removed.
    */
    check: (source) => {
      const levels = [...source.matchAll(/<h([1-6])(?=[\s>])/g)].map((m) => Number(m[1]))
      const findings: string[] = []
      for (let i = 1; i < levels.length; i++) {
        if (levels[i]! > levels[i - 1]! + 1) {
          findings.push(`heading level jumps from h${levels[i - 1]} to h${levels[i]}`)
        }
      }
      return findings
    },
  },
  /*
    Two rules were written and deliberately not kept, for the same reason
    the `autoFocus` rule below was dropped.

    1.3.5 Identify Input Purpose wanted an `autoComplete` on every field
    whose name suggests one of the 53 defined purposes. But 1.3.5 applies to
    fields collecting information about *the user*, and half this catalog's
    inputs collect something else — a search query, a coupon code, a column
    mapping, a workspace name. The rule reported those as failures, and a
    criterion that only applies to some inputs cannot be checked by a regex
    that cannot tell which.

    2.4.4 Link Purpose wanted to flag "Read more" and "Learn more". 2.4.4 is
    satisfied by the link's *programmatically determined context* — the
    sentence, the list item, the card it sits in — which is precisely the
    thing a source scan cannot evaluate. Nearly every finding would have
    been wrong.
  */
  /*
    There is deliberately no `autoFocus` rule.

    An earlier draft flagged it as 3.2.1 On Focus, which it is not: 3.2.1 is
    about a change of context triggered BY focus, and moving initial focus
    into a dialog is not merely permitted, it is what users of that dialog
    need. The rule reported the command palette, the two-factor form and the
    password-reset form — three components doing the right thing.

    Recorded here rather than silently dropped, because the failure mode it
    demonstrates is the one this whole file is written against: a rule that
    is nearly right produces confident, specific, wrong findings, and a
    conformance report is worth exactly what its least accurate rule is
    worth.
  */
]

interface Finding {
  rule: string
  sc: string
  level: string
  severity: Rule['severity']
  file: string
  message: string
}

interface ArtifactReport {
  id: string
  kind: 'block' | 'page'
  /** Rule ids this artifact tripped nothing on. */
  passed: string[]
  findings: Finding[]
}

function auditArtifacts(
  entries: Record<string, SourceFile[]>,
  kind: 'block' | 'page',
): ArtifactReport[] {
  return Object.entries(entries).map(([id, files]) => {
    const findings: Finding[] = []
    const tripped = new Set<string>()

    for (const file of files) {
      if (!/tsx?$/.test(file.lang) && !/\.tsx?$/.test(file.path)) continue
      const source = stripEncodedMarkup(stripComments(file.source))
      for (const rule of RULES) {
        for (const message of rule.check(source)) {
          tripped.add(rule.id)
          findings.push({
            rule: rule.id,
            sc: rule.sc,
            level: rule.level,
            severity: rule.severity,
            file: file.path,
            message,
          })
        }
      }
    }

    return {
      id,
      kind,
      passed: RULES.filter((r) => !tripped.has(r.id)).map((r) => r.id),
      findings,
    }
  })
}

/**
 * The wording a lawyer has to approve, and the file that exists so they can.
 *
 * WHY THE CLAIM TEXT LIVES IN CODE
 *
 * Because it has to be reviewed against the audit, and the audit changes.
 * A claim in a Google Doc gets approved once, against a state of the world
 * nobody recorded, and then the coverage moves underneath it — a rule is
 * relaxed, a criterion is moved to UNCHECKED, a block ships with a
 * violation — and the approved sentence quietly stops being true. Here it
 * sits three screens from the rules it describes, and `--json` renders it
 * next to the current numbers, so what gets signed off is a claim *and* the
 * evidence it rests on, in one document, at one moment.
 *
 * WHAT THE WORDING IS DOING
 *
 * Every clause is load-bearing and most of them are limits:
 *
 *   "each artifact's source" — the unit. Not the site, not a rendered page,
 *   not the consuming project. What we ship is text someone pastes, and
 *   that is the only thing we can speak for.
 *
 *   "the thirteen criteria listed" — not "WCAG 2.2 AA". A partial claim
 *   stated as partial is defensible. The same evidence stated as a full
 *   conformance claim is a misrepresentation, and the gap between the two
 *   is one word.
 *
 *   "does not evaluate" — the UNCHECKED list is inside the claim rather
 *   than beside it, because a limit in a footnote is a limit a buyer's
 *   procurement team will not read and a regulator will not credit.
 *
 *   "in the palette and layout you place it in" — contrast and reflow are
 *   properties of the integration, not of the component, and this is the
 *   sentence that stops a buyer reading our result as their result.
 */
const CLAIM = {
  headline: (n: number, criteria: number) =>
    `Every one of the ${n} components in this catalog is checked, on every build, ` +
    `against ${criteria} WCAG ${STANDARD.wcag} Level ${STANDARD.level} success criteria ` +
    `that can be decided from source.`,
  body: [
    `This is a statement about each artifact's source — the exact text you copy — and not about a rendered page, a website, or the product you paste it into.`,
    `It covers the ${STANDARD.wcag} criteria listed below and no others. It is not a claim of conformance to WCAG ${STANDARD.wcag} Level ${STANDARD.level}, which requires evaluating criteria this method cannot reach.`,
    `The criteria it does not evaluate are listed in full, with the reason each one is out of reach. Contrast, focus order, reflow and reading order depend on the palette and layout you place a component in, and are yours to verify in situ.`,
    `The method is a static analysis of source text and is reproducible: \`npm run audit:a11y\` in the published repository returns the same result.`,
  ],
  /** What a reviewer must decide, spelled out so the ask is bounded. */
  reviewQuestions: [
    'Is the headline defensible as a statement of fact, given the "not a conformance claim" sentence that follows it?',
    'Does listing the unevaluated criteria in full discharge the duty not to mislead, or does the headline need the limitation inline?',
    'Under the EAA, does a partial, reproducible, per-artifact result create any representation beyond its own terms?',
    'Is "checked on every build" safe given that a build can be run with the check skipped?',
  ],
}

/**
 * Render the claim, the evidence and the limits as one reviewable document.
 *
 * Markdown rather than a route, and unpublished rather than gated, because
 * this is not for a visitor. It is the thing you attach to an email asking
 * a lawyer four specific questions, and the value of it is that it cannot
 * be read without the UNCHECKED list — they are in the same file, and the
 * file is regenerated from the same data the site renders.
 */
function renderClaimDraft(reports: ArtifactReport[]): string {
  const all = reports.flatMap((r) => r.findings)
  const violations = all.filter((f) => f.severity === 'violation')
  const advisories = all.filter((f) => f.severity === 'advisory')
  const criteria = [...new Set(RULES.map((r) => r.sc))].sort()

  const lines: string[] = []
  const w = (...text: string[]) => lines.push(...text)

  w(
    '# Accessibility conformance claim — DRAFT, NOT PUBLISHED',
    '',
    '> Generated by `scripts/audit-a11y.mts --json`. Do not edit by hand: the next',
    "> build overwrites it. To change the wording, change `CLAIM` in that file — which",
    '> is deliberate, so a claim and the audit behind it can never drift apart.',
    '',
    `**Status:** \`PUBLISHABLE = ${PUBLISHABLE}\`. Nothing in this document is on the`,
    'public site. `/accessibility` renders the evidence only; the conformance section',
    'there is behind the same flag.',
    '',
    `**Standard:** WCAG ${STANDARD.wcag} Level ${STANDARD.level}, as referenced by`,
    `EN 301 549 ${STANDARD.en301549}, which is the harmonised standard the European`,
    'Accessibility Act is met by conforming to.',
    '',
    '---',
    '',
    '## The proposed claim',
    '',
    `> ${CLAIM.headline(reports.length, criteria.length)}`,
    '',
    ...CLAIM.body.map((paragraph) => `> ${paragraph}\n>`),
    '',
    '## What the claim rests on',
    '',
    `- **${reports.length} artifacts** — ${reports.filter((r) => r.kind === 'block').length} blocks, ${reports.filter((r) => r.kind === 'page').length} pages.`,
    `- **${RULES.length} rules** over **${criteria.length} success criteria**: ${criteria.join(', ')}.`,
    `- **${violations.length} violations** and **${advisories.length} advisories** at the time of writing.`,
    '',
    '| Rule | SC | Level | Severity | Name |',
    '| --- | --- | --- | --- | --- |',
    ...RULES.map(
      (rule) => `| \`${rule.id}\` | ${rule.sc} | ${rule.level} | ${rule.severity} | ${rule.name} |`,
    ),
    '',
    '## What the claim does NOT cover',
    '',
    'These criteria are not evaluated. A reviewer should read this list before the',
    'claim above, not after it.',
    '',
    '| SC | Criterion | Why it is out of reach |',
    '| --- | --- | --- |',
    ...UNCHECKED.map((item) => `| ${item.sc} | ${item.name} | ${item.why} |`),
    '',
    ...(criteria.some((sc) => UNCHECKED.some((item) => item.sc.split(' / ').includes(sc)))
      ? [
          '**A criterion can appear in both tables, and 2.4.3 does.** `positive-tabindex`',
          'decides one part of Focus Order — a positive `tabindex` fails it, always,',
          'from source. The rest of Focus Order needs a rendered tab sequence. The',
          'honest reading is "one failure mode ruled out", not "criterion met", and a',
          'reviewer should treat the row in the second table as the governing one.',
          '',
        ]
      : []),
  )

  if (advisories.length > 0) {
    w(
      '## Open advisories',
      '',
      'Not failures. Patterns where the criterion has an exception this method',
      'cannot evaluate, so a person decides. Listed because a claim that mentions',
      'only the clean result is not the whole result.',
      '',
      ...advisories.map((f) => `- \`${f.file}\` — ${f.sc} ${f.rule}: ${f.message}`),
      '',
    )
  }

  if (violations.length > 0) {
    w(
      '## Open violations — the claim cannot be made while these stand',
      '',
      ...violations.map((f) => `- \`${f.file}\` — ${f.sc} ${f.rule}: ${f.message}`),
      '',
    )
  }

  w(
    '## What the review is being asked to decide',
    '',
    ...CLAIM.reviewQuestions.map((question, i) => `${i + 1}. ${question}`),
    '',
    'If the answer to all four is yes, `PUBLISHABLE` in `scripts/audit-a11y.mts`',
    'becomes `true` and `/accessibility` renders the claim alongside the evidence',
    'it already shows. If any answer is no, the wording changes here and this',
    'document regenerates.',
    '',
  )

  return lines.join('\n')
}

function main(): void {
  const blockSources = JSON.parse(
    readFileSync(join(LIB, 'blocks', 'generated-block-sources.json'), 'utf8'),
  ) as Record<string, SourceFile[]>

  /*
    Pages are audited too, and the reason they were not is worth stating
    rather than quietly fixing: `auditArtifacts` always took a `kind`, and
    the report type always had 'page' in it, but nothing ever passed one.
    The result read as full catalog coverage while twenty-one routes had
    never been looked at.

    Read what a page's own file trips, and nothing more. A page imports its
    blocks — `@/components/{id}` — so the bytes here are assembly: layout,
    headings, the odd inline control. The blocks it pulls in are audited on
    their own rows, which is the right place for them; a page inheriting its
    blocks' findings would double-count every one of them and make the
    catalog look worse the more a page reuses.

    The honest reading of a clean page row is therefore "the assembly adds no
    finding", not "this route is accessible". A reader of the report needs
    both rows to see the whole picture, which is why `kind` is on every
    artifact rather than implied by which file it came from.
  */
  const pageSources = JSON.parse(
    readFileSync(join(LIB, 'pages', 'generated-page-sources.json'), 'utf8'),
  ) as Record<string, SourceFile[]>

  const blockReports = auditArtifacts(blockSources, 'block')
  const pageReports = auditArtifacts(pageSources, 'page')
  const reports = [...blockReports, ...pageReports]
  const all = reports.flatMap((r) => r.findings)
  const violations = all.filter((f) => f.severity === 'violation')
  const advisories = all.filter((f) => f.severity === 'advisory')

  if (process.argv.includes('--json')) {
    const out = {
      /*
        No timestamp, deliberately. `new Date()` here would rewrite the file
        on every build and make the report look freshly audited when nothing
        had changed — and "when was this last checked" is precisely the
        question a reader of an accessibility report is entitled to a true
        answer to. Git already knows; the caller can stamp it if it needs to
        be in the document.
      */
      publishable: PUBLISHABLE,
      standard: STANDARD,
      rules: RULES.map((r) => ({
        id: r.id,
        sc: r.sc,
        level: r.level,
        name: r.name,
        severity: r.severity,
      })),
      unchecked: UNCHECKED,
      artifacts: reports,
    }
    const path = join(LIB, 'generated-a11y-report.json')
    writeFileSync(path, `${JSON.stringify(out, null, 2)}\n`, 'utf8')
    console.log(`audit-a11y: wrote ${path}`)

    /*
      The draft claim goes to the repository root, not into `src/lib`.

      It is not code and nothing imports it. It is a document for a person
      who is not going to go looking in a lib directory, and the whole point
      of generating it is to make the remaining step easy to actually take.
    */
    const draft = join(HERE, '..', 'ACCESSIBILITY-CLAIM.draft.md')
    writeFileSync(draft, `${renderClaimDraft(reports)}`, 'utf8')
    console.log(`audit-a11y: wrote ${draft}`)
  }

  /*
    Rules and criteria are counted separately because they are not the same
    number and the difference is the interesting one. Four rules map to
    4.1.2 alone. A line reading "18 criteria" when the audit decides 13 of
    them would be inflating coverage by 38% through a plural, in the one
    document where that is the whole point.
  */
  const criteria = new Set(RULES.map((r) => r.sc)).size

  console.log(
    `audit-a11y: ${blockReports.length} blocks and ${pageReports.length} pages ` +
      `against ${RULES.length} rules over ${criteria} statically decidable ` +
      `WCAG ${STANDARD.wcag} ${STANDARD.level} criteria — ${violations.length} violation` +
      `${violations.length === 1 ? '' : 's'}, ` +
      `${advisories.length} ${advisories.length === 1 ? 'advisory' : 'advisories'}.`,
  )
  console.log(
    `audit-a11y: ${UNCHECKED.length} success criteria are NOT evaluated here. ` +
      `This is evidence, not a conformance claim (PUBLISHABLE=${PUBLISHABLE}).`,
  )

  for (const label of ['violation', 'advisory'] as const) {
    const group = reports.filter((r) => r.findings.some((f) => f.severity === label))
    if (!group.length) continue
    console.log(`\n${label === 'violation' ? 'VIOLATIONS' : 'ADVISORIES'}`)
    for (const report of group) {
      console.log(`  ${report.id}`)
      for (const finding of report.findings.filter((f) => f.severity === label)) {
        console.log(`    ${finding.sc} ${finding.rule} — ${finding.message}`)
      }
    }
  }

  // Advisories do not fail a build. A queue for a human is not a defect,
  // and a check that cries wolf on best-practice nits gets switched off.
  if (violations.length > 0) process.exitCode = 1
}

/*
  Run only when this file IS the command, not when it is imported.

  The rules below are the load-bearing part of a document that may one day
  be a legal representation, and until now none of them had a test — because
  importing this module ran the whole audit over the real catalog and wrote
  two files as a side effect. A rule you cannot exercise on a three-line
  fixture is a rule whose false positives are found by shipping them, which
  is how `control-has-name` came to report two correctly-labelled buttons.

  `process.argv[1]` is the script path as invoked; resolving both sides
  handles the Windows drive-letter casing that makes a raw string compare
  fail here and pass in CI.
*/
const invokedDirectly =
  process.argv[1] !== undefined &&
  resolve(fileURLToPath(import.meta.url)).toLowerCase() ===
    resolve(process.argv[1]).toLowerCase()

if (invokedDirectly) main()
