import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { TOOL_FUNNELS, funnelFor, funnelHref } from './tool-funnel'
import { DESIGNER_TOOLS } from './designer-tools'
import { CATEGORIES, categorySlug } from './effect-types'
import { EFFECT_INDEX } from './effect-index'
import { searchArtifacts } from './browse'

/**
 * The funnel's failure mode is silence.
 *
 * A tool with no entry sends its traffic nowhere and nothing reports it; a
 * tool pointed at an empty category sends it to a page that says "no
 * results", which is worse than sending it nowhere. Neither breaks a build,
 * neither throws, and neither is visible without opening 37 pages.
 */

test('every designer tool has a funnel', () => {
  const missing = DESIGNER_TOOLS.filter((tool) => !funnelFor(tool.href)).map((t) => t.href)
  assert.deepEqual(
    missing,
    [],
    `these tools send their traffic nowhere: ${missing.join(', ')}`,
  )
})

test('every funnel points at a tool that exists', () => {
  const hrefs = new Set(DESIGNER_TOOLS.map((tool) => tool.href))
  const orphans = TOOL_FUNNELS.filter((f) => !hrefs.has(f.href)).map((f) => f.href)
  assert.deepEqual(orphans, [], `funnels for routes that do not exist: ${orphans.join(', ')}`)
})

test('no tool is funnelled twice', () => {
  const seen = new Set(TOOL_FUNNELS.map((f) => f.href))
  assert.equal(seen.size, TOOL_FUNNELS.length)
})

test('every named category is a real one', () => {
  // Also enforced at module load, because a dead link should not wait for
  // a test run to be noticed. Asserted here too so the failure names the
  // tool rather than only the category.
  const known = new Set<string>(CATEGORIES)
  for (const funnel of TOOL_FUNNELS) {
    if (funnel.category === null) continue
    assert.ok(known.has(funnel.category), `${funnel.href} → unknown category "${funnel.category}"`)
  }
})

test('every category destination actually has effects in it', () => {
  /*
   * The one that matters. A category can be spelled correctly, exist in
   * the taxonomy, and hold nothing — `effect-types.ts` says the category
   * list is deliberately larger than what is populated. Sending a visitor
   * from a working tool to an empty page is the worst outcome available
   * here, and it is invisible from the data alone.
   */
  const populated = new Set(EFFECT_INDEX.map((effect) => effect.category))

  for (const funnel of TOOL_FUNNELS) {
    if (funnel.category === null) continue
    assert.ok(
      populated.has(funnel.category as never),
      `${funnel.href} sends people to "${funnel.category}", which has no effects in it`,
    )
  }
})

test('every query destination actually returns something', () => {
  /*
   * The same failure as an empty category, one step further out, and the
   * one the first draft actually shipped: `grid layout` matched nothing
   * because the search is per-term rather than a phrase matcher, and
   * `tailwind` matched nothing because every block is Tailwind so no
   * description says the word. Both returned HTTP 200 and an empty page.
   */
  const empty: string[] = []

  for (const funnel of TOOL_FUNNELS) {
    if (!funnel.query) continue
    const { total } = searchArtifacts({ q: funnel.query, level: funnel.level })
    if (total === 0) empty.push(`${funnel.href} → "${funnel.query}"`)
  }

  assert.deepEqual(empty, [], `these funnels land on an empty page: ${empty.join(', ')}`)
})

test('a categorised effect funnel resolves to its category route', () => {
  const loader = funnelFor('/tools/loader')!
  assert.equal(funnelHref(loader), `/category/${categorySlug('Loaders')}`)
})

test('an uncategorised funnel resolves to a browse query with a level', () => {
  const grid = funnelFor('/tools/grid')!
  const href = funnelHref(grid)
  assert.ok(href.startsWith('/browse?'))
  const params = new URLSearchParams(href.slice('/browse?'.length))
  assert.equal(params.get('level'), 'block')
  assert.ok(params.get('q'))
})

test('a funnel with no category always carries a query', () => {
  // Otherwise it resolves to an unfiltered browse page, which is the
  // generic banner this was built to avoid.
  for (const funnel of TOOL_FUNNELS) {
    if (funnel.category !== null) continue
    assert.ok(funnel.query, `${funnel.href} has neither a category nor a query`)
  }
})

test('every pitch is a next step, not a full stop', () => {
  for (const funnel of TOOL_FUNNELS) {
    assert.ok(funnel.pitch.length > 20, `${funnel.href}: pitch is too short to say anything`)
    // It is rendered as a heading above a link, so a trailing period reads
    // as a sentence that has finished rather than one that continues.
    assert.ok(!funnel.pitch.endsWith('.'), `${funnel.href}: pitch ends with a full stop`)
  }
})

test('the hub itself is not funnelled', () => {
  // /tools is already a route into everything; a band under it would be
  // pointing at the catalog from a page whose job is pointing at tools.
  assert.equal(funnelFor('/tools'), undefined)
})
