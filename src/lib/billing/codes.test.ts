import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * `publicOfferFor` is the one function in this codebase whose output is a
 * public claim about what a card is about to be charged. Everything else
 * that can be wrong about pricing is wrong on a page somebody has already
 * decided to buy from; this is wrong on every page on the site, above the
 * nav, to visitors who have not yet decided anything.
 *
 * The Polar organisation it reads is still being filled in — a handful of
 * the thirty-five discounts exist — so the states worth testing are the
 * half-configured ones, not the finished one. Each case below is a state
 * the dashboard can genuinely be left in for a week.
 *
 * WHY HALF OF THIS RUNS IN A CHILD PROCESS
 *
 * `plans.ts` reads POLAR_DISCOUNT_ID_* once, at module load, on purpose —
 * its docblock calls that "a boot-time fact instead of a per-request one".
 * Which means no amount of setting `process.env` inside a running test can
 * change a discount id, and a cache-busting `import('./codes.ts?gen=1')`
 * does not help either: the fresh copy of codes.ts resolves `./plans` to
 * the plans module already in the registry. A test that looked like it was
 * varying the ids would have been asserting one environment eleven times.
 *
 * So cases that turn a discount id on get a real process with a real
 * environment, and cases that only vary the coupon pair — which `codes.ts`
 * reads per call — stay in-process and cheap.
 */

const HERE = fileURLToPath(new URL('.', import.meta.url))
const SOURCE = readFileSync(`${HERE}codes.ts`, 'utf8')

/**
 * `codes.ts` as a file:// URL, for the child process to import.
 *
 * A bare Windows path reaches Node's ESM loader as the scheme "c:" and is
 * rejected outright, so the absolute path a `require` would have taken is
 * not usable here.
 */
const CODES_URL = new URL('./codes.ts', import.meta.url).href

/** Every region the bar can speak for, in the order the bands are defined. */
const REGIONS = ['IN', 'ppp-a', 'ppp-b', 'ppp-c', 'default'] as const
type RegionName = (typeof REGIONS)[number]

/** `PublicOffer` as it survives a JSON round trip out of the child. */
interface Offer {
  kind: 'automatic' | 'code'
  code: string | null
  percentOff: number | null
  entryPrice: string | null
  listPrice: string
}

/**
 * Load `codes.ts` in a fresh process under `env` and return what it would
 * advertise in every region.
 *
 * The child inherits the parent's environment minus the keys below, so a
 * developer who has real ids in their shell does not get a different test
 * run than CI does.
 */
function offersUnder(env: Record<string, string>): Record<RegionName, Offer | null> {
  const script = `
    const { publicOfferFor } = await import(${JSON.stringify(CODES_URL)})
    const out = {}
    for (const region of ${JSON.stringify(REGIONS)}) out[region] = publicOfferFor(region)
    process.stdout.write(JSON.stringify(out))
  `
  const clean = { ...process.env }
  for (const key of Object.keys(clean)) {
    if (key.startsWith('POLAR_DISCOUNT_ID_') || key.startsWith('POLAR_PPP_')) {
      delete clean[key]
    }
  }
  const stdout = execFileSync(
    process.execPath,
    ['--import=tsx', '--input-type=module', '--eval', script],
    { env: { ...clean, ...env }, encoding: 'utf8' },
  )
  return JSON.parse(stdout) as Record<RegionName, Offer | null>
}

/** In-process load of `codes.ts` — valid only for cases that set no ids. */
let generation = 0
async function couponOffer(env: Record<string, string>) {
  for (const key of Object.keys(process.env)) {
    if (key.startsWith('POLAR_PPP_')) delete process.env[key]
  }
  Object.assign(process.env, env)
  generation += 1
  const mod = (await import(`./codes.ts?gen=${generation}`)) as typeof import('./codes')
  return mod.publicOfferFor
}

