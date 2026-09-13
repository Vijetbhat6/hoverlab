/**
 * Static WCAG 2.2 AA rules over component source text.
 *
 * WHERE THESE CAME FROM, AND WHY THEY MOVED
 *
 * These eighteen rules ran inside `scripts/audit-a11y.mts` for months,
 * against this project's own catalog, on every build. That is what makes
 * them worth shipping: each one has been run over 250 blocks and every
 * page source, and the ones that were nearly right were caught and either
 * fixed, demoted to an advisory, or deleted. The comments recording those
 * deletions are kept below on purpose — a rule that was written and thrown
 * away is the most useful thing in a file like this, because the next
 * person to think of it can see what it cost.
 *
 * They moved here so they could be pointed at somebody else's code. The
 * repo-side audit still imports them, so there is one set of rules and not
 * two drifting copies, and `src/lib/a11y-rules.test.ts` still pins their
 * behaviour with the cases the real catalog produced.
 *
 * WHAT THIS IS, AND WHAT IT IS EMPHATICALLY NOT
 *
 * This produces evidence. It does not produce a conformance claim, and the
 * distinction survives the move out of the repo intact — arguably it
 * matters more here, because a finding printed in someone else's terminal
 * is read as advice about their product.
 *
 * A WCAG conformance statement — "this component conforms to WCAG 2.2 Level
 * AA" — is a legal instrument. Under the European Accessibility Act,
 * enforceable since June 2025 against anyone selling into the EU, a
 * published accessibility statement is a representation a buyer is entitled
 * to rely on. Nothing a regex pass produces can support one. So the CLI
 * says "checked against N criteria that can be decided from source" and
 * carries `UNCHECKED` wherever it reports, because a list of passes that
 * stays silent about what was never looked at reads as full coverage, and
 * that silence is the actual liability.
 *
 * WHAT IT CANNOT CHECK, AND WHY THAT MATTERS MORE THAN WHAT IT CAN
 *
 * A large share of AA is not decidable without rendering, without colour
 * resolution, or without a human. `UNCHECKED` below is the list, with the
 * reason each one is out of reach, and it is exported rather than described
 * so that every surface which reports a pass can report the gap beside it.
 */

import {
  allTags,
  elementBody,
  hasAccessibleName,
  openingTag,
  openingTags,
} from './jsx.mjs'

/**
 * The standard these rules are written against.
 *
 * The chain is: the European Accessibility Act obliges the seller; the EAA
 * is met by conforming to the harmonised standard; the harmonised standard
 * is EN 301 549; and EN 301 549 v4.1.1 moves its normative reference from
 * WCAG 2.1 to WCAG 2.2. An audit that stops at 2.1 is not slightly behind —
 * it is auditing against a document the buyer's obligation no longer points
 * at, while looking complete. That is a worse position than auditing
 * nothing, because it produces a confident answer to the wrong question.
 *
 * Moving the target was not free: 2.2 added nine criteria, six of them A or
 * AA. Two are checked here (3.3.8, 2.5.8), one is flagged for a human
 * (2.5.7), and the rest are in `UNCHECKED` by name. The version number
 * moved because the coverage moved, not the other way round.
 *
 * @type {{ wcag: string, level: string, en301549: string }}
 */
export const STANDARD = {
  wcag: '2.2',
  level: 'AA',
  /** The harmonised European standard that WCAG version comes from. */
  en301549: 'v4.1.1',
}

/**
 * One thing the audit looks for, and the success criterion it maps to.
 *
 * `severity` is load-bearing, not decorative. `aria-expanded` with no
 * `aria-controls` is the ARIA authoring practice and it is NOT a 4.1.2
 * failure — `aria-expanded` already conveys the state, `aria-controls` is
 * optional in the spec, and NVDA and VoiceOver largely ignore it anyway.
 * Reporting it as a failure would put eight untrue failures into a document
 * whose entire value is being true. Only `violation` fails a run; an
 * advisory is a queue for a human.
 *
 * @typedef {object} Rule
 * @property {string} id
 * @property {string} sc WCAG success criterion, e.g. "1.1.1".
 * @property {'A' | 'AA'} level
 * @property {string} name
 * @property {'violation' | 'advisory'} severity
 * @property {(source: string) => string[]} check One message per finding.
 */

/**
 * Success criteria this audit does not and cannot evaluate.
 *
 * @type {{ sc: string, name: string, why: string }[]}
 */
