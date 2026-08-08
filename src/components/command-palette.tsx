'use client'

/**
 * Cmd+K / Ctrl+K command palette.
 *
 * The signature "modern web app" feature: press Cmd+K (or Ctrl+K) anywhere
 * and a fuzzy-search palette slides down from the top of the screen. It lets
 * the user:
 *
 *   - Jump to any artifact — effect, block, page or template — by name, id,
 *     category or tag. Each level gets its own section, because effects
 *     outnumber everything else ~50:1 and a merged list buries the rest.
 *   - Trigger quick actions (Surprise me, Open bundle, Toggle theme, Go to
 *     Playground, etc.).
 *   - Filter by category.
 *
 * Keyboard:
 *   ↑/↓     move selection
 *   Enter   activate selected item
 *   Esc     close
 *   Cmd+K   toggle (when closed, opens; when open, closes — standard behavior)
 *
 * Implementation notes:
 *   - Search is a tiny in-memory fuzzy matcher (subsequence + word-boundary
 *     bonus). The catalog is small enough to scan on every keystroke
 *     without a debounce. `/browse` deliberately ranks differently — see
 *     the note in `@/lib/browse`.
 *   - The palette is mounted once per page (in the same spots the ShortcutsHelp
 *     button is mounted) so the global key listener is always live.
 *   - We deliberately DON'T use a portal library like cmdk because we already
 *     have Radix Dialog and want zero new dependencies.
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Search,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Package,
  Scale,
  Shuffle,
  Moon,
  Sun,
  Keyboard,
  Sparkles,
  Heart,
  Star,
  ArrowRight,
  Loader2,
  Blocks,
  FileText,
  LayoutTemplate,
  Layers,
  type LucideIcon,
} from 'lucide-react'
import { CATEGORIES, type EffectCategory } from '@/lib/effect-types'
import type { BrowseHit } from '@/lib/browse'
import { LEVEL_LABEL, type ArtifactLevel } from '@/lib/artifact-types'
import { cn } from '@/lib/utils'

/* ============================================================
 *  Lightweight fuzzy matcher
 * ==========================================================
 *  A simple subsequence matcher with bonuses for:
 *   - consecutive matches (avoids scattered-letter matches dominating)
 *   - word-boundary matches (first letter of a word, or after a space / dash)
 *   - prefix matches (query appears at start of string)
 *  Returns a score where higher is better, or null if no match.
 *  This is plenty fast for 1,680 items at 60fps typing.
 * ========================================================== */

interface FuzzyResult {
  score: number
  /** Indices in `text` that matched (for highlight rendering). */
  matchedIndices: number[]
}

function fuzzyMatch(query: string, text: string): FuzzyResult | null {
  if (!query) return { score: 1, matchedIndices: [] }
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  if (!t.includes(q[0]!)) return null

  let score = 0
  let qi = 0
  let lastMatch = -2
  const matchedIndices: number[] = []
  let prevCharWasBoundary = true

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      // Bonus for matching at a word boundary.
      const isBoundary = prevCharWasBoundary
      // Bonus for consecutive matches.
      const isConsecutive = ti === lastMatch + 1
      if (isBoundary) score += 8
      if (isConsecutive) score += 4
      // Strong bonus for prefix matches.
      if (ti === 0 && qi === 0) score += 12
      matchedIndices.push(ti)
      lastMatch = ti
      qi++
    }
    prevCharWasBoundary = /[\s\-_/.]/.test(t[ti]!)
  }

  if (qi < q.length) return null

  // Length penalty — shorter strings that match rank higher.
  score += Math.max(0, 30 - t.length) * 0.1
  return { score, matchedIndices }
}

/* ============================================================
 *  Item types
 * ========================================================== */

/**
 * Sections, in render order.
 *
 * The four artifact levels are separate kinds rather than one "results"
 * bucket so that blocks, pages and templates get their own headings. They
 * are outnumbered ~50:1 by effects, and a single merged list is how they
 * were invisible here in the first place.
 */
type ItemKind = 'action' | 'category' | 'template' | 'page' | 'block' | 'effect'

