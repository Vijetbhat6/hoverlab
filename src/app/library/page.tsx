'use client'

import * as React from 'react'
import Link from 'next/link'
import { Search, Sparkles, Heart, Star, ChevronLeft, ChevronRight, Shuffle, ArrowDownUp, Loader2, Plus, Minus, TrendingUp, Clock, Waves, ImagePlus, X } from 'lucide-react'
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
import { addedAt } from '@/lib/recency'
import { newSeed, parseSeed, seededShuffle } from '@/lib/shuffle'
import { EffectCardSkeleton } from '@/components/effect-card-skeleton'
import { SiteFooter } from '@/components/site-footer'
import { LibraryProTile } from '@/components/library-pro-tile'
import { cn } from '@/lib/utils'
import { isTypingTarget } from '@/lib/tray-events'
import { isShaderRenderer } from '@/lib/shaders/shader-types'
import { searchEffects } from '@/lib/search/effects'
import { COLOR_BUCKETS, COLOR_LABEL, isColorBucket, type ColorBucket } from '@/lib/search/color'
import { preloadEffectColors, useEffectColors } from '@/lib/search/use-effect-colors'
import { ACCEPTED_IMAGE_TYPES, isImageFile, prepareScreenshot } from '@/lib/search/image-client'
import { LEVEL_LABEL, type ArtifactLevel } from '@/lib/artifact-types'

type Filter = 'All' | 'Featured' | 'Favorites' | 'Shaders' | EffectCategory
type Sort = 'default' | 'az' | 'za' | 'featured' | 'trending' | 'recent' | 'random'

const PAGE_SIZE = 24

/**
 * How many effects run rather than being declared.
 *
 * Counted from the index at module load instead of inside the render, the
 * same as every other chip's count is derived — but unlike the category
 * counts this one cannot be read off `catalog-stats`, because the shader
 * tier is not a category.
 */
const SHADER_TOTAL = EFFECTS.filter((e) => isShaderRenderer(e.renderer)).length

/**
 * How many category chips stay visible before the row collapses behind a
 * "+N more" toggle. The catalog grew to 25 categories; showing all of them
 * pushed four rows of chips between the search bar and the first effect,
 * which is the one thing the page exists to show.
 */
const VISIBLE_CATEGORY_CHIPS = 8

/** The tiers this page is not. The Effects tier is the page itself. */
const OTHER_TIERS: readonly ArtifactLevel[] = ['primitive', 'block', 'page', 'template']

/**
 * A /browse link that keeps the search. `level` is that page's name for the
 * tier; absent means all of them.
 */
function browseTierHref(level: ArtifactLevel | undefined, query: string): string {
  const params = new URLSearchParams()
  const q = query.trim()
  if (q) params.set('q', q)
  if (level) params.set('level', level)
  const qs = params.toString()
  return qs ? `/browse?${qs}` : '/browse'
}

/**
 * Validate that a string is a recognized filter value. Used when reading
 * the `?filter=` query param so we don't accept arbitrary input.
 */
function parseFilter(value: string | null): Filter | null {
  if (!value) return null
  if (value === 'All' || value === 'Featured' || value === 'Favorites' || value === 'Shaders')
    return value
  if ((CATEGORIES as string[]).includes(value)) return value as EffectCategory
  return null
}

/**
 * Validate the `?sort=` query param. Only the known sort modes are accepted;
 * anything else falls back to 'default'.
 */
function parseSort(value: string | null): Sort {
  if (
    value === 'az' ||
    value === 'za' ||
    value === 'featured' ||
    value === 'trending' ||
    value === 'recent' ||
    value === 'random'
  ) {
    return value
  }
  return 'default'
}

/**
 * How many trending rows to ask the API for.
 *
 * This is a sort over 835 effects backed by a ranking that only covers the
 * head of the distribution, and that is the honest shape of the data: a
 * seven-day window has a long tail of ids nobody touched, and ordering
 * those by a zero would be arbitrary dressed up as measurement. The ranked
 * ones lead; everything else keeps its curated order behind them, and the
 * banner says so.
 *
 * 50 is the API's own ceiling (`/api/v1/trending` clamps there).
 */
const TRENDING_LIMIT = 50