export const UNCHECKED = [
  {
    sc: '1.4.3 / 1.4.11',
    name: 'Contrast (minimum, non-text)',
    why: 'Components are styled with CSS variables the consuming project supplies. Whether one passes depends on a palette this check does not control.',
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
    why: 'A property of the whole site, not of one component.',
  },

  /*
    The 2.2 additions these rules cannot reach. Listed for the same reason
    as everything above — a report that moved its reference standard from
    2.1 to 2.2 and then said nothing about the criteria 2.2 added would be
    claiming more coverage by changing a version number.
  */
  {
    sc: '2.4.11',
    name: 'Focus not obscured (minimum)',
    why: 'New in WCAG 2.2. Whether a sticky header covers the focused element depends on the rendered page a component lands in, not on the component.',
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

/** @type {Rule[]} */
export const RULES = [
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
          failures, which is the whole reason severities exist.
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
      const findings = []
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
   * unclosed-tag checks no longer map to any criterion. A duplicated id
   * genuinely breaks `aria-labelledby` and `<label for>` — but it is a
   * 1.3.1 argument now, not a 4.1.1 one, and a report claiming 4.1.1
   * coverage against 2.2 would be claiming a criterion that does not exist.
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
          const found = []
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
      a violation, it would fail a run on icon buttons that pass the
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
      whose test is "is there another way", and it is the reason board and
      reorder components are worth a person's attention rather than a
      regex's verdict.

      ONE SHAPE IS DECIDABLE, and it is worth exempting because otherwise
      the rule asks the same question every run and is answered the same way
      every time — which is how a report stops being read. A `<label>` that
      drags and whose file input is the thing it labels has a non-drag
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

      Four things count as a name and all four are common: an `aria-label`,
      an `aria-labelledby`, a `title`, and visible-to-nobody text in an
      `sr-only` span. The last is why this reads the element's children
      rather than its opening tag, and reading children is why the rule is
      written as a scan rather than a filter over `openingTags`.

      Text inside a JSX expression — `{label}`, `{suggestion}`, `{h}` —
      counts. The author has passed something, and this rule cannot know
      what, so it must assume a name. An earlier draft assumed the opposite
      for short expressions and immediately reported `<button>{s}</button>`
      and `<button>{h}</button>` — two controls whose entire visible content
      is their name.

      That asymmetry is the point rather than a compromise. This rule misses
      `<button>{icon}</button>`, where the expression really does render
      nothing speakable, and it will keep missing it. The alternative is a
      report that names working components as failures, and one of those
      costs more than ten of the other: a reader who checks a finding and
      finds it wrong stops checking the rest.
    */
    check: (source) => {
      const findings = []
      for (const name of ['button', 'a']) {
        for (const match of source.matchAll(new RegExp(`<${name}(?=[\\s>])`, 'g'))) {
          const tag = openingTag(source, match.index)
          if (!tag || /\/>\s*$/.test(tag)) continue
          if (hasAccessibleName(tag) || /\baria-hidden/.test(tag)) continue

          const body = elementBody(source, match.index + tag.length, name)
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
        [...source.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]),
      )
      return [...source.matchAll(/\bhtmlFor\s*=\s*["']([^"']+)["']/g)]
        .filter((m) => !ids.has(m[1]))
        .map((m) => `<label htmlFor="${m[1]}"> — no element in this file has that id`)
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

      A component is a fragment. It does not know what heading level
      precedes it on the page it lands in, so its own first heading being an
      `<h3>` is not a defect — it might be exactly right. What IS checkable
      is a skip *inside* one file: an `<h2>` followed by an `<h4>` has a
      level nobody can navigate to, whatever the surrounding page does.

      Reported rather than failed because the fix sometimes belongs to the
      consuming page, and a check that blocks on someone else's markup is a
      check that gets removed.
    */
    check: (source) => {
      const levels = [...source.matchAll(/<h([1-6])(?=[\s>])/g)].map((m) => Number(m[1]))
      const findings = []
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] > levels[i - 1] + 1) {
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
    fields collecting information about *the user*, and half of a typical
    catalog's inputs collect something else — a search query, a coupon code,
    a column mapping, a workspace name. The rule reported those as failures,
    and a criterion that only applies to some inputs cannot be checked by a
    regex that cannot tell which.

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
    need. The rule reported a command palette, a two-factor form and a
    password-reset form — three components doing the right thing.

    Recorded here rather than silently dropped, because the failure mode it
    demonstrates is the one this whole file is written against: a rule that
    is nearly right produces confident, specific, wrong findings, and a
    report is worth exactly what its least accurate rule is worth.
  */
]
