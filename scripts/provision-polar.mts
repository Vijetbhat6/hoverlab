/**
 * Create the Polar products and regional discounts this app expects.
 *
 *   npx tsx scripts/provision-polar.mts            # create anything missing
 *   npx tsx scripts/provision-polar.mts --dry-run  # show what it would do
 *
 * Needs POLAR_ACCESS_TOKEN in .env / .env.local. POLAR_SERVER picks sandbox
 * (default) or production, exactly as the app does — so this cannot touch a
 * live organization unless you have deliberately set POLAR_SERVER=production.
 *
 * What it creates, mirroring src/lib/billing/plans.ts:
 *
 *   Hoverlab Pro     one-time, $79 and ₹7,500
 *   Hoverlab Studio  one-time, ten seats, $299 and ₹28,000
 *   Hoverlab Team    recurring monthly, seat-based, $12 and ₹1,150 /seat
 *   India / Pro      $54 off Pro,     duration `once`
 *   India / Studio   $200 off Studio, duration `once`
 *   India / Team     $7 off Team,     duration `forever`
 *   India / Pro ₹     ₹5,100 off Pro,     duration `once`
 *   India / Studio ₹  ₹18,500 off Studio, duration `once`
 *   India / Team ₹    ₹675 off Team,      duration `forever`
 *
 * The discounts are FIXED amounts rather than percentages because the plan
 * catalog uses round numbers: 68% off $59 is $18.88, so a percentage would
 * advertise $19 and charge $18.88. Fixed amounts make the two identical.
 *
 * That is also why each currency needs its OWN discount. A fixed Polar
 * discount belongs to the currency it is denominated in: offering the dollar
 * one to a rupee checkout fails outright with "Discount does not exist", so
 * without the rupee pair an Indian buyer either cannot check out or pays
 * undiscounted list price.
 *
 * `forever` on the Team discounts is deliberate — with `once` the customer
 * would pay $5 in month one and $12 from month two, which is not a regional
 * price, it is a trial.
 *
 * Idempotent: products and discounts are matched by name, so re-running adds
 * nothing. It never re-prices anything anyone may already have bought — the
 * one update it performs is adding a rupee price to a product that has none,
 * and even that refuses to run if the product's existing dollar price does
 * not match what the catalog declares (see `ensureInrPrice`).
 *
 * That idempotency has a sharp edge, so the script now reports on it: when a
 * price in this file changes, an organization that already has the product
 * keeps charging the OLD amount while the site advertises the new one. The
 * run prints a `! price drift` line for every product and discount whose
 * live amount disagrees with the catalog. Fixing it is a dashboard edit —
 * deliberately not automated, because rewriting a live price is not
 * something a script re-run should be able to do by accident.
 */

import { readFileSync, existsSync } from 'node:fs'
import { Polar } from '@polar-sh/sdk'

/** Load .env files the way Next.js does. Mirrors scripts/check-env.mjs. */
function loadEnvFiles(): Record<string, string | undefined> {
  const merged: Record<string, string> = {}
  for (const file of ['.env', '.env.local', '.env.production']) {
    if (!existsSync(file)) continue
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
      if (!match) continue
      let value = match[2].trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      merged[match[1]] = value
    }
  }
  return { ...merged, ...process.env }
}

const env = loadEnvFiles()
const dryRun = process.argv.includes('--dry-run')

const accessToken = env.POLAR_ACCESS_TOKEN
if (!accessToken) {
  console.error(
    'POLAR_ACCESS_TOKEN is not set.\n\n' +
      'Create one at Settings → Developers → New Token in the Polar dashboard\n' +
      '(sandbox.polar.sh for sandbox), then put it in .env.local:\n\n' +
      '  POLAR_ACCESS_TOKEN="polar_oat_..."\n',
  )
  process.exit(1)
}

const server: 'sandbox' | 'production' =
  env.POLAR_SERVER === 'production' ? 'production' : 'sandbox'

const polar = new Polar({ accessToken, server })

const PRO_NAME = 'Hoverlab Pro'
const STUDIO_NAME = 'Hoverlab Studio'
const TEAM_NAME = 'Hoverlab Team'
const DISCOUNT_PRO_NAME = 'India / Pro'
const DISCOUNT_STUDIO_NAME = 'India / Studio'
const DISCOUNT_TEAM_NAME = 'India / Team'
// Separate names so the currency pairs are distinguishable in the dashboard —
// matching is by name, and two same-named discounts would collide.
const DISCOUNT_PRO_INR_NAME = 'India / Pro (INR)'
const DISCOUNT_STUDIO_INR_NAME = 'India / Studio (INR)'
const DISCOUNT_TEAM_INR_NAME = 'India / Team (INR)'

