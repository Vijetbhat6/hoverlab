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
 *   Hoverlab Pro    one-time, $59
 *   Hoverlab Team   recurring monthly, seat-based, $12/seat
 *   India / Pro     $40 off Pro,  duration `once`
 *   India / Team    $7 off Team,  duration `forever`
 *
 * The discounts are FIXED amounts rather than percentages because the plan
 * catalog uses round numbers: 68% off $59 is $18.88, so a percentage would
 * advertise $19 and charge $18.88. Fixed amounts make the two identical.
 *
 * `forever` on the Team discount is deliberate — with `once` the customer
 * would pay $5 in month one and $12 from month two, which is not a regional
 * price, it is a trial.
 *
 * Idempotent: products and discounts are matched by name, so re-running adds
 * nothing. It never updates or deletes an existing object — if a price is
 * wrong, change it in the dashboard rather than having a script quietly
 * re-price something people may already have bought.
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
const TEAM_NAME = 'Hoverlab Team'
const DISCOUNT_PRO_NAME = 'India / Pro'
const DISCOUNT_TEAM_NAME = 'India / Team'

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
  const discounts = await collect<{ id: string; name: string }>(
    await polar.discounts.list({ limit: 100 }),
  )

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

  /** Create a product unless one with that name already exists. */
  async function ensureProduct(
    name: string,
    envKey: string,
    body: Parameters<typeof polar.products.create>[0],
  ) {
    const existing = byName(products, name)
    if (existing) {
      console.log(`= ${name} already exists (${existing.id})`)
      results[envKey] = existing.id
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
    prices: [{ amountType: 'fixed', priceAmount: 5900, priceCurrency: 'usd' }],
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
    ],
  })

  /** Create a discount unless one with that name already exists. */
  async function ensureDiscount(
    name: string,
    envKey: string,
    productId: string,
    amountCents: number,
    duration: 'once' | 'forever',
  ) {
    const existing = byName(discounts, name)
    if (existing) {
      console.log(`= ${name} already exists (${existing.id})`)
      results[envKey] = existing.id
      return
    }
    if (dryRun) {
      console.log(`+ would create discount: ${name} ($${amountCents / 100} off, ${duration})`)
      results[envKey] = '<dry-run>'
      return
    }
    const created = await polar.discounts.create({
      name,
      type: 'fixed',
      amount: amountCents,
      currency: 'usd',
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

  await ensureDiscount(DISCOUNT_PRO_NAME, 'POLAR_DISCOUNT_ID_IN_PRO', proId, 4000, 'once')
  await ensureDiscount(DISCOUNT_TEAM_NAME, 'POLAR_DISCOUNT_ID_IN_TEAM', teamId, 700, 'forever')

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
