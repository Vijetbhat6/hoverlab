import { test } from 'node:test'
import assert from 'node:assert/strict'

import { exportEffect } from './index'
import { verifyExport } from './verify'
import {
  decodeArbitrary,
  escapeClass,
  parseUtilityClass,
  resolveUtility,
  utilityStylesheet,
} from './tailwind-utilities'

/**
 * What these tests are actually protecting.
 *
 * The Verify tab is worth exactly as much as the independence of the thing
 * doing the verifying. Two failure modes would destroy it silently:
 *
 *  1. The right-hand frame ends up rendered from the *input* rather than
 *     from the generated file, at which point the two frames agree forever
 *     and the tab certifies anything.
 *  2. `tailwind-utilities` gets "de-duplicated" against `tailwind.ts`, at
 *     which point the Tailwind check becomes the converter marking its own
 *     homework.
 *
 * Neither shows up as a failing render — both show up as a green panel. So
 * the tests below mostly assert that damage in a generated file survives
 * into the rehydration, which is the property that makes a green panel
 * mean something.
 */

const CARD = {
  id: 'fx-card',
  name: 'Card',
  description: 'A card',
  html: '<div class="fx-card"><span class="fx-card__label">Ship</span></div>',
  css: `.fx-card {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 0;
}

.fx-card:hover .fx-card__label {
  color: #f43f5e;
}

@keyframes fx-card-pulse {
  0% { opacity: 0.4; }
  100% { opacity: 1; }
}`,
}

/* ------------------------------------------------------------------ *
 *  The rehydration reads the generated file
 * ------------------------------------------------------------------ */

test('Vue rehydration comes out of the <template>, not out of the input', () => {
  const report = verifyExport(CARD, 'vue')

  // Every element carries Vue's scope attribute, which only exists because
  // the template was parsed and rewritten. The input HTML has no such
  // attribute, so markup carrying it cannot have come from the input.
  assert.match(report.converted.html, /data-v-hoverlab/)
  assert.equal((report.converted.html.match(/data-v-hoverlab/g) ?? []).length, 2)
  assert.ok(!report.original.html.includes('data-v-hoverlab'))
})

test('the scope marker lands before the pseudo, where the compilers put it', () => {
  const report = verifyExport(
    {
      ...CARD,
      css: `.fx-card:hover { opacity: 1; }\n.fx-card::before { content: ""; }`,
    },
    'vue',
  )

  // `.fx-card[data-v]:hover`, never `.fx-card:hover[data-v]` — the second
  // is a different selector, and an invalid one after a pseudo-element.
  assert.match(report.converted.css, /\.fx-card\[data-v-hoverlab\]:hover/)
  assert.match(report.converted.css, /\.fx-card\[data-v-hoverlab\]::before/)
  assert.ok(!/:hover\[data-v-hoverlab\]/.test(report.converted.css))
  assert.ok(!/::before\[data-v-hoverlab\]/.test(report.converted.css))
})

