/**
 * Tests for the review engine.
 *
 * The cases are chosen on one principle, inherited from the audit these
 * rules grew out of: a rule that is nearly right produces confident,
 * specific, wrong findings, and one wrong finding teaches a reader to
 * distrust the other forty. So the negative cases — what must NOT be
 * reported — outnumber the positive ones, deliberately, and most of them
 * are mistakes an earlier draft of one of these rules actually made.
 *
 * The `a11y` rules themselves are pinned by `src/lib/a11y-rules.test.ts`
 * back in the repo, against the catalog that shook them out. What is tested
 * here is everything that is new in this package: the offset-preserving
 * masking the line numbers depend on, the three RTL rules, the hand-rolled
 * nesting walk that replaces a TypeScript parser, and the diff window.
 */

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { classesOfTag, reviewOverflow, walkElements } from '../src/review/overflow.mjs'
import { convertToken, fixSpacing, reviewRtlIcons, reviewRtlPositions } from '../src/review/rtl.mjs'
import { reviewMotion } from '../src/review/motion.mjs'
import { reviewSource, fixSource, violations } from '../src/review/index.mjs'
import { touchedByDiff, CONTEXT_LINES } from '../src/review/git.mjs'
import { maskComments, openingTags } from '../src/review/jsx.mjs'

/** Rule ids reported for a source, as plain strings. */
function rules(source, path = 'a.tsx') {
  return reviewSource({ path, source }).map((f) => f.rule)
}

/* ------------------------------------------------------------------ *
 *  Masking — what every line number rests on
 * ------------------------------------------------------------------ */

describe('comment masking', () => {
  test('preserves offsets, so a finding can carry a line', () => {
    const source = '/* one\n   two */\nconst x = 1\n'
    const masked = maskComments(source)
    assert.equal(masked.length, source.length)
    assert.equal(masked.indexOf('const'), source.indexOf('const'))
  })

  test('survives an apostrophe in prose, which once silently ate half a file', () => {
    /*
      A string scanner starts a string at the first quote it meets, and an
      apostrophe in "reader's" is a quote. Before masking, everything after
      this comment was read one quote out of phase — code as string, string
      as code — and every className below it was invisible. The failure was
      silent AND partial, which is why it survived a green run.
    */
    const source = [
      "// a screen reader's table commands",
      'const cls = "pl-4"',
    ].join('\n')

    const { rewrites } = fixSpacing(source)
    assert.deepEqual(
      rewrites.map((r) => `${r.from}->${r.to}`),
      ['pl-4->ps-4'],
    )
  })

  test('does not fire a rule on prose describing the rule', () => {
    const source = '/* Never write <img> with no alt attribute. */\nexport const x = 1\n'
    assert.deepEqual(rules(source), [])
  })

  test('leaves a URL alone rather than reading // as a comment', () => {
    const source = 'const href = "https://example.com/a"\nconst cls = "pl-4"\n'
    const { rewrites } = fixSpacing(source)
    assert.equal(rewrites.length, 1)
  })
})

/* ------------------------------------------------------------------ *
 *  Tag reading
 * ------------------------------------------------------------------ */

describe('opening tags', () => {
  test('reads past a > inside an attribute expression', () => {
    // The canonical false finding: a `[^>]*` scanner stops at the arrow's
    // `>` and reports this labelled input as unlabelled.
    const source = '<input ref={(el) => { refs.current[i] = el }} aria-label="Digit 1" />'
    const [tag] = openingTags(source, 'input')
    assert.match(tag, /aria-label="Digit 1"/)
    assert.deepEqual(rules(source), [])
  })

  test('drops a tag it cannot resolve rather than guessing', () => {
    assert.deepEqual(openingTags('<input aria-label="unclosed', 'input'), [])
  })
})

/* ------------------------------------------------------------------ *
 *  RTL — spacing
 * ------------------------------------------------------------------ */

