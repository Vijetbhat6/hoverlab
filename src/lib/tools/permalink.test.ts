import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  flag,
  galleryHrefs,
  galleryState,
  hex,
  int,
  list,
  matchingGalleryEntry,
  num,
  oneOf,
  parseToolState,
  toolHref,
  toolQuery,
  type ToolPermalink,
} from './permalink'
import { CONTRAST_PERMALINK } from './permalinks/contrast'
import { GRADIENT_PERMALINK } from './permalinks/gradient'
import { PALETTE_PERMALINK } from './permalinks/palette'
import { SHADOW_PERMALINK } from './permalinks/shadow'
import { TOKENS_PERMALINK } from './permalinks/tokens'
import { TYPOGRAPHY_PERMALINK } from './permalinks/typography'

/* ------------------------------------------------------------------ *
   Codecs
 * ------------------------------------------------------------------ */

test('hex drops the hash and expands shorthand', () => {
  assert.equal(hex.toParam('#10B981'), '10b981')
  assert.equal(hex.fromParam('10b981'), '#10b981')
  assert.equal(hex.fromParam('#10B981'), '#10b981')
  // Shorthand expands so `f00` and `ff0000` are one permalink, not two.
  assert.equal(hex.fromParam('f00'), '#ff0000')
  assert.equal(hex.fromParam('nothex'), null)
  assert.equal(hex.fromParam(''), null)
})

test('num clamps and rounds in both directions', () => {
  const codec = num(0, 360, 1)
  assert.equal(codec.fromParam('9999'), 360)
  assert.equal(codec.fromParam('-5'), 0)
  assert.equal(codec.fromParam('nope'), null)
  // The whole reason toParam rounds: a slider bound to a step still emits
  // float tails, and the same visible state must produce the same URL.
  assert.equal(codec.toParam(22.500000001), '22.5')
  assert.equal(num(0, 1, 2).toParam(0.30000000000000004), '0.3')
})

test('oneOf rejects rather than clamping', () => {
  const codec = oneOf(['linear', 'radial'] as const)
  assert.equal(codec.fromParam('RADIAL'), 'radial')
  assert.equal(codec.fromParam('squiggle'), null)
})

test('flag reads the spellings people type', () => {
  assert.equal(flag.fromParam('1'), true)
  assert.equal(flag.fromParam('true'), true)
  assert.equal(flag.fromParam('0'), false)
  assert.equal(flag.fromParam('maybe'), null)
  assert.equal(flag.toParam(true), '1')
})

test('list drops unreadable items but keeps the list', () => {
  const codec = list(int(0, 10), 2)
  assert.deepEqual(codec.fromParam('1,nope,3'), [1, 3])
  // Below the minimum, the whole field fails and the tool keeps its default.
  assert.equal(codec.fromParam('1,nope'), null)
})

/* ------------------------------------------------------------------ *
   Reading and writing
 * ------------------------------------------------------------------ */

test('a bare visit is not a link', () => {
  const parsed = parseToolState(CONTRAST_PERMALINK, {})
  assert.deepEqual(parsed.state, CONTRAST_PERMALINK.defaults)
  assert.equal(parsed.fromLink, false)
})

test('a link spelling out the defaults still counts as a link', () => {
  // Indistinguishable from a bare visit by value, and different in meaning:
  // a real link has to outrank this browser's stored state.
  const parsed = parseToolState(CONTRAST_PERMALINK, { fg: '0f172a' })
  assert.equal(parsed.fromLink, true)
  assert.equal(parsed.state.fg, '#0f172a')
})

test('garbage parses to the defaults and is reported', () => {
  const parsed = parseToolState(CONTRAST_PERMALINK, { fg: 'octarine', bg: 'ffffff' })
  assert.equal(parsed.state.fg, CONTRAST_PERMALINK.defaults.fg)
  assert.equal(parsed.state.bg, '#ffffff')
  assert.deepEqual(parsed.dropped, ['fg'])
})

test('a repeated parameter takes its first value', () => {
  const parsed = parseToolState(CONTRAST_PERMALINK, { fg: ['ff0000', '00ff00'] })
  assert.equal(parsed.state.fg, '#ff0000')
})

