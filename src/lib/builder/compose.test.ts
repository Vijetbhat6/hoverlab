import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  appendBlock,
  builderHref,
  componentName,
  composedDeps,
  composePageSource,
  fileName,
  installCommand,
  MAX_SECTIONS,
  moveAt,
  parseComposition,
  removeAt,
  serializeComposition,
} from './compose'
import { BLOCK_INDEX } from '../blocks/block-index'
import BLOCK_EXPORTS from '../blocks/generated-block-exports.json'

const EXPORTS = (BLOCK_EXPORTS as { exports: Record<string, string> }).exports

/* ------------------------------------------------------------------ *
 *  The generated map itself
 * ------------------------------------------------------------------ */

test('every block in the catalog has an export name', () => {
  // If this fails, someone added a block and did not re-run the prebuild —
  // and the builder would silently refuse to place it.
  for (const b of BLOCK_INDEX) {
    assert.ok(EXPORTS[b.id], `${b.id} has no entry in generated-block-exports.json`)
  }
  assert.equal(Object.keys(EXPORTS).length, BLOCK_INDEX.length)
})

test('export names are valid identifiers, and one of them is not PascalCase', () => {
  for (const [id, symbol] of Object.entries(EXPORTS)) {
    assert.match(symbol, /^[A-Z][A-Za-z0-9_]*$/, `${id} exports an invalid identifier`)
  }
  // The reason this map is generated rather than derived. If this ever stops
  // being true the shortcut becomes safe — but until then, deriving the name
  // from the id produces one page in the catalog that does not compile.
  assert.equal(EXPORTS['empty-state-cta'], 'EmptyState')
})

/* ------------------------------------------------------------------ *
 *  URL codec
 * ------------------------------------------------------------------ */

test('parseComposition round-trips a real composition', () => {
  const ids = ['hero-split', 'logo-strip', 'footer-newsletter']
  const parsed = parseComposition(serializeComposition(ids))
  assert.deepEqual(parsed.ids, ids)
  assert.deepEqual(parsed.dropped, [])
  assert.equal(parsed.truncated, false)
})

test('parseComposition is total — no input can throw', () => {
  for (const input of [undefined, '', '   ', ',,,', 'not-a-block', '<script>', '../../etc']) {
    const parsed = parseComposition(input)
    assert.ok(Array.isArray(parsed.ids))
    for (const id of parsed.ids) assert.ok(id in EXPORTS)
  }
})

test('unknown ids are reported, not silently swallowed', () => {
  // The shared-link-outlives-the-block case. A layout that quietly loses a
  // section is worse than one that says which section it lost.
  const parsed = parseComposition('hero-split,block-that-was-renamed,logo-strip')
  assert.deepEqual(parsed.ids, ['hero-split', 'logo-strip'])
  assert.deepEqual(parsed.dropped, ['block-that-was-renamed'])
})

test('an oversized composition is capped and says so', () => {
  const many = Array.from({ length: MAX_SECTIONS + 12 }, () => 'hero-split').join(',')
  const parsed = parseComposition(many)
  assert.equal(parsed.ids.length, MAX_SECTIONS)
  assert.equal(parsed.truncated, true)
})

test('the cap bounds server work regardless of how the ids are spelled', () => {
  // Whitespace and case are normalized before the cap, so padding the input
  // cannot smuggle extra sections past it.
  const many = Array.from({ length: 200 }, () => '  HERO-SPLIT  ').join(',')
  assert.equal(parseComposition(many).ids.length, MAX_SECTIONS)
})

test('serializeComposition never emits more than the cap', () => {
  const ids = Array.from({ length: 100 }, () => 'hero-split')
  assert.equal(serializeComposition(ids).split(',').length, MAX_SECTIONS)
})

test('builderHref is the bare route when nothing is chosen', () => {
  assert.equal(builderHref([]), '/builder')
  assert.equal(builderHref(['hero-split']), '/builder?b=hero-split')
})

/* ------------------------------------------------------------------ *
 *  Editing operations
 * ------------------------------------------------------------------ */

test('edits never mutate the list they are given', () => {
  const ids = ['a', 'b', 'c']
  const frozen = [...ids]
  removeAt(ids, 1)
  moveAt(ids, 0, 1)
  appendBlock(ids, 'd')
  assert.deepEqual(ids, frozen)
})

test('moveAt swaps neighbours and refuses to fall off either end', () => {
  assert.deepEqual(moveAt(['a', 'b', 'c'], 1, -1), ['b', 'a', 'c'])
  assert.deepEqual(moveAt(['a', 'b', 'c'], 1, 1), ['a', 'c', 'b'])
  assert.deepEqual(moveAt(['a', 'b', 'c'], 0, -1), ['a', 'b', 'c'])
  assert.deepEqual(moveAt(['a', 'b', 'c'], 2, 1), ['a', 'b', 'c'])
  assert.deepEqual(moveAt(['a', 'b', 'c'], 9, 1), ['a', 'b', 'c'])
})

test('removeAt is a no-op out of range', () => {
  assert.deepEqual(removeAt(['a', 'b'], 0), ['b'])
  assert.deepEqual(removeAt(['a', 'b'], 5), ['a', 'b'])
  assert.deepEqual(removeAt(['a', 'b'], -1), ['a', 'b'])
})