describe('physical spacing', () => {
  test('maps the unambiguous utilities', () => {
    assert.equal(convertToken('pl-4'), 'ps-4')
    assert.equal(convertToken('-mr-2'), '-me-2')
    assert.equal(convertToken('text-right'), 'text-end')
    assert.equal(convertToken('rounded-tl-lg'), 'rounded-ss-lg')
    assert.equal(convertToken('float-left'), 'float-start')
  })

  test('keeps variant prefixes in front of the rewritten base', () => {
    assert.equal(convertToken('md:hover:pl-4'), 'md:hover:ps-4')
  })

  test('does not match a longer utility with the shorter rule', () => {
    // `border-l-2` must not become `border-s` with a dangling `-2`.
    assert.equal(convertToken('border-l-2'), 'border-s-2')
  })

  test('leaves utilities with no logical form alone', () => {
    for (const token of ['left-4', 'translate-x-2', 'pt-4', 'flex', 'text-sm']) {
      assert.equal(convertToken(token), null, token)
    }
  })

  test('rewrites only the tokens it recognises, in place', () => {
    const source = 'const cls = "flex pl-4 items-center text-left"\n'
    const { source: fixed } = fixSpacing(source)
    assert.equal(fixed, 'const cls = "flex ps-4 items-center text-start"\n')
  })

  test('is a no-op on a file with nothing to rewrite', () => {
    const source = 'const cls = "flex items-center ps-4"\n'
    assert.equal(fixSpacing(source).source, source)
  })

  test('fixSource refuses a file it does not review', () => {
    const file = { path: 'a.css', source: '.x { }' }
    assert.deepEqual(fixSource(file).rewrites, [])
  })
})

/* ------------------------------------------------------------------ *
 *  RTL — glyphs
 * ------------------------------------------------------------------ */

describe('directional icons', () => {
  const importing = (name, jsx) =>
    `import { ${name} } from 'lucide-react'\nexport const X = () => (${jsx})\n`

  test('reports a mirror-ruled icon with no rtl class', () => {
    const found = reviewRtlIcons(importing('ArrowRight', '<ArrowRight className="h-4" />'))
    assert.deepEqual(found.map((f) => f.rule), ['directional-icon-not-mirrored'])
    // The ruling's reason travels with the finding — that is the point of
    // keeping a ledger rather than a count.
    assert.match(found[0].message, /runs with the text/)
  })

  test('accepts one that carries the class', () => {
    const source = importing('ArrowRight', '<ArrowRight className="rtl:rotate-180" />')
    assert.deepEqual(reviewRtlIcons(source), [])
  })

  test('reports a keep-ruled icon that IS mirrored', () => {
    // The Return key. Mirroring it draws a key no keyboard has.
    const source = importing('CornerDownLeft', '<CornerDownLeft className="rtl:rotate-180" />')
    assert.deepEqual(
      reviewRtlIcons(source).map((f) => f.rule),
      ['directional-icon-wrongly-mirrored'],
    )
  })

  test('says nothing about a symmetric glyph either way', () => {
    assert.deepEqual(reviewRtlIcons(importing('ArrowLeftRight', '<ArrowLeftRight />')), [])
  })

  test('asks about a directional icon nobody has ruled on', () => {
    // The example has to be a glyph ICONS does NOT rule, which makes this
    // test quietly self-destructing: it used SkipForward until the voice
    // player shipped and that icon was ruled, at which point the assertion
    // failed for the best possible reason. Rewind is unruled today; if this
    // breaks again, the fix is a new unruled name here, not a ruling removed
    // from the ledger to keep a test green.
    const source = importing('Rewind', '<Rewind />')
    assert.deepEqual(
      reviewRtlIcons(source).map((f) => f.rule),
      ['directional-icon-unruled'],
    )
  })

  test('does not trip on a name that merely contains "right"', () => {
    // Matched on camel-case words, so Copyright and Highlighter are safe.
    for (const name of ['Copyright', 'Highlighter', 'Bright']) {
      assert.deepEqual(reviewRtlIcons(importing(name, `<${name} />`)), [], name)
    }
  })

  test('ignores an icon named only in a comment', () => {
    const source = "import { Star } from 'lucide-react'\n// ArrowRight would be wrong here\n"
    assert.deepEqual(reviewRtlIcons(source), [])
  })
})

/* ------------------------------------------------------------------ *
 *  RTL — position and movement
 * ------------------------------------------------------------------ */

