'use client'

import * as React from 'react'
import Link from 'next/link'
import { Search, Sparkles, Heart, Star, ChevronLeft, ChevronRight, Shuffle, ArrowDownUp, Loader2, Plus, Minus } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SiteHeader } from '@/components/site-header'
import { EffectCard } from '@/components/effect-card'
import { TierDefinition } from '@/components/tier-definition'
import { RecentlyViewedRail } from '@/components/recently-viewed-rail'
import { useFavorites } from '@/hooks/use-favorites'
import { CATEGORIES, EFFECT_INDEX as EFFECTS, type EffectCategory, type EffectMeta } from '@/lib/effect-index'
import { useEffectDetails } from '@/hooks/use-effect-details'
import { track } from '@/lib/analytics'
import { EffectCardSkeleton } from '@/components/effect-card-skeleton'
import { SiteFooter } from '@/components/site-footer'
import { cn } from '@/lib/utils'
import { isTypingTarget } from '@/lib/tray-events'

type Filter = 'All' | 'Featured' | 'Favorites' | EffectCategory
type Sort = 'default' | 'az' | 'za' | 'featured'

const PAGE_SIZE = 24

/**
 * How many category chips stay visible before the row collapses behind a
 * "+N more" toggle. The catalog grew to 25 categories; showing all of them
 * pushed four rows of chips between the search bar and the first effect,
 * which is the one thing the page exists to show.
 */
const VISIBLE_CATEGORY_CHIPS = 8

/**
 * Validate that a string is a recognized filter value. Used when reading
 * the `?filter=` query param so we don't accept arbitrary input.
 */
function parseFilter(value: string | null): Filter | null {
  if (!value) return null
  if (value === 'All' || value === 'Featured' || value === 'Favorites') return value
  if ((CATEGORIES as string[]).includes(value)) return value as EffectCategory
  return null
}

/**
 * Validate the `?sort=` query param. Only the 4 known sort modes are accepted;
 * anything else falls back to 'default'.
 */
function parseSort(value: string | null): Sort {
  if (value === 'az' || value === 'za' || value === 'featured') return value
  return 'default'
}

