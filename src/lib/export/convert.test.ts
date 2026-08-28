import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  componentNameFrom,
  convertSource,
  inspectSource,
  kebabCase,
  splitSource,
} from './convert'
import { styleAttrToJsx } from './html-parse'

/**
 * The failures worth guarding here are the ones that compile.
 *
 * `class` becoming `className` is visible the moment you look at the
 * output. A `style` string that throws at first render, a `<linearGradient>`
 * flattened to lowercase so the gradient silently does not exist, an
 * `onclick` dropped so the button does nothing — those all *look* like
 * working output, which is why they are what these tests are about.
 */

/* ------------------------------------------------------------------ *
 *  Inline styles
 * ------------------------------------------------------------------ */

test('a style string becomes a style object', () => {
  assert.equal(
    styleAttrToJsx('color: red; font-size: 12px'),
    "{{ color: 'red', fontSize: '12px' }}",
  )
})

test('custom properties and vendor prefixes survive', () => {
  assert.equal(
    styleAttrToJsx('--brand: #f00; -webkit-box-orient: vertical'),
    "{{ '--brand': '#f00', WebkitBoxOrient: 'vertical' }}",
  )
})

test('a semicolon inside url() does not split the declaration', () => {
  assert.equal(
    styleAttrToJsx('background: url(a;b.png) no-repeat'),
    "{{ background: 'url(a;b.png) no-repeat' }}",
  )
})

test('an empty or junk style attribute produces nothing to emit', () => {
  assert.equal(styleAttrToJsx('   '), null)
  assert.equal(styleAttrToJsx('nonsense'), null)
})

test('quotes in a value are escaped rather than closing the string', () => {
  const out = styleAttrToJsx(`font-family: 'Inter', sans-serif`)
  assert.equal(out, `{{ fontFamily: '\\'Inter\\', sans-serif' }}`)
})

/* ------------------------------------------------------------------ *
 *  Pulling a paste apart
 * ------------------------------------------------------------------ */

test('style blocks are lifted out of the markup', () => {
  const split = splitSource('<div class="a">hi</div><style>.a { color: red }</style>')
  assert.equal(split.html, '<div class="a">hi</div>')
  assert.equal(split.css, '.a { color: red }')
  assert.equal(split.styleBlocks, 1)
})

test('a whole document is reduced to the contents of body', () => {
  const split = splitSource(
    '<!doctype html><html><head><title>x</title><style>a{color:red}</style></head><body><main>hi</main></body></html>',
  )
  assert.equal(split.html, '<main>hi</main>')
  assert.equal(split.css, 'a{color:red}')
  assert.equal(split.unwrappedDocument, true)
})

test('scripts are dropped and counted, not silently swallowed', () => {
  const split = splitSource('<div>hi</div><script>alert(1)</script>')
  assert.equal(split.html, '<div>hi</div>')
  assert.equal(split.scriptBlocks, 1)

  const result = convertSource({ html: '<div>hi</div><script>alert(1)</script>', css: '', name: 'X' }, 'react')
  assert.ok(
    result.warnings.some((w) => w.includes('<script>')),
    'a dropped script must be reported',
  )
})

/* ------------------------------------------------------------------ *
 *  React output
 * ------------------------------------------------------------------ */

test('the common HTML-to-JSX rewrites all happen', () => {
  const { clipboard } = convertSource(
    {
      html: '<label for="n" class="lbl" tabindex="0"><input id="n" required></label>',
      css: '',
      name: 'Field',
    },
    'react',
  )
  assert.match(clipboard, /className="lbl"/)
  assert.match(clipboard, /htmlFor="n"/)
  assert.match(clipboard, /tabIndex="0"/)
  // A valueless attribute is already `true` in JSX; `required={true}` would
  // be the same thing spelled longer.
  assert.match(clipboard, /<input id="n" required \/>/)
})

test('SVG keeps the casing React needs', () => {
  const { clipboard } = convertSource(
    {
      html:
        '<svg viewBox="0 0 10 10"><defs><linearGradient id="g"><stop stop-color="#fff"/></linearGradient></defs><path stroke-width="2" stroke-linecap="round" clip-rule="evenodd" d="M0 0"/></svg>',
      css: '',
      name: 'Icon',
    },
    'react',
  )
  assert.match(clipboard, /viewBox="0 0 10 10"/)
  assert.match(clipboard, /<linearGradient id="g">/)
  assert.match(clipboard, /<\/linearGradient>/)
  assert.match(clipboard, /strokeWidth="2"/)
  assert.match(clipboard, /strokeLinecap="round"/)
  assert.match(clipboard, /clipRule="evenodd"/)
  assert.match(clipboard, /stopColor="#fff"/)
  assert.doesNotMatch(clipboard, /lineargradient/)
})

test('data and aria attributes are left alone', () => {
  const { clipboard } = convertSource(
    { html: '<div data-tab-id="1" aria-label="Close"></div>', css: '', name: 'X' },
    'react',
  )
  assert.match(clipboard, /data-tab-id="1"/)
  assert.match(clipboard, /aria-label="Close"/)
})

test('an inline handler becomes a function, and is reported', () => {
  const result = convertSource(
    { html: '<button onclick="save()">Go</button>', css: '', name: 'X' },
    'react',
  )
  assert.match(result.clipboard, /onClick=\{\(\) => \{ save\(\) \}\}/)
  assert.ok(result.warnings.some((w) => w.includes('onclick')))
})