describe('publicOfferFor — nothing configured', () => {
  test('says nothing at all', () => {
    const offers = offersUnder({})
    for (const region of REGIONS) {
      assert.equal(offers[region], null, `${region} advertised something`)
    }
  })
})

describe('publicOfferFor — a discount id is set', () => {
  const offers = offersUnder({ POLAR_DISCOUNT_ID_PPP_B_PRO: 'disc_b_pro' })

  test('advertises the price, and no code', () => {
    const offer = offers['ppp-b']
    assert.ok(offer, 'band B advertised nothing')
    assert.equal(offer.kind, 'automatic')
    // The whole point of the automatic shape: checkout sets
    // `allowDiscountCodes: false`, so a code here would be rejected at the
    // till after the bar had promised it would work.
    assert.equal(offer.code, null)
    assert.equal(offer.percentOff, null)
    assert.equal(offer.entryPrice, '$39')
    assert.equal(offer.listPrice, '$79')
  })

  test('says nothing for the bands that id does not cover', () => {
    // One id is one band's one plan. The half-configured state is the
    // normal state here, and the other three bands have to stay silent
    // through it rather than inheriting band B's claim.
    for (const region of ['IN', 'ppp-a', 'ppp-c', 'default'] as const) {
      assert.equal(offers[region], null, `${region} borrowed band B's discount`)
    }
  })
})

describe('publicOfferFor — an id and a coupon are both set', () => {
  test('the id wins and the coupon is not advertised', () => {
    // The state the dashboard passes through while ids are being filled
    // in: the coupon was the stopgap and nobody has unset it yet. Printing
    // it now would send buyers to a checkout that refuses typed codes.
    const offers = offersUnder({
      POLAR_DISCOUNT_ID_PPP_B_PRO: 'disc_b_pro',
      POLAR_PPP_CODE_B: 'BRAZIL50',
      POLAR_PPP_PERCENT_B: '50',
    })
    assert.equal(offers['ppp-b']?.kind, 'automatic')
    assert.equal(offers['ppp-b']?.code, null)
  })
})

describe('publicOfferFor — the equal-price guard', () => {
  /*
    `presentmentCurrencyFor` turns India's checkout rupee once
    POLAR_DISCOUNT_ID_IN_PRO_INR is set, but the rupee figure itself comes
    from `IN_PAISE` in the source rather than from the environment — two
    inputs that can disagree. When they do, `priceInrForRegion` falls back
    to list, which is right and safe at the till and reads, in the bar, as
    "Pro is ₹7,500 here, not ₹7,500".
  */
  test('a real saving is advertised in the currency it will be charged in', () => {
    const offers = offersUnder({
      POLAR_DISCOUNT_ID_IN_PRO: 'disc_in_pro',
      POLAR_DISCOUNT_ID_IN_PRO_INR: 'disc_in_pro_inr',
    })
    const offer = offers.IN
    assert.ok(offer, 'India advertised nothing with both ids set')
    assert.equal(offer.kind, 'automatic')
    assert.match(offer.entryPrice ?? '', /₹/, 'quoted dollars to a rupee checkout')
    assert.notEqual(offer.entryPrice, offer.listPrice)
  })

  test('no automatic offer ever prints its two figures the same', () => {
    // Three environments rather than every combination: each spawns a
    // process, and these are the three that reach the guard by different
    // routes — a dollar discount with a dollar price, a rupee discount
    // whose currency switch depends on the same id, and the deepest band.
    // The both-ids case is already covered by the test above it.
    const cases: Record<string, string>[] = [
      { POLAR_DISCOUNT_ID_IN_PRO: 'a' },
      { POLAR_DISCOUNT_ID_IN_PRO_INR: 'a' },
      { POLAR_DISCOUNT_ID_PPP_A_PRO: 'a' },
    ]
    for (const env of cases) {
      const offers = offersUnder(env)
      for (const region of REGIONS) {
        const offer = offers[region]
        if (offer?.kind !== 'automatic') continue
        assert.notEqual(
          offer.entryPrice,
          offer.listPrice,
          `${region} advertised ${offer.entryPrice} against itself under ${JSON.stringify(env)}`,
        )
      }
    }
  })
})

