import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  PLANS,
  BAND_CENTS,
  IN_PAISE,
  USD_TO_INR,
  type Band,
  type PlanId,
} from './plans'

/**
 * The price catalog has two ladders — dollars and rupees — and four bands
 * hanging off each. Nothing in the type system relates them, so a plan can
 * be added with a rupee price copied from the wrong rung and every page
 * still renders, every checkout still succeeds, and the only symptom is a
 * regional buyer who quietly gets no discount.
 *
 * That is not hypothetical: `team-annual`'s list rupee price was derived
 * from band A's monthly seat price instead of the list one, which made
 * India's annual band price identical to list. The pricing page showed a
 * discount rail with the same number on both sides and the provisioning
 * script declined to create the discount, because there was nothing to take
 * off. It took a `--dry-run` to notice.
 *
 * These assertions are what that bug would have tripped. They read the
 * catalog as data rather than testing any function, because the catalog IS
 * the behaviour here — the accessors around it are trivial.
 */

const BANDS: Band[] = ['a', 'b', 'c']

/** Plans a region can be given a cheaper price for. Excludes the free tier. */
const BANDED = Object.keys(BAND_CENTS.a) as PlanId[]

describe('band prices sit below list', () => {
  for (const band of BANDS) {
    for (const plan of BANDED) {
      test(`band ${band} / ${plan} (USD)`, () => {
        const list = PLANS[plan].priceCents
        const banded = BAND_CENTS[band][plan]
        assert.ok(banded !== undefined, `${plan} missing from band ${band}`)
        assert.ok(
          banded < list,
          `band ${band} charges ${banded} for ${plan}, list is ${list} — ` +
            `a band at or above list advertises a discount it cannot apply`,
        )
      })
    }
  }

  for (const plan of BANDED) {
    test(`India / ${plan} (INR)`, () => {
      const list = PLANS[plan].priceInrPaise
      const banded = IN_PAISE[plan]
      assert.ok(banded !== undefined, `${plan} missing from IN_PAISE`)
      assert.ok(
        banded < list,
        `India charges ${banded} paise for ${plan}, list is ${list} — ` +
          `equal means the rupee buyer gets no regional price at all`,
      )
    })
  }
})

/**
 * The annual term is sold as ten months' price for twelve months' term. That
 * ratio is the plan's entire pitch, so it has to hold on every rung of both
 * ladders — otherwise one region's annual is a worse deal than its monthly
 * and the plan argues against itself.
 */
describe('annual is ten months of monthly, on every rung', () => {
  test('list (USD)', () => {
    assert.equal(PLANS['team-annual'].priceCents, PLANS.team.priceCents * 10)
  })

  test('list (INR)', () => {
    assert.equal(
      PLANS['team-annual'].priceInrPaise,
      PLANS.team.priceInrPaise * 10,
    )
  })

  for (const band of BANDS) {
    test(`band ${band} (USD)`, () => {
      assert.equal(BAND_CENTS[band]['team-annual'], BAND_CENTS[band].team! * 10)
    })
  }

  test('India (INR)', () => {
    assert.equal(IN_PAISE['team-annual'], IN_PAISE.team! * 10)
  })
})

/**
 * Bands are meant to deepen monotonically — C is the shallow nudge, A the
 * deep one. A band that overtakes a shallower one is a routing bug waiting
 * to happen: a country moved between bands would then get a WORSE price for
 * having been moved to a poorer one.
 */
describe('bands deepen from C to A', () => {
  for (const plan of BANDED) {
    test(plan, () => {
      const [a, b, c] = BANDS.map((band) => BAND_CENTS[band][plan]!)
      assert.ok(a < b, `band A (${a}) must undercut band B (${b}) for ${plan}`)
      assert.ok(b < c, `band B (${b}) must undercut band C (${c}) for ${plan}`)
    })
  }
})

/**
 * Every rupee figure the site RENDERS is a conversion of the dollar price at
 * the pinned `USD_TO_INR`, while every rupee figure it CHARGES comes from
 * `priceInrPaise` / `IN_PAISE`. The two are allowed to disagree — Polar
 * converts at its own rate and the rendered number is labelled approximate —
 * but only by rounding, never by a ladder.
 *
 * This is the assertion the `team-annual` bug actually violated, and it
 * violated it by 2.4x: the card advertised roughly ₹11,520 and the rupee
 * checkout would have taken ₹4,750. Five percent is the same tolerance the
 * `USD_TO_INR` docstring uses to decide when the pinned rate needs revising,
 * and the widest real gap here is Studio's 2.5%, so it has room to breathe
 * without going slack.
 */
describe('the rupee charged is the rupee rendered, within rounding', () => {
  const TOLERANCE = 0.05

  const near = (paise: number, cents: number, what: string) => {
    const converted = (cents / 100) * USD_TO_INR * 100
    const drift = Math.abs(paise - converted) / converted
    assert.ok(
      drift < TOLERANCE,
      `${what}: charges ${paise / 100} rupees but renders as ` +
        `~${Math.round(converted / 100)} — ${(drift * 100).toFixed(1)}% apart, ` +
        `which is a different price rather than a rounding difference`,
    )
  }

  for (const plan of Object.keys(PLANS) as PlanId[]) {
    if (PLANS[plan].priceCents === 0) continue
    test(`list / ${plan}`, () => {
      near(PLANS[plan].priceInrPaise, PLANS[plan].priceCents, `list ${plan}`)
    })
  }

  for (const plan of BANDED) {
    test(`India / ${plan}`, () => {
      near(IN_PAISE[plan]!, BAND_CENTS.a[plan]!, `India ${plan}`)
    })
  }
})
