/**
 * <ShippedBand> — the front door's proof that this is a live catalog.
 *
 * ── THE GAP IT FILLS ────────────────────────────────────────────────────
 *
 * Every number on `/` was a size: 1,126 effects in the hero badge, four
 * counts in the tier chips, the same four again in the ladder, and once
 * more in the closing line. Size is the claim a dead catalog makes just as
 * loudly as a live one — an abandoned repository still has 1,126 of
 * whatever it had the day it was abandoned. Nothing on the page answered
 * "is anyone still working on this", which for a subscription product with
 * a twelve-month update window is not a mood question, it is the question.
 *
 * The repository has always known the answer. `build-catalog-recency.mts`
 * reads the first commit that introduced every artifact, `/changelog`
 * renders all of it, and `/feed.xml` syndicates it — but a visitor reaches
 * `/changelog` only after they already believe enough to go looking. The
 * proof was computed, published, and placed where it convinces nobody.
 *
 * ── WHY IT SITS WHERE <StatsBand> USED TO ───────────────────────────────
 *
 * The band that came out of this slot was the same four totals a third
 * time. This is the number that slot was always reaching for: not how big
 * the catalog is, but that it moved last week — which the reader cannot
 * get from the hero and cannot get anywhere else on the page.
 *
 * ── THE TWO STATES ──────────────────────────────────────────────────────
 *
 *   something landed inside the window   "Shipped this week" + the totals
 *   nothing did                          "Last shipment" + the latest day
 *
 * A catalog does not add something every week, and one that claims to on
 * the quiet weeks has spent the credibility it was trying to build. The
 * heading, the sub-line and the window dates all change together — see
 * `shippingWindow()` — and the dates are printed rather than implied, so a
 * deploy that has been sitting for a month reads as a month-old report
 * instead of as a week that never ends.
 *
 * ── WHY COUNTS AND NOT NAMES ────────────────────────────────────────────
 *
 * `new-this-week.tsx` names the artifacts, because a hub visitor is
 * shopping and a name is a link they might follow. A landing-page visitor
 * has not decided to shop yet: eight names of things they have no context
 * for is noise, and the names would cost this page the block, page and
 * template indexes on top of the ledger. "+35 blocks, 13 Sep" is the whole
 * argument. The names are one click away, on the page built for them.
 *
 * No number here is typed. Every one is counted out of git history by the
 * ledger builder, which is the same reason `/changelog` exists and the same
 * reason the invented testimonials are gone: this band is a claim about how
 * hard we are working, made on our own landing page, and the only version
 * of that worth making is one we cannot fake without lying in a commit.
 */

import Link from 'next/link'
import { ArrowRight, CalendarDays, Rss } from 'lucide-react'

import { Reveal } from '@/components/reveal'
import { LEVEL_LABEL } from '@/lib/artifact-types'
import { formatAdded } from '@/lib/recency-format'
import {
  SHIPPING_WINDOW_DAYS,
  recentWaves,
  shippingWindow,
  type VelocityWave,
} from '@/lib/velocity'

/** How many waves the timeline lists before handing off to `/changelog`. */
const ENTRIES = 8

/** "35 blocks" / "1 page" — the rung label, agreeing with its count. */
function waveLabel(wave: VelocityWave): string {
  const label = LEVEL_LABEL[wave.level]
  return wave.count === 1 ? label.one.toLowerCase() : label.many.toLowerCase()
}

export function ShippedBand() {
  const week = shippingWindow()
  const entries = recentWaves(ENTRIES)

  /*
   * An empty ledger is a real state — a fresh clone whose recency file has
   * never been built. A heading over nothing is furniture, and on the
   * landing page it is furniture that implies a claim.
   */
  if (week.total === 0 || entries.length === 0) return null

  return (
    <section
      aria-labelledby="shipped-heading"
      className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <Reveal>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 lg:grid-cols-5">
          {/* ---- The strip: one week, counted ---- */}
          <div className="bg-card/60 p-6 sm:p-8 lg:col-span-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <CalendarDays aria-hidden className="h-3.5 w-3.5 text-primary" />
              {week.fresh
                ? `${SHIPPING_WINDOW_DAYS} days to ${formatAdded(week.to)}`
                : formatAdded(week.to)}
            </span>

            <h2 id="shipped-heading" className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              {week.fresh ? 'Shipped this week' : 'Last shipment'}
            </h2>

            <p className="mt-3 text-muted-foreground">
              {week.fresh ? (
                <>
                  <span className="font-semibold text-foreground">
                    +{week.total.toLocaleString('en-US')}
                  </span>{' '}
                  artifacts added in the last {SHIPPING_WINDOW_DAYS} days, across{' '}
                  {week.byLevel.length}{' '}
                  {week.byLevel.length === 1 ? 'rung' : 'rungs'} of the ladder.
                </>
              ) : (
                <>
                  Nothing in the last {SHIPPING_WINDOW_DAYS} days. The most
                  recent batch added{' '}
                  <span className="font-semibold text-foreground">
                    +{week.total.toLocaleString('en-US')}
                  </span>
                  .
                </>
              )}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-2">
              {week.byLevel.map(({ level, count }) => (
                <div key={level}>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                    {LEVEL_LABEL[level].many}
                  </dt>
                  <dd className="mt-0.5 font-mono text-2xl font-bold tabular-nums">
                    +{count.toLocaleString('en-US')}
                  </dd>
                </div>
              ))}
            </dl>

            {/*
              Both doors out, named. The feed is the better ask for this
              audience — nothing to hand over — and it is generated from the
              same ledger, so it cannot say anything the band does not.
            */}
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <Link
                href="/changelog"
                className="inline-flex items-center gap-1.5 font-semibold text-primary underline-offset-4 hover:underline"
              >
                Read the full changelog
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
              <a
                href="/feed.xml"
                className="inline-flex items-center gap-1.5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                <Rss aria-hidden className="h-3.5 w-3.5" />
                Atom feed
              </a>
            </div>
          </div>

          {/* ---- The receipts: the last eight batches ---- */}
          <div className="bg-card/40 p-6 sm:p-8 lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Latest {entries.length} batches
            </h3>

            <ol className="mt-4">
              {entries.map((wave) => (
                <li key={`${wave.date}:${wave.level}`}>
                  <Link
                    href="/changelog"
                    className="group flex items-baseline gap-4 border-b border-border/40 py-2.5 text-sm transition-colors last:border-0 hover:text-foreground"
                  >
                    <span className="w-24 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                      {formatAdded(wave.date)}
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-primary">
                      +{wave.count.toLocaleString('en-US')}
                    </span>
                    <span className="text-muted-foreground transition-colors group-hover:text-foreground">
                      {waveLabel(wave)}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