describe('physical positions', () => {
  test('reports a side-pinned element', () => {
    const found = reviewRtlPositions('const c = "absolute left-3 top-2"')
    assert.deepEqual(found.map((f) => f.rule), ['physical-position'])
    assert.match(found[0].fix, /start-3/)
  })

  test('exempts the centring idiom, which breaks if half of it is rewritten', () => {
    /*
      `start-1/2` resolves to `right: 50%` in RTL while `-translate-x-1/2`
      still moves left, so the element lands off-centre in exactly one
      direction. Both halves are physical and the pair is correct.
    */
    assert.deepEqual(reviewRtlPositions('const c = "absolute left-1/2 -translate-x-1/2"'), [])
  })

  test('folds a left-0 right-0 pair into one inset-x-0 finding', () => {
    const found = reviewRtlPositions('const c = "absolute left-0 right-0"')
    assert.equal(found.length, 1)
    assert.match(found[0].fix, /inset-x-0/)
  })

  test('reports a horizontal translate with no rtl counterpart', () => {
    const found = reviewRtlPositions('const c = "translate-x-5 transition"')
    assert.deepEqual(found.map((f) => f.rule), ['physical-movement'])
  })

  test('accepts a translate that travels with one', () => {
    assert.deepEqual(
      reviewRtlPositions('const c = "translate-x-5 rtl:-translate-x-5"'),
      [],
    )
  })

  test('sees both halves of a ternary inside a template literal', () => {
    // The quotes and braces are separators, which is what makes the
    // un-interpolated halves visible at all.
    const source = 'const c = `${open ? "translate-x-0" : "translate-x-full"} absolute`'
    assert.equal(reviewRtlPositions(source).length, 2)
  })
})

/* ------------------------------------------------------------------ *
 *  Motion
 * ------------------------------------------------------------------ */

describe('unguarded animation', () => {
  test('reports an infinite utility with no handling', () => {
    assert.deepEqual(
      reviewMotion('<div className="animate-spin" />').map((f) => f.rule),
      ['unguarded-infinite-animation'],
    )
  })

  test('accepts either form of handling, and a hand-written media query', () => {
    for (const source of [
      '<div className="motion-safe:animate-spin" />',
      '<div className="animate-spin motion-reduce:[animation-duration:2s]" />',
      '<div className="animate-spin" /> /* @media (prefers-reduced-motion) */',
    ]) {
      assert.deepEqual(reviewMotion(source), [], source)
    }
  })

  test('says nothing about an arbitrary animation that runs once', () => {
    assert.deepEqual(reviewMotion('<div className="animate-[fade_1s_ease]" />'), [])
  })

  test('reports an arbitrary one that does not', () => {
    assert.equal(reviewMotion('<div className="animate-[fade_1s_infinite]" />').length, 1)
  })

  test('reports one decision per utility, not one per occurrence', () => {
    // Five pulsing skeleton bars are one decision. Five findings would be
    // a report nobody finishes reading.
    const source = '<div className="animate-pulse" /><div className="animate-pulse" />'
    assert.equal(reviewMotion(source).length, 1)
  })
})

/* ------------------------------------------------------------------ *
 *  Overflow — the hand-rolled nesting walk
 * ------------------------------------------------------------------ */

describe('class extraction', () => {
  test('reads a plain string attribute', () => {
    assert.equal(classesOfTag('<div className="a b">'), 'a b')
  })

  test('reads every literal inside an expression', () => {
    assert.equal(classesOfTag('<div className={cn("a", open && "b")}>'), 'a b')
  })

  test('reads a template literal without reading the interpolation as a class', () => {
    // A regex scanning for quoted strings meets the backtick first and hands
    // back `a ${x} b` — with the variable name sitting in the result as
    // though it were a utility. A wrapper named `relative` would then
    // silently suppress a finding.
    assert.equal(classesOfTag('<div className={`a ${x} b`}>'), 'a b')
  })

  test('reads literals nested inside an interpolation', () => {
    assert.equal(
      classesOfTag('<div className={`${open ? "relative" : ""} overflow-x-auto`}>'),
      'relative overflow-x-auto',
    )
  })

  test('returns empty when there is no className', () => {
    assert.equal(classesOfTag('<div id="x">'), '')
  })
})

describe('element nesting', () => {
  test('tracks ancestors', () => {
    const [, inner] = walkElements('<div className="a"><span className="b" /></div>')
    assert.equal(inner.name, 'span')
    assert.deepEqual(inner.ancestors.map((a) => a.name), ['div'])
  })

  test('does not treat a self-closing tag as a parent', () => {
    const [, second] = walkElements('<img /><span />')
    assert.deepEqual(second.ancestors, [])
  })

  test('unwinds to the nearest matching frame on a stray close', () => {
    const elements = walkElements('<div><span></div><b className="x" />')
    const b = elements.find((e) => e.name === 'b')
    assert.deepEqual(b.ancestors.map((a) => a.name), [])
  })
})

