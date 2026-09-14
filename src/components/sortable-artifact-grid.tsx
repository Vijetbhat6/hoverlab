'use client'

/**
 * A catalog grid that can be reordered — Newest and Popular, on the hubs
 * that had no order at all.
 *
 * `/library` has sorted since it was written, because effects are strings
 * and a client component can hold all 1,047 of them. `/blocks`, `/pages`
 * and `/templates` could not follow: their cards render *live React
 * components* out of a registry, so the obvious client grid would pull 250
 * block sources into the browser bundle to reorder 250 cards. On pages that
 * already ship about 4MB, that is not a trade worth making for a select.
 *
 * ── HOW THIS AVOIDS THAT ────────────────────────────────────────────────
 *
 * The cards are still rendered on the server. What crosses into the client
 * is an array of already-rendered nodes plus the two things a sort needs —
 * an id and a date — and this component reorders the ARRAY. React moves the
 * existing DOM for each key rather than re-rendering anything, the block
 * sources never enter the client graph, and the page weighs what it weighed
 * before: the RSC payload already contained these nodes.
 *
 * ── WHY NOT CSS `order` ─────────────────────────────────────────────────
 *
 * Setting `order` on grid items is the cheap version and it is wrong here.
 * It moves the boxes and leaves the DOM alone, so tab order and screen
 * reader order keep the old sequence while the eye reads the new one —
 * WCAG 2.4.3 and 1.3.2, on a site that gates its build on an a11y audit.
 * Reordering the array moves focus order with the pixels.
 *
 * ── WHY THE URL CARRIES IT ──────────────────────────────────────────────
 *
 * `?sort=` via `replaceState`, matching `/library`. These hubs are
 * statically rendered, so the parameter cannot change the HTML — but it
 * survives a reload, it can be linked, and it costs no navigation.
 *
 * ── WHY RANDOMIZED IS HERE AT ALL ───────────────────────────────────────
 *
 * Curated order is a decision made once and then frozen, and the top of it
 * is the only part most visitors ever see: a hub with 290 blocks in a fixed
 * order has a long tail nobody has any route to. Newest reaches the tail
 * only if it is new, Popular only if it is already popular — both of them
 * are feedback loops that reward what is already visible. A shuffle is the
 * one order that gives the two-hundredth block the same chance as the
 * second, which is worth having on a catalog whose whole claim is breadth.
 *
 * It carries a seed in the URL so it is still a shareable, reloadable
 * order rather than the one sort that changes under the reader — see
 * `lib/shuffle.ts`.
 */

import * as React from 'react'
import { ArrowDownUp, Clock, Loader2, Shuffle, TrendingUp } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUsageCountsState } from '@/hooks/use-usage-counts'
import { formatAdded } from '@/lib/recency'
import { newSeed, parseSeed, seededShuffle } from '@/lib/shuffle'

export type ArtifactSort = 'catalog' | 'newest' | 'popular' | 'random'

const SORTS: ArtifactSort[] = ['catalog', 'newest', 'popular', 'random']

export interface SortableItem {
  id: string
  /** ISO date from the recency ledger, or undefined when it has none. */
  added?: string
  /**
   * The card, rendered on the server.
   *
   * Give it a `key` where you create it, even though it is a field on an
   * object rather than a member of an array. It ends up in one here, and
   * the wrapping `<Fragment key>` below does not satisfy React: the element
   * was created inside the caller's `.map()`, which is where the check
   * fires, so the warning names the hub rather than this file.
   */
  node: React.ReactNode
}

/**
 * One curated section of a hub — its heading and what sits under it.
 *
 * The heading arrives already rendered because it is not a string: every
 * hub's section header carries a "View all 24" link into the category. A
 * render function would be the obvious shape and cannot cross into a client
 * component, so the server passes the finished node instead.
 */
export interface SortableGroup {
  key: string
  heading: React.ReactNode
  ids: string[]
}

function parseSort(value: string | null): ArtifactSort {
  return SORTS.includes(value as ArtifactSort) ? (value as ArtifactSort) : 'catalog'
}