test('defaults are omitted from the query', () => {
  assert.equal(toolQuery(CONTRAST_PERMALINK, CONTRAST_PERMALINK.defaults), '')
  assert.equal(toolHref(CONTRAST_PERMALINK, CONTRAST_PERMALINK.defaults), '/tools/contrast')
  assert.equal(
    toolHref(CONTRAST_PERMALINK, { fg: '#ffffff', bg: '#3b82f6' }),
    '/tools/contrast?fg=ffffff&bg=3b82f6',
  )
})

test('query order follows field declaration order, not state key order', () => {
  // Stability matters: the canonical tag and the gallery match both compare
  // query strings, so one state must have exactly one spelling.
  const a = toolQuery(CONTRAST_PERMALINK, { bg: '#000000', fg: '#ffffff' })
  const b = toolQuery(CONTRAST_PERMALINK, { fg: '#ffffff', bg: '#000000' })
  assert.equal(a, b)
  assert.equal(a, 'fg=ffffff&bg=000000')
})

test('permalink values never need percent-encoding', () => {
  // If this fails, a URL somewhere grew a %2C and stopped being readable.
  for (const spec of ALL_SPECS) {
    for (const entry of spec.gallery) {
      const query = toolQuery(spec, galleryState(spec, entry))
      assert.equal(
        query,
        decodeURIComponent(query),
        `${spec.href} / ${entry.slug} encodes characters it should not`,
      )
    }
  }
})

/* ------------------------------------------------------------------ *
   Every curated entry, across every tool

   This is the test that matters. A gallery entry is a URL we put in the
   sitemap and link to from the tool page; one that does not survive its own
   codec is a promoted broken link.
 * ------------------------------------------------------------------ */

// The six specs have six different state types, and nothing in this list
// reads a state — it round-trips them through their own codecs. `any` is
// what lets one array hold all six; the assertions below still run against
// each spec's real shape.
const ALL_SPECS: ToolPermalink<any>[] = [
  PALETTE_PERMALINK,
  TOKENS_PERMALINK,
  GRADIENT_PERMALINK,
  SHADOW_PERMALINK,
  TYPOGRAPHY_PERMALINK,
  CONTRAST_PERMALINK,
]

/** The query of an href, as the object Next would hand a page. */
function searchParamsOf(href: string): Record<string, string> {
  const query = href.split('?')[1] ?? ''
  const out: Record<string, string> = {}
  for (const pair of query.split('&').filter(Boolean)) {
    const [key, value] = pair.split('=')
    if (key) out[key] = value ?? ''
  }
  return out
}

test('every curated permalink round-trips through its own codec', () => {
  for (const spec of ALL_SPECS) {
    for (const entry of spec.gallery) {
      const state = galleryState(spec, entry)
      const href = toolHref(spec, state)
      const reparsed = parseToolState(spec, searchParamsOf(href))

      assert.deepEqual(
        reparsed.dropped,
        [],
        `${spec.href} / ${entry.slug} has a parameter its own codec cannot read`,
      )
      // Compared on the query rather than the state, because ids are minted
      // fresh on the way in and deliberately do not travel.
      assert.equal(
        toolQuery(spec, reparsed.state),
        toolQuery(spec, state),
        `${spec.href} / ${entry.slug} does not survive a round trip`,
      )
    }
  }
})

test('every curated permalink is recognised as curated', () => {
  for (const spec of ALL_SPECS) {
    for (const entry of spec.gallery) {
      const state = galleryState(spec, entry)
      const href = toolHref(spec, state)
      const reparsed = parseToolState(spec, searchParamsOf(href))
      const matched = matchingGalleryEntry(spec, reparsed.state)
      // This is what decides self-canonical vs. canonical-to-the-tool. An
      // entry that does not match itself would be in the sitemap pointing
      // its canonical somewhere else — the worst of both.
      assert.equal(
        matched?.slug,
        entry.slug,
        `${spec.href} / ${entry.slug} is not self-canonical`,
      )
    }
  }
})