describe('publicOfferFor — the coupon shape', () => {
  test('advertises the coupon when no discount id exists', async () => {
    const publicOfferFor = await couponOffer({
      POLAR_PPP_CODE_B: 'BRAZIL50',
      POLAR_PPP_PERCENT_B: '50',
    })
    const offer = publicOfferFor('ppp-b')
    assert.ok(offer)
    assert.equal(offer.kind, 'code')
    assert.equal(offer.code, 'BRAZIL50')
    assert.equal(offer.percentOff, 50)
    // Never a computed `list × (1 - percent)`: the coupon is worth whatever
    // the dashboard says, and this repo cannot hold anyone to a figure it
    // derived from a number somebody typed into an env var.
    assert.equal(offer.entryPrice, null)
  })

  test('a half-configured coupon is treated as no coupon', async () => {
    const cases: Record<string, string>[] = [
      { POLAR_PPP_CODE_B: 'BRAZIL50' },
      { POLAR_PPP_PERCENT_B: '50' },
      { POLAR_PPP_CODE_B: 'BRAZIL50', POLAR_PPP_PERCENT_B: '' },
      { POLAR_PPP_CODE_B: 'BRAZIL50', POLAR_PPP_PERCENT_B: '0' },
      { POLAR_PPP_CODE_B: 'BRAZIL50', POLAR_PPP_PERCENT_B: '100' },
      { POLAR_PPP_CODE_B: 'BRAZIL50', POLAR_PPP_PERCENT_B: 'half' },
      { POLAR_PPP_CODE_B: '   ', POLAR_PPP_PERCENT_B: '50' },
    ]
    for (const env of cases) {
      const publicOfferFor = await couponOffer(env)
      assert.equal(
        publicOfferFor('ppp-b'),
        null,
        `advertised something for ${JSON.stringify(env)}`,
      )
    }
  })

  test('a coupon never leaks to a region it was not set for', async () => {
    const publicOfferFor = await couponOffer({
      POLAR_PPP_CODE_B: 'BRAZIL50',
      POLAR_PPP_PERCENT_B: '50',
    })
    for (const region of ['IN', 'ppp-a', 'ppp-c', 'default'] as const) {
      assert.equal(publicOfferFor(region), null, `${region} got band B's coupon`)
    }
  })
})

describe('studentOffer', () => {
  test('has no automatic shape, because no header says anybody is a student', () => {
    // Asserted against the source: the absence of a branch is not something
    // a call can demonstrate, and adding one is exactly the change that
    // would want a second look — a student discount applied from an IP
    // address is a student discount applied to everybody.
    const body = SOURCE.slice(SOURCE.indexOf('export function studentOffer'))
    assert.ok(
      !body.includes("'automatic'"),
      'studentOffer grew an automatic branch — see the docblock above it',
    )
  })
})

describe('the contract with checkout', () => {
  test('the coupon shape is still tied to allowDiscountCodes', () => {
    /*
      `codes.ts` may advertise a typed coupon only while
      /api/billing/checkout leaves `allowDiscountCodes` on, and it leaves it
      on only where there is no discount id. Two files, no type between
      them, and the failure is invisible on both sides — so the route names
      this one in a comment and this test checks the naming survives. A
      rewrite that drops the cross-reference is the moment the agreement
      stops being reviewable.
    */
    const route = readFileSync(`${HERE}../../app/api/billing/checkout/route.ts`, 'utf8')
    assert.match(route, /allowDiscountCodes:\s*!discountId/)
    assert.ok(
      route.includes('publicOfferFor'),
      'checkout no longer references publicOfferFor — the bar contract is undocumented',
    )
  })
})
