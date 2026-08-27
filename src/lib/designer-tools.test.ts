import { test } from 'node:test'
import assert from 'node:assert/strict'

import { DESIGNER_TOOLS, relatedTools, toolMetadata } from './designer-tools'

/**
 * The rail these feed renders into twenty statically generated pages, so
 * the properties worth guarding are the ones a build would bake in
 * silently: a tool linking to itself, a rail that renders short on one
 * page and full on another, an order that changes between builds.
 */

test('every tool has a unique route and a search-phrased title', () => {
  const seen = new Set<string>()
  for (const tool of DESIGNER_TOOLS) {
    assert.ok(tool.href.startsWith('/tools/'), `${tool.href} is not under /tools`)
    assert.ok(!seen.has(tool.href), `duplicate route: ${tool.href}`)
    seen.add(tool.href)
    assert.ok(tool.seoTitle.length > 0)
    assert.ok(tool.keywords.trim().length > 0, `${tool.href} has no keywords to relate on`)
  }
})

test('toolMetadata resolves for every registered tool', () => {
  for (const tool of DESIGNER_TOOLS) {
    const meta = toolMetadata(tool.href)
    assert.equal(meta.title, tool.seoTitle)
    assert.equal(meta.description, tool.description)
  }
})

test('a tool is never related to itself, and the rail is always full', () => {
  for (const tool of DESIGNER_TOOLS) {
    const related = relatedTools(tool.href)
    assert.equal(related.length, 3, `${tool.href} produced ${related.length} neighbours`)
    assert.ok(
      !related.some((other) => other.href === tool.href),
      `${tool.href} linked to itself`,
    )
    assert.equal(
      new Set(related.map((other) => other.href)).size,
      related.length,
      `${tool.href} listed the same neighbour twice`,
    )
  }
})

test('the order is deterministic — these render into static HTML', () => {
  const once = relatedTools('/tools/contrast').map((tool) => tool.href)
  const twice = relatedTools('/tools/contrast').map((tool) => tool.href)
  assert.deepEqual(once, twice)
})

test('shared keywords beat registry order', () => {
  // The contrast checker and the palette generator both talk about colour;
  // the email template builder does not. If ordering were positional this
  // would fail, since /tools/email sits earlier in the registry.
  const related = relatedTools('/tools/contrast').map((tool) => tool.href)
  assert.ok(
    related.includes('/tools/color') || related.includes('/tools/palette'),
    `expected a colour tool near the contrast checker, got ${related.join(', ')}`,
  )
})

test('an unknown route still yields a full rail rather than throwing', () => {
  // The rail reads `usePathname()`, which can be a route that is not a
  // tool at all — a redirect like /tools/fonts, or a trailing slash.
  assert.equal(relatedTools('/tools/does-not-exist').length, 3)
  assert.equal(relatedTools('').length, 3)
})