test('an unmappable handler is left as authored rather than guessed at', () => {
  const result = convertSource(
    { html: '<video onvolumechange="x()"></video>', css: '', name: 'X' },
    'react',
  )
  assert.match(result.clipboard, /onvolumechange="x\(\)"/)
  assert.ok(result.warnings.some((w) => w.includes('onvolumechange')))
})

test('!important in an inline style is called out', () => {
  const result = convertSource(
    { html: '<div style="color: red !important"></div>', css: '', name: 'X' },
    'react',
  )
  assert.ok(result.warnings.some((w) => w.includes('!important')))
})

test('markup with no stylesheet gets no empty style tag', () => {
  const { clipboard } = convertSource(
    { html: '<div class="a">hi</div>', css: '', name: 'Card' },
    'react',
  )
  assert.doesNotMatch(clipboard, /<style>/)
  assert.match(clipboard, /export function Card\(\)/)
})

test('siblings are wrapped in a fragment; a single root is not', () => {
  const many = convertSource({ html: '<p>a</p><p>b</p>', css: '', name: 'X' }, 'react')
  assert.match(many.clipboard, /<>/)
  assert.ok(many.warnings.some((w) => w.includes('top-level elements')))

  const one = convertSource({ html: '<p>a</p>', css: '', name: 'X' }, 'react')
  assert.doesNotMatch(one.clipboard, /<>/)
})

test('the banner never claims a paste came from the catalog', () => {
  for (const target of ['react', 'vue', 'svelte', 'styled-components'] as const) {
    const { clipboard } = convertSource(
      { html: '<div class="a">hi</div>', css: '.a { color: red }', name: 'X' },
      target,
    )
    assert.doesNotMatch(clipboard, /effect/i, `${target} mentions an effect`)
    assert.match(clipboard, /tools\/convert/, `${target} lost its provenance line`)
  }
})

/* ------------------------------------------------------------------ *
 *  The other targets
 * ------------------------------------------------------------------ */

test('vue and svelte omit an empty style block', () => {
  for (const target of ['vue', 'svelte'] as const) {
    const { clipboard } = convertSource(
      { html: '<div class="a">hi</div>', css: '', name: 'X' },
      target,
    )
    assert.doesNotMatch(clipboard, /<style/, `${target} emitted an empty style block`)
  }
})

test('vue and svelte keep the HTML spelling of attributes', () => {
  const { clipboard } = convertSource(
    { html: '<label for="n" class="lbl">x</label>', css: '.lbl{color:red}', name: 'X' },
    'vue',
  )
  assert.match(clipboard, /class="lbl"/)
  assert.match(clipboard, /for="n"/)
  assert.doesNotMatch(clipboard, /className/)
})

test('styled-components hoists the root class into the component', () => {
  const { clipboard } = convertSource(
    {
      html: '<button class="btn"><span class="label">Go</span></button>',
      css: '.btn { color: red } .btn:hover { color: blue } .label { font-weight: 700 }',
      name: 'Btn',
    },
    'styled-components',
  )
  assert.match(clipboard, /const BtnRoot = styled\.button`/)
  assert.match(clipboard, /&:hover/)
  // The root's own class is expressed as `&`, so it leaves the markup.
  assert.doesNotMatch(clipboard, /className="btn"/)
})

test('tailwind rewrites the markup and reports coverage notes', () => {
  const result = convertSource(
    {
      html: '<div class="box">hi</div>',
      css: '.box { display: flex; padding: 16px; color: #fff }',
      name: 'Box',
    },
    'tailwind',
  )
  // Exact where there is a utility, an arbitrary value where there is not
  // — never dropped, which is the contract `./tailwind` holds to.
  assert.match(result.clipboard, /class="flex p-\[16px\] text-\[#fff\]"/)
  assert.equal(result.files[0].path, 'box.html')
})

/* ------------------------------------------------------------------ *
 *  Naming and inspection
 * ------------------------------------------------------------------ */

test('any typed name becomes a valid identifier', () => {
  assert.equal(componentNameFrom('product card'), 'ProductCard')
  assert.equal(componentNameFrom('my-widget'), 'MyWidget')
  assert.equal(componentNameFrom('  '), 'Component')
  assert.equal(componentNameFrom('123'), 'Effect123')
  assert.equal(kebabCase('ProductCard'), 'product-card')
})

test('inspection counts what the warnings are built from', () => {
  const facts = inspectSource(
    '<div class="a b" style="color:red"><span onclick="x()" style="top:0 !important"></span></div>',
  )
  assert.equal(facts.rootCount, 1)
  assert.equal(facts.elementCount, 2)
  assert.equal(facts.inlineStyled, 2)
  assert.equal(facts.importantInStyle, 1)
  assert.deepEqual(facts.knownHandlers, ['onclick'])
  assert.deepEqual(facts.classNames, ['a', 'b'])
})

test('malformed markup degrades rather than throwing', () => {
  for (const html of ['<div', '< not a tag', '<p>unclosed', '</orphan>', '']) {
    assert.doesNotThrow(() => convertSource({ html, css: '', name: 'X' }, 'react'))
  }
})
