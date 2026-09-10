import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { PLANS, isPurchasable, type PlanId } from './plans'
import { MONTHLY_ALLOWANCE } from './credits'

/**
 * Credits moved inside the licence. These are the invariants that make that
 * safe rather than expensive, and each one has a specific way of going
 * wrong quietly.
 */

test('Pro, Studio and Enterprise grant credits at purchase', () => {
  assert.equal(PLANS.pro.includedCredits, 500)
  assert.equal(PLANS.studio.includedCredits, 2500)
  assert.equal(PLANS.enterprise.includedCredits, 7500)
})

test('no one-time plan carries a monthly allowance', () => {
  /*
   * The expensive mistake, stated as a test. Attaching a recurring grant to
   * a single payment is unbounded cost against no revenue — a lifetime deal
   * that stops paying for itself. `includedCredits` is a grant; only a
   * subscription may appear in MONTHLY_ALLOWANCE.
   */
  const oneTime = (Object.keys(PLANS) as PlanId[]).filter(
    (id) => PLANS[id].interval === 'one_time',
  )

  for (const id of oneTime) {
    assert.equal(
      (MONTHLY_ALLOWANCE as Record<string, number | undefined>)[id],
      undefined,
      `${id} is a one-time purchase and must not carry a monthly allowance`,
    )
  }
})

test('Studio does not scale credits linearly with seats', () => {
  // Ten Pro licences would carry 5,000 credits between them. Studio is
  // deliberately under that, for the same reason it is under $790: it is a
  // discount for licensing a team, not the cheap way to buy a meter.
  const pro = PLANS.pro.includedCredits!
  const studio = PLANS.studio.includedCredits!
  const seats = PLANS.studio.includedSeats!
  assert.ok(studio < pro * seats, 'Studio would be the cheapest credits on the site')
  assert.ok(studio > pro, 'Studio must still grant more than a single Pro')
})

test('credits per seat fall as the licence grows, and never rise', () => {
  /*
   * The rule Studio's test states for one rung, applied along the whole
   * ladder. A tier whose per-seat grant went UP would make the bigger
   * licence the cheap way to buy a meter rather than the cheap way to
   * licence people — which is the failure a single pairwise check misses
   * once there are three rungs instead of two.
   */
  const rungs: PlanId[] = ['pro', 'studio', 'enterprise']
  const perSeat = rungs.map((id) => {
    const credits = PLANS[id].includedCredits!
    const seats = PLANS[id].includedSeats!
    return { id, rate: credits / seats }
  })

  for (let i = 1; i < perSeat.length; i += 1) {
    const prev = perSeat[i - 1]!
    const here = perSeat[i]!
    assert.ok(
      here.rate < prev.rate,
      `${here.id} grants ${here.rate} credits a seat against ${prev.id}'s ` +
        `${prev.rate} — the bigger licence must not be the cheaper meter`,
    )
  }
})

test('every seat ladder rung is cheaper per head than the one below', () => {
  /*
   * The reason Enterprise exists. A company that needs fifty seats must not
   * do better by buying the rung below five times over, or the tier is a
   * worse deal wearing a bigger number.
   */
  const rungs: PlanId[] = ['pro', 'studio', 'enterprise']
  const perHead = rungs.map((id) => ({
    id,
    cents: PLANS[id].priceCents / PLANS[id].includedSeats!,
  }))

  for (let i = 1; i < perHead.length; i += 1) {
    const prev = perHead[i - 1]!
    const here = perHead[i]!
    assert.ok(
      here.cents < prev.cents,
      `${here.id} costs ${here.cents} a head against ${prev.id}'s ` +
        `${prev.cents} — nobody would buy the larger licence`,
    )
  }
})

test('renewals grant no credits', () => {
  // A renewal buys another twelve months of updates on a licence already
  // held. Bundling credits into it would make renewing the cheapest way to
  // buy them, and someone would notice.
  assert.equal(PLANS.renewal.includedCredits, null)
  assert.equal(PLANS['renewal-studio'].includedCredits, null)
  assert.equal(PLANS['renewal-enterprise'].includedCredits, null)
})

test('Pro+ is retired, not deleted', () => {
  // The plan has to survive: people hold it, it renews, and an active
  // subscriber must keep the allowance they are paying for.
  assert.ok(PLANS.plus, 'the plan id must still exist for existing subscribers')
  assert.equal(PLANS.plus.sold, false)
  assert.equal(MONTHLY_ALLOWANCE.plus, 500, 'existing subscribers keep their allowance')
})

test('a retired plan cannot be checked out even when fully configured', () => {
  /*
   * The failure this guards: retiring a plan by deleting its card and
   * leaving the checkout route willing to sell it. The pricing page stops
   * mentioning Pro+ and a bookmarked link keeps taking money for it.
   * `isPurchasable` is the single predicate the UI and the route share.
   */
  assert.equal(isPurchasable({ ...PLANS.plus, polarProductId: 'prod_configured' }), false)
  assert.equal(isPurchasable({ ...PLANS.pro, polarProductId: 'prod_configured' }), true)
  // And an unconfigured live plan is still not purchasable.
  assert.equal(isPurchasable({ ...PLANS.pro, polarProductId: null }), false)
})

test('every sellable plan is still described by a name and a price', () => {
  for (const id of Object.keys(PLANS) as PlanId[]) {
    const plan = PLANS[id]
    if (!plan.sold || id === 'free') continue
    assert.ok(plan.name, `${id} has no name`)
    assert.ok(plan.priceCents > 0, `${id} has no price`)
    assert.ok(plan.priceInrPaise > 0, `${id} has no rupee price`)
  }
})