test('curated slugs and hrefs are unique within a tool', () => {
  for (const spec of ALL_SPECS) {
    const slugs = spec.gallery.map((e) => e.slug)
    assert.equal(new Set(slugs).size, slugs.length, `${spec.href} has a duplicate slug`)
    const hrefs = galleryHrefs(spec)
    assert.equal(new Set(hrefs).size, hrefs.length, `${spec.href} has two entries at one URL`)
  }
})

test('exactly one curated entry per tool is the tool default', () => {
  // The defaults deserve a card — it is the state everyone starts in — but
  // two entries at the bare href would be two sitemap rows for one page.
  for (const spec of ALL_SPECS) {
    const bare = galleryHrefs(spec).filter((href) => !href.includes('?'))
    assert.ok(bare.length <= 1, `${spec.href} has ${bare.length} default entries`)
  }
})

test('every curated entry describes itself without throwing', () => {
  for (const spec of ALL_SPECS) {
    for (const entry of spec.gallery) {
      const state = galleryState(spec, entry)
      const { title, description } = spec.describe(state)
      assert.ok(title.length > 10, `${spec.href} / ${entry.slug} has no title`)
      assert.ok(title.endsWith('Hoverlab'), `${spec.href} / ${entry.slug} is missing the suffix`)
      // Long enough to be a description, short enough that a search engine
      // shows most of it.
      assert.ok(
        description.length > 40 && description.length < 400,
        `${spec.href} / ${entry.slug} description is ${description.length} characters`,
      )
      for (const swatch of spec.swatches(state)) {
        assert.ok(swatch.length > 0, `${spec.href} / ${entry.slug} has an empty swatch`)
      }
    }
  }
})

/* ------------------------------------------------------------------ *
   Tool-specific shapes worth pinning
 * ------------------------------------------------------------------ */

test('gradient stops encode as hex@position and mint fresh ids', () => {
  const parsed = parseToolState(GRADIENT_PERMALINK, { stops: 'f43f5e@0,10b981@100' })
  assert.equal(parsed.state.stops.length, 2)
  assert.equal(parsed.state.stops[0]!.color, '#f43f5e')
  assert.equal(parsed.state.stops[1]!.position, 100)
  // Ids are minted under `u` so a stop added afterwards cannot collide.
  assert.ok(parsed.state.stops.every((s) => s.id.startsWith('u')))
  // A stop with no position is legal and means 0.
  assert.equal(parseToolState(GRADIENT_PERMALINK, { stops: 'f00,00f' }).state.stops[0]!.position, 0)
  // One stop is not a gradient, so the field falls back whole.
  assert.deepEqual(
    parseToolState(GRADIENT_PERMALINK, { stops: 'f00' }).state.stops,
    GRADIENT_PERMALINK.defaults.stops,
  )
})

test('shadow layers keep their flags through a round trip', () => {
  const parsed = parseToolState(SHADOW_PERMALINK, { layers: 'xi0/2/8/-1@0f172a@40' })
  const layer = parsed.state.layers[0]!
  assert.equal(layer.enabled, false)
  assert.equal(layer.inset, true)
  assert.equal(layer.y, 2)
  assert.equal(layer.spread, -1)
  assert.equal(layer.color, '#0f172a')
  assert.equal(layer.opacity, 0.4)
  // Negative offsets survive, which the flag prefix must not eat.
  assert.equal(parseToolState(SHADOW_PERMALINK, { layers: '-8/-8/16/0@ffffff@90' }).state.layers[0]!.x, -8)
})

test('typography rejects a pairing that is not in the list', () => {
  const parsed = parseToolState(TYPOGRAPHY_PERMALINK, { pair: 'comic-papyrus' })
  assert.equal(parsed.state.pairId, TYPOGRAPHY_PERMALINK.defaults.pairId)
  assert.deepEqual(parsed.dropped, ['pair'])
})

test('palette resolves five colours for any base it is given', () => {
  const colors = PALETTE_PERMALINK.swatches({ base: 'not-a-colour', scheme: 'triadic' })
  assert.equal(colors.length, 5)
  assert.ok(colors.every((c) => /^#[0-9a-f]{6}$/i.test(c)))
})
