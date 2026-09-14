import assert from 'node:assert/strict'
import { test } from 'node:test'

import { catalogWaves } from './recency'
import {
  CATALOG_WAVES,
  LEDGER_BUILT_AT,
  SHIPPING_WINDOW_DAYS,
  shippingWindow,
  windowOf,
  type VelocityWave,
} from './velocity'

/**
 * The velocity summary is a claim about how hard we are working, rendered on
 * our own landing page. Two things can go wrong with it and neither one
 * crashes:
 *
 *   - it drifts from the ledger `/changelog` renders, so the front door and
 *     the changelog describe the same week differently;
 *   - it keeps saying "shipped this week" over a wave from last month,
 *     which is the fabricated-social-proof failure in a different costume.
 *
 * Both are cheap to pin down, because the only impure input is a committed
 * JSON file and `windowOf` takes its waves as an argument.
 */

/** A quiet ledger: one batch, then nothing. */
const QUIET: VelocityWave[] = [
  { date: '2026-08-01', level: 'block', count: 3 },
  { date: '2026-08-01', level: 'page', count: 1 },
  { date: '2026-07-02', level: 'effect', count: 40 },
]

test('the summary agrees with the ledger the changelog renders', () => {
  // The whole reason the summary is a separate file is bundle size, not a
  // separate source of truth. If these two ever group or order differently,
  // "+35 blocks" on the front door stops matching the batch a visitor finds
  // when they click through.
  const full = catalogWaves()
  assert.equal(CATALOG_WAVES.length, full.length)

  for (const [i, wave] of full.entries()) {
    const summary = CATALOG_WAVES[i]!
    assert.equal(summary.date, wave.date)
    assert.equal(summary.level, wave.level)
    assert.equal(summary.count, wave.ids.length)
  }
})

test('the committed window reports the days it says it reports', () => {
  const week = shippingWindow()
  assert.equal(week.to, LEDGER_BUILT_AT)
  for (const wave of week.waves) {
    assert.ok(wave.date >= week.from, `${wave.date} is before ${week.from}`)
    assert.ok(wave.date <= week.to, `${wave.date} is after ${week.to}`)
  }
  assert.equal(
    week.total,
    week.byLevel.reduce((n, entry) => n + entry.count, 0),
  )
})

test('a quiet week says so rather than stretching the last batch over it', () => {
  // Six weeks after the last batch. The band above this data reads "Last
  // shipment" and prints 1 Aug — it does not read "Shipped this week".
  const week = windowOf(QUIET, '2026-09-14')

  assert.equal(week.fresh, false)
  assert.equal(week.total, 4)
  // One day, not seven: the fallback collapses the range onto the batch it
  // is actually describing, so no caller can print a week over one day.
  assert.equal(week.from, '2026-08-01')
  assert.equal(week.to, '2026-08-01')
  assert.deepEqual(
    week.byLevel.map((entry) => entry.level),
    ['block', 'page'],
  )
})

test('the window is inclusive at both ends, and exactly seven days wide', () => {
  const anchor = '2026-08-07'
  const week = windowOf(QUIET, anchor, SHIPPING_WINDOW_DAYS)

  assert.equal(week.fresh, true)
  assert.equal(week.from, '2026-08-01') // the seventh day back, still counted
  assert.equal(week.to, anchor)
  assert.equal(week.total, 4)

  // One day narrower and the same batch falls out — which is the arithmetic
  // an off-by-one here would quietly get wrong in the generous direction.
  assert.equal(windowOf(QUIET, '2026-08-08').fresh, false)
})

test('rungs that gained nothing are absent, not zeroed', () => {
  const week = windowOf(QUIET, '2026-08-01')
  assert.ok(week.byLevel.every((entry) => entry.count > 0))
  // "+0 templates" on a landing page is a worse answer than no row at all.
  assert.ok(!week.byLevel.some((entry) => entry.level === 'template'))
})

test('an empty ledger reports nothing, so the band can render nothing', () => {
  const week = windowOf([], '2026-09-14')
  assert.equal(week.total, 0)
  assert.equal(week.fresh, false)
  assert.deepEqual(week.waves, [])
  assert.deepEqual(week.byLevel, [])
})
