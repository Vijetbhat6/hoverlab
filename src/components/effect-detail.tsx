'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Code2,
  Heart,
  Package,
  Check,
  Link2,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Scale,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { CodeBlock } from '@/components/code-block'
import { FrameworkExportPanel } from '@/components/framework-export-panel'
import { OpenInSandbox } from '@/components/open-in-sandbox'
import { EffectInsightsPanel } from '@/components/effect-insights-panel'
import { BundleDrawer } from '@/components/bundle-drawer'
import { CompareDrawer } from '@/components/compare-drawer'
import { CopyHistoryDropdown } from '@/components/copy-history-dropdown'
import { CommandPalette } from '@/components/command-palette'
import { ThemeToggle } from '@/components/theme-toggle'
import { ReducedMotionToggle } from '@/components/reduced-motion-toggle'
import { UserMenu } from '@/components/user-menu'
import { useFavorites } from '@/hooks/use-favorites'
import { useBundle } from '@/hooks/use-bundle'
import { useCompare } from '@/hooks/use-compare'
import { useRecentlyViewed } from '@/hooks/use-recently-viewed'
import { track } from '@/lib/analytics'
import {
  customizeCss,
  DEFAULT_CUSTOMIZATION,
  hashToOpts,
  matchingPreset,
  optsToHash,
  parseHash,
  PRESETS,
  type CustomizationOptions,
  type Preset,
} from '@/lib/customize'
import { cn } from '@/lib/utils'
import type { Effect } from '@/lib/effects'

interface EffectDetailProps {
  effect: Effect
  /** Up to 6 similar effects (same category, excluding `effect`). */
  similar: Effect[]
  /** Previous effect in the catalog (for prev/next nav). Null if at start. */
  prev?: Effect | null
  /** Next effect in the catalog (for prev/next nav). Null if at end. */
  next?: Effect | null
}

/**
 * Full-page detail view for a single effect.
 *
 * - Large live preview (always visible, customizable in real time)
 * - Customize tab with hue / size / speed sliders
 * - Code tab with HTML + CSS (and "Copy both")
 * - Similar-effects rail (same category)
 * - Prev / next navigation across the catalog
 * - Favorite heart toggle (synced with the grid via localStorage events)
 */
