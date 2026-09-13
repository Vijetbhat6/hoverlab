import assert from 'node:assert/strict'
import { test } from 'node:test'

import { PAGE_CATALOG } from './catalog'
import { PAGE_INDEX, getPageMeta, takeNumber, takesOfPage } from './page-index'

/**
 * Two takes of one page type are a claim, not a styling choice.
 *
 * The claim is that each pair makes a *different bet* about who is reading —
 * that is the whole reason the second take exists, and it is the only thing
 * distinguishing this from shipping the same page twice with new copy. The
 * pointer that encodes the pair is one-directional and optional, which makes
 * it exactly the kind of field that rots quietly: nothing on the site looks
 * broken when a `takeOf` stops resolving, the pair rail simply stops
 * rendering and the two pages drift apart as unrelated catalog entries.
 *
 * `scripts/check-page-takes.mts` guards the pointer at build time. These
 * tests guard the derivation on top of it — the half a broken pointer would
 * not reach, and the half the UI actually calls.
 */

const takes = PAGE_CATALOG.filter((p) => p.takeOf)
const byId = new Map(PAGE_CATALOG.map((p) => [p.id, p]))

test('every take names a page that exists and is not itself a take', () => {
  assert.ok(takes.length > 0, 'no second takes in the catalog at all')

  for (const page of takes) {
    const origin = byId.get(page.takeOf!)
    assert.ok(origin, `${page.id}: takeOf "${page.takeOf}" resolves to nothing`)
    assert.notEqual(origin.id, page.id, `${page.id}: takeOf names itself`)
    assert.equal(
      origin.takeOf,
      undefined,
      `${page.id}: takes do not chain — "${origin.id}" is itself a take`,
    )
  }
})

test('takesOfPage works from either end of the pair, take 01 first', () => {
  for (const page of takes) {
    const fromTake = takesOfPage(page.id)
    const fromOrigin = takesOfPage(page.takeOf!)

    assert.deepEqual(
      fromTake.map((p) => p.id),
      fromOrigin.map((p) => p.id),
      `${page.id}: the two ends of the pair disagree about the group`,
    )
    assert.equal(fromTake[0]?.id, page.takeOf, `${page.id}: take 01 is not first`)
    assert.ok(fromTake.some((p) => p.id === page.id), `${page.id}: missing from its own group`)
  }
})

/**
 * Empty rather than `[self]` for a lone page. A one-element answer would
 * have every caller writing `length > 1`, and the one that forgot would
 * render "Take 1 of 1" on a page with nothing to choose between.
 */
test('a page type with one layout reports no takes and no take number', () => {
  const lonely = PAGE_INDEX.filter(
    (p) => !p.takeOf && !takes.some((t) => t.takeOf === p.id),
  )
  assert.ok(lonely.length > 0, 'expected at least one single-layout page type')

  for (const page of lonely) {
    assert.deepEqual(takesOfPage(page.id), [], `${page.id}: reported takes it does not have`)
    assert.equal(takeNumber(page.id), undefined, `${page.id}: got a take number`)
  }
})

test('takeNumber is 1-based and consistent with the group it came from', () => {
  for (const page of takes) {
    const label = takeNumber(page.id)
    assert.ok(label, `${page.id}: no take number`)
    assert.equal(label.of, takesOfPage(page.id).length)
    assert.ok(label.n >= 1 && label.n <= label.of, `${page.id}: take ${label.n} of ${label.of}`)

    const origin = takeNumber(page.takeOf!)
    assert.equal(origin?.n, 1, `${page.takeOf}: take 01 is not numbered 1`)
  }
})

test('unknown ids are answered, not thrown at', () => {
  assert.deepEqual(takesOfPage('no-such-page'), [])
  assert.equal(takeNumber('no-such-page'), undefined)
})

/**
 * The pair has to survive being rendered side by side, so both halves need
 * the metadata the card reads. A take whose category drifted from its
 * sibling's would also split the pair across two /pages sections, which is
 * the one place the reader is most likely to be comparing them.
 */
test('both halves of a pair carry the same category and real metadata', () => {
  for (const page of takes) {
    const origin = byId.get(page.takeOf!)!
    assert.equal(
      page.category,
      origin.category,
      `${page.id}: category drifted from "${origin.id}"`,
    )

    for (const id of [page.id, origin.id]) {
      const meta = getPageMeta(id)
      assert.ok(meta, `${id}: no metadata`)
      assert.ok(meta.lines > 0, `${id}: zero lines — build:artifacts has not run`)
      assert.ok(meta.composedOf.length > 0, `${id}: composes no blocks`)
    }
  }
})

/**
 * The point of the pair. Two takes that render the same blocks in the same
 * order are the same page with different words, and the catalog would be
 * claiming a choice it does not offer.
 */
test('a take composes a materially different set of blocks from take 01', () => {
  for (const page of takes) {
    const origin = byId.get(page.takeOf!)!
    assert.notDeepEqual(
      page.composedOf,
      origin.composedOf,
      `${page.id}: identical composition to "${origin.id}"`,
    )

    const shared = page.composedOf.filter((b) => origin.composedOf.includes(b))
    const union = new Set([...page.composedOf, ...origin.composedOf])
    assert.ok(
      shared.length / union.size < 0.75,
      `${page.id}: ${shared.length} of ${union.size} blocks shared with "${origin.id}" — ` +
        'that is a restyle, not a second take',
    )
  }
})
