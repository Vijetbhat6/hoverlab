'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Sparkles,
  Code2,
  Wand2,
  RotateCcw,
  Copy,
  Check,
  Keyboard,
  Package,
  Scale,
} from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { CodeBlock } from '@/components/code-block'
import { BundleDrawer } from '@/components/bundle-drawer'
import { CompareDrawer } from '@/components/compare-drawer'
import { CopyHistoryDropdown } from '@/components/copy-history-dropdown'
import { ThemeToggle } from '@/components/theme-toggle'
import { ReducedMotionToggle } from '@/components/reduced-motion-toggle'
import { UserMenu } from '@/components/user-menu'
import { ShortcutsHelpButton, useShortcutsHelp } from '@/components/shortcuts-help'
import { CommandPalette } from '@/components/command-palette'
import { useBundle } from '@/hooks/use-bundle'
import { useCompare } from '@/hooks/use-compare'
import {
  customizeCss,
  DEFAULT_CUSTOMIZATION,
  matchingPreset,
  PRESETS,
  type CustomizationOptions,
  type Preset,
} from '@/lib/customize'
import { cn } from '@/lib/utils'

/* ============================================================
 *  Starter sample — what users see on first load.
 *  A simple gradient button so they can immediately see the
 *  hue / saturation / size / speed transforms do something.
 * ========================================================== */

const SAMPLE_HTML = `<button class="my-btn">Click me</button>`

const SAMPLE_CSS = `.my-btn {
  padding: 0.75rem 1.75rem;
  border: none;
  border-radius: 0.625rem;
  font-weight: 600;
  font-size: 0.95rem;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(120deg, #f43f5e, #f59e0b, #10b981);
  background-size: 200% 200%;
  background-position: 0% 50%;
  transition: background-position 0.6s ease, transform 0.2s ease;
  box-shadow: 0 6px 18px -6px rgba(244, 63, 94, 0.5);
  animation: shift 3s ease infinite;
}

.my-btn:hover {
  background-position: 100% 50%;
  transform: translateY(-2px);
}

@keyframes shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}`

const STORAGE_KEY = 'cssfx:playground'

interface PersistedState {
  html: string
  css: string
}

function loadState(): PersistedState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedState
  } catch {
    return null
  }
}

function saveState(state: PersistedState) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore quota errors */
  }
}

