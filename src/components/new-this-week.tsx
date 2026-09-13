/**
 * "New this week" — the strip that gives a return visitor a reason to
 * return.
 *
 * The recency ledger has known when every artifact landed since it shipped,
 * and the only places that read it were the detail pages and the changelog.
 * So the catalog changed constantly and looked, from any hub, exactly as it
 * had a month before. A visitor who came back had no way to find out what
 * was new short of remembering what had been there.
 *
 * ── WHAT IT PROMISES, AND HOW IT AVOIDS OVER-PROMISING ──────────────────
 *
 * Two states, because a catalog does not add something every week and one
 * that claims to is lying on the quiet weeks:
 *
 *   something landed inside the window   "New this week" + the items
 *   nothing did                          "Recently added" + the last wave
 *
 * Both print real dates next to the names. These hubs are statically
 * rendered, so "this week" is measured at BUILD time — a deploy that sits
 * for a fortnight would otherwise keep calling a fortnight-old block new,
 * with nothing on the page to give it away. The date is what makes a stale
 * strip visibly stale instead of quietly false. See `addedSince`.
 *
 * ── WHY NAMES AND NOT THUMBNAILS ────────────────────────────────────────
 *
 * A rail of live previews is the prettier version and would double what
 * these hubs paint — they already ship about 4MB and the grid below is the
 * thing worth painting. This is a signpost to that grid, so it is links and
 * dates, and it costs a line of text each.
 */

import Link from 'next/link'
import { Sparkles } from 'lucide-react'

import { addedSince, formatAdded, recentlyAdded, addedAt } from '@/lib/recency'
import { getBlockMeta } from '@/lib/blocks/block-index'
import { getPageMeta } from '@/lib/pages/page-index'
import { getTemplateMeta } from '@/lib/templates/template-index'
import type { ArtifactLevel } from '@/lib/artifact-types'

/**
 * Name lookup, per rung, from the light index rather than the catalog.
 *
 * `resolveArtifact` would do all four in one call and would also pull every
 * block's full source into a hub that only wants nine names.
 */
function nameOf(level: ArtifactLevel, id: string): string | undefined {
  if (level === 'block') return getBlockMeta(id)?.name
  if (level === 'page') return getPageMeta(id)?.name
  if (level === 'template') return getTemplateMeta(id)?.name
  return undefined
}

export function NewThisWeek({
  level,
  /** How many to name before the rest become a count. */
  limit = 8,
  days = 7,
}: {
  level: Exclude<ArtifactLevel, 'effect'>
  limit?: number
  days?: number
}) {
  const fresh = addedSince(level, days)
  const isNew = fresh.length > 0

  /*
   * The fallback is the most recent wave, not "the newest N regardless of
   * date" — those are the same list, but the heading and the date are what
   * change, and the point of the quiet-week state is that it does not claim
   * to be the busy one.
   */
  const entries = isNew
    ? fresh
    : recentlyAdded(level, limit).map((id) => ({ id, date: addedAt(level, id) ?? '' }))

  const shown = entries.slice(0, limit)
  const extra = entries.length - shown.length

  // Nothing in the ledger for this rung at all — a fresh catalog, or a rung
  // added since the last rebuild. A heading over an empty list is furniture.
  if (shown.length === 0) return null

  return (
    <section
      aria-labelledby="new-this-week"
      className="mt-12 rounded-2xl border border-border/60 bg-card/40 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="new-this-week"
          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider"
        >
          <Sparkles aria-hidden className="h-4 w-4 text-primary" />
          {isNew ? 'New this week' : 'Recently added'}
        </h2>
        <p className="text-xs text-muted-foreground">
          {isNew ? (
            <>
              {fresh.length} added in the last {days} days
            </>
          ) : (
            <>Nothing new in the last {days} days — this is the most recent</>
          )}
        </p>
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        {shown.map(({ id, date }) => {
          const name = nameOf(level, id)
          if (!name) return null
          return (
            <li key={id}>
              <Link
                href={`/${level}/${id}`}
                className="inline-flex items-baseline gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
              >
                {name}
                {/* The date is not decoration — it is what keeps the heading
                    above honest on a build that has been sitting a while. */}
                {date ? (
                  <span className="text-xs font-normal text-muted-foreground">
                    {formatAdded(date)}
                  </span>
                ) : null}
              </Link>
            </li>
          )
        })}
        {extra > 0 ? (
          <li className="self-center text-xs text-muted-foreground">
            and {extra} more
          </li>
        ) : null}
      </ul>
    </section>
  )
}