/** Row icon per level. */
const LEVEL_ICON: Record<ArtifactLevel, LucideIcon> = {
  effect: Sparkles,
  block: Blocks,
  page: FileText,
  template: LayoutTemplate,
}

/** The artifact sections, in render order. Assembly first, atoms last. */
const ARTIFACT_SECTIONS: Array<{ kind: ItemKind; label: string }> = (
  ['template', 'page', 'block', 'effect'] as const
).map((level) => ({ kind: level, label: LEVEL_LABEL[level].many }))

interface BaseItem {
  id: string
  kind: ItemKind
  /** Display label. */
  label: string
  /** Secondary text shown beneath the label. */
  hint?: string
  /** Icon to render on the left. */
  icon: LucideIcon
  /** Optional keywords that also match (e.g. category name for an effect). */
  keywords?: string
  /** Action to run when this item is selected. */
  run: () => void
}

interface ScoredItem {
  item: BaseItem
  score: number
  matchedIndices: number[]
}

/* ============================================================
 *  Public hook — lets any component open the palette.
 * ========================================================== */

const OPEN_EVENT = 'hoverlab:open-command-palette'

export function useCommandPalette() {
  return React.useMemo(
    () => ({
      open: () => {
        if (typeof window === 'undefined') return
        window.dispatchEvent(new CustomEvent(OPEN_EVENT))
      },
    }),
    [],
  )
}