export function SortableArtifactGrid({
  items,
  groups,
  className,
  /** Plural noun for the control's accessible name — "blocks", "pages". */
  noun,
}: {
  /** Every card, in catalog order. */
  items: SortableItem[]
  /**
   * The curated sections, when the hub has them.
   *
   * Only the curated order is grouped. "Newest" and "Popular" are questions
   * about the whole catalog — the newest block is the newest block whatever
   * shelf it sits on — and answering them inside each category would give
   * eleven separate answers and no ranking. So a sort flattens the page into
   * one grid, which is also the honest signal that the grouping is gone.
   */
  groups?: SortableGroup[]
  className: string
  noun: string
}) {
  const [sort, setSort] = React.useState<ArtifactSort>('catalog')
  /*
   * The shuffle's seed. Held as state rather than generated inside the
   * memo below, because an order has to be a value the reader can keep —
   * see `lib/shuffle.ts`. Null until the reader asks for a shuffle, so no
   * seed appears in the URL of a grid that is not shuffled.
   */
  const [seed, setSeed] = React.useState<number | null>(null)
  const { counts, ready } = useUsageCountsState()

  // Read `?sort=` once on mount, so a shared link opens in its own order.
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = parseSort(params.get('sort'))
    if (fromUrl !== 'catalog') setSort(fromUrl)
    // A link to a shuffled grid should reproduce that exact shuffle. A
    // `sort=random` with no usable seed gets a fresh one rather than an
    // error — the reader asked for a random order and any of them answers.
    if (fromUrl === 'random') setSeed(parseSeed(params.get('seed')) ?? newSeed())
  }, [])

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (sort === 'catalog') params.delete('sort')
    else params.set('sort', sort)
    // The seed rides along only while the shuffle is showing, so switching
    // back to Newest does not leave a stale number in the address bar.
    if (sort === 'random' && seed !== null) params.set('seed', String(seed))
    else params.delete('seed')
    const qs = params.toString()
    window.history.replaceState(
      null,
      '',
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    )
  }, [sort, seed])

  /** Switch sorts, minting a seed the first time the shuffle is chosen. */
  const chooseSort = React.useCallback((next: ArtifactSort) => {
    setSort(next)
    if (next === 'random') setSeed((current) => current ?? newSeed())
  }, [])

  /*
   * Every sort starts from catalog order and is stable, so items the sort
   * cannot separate — two blocks added the same day, or two nobody has
   * copied — keep the order a person chose rather than shuffling between
   * renders.
   */
  const ordered = React.useMemo(() => {
    if (sort === 'catalog') return items

    if (sort === 'newest') {
      // Undated last. The ledger is rebuilt from git and an artifact added
      // between rebuilds has no date; sorting it to the top as if it were
      // epoch-old, or to the front as if it were newest, would both be
      // inventions. It keeps its catalog position at the end instead.
      return [...items].sort((a, b) => {
        if (a.added === b.added) return 0
        if (!a.added) return 1
        if (!b.added) return -1
        return b.added.localeCompare(a.added)
      })
    }

    if (sort === 'random') {
      // Pure in the seed, so this recomputes only when the reader shuffles
      // again — and gives every browser opening the same link the same
      // grid.
      return seed === null ? items : seededShuffle(items, seed)
    }

    return [...items].sort((a, b) => {
      const ca = counts[a.id]?.recent ?? 0
      const cb = counts[b.id]?.recent ?? 0
      return cb - ca
    })
  }, [items, sort, counts, seed])

  const byId = React.useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  )

  const counted = React.useMemo(
    () => items.filter((item) => (counts[item.id]?.recent ?? 0) > 0).length,
    [items, counts],
  )

  /* The newest date present, for the Newest note. */
  const newest = React.useMemo(
    () =>
      items.reduce<string | undefined>(
        (best, item) => (item.added && (!best || item.added > best) ? item.added : best),
        undefined,
      ),
    [items],
  )

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-end gap-3">
        {/*
          Only while the shuffle is showing. A "Shuffle again" sitting
          beside a grid that is in curated order would either do nothing
          visible or silently change the sort — and a control whose effect
          you cannot see is one nobody presses twice.
        */}
        {sort === 'random' ? (
          <button
            type="button"
            onClick={() => setSeed(newSeed())}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Shuffle aria-hidden className="h-3.5 w-3.5" />
            Shuffle again
            <span className="sr-only">, reordering the {noun} at random</span>
          </button>
        ) : null}

        <Select value={sort} onValueChange={(v) => chooseSort(v as ArtifactSort)}>
          <SelectTrigger
            className="h-8 w-[170px] gap-1.5 rounded-full border-border/60 bg-background/70 text-xs shadow-sm"
            aria-label={`Sort ${noun}`}
          >
            <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="catalog">
              Curated order
              <span className="ml-1.5 text-muted-foreground">· as catalogued</span>
            </SelectItem>
            <SelectItem value="newest">
              Newest
              <span className="ml-1.5 text-muted-foreground">· by date added</span>
            </SelectItem>
            <SelectItem value="popular">
              Popular
              <span className="ml-1.5 text-muted-foreground">· copied this week</span>
            </SelectItem>
            <SelectItem value="random">
              Randomized
              <span className="ml-1.5 text-muted-foreground">· shuffled</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/*
        What the order is made of, said plainly — and, for Popular, what it
        is made of when the answer is "not much yet". A grid that silently
        did not reorder would read as a broken control; this says the
        counter is young rather than pretending the ranking is complete.
      */}
      {sort === 'newest' ? (
        <SortNote icon={Clock}>
          Newest first, by the date each one landed in the catalog — read out
          of git history rather than a field someone sets.
          {newest ? ` The most recent arrived ${formatAdded(newest)}.` : null}
        </SortNote>
      ) : null}

      {sort === 'popular' ? (
        <SortNote icon={TrendingUp} loading={!ready}>
          {!ready ? (
            <>Reading the last seven days of copies…</>
          ) : counted === 0 ? (
            <>
              Ordered by copies over the last seven days. Nothing here has
              been copied in that window yet, so the grid keeps its curated
              order — this list fills in as the catalog gets used.
            </>
          ) : (
            <>
              Ordered by copies over the last seven days — {counted} of{' '}
              {items.length} have been copied in that window, and the rest
              keep their curated order behind them. Counted by copies and
              installs, never by page views.
            </>
          )}
        </SortNote>
      ) : null}

      {sort === 'random' ? (
        <SortNote icon={Shuffle}>
          All {items.length} {noun} in a random order, so the ones a curated
          list keeps at the bottom get the top of the grid for once. The
          shuffle is in the address bar — this exact order reopens on a
          reload and survives being sent to someone else.
        </SortNote>
      ) : null}

      {/* Said once, rather than in both notes: the categories have not gone
          missing, they are set aside for as long as the order is a question
          about the whole catalog. */}
      {groups && sort !== 'catalog' ? (
        <p className="mb-5 text-xs text-muted-foreground">
          One grid while this order is on — switch back to curated order to
          see them grouped by category again.
        </p>
      ) : null}

      {sort === 'catalog' && groups ? (
        <div className="space-y-16">
          {groups.map((group) => (
            <section key={group.key}>
              {group.heading}
              <div className={className}>
                {group.ids.map((id) => {
                  const item = byId.get(id)
                  return item ? (
                    <React.Fragment key={id}>{item.node}</React.Fragment>
                  ) : null
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className={className}>
          {ordered.map((item) => (
            <React.Fragment key={item.id}>{item.node}</React.Fragment>
          ))}
        </div>
      )}
    </>
  )
}

/** The footnote under the control. Mirrors `/library`'s, deliberately quiet. */
function SortNote({
  icon: Icon,
  loading = false,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  loading?: boolean
  children: React.ReactNode
}) {
  return (
    <p className="mb-5 flex items-start gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
      {loading ? (
        <Loader2 aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" />
      ) : (
        <Icon aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      )}
      <span>{children}</span>
    </p>
  )
}
