import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  FRAMEWORK_FACETS,
  auditKey,
  facetParams,
  facetPredicate,
  parseFacets,
  supportsFramework,
} from './facets'
import type { ColorBucket } from './color'

const data = {
  audited: new Set([auditKey('block', 'hero-split'), auditKey('page', 'landing')]),
  effectsByColor: (bucket: ColorBucket): ReadonlySet<string> =>
    bucket === 'blue' ? new Set(['blue-btn']) : new Set(),
}

describe('parseFacets', () => {
  test('keeps only real values and drops the rest', () => {
    assert.deepEqual(parseFacets({ fw: 'vue', a11y: 'audited', color: 'blue' }), {
      fw: 'vue',
      a11y: 'audited',
      color: 'blue',
    })
    assert.deepEqual(parseFacets({ fw: 'cobol', a11y: 'AA', color: 'chartreuse' }), {})
    assert.deepEqual(parseFacets({}), {})
  })

  test('round-trips through facetParams', () => {
    const f = parseFacets({ fw: 'svelte', color: 'red' })
    assert.deepEqual(facetParams(f), { fw: 'svelte', color: 'red' })
    assert.deepEqual(facetParams({}), {})
  })
})

describe('supportsFramework', () => {
  test('follows the framework matrix for effects, blocks and pages', () => {
    assert.equal(supportsFramework('effect', 'vue'), true)
    assert.equal(supportsFramework('effect', 'astro'), false) // no effect converter
    assert.equal(supportsFramework('block', 'astro'), true) // markup wrapper
    assert.equal(supportsFramework('block', 'styled-components'), false)
    assert.equal(supportsFramework('page', 'svelte'), true)
  })

  test('primitives and templates are React source and match React only', () => {
    assert.equal(supportsFramework('primitive', 'react'), true)
    assert.equal(supportsFramework('primitive', 'vue'), false)
    assert.equal(supportsFramework('template', 'react'), true)
    assert.equal(supportsFramework('template', 'html'), false)
  })

  test('an unknown framework matches nothing', () => {
    assert.equal(supportsFramework('effect', 'cobol'), false)
  })

  test('every listed framework is one the matrix knows', () => {
    assert.ok(FRAMEWORK_FACETS.length >= 6)
    for (const f of FRAMEWORK_FACETS) {
      assert.ok(
        (['effect', 'block', 'page', 'primitive', 'template'] as const).some((l) =>
          supportsFramework(l, f.id),
        ),
        f.id,
      )
    }
  })
})

describe('facetPredicate', () => {
  test('no facets, no predicate', () => {
    assert.equal(facetPredicate({}, data), undefined)
  })

  test('framework narrows by tier support', () => {
    const p = facetPredicate({ fw: 'astro' }, data)!
    assert.equal(p({ id: 'x', level: 'effect' }), false)
    assert.equal(p({ id: 'x', level: 'block' }), true)
    assert.equal(p({ id: 'x', level: 'template' }), false)
  })

  test('the audit facet leaves only audited blocks and pages', () => {
    const p = facetPredicate({ a11y: 'audited' }, data)!
    assert.equal(p({ id: 'hero-split', level: 'block' }), true)
    assert.equal(p({ id: 'landing', level: 'page' }), true)
    assert.equal(p({ id: 'landing', level: 'block' }), false) // key is level + id
    assert.equal(p({ id: 'blue-btn', level: 'effect' }), false) // never audited
  })

  test('the colour facet leaves only effects carrying that colour', () => {
    const p = facetPredicate({ color: 'blue' }, data)!
    assert.equal(p({ id: 'blue-btn', level: 'effect' }), true)
    assert.equal(p({ id: 'other', level: 'effect' }), false)
    assert.equal(p({ id: 'blue-btn', level: 'block' }), false)
  })

  test('facets combine with AND', () => {
    const p = facetPredicate({ fw: 'astro', a11y: 'audited' }, data)!
    assert.equal(p({ id: 'hero-split', level: 'block' }), true)
    const q = facetPredicate({ fw: 'astro', color: 'blue' }, data)!
    assert.equal(q({ id: 'blue-btn', level: 'effect' }), false) // astro has no effects
  })
})