/* ============================================================
 *  The palette component itself.
 *  Mounted once per page (alongside <ShortcutsHelpButton />).
 * ========================================================== */

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)

  /**
   * The searchable catalog, loaded on first open rather than on mount.
   *
   * This component is mounted on every effect page and every category hub
   * — 4,340 static pages — and it used to import EFFECT_INDEX at module
   * scope. That put 772 KB of metadata into the bundle of every one of
   * them, to power a dialog that is closed until someone presses ⌘K.
   *
   * A dynamic import moves it into its own chunk that loads on demand.
   * Actions and category jumps stay available immediately; only artifact
   * results wait, and only the first time.
   *
   * `@/lib/browse` rather than `@/lib/effect-index`: it is the same effect
   * metadata plus the 86 records from the three tiers above, already
   * flattened to one shape. The palette searched effects only, which meant
   * two thirds of the *hand-authored* catalog could not be found from the
   * keyboard at all.
   */
  const [catalog, setCatalog] = React.useState<BrowseHit[]>([])
  const [loadingIndex, setLoadingIndex] = React.useState(false)
  const requestedRef = React.useRef(false)

  React.useEffect(() => {
    if (!open || requestedRef.current) return
    requestedRef.current = true
    setLoadingIndex(true)
    import('@/lib/browse')
      .then((m) => setCatalog(m.BROWSE_INDEX))
      .catch(() => {
        // Leave the palette usable with actions + categories rather than
        // failing the whole dialog over a chunk that didn't load.
        requestedRef.current = false
      })
      .finally(() => setLoadingIndex(false))
  }, [open])
  const [query, setQuery] = React.useState('')
  const [activeIndex, setActiveIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Listen for OPEN_EVENT and the Cmd+K / Ctrl+K hotkey.
  React.useEffect(() => {
    function onOpenEvent() {
      setOpen(true)
    }
    function onKeyDown(e: KeyboardEvent) {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      if (isCmdK) {
        e.preventDefault()
        setOpen((v) => !v)
        return
      }
    }
    window.addEventListener(OPEN_EVENT, onOpenEvent)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpenEvent)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  // Reset query and selection whenever the palette opens.
  React.useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      // Focus the input on the next tick so the dialog has time to mount.
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  /* ----- Build the action items (constant, but rebuilt per render is fine) ----- */
  const actions: BaseItem[] = React.useMemo(
    () => [
      {
        id: 'action:playground',
        kind: 'action',
        label: 'Open Playground',
        hint: 'Edit HTML + CSS live in a scratchpad',
        icon: Sparkles,
        keywords: 'playground editor scratch',
        run: () => router.push('/playground'),
      },
      {
        id: 'action:browse',
        kind: 'action',
        label: 'Browse everything',
        hint: 'Effects, blocks, pages and templates in one place',
        icon: Layers,
        keywords: 'browse all everything catalog components',
        run: () => router.push('/browse'),
      },
      {
        id: 'action:library',
        kind: 'action',
        label: 'Browse all effects',
        hint: 'Open the library',
        icon: Search,
        keywords: 'library browse home',
        run: () => router.push('/library'),
      },
      {
        id: 'action:favorites',
        kind: 'action',
        label: 'Show favorites',
        hint: 'Filter the library to your saved effects',
        icon: Heart,
        keywords: 'favorites saved heart',
        run: () => router.push('/library?filter=Favorites'),
      },
      {
        id: 'action:featured',
        kind: 'action',
        label: 'Show featured effects',
        hint: 'Curated highlights',
        icon: Star,
        keywords: 'featured curated highlight',
        run: () => router.push('/library?filter=Featured'),
      },
      {
        id: 'action:bundle',
        kind: 'action',
        label: 'Open bundle',
        hint: 'View and export your saved bundle',
        icon: Package,
        keywords: 'bundle export drawer',
        run: () => {
          if (typeof window !== 'undefined') {
            // Reuse the existing bundle drawer's open event if available,
            // otherwise navigate to library which has the drawer button.
            window.dispatchEvent(new CustomEvent('hoverlab:open-bundle'))
          }
        },
      },
      {
        id: 'action:compare',
        kind: 'action',
        label: 'Open compare',
        hint: 'Side-by-side preview of effects you marked',
        icon: Scale,
        keywords: 'compare side by side vs versus drawer',
        run: () => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('hoverlab:open-compare'))
          }
        },
      },
      {
        id: 'action:surprise',
        kind: 'action',
        label: 'Surprise me',
        hint: 'Jump to a random page of effects',
        icon: Shuffle,
        keywords: 'random surprise lucky',
        run: () => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('hoverlab:surprise-me'))
          }
        },
      },
      {
        id: 'action:shortcuts',
        kind: 'action',
        label: 'Keyboard shortcuts',
        hint: 'Show the help dialog',
        icon: Keyboard,
        keywords: 'help shortcuts keyboard',
        run: () => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('hoverlab:open-shortcuts-help'))
          }
        },
      },
      {
        id: 'action:theme',
        kind: 'action',
        label: 'Toggle theme',
        hint: 'Switch between light and dark',
        icon: Sun,
        keywords: 'theme dark light mode toggle',
        run: () => {
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark')
            // Persist via the same key next-themes uses.
            try {
              const isDark = document.documentElement.classList.contains('dark')
              window.localStorage.setItem('theme', isDark ? 'dark' : 'light')
            } catch {
              /* ignore */
            }
          }
        },
      },
    ],
    [router],
  )

  /* ----- Build the category items ----- */
  const categoryItems: BaseItem[] = React.useMemo(
    () =>
      CATEGORIES.map((c) => ({
        id: `cat:${c}`,
        kind: 'category',
        label: c,
        hint: `Filter the library to ${c}`,
        icon: ArrowRight,
        keywords: 'category filter',
        run: () => router.push(`/library?filter=${encodeURIComponent(c)}`),
      })),
    [router],
  )

  /* ----- Build the artifact items (cached once — list never changes) ----- */
  const artifactItems: BaseItem[] = React.useMemo(
    () =>
      catalog.map((a) => ({
        id: `${a.level}:${a.id}`,
        kind: a.level,
        label: a.name,
        hint: `${a.category} · ${a.description}`,
        icon: LEVEL_ICON[a.level],
        // The level's own name is a keyword, so "footer block" finds the
        // footer blocks rather than every effect mentioning a footer.
        keywords: `${a.category} ${a.id} ${a.tags.join(' ')} ${LEVEL_LABEL[a.level].one}`,
        run: () => router.push(a.href),
      })),
    [router, catalog],
  )

  /* ----- Search ----- */
  const allItems = React.useMemo(
    () => [...actions, ...categoryItems, ...artifactItems],
    [actions, categoryItems, artifactItems],
  )

  const results = React.useMemo<ScoredItem[]>(() => {
    const q = query.trim()
    if (!q) {
      // Empty query → actions, categories, then a few featured artifacts
      // taken per level rather than off the top of one list, so the opening
      // state shows that the catalog has four tiers in it.
      const featuredPerLevel = (['template', 'page', 'block', 'effect'] as const).flatMap(
        (level) =>
          artifactItems
            .map((item, i) => ({ item, meta: catalog[i] }))
            .filter((x) => x.meta?.level === level && x.meta.featured)
            .slice(0, level === 'effect' ? 3 : 2)
            .map(({ item }) => ({ item, score: 1, matchedIndices: [] as number[] })),
      )
      return [
        ...actions.map((item) => ({ item, score: 2, matchedIndices: [] as number[] })),
        ...categoryItems.map((item) => ({ item, score: 1.5, matchedIndices: [] as number[] })),
        ...featuredPerLevel,
      ]
    }

    const scored: ScoredItem[] = []
    for (const item of allItems) {
      const haystacks = [item.label, item.hint ?? '', item.keywords ?? '']
      let best: FuzzyResult | null = null
      for (const h of haystacks) {
        const r = fuzzyMatch(q, h)
        if (r && (!best || r.score > best.score)) best = r
      }
      if (best) {
        scored.push({ item, score: best.score, matchedIndices: best.matchedIndices })
      }
    }
    scored.sort((a, b) => b.score - a.score)

    /**
     * Cap effects, not the result set as a whole.
     *
     * A flat `slice(0, 50)` is how the upper tiers stayed invisible: there
     * are 4,300 effects and 86 everything-else, so a query like "pricing"
     * fills every slot with effects whose description mentions the word and
     * drops the pricing block that is the actual answer. Blocks, pages and
     * templates are few enough that every match can be kept.
     */
    const upper = scored.filter((s) => s.item.kind !== 'effect')
    const effectHits = scored.filter((s) => s.item.kind === 'effect').slice(0, 40)
    return [...upper, ...effectHits]
  }, [query, allItems, actions, categoryItems, artifactItems, catalog])

  // Clamp activeIndex when results change.
  React.useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, results.length - 1)))
  }, [results.length])

  // Scroll the active row into view when it changes.
  React.useEffect(() => {
    if (!open) return
    const container = listRef.current
    if (!container) return
    const active = container.querySelector<HTMLElement>(`[data-cp-index="${activeIndex}"]`)
    if (active) {
      active.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex, open])

  function activate(index: number) {
    const r = flatResults[index]
    if (!r) return
    setOpen(false)
    // Defer the action so the dialog has time to close (cleaner visual).
    setTimeout(() => r.item.run(), 0)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % Math.max(1, flatResults.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + flatResults.length) % Math.max(1, flatResults.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      activate(activeIndex)
    }
  }

  /* ----- Group results for display -----
   * Also build a FLAT list that mirrors the visual order (actions, then
   * categories, then effects). The flat list is what `activate(index)` uses
   * to look up the item — using `results[index]` directly would be wrong
   * because `results` is score-sorted while the display is grouped.
   */
  const { groups, flatResults } = React.useMemo(() => {
    const g: Record<ItemKind, ScoredItem[]> = {
      action: [],
      category: [],
      template: [],
      page: [],
      block: [],
      effect: [],
    }
    for (const r of results) {
      g[r.item.kind].push(r)
    }
    // Assembly first, atoms last — the same ordering argument as /browse:
    // the hand-authored tiers are more often what a section-shaped word
    // means, and they are the ones that lose a flat ranking.
    const flat = [...g.action, ...g.category, ...g.template, ...g.page, ...g.block, ...g.effect]
    return { groups: g, flatResults: flat }
  }, [results])

  let runningIndex = 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="top-[15%] max-w-2xl translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-2xl"
        onKeyDown={onKeyDown}
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search the whole catalog and actions. Use arrow keys to navigate, Enter to
          select, Esc to close.
        </DialogDescription>

        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border/60 px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            placeholder="Search effects, blocks, pages, templates…"
            className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoComplete="off"
            spellCheck={false}
            aria-label="Command palette search"
          />
          {/* The catalog arrives a beat after the dialog on first open —
              say so, rather than letting a real query look like it found
              nothing. */}
          {loadingIndex ? (
            <Loader2
              className="h-4 w-4 shrink-0 animate-spin text-muted-foreground"
              aria-label="Loading catalog"
            />
          ) : null}
          <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="fx-no-scrollbar max-h-[55vh] overflow-y-auto py-2"
        >
          {results.length === 0 ? (
            <div className="px-4 py-12 text-center">
              {loadingIndex ? (
                <>
                  <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-muted-foreground/40" />
                  <p className="text-sm font-medium">Loading effects…</p>
                </>
              ) : (
                <>
                  <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium">No matches found</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try a different keyword, or browse by category.
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              {groups.action.length > 0 ? (
                <Group label="Actions">
                  {groups.action.map((r) => {
                    const idx = runningIndex++
                    return (
                      <PaletteRow
                        key={r.item.id}
                        item={r.item}
                        index={idx}
                        activeIndex={activeIndex}
                        onActivate={activate}
                        onHover={setActiveIndex}
                      />
                    )
                  })}
                </Group>
              ) : null}

              {groups.category.length > 0 ? (
                <Group label="Categories">
                  {groups.category.map((r) => {
                    const idx = runningIndex++
                    return (
                      <PaletteRow
                        key={r.item.id}
                        item={r.item}
                        index={idx}
                        activeIndex={activeIndex}
                        onActivate={activate}
                        onHover={setActiveIndex}
                      />
                    )
                  })}
                </Group>
              ) : null}

              {ARTIFACT_SECTIONS.map(({ kind, label }) =>
                groups[kind].length > 0 ? (
                  <Group
                    key={kind}
                    label={
                      kind === 'effect' && groups.effect.length === 40
                        ? `${label} · top 40`
                        : label
                    }
                  >
                    {groups[kind].map((r) => {
                      const idx = runningIndex++
                      return (
                        <PaletteRow
                          key={r.item.id}
                          item={r.item}
                          index={idx}
                          activeIndex={activeIndex}
                          onActivate={activate}
                          onHover={setActiveIndex}
                          matchedIndices={
                            query.trim()
                              ? fuzzyMatch(query.trim(), r.item.label)?.matchedIndices ?? []
                              : []
                          }
                        />
                      )
                    })}
                  </Group>
                ) : null,
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-muted/30 px-4 py-2.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">
                <ArrowUp className="inline h-2.5 w-2.5" />
                <ArrowDown className="inline h-2.5 w-2.5" />
              </kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">
                <CornerDownLeft className="inline h-2.5 w-2.5" />
              </kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">
                Esc
              </kbd>
              close
            </span>
          </div>
          <span className="font-mono">
            {results.length} result{results.length === 1 ? '' : 's'}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ============================================================
 *  Sub-components
 * ========================================================== */

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-2">
      <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  )
}

interface PaletteRowProps {
  item: BaseItem
  index: number
  activeIndex: number
  onActivate: (i: number) => void
  onHover: (i: number) => void
  matchedIndices?: number[]
}

function PaletteRow({
  item,
  index,
  activeIndex,
  onActivate,
  onHover,
  matchedIndices,
}: PaletteRowProps) {
  const active = index === activeIndex
  const Icon = item.icon
  return (
    <button
      type="button"
      data-cp-index={index}
      onMouseMove={() => onHover(index)}
      onClick={() => onActivate(index)}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
        active ? 'bg-primary/10 text-foreground' : 'text-foreground/90 hover:bg-muted/40',
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
          active
            ? 'border-primary/40 bg-primary/10 text-primary'
            : 'border-border/60 bg-background text-muted-foreground',
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">
          {matchedIndices && matchedIndices.length > 0
            ? renderHighlighted(item.label, matchedIndices)
            : item.label}
        </span>
        {item.hint ? (
          <span className="block truncate text-[11px] text-muted-foreground">
            {item.hint}
          </span>
        ) : null}
      </span>
      {active ? (
        <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      ) : null}
    </button>
  )
}

function renderHighlighted(text: string, indices: number[]) {
  const set = new Set(indices)
  return text.split('').map((ch, i) =>
    set.has(i) ? (
      <mark key={i} className="rounded-sm bg-primary/20 px-0.5 text-primary">
        {ch}
      </mark>
    ) : (
      <span key={i}>{ch}</span>
    ),
  )
}