describe('boxes escaping a scroller', () => {
  const scroller = (wrapper, inner) =>
    `<div className="${wrapper}"><table><tr><td>${inner}</td></tr></table></div>`

  test('reports sr-only inside a static horizontal scroller', () => {
    const found = reviewOverflow(scroller('overflow-x-auto', '<span className="sr-only">x</span>'))
    assert.deepEqual(found.map((f) => f.rule), ['abspos-escapes-scroller'])
    assert.match(found[0].fix, /Add `relative`/)
  })

  test('accepts the same thing once the scroller is positioned', () => {
    // One word is the whole fix: a positioned scroller becomes the
    // containing block, so the box resolves inside it and is clipped.
    assert.deepEqual(
      reviewOverflow(scroller('relative overflow-x-auto', '<span className="sr-only">x</span>')),
      [],
    )
  })

  test('stops at the nearest positioned ancestor, not the scroller', () => {
    const source =
      '<div className="overflow-x-auto"><div className="relative">' +
      '<span className="absolute">x</span></div></div>'
    assert.deepEqual(reviewOverflow(source), [])
  })

  test('says nothing about overflow-hidden, which clips by fitting', () => {
    // Including it reported 28 decorative cards and buried the real findings.
    assert.deepEqual(
      reviewOverflow(scroller('overflow-hidden', '<span className="sr-only">x</span>')),
      [],
    )
  })

  test('exempts a caption, which is always first and always at the start edge', () => {
    const source =
      '<div className="overflow-x-auto"><table>' +
      '<caption className="sr-only">Orders</caption></table></div>'
    assert.deepEqual(reviewOverflow(source), [])
  })

  test('says nothing when the absolute box is outside the scroller', () => {
    const source =
      '<span className="sr-only">x</span><div className="overflow-x-auto"><table /></div>'
    assert.deepEqual(reviewOverflow(source), [])
  })
})

/* ------------------------------------------------------------------ *
 *  The engine
 * ------------------------------------------------------------------ */

describe('reviewSource', () => {
  test('attaches the file to every finding', () => {
    const findings = reviewSource({ path: 'x/y.tsx', source: '<img src="a" />' })
    assert.ok(findings.length > 0)
    assert.ok(findings.every((f) => f.file === 'x/y.tsx'))
  })

  test('gives a11y findings a line, recovered from the message', () => {
    const source = '\n\n\n<img src="a.png" />\n'
    const [finding] = reviewSource({ path: 'a.tsx', source })
    assert.equal(finding.line, 4)
  })

  test('omits the line rather than guessing when it cannot be found', () => {
    // `heading-order` names no tag, so there is nothing to locate. A wrong
    // line number in a PR comment is worse than none: it sends the reader
    // to innocent code and costs the report its credibility.
    const findings = reviewSource({ path: 'a.tsx', source: '<h2>a</h2><h4>b</h4>' })
    const order = findings.find((f) => f.rule === 'heading-order')
    assert.equal(order.line, undefined)
  })

  test('only violations count towards a failing run', () => {
    const findings = reviewSource({ path: 'a.tsx', source: '<h2>a</h2><h4>b</h4>' })
    assert.equal(violations(findings).length, 0)
  })

  test('reports nothing at all on an empty source', () => {
    assert.deepEqual(reviewSource({ path: 'a.tsx', source: '' }), [])
  })

  test('sorts by line, so the report reads down the file', () => {
    const source = '<div className="pl-4" />\n<img src="a" />\n'
    const lines = reviewSource({ path: 'a.tsx', source })
      .map((f) => f.line)
      .filter((l) => l !== undefined)
    assert.deepEqual(lines, [...lines].sort((a, b) => a - b))
  })
})

/* ------------------------------------------------------------------ *
 *  The diff window
 * ------------------------------------------------------------------ */

describe('diff attribution', () => {
  const lines = new Set([10])

  test('keeps a finding on a touched line', () => {
    assert.equal(touchedByDiff({ line: 10 }, lines), true)
  })

  test('keeps one just outside it', () => {
    // A tag that began earlier, edited lower down. Genuinely caused by the
    // diff, and not on the line the finding is attributed to.
    assert.equal(touchedByDiff({ line: 10 + CONTEXT_LINES }, lines), true)
  })

  test('drops one well clear of it', () => {
    assert.equal(touchedByDiff({ line: 10 + CONTEXT_LINES + 1 }, lines), false)
  })

  test('keeps an unlocatable finding rather than quietly dropping it', () => {
    assert.equal(touchedByDiff({ line: undefined }, lines), true)
  })

  test('treats an empty hunk set as "all of it", for an untracked file', () => {
    assert.equal(touchedByDiff({ line: 900 }, new Set()), true)
  })
})