/** Collect a paginated Polar list into a plain array. */
async function collect<T>(pager: AsyncIterable<{ result: { items: T[] } }>): Promise<T[]> {
  const out: T[] = []
  for await (const page of pager) out.push(...page.result.items)
  return out
}

async function main() {
  console.log(`Polar: ${server}${dryRun ? '  (dry run — nothing will be created)' : ''}\n`)

  const allProducts = await collect<{ id: string; name: string; isArchived: boolean }>(
    await polar.products.list({ limit: 100 }),
  )
  // Archived products still come back from the API and can share a name with
  // a live one. Matching against them would either link the app to a dead
  // product or make an existing product look absent.
  const products = allProducts.filter((p) => !p.isArchived)
  // amount/currency come along so a discount whose value no longer matches
  // the catalog can be reported rather than silently kept.
  const discounts = await collect<{
    id: string
    name: string
    amount?: number
    currency?: string
  }>(await polar.discounts.list({ limit: 100 }))

  /**
   * Match on name, case- and whitespace-insensitively.
   *
   * An exact match is too brittle to be safe here: a product created by hand
   * as "Hoverlab pro" would not match "Hoverlab Pro", and the script would
   * cheerfully create a second one — leaving two live products, one of which
   * nobody is selling.
   */
  const byName = <T extends { name: string }>(list: T[], name: string) =>
    list.find(
      (item) => item.name.trim().toLowerCase() === name.trim().toLowerCase(),
    )

  const results: Record<string, string> = {}
  /** Every mismatch found this run, reported together at the end. */
  const drift: string[] = []

  /**
   * Create a product unless one with that name already exists.
   *
   * When it does exist, its live price is compared against what this script
   * would have created. They can only disagree because someone changed one
   * of them, and the direction that matters is a catalog price that moved:
   * the site would advertise the new figure while Polar charged the old one.
   */
  async function ensureProduct(
    name: string,
    envKey: string,
    body: Parameters<typeof polar.products.create>[0],
  ) {
    const existing = byName(products, name)
    if (existing) {
      console.log(`= ${name} already exists (${existing.id})`)
      results[envKey] = existing.id
      await reportPriceDrift(name, existing.id, body.prices ?? [])
      return existing.id
    }
    if (dryRun) {
      console.log(`+ would create product: ${name}`)
      results[envKey] = '<dry-run>'
      return '<dry-run>'
    }
    const created = await polar.products.create(body)
    console.log(`+ created ${name} (${created.id})`)
    results[envKey] = created.id
    return created.id
  }

  const proId = await ensureProduct(PRO_NAME, 'POLAR_PRODUCT_ID_PRO', {
    name: PRO_NAME,
    description:
      'One-time commercial license for the full Hoverlab effect catalog, ' +
      'every export format, and all future updates.',
    recurringInterval: null,
    prices: [
      { amountType: 'fixed', priceAmount: 7900, priceCurrency: 'usd' },
      { amountType: 'fixed', priceAmount: 750000, priceCurrency: 'inr' },
    ],
  })

  const studioId = await ensureProduct(STUDIO_NAME, 'POLAR_PRODUCT_ID_STUDIO', {
    name: STUDIO_NAME,
    description:
      'One-time commercial license covering ten people. Everything Pro ' +
      'grants, for a whole team, with no renewal.',
    // One-time and NOT seat-based: the ten seats are a property of the
    // license, not a quantity the buyer picks, so Polar sells one thing at
    // one price and the seat count lives in the app's plan catalog.
    recurringInterval: null,
    prices: [
      { amountType: 'fixed', priceAmount: 29900, priceCurrency: 'usd' },
      { amountType: 'fixed', priceAmount: 2800000, priceCurrency: 'inr' },
    ],
  })

  const teamId = await ensureProduct(TEAM_NAME, 'POLAR_PRODUCT_ID_TEAM', {
    name: TEAM_NAME,
    description:
      'Per-seat plan adding shared brand tokens, shared collections, ' +
      'workspace theming and seat management.',
    recurringInterval: 'month',
    prices: [
      {
        amountType: 'seat_based',
        priceCurrency: 'usd',
        seatTiers: {
          seatTierType: 'volume',
          // One open-ended tier: every seat costs the same. maxSeats null is
          // what makes it unlimited rather than capped at the last tier.
          tiers: [{ minSeats: 1, maxSeats: null, pricePerSeat: 1200 }],
        },
      },
      {
        amountType: 'seat_based',
        priceCurrency: 'inr',
        seatTiers: {
          seatTierType: 'volume',
          tiers: [{ minSeats: 1, maxSeats: null, pricePerSeat: 115000 }],
        },
      },
    ],
  })

  /**
   * Add a rupee price to a product that already exists with only a dollar
   * one, so India can be shown and charged in rupees.
   *
   * This is the single update the script performs, and it is deliberately
   * paranoid, because Polar's product update replaces the whole price set:
   * the dollar price has to be sent back alongside the new rupee one, and
   * getting that wrong would re-price a live product. So it refuses unless
   * the dollar price already on the product is exactly what this script
   * would create — if someone has adjusted pricing in the dashboard, that
   * is a decision the script must not silently overwrite.
   *
   * Adding a currency does not affect anyone who has already bought: past
   * orders are settled records, and existing dollar checkouts keep using the
   * dollar price, untouched.
   */
  async function ensureInrPrice(
    name: string,
    productId: string,
    usdPrice: Record<string, unknown>,
    inrPrice: Record<string, unknown>,
  ) {
    if (productId === '<dry-run>') return

    const product = await polar.products.get({ id: productId })
    const live = (product.prices ?? []).filter((p) => !p.isArchived)

    if (live.some((p) => p.priceCurrency === 'inr')) {
      console.log(`= ${name} already has an INR price`)
      return
    }

    const usd = live.filter((p) => p.priceCurrency === 'usd')
    if (usd.length !== 1) {
      console.log(
        `! ${name}: expected exactly one live USD price, found ${usd.length} — ` +
          'add the INR price by hand.',
      )
      return
    }

    // Compare against what this script would have created, so a dashboard
    // edit is never echoed back as if it were ours.
    const existing = usd[0] as Record<string, unknown>
    const sameAmount =
      existing.amountType === usdPrice.amountType &&
      (existing.amountType === 'fixed'
        ? existing.priceAmount === usdPrice.priceAmount
        : seatPrice(existing) === seatPrice(usdPrice))

    if (!sameAmount) {
      console.log(
        `! ${name}: live USD price does not match the catalog ` +
          `(${JSON.stringify(existing.priceAmount ?? seatPrice(existing))} vs ` +
          `${JSON.stringify(usdPrice.priceAmount ?? seatPrice(usdPrice))}). ` +
          'Refusing to rewrite prices — add the INR price in the dashboard.',
      )
      return
    }

    if (dryRun) {
      console.log(`+ would add INR price to ${name}`)
      return
    }

    await polar.products.update({
      id: productId,
      // Cast because the price literals are typed loosely here so one helper
      // can carry both the fixed and seat-based shapes.
      productUpdate: {
        prices: [usdPrice, inrPrice],
      } as Parameters<typeof polar.products.update>[0]['productUpdate'],
    })
    console.log(`+ added INR price to ${name}`)
  }

  /**
   * Compare a live product's prices against the catalog and record any
   * disagreement. Reports only — see the header for why re-pricing a live
   * product is a dashboard decision rather than a scripted one.
   */
  async function reportPriceDrift(
    name: string,
    productId: string,
    wanted: readonly unknown[],
  ) {
    if (productId === '<dry-run>') return

    const product = await polar.products.get({ id: productId })
    const live = (product.prices ?? []).filter((p) => !p.isArchived) as unknown as Record<
      string,
      unknown
    >[]

    for (const price of wanted as Record<string, unknown>[]) {
      const currency = price.priceCurrency
      const match = live.find((p) => p.priceCurrency === currency)
      // No live price in that currency is not drift — it is what
      // `ensureInrPrice` exists to fix.
      if (!match) continue

      const want = price.amountType === 'fixed' ? price.priceAmount : seatPrice(price)
      const have = match.amountType === 'fixed' ? match.priceAmount : seatPrice(match)
      if (want === have) continue

      drift.push(
        `${name} (${String(currency).toUpperCase()}): Polar charges ` +
          `${String(have)}, the catalog says ${String(want)}`,
      )
    }
  }

  /** Per-seat amount out of either a request or response shaped price. */
  function seatPrice(price: Record<string, unknown>): number | null {
    const tiers = (price.seatTiers as { tiers?: { pricePerSeat?: number }[] } | undefined)
      ?.tiers
    return tiers?.[0]?.pricePerSeat ?? null
  }

  /**
   * Create a discount unless one with that name already exists.
   *
   * `currency` is load-bearing, not cosmetic: Polar treats a fixed discount
   * as belonging to its currency and hides it from checkouts in any other,
   * so the rupee checkout needs a discount of its own denominated in INR.
   */
  async function ensureDiscount(
    name: string,
    envKey: string,
    productId: string,
    amountMinor: number,
    duration: 'once' | 'forever',
    currency: 'usd' | 'inr' = 'usd',
  ) {
    const existing = byName(discounts, name)
    if (existing) {
      console.log(`= ${name} already exists (${existing.id})`)
      results[envKey] = existing.id
      // A regional price is list price minus this amount, so a stale
      // discount advertises one number and charges another — the same
      // failure `priceForRegion`'s guard exists to prevent.
      if (typeof existing.amount === 'number' && existing.amount !== amountMinor) {
        drift.push(
          `${name}: Polar takes off ${existing.amount}, the catalog says ${amountMinor}`,
        )
      }
      return
    }
    const shown =
      currency === 'inr'
        ? `₹${(amountMinor / 100).toLocaleString('en-IN')}`
        : `$${amountMinor / 100}`
    if (dryRun) {
      console.log(`+ would create discount: ${name} (${shown} off, ${duration})`)
      results[envKey] = '<dry-run>'
      return
    }
    const created = await polar.discounts.create({
      name,
      type: 'fixed',
      amount: amountMinor,
      currency,
      duration,
      // Scoped to one product so it cannot be applied to the other plan.
      products: [productId],
      // No `code`: this is applied server-side by product id at checkout, not
      // typed in by the customer. A redeemable code would let anyone who saw
      // it claim India pricing from anywhere.
    })
    console.log(`+ created ${name} (${created.id})`)
    results[envKey] = created.id
  }

  // Rupee prices on products that predate multi-currency support.
  await ensureInrPrice(
    PRO_NAME,
    proId,
    { amountType: 'fixed', priceAmount: 7900, priceCurrency: 'usd' },
    { amountType: 'fixed', priceAmount: 750000, priceCurrency: 'inr' },
  )
  await ensureInrPrice(
    STUDIO_NAME,
    studioId,
    { amountType: 'fixed', priceAmount: 29900, priceCurrency: 'usd' },
    { amountType: 'fixed', priceAmount: 2800000, priceCurrency: 'inr' },
  )
  await ensureInrPrice(
    TEAM_NAME,
    teamId,
    {
      amountType: 'seat_based',
      priceCurrency: 'usd',
      seatTiers: {
        seatTierType: 'volume',
        tiers: [{ minSeats: 1, maxSeats: null, pricePerSeat: 1200 }],
      },
    },
    {
      amountType: 'seat_based',
      priceCurrency: 'inr',
      seatTiers: {
        seatTierType: 'volume',
        tiers: [{ minSeats: 1, maxSeats: null, pricePerSeat: 115000 }],
      },
    },
  )

  await ensureDiscount(DISCOUNT_PRO_NAME, 'POLAR_DISCOUNT_ID_IN_PRO', proId, 5400, 'once')
  await ensureDiscount(
    DISCOUNT_STUDIO_NAME,
    'POLAR_DISCOUNT_ID_IN_STUDIO',
    studioId,
    20000,
    'once',
  )
  await ensureDiscount(DISCOUNT_TEAM_NAME, 'POLAR_DISCOUNT_ID_IN_TEAM', teamId, 700, 'forever')
  // ₹7,500 − ₹5,100 = ₹2,400, ₹28,000 − ₹18,500 = ₹9,500, and ₹1,150 − ₹675
  // = ₹475 per seat: the same ladder as the dollar prices, at roughly ₹95/$.
  await ensureDiscount(
    DISCOUNT_PRO_INR_NAME,
    'POLAR_DISCOUNT_ID_IN_PRO_INR',
    proId,
    510000,
    'once',
    'inr',
  )
  await ensureDiscount(
    DISCOUNT_STUDIO_INR_NAME,
    'POLAR_DISCOUNT_ID_IN_STUDIO_INR',
    studioId,
    1850000,
    'once',
    'inr',
  )
  await ensureDiscount(
    DISCOUNT_TEAM_INR_NAME,
    'POLAR_DISCOUNT_ID_IN_TEAM_INR',
    teamId,
    67500,
    'forever',
    'inr',
  )

  if (drift.length) {
    console.log(
      '\n! price drift — Polar and src/lib/billing/plans.ts disagree:\n' +
        drift.map((line) => `    ${line}`).join('\n') +
        '\n\n  The site advertises the catalog figure and Polar charges its own.' +
        '\n  Fix it in the Polar dashboard (Products → price, Discounts → amount);' +
        '\n  this script will not rewrite a live price.',
    )
  }

  console.log('\nPaste into .env.local:\n')
  for (const [key, value] of Object.entries(results)) {
    console.log(`${key}="${value}"`)
  }
  console.log(
    '\nStill to do by hand: the webhook endpoint and its signing secret ' +
      '(Settings → Webhooks).\nThat one needs a public URL, so it cannot be ' +
      'scripted from here.',
  )
}

main().catch((err) => {
  console.error('\nProvisioning failed:', err instanceof Error ? err.message : err)
  console.error(
    '\nIf this is a 401, the token is wrong or belongs to the other server ' +
      `(currently: ${server}).`,
  )
  process.exit(1)
})