export default function PlaygroundPage() {
  const { open: openShortcuts } = useShortcutsHelp()
  const [bundleOpen, setBundleOpen] = React.useState(false)
  const { count: bundleCount } = useBundle()
  const [compareOpen, setCompareOpen] = React.useState(false)
  const { count: compareCount } = useCompare()

  // Initialize from localStorage (if the user has been here before),
  // else fall back to the sample.
  const [html, setHtml] = React.useState<string>(SAMPLE_HTML)
  const [css, setCss] = React.useState<string>(SAMPLE_CSS)
  React.useEffect(() => {
    const saved = loadState()
    if (saved) {
      if (typeof saved.html === 'string') setHtml(saved.html)
      if (typeof saved.css === 'string') setCss(saved.css)
    }
  }, [])

  // Persist HTML/CSS to localStorage whenever they change (debounced).
  React.useEffect(() => {
    const t = window.setTimeout(() => saveState({ html, css }), 500)
    return () => window.clearTimeout(t)
  }, [html, css])

  // Global keyboard shortcuts on the playground page:
  //   b  → toggle the bundle drawer (so users can access their bundle
  //        without leaving the playground)
  //   ?  → shortcuts help dialog (handled by ShortcutsHelpButton)
  // We ignore keypresses while typing in any input/textarea (so users
  // can type 'b' inside the HTML/CSS editors without triggering the
  // shortcut), and while a meta/ctrl/alt modifier is held.
  React.useEffect(() => {
    function isTypingTarget(t: EventTarget | null): boolean {
      if (!(t instanceof HTMLElement)) return false
      const tag = t.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable
    }
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return
      if (e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setBundleOpen((v) => !v)
      } else if (e.key.toLowerCase() === 'v') {
        e.preventDefault()
        // Toggle compare drawer (v for "versus").
        setCompareOpen((v) => !v)
      }
    }
    // Listen for events from the command palette's action items so the
    // "Open bundle" / "Open compare" actions work on this page too.
    function onOpenBundle() {
      setBundleOpen(true)
    }
    function onOpenCompare() {
      setCompareOpen(true)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('hoverlab:open-bundle', onOpenBundle)
    window.addEventListener('hoverlab:open-compare', onOpenCompare)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('hoverlab:open-bundle', onOpenBundle)
      window.removeEventListener('hoverlab:open-compare', onOpenCompare)
    }
  }, [])

  const [opts, setOpts] = React.useState<CustomizationOptions>(DEFAULT_CUSTOMIZATION)
  const customizedCss = React.useMemo(
    () => customizeCss(css, opts),
    [css, opts],
  )
  const isCustomized = customizedCss !== css
  const activePreset = matchingPreset(opts)

  const [copied, setCopied] = React.useState(false)
  async function handleCopyCss() {
    try {
      await navigator.clipboard.writeText(customizedCss)
      setCopied(true)
      toast.success('Copied customized CSS')
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Copy failed — please copy manually')
    }
  }

  function handleReset() {
    setOpts(DEFAULT_CUSTOMIZATION)
  }

  function handleClearAll() {
    setHtml('')
    setCss('')
    toast.success('Cleared HTML and CSS')
  }

  function handleLoadSample() {
    setHtml(SAMPLE_HTML)
    setCss(SAMPLE_CSS)
    toast.success('Loaded sample')
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Header (mirrors home page) */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-lg shadow-primary/30">
              <Wand2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight">Hoverlab Playground</span>
              <span className="text-[11px] text-muted-foreground">
                Apply hue / saturation / size / speed to any CSS
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={openShortcuts}
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
              onClick={() => setBundleOpen(true)}
              aria-label={`Open bundle (${bundleCount} item${bundleCount === 1 ? '' : 's'})`}
              title="Open bundle (b)"
            >
              <Package className="h-4 w-4" />
              {bundleCount > 0 ? (
                <Badge className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full px-1 text-[9px] font-semibold">
                  {bundleCount}
                </Badge>
              ) : null}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
              onClick={() => setCompareOpen(true)}
              aria-label={`Open compare (${compareCount} effect${compareCount === 1 ? '' : 's'})`}
              title="Open compare (v)"
            >
              <Scale className="h-4 w-4" />
              {compareCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground"
                >
                  {compareCount}
                </Badge>
              ) : null}
            </Button>
            <CopyHistoryDropdown />
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link href="/library">
                <ArrowLeft className="h-4 w-4" /> Back to library
              </Link>
            </Button>
            <UserMenu />
            <ThemeToggle />
            <ReducedMotionToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main column: editor + preview */}
          <div className="space-y-4">
            <Card className="overflow-hidden border-border/60 bg-card/80 backdrop-blur">
              <CardHeader className="gap-2 pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                      Custom CSS playground
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                      Paste your own HTML and CSS, then drag the sliders to
                      transform colors, sizes, and animation speed in real time.
                      Your input is saved to localStorage — refresh and it's
                      still here.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5"
                      onClick={handleLoadSample}
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Load sample
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1.5 text-muted-foreground hover:text-rose-500"
                      onClick={handleClearAll}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {/* Live preview (always visible) */}
                <div
                  className={cn(
                    'relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-muted/30 p-8',
                    isCustomized && 'ring-1 ring-primary/20',
                  )}
                >
                  <style dangerouslySetInnerHTML={{ __html: customizedCss }} />
                  {/* Use dangerouslySetInnerHTML so any HTML structure works */}
                  <div dangerouslySetInnerHTML={{ __html: html || '<!-- empty -->' }} />
                  {!html.trim() && !css.trim() ? (
                    <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
                      Paste HTML and CSS below to see a live preview.
                    </p>
                  ) : null}
                </div>

                {/* Editor tabs
                    forceMount keeps both textareas in the DOM (hidden via
                    the `hidden` attribute when inactive) so the user's
                    cursor position, undo/redo history, and IME composition
                    state survive a tab switch. Without forceMount, Radix
                    unmounts the inactive TabsContent — typing in HTML,
                    flipping to CSS, then back would land the cursor at
                    column 0 and wipe the textarea's undo stack. */}
                <Tabs defaultValue="html" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="html" className="gap-1.5">
                      <Code2 className="h-3.5 w-3.5" /> HTML
                    </TabsTrigger>
                    <TabsTrigger value="css" className="gap-1.5">
                      <Code2 className="h-3.5 w-3.5" /> CSS
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="html" forceMount className="mt-3 space-y-2 data-[state=inactive]:hidden">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="playground-html"
                        className="text-xs font-semibold text-foreground"
                      >
                        Your HTML
                      </label>
                      <span className="text-[11px] text-muted-foreground">
                        {html.length.toLocaleString('en-US')} chars
                      </span>
                    </div>
                    <Textarea
                      id="playground-html"
                      value={html}
                      onChange={(e) => setHtml(e.target.value)}
                      spellCheck={false}
                      placeholder={'<button class="my-btn">Click me</button>'}
                      className="min-h-[200px] resize-y bg-[#0b1020] font-mono text-[12.5px] text-slate-100"
                    />
                  </TabsContent>

                  <TabsContent value="css" forceMount className="mt-3 space-y-2 data-[state=inactive]:hidden">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="playground-css"
                        className="text-xs font-semibold text-foreground"
                      >
                        Your CSS
                      </label>
                      <span className="text-[11px] text-muted-foreground">
                        {css.length.toLocaleString('en-US')} chars
                      </span>
                    </div>
                    <Textarea
                      id="playground-css"
                      value={css}
                      onChange={(e) => setCss(e.target.value)}
                      spellCheck={false}
                      placeholder=".my-btn { color: #f43f5e; ... }"
                      className="min-h-[200px] resize-y bg-[#0b1020] font-mono text-[12.5px] text-slate-100"
                    />
                  </TabsContent>
                </Tabs>

                {/* Output */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Transformed CSS
                    </label>
                    <Button
                      size="sm"
                      variant={isCustomized ? 'default' : 'outline'}
                      className="h-7 gap-1.5"
                      onClick={handleCopyCss}
                      disabled={!css.trim()}
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <CodeBlock
                    code={customizedCss}
                    filename="transformed.css"
                    language="css"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: sliders + presets */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-lg border border-border/60 bg-card/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
                  <Wand2 className="h-4 w-4 text-primary" /> Transforms
                </h2>
                {activePreset ? (
                  <Badge variant="outline" className="text-[10px]">
                    {activePreset.name}
                  </Badge>
                ) : null}
              </div>

              {/* Presets */}
              <div className="mb-4 flex flex-wrap gap-1.5">
                {PRESETS.map((p) => {
                  const isActive = activePreset?.id === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setOpts({ ...p.opts })}
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

              <div className="h-px bg-border/40" />

              {/* Sliders */}
              <div className="mt-4 space-y-4">
                <SliderRow
                  label="Hue"
                  value={opts.hue}
                  min={-180}
                  max={180}
                  step={5}
                  unit="°"
                  onChange={(v) => setOpts({ ...opts, hue: v })}
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
                  onChange={(v) => setOpts({ ...opts, saturation: v })}
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
                  onChange={(v) => setOpts({ ...opts, scale: v })}
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
                  onChange={(v) => setOpts({ ...opts, speed: v })}
                  description="Multiply every animation duration."
                />
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                disabled={!isCustomized}
                className="mt-4 h-8 w-full gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset transforms
              </Button>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Tip:</span>{' '}
                everything runs in your browser — your code never leaves the
                page. Paste a whole component's HTML+CSS and tweak the look
                without touching the source.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <ShortcutsHelpButton />
      <BundleDrawer open={bundleOpen} onOpenChange={setBundleOpen} />
      <CompareDrawer open={compareOpen} onOpenChange={setCompareOpen} />

      {/* Cmd+K command palette */}
      <CommandPalette />
    </div>
  )
}

/* ============================================================
 *  SliderRow — shared with EffectCard / EffectDetail
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