/**
 * What `sort=trending` knows right now.
 *
 * `null` = not fetched yet, `[]` = fetched and there is genuinely no usage
 * data. The two are different answers and the UI says different things
 * about them: a fresh deployment has no counters at all, and pretending
 * otherwise is exactly what <TrendingRail> refuses to do.
 */
type TrendingRank = Map<string, number> | null

export default function Home() {
  const [query, setQuery] = React.useState('')
  // Initial filter is set from ?filter= on first client mount (see below).
  const [filter, setFilter] = React.useState<Filter>('All')
  const [sort, setSort] = React.useState<Sort>('default')
  /*
   * The Randomized sort's seed. Null until the reader picks that sort.
   *
   * This page already had a random *pick* — "Surprise me" rolls the grid
   * and lands on one effect. That is a different thing from a random
   * *order*: the roll answers "show me something", the sort answers "let me
   * browse the parts of the catalog the curated top never reaches". Both
   * are worth having, and they share nothing but the word.
   */
  const [seed, setSeed] = React.useState<number | null>(null)
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
   * When aiMode is ON, the search bar switches from keyword matching to
   * natural-language semantic search via /api/ai/search. This page sends
   * only the query (and a screenshot, if there is one): the SERVER picks
   * the candidate pool from the whole catalog with the shared search engine
   * and the model ranks it, returning a JSON array of IDs. We display those
   * effects in ranked order, ignoring the normal sort + pagination.
   */
  const [aiMode, setAiMode] = React.useState(false)
  const [aiLoading, setAiLoading] = React.useState(false)
  const [aiRankedIds, setAiRankedIds] = React.useState<string[] | null>(null)
  const aiRequestIdRef = React.useRef(0)

  /* ---------------- Screenshot search ----------------
   * A screenshot rides the same request as the words: it is what AI search
   * is *given*, not a separate mode, so attaching one switches AI search on.
   * `aiConfigured` is null until the server has been asked, then whatever it
   * said — learned lazily (see the effect below) so an ordinary visit to
   * this page never spends a function call finding out.
   */
  const [screenshot, setScreenshot] = React.useState<string | null>(null)
  const [imageBusy, setImageBusy] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const [aiConfigured, setAiConfigured] = React.useState<boolean | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const aiConfiguredRequestedRef = React.useRef(false)

  /* ---------------- Colour filter ----------------
   * A main colour read off each effect's own source at build time (see
   * `@/lib/search/color` for what "main" means and what is left untagged).
   * The table is its own chunk, so the filter costs the first load nothing.
   */
  const [colorFilter, setColorFilter] = React.useState<ColorBucket | null>(null)
  const { colors: effectColors, failed: colorsFailed } = useEffectColors(colorFilter !== null)

  /* ---------------- Trending sort ----------------
   * Fetched lazily, once, the first time someone picks the Trending sort.
   * Not on mount: the counters live in Firestore, and paying for that read
   * on every visit to the busiest page — for a sort most visitors never
   * choose — is the wrong trade. Kept in state afterwards so switching
   * away and back is free.
   */
  const [trendingRank, setTrendingRank] = React.useState<TrendingRank>(null)
  const [trendingLoading, setTrendingLoading] = React.useState(false)
  const trendingRequestedRef = React.useRef(false)

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
    const c = params.get('color')
    if (isColorBucket(c)) setColorFilter(c)
    const s = parseSort(params.get('sort'))
    if (s !== 'default') setSort(s)
    // A shuffled grid reopens in the same order it was linked in. A
    // `sort=random` with no usable seed gets a fresh one — any order
    // answers the request that was made.
    if (s === 'random') setSeed(parseSeed(params.get('seed')) ?? newSeed())
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
    if (colorFilter) {
      params.set('color', colorFilter)
    } else {
      params.delete('color')
    }
    if (sort === 'default') {
      params.delete('sort')
    } else {
      params.set('sort', sort)
    }
    // Only while the shuffle is showing, so switching away does not leave
    // a stale seed in a URL that no longer uses one.
    if (sort === 'random' && seed !== null) {
      params.set('seed', String(seed))
    } else {
      params.delete('seed')
    }
    const qs = params.toString()
    const url = qs ? `/library?${qs}` : '/library'
    window.history.replaceState(null, '', url)
  }, [filter, query, sort, seed, colorFilter])

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

  /*
   * Load the trending ranking the first time it is asked for.
   *
   * An error and an empty ranking collapse to the same state on purpose:
   * both mean "there is nothing measured to show you", and the banner says
   * that rather than inventing an order. `trendingRank` staying non-null
   * afterwards is what stops a failed fetch retrying on every re-render.
   */
  React.useEffect(() => {
    if (sort !== 'trending' || trendingRequestedRef.current) return
    // A ref, not the loading flag: `setTrendingLoading(true)` re-runs this
    // effect, and a cleanup keyed on that would cancel the request it just
    // started — leaving the spinner up forever.
    trendingRequestedRef.current = true
    setTrendingLoading(true)

    fetch(`/api/v1/trending?level=effect&limit=${TRENDING_LIMIT}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { items?: { id: string }[] } | null) => {
        const items = data?.items ?? []
        setTrendingRank(new Map(items.map((item, index) => [item.id, index])))
      })
      .catch(() => setTrendingRank(new Map()))
      .finally(() => setTrendingLoading(false))
  }, [sort])

  /*
   * The colour set, or null when no colour is chosen. While the table is
   * still loading it is also null, so `colorPending` is what stops a deep
   * link to `?color=blue` flashing the whole catalog before it narrows.
   */
  const colorSet = colorFilter && effectColors ? effectColors.ids(colorFilter) : null
  const colorPending = colorFilter !== null && !effectColors && !colorsFailed

  const filtered = React.useMemo(() => {
    /*
     * The shared engine (`@/lib/search`): tokenised, typo-tolerant, weighted
     * by field, expanded through a short curated synonym table. Every other
     * filter below still narrows its result. `scores` doubles as the ranking
     * when the sort is left on its default.
     */
    const q = query.trim()
    const scores = q ? new Map(searchEffects(q).map((h) => [h.doc.id, h.score])) : null
    const matched = EFFECTS.filter((e) => {
      const matchesCategory =
        filter === 'All' ||
        filter === 'Favorites' ||
        filter === 'Featured' ||
        filter === 'Shaders' ||
        e.category === filter
      const matchesFavorites =
        filter !== 'Favorites' || favorites.has(e.id)
      const matchesFeatured =
        filter !== 'Featured' || e.featured === true
      /*
       * Cuts across the categories rather than being one of them: the
       * shader tier spans Backgrounds, Patterns, Glow, Text and 3D, and
       * filing it under a thirty-third category would have meant either
       * mis-filing an aurora as "not a background" or hiding the tier
       * inside five different chips.
       */
      const matchesShaders =
        filter !== 'Shaders' || isShaderRenderer(e.renderer)
      const matchesQuery = !scores || scores.has(e.id)
      // Untagged effects are excluded while a colour is chosen: the source
      // does not say what colour they are, and "no" is the honest answer to
      // "is this one blue?" when the honest answer is "unknown".
      const matchesColor = !colorSet || colorSet.has(e.id)
      return (
        matchesCategory &&
        matchesFavorites &&
        matchesFeatured &&
        matchesShaders &&
        matchesQuery &&
        matchesColor
      )
    })

    // Apply sort. 'default' preserves the original EFFECTS order (which is
    // grouped by category in the source file — a deliberate curation choice)
    // — except while searching, where best match first is what the box
    // promised. The sort is stable, so equal scores keep curated order.
    if (sort === 'default' && scores) {
      matched.sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0))
    } else if (sort === 'az') {
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
    } else if (sort === 'recent') {
      // Newest first. An effect with no ledger date sorts last rather than
      // to the top or to 1970: a missing date means the ledger has not been
      // rebuilt since it landed, and guessing either way would put a claim
      // about time on the page that nothing backs. Ties keep catalog order
      // (Array#sort is stable), which matters here — the ledger dates a
      // whole wave of effects to the same day.
      matched.sort((a, b) => {
        const ad = addedAt('effect', a.id)
        const bd = addedAt('effect', b.id)
        if (ad === bd) return 0
        if (!ad) return 1
        if (!bd) return -1
        return bd.localeCompare(ad)
      })
    } else if (sort === 'random' && seed !== null) {
      // Shuffled AFTER filtering, so a category or a search narrows the
      // pool and the shuffle reorders what is left. Shuffling first and
      // filtering second would give the same result here and a wrong one
      // the moment this page paginates — which it does, at 24 a page.
      return seededShuffle(matched, seed)
    } else if (sort === 'trending' && trendingRank && trendingRank.size > 0) {
      // Ranked ids in rank order, then everything the window did not reach,
      // in curated order. Unranked is not "rank 0" — see TRENDING_LIMIT.
      matched.sort((a, b) => {
        const ar = trendingRank.get(a.id) ?? Number.MAX_SAFE_INTEGER
        const br = trendingRank.get(b.id) ?? Number.MAX_SAFE_INTEGER
        if (ar === br) return 0
        return ar - br
      })
    }
    return matched
  }, [query, filter, sort, favorites, trendingRank, seed, colorSet])

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
  }, [query, filter, sort, favoritesFilterSize, colorFilter])

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

  /* ---------------- Is AI search switched on? ----------------
   * Asked once, and only when someone reaches for it — turning AI search on
   * or hovering the screenshot button — never on an ordinary visit. The
   * answer is what makes "not configured" an honest disabled state instead
   * of a search that fails after the user has typed and waited.
   */
  const checkAiConfigured = React.useCallback(() => {
    if (aiConfiguredRequestedRef.current) return
    aiConfiguredRequestedRef.current = true
    fetch('/api/ai/search')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { configured?: boolean } | null) => {
        if (data && typeof data.configured === 'boolean') setAiConfigured(data.configured)
        else aiConfiguredRequestedRef.current = false
      })
      .catch(() => {
        aiConfiguredRequestedRef.current = false
      })
  }, [])

  React.useEffect(() => {
    if (aiMode) checkAiConfigured()
  }, [aiMode, checkAiConfigured])

  /* ---------------- AI search fetch ----------------
   * When AI mode is ON and the user types (or attaches a screenshot),
   * debounce 400ms then call /api/ai/search with the query and, if there is
   * one, the image. The SERVER picks the candidates — with the same
   * typo-tolerant engine as this page's own search, over the whole catalog —
   * so this sends no candidate list at all. It used to send ~80
   * substring-matched effects, which is why a query with no literal hit
   * ranked 80 featured effects that had nothing to do with it.
   * Race-condition guard: each request gets an incrementing ID; only
   * the response matching the latest ID is applied to state.
   */
  React.useEffect(() => {
    const q = query.trim()
    // A server that has said it has no model gets no requests: they would
    // fail, and the keyword results below are already the right answer.
    if (!aiMode || (!q && !screenshot) || aiConfigured === false) {
      setAiRankedIds(null)
      setAiLoading(false)
      return
    }

    setAiLoading(true)
    const requestId = ++aiRequestIdRef.current
    const startedAt = performance.now()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/ai/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, ...(screenshot ? { image: screenshot } : {}) }),
        })
        if (res.status === 503) {
          // "Not configured" — remember it, and fall back to keyword results
          // quietly. The banner explains; a toast per keystroke would nag.
          if (requestId === aiRequestIdRef.current) {
            setAiConfigured(false)
            setAiRankedIds(null)
            setAiLoading(false)
          }
          return
        }
        if (!res.ok) {
          // The limit and validation errors carry a sentence meant for the
          // person; show it rather than "HTTP 429".
          const detail = (await res.json().catch(() => null)) as { error?: string } | null
          throw new Error(detail?.error ?? `HTTP ${res.status}`)
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
            description:
              err instanceof Error && !err.message.startsWith('HTTP')
                ? err.message
                : 'Falling back to regular search — try again.',
          })
        }
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [aiMode, query, screenshot, aiConfigured])

  /* ---------------- Attaching a screenshot ----------------
   * Paste into the box, drop on it, or pick a file. All three end up here,
   * and the picture is scaled and re-encoded in the browser first so a
   * retina screenshot does not fail the server's size limit.
   */
  const attachScreenshot = React.useCallback(
    async (file: Blob) => {
      setImageBusy(true)
      const result = await prepareScreenshot(file)
      setImageBusy(false)
      if (!result.ok) {
        toast.error('Could not use that image', { description: result.message })
        return
      }
      setScreenshot(result.dataUrl)
      setAiMode(true)
      searchInputRef.current?.focus()
    },
    [],
  )

  const onSearchPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const file = Array.from(e.clipboardData.files).find(isImageFile)
    if (!file) return // plain text: let the input have it
    e.preventDefault()
    void attachScreenshot(file)
  }

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
  /**
   * AI search is *doing something* — it has words or a picture to work from.
   * Turning the toggle on with an empty box changes nothing yet, and the
   * banner, the missing sort control and the missing pagination should not
   * appear until it does.
   */
  const aiActive = aiMode && (query.trim() !== '' || screenshot !== null)
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
          <div
            className={cn(
              'relative flex-1 rounded-full',
              dragging && 'ring-2 ring-primary/60 ring-offset-2 ring-offset-background',
            )}
            // A picture dropped on the box searches by that picture.
            onDragOver={(e) => {
              if (Array.from(e.dataTransfer.items).some((i) => i.kind === 'file')) {
                e.preventDefault()
                setDragging(true)
              }
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              setDragging(false)
              const file = Array.from(e.dataTransfer.files).find(isImageFile)
              if (!file) return
              e.preventDefault()
              void attachScreenshot(file)
            }}
          >
            <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onPaste={onSearchPaste}
              placeholder={
                screenshot
                  ? 'Add a few words to steer it (optional)…'
                  : aiMode
                    ? 'Describe what you want… e.g. "button that pulses red"'
                    : 'Search by name, category, tag, or keyword…'
              }
              className={cn(
                'h-12 rounded-full border-border/60 bg-background/70 ps-11 pe-12 text-base shadow-sm backdrop-blur',
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
                    // A screenshot only means something to AI search, so
                    // leaving that mode takes it with it.
                    if (aiMode) setScreenshot(null)
                    setAiMode((v) => !v)
                    // Focus the input so the user can immediately type their
                    // natural-language query after enabling AI mode.
                    setTimeout(() => searchInputRef.current?.focus(), 0)
                  }}
                  aria-pressed={aiMode}
                  aria-label={aiMode ? 'Turn off AI search' : 'Turn on AI search'}
                  className={cn(
                    'absolute end-2 top-1/2 inline-flex h-8 -translate-y-1/2 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-all',
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
          {/*
            Search by screenshot. Sits beside the box rather than inside it
            because the box already carries the AI toggle, and a second
            control jammed into a pill that narrow would be unreadable at
            phone width. The picker is a real file input behind the button;
            paste and drop reach the same handler.

            Honest about the one way it cannot work: if the server has said
            it has no model, the button is disabled and says why, rather
            than accepting a picture it will never look at.
          */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) void attachScreenshot(file)
            }}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  onPointerEnter={checkAiConfigured}
                  onFocus={checkAiConfigured}
                  disabled={imageBusy || aiConfigured === false}
                  aria-label="Search by screenshot"
                  className="h-12 w-12 rounded-full p-0 shadow-sm"
                >
                  {imageBusy ? (
                    <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus aria-hidden className="h-4 w-4" />
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-64">
              {aiConfigured === false
                ? "Screenshot search needs AI search, which isn't switched on for this site."
                : 'Find effects that look like a screenshot. Choose an image, or paste or drop one on the search box.'}
            </TooltipContent>
          </Tooltip>
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

        {/* The screenshot being searched with. Always removable, and says so
            when it is not being used. */}
        {screenshot ? (
          <div className="mx-auto mt-3 flex max-w-2xl items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-2 pe-3">
            {/* A data: URL the visitor just chose; next/image has nothing to optimise. */}
            <img
              src={screenshot}
              alt="The screenshot you are searching with"
              className="h-14 w-20 shrink-0 rounded-lg border border-border/60 bg-muted object-cover"
            />
            <p className="min-w-0 flex-1 text-xs text-muted-foreground">
              {aiConfigured === false
                ? "Screenshot search needs AI search, which isn't switched on for this site — the picture is not being used."
                : 'Finding effects that look like this. Add a few words in the box to steer it.'}
            </p>
            <button
              type="button"
              onClick={() => setScreenshot(null)}
              aria-label="Remove screenshot"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {/* Tier: this page is the effects tier. The others are one link away
            and carry the search with them, so a query typed here is not lost
            on the way to a block. */}
        <nav
          aria-label="Search another tier"
          className="mt-5 flex flex-wrap items-center justify-center gap-1.5 text-xs"
        >
          <span className="me-1 font-semibold text-foreground">Tier</span>
          <Link
            href={browseTierHref(undefined, query)}
            className="rounded-full border border-border/60 px-3 py-1 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            All
          </Link>
          <span
            aria-current="page"
            className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-medium text-foreground"
          >
            {LEVEL_LABEL.effect.many}
          </span>
          {OTHER_TIERS.map((level) => (
            <Link
              key={level}
              href={browseTierHref(level, query)}
              className="rounded-full border border-border/60 px-3 py-1 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {LEVEL_LABEL[level].many}
            </Link>
          ))}
        </nav>

        {/* Colour: the effect's own main colour, read from its source. */}
        <div
          role="group"
          aria-label="Filter by main colour"
          className="mt-3 flex flex-wrap items-center justify-center gap-2"
        >
          <span className="me-1 text-xs font-semibold text-foreground">Colour</span>
          {COLOR_BUCKETS.map((bucket) => {
            const { name, swatch } = COLOR_LABEL[bucket]
            const count = effectColors?.counts[bucket]
            const active = colorFilter === bucket
            return (
              <button
                key={bucket}
                type="button"
                onClick={() => setColorFilter(active ? null : bucket)}
                onPointerEnter={preloadEffectColors}
                onFocus={preloadEffectColors}
                aria-pressed={active}
                aria-label={count === undefined ? name : `${name}, ${count} effects`}
                title={count === undefined ? name : `${name} · ${count}`}
                className={cn(
                  'h-7 w-7 rounded-full border-2 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  active
                    ? 'scale-110 border-foreground'
                    : 'border-border/60 hover:scale-105 hover:border-foreground/50',
                )}
                style={{ backgroundColor: swatch }}
              />
            )
          })}
          {colorFilter ? (
            <button
              type="button"
              onClick={() => setColorFilter(null)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-border/70 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <X aria-hidden className="h-3 w-3" />
              Clear colour
            </button>
          ) : null}
        </div>
        {colorFilter ? (
          <p
            className="mx-auto mt-2 max-w-2xl text-center text-xs text-muted-foreground"
            aria-live="polite"
          >
            {colorsFailed
              ? 'The colour data could not be loaded — try again in a moment.'
              : effectColors
                ? `Effects where ${COLOR_LABEL[colorFilter].name.toLowerCase()} is a main colour in the stylesheet. ${effectColors.tagged.toLocaleString('en-US')} of ${EFFECTS.length.toLocaleString('en-US')} effects have a colour the source spells out; the rest are left out while a colour is chosen.`
                : 'Loading colour data…'}
          </p>
        ) : null}

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
          <CategoryChip
            label="Shaders"
            count={SHADER_TOTAL}
            active={filter === 'Shaders'}
            onClick={() => setFilter('Shaders')}
            icon={<Waves className="h-3 w-3" />}
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

        {colorPending && displayTotal === 0 ? (
          <div className="mx-auto mt-16 flex max-w-md items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            Loading colour data…
          </div>
        ) : displayTotal === 0 && !aiLoading ? (
          <div className="mx-auto mt-16 max-w-md text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              {aiMode && aiConfigured !== false ? (
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
              {aiMode && aiConfigured !== false
                ? 'No AI matches'
                : colorFilter
                  ? `No ${COLOR_LABEL[colorFilter].name.toLowerCase()} effects match`
                  : filter === 'Favorites'
                  ? 'No favorites yet'
                  : filter === 'Featured'
                    ? 'No featured effects match'
                    : 'No effects found'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {aiMode && aiConfigured !== false
                ? 'Try rephrasing your query, or toggle AI search off to use keyword matching.'
                : colorFilter
                  ? 'Only effects whose stylesheet spells out that colour are matched. Try another colour, or clear it.'
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
                setColorFilter(null)
                setScreenshot(null)
              }}
            >
              Reset
            </Button>
          </div>
        ) : (
          <>
            {/* AI mode banner — shown when AI search is active */}
            {aiActive ? (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm">
                {aiLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Sparkles className="h-4 w-4 text-primary" />
                )}
                <span className="text-foreground">
                  {aiConfigured === false
                    ? "AI search isn't switched on for this site — showing keyword matches"
                    : aiLoading
                      ? screenshot
                        ? 'Looking at your screenshot and ranking matches…'
                        : 'Asking the AI to rank matches…'
                      : `AI-ranked results (${displayTotal.toLocaleString('en-US')})`}
                </span>
                {aiConfigured === false ? null : (
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {screenshot
                      ? '— by how closely an effect would reproduce the look'
                      : '— semantic relevance, not just keywords'}
                  </span>
                )}
              </div>
            ) : null}

            {/* Result meta + sort control (hidden in AI mode — sort is semantic) */}
            {!aiActive ? (
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
                {/* Only while the shuffle is showing — a re-roll button
                    beside a grid in curated order has nothing to do. */}
                {sort === 'random' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSeed(newSeed())
                      setPage(1)
                    }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Shuffle aria-hidden className="h-3.5 w-3.5" />
                    Shuffle again
                    <span className="sr-only">, reordering the effects at random</span>
                  </button>
                ) : null}
                <Select
                  value={sort}
                  onValueChange={(v) => {
                    const next = v as Sort
                    setSort(next)
                    if (next === 'random') setSeed((current) => current ?? newSeed())
                  }}
                >
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
                      <span className="ml-1.5 text-muted-foreground">· best match when searching</span>
                    </SelectItem>
                    <SelectItem value="featured">
                      Featured first
                      <span className="ml-1.5 text-muted-foreground">· picks on top</span>
                    </SelectItem>
                    <SelectItem value="trending">
                      Trending
                      <span className="ml-1.5 text-muted-foreground">· copied most this week</span>
                    </SelectItem>
                    <SelectItem value="recent">
                      Recently added
                      <span className="ml-1.5 text-muted-foreground">· newest first</span>
                    </SelectItem>
                    <SelectItem value="random">
                      Randomized
                      <span className="ml-1.5 text-muted-foreground">· shuffled</span>
                    </SelectItem>
                    <SelectItem value="az">Name A → Z</SelectItem>
                    <SelectItem value="za">Name Z → A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {/* What the chosen order is actually made of. Only the two
                measured sorts get a note — "A → Z" explains itself, and a
                measured order that cannot be read off the cards has to say
                where it came from or it is just a shuffle. */}
            {!aiActive &&
            (sort === 'trending' || sort === 'recent' || sort === 'random') ? (
              <SortNote
                loading={sort === 'trending' && trendingLoading}
                icon={
                  sort === 'trending' ? TrendingUp : sort === 'random' ? Shuffle : Clock
                }
              >
                {sort === 'random' ? (
                  <>
                    {filtered.length.toLocaleString('en-US')} effects in a random
                    order, so the tail of the catalog gets the top of the grid for
                    once. The shuffle is in the address bar — this exact order
                    reopens on a reload and survives being sent to someone else.
                  </>
                ) : sort === 'recent' ? (
                  <>
                    Newest first, dated by when each effect actually landed in the
                    repository. Effects added since the last ledger rebuild carry no
                    date and sort to the end.
                  </>
                ) : trendingLoading ? (
                  <>Reading what people copied and installed this week…</>
                ) : trendingRank && trendingRank.size > 0 ? (
                  <>
                    The {trendingRank.size} most copied and installed effects of the last
                    seven days, in that order — page views are not counted. Everything
                    below them keeps its curated order.
                  </>
                ) : (
                  <>
                    No usage has been recorded yet, so there is nothing to rank — the
                    grid is in its curated order. This fills in on its own once effects
                    start being copied and installed.
                  </>
                )}
              </SortNote>
            ) : null}

            <div
              key={popKey}
              className={cn(
                'fx-surprise-grid grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3',
                isRolling && 'fx-surprise-rolling',
                !isRolling && popKey > 0 && 'fx-surprise-pop',
              )}
            >
              {/*
                The plan, as tile one.

                A marketplace sells its all-access pass from inside the
                browse grid rather than from a pricing page, and it is
                right to: the person deep in the catalog is the person
                the offer is for. First page only — repeating it on page
                twelve would make it furniture. Not in AI mode either,
                where the result set is a direct answer to a question and
                an ad in slot one is an answer to a different one.
              */}
              {!aiMode && safePage === 1 ? <LibraryProTile /> : null}
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

/**
 * The line under the sort control that says what the order is made of.
 *
 * Deliberately quiet — border and muted text, not the primary-tinted panel
 * the AI banner uses. That one announces a mode the user switched the page
 * into; this one is a footnote on a control they can already see.
 */
function SortNote({
  loading,
  icon: Icon,
  children,
}: {
  loading: boolean
  icon: React.ComponentType<{ className?: string }>
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
