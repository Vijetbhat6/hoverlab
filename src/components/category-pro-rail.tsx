/**
 * The merchandising slot at the foot of a detail page: what else is on this
 * shelf, and what the licence costs.
 *
 * Every catalog this one competes with ends a component page with a
 * per-category upsell — React Bits closes with "11 more in Pro". The slot
 * is worth having. The sentence is not one we can copy, and the difference
 * is the whole design of this component.
 *
 * ── WHY IT DOES NOT SAY "11 MORE IN PRO" ────────────────────────────────
 *
 * Because nothing in the category is behind Pro. The catalog, `/api/v1` and
 * the CLI are public on purpose — that is the SEO funnel and the CLI story,
 * and gating them was considered and rejected (`lib/api/public.ts`). Pro
 * gates the bundle cap and sells the commercial licence; it does not lock a
 * single block, effect, page or template.
 *
 * So "11 more in Pro" would be a lie about our own product, on the page
 * where a developer is most likely to check it — they are one click from
 * the category, where all eleven would open. `scripts/check-claims.mts`
 * exists in this repo because a previous version of this site shipped
 * numbers nobody could stand behind; adding a fresh one deliberately would
 * be a strange way to honour that.
 *
 * ── WHAT IT SAYS INSTEAD ────────────────────────────────────────────────
 *
 * The true version of the same pitch, in two halves:
 *
 *   the count, as an invitation   "11 more in Forms — all free to copy"
 *   the licence, as the offer     "shipping one commercially needs Pro"
 *
 * Which is a better upsell than the false one, because it is the actual
 * moment of friction: a reader who has just copied a block and is about to
 * put it in client work is exactly the person the licence is for. The
 * catalogue being open is the reason to trust the pitch, not an obstacle
 * to it.
 */

import Link from 'next/link'
import { ArrowRight, Check, ShieldCheck } from 'lucide-react'

import { PLANS, formatPrice } from '@/lib/billing/plans'

/** What the licence actually buys. Each of these has an enforcement site. */
const PERKS = [
  'A commercial licence for everything in the catalog',
  'Unlimited bundle exports, in Vue, Svelte and Tailwind',
  'One payment — no subscription, nothing to renew',
]

export function CategoryProRail({
  /** Display name of the category this page sits in. */
  category,
  /** How many OTHER artifacts share it. Zero renders the licence half only. */
  remaining,
  /** Where "see them all" goes. */
  categoryHref,
  /** Plural noun for the rung — "blocks", "effects". */
  noun,
}: {
  category: string
  remaining: number
  categoryHref: string
  noun: string
}) {
  const pro = PLANS.pro

  return (
    <section
      aria-labelledby="category-pro-rail"
      className="mt-16 grid gap-4 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:grid-cols-2 sm:p-8"
    >
      <div>
        <h2 id="category-pro-rail" className="text-lg font-bold tracking-tight">
          {remaining > 0 ? (
            <>
              {remaining} more {noun} in {category}
            </>
          ) : (
            <>Take it anywhere you like</>
          )}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {remaining > 0 ? (
            <>
              All of them free to read, copy and install — no account, no
              locked tiles, no watermarked preview. The whole catalog is open,
              and so are the API and the CLI.
            </>
          ) : (
            <>
              Free to read, copy and install — no account, no locked tiles.
              The whole catalog is open, and so are the API and the CLI.
            </>
          )}
        </p>
        {remaining > 0 ? (
          <Link
            href={categoryHref}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-all hover:gap-2.5"
          >
            Browse {category}
            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>

      {/* The half that is actually for sale. */}
      <div className="border-t border-primary/20 pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
        <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold">
          <ShieldCheck aria-hidden className="h-4 w-4 text-primary" />
          Shipping one commercially
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Copying the code is free. Putting it in client work or a paid
          product is what {pro.name} is for — the licence, not the access.
        </p>
        <ul className="mt-3 space-y-1.5">
          {PERKS.map((perk) => (
            <li
              key={perk}
              className="flex items-start gap-1.5 text-xs leading-snug text-muted-foreground"
            >
              <Check aria-hidden className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
              {perk}
            </li>
          ))}
        </ul>
        <Link
          href="/pricing"
          className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {pro.name} — {formatPrice(pro.priceCents)} once
        </Link>
      </div>
    </section>
  )
}