test('only the subject compound is scoped, so the cascade cannot reorder', () => {
  const report = verifyExport(CARD, 'vue')
  const descendant = report.converted.css.match(/[^\n{]*fx-card__label[^\n{]*(?=\s*\{)/)?.[0] ?? ''

  assert.match(descendant, /\.fx-card__label\[data-v-hoverlab\]/)
  // The ancestor half of the same selector stays bare.
  assert.match(descendant, /\.fx-card:hover\s/)
})

test('keyframes survive scoping untouched', () => {
  const report = verifyExport(CARD, 'vue')
  assert.match(report.converted.css, /@keyframes fx-card-pulse/)
  assert.match(report.converted.css, /opacity: 0\.4/)
})

test('a Vue file with no template is reported rather than rendered', () => {
  // Not reachable through `buildVue` today, which is the point: this is
  // the finding that fires the day it becomes reachable.
  const report = verifyExport({ ...CARD, html: '' }, 'vue')
  assert.ok(report.findings.every((f) => f.kind !== 'problem'))

  const broken = verifyExport({ ...CARD, html: '<div>x</div>' }, 'vue')
  assert.equal(broken.findings.filter((f) => f.kind === 'problem').length, 0)
})

test('Svelte rehydration scopes with a class and keeps the markup', () => {
  const report = verifyExport(CARD, 'svelte')
  assert.match(report.converted.html, /class="fx-card svelte-hoverlab"/)
  assert.match(report.converted.css, /\.fx-card\.svelte-hoverlab/)
})

test('Svelte reports the selectors its compiler would prune', () => {
  const report = verifyExport(
    {
      ...CARD,
      css: `${CARD.css}\n.fx-card .never-rendered { color: red; }`,
    },
    'svelte',
  )

  const note = report.findings.find((f) => f.kind === 'note')
  assert.ok(note, 'expected an unused-selector note')
  assert.match(note.message, /unused selector/)
  assert.match(note.message, /never-rendered/)
})

test('a selector that does match is not reported as unused', () => {
  const report = verifyExport(CARD, 'svelte')
  assert.equal(report.findings.filter((f) => f.kind === 'note').length, 0)
})

test('the CSS target renders the two files it actually ships', () => {
  const report = verifyExport(CARD, 'css')
  assert.deepEqual(
    report.files.map((f) => f.path),
    ['fx-card.css', 'fx-card.html'],
  )
  assert.match(report.converted.html, /fx-card__label/)
  assert.match(report.converted.css, /border-radius/)
})

test('every target states what it does not prove', () => {
  for (const target of ['css', 'vue', 'svelte', 'tailwind'] as const) {
    const report = verifyExport(CARD, target)
    assert.ok(report.limits.length > 0, `${target} claims no limits`)
    assert.ok(
      report.limits.some((l) => /resting state/.test(l)),
      `${target} does not say that states are not exercised`,
    )
  }
})

/* ------------------------------------------------------------------ *
 *  Reading Tailwind classes back
 * ------------------------------------------------------------------ */

test('an exact utility resolves to the CSS Tailwind emits, not to our source value', () => {
  // The source said `align-items: center`; both directions agree here.
  assert.equal(resolveUtility('items-center').declarations, 'align-items: center')
  // The source may have said `start`; Tailwind only knows `flex-start`,
  // and this table has to say so or the differ cannot flag the pair.
  assert.equal(resolveUtility('items-start').declarations, 'align-items: flex-start')
})

test('arbitrary values decode their underscores', () => {
  assert.equal(
    resolveUtility('shadow-[0_2px_8px_rgba(0,0,0,.2)]').declarations,
    'box-shadow: 0 2px 8px rgba(0,0,0,.2)',
  )
  assert.equal(decodeArbitrary('a\\_b_c'), 'a_b c')
})

test('an arbitrary property is the universal fallback in both directions', () => {
  assert.equal(
    resolveUtility('[backdrop-filter:blur(6px)]').declarations,
    'backdrop-filter: blur(6px)',
  )
})

test('colour and length are told apart the way Tailwind tells them apart', () => {
  assert.equal(resolveUtility('text-[#f43f5e]').declarations, 'color: #f43f5e')
  assert.equal(resolveUtility('text-[1.125rem]').declarations, 'font-size: 1.125rem')
  assert.equal(resolveUtility('text-[color:var(--brand)]').declarations, 'color: var(--brand)')
  assert.equal(resolveUtility('text-[length:var(--size)]').declarations, 'font-size: var(--size)')
})

test('a zero that Tailwind has no class for is named as such', () => {
  assert.equal(resolveUtility('p-0').declarations, 'padding: 0px')
  // Unitless, or the browser discards the declaration and the element
  // renders at the initial value — `opacity: 0px` is how a checkbox that
  // should be invisible came back at full opacity.
  assert.equal(resolveUtility('z-0').declarations, 'z-index: 0')
  assert.equal(resolveUtility('opacity-0').declarations, 'opacity: 0')

  // The bug this module was written to find: `rounded-none` is the class,
  // `rounded-0` compiles to nothing.
  const radius = resolveUtility('rounded-0')
  assert.equal(radius.declarations, null)
  assert.equal(radius.reason, 'not-a-utility')

  for (const notAUtility of ['leading-0', 'tracking-0', 'shadow-0']) {
    assert.equal(resolveUtility(notAUtility).reason, 'not-a-utility', notAUtility)
  }
})

test('a class this reader has never heard of is a gap, not a defect', () => {
  assert.equal(resolveUtility('prose-lg').reason, 'unknown')
  assert.equal(resolveUtility('animate-spin').reason, 'unknown')
})

/* ------------------------------------------------------------------ *
 *  Variants
 * ------------------------------------------------------------------ */

test('a variant colon splits, a colon inside brackets does not', () => {
  assert.deepEqual(parseUtilityClass('hover:before:opacity-100'), {
    variants: ['hover', 'before'],
    utility: 'opacity-100',
    important: false,
  })
  assert.deepEqual(parseUtilityClass('text-[color:var(--x)]'), {
    variants: [],
    utility: 'text-[color:var(--x)]',
    important: false,
  })
  assert.deepEqual(parseUtilityClass('[&:nth-child(2)]:!hidden'), {
    variants: ['[&:nth-child(2)]'],
    utility: 'hidden',
    important: true,
  })
})

test('group and peer become an ancestor and a sibling selector', () => {
  const sheet = utilityStylesheet(
    '<div class="group"><b class="group-hover:underline">x</b></div>',
  )
  assert.match(sheet.css, /\.group:hover \.group-hover\\:underline/)

  const peer = utilityStylesheet(
    '<div><input class="peer"><b class="peer-checked:underline">x</b></div>',
  )
  assert.match(peer.css, /\.peer:checked ~ \.peer-checked\\:underline/)
})

test('a named group binds to its own marker', () => {
  const sheet = utilityStylesheet(
    '<div class="group/g1"><b class="group-hover/g1:underline">x</b></div>',
  )
  assert.match(sheet.css, /\.group\\\/g1:hover /)
})

test('an arbitrary variant puts the subject where the ampersand was', () => {
  const sheet = utilityStylesheet('<b class="[&amp;:nth-child(2)]:underline">x</b>')
  assert.match(sheet.css, /:nth-child\(2\)\s*\{/)
  assert.match(sheet.css, /text-decoration-line: underline/)
})

test('a pseudo-element variant lands last in the selector', () => {
  const sheet = utilityStylesheet('<b class="hover:before:underline">x</b>')
  assert.match(sheet.css, /:hover::before \{/)
})

test('marker classes and classes the companion sheet needs are not flagged', () => {
  const sheet = utilityStylesheet(
    '<div class="group fx-card"><b class="peer">x</b></div>',
    '.fx-card::after { content: ""; }',
  )
  assert.deepEqual(sheet.unresolved, [])
})

test('important survives the round trip', () => {
  const sheet = utilityStylesheet('<b class="!underline">x</b>')
  assert.match(sheet.css, /text-decoration-line: underline !important/)
})

test('base utilities are emitted before variants', () => {
  const sheet = utilityStylesheet('<b class="hover:underline italic">x</b>')
  assert.ok(
    sheet.css.indexOf('font-style: italic') < sheet.css.indexOf(':hover'),
    'a variant rule must not be able to lose to a base rule on source order',
  )
})

/* ------------------------------------------------------------------ *
 *  Escaping
 * ------------------------------------------------------------------ */

test('a class name becomes a selector the browser will accept', () => {
  assert.equal(escapeClass('bg-[#f43f5e]'), 'bg-\\[\\#f43f5e\\]')
  assert.equal(escapeClass('hover:underline'), 'hover\\:underline')
  assert.equal(escapeClass('group/g1'), 'group\\/g1')
  assert.equal(escapeClass('2xl'), '\\32 xl')
})

/* ------------------------------------------------------------------ *
 *  End to end
 * ------------------------------------------------------------------ */

test('the Tailwind export rehydrates to the declarations it started with', () => {
  const report = verifyExport(CARD, 'tailwind')

  assert.match(report.converted.css, /display: flex/)
  assert.match(report.converted.css, /align-items: center/)
  // The hover rule went through `group-hover:` and has to come back as an
  // ancestor selector, not as a bare `:hover` on the label.
  assert.match(report.converted.css, /\.group:hover [\s\S]*color: #f43f5e/)
  // Keyframes have no class form and ride along in the companion sheet.
  assert.match(report.converted.css, /@keyframes fx-card-pulse/)
})

test('a Tailwind export with nothing unresolvable reports no gap', () => {
  const report = verifyExport(CARD, 'tailwind')
  assert.deepEqual(
    report.findings.filter((f) => f.kind !== 'note').map((f) => f.message),
    [],
  )
})

/* ------------------------------------------------------------------ *
 *  Regressions the Verify tab found
 * ------------------------------------------------------------------ */

/**
 * Three bugs in the Tailwind exporter, all found the first time an export
 * was rendered next to the original rather than read. Each had been
 * shipping for months, and each is invisible in the generated source —
 * which is the argument for the tab in one paragraph.
 */

test('a conditional at-rule keeps its wrapper', () => {
  const report = verifyExport(
    {
      ...CARD,
      css: `.fx-card { animation: spin 2s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .fx-card { animation-duration: 1ms !important; }
}`,
    },
    'tailwind',
  )

  // Flattened, this ran every animation in the export at 1ms for everybody.
  assert.match(report.converted.css, /@media \(prefers-reduced-motion: reduce\) \{/)
  const guard = report.converted.css.indexOf('animation-duration: 1ms')
  const wrapper = report.converted.css.indexOf('@media')
  assert.ok(wrapper !== -1 && wrapper < guard, 'the guard must sit inside the @media block')
})

test('a background shorthand carries its implicit colour reset', () => {
  const report = verifyExport(
    { ...CARD, html: '<button class="fx-card">Go</button>', css: '.fx-card { background: linear-gradient(90deg, #f43f5e, #6366f1); }' },
    'tailwind',
  )

  // The shorthand resets `background-color` to transparent; `bg-[gradient]`
  // sets only the image, so a button keeps the user agent's grey behind it.
  assert.match(report.converted.html, /\bbg-transparent\b/)
  assert.match(report.converted.css, /background-color: transparent/)
})

test('background-image, being a longhand, resets nothing', () => {
  const report = verifyExport(
    { ...CARD, css: '.fx-card { background-image: linear-gradient(90deg, #f43f5e, #6366f1); }' },
    'tailwind',
  )
  assert.ok(!/\bbg-transparent\b/.test(report.converted.html))
})

test('an arbitrary variant cannot contain a space', () => {
  const report = verifyExport(
    {
      ...CARD,
      html: '<div class="fx-card"><input type="checkbox"><span class="fx-card__label">x</span></div>',
      css: '.fx-card:has(input:checked, .fx-card__label) .fx-card__label { color: red; }',
    },
    'tailwind',
  )

  // A space here ends the class attribute's token: the browser sees two
  // classes, neither of which is anything, and the rule vanishes.
  for (const cls of report.converted.html.matchAll(/class="([^"]*)"/g)) {
    for (const name of cls[1].split(/\s+/)) {
      assert.ok(!name.includes(', '), `class "${name}" was split by a space`)
    }
  }
})

test('a background shorthand with a position and a size stays a shorthand', () => {
  const report = verifyExport(
    {
      ...CARD,
      css: '.fx-card { background: linear-gradient(#1e293b 0, #1e293b 12px, transparent 12px) 12px 12px / calc(100% - 24px) 100% no-repeat; }',
    },
    'tailwind',
  )

  // `bg-[…]` resolves to `background-image`, and an image cannot carry a
  // position, a size and a repeat — the browser rejects the whole
  // declaration and the element loses its background rather than a detail.
  assert.match(report.converted.css, /background:\s*linear-gradient/)
  assert.ok(!/background-image:\s*linear-gradient\([^)]*\)\s+12px/.test(report.converted.css))
})

test('a lone gradient is still a lone gradient', () => {
  const report = verifyExport(
    { ...CARD, css: '.fx-card { background: linear-gradient(90deg, #f43f5e, #6366f1); }' },
    'tailwind',
  )
  assert.match(report.converted.css, /background-image: linear-gradient/)
})

/* ------------------------------------------------------------------ *
 *  Bugs found auditing the verifier itself
 * ------------------------------------------------------------------ */

test('nested at-rules come back out nested, not concatenated', () => {
  const report = verifyExport(
    {
      ...CARD,
      css: `@supports (display: grid) {
  @media (min-width: 40rem) {
    .fx-card { display: grid; }
  }
}`,
    },
    'vue',
  )

  // `@supports (…) @media (…) { }` is not a shorter spelling of a nested
  // block, it is invalid, and the browser drops the rule entirely.
  assert.match(report.converted.css, /@supports \(display: grid\) \{/)
  assert.match(report.converted.css, /@media \(min-width: 40rem\) \{/)
  assert.ok(
    !/@supports[^{]*@media/.test(report.converted.css),
    'the two contexts must not share one prelude',
  )
})

test('a <style> inside the markup does not swallow the real stylesheet', () => {
  const report = verifyExport(
    {
      ...CARD,
      html: '<div class="fx-card"><style>.inner{color:red}</style><span class="fx-card__label">Ship</span></div>',
    },
    'vue',
  )

  // The SFC's own scoped block is the one after </template>. Finding the
  // first `<style>` in the file would start inside the template and run to
  // the last `</style>`, eating the template's tail.
  assert.match(report.converted.css, /\.fx-card\[data-v-hoverlab\]/)
  assert.match(report.converted.html, /fx-card__label/)
})

test('a state variant this reader does not know is a gap, not a wrong selector', () => {
  // `:first` is not a selector; Tailwind's `first:` is `:first-child`.
  // Emitting `:first` produces a rule the browser silently discards, which
  // would read as the conversion losing a declaration.
  const sheet = utilityStylesheet('<b class="first:underline">x</b>')
  assert.match(sheet.css, /:first-child/)
  assert.ok(!/:first\b(?!-)/.test(sheet.css))

  const unknown = utilityStylesheet('<b class="supports-grid:underline">x</b>')
  assert.equal(unknown.css, '')
  assert.deepEqual(
    unknown.unresolved.map((u) => u.reason),
    ['unknown'],
  )
})

test('a media-query variant is never rendered as a pseudo-class', () => {
  for (const cls of ['dark:underline', 'md:underline', 'motion-reduce:underline']) {
    const sheet = utilityStylesheet(`<b class="${cls}">x</b>`)
    assert.equal(sheet.css, '', cls)
    assert.equal(sheet.unresolved.length, 1, cls)
  }
})

test('preformatted text survives the trip into JSX', () => {
  const trace = { ...CARD, html: '<pre class="fx-card">line one\n  line two</pre>' }

  // JSX strips each line's leading and trailing whitespace and joins the
  // lines with a space, so a <pre> written as JSX text comes out as one
  // line — for a stack trace or a terminal card, that is the content gone.
  const react = exportEffect(trace, 'react').files[0].code
  assert.ok(
    react.includes('{"line one\\n  line two"}'),
    `expected a string expression, got:\n${react}`,
  )

  // HTML keeps it literal, which is the same rendering by a different road.
  const html = exportEffect(trace, 'css').files.find((f) => f.language === 'html')!.code
  assert.match(html, /<pre class="fx-card">line one\n {2}line two<\/pre>/)
})

test('a more specific rule wins even when it is written first', () => {
  const report = verifyExport(
    {
      ...CARD,
      html: '<div class="fx-card"><i class="l2">x</i></div>',
      css: `.fx-card i.l2 { background: #1e293b; }
.fx-card .l2 { background: #273449; }`,
    },
    'tailwind',
  )

  // `i.l2` is (0,2,1) and `.l2` is (0,2,0), so the browser paints #1e293b.
  // Collapsing a stylesheet onto elements throws the selectors away, and
  // the exporter used to keep whichever came last in the file.
  const markup = report.converted.html
  const winner = markup.lastIndexOf('bg-[#1e293b]')
  const loser = markup.lastIndexOf('bg-[#273449]')
  assert.ok(winner !== -1, `expected the specific colour to survive:\n${markup}`)
  assert.ok(
    loser === -1 || winner > loser,
    `the specific colour must come last so it wins:\n${markup}`,
  )
})
