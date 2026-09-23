import assert from 'node:assert/strict'
import { test } from 'node:test'

import { pageWindow, type PageItem } from './sources/pagination'

/**
 * `pageWindow` is the one piece of the pagination primitive that is pure
 * arithmetic, and the one place a subtle mistake ships: an ellipsis standing
 * in for a single page, a window that changes width as you page (so the
 * control jitters under the cursor), or a first/last page that drops out.
 */

const show = (items: PageItem[]) =>
  items.map((i) => (i === 'gap-start' || i === 'gap-end' ? '…' : String(i))).join(' ')

test('few pages are all shown, with no ellipsis', () => {
  assert.equal(show(pageWindow(1, 1)), '1')
  assert.equal(show(pageWindow(3, 5)), '1 2 3 4 5')
  assert.equal(show(pageWindow(4, 7)), '1 2 3 4 5 6 7')
})

test('no pages is an empty window, not a crash', () => {
  assert.deepEqual(pageWindow(1, 0), [])
  assert.deepEqual(pageWindow(1, -3), [])
})

test('near the start, the far side collapses', () => {
  assert.equal(show(pageWindow(1, 20)), '1 2 3 4 5 … 20')
  assert.equal(show(pageWindow(3, 20)), '1 2 3 4 5 … 20')
})

test('in the middle, both sides collapse around the current page', () => {
  assert.equal(show(pageWindow(10, 20)), '1 … 9 10 11 … 20')
})

test('near the end, the near side collapses', () => {
  assert.equal(show(pageWindow(20, 20)), '1 … 16 17 18 19 20')
  assert.equal(show(pageWindow(18, 20)), '1 … 16 17 18 19 20')
})

test('the boundary between edge and middle: one missing page is drawn, two are elided', () => {
  // Page 5: pages 2 and 3 would be hidden — two pages, so an ellipsis is honest.
  assert.equal(show(pageWindow(5, 20)), '1 … 4 5 6 … 20')
  // Page 4: only page 2 would be hidden. An ellipsis for one page is longer than
  // the page, so the run extends and page 2 is drawn.
  assert.equal(show(pageWindow(4, 20)), '1 2 3 4 5 … 20')
  // The same boundary at the far end.
  assert.equal(show(pageWindow(16, 20)), '1 … 15 16 17 … 20')
  assert.equal(show(pageWindow(17, 20)), '1 … 16 17 18 19 20')
})

test('first and last are always present, and the current page is always inside', () => {
  for (let total = 1; total <= 40; total++) {
    for (let page = 1; page <= total; page++) {
      const items = pageWindow(page, total)
      assert.equal(items[0], 1, `${page}/${total} lost page 1`)
      assert.equal(items[items.length - 1], total, `${page}/${total} lost the last page`)
      assert.ok(items.includes(page), `${page}/${total} dropped the current page`)
    }
  }
})

test('every page of a long list draws the SAME number of cells, so the control never jitters', () => {
  // Not just the interior: the first version was seven cells in the middle and
  // three at page 1, and the control changed size under the cursor.
  for (const siblings of [0, 1, 2, 3]) {
    for (const total of [12, 20, 57, 200]) {
      const sizes = new Set<number>()
      for (let page = 1; page <= total; page++) sizes.add(pageWindow(page, total, siblings).length)
      assert.deepEqual([...sizes], [2 * siblings + 5], `siblings=${siblings} total=${total}`)
    }
  }
})

test('numbers are strictly ascending, so nothing is drawn twice or out of order', () => {
  for (let total = 1; total <= 30; total++) {
    for (let page = 1; page <= total; page++) {
      const nums = pageWindow(page, total).filter((i): i is number => typeof i === 'number')
      for (let i = 1; i < nums.length; i++) assert.ok(nums[i] > nums[i - 1], `${page}/${total}`)
    }
  }
})

test('an ellipsis never stands for a single page, or for none', () => {
  for (let total = 1; total <= 40; total++) {
    for (let page = 1; page <= total; page++) {
      const items = pageWindow(page, total)
      items.forEach((item, i) => {
        if (typeof item === 'number') return
        const before = items[i - 1] as number
        const after = items[i + 1] as number
        assert.ok(after - before > 2, `${page}/${total}: "…" between ${before} and ${after} hides <2 pages`)
      })
    }
  }
})

test('out-of-range and fractional input is clamped rather than trusted', () => {
  assert.equal(show(pageWindow(99, 10)), show(pageWindow(10, 10)))
  assert.equal(show(pageWindow(-5, 10)), show(pageWindow(1, 10)))
  assert.equal(show(pageWindow(3.7, 10)), show(pageWindow(3, 10)))
})

test('more siblings widen the window', () => {
  assert.equal(show(pageWindow(10, 30, 2)), '1 … 8 9 10 11 12 … 30')
  assert.equal(show(pageWindow(10, 30, 0)), '1 … 10 … 30')
})