export default function Home() {
  const [query, setQuery] = React.useState('')
  // Initial filter is set from ?filter= on first client mount (see below).
  const [filter, setFilter] = React.useState<Filter>('All')
  const [sort, setSort] = React.useState<Sort>('default')
  const [page, setPage] = React.useState(1)
  const [isRolling, setIsRolling] = React.useState(false)
  const [showSweep, setShowSweep] = React.useState(false)
  const [popKey, setPopKey] = React.useState(0)
  const [allCategoriesShown, setAllCategoriesShown] = React.useState(false)
  const { favorites } = useFavorites()
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const gridTopRef = React.useRef<HTMLDivElement>(null)
  const rollTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  // Ref indirection so the global keyboard / event listeners (mounted once
  // with [] deps) always call the latest `surprise` function instead of a
  // stale closure from first render.
  const surpriseRef = React.useRef<() => void>(() => {})

  /* ---------------- AI search mode ----------------
   * When aiMode is ON, the search bar switches from substring matching
   * to natural-language semantic search via /api/ai/search. The client
   * pre-filters the catalog down to a candidate pool (substring match
   * across name + tags + category + description, capped at 80) and
   * sends that pool + the query to the API. The LLM ranks the
   * candidates and returns a JSON array of IDs; we display those
   * effects in ranked order, ignoring the normal sort + pagination.
   */
  const [aiMode, setAiMode] = React.useState(false)
  const [aiLoading, setAiLoading] = React.useState(false)
  const [aiRankedIds, setAiRankedIds] = React.useState<string[] | null>(null)
  const aiRequestIdRef = React.useRef(0)

  // On first client mount, read ?filter=, ?q=, and ?sort= from the URL so
  // deep-links from the detail page's "Browse all in category" button land on
  // the right tab, and so shared search URLs work. We use this instead of
  // useSearchParams() to avoid the Suspense boundary requirement that hook
  // imposes during static rendering.
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const f = parseFilter(params.get('filter'))
    if (f && f !== 'All') setFilter(f)
    const q = params.get('q')
    if (q) setQuery(q)
    const s = parseSort(params.get('sort'))
    if (s !== 'default') setSort(s)
  }, [])

  // Keep the URL in sync with the filter, query, and sort, so the user can
  // share / bookmark a particular view (e.g. /library?filter=Buttons&q=neon&sort=az).
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (filter === 'All') {
      params.delete('filter')
    } else {
      params.set('filter', filter)
    }
    const trimmed = query.trim()
    if (trimmed) {
      params.set('q', trimmed)
    } else {
      params.delete('q')
    }
    if (sort === 'default') {
      params.delete('sort')
    } else {
      params.set('sort', sort)
    }
    const qs = params.toString()
    const url = qs ? `/library?${qs}` : '/library'
    window.history.replaceState(null, '', url)
  }, [filter, query, sort])

  /**
   * Shortcuts that only exist on this page: `/` to focus search, and Escape
   * to leave it. ⌘K, `b` and `v` used to be handled here too; they belong to
   * <CommandPalette> and <SiteHeader> now, which is what makes them work on
   * the other eight surfaces rather than just this one.
   */
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) {
        // Allow Escape to blur the search input.
        if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur()
        }
        return
      }
      if (e.key === '/') {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      }
    }
    function onSurpriseMe() {
      // Use the ref so we always invoke the latest `surprise` callback.
      surpriseRef.current()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('hoverlab:surprise-me', onSurpriseMe)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('hoverlab:surprise-me', onSurpriseMe)
    }
  }, [])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const matched = EFFECTS.filter((e) => {
      const matchesCategory =
        filter === 'All' ||
        filter === 'Favorites' ||
        filter === 'Featured' ||
        e.category === filter
      const matchesFavorites =
        filter !== 'Favorites' || favorites.has(e.id)
      const matchesFeatured =
        filter !== 'Featured' || e.featured === true
      const matchesQuery =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.tags ?? []).some((t) => t.toLowerCase().includes(q))
      return matchesCategory && matchesFavorites && matchesFeatured && matchesQuery
    })

    // Apply sort. 'default' preserves the original EFFECTS order (which is
    // grouped by category in the source file — a deliberate curation choice).
    if (sort === 'az') {
      matched.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sort === 'za') {
      matched.sort((a, b) => b.name.localeCompare(a.name))
    } else if (sort === 'featured') {
      // Featured effects first, then the rest in default order.
      matched.sort((a, b) => {
        const af = a.featured ? 0 : 1
        const bf = b.featured ? 0 : 1
        if (af !== bf) return af - bf
        return 0
      })
    }
    return matched
  }, [query, filter, sort, favorites])

  /*
   * Reset to the first page whenever the result set changes.
   *
   * The favorites dependency is narrowed to the Favorites tab on purpose.
   * Depending on the whole `favorites` set meant every heart click anywhere
   * in the grid reset pagination — favorite something on page 7 and the
   * page you were reading jumped back to page 1. Favoriting only changes
   * *which* effects match while that tab is the active filter, so that is
   * the only time it should move anyone.
   */
  const favoritesFilterSize = filter === 'Favorites' ? favorites.size : 0
  React.useEffect(() => {
    setPage(1)
  }, [query, filter, sort, favoritesFilterSize])

  /* Track non-AI searches, debounced so a single query isn't recorded once
   * per keystroke. Queries that return nothing are the useful half of this
   * data — they're the gaps in the catalog worth filling. */
  React.useEffect(() => {
    const q = query.trim()
    if (!q || aiMode) return
    const timer = setTimeout(() => {
      track('search_performed', { query: q, result_count: filtered.length })
    }, 800)
    return () => clearTimeout(timer)
  }, [query, aiMode, filtered.length])

  /* ---------------- AI search fetch ----------------
   * When AI mode is ON and the user types, debounce 400ms then call
   * /api/ai/search with the query + a client-side candidate pool.
   * Race-condition guard: each request gets an incrementing ID; only
   * the response matching the latest ID is applied to state.
   */
  React.useEffect(() => {
    if (!aiMode) {
      setAiRankedIds(null)
      setAiLoading(false)
      return
    }
    const q = query.trim()
    if (!q) {
      setAiRankedIds(null)
      setAiLoading(false)
      return
    }

    setAiLoading(true)
    const requestId = ++aiRequestIdRef.current
    const startedAt = performance.now()
    const timer = setTimeout(async () => {
      // Build a candidate pool: substring match across name, id, category,
      // description, tags — same fields the normal search uses. Cap at 80
      // to keep the LLM prompt bounded.
      const ql = q.toLowerCase()
      const candidates = EFFECTS.filter(
        (e) =>
          e.name.toLowerCase().includes(ql) ||
          e.id.toLowerCase().includes(ql) ||
          e.category.toLowerCase().includes(ql) ||
          e.description.toLowerCase().includes(ql) ||
          (e.tags ?? []).some((t) => t.toLowerCase().includes(ql)),
      )
        .slice(0, 80)
        .map((e) => ({
          id: e.id,
          name: e.name,
          category: e.category,
          description: e.description,
        }))

      // If no substring candidates, send the full pool of featured effects
      // as a fallback so the LLM still has something semantic to work with.
      const pool =
        candidates.length > 0
          ? candidates
          : EFFECTS.filter((e) => e.featured)
              .slice(0, 80)
              .map((e) => ({
                id: e.id,
                name: e.name,
                category: e.category,
                description: e.description,
              }))

      try {
        const res = await fetch('/api/ai/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, candidates: pool }),
        })
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const data = (await res.json()) as { ids?: string[] }
        // Only apply if this is still the latest request.
        if (requestId === aiRequestIdRef.current) {
          const ids = Array.isArray(data.ids) ? data.ids : []
          setAiRankedIds(ids)
          setAiLoading(false)
          // AI search costs an LLM call per query — tracking latency and
          // hit rate is what tells us whether it earns that cost.
          track('ai_search_performed', {
            query: q,
            result_count: ids.length,
            ms: Math.round(performance.now() - startedAt),
          })
        }
      } catch (err) {
        console.error('[ai-search] fetch failed:', err)
        if (requestId === aiRequestIdRef.current) {
          setAiRankedIds([])
          setAiLoading(false)
          toast.error('AI search failed', {
            description: 'Falling back to regular search — try again.',
          })
        }
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [aiMode, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageStart = (safePage - 1) * PAGE_SIZE
  const pageEnd = Math.min(pageStart + PAGE_SIZE, filtered.length)
  const paged = filtered.slice(pageStart, pageEnd)

  /* ---------------- AI-mode display list ----------------
   * When AI mode is ON and we have ranked IDs, build the display list
   * by mapping IDs back to effects in ranked order. Effects that the
   * LLM returned but no longer exist (shouldn't happen — we filter
   * server-side — but defensive) are dropped. Pagination is disabled
   * in AI mode (the LLM returns at most 20, so one page is enough).
   */
  const aiDisplay: EffectMeta[] | null = React.useMemo(() => {
    if (!aiMode || !aiRankedIds || aiRankedIds.length === 0) return null
    const byId = new Map(EFFECTS.map((e) => [e.id, e]))
    const out: EffectMeta[] = []
    for (const id of aiRankedIds) {
      const e = byId.get(id)
      if (e) out.push(e)
    }
    return out.length > 0 ? out : null
  }, [aiMode, aiRankedIds])

  const displayList = aiDisplay ?? paged
  const displayTotal = aiDisplay ? aiDisplay.length : filtered.length

  /* ---------------- Category chip row ----------------
   * Collapsed to the first VISIBLE_CATEGORY_CHIPS by default. The active
   * category is always appended when it falls outside that window, so
   * arriving via ?filter=Timelines%20%26%20Steps still shows which filter
   * is on rather than a row of chips where none is highlighted.
   */
  const visibleCategories = React.useMemo(() => {
    if (allCategoriesShown) return CATEGORIES
    const head = CATEGORIES.slice(0, VISIBLE_CATEGORY_CHIPS)
    const isCategoryFilter = (CATEGORIES as string[]).includes(filter)
    if (isCategoryFilter && !head.includes(filter as EffectCategory)) {
      return [...head, filter as EffectCategory]
    }
    return head
  }, [allCategoriesShown, filter])

  const hiddenCategoryCount = allCategoriesShown
    ? 0
    : CATEGORIES.length - visibleCategories.length

  /* ---------------- Lazy markup + CSS for the visible page ----------------
   * The client only holds effect *metadata* (see `@/lib/effect-index`) —
   * filtering, search, and sort all run against that. The `html` / `css`
   * needed to actually render a card is fetched for just the effects on
   * screen (24 per page, or the AI result set), then cached process-wide
   * so paging back is instant. Hand-crafted effects are bundled and
   * resolve on the first render with no request at all.
   */
  const visibleIds = React.useMemo(
    () => displayList.map((e) => e.id),
    [displayList],
  )
  const { get: getEffect } = useEffectDetails(visibleIds)

  /**
   * Slot-machine "Surprise me":
   *  1. Fire a color sweep across the screen.
   *  2. Rapidly cycle through random pages (~6 cycles over ~600ms).
   *  3. Land on a final random page (different from the start when possible).
   *  4. Pop-in the grid + celebratory toast with the page number.
   */
  const surprise = React.useCallback(() => {
    if (filtered.length === 0) return
    // Don't restart if already rolling.
    if (isRolling) return

    const tp = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const startPage = safePage

    // Fire the sweep overlay.
    setShowSweep(true)
    window.setTimeout(() => setShowSweep(false), 900)

    setIsRolling(true)

    // Quick page cycling for the slot-machine feel.
    const cycles = 6
    const intervalMs = 90
    let cycle = 0
    rollTimerRef.current = setInterval(() => {
      cycle += 1
      if (cycle >= cycles) {
        // Land on a final random page (avoid the start page when possible).
        if (rollTimerRef.current) {
          clearInterval(rollTimerRef.current)
          rollTimerRef.current = null
        }
        let final = Math.floor(Math.random() * tp) + 1
        if (tp > 1 && final === startPage) {
          final = (final % tp) + 1
        }
        setPage(final)
        setIsRolling(false)
        // Trigger pop-in animation by re-keying the grid wrapper.
        setPopKey((k) => k + 1)
        // Defer scroll until after the page state has rendered.
        requestAnimationFrame(() => {
          gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
        // Celebratory toast.
        toast.success('✨ Surprise!', {
          description: `Landed on page ${final} of ${tp} — ${filtered.length.toLocaleString('en-US')} effects to explore.`,
          duration: 2400,
        })
        return
      }
      // Mid-roll: jump to a random page each cycle.
      const r = Math.floor(Math.random() * tp) + 1
      setPage(r)
    }, intervalMs)
  }, [filtered.length, isRolling, safePage])

  // Keep the ref in sync so the global event listener always calls the
  // latest version of `surprise`.
  React.useEffect(() => {
    surpriseRef.current = surprise
  }, [surprise])

  // Clean up the interval on unmount.
  React.useEffect(() => {
    return () => {
      if (rollTimerRef.current) clearInterval(rollTimerRef.current)
    }
  }, [])

  /**
   * Change page and bring the top of the grid back into view.
   *
   * The pagination control sits *below* the grid, so by the time a user
   * clicks it they're scrolled to the bottom of the page. Updating `page`
   * alone swaps the cards out above the viewport and leaves the scroll
   * position untouched — the new results are off-screen and it reads as
   * though the button did nothing. Scrolling to `gridTopRef` (which carries
   * `scroll-mt-20` to clear the sticky header) is what makes the change
   * visible. The surprise-me roll does the same thing for the same reason.
   */
  const goToPage = React.useCallback(
    (next: number) => {
      const target = Math.min(Math.max(1, next), totalPages)
      setPage(target)
      gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    [totalPages],
  )

  // Build a compact list of page numbers to show in the pagination control.
  const pageNumbers = React.useMemo(() => {
    const pages: (number | '…')[] = []
    const add = (n: number | '…') => pages.push(n)
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) add(i)
    } else {
      add(1)
      if (safePage > 3) add('…')
      const start = Math.max(2, safePage - 1)
      const end = Math.min(totalPages - 1, safePage + 1)
      for (let i = start; i <= end; i++) add(i)
      if (safePage < totalPages - 2) add('…')
      add(totalPages)
    }
    return pages
  }, [safePage, totalPages])

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Surprise-me color sweep overlay (rendered only while rolling) */}
      {showSweep ? <div className="fx-surprise-sweep" aria-hidden="true" /> : null}

      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -top-20 right-1/4 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="absolute top-40 left-1/3 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      {/* The one header. This page carried its own until now — brand,
          Quick find and eight bare icons, but not a single link to
          /blocks, /pages or /templates. The library is where most
          visitors land, so the rung they arrived on was the only rung
          they could see. */}
      <SiteHeader />

      {/*
        An index header, not a second marketing hero.

        This page used to open with the same furniture as the landing page: a
        pill badge, a two-line display headline and a four-line paragraph,
        with the tier definition stacked above all of it. Measured at
        1440×1000, the first effect card started around y=820 — the page that
        exists to show 4,308 things led with one of them barely on screen.
        The landing page already makes this pitch to anyone who came through
        the front door, and everyone else arrived from a search result and
        wants the search box.

        The definition stays. It is the one thing here a first-time visitor
        actually needs and the marketing copy never said — what an "effect"
        is — and it costs one line.
      */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-6 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="type-hub">
            {EFFECTS.length.toLocaleString('en-US')} CSS effects
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm text-body sm:text-base">
            Live demos and copy-ready code across {CATEGORIES.length}{' '}
            categories — no JavaScript, no frameworks, no dependencies.
          </p>
          <TierDefinition
            tier="effect"
            className="mx-auto mt-5 max-w-2xl text-left"
          />
        </div>

        {/* Search + Surprise me */}
        <div className="mx-auto mt-8 flex max-w-2xl items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                aiMode
                  ? 'Describe what you want… e.g. "button that pulses red"'
                  : 'Search by name, category, tag, or keyword…'
              }
              className={cn(
                'h-12 rounded-full border-border/60 bg-background/70 pl-11 pr-12 text-base shadow-sm backdrop-blur',
                aiMode && 'border-primary/50 ring-1 ring-primary/20',
              )}
            />
            {/*
              AI mode toggle, inside the search input.

              This was a bare sparkle in a circle with a `title`. A sparkle
              is the least specific glyph in the set — it means "new", "AI",
              "magic" and "featured" elsewhere on this very page — and the
              control changes what typing into the box *does*. It now says
              so, and says it again under the field once it is on.
            */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    setAiMode((v) => !v)
                    // Focus the input so the user can immediately type their
                    // natural-language query after enabling AI mode.
                    setTimeout(() => searchInputRef.current?.focus(), 0)
                  }}
                  aria-pressed={aiMode}
                  aria-label={aiMode ? 'Turn off AI search' : 'Turn on AI search'}
                  className={cn(
                    'absolute right-2 top-1/2 inline-flex h-8 -translate-y-1/2 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-all',
                    aiMode
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Sparkles aria-hidden className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">AI</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-64">
                {aiMode
                  ? 'AI search is on — describe what you want in plain English and results are ranked by meaning. Click to go back to keyword search.'
                  : 'Search by describing what you want ("a button that pulses red") instead of matching words in the name.'}
              </TooltipContent>
            </Tooltip>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={surprise}
            disabled={isRolling || filtered.length === 0}
            className={cn(
              'h-12 gap-1.5 rounded-full px-4 shadow-sm transition-colors',
              isRolling && 'fx-surprise-shake',
            )}
            title="Jump to a random page"
          >
            <Shuffle className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isRolling ? 'Rolling…' : 'Surprise me'}
            </span>
          </Button>
        </div>

        {/* Filter chips */}
        <p className="mt-7 text-center text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Filter by category</span>{' '}
          — narrows the grid below. The number on each chip is how many effects
          are in it.
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <CategoryChip
            label="All"
            count={EFFECTS.length}
            active={filter === 'All'}
            onClick={() => setFilter('All')}
          />
          <CategoryChip
            label="Featured"
            count={EFFECTS.filter((e) => e.featured).length}
            active={filter === 'Featured'}
            onClick={() => setFilter('Featured')}
            icon={<Star className="h-3 w-3" />}
          />
          <CategoryChip
            label="Favorites"
            count={favorites.size}
            active={filter === 'Favorites'}
            onClick={() => setFilter('Favorites')}
            icon={<Heart className="h-3 w-3" />}
          />
          {visibleCategories.map((c) => {
            const count = EFFECTS.filter((e) => e.category === c).length
            return (
              <CategoryChip
                key={c}
                label={c}
                count={count}
                active={filter === c}
                onClick={() => setFilter(c)}
              />
            )
          })}
          {hiddenCategoryCount > 0 ? (
            <button
              type="button"
              onClick={() => setAllCategoriesShown(true)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Plus className="h-3 w-3" />
              {hiddenCategoryCount} more
            </button>
          ) : allCategoriesShown ? (
            <button
              type="button"
              onClick={() => setAllCategoriesShown(false)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Minus className="h-3 w-3" />
              Show fewer
            </button>
          ) : null}
        </div>

        {/* Route to the static category hubs. The chips filter this grid;
            the hubs are the indexable, linkable pages per category. */}
        <div className="mt-3 text-center">
          <Link
            href="/category"
            className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Or browse the {CATEGORIES.length} category pages →
          </Link>
        </div>
      </section>

      {/* Effect grid */}
      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        {/* Recently-viewed rail — only shown when not actively filtering or
            searching, so it doesn't compete with focused result sets. */}
        {filter === 'All' && !query.trim() ? <RecentlyViewedRail /> : null}

        {displayTotal === 0 && !aiLoading ? (
          <div className="mx-auto mt-16 max-w-md text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              {aiMode ? (
                <Sparkles className="h-5 w-5 text-primary" />
              ) : filter === 'Favorites' ? (
                <Heart className="h-5 w-5 text-muted-foreground" />
              ) : filter === 'Featured' ? (
                <Star className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Search className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-semibold">
              {aiMode
                ? 'No AI matches'
                : filter === 'Favorites'
                  ? 'No favorites yet'
                  : filter === 'Featured'
                    ? 'No featured effects match'
                    : 'No effects found'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {aiMode
                ? 'Try rephrasing your query, or toggle AI search off to use keyword matching.'
                : filter === 'Favorites'
                  ? 'Tap the heart on any effect to save it here for quick access.'
                  : filter === 'Featured'
                    ? 'Try a different keyword or clear the search.'
                    : 'Try a different keyword or clear the filter to see all effects.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setQuery('')
                setFilter('All')
              }}
            >
              Reset
            </Button>
          </div>
        ) : (
          <>
            {/* AI mode banner — shown when AI search is active */}
            {aiMode && query.trim() ? (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm">
                {aiLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Sparkles className="h-4 w-4 text-primary" />
                )}
                <span className="text-foreground">
                  {aiLoading
                    ? 'Asking the AI to rank matches…'
                    : `AI-ranked results (${displayTotal.toLocaleString('en-US')})`}
                </span>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  — semantic relevance, not just keywords
                </span>
              </div>
            ) : null}

            {/* Result meta + sort control (hidden in AI mode — sort is semantic) */}
            {!(aiMode && query.trim()) ? (
              <div ref={gridTopRef} className="mb-5 flex flex-wrap items-center gap-3 scroll-mt-20">
                <h2 className="text-xl font-bold tracking-tight">
                  {filter === 'All' ? 'All effects' : filter}
                </h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {displayTotal.toLocaleString('en-US')}
                </span>
                <div className="h-px flex-1 bg-border/60" />
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  Showing {pageStart + 1}–{pageEnd} of {filtered.length.toLocaleString('en-US')}
                </span>
                <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SelectTrigger
                        className="h-8 w-[150px] gap-1.5 rounded-full border-border/60 bg-background/70 text-xs shadow-sm"
                        aria-label="Sort effects"
                      >
                        <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Change the order of the grid below</TooltipContent>
                  </Tooltip>
                  {/* Each option says what it orders by. "Curated" in
                      particular meant nothing on its own — it is the
                      catalog's own hand-set order, not a sort at all. */}
                  <SelectContent>
                    <SelectItem value="default">
                      Curated order
                      <span className="ml-1.5 text-muted-foreground">· as catalogued</span>
                    </SelectItem>
                    <SelectItem value="featured">
                      Featured first
                      <span className="ml-1.5 text-muted-foreground">· picks on top</span>
                    </SelectItem>
                    <SelectItem value="az">Name A → Z</SelectItem>
                    <SelectItem value="za">Name Z → A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div
              key={popKey}
              className={cn(
                'fx-surprise-grid grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3',
                isRolling && 'fx-surprise-rolling',
                !isRolling && popKey > 0 && 'fx-surprise-pop',
              )}
            >
              {displayList.map((meta) => {
                const effect = getEffect(meta.id)
                return effect ? (
                  <EffectCard key={meta.id} effect={effect} />
                ) : (
                  <EffectCardSkeleton key={meta.id} meta={meta} />
                )
              })}
            </div>

            {/* Pagination — hidden in AI mode (results are already ≤20) */}
            {!aiMode && totalPages > 1 ? (
              <div className="mt-10 flex flex-col items-center gap-3">
                <div className="flex items-center gap-1">
                  <PagerButton
                    onClick={() => goToPage(safePage - 1)}
                    disabled={safePage <= 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </PagerButton>
                  {pageNumbers.map((n, idx) =>
                    n === '…' ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 text-sm text-muted-foreground"
                      >
                        …
                      </span>
                    ) : (
                      <PagerButton
                        key={n}
                        onClick={() => goToPage(n)}
                        active={n === safePage}
                        aria-label={`Page ${n}`}
                      >
                        {n}
                      </PagerButton>
                    ),
                  )}
                  <PagerButton
                    onClick={() => goToPage(safePage + 1)}
                    disabled={safePage >= totalPages}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </PagerButton>
                </div>
                <p className="text-xs text-muted-foreground">
                  Page {safePage} of {totalPages}
                </p>
              </div>
            ) : null}
          </>
        )}
      </main>

      {/* Footer */}
      <SiteFooter />

      {/* The bundle and compare drawers, the shortcuts dialog and the
          command palette are all mounted by <SiteHeader> now — one copy
          each, on every surface, instead of six copies on six of them. */}
    </div>
  )
}

function CategoryChip({
  label,
  count,
  active,
  onClick,
  icon,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
  icon?: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/30'
          : 'border-border/60 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground',
      )}
    >
      {icon}
      {label}
      <span
        className={cn(
          'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
          active ? 'bg-primary-foreground/20' : 'bg-muted',
        )}
      >
        {count}
      </span>
    </button>
  )
}

function PagerButton({
  children,
  onClick,
  active,
  disabled,
  ...rest
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  disabled?: boolean
} & React.AriaAttributes) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border/60 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground',
        disabled && 'cursor-not-allowed opacity-40 hover:border-border/60 hover:text-muted-foreground',
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
