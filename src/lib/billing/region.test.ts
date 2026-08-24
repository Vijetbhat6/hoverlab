import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { regionFromCountry, pricedCountries, PPP_BANDS } from './region'
import { PLANS, priceForRegion, parsePlanId, type Region } from './plans'

/**
 * The regional pricing table is data, and the mistakes it invites are data
 * mistakes: a country listed in two bands, a typo that never matches any
 * visitor, a band price that drifts above list after a list-price change.
 * None of the three is a type error and none shows up in a page render —
 * they show up as somebody being charged the wrong amount, months later.
 *
 * These tests are cheap and they run on the source text where they have to,
 * because a duplicate key in an object literal is gone by the time the
 * module is imported.
 */

const SOURCE = readFileSync(fileURLToPath(new URL('./region.ts', import.meta.url)), 'utf8')

describe('COUNTRY_BAND', () => {
  test('every key is a two-letter uppercase ISO country code', () => {
    for (const code of pricedCountries()) {
      assert.match(code, /^[A-Z]{2}$/, `${code} is not an ISO 3166-1 alpha-2 code`)
    }
  })

  test('no country is listed twice', () => {
    // Against the source, not the object: the literal has already collapsed
    // duplicates by the time this file can see it, and last-one-wins is
    // exactly the silent behaviour worth failing on.
    const declared = [...SOURCE.matchAll(/^ {2}([A-Z]{2}): 'ppp-[abc]',$/gm)].map(
      (m) => m[1],
    )
    const seen = new Set<string>()
    const dupes = declared.filter((code) => !seen.add(code))
    assert.deepEqual(dupes, [], `listed in more than one band: ${dupes.join(', ')}`)
    assert.equal(
      declared.length,
      pricedCountries().length,
      'the regex missed rows — check the formatting of COUNTRY_BAND',
    )
  })

  test('names only bands that exist', () => {
    const bands = new Set<string>(PPP_BANDS)
    for (const code of pricedCountries()) {
      const region = regionFromCountry(code)
      assert.ok(bands.has(region), `${code} maps to ${region}, which is not a band`)
    }
  })

  test('India is its own region, not a band', () => {
    assert.equal(regionFromCountry('IN'), 'IN')
    assert.ok(!pricedCountries().includes('IN'))
  })

  test('unknown, empty and malformed countries fall back to list price', () => {
    for (const input of [null, undefined, '', '  ', 'US', 'ZZ', 'india', '1']) {
      assert.equal(regionFromCountry(input), 'default', `${String(input)}`)
    }
  })

  test('a lowercase or padded header still resolves', () => {
    assert.equal(regionFromCountry('br'), 'ppp-b')
    assert.equal(regionFromCountry(' in '), 'IN')
  })
})

describe('band prices', () => {
  const REGIONS: Region[] = ['IN', ...PPP_BANDS]
  const SELLABLE = (Object.keys(PLANS) as string[])
    .map(parsePlanId)
    .filter((id): id is NonNullable<ReturnType<typeof parsePlanId>> => id !== null)
    .filter((id) => id !== 'free')

  test('never exceed list price', () => {
    for (const region of REGIONS) {
      for (const plan of SELLABLE) {
        // priceForRegion falls back to list when the discount id is unset,
        // which is the case in a test environment — so this asserts the
        // fallback never *raises* a price and, where ids are configured,
        // that the band is genuinely a discount.
        assert.ok(
          priceForRegion(plan, region) <= PLANS[plan].priceCents,
          `${region}/${plan} is above list`,
        )
      }
    }
  })

  test('fall back to list price when no discount id is configured', () => {
    // The guard that matters most in this file: advertising $25 while Polar
    // charges $79 is the one failure mode here that takes real money under
    // false pretenses. With no POLAR_DISCOUNT_ID_* set, every region must
    // quote list.
    for (const region of REGIONS) {
      for (const plan of SELLABLE) {
        assert.equal(
          priceForRegion(plan, region),
          PLANS[plan].priceCents,
          `${region}/${plan} quoted a discount with no discount id to deliver it`,
        )
      }
    }
  })

  test("'default' is always list price", () => {
    for (const plan of SELLABLE) {
      assert.equal(priceForRegion(plan, 'default'), PLANS[plan].priceCents)
    }
  })
})