test('appendBlock stops at the cap', () => {
  const full = Array.from({ length: MAX_SECTIONS }, () => 'hero-split')
  assert.equal(appendBlock(full, 'logo-strip').length, MAX_SECTIONS)
})

/* ------------------------------------------------------------------ *
 *  Names
 * ------------------------------------------------------------------ */

test('componentName always produces a usable identifier', () => {
  assert.equal(componentName('my landing page'), 'MyLandingPage')
  assert.equal(componentName('Pricing!'), 'Pricing')
  assert.equal(componentName('  '), 'ComposedPage')
  assert.equal(componentName('!!!'), 'ComposedPage')
  // Free text can start with a digit; an identifier cannot.
  assert.equal(componentName('2026 launch'), 'Page2026Launch')
  for (const input of ['', '---', '2026', 'a', 'ünïcode']) {
    assert.match(componentName(input), /^[A-Za-z_][A-Za-z0-9_]*$/)
  }
})

test('fileName produces a slug with an extension', () => {
  assert.equal(fileName('My Landing Page'), 'my-landing-page.tsx')
  assert.equal(fileName('  '), 'composed-page.tsx')
  assert.equal(fileName('!!!'), 'composed-page.tsx')
})

/* ------------------------------------------------------------------ *
 *  Generated source
 * ------------------------------------------------------------------ */

test('the generated page imports each block by its real export name', () => {
  const src = composePageSource(['hero-split', 'empty-state-cta'], { name: 'Landing' })
  assert.match(src, /import \{ HeroSplit \} from '@\/components\/hero-split'/)
  // The whole reason the map is generated: PascalCasing the id would emit
  // `EmptyStateCta` here and the file would not compile.
  assert.match(src, /import \{ EmptyState \} from '@\/components\/empty-state-cta'/)
  assert.ok(!src.includes('EmptyStateCta'))
  assert.match(src, /export default function Landing\(\)/)
})

test('duplicate sections are rendered twice and imported once', () => {
  const src = composePageSource(['cta-inline-card', 'hero-split', 'cta-inline-card'])
  const imports = src.match(/^import \{ CtaInlineCard \}/gm) ?? []
  assert.equal(imports.length, 1, 'imported more than once')
  const usages = src.match(/<CtaInlineCard \/>/g) ?? []
  assert.equal(usages.length, 2, 'not rendered twice')
})

test('unknown ids never reach the generated source', () => {
  const src = composePageSource(['hero-split', 'not-a-block'])
  assert.ok(!src.includes('not-a-block'))
  assert.match(src, /<HeroSplit \/>/)
})

test('an empty composition still produces a file that compiles', () => {
  const src = composePageSource([])
  assert.match(src, /export default function ComposedPage\(\)/)
  assert.match(src, /<main/)
  // No dangling import list, no empty braces where a component should be.
  assert.ok(!/import \{ \} from/.test(src))
})

test('the header carries the command that installs what it imports', () => {
  const src = composePageSource(['hero-split', 'logo-strip'], {
    shareUrl: 'https://hoverlab.dev/builder?b=hero-split,logo-strip',
  })
  assert.ok(src.includes('npx hoverlab add hero-split logo-strip'))
  assert.ok(src.includes('https://hoverlab.dev/builder?b=hero-split,logo-strip'))
})

test('the generated source is balanced and ends with a newline', () => {
  const src = composePageSource(['hero-split', 'logo-strip', 'footer-newsletter'])
  assert.equal(src.split('{').length, src.split('}').length, 'unbalanced braces')
  assert.equal(src.split('(').length, src.split(')').length, 'unbalanced parens')
  assert.ok(src.endsWith('\n'))
})

test('every block in the catalog composes into a plausible source', () => {
  // The cheap version of "does it compile" across all 250: each block, on its
  // own, must produce an import line and a usage that agree.
  for (const b of BLOCK_INDEX) {
    const src = composePageSource([b.id])
    const symbol = EXPORTS[b.id]
    assert.ok(
      src.includes(`import { ${symbol} } from '@/components/${b.id}'`),
      `${b.id} produced no import`,
    )
    assert.ok(src.includes(`<${symbol} />`), `${b.id} produced no usage`)
  }
})

test('installCommand dedupes and degrades to a placeholder', () => {
  assert.equal(installCommand(['hero-split', 'hero-split']), 'npx hoverlab add hero-split')
  assert.equal(installCommand([]), 'npx hoverlab add <block>')
  assert.equal(installCommand(['not-a-block']), 'npx hoverlab add <block>')
})

test('composedDeps is the union of what the chosen blocks import', () => {
  const deps = composedDeps(['hero-split'])
  assert.ok(Array.isArray(deps))
  assert.deepEqual(deps, [...deps].sort(), 'not sorted')
  assert.equal(new Set(deps).size, deps.length, 'not deduped')
  // Catalog-wide: the blocks are deliberately shallow, and the builder's
  // export panel says so. If a block ever pulls a heavy dependency in, this
  // is where it becomes visible.
  const all = composedDeps(BLOCK_INDEX.map((b) => b.id))
  assert.ok(all.length < 10, `blocks now pull ${all.length} packages: ${all.join(', ')}`)
})