export function EffectDetail({ effect, similar, prev, next }: EffectDetailProps) {
  const surfaceDark = effect.darkSurface
  const previewRef = React.useRef<HTMLDivElement>(null)
  const { has, toggle } = useFavorites()
  const isFav = has(effect.id)
  const { has: hasBundle, toggle: toggleBundle } = useBundle()
  const inBundle = hasBundle(effect.id)
  const { has: hasCompare, toggle: toggleCompare, isFull: compareFull } = useCompare()
  const inCompare = hasCompare(effect.id)
  const [bundleOpen, setBundleOpen] = React.useState(false)
  const [compareOpen, setCompareOpen] = React.useState(false)

  // Track this view in the recently-viewed history. Fires on mount and on
  // every prev/next navigation (effect.id change). Skipped during SSR.
  const { record: recordView } = useRecentlyViewed()
  React.useEffect(() => {
    recordView({
      id: effect.id,
      name: effect.name,
      category: effect.category,
    })
    // Views pair with effect_copied to give a per-effect view→copy rate,
    // which is the ranking signal for what to curate and what to cut.
    track('effect_viewed', {
      effect_id: effect.id,
      category: effect.category,
      featured: effect.featured === true,
    })
  }, [effect.id, effect.name, effect.category, effect.featured, recordView])

  /* Active tab state ---------------------------------------------------
   * We control the Tabs (value + onValueChange) instead of using
   * defaultValue so we can auto-open the Customize tab when the user
   * arrives via a share link that contains customization in the URL
   * hash (e.g. /effect/btn-gradient#hue=15&sat=25). On subsequent
   * prev/next navigations the user's current tab is preserved — only
   * the initial mount checks the hash.
   *
   * We intentionally start with 'code' on both server and client
   * (avoids a hydration mismatch — the server can't see the URL hash)
   * and flip to 'customize' in a useEffect if the hash has any
   * customization params.
   */
  const [activeTab, setActiveTab] = React.useState<'code' | 'customize' | 'insights'>('code')
  React.useEffect(() => {
    const parts = parseHash(window.location.hash)
    const hasCustomization =
      parts.hue !== undefined ||
      parts.saturation !== undefined ||
      parts.scale !== undefined ||
      parts.speed !== undefined
    if (hasCustomization) setActiveTab('customize')
    // Only run on mount — prev/next nav preserves the user's tab.
  }, [])

  /* Customization state -----------------------------------------------
   * Initialize from the URL hash on first mount, so a shared link
   * (e.g. /effect/btn-gradient#hue=15&sat=25) restores the exact
   * customized view. When the user navigates to a different effect
   * via prev/next, we re-read the hash for that URL too.
   */
  const [opts, setOpts] = React.useState<CustomizationOptions>(() =>
    typeof window === 'undefined'
      ? DEFAULT_CUSTOMIZATION
      : hashToOpts(parseHash(window.location.hash)),
  )
  // Flag used to suppress the very first hash-write effect (so we don't
  // re-write the hash that the user just landed on, which would trigger
  // an unnecessary history entry).
  const skipHashWriteRef = React.useRef(true)

  React.useEffect(() => {
    // When effect.id changes (prev/next navigation via internal Link),
    // re-read the hash because Next.js client-side navigation does NOT
    // re-mount this component — it just updates props.
    const next = hashToOpts(parseHash(window.location.hash))
    setOpts(next)
    skipHashWriteRef.current = true
  }, [effect.id])

  // Write opts to the URL hash whenever they change (except on the very
  // first run after a navigation, to avoid a redundant history entry).
  React.useEffect(() => {
    if (skipHashWriteRef.current) {
      skipHashWriteRef.current = false
      return
    }
    const hash = optsToHash(opts)
    const target = hash ? `#${hash}` : ''
    if (window.location.hash !== target) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search + target)
    }
  }, [opts])

  // Listen for hashchange events (back/forward, manual URL edits) and
  // sync opts from the URL. This makes the share-link round-trip work.
  React.useEffect(() => {
    const onHashChange = () => {
      const next = hashToOpts(parseHash(window.location.hash))
      skipHashWriteRef.current = true
      setOpts(next)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const customizedCss = React.useMemo(
    () => customizeCss(effect.css, opts),
    [effect.css, opts],
  )
  const isCustomized = customizedCss !== effect.css
  const activePreset = matchingPreset(opts)

  /* Record customization once the user settles on a value.
   *
   * `effect_customized` was declared in the event map but never fired, so
   * the question it exists to answer — is the customizer worth building on,
   * or do people just copy the defaults? — had no data behind it. The
   * 600ms debounce matters: these are sliders, and firing per frame would
   * bury the signal under hundreds of intermediate events. Resetting back
   * to the defaults is deliberately not recorded; only real customizations
   * count. */
  React.useEffect(() => {
    if (!isCustomized) return
    const timer = setTimeout(() => {
      track('effect_customized', {
        effect_id: effect.id,
        hue: opts.hue,
        saturation: opts.saturation,
        scale: opts.scale,
        speed: opts.speed,
      })
    }, 600)
    return () => clearTimeout(timer)
  }, [effect.id, isCustomized, opts.hue, opts.saturation, opts.scale, opts.speed])

  // Detail-page keyboard shortcuts:
  //   j / →  → next effect
  //   k / ←  → previous effect
  //   f      → toggle favorite
  //   s      → toggle bundle (saves current customization)
  //   c      → copy current (customized) CSS
  //   b      → open the bundle drawer
  //   Esc    → close any open dialog (handled by Radix)
  // We rely on Next.js <Link> for prev/next so client-side navigation
  // preserves state. Pressing j/k triggers a click on the corresponding
  // link element via ref.
  const prevLinkRef = React.useRef<HTMLAnchorElement>(null)
  const nextLinkRef = React.useRef<HTMLAnchorElement>(null)

  React.useEffect(() => {
    function isTypingTarget(t: EventTarget | null): boolean {
      if (!(t instanceof HTMLElement)) return false
      const tag = t.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable
    }
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return
      const key = e.key.toLowerCase()
      if (key === 'j' || e.key === 'ArrowRight') {
        e.preventDefault()
        nextLinkRef.current?.click()
      } else if (key === 'k' || e.key === 'ArrowLeft') {
        e.preventDefault()
        prevLinkRef.current?.click()
      } else if (key === 'f') {
        e.preventDefault()
        toggle(effect.id)
      } else if (key === 's') {
        e.preventDefault()
        toggleBundle(effect.id, opts)
      } else if (key === 'c') {
        e.preventDefault()
        navigator.clipboard
          .writeText(customizedCss)
          .then(() => toast.success('Copied CSS to clipboard'))
          .catch(() => toast.error('Copy failed — please copy manually'))
      } else if (key === 'b') {
        e.preventDefault()
        // Toggle the drawer so `b` works as both "open" and "close".
        setBundleOpen((v) => !v)
      } else if (key === 'v') {
        e.preventDefault()
        // Toggle compare drawer (v for "versus").
        setCompareOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [effect.id, opts, customizedCss, toggle, toggleBundle])

  // Spotlight support: track cursor and set --fx-x / --fx-y CSS vars.
  React.useEffect(() => {
    const root = previewRef.current
    if (!root) return
    const target = root.querySelector<HTMLElement>('[data-spotlight]')
    if (!target) return
    const handler = (e: MouseEvent) => {
      const rect = target.getBoundingClientRect()
      target.style.setProperty('--fx-x', `${e.clientX - rect.left}px`)
      target.style.setProperty('--fx-y', `${e.clientY - rect.top}px`)
    }
    target.addEventListener('mousemove', handler)
    return () => target.removeEventListener('mousemove', handler)
  }, [effect.id])

  const combinedSnippet = React.useMemo(
    () =>
      [
        '<!-- HTML -->',
        effect.html.trim(),
        '',
        '/* CSS */',
        customizedCss.trim(),
      ].join('\n'),
    [effect.html, customizedCss],
  )

  async function copyShareLink() {
    const hash = optsToHash(opts)
    const url = hash
      ? `${window.location.origin}${window.location.pathname}#${hash}`
      : window.location.href
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Shareable link copied', {
        description: hash
          ? 'Includes your customization — anyone opening it sees the same tweak.'
          : 'Link copied (no customization applied yet).',
        duration: 2400,
      })
    } catch {
      toast.error('Could not copy link — please copy from the address bar.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Breadcrumb / back */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/library">
            <ArrowLeft className="h-4 w-4" /> Back to library
          </Link>
        </Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono">{effect.id}</span>
          {isCustomized ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-2.5 w-2.5" /> Edited
            </span>
          ) : null}
          <CopyHistoryDropdown />
          <UserMenu />
          <ThemeToggle />
          <ReducedMotionToggle />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="space-y-6">
          <Card className="overflow-hidden border-border/60 bg-card/80 backdrop-blur">
            <CardHeader className="gap-2 pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                      {effect.name}
                    </h1>
                    {effect.featured ? (
                      <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/15">
                        Featured
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
                    {effect.description}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider">
                      {effect.category}
                    </Badge>
                    {(effect.tags ?? []).map((t) => (
                      <Badge key={t} variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleBundle(effect.id, opts)}
                  aria-pressed={inBundle}
                  aria-label={inBundle ? 'Remove from bundle' : 'Add to bundle'}
                  title={inBundle ? 'Remove from bundle' : 'Add to bundle'}
                  className={cn(
                    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all',
                    inBundle
                      ? 'border-primary/50 bg-primary/10 text-primary hover:bg-primary/20'
                      : 'border-border/60 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-primary',
                  )}
                >
                  {inBundle ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Package className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggle(effect.id)}
                  aria-pressed={isFav}
                  aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  className={cn(
                    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all',
                    isFav
                      ? 'border-rose-400/50 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                      : 'border-border/60 bg-background/60 text-muted-foreground hover:border-rose-400/40 hover:text-rose-500',
                  )}
                >
                  <Heart
                    className={cn(
                      'h-4 w-4 transition-all',
                      isFav && 'scale-110 fill-current',
                    )}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const result = toggleCompare(effect.id)
                    if (result === 'added') {
                      toast.success(`Added "${effect.name}" to compare`, {
                        description: 'Open the compare drawer (v) to see it side-by-side.',
                      })
                    } else if (result === 'full') {
                      toast.error('Compare is full', {
                        description: 'Remove an effect from compare to add another.',
                      })
                    } else {
                      toast.success(`Removed "${effect.name}" from compare`)
                    }
                  }}
                  aria-pressed={inCompare}
                  aria-label={inCompare ? 'Remove from compare' : 'Add to compare'}
                  title={inCompare ? 'Remove from compare' : 'Add to compare'}
                  className={cn(
                    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all',
                    inCompare
                      ? 'border-primary/50 bg-primary/10 text-primary hover:bg-primary/20'
                      : 'border-border/60 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-primary',
                    compareFull && !inCompare && 'opacity-40 cursor-not-allowed hover:border-border/60 hover:text-muted-foreground',
                  )}
                >
                  <Scale className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setBundleOpen(true)}
                  aria-label="Open bundle"
                  title="Open bundle (b)"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/60 text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCompareOpen(true)}
                  aria-label="Open compare"
                  title="Open compare (v)"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/60 text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
                >
                  <Scale className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              {/* Large live preview */}
              <div
                ref={previewRef}
                className={cn(
                  'relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-xl border border-border/50 p-8 sm:min-h-[400px]',
                  surfaceDark ? 'bg-slate-950' : effect.previewClass ?? 'bg-muted/30',
                  isCustomized && 'ring-1 ring-primary/20',
                )}
                dangerouslySetInnerHTML={{ __html: effect.html }}
              />
              {/* Inject this effect's CSS into the document */}
              <style dangerouslySetInnerHTML={{ __html: customizedCss }} />

              {/* Tabs: Code | Customize
                  Controlled so we can auto-open Customize when the user
                  arrives via a share link with #hash customization. */}
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as 'code' | 'customize' | 'insights')}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="code" className="gap-1.5">
                    <Code2 className="h-3.5 w-3.5" /> Code
                  </TabsTrigger>
                  <TabsTrigger value="customize" className="gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Customize
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> Insights
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="code" className="mt-3 space-y-3">
                  {/* Escape hatches to an editable environment. Fed the
                      customized CSS, so a pen opened after tweaking the
                      hue carries the tweak with it. */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 p-2.5">
                    <span className="pl-1 text-xs text-muted-foreground">Open a live copy in</span>
                    <OpenInSandbox
                      effectId={effect.id}
                      name={effect.name}
                      description={effect.description}
                      html={effect.html}
                      css={customizedCss}
                      darkSurface={surfaceDark}
                    />
                  </div>

                  {/* Framework picker rather than a fixed HTML+CSS pair.
                      The panel is fed `customizedCss`, so the code always
                      matches the preview above it — previously the Code tab
                      showed the original CSS while the preview showed the
                      customized version. */}
                  <FrameworkExportPanel
                    effect={{
                      id: effect.id,
                      name: effect.name,
                      description: effect.description,
                      category: effect.category,
                    }}
                    html={effect.html}
                    css={customizedCss}
                    isCustomized={isCustomized}
                  />
                </TabsContent>

                <TabsContent value="customize" className="mt-3 space-y-4">
                  <CustomizePanel
                    effect={effect}
                    opts={opts}
                    onChange={setOpts}
                    onReset={() => setOpts(DEFAULT_CUSTOMIZATION)}
                    onPreset={(p) => setOpts({ ...p.opts })}
                    activePreset={activePreset}
                    isCustomized={isCustomized}
                    customizedCss={customizedCss}
                    combinedSnippet={combinedSnippet}
                    onCopyShareLink={copyShareLink}
                  />
                </TabsContent>

                <TabsContent value="insights" className="mt-3">
                  <EffectInsightsPanel html={effect.html} css={customizedCss} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Prev / next navigation */}
          <nav className="grid grid-cols-2 gap-3">
            {prev ? (
              <Link
                ref={prevLinkRef}
                href={`/effect/${prev.id}`}
                className="group flex items-center gap-3 rounded-lg border border-border/60 bg-card/60 p-3 transition-all hover:border-primary/40 hover:bg-card"
              >
                <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                <div className="min-w-0">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Previous
                  </div>
                  <div className="truncate text-sm font-semibold">{prev.name}</div>
                </div>
              </Link>
            ) : (
              <div className="rounded-lg border border-dashed border-border/40 p-3 opacity-50">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Previous
                </div>
                <div className="text-sm text-muted-foreground">Start of catalog</div>
              </div>
            )}
            {next ? (
              <Link
                ref={nextLinkRef}
                href={`/effect/${next.id}`}
                className="group flex items-center justify-end gap-3 rounded-lg border border-border/60 bg-card/60 p-3 text-right transition-all hover:border-primary/40 hover:bg-card"
              >
                <div className="min-w-0">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Next
                  </div>
                  <div className="truncate text-sm font-semibold">{next.name}</div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              </Link>
            ) : (
              <div className="rounded-lg border border-dashed border-border/40 p-3 text-right opacity-50">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Next
                </div>
                <div className="text-sm text-muted-foreground">End of catalog</div>
              </div>
            )}
          </nav>
        </div>

        {/* Sidebar: similar effects */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-lg border border-border/60 bg-card/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight">Similar effects</h2>
              <Badge variant="outline" className="text-[10px]">
                {effect.category}
              </Badge>
            </div>
            {similar.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No other effects in this category yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {similar.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/effect/${s.id}`}
                      className="group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/60"
                    >
                      <SimilarPreview effect={s} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium group-hover:text-primary">
                          {s.name}
                        </div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {s.description}
                        </div>
                      </div>
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" size="sm" className="mt-3 w-full">
              <Link href={`/library?filter=${encodeURIComponent(effect.category)}`}>
                Browse all {effect.category.toLowerCase()}
              </Link>
            </Button>
          </div>
        </aside>
      </div>

      {/* Slide-out bundle drawer (opened via 'b' shortcut or the bundle button) */}
      <BundleDrawer open={bundleOpen} onOpenChange={setBundleOpen} />
      <CompareDrawer open={compareOpen} onOpenChange={setCompareOpen} />
    </div>
  )
}

/* ============================================================
 *  Mini preview for the similar-effects rail.
 *  Injects the effect's CSS scoped under a unique wrapper class
 *  so multiple similar effects can render side by side.
 * ========================================================== */

let previewSeq = 0

function SimilarPreview({ effect }: { effect: Effect }) {
  const [wrapId] = React.useState(() => `fx-preview-${++previewSeq}`)
  // Scope the CSS by prefixing every selector with our wrapper class.
  // Cheap & cheerful — works for the simple class-based selectors we generate.
  const scopedCss = React.useMemo(() => {
    // Replace each selector group `selector1, selector2 {` with
    // `.wrapId selector1, .wrapId selector2 {`
    return effect.css.replace(/(^|\})\s*([^{}]+)\{/g, (_m, brace, selectors) => {
      const scoped = selectors
        .split(',')
        .map((s: string) => `.${wrapId} ${s.trim()}`)
        .join(', ')
      return `${brace} ${scoped} {`
    })
  }, [effect.css, wrapId])

  return (
    <div
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/40',
        effect.darkSurface ? 'bg-slate-950' : 'bg-muted/40',
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
      <div
        className={wrapId}
        style={{ transform: 'scale(0.45)', transformOrigin: 'center' }}
        dangerouslySetInnerHTML={{ __html: effect.html }}
      />
    </div>
  )
}

/* ============================================================
 *  Customize panel — preset chips + 4 sliders + reset + share + copy
 * ========================================================== */

interface CustomizePanelProps {
  effect: Effect
  opts: CustomizationOptions
  onChange: (opts: CustomizationOptions) => void
  onReset: () => void
  onPreset: (preset: Preset) => void
  activePreset: Preset | null
  isCustomized: boolean
  customizedCss: string
  combinedSnippet: string
  onCopyShareLink: () => void
}

function CustomizePanel({
  effect,
  opts,
  onChange,
  onReset,
  onPreset,
  activePreset,
  isCustomized,
  customizedCss,
  combinedSnippet,
  onCopyShareLink,
}: CustomizePanelProps) {
  const [copiedLink, setCopiedLink] = React.useState(false)

  // Reset the "copied" indicator on the share button after a short delay.
  // We don't trigger this here — the parent's onCopyShareLink fires the
  // toast. We just flip the icon back after 1.6s when the button is hit.
  React.useEffect(() => {
    if (!copiedLink) return
    const t = window.setTimeout(() => setCopiedLink(false), 1600)
    return () => window.clearTimeout(t)
  }, [copiedLink])

  function handleShareClick() {
    onCopyShareLink()
    setCopiedLink(true)
  }

  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">
        Slide to transform the live preview. The customized CSS is reflected
        in real time — copy it, or share the link to lock in your tweak.
      </p>

      {/* Presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground">Presets</label>
          {activePreset ? (
            <span className="text-[11px] font-medium text-primary">{activePreset.name}</span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => {
            const isActive = activePreset?.id === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPreset(p)}
                title={p.description}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all',
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground',
                )}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full border border-black/10"
                  style={{ backgroundColor: p.swatch }}
                  aria-hidden="true"
                />
                {p.name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="h-px bg-border/40" />

      {/* Sliders */}
      <SliderRow
        label="Hue"
        value={opts.hue}
        min={-180}
        max={180}
        step={5}
        unit="°"
        onChange={(v) => onChange({ ...opts, hue: v })}
        description="Rotate every color around the wheel."
      />

      <SliderRow
        label="Saturation"
        value={opts.saturation}
        min={-100}
        max={100}
        step={5}
        unit="%"
        format={(v) => `${v > 0 ? '+' : ''}${v}%`}
        onChange={(v) => onChange({ ...opts, saturation: v })}
        description="Boost or mute color intensity. -100 = grayscale."
      />

      <SliderRow
        label="Size"
        value={opts.scale}
        min={0.5}
        max={1.5}
        step={0.05}
        unit="×"
        format={(v) => `${v.toFixed(2)}×`}
        onChange={(v) => onChange({ ...opts, scale: v })}
        description="Scale every px/rem dimension."
      />

      <SliderRow
        label="Speed"
        value={opts.speed}
        min={0.25}
        max={3}
        step={0.25}
        unit="×"
        format={(v) => `${v.toFixed(2)}×`}
        onChange={(v) => onChange({ ...opts, speed: v })}
        description="Multiply every animation duration."
      />

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          onClick={onReset}
          disabled={!isCustomized}
          className="h-8 gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
        <Button
          size="sm"
          variant={isCustomized ? 'default' : 'outline'}
          onClick={handleShareClick}
          className="h-8 gap-1.5"
        >
          {copiedLink ? (
            <>
              <Check className="h-3.5 w-3.5" /> Copied
            </>
          ) : (
            <>
              <Link2 className="h-3.5 w-3.5" /> Share link
            </>
          )}
        </Button>
        <CodeBlock
          code={customizedCss}
          filename="customized.css"
          language="css"
          effect={{ id: effect.id, name: effect.name, category: effect.category }}
                  isCustomized={isCustomized}
          pairedHtml={effect.html}
          extraCopy={{ label: 'Copy both', text: combinedSnippet, successMessage: 'Copied HTML + CSS' }}
        />
      </div>
    </div>
  )
}

/* ============================================================
 *  SliderRow — label + value badge + slider
 * ========================================================== */

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  format?: (v: number) => string
  description?: string
  onChange: (v: number) => void
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  format,
  description,
  onChange,
}: SliderRowProps) {
  const display = format ? format(value) : `${value}${unit}`
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground">{label}</label>
        <span className="rounded-md bg-background px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground tabular-nums">
          {display}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(arr) => arr[0] !== undefined && onChange(arr[0])}
        className="w-full"
      />
      {description ? (
        <p className="text-[11px] text-muted-foreground/80">{description}</p>
      ) : null}
    </div>
  )
}
