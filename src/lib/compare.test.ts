import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  COMPETITORS,
  dateLabel,
  FRESH_COUNT,
  LAST_SWEEP,
  LAST_SWEEP_LABEL,
  OLDEST_CHECK,
  OLDEST_CHECK_LABEL,
  WHERE_THEY_WIN,
} from './compare'

/**
 * /compare is the one page whose entire argument is that we checked.
 *
 * It has exactly one failure mode and it is not a crash: the numbers go
 * quietly wrong in the competitors' favour, the page keeps rendering, and
 * nothing anywhere goes red. That is what happened between 23 August and
 * 10 September 2026 — React Bits raised every tier and more than doubled
 * its block count, Preline made its entire Figma system free, and the page
 * went on publishing the old figures under a date that said we had checked.
 *
 * So these tests are not really about the type system. They are the alarm
 * that the last eighteen days did not have.
 */

const ISO = /^\d{4}-\d{2}-\d{2}$/

test('every row carries a well-formed date that is not in the future', () => {
  const today = new Date().toISOString().slice(0, 10)
  for (const c of COMPETITORS) {
    assert.match(c.checkedOn, ISO, `${c.name} has a malformed checkedOn`)
    assert.ok(
      c.checkedOn <= today,
      `${c.name} claims to have been read on ${c.checkedOn}, which has not happened yet`,
    )
  }
  assert.match(LAST_SWEEP, ISO)
  assert.ok(LAST_SWEEP <= today, 'the sweep date is in the future')
})

test('no row is dated later than the sweep that produced it', () => {
  // A row newer than LAST_SWEEP means someone updated a vendor and forgot to
  // move the sweep date, which would make FRESH_COUNT undercount and the
  // headline date understate how current the page actually is.
  for (const c of COMPETITORS) {
    assert.ok(
      c.checkedOn <= LAST_SWEEP,
      `${c.name} is dated ${c.checkedOn}, after the ${LAST_SWEEP} sweep — move LAST_SWEEP`,
    )
  }
})

test('OLDEST_CHECK is derived, not asserted', () => {
  const min = COMPETITORS.reduce(
    (acc, c) => (c.checkedOn < acc ? c.checkedOn : acc),
    LAST_SWEEP,
  )
  assert.equal(OLDEST_CHECK, min)
  // The page renders this as "nothing here is older than X". If it were ever
  // newer than the oldest row, that sentence becomes a false claim about
  // every unreachable vendor at once.
  for (const c of COMPETITORS) {
    assert.ok(c.checkedOn >= OLDEST_CHECK, `${c.name} is older than OLDEST_CHECK`)
  }
})

test('FRESH_COUNT counts the rows the last sweep actually reached', () => {
  assert.equal(FRESH_COUNT, COMPETITORS.filter((c) => c.checkedOn === LAST_SWEEP).length)
  assert.ok(FRESH_COUNT <= COMPETITORS.length)
  // If a sweep reached nothing, the page should not be advertising the date.
  assert.ok(FRESH_COUNT > 0, 'LAST_SWEEP reached no rows at all')
})

test('dateLabel formats the way the page prints it, in any machine locale', () => {
  assert.equal(dateLabel('2026-09-10'), '10 September 2026')
  assert.equal(dateLabel('2026-08-23'), '23 August 2026')
  assert.equal(dateLabel('2026-01-01'), '1 January 2026')
  assert.equal(dateLabel('2026-12-31'), '31 December 2026')
  // The labels the page renders must agree with the dates it puts in
  // <time dateTime>, or the machine-readable and human-readable halves of
  // the same element disagree.
  assert.equal(LAST_SWEEP_LABEL, dateLabel(LAST_SWEEP))
  assert.equal(OLDEST_CHECK_LABEL, dateLabel(OLDEST_CHECK))
})

test('every row is sourced, priced and symmetric', () => {
  for (const c of COMPETITORS) {
    assert.ok(c.href.startsWith('https://'), `${c.name} has no https source`)
    assert.ok(c.ships.length > 0, `${c.name} ships nothing`)
    assert.ok(c.ladder.length > 0, `${c.name} has no ladder`)
    // The rule the file's docblock exists to enforce: a comparison where the
    // author wins every row is an advertisement.
    assert.ok(
      c.beatsUs.length > 40,
      `${c.name} has no real beatsUs — every competitor beats us at something`,
    )
    // `freeTier` is required and nullable, so "no free tier" has to be an
    // explicit null rather than an omission nobody noticed.
    assert.ok(
      c.freeTier === null || c.freeTier.length > 0,
      `${c.name} has an empty freeTier — use null to mean "nothing free"`,
    )
  }
})

test('the table is ordered cheapest paid licence first, subscriptions last', () => {
  // The page tells the reader this in prose, so a reordering that breaks it
  // makes the page lie by sorting.
  const oneTime = COMPETITORS.filter((c) => c.entryTerm !== 'per month')
  const prices = oneTime.map((c) => c.entryUsd ?? 0)
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b), 'one-time rows are out of order')

  const firstSubscription = COMPETITORS.findIndex((c) => c.entryTerm === 'per month')
  if (firstSubscription !== -1) {
    assert.equal(
      firstSubscription,
      COMPETITORS.length - COMPETITORS.filter((c) => c.entryTerm === 'per month').length,
      'a subscription row is sorted among the one-time licences',
    )
  }
})

test('we do not claim to be cheaper than the cheapest thing we listed', () => {
  // Not a price assertion — Pro's price lives in billing/plans.ts and this
  // file deliberately holds none of our own numbers. This only checks that
  // the field we sort on is populated, so "we are under the floor" stays a
  // statement someone can verify from the table rather than from memory.
  const paid = COMPETITORS.filter((c) => c.entryTerm === 'one-time')
  assert.ok(paid.length > 0)
  for (const c of paid) {
    assert.equal(typeof c.entryUsd, 'number', `${c.name} sells one-time with no price`)
  }
})

test('the honest-gaps list stays populated', () => {
  // WHERE_THEY_WIN is what buys belief for the rows we win. An empty or
  // one-item list means someone quietly trimmed the concessions, which is
  // the exact edit this page cannot survive.
  assert.ok(WHERE_THEY_WIN.length >= 4, 'the concessions list has been trimmed')
  for (const w of WHERE_THEY_WIN) {
    assert.ok(w.claim.length > 0)
    assert.ok(w.detail.length > 40, `"${w.claim}" concedes nothing specific`)
  }
})

/**
 * The alarm proper.
 *
 * Deliberately a test and not a prebuild check: a stale comparison should
 * turn `npm test` red, not block a deploy that has nothing to do with it.
 * 120 days is generous on purpose — this is meant to catch a page nobody has
 * looked at in a third of a year, not to nag at a sensible cadence.
 *
 * If this fails: re-read the vendor pages, update the rows you could reach,
 * stamp those with today, and move LAST_SWEEP. Do not move the dates of rows
 * you did not actually re-read — that is the whole reason they are per-row.
 */
test('the sweep is not older than 120 days', () => {
  const ageDays = (Date.now() - Date.parse(`${LAST_SWEEP}T00:00:00Z`)) / 86_400_000
  assert.ok(
    ageDays <= 120,
    `The last competitor sweep was ${Math.floor(ageDays)} days ago (${LAST_SWEEP}). ` +
      `/compare is publishing prices and counts that have almost certainly moved, ` +
      `under a page whose entire argument is that we checked. Re-read the vendors.`,
  )
})
