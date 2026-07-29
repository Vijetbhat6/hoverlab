'use client'

import * as React from 'react'
import Link from 'next/link'
import { Code2, Heart, Package, RotateCcw, Sparkles, ExternalLink, Check, Scale } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { CodeBlock } from '@/components/code-block'
import { useFavorites } from '@/hooks/use-favorites'
import { useBundle } from '@/hooks/use-bundle'
import { useCompare } from '@/hooks/use-compare'
import { customizeCss, DEFAULT_CUSTOMIZATION, matchingPreset, PRESETS, type CustomizationOptions, type Preset } from '@/lib/customize'
import { cn } from '@/lib/utils'
import type { Effect } from '@/lib/effects'

interface EffectCardProps {
  effect: Effect
}

/**
 * Build a single snippet that contains both the HTML markup and the CSS
 * rules, with clear section comments so the user can paste it into a
 * scratch file and immediately understand the structure.
 */
function buildCombinedSnippet(effect: Effect, cssOverride?: string): string {
  return [
    '<!-- HTML -->',
    effect.html.trim(),
    '',
    '/* CSS */',
    (cssOverride ?? effect.css).trim(),
  ].join('\n')
}

export function EffectCard({ effect }: EffectCardProps) {
  const surfaceDark = effect.darkSurface
  const previewRef = React.useRef<HTMLDivElement>(null)
  const { has, toggle } = useFavorites()
  const isFav = has(effect.id)
  const { has: hasBundle, toggle: toggleBundle } = useBundle()
  const inBundle = hasBundle(effect.id)
  const { has: hasCompare, toggle: toggleCompare, isFull: compareFull } = useCompare()
  const inCompare = hasCompare(effect.id)

  /* Customization state ----------------------------------------------- */
  const [opts, setOpts] = React.useState<CustomizationOptions>(DEFAULT_CUSTOMIZATION)
  // Reset opts when the effect changes (pagination / filter switches)
  React.useEffect(() => {
    setOpts(DEFAULT_CUSTOMIZATION)
  }, [effect.id])

  const customizedCss = React.useMemo(
    () => customizeCss(effect.css, opts),
    [effect.css, opts],
  )
  const isCustomized = customizedCss !== effect.css
  const activePreset = matchingPreset(opts)

  // For the spotlight card: track cursor and set CSS vars.
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
    () => buildCombinedSnippet(effect, customizedCss),
    [effect, customizedCss],
  )

  return (
    <Card
      className={cn(
        'group relative flex flex-col overflow-hidden border-border/60 bg-card/80 backdrop-blur transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5',
        isFav && 'border-rose-400/60 ring-1 ring-rose-400/30',
        isCustomized && 'border-primary/50 ring-1 ring-primary/20',
      )}
    >
      {/*
        Inject this effect's CSS into the document so the live preview
        actually renders with styles. When the user is on the Customize tab,
        we inject the customized CSS instead. The <style> tag is mounted /
        unmounted with the card, so only the 24 visible cards have their
        CSS in the DOM at any time.
      */}
      <style dangerouslySetInnerHTML={{ __html: customizedCss }} />
      <CardHeader className="gap-1.5 pb-3">
        {/* Top row: category badge (left) + 4 icon buttons (right).
            4 fixed-size 28px buttons = 112px + gaps. On the narrowest
            grid column (~280px at sm breakpoint) the badge still has
            ~150px before truncating. The badge truncates if the
            category name is unusually long. */}
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="secondary"
            className="max-w-full truncate font-mono text-[10px] uppercase tracking-wider"
          >
            {effect.category}
          </Badge>
          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              href={`/effect/${effect.id}`}
              aria-label="Open detail page"
              title="Open detail page"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-background/60 text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => {
                const result = toggleCompare(effect.id)
                if (result === 'added') {
                  toast.success(`Added "${effect.name}" to compare`)
                } else if (result === 'full') {
                  toast.error('Compare is full', {
                    description: 'Remove an effect from compare to add another.',
                  })
                }
              }}
              aria-pressed={inCompare}
              aria-label={inCompare ? 'Remove from compare' : 'Add to compare'}
              title={inCompare ? 'Remove from compare' : 'Add to compare'}
              className={cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-full border transition-all',
                inCompare
                  ? 'border-primary/50 bg-primary/10 text-primary hover:bg-primary/20'
                  : 'border-border/60 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-primary',
                compareFull && !inCompare && 'opacity-40 cursor-not-allowed hover:border-border/60 hover:text-muted-foreground',
              )}
            >
              <Scale className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => toggleBundle(effect.id, opts)}
              aria-pressed={inBundle}
              aria-label={inBundle ? 'Remove from bundle' : 'Add to bundle'}
              title={inBundle ? 'Remove from bundle' : 'Add to bundle'}
              className={cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-full border transition-all',
                inBundle
                  ? 'border-primary/50 bg-primary/10 text-primary hover:bg-primary/20'
                  : 'border-border/60 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-primary',
              )}
            >
              {inBundle ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Package className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => toggle(effect.id)}
              aria-pressed={isFav}
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
              title={isFav ? 'Remove from favorites' : 'Add to favorites'}
              className={cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-full border transition-all',
                isFav
                  ? 'border-rose-400/50 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                  : 'border-border/60 bg-background/60 text-muted-foreground hover:border-rose-400/40 hover:text-rose-500',
              )}
            >
              <Heart
                className={cn(
                  'h-3.5 w-3.5 transition-all',
                  isFav && 'scale-110 fill-current',
                )}
              />
            </button>
          </div>
        </div>
        {/* Title + description: take full width below the badge/buttons row.
            This avoids the previous layout where a long category name
            ("Dividers & Separators", "Skeletons & Shimmers") pushed the
            heart icon off the right edge of the card. */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold tracking-tight">
              <Link
                href={`/effect/${effect.id}`}
                className="rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                title="Open detail page"
              >
                {effect.name}
              </Link>
            </h3>
            {isCustomized ? (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-2.5 w-2.5" /> Edited
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {effect.description}
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        {/* Always-visible live preview */}
        <div
          ref={previewRef}
          className={cn(
            'flex min-h-[180px] items-center justify-center overflow-hidden rounded-lg border border-border/50 p-4',
            surfaceDark ? 'bg-slate-950' : effect.previewClass ?? 'bg-muted/30',
            isCustomized && 'ring-1 ring-primary/20',
          )}
          dangerouslySetInnerHTML={{ __html: effect.html }}
        />

        {/* Tabs: Code | Customize */}
        <Tabs defaultValue="code" className="mt-3 w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="code" className="gap-1.5">
              <Code2 className="h-3.5 w-3.5" /> Code
            </TabsTrigger>
            <TabsTrigger value="customize" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Customize
            </TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="mt-3 space-y-3">
            <CodeBlock
              code={effect.html}
              filename="markup.html"
              language="html"
              effect={{ id: effect.id, name: effect.name, category: effect.category }}
              extraCopy={{ label: 'Copy both', text: combinedSnippet, successMessage: 'Copied HTML + CSS' }}
            />
            <CodeBlock
              code={effect.css}
              filename="styles.css"
              language="css"
              effect={{ id: effect.id, name: effect.name, category: effect.category }}
              pairedHtml={effect.html}
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
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

/* ============================================================
 *  Customize panel — preset chips + 4 sliders + reset + copy buttons
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
}: CustomizePanelProps) {
  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">
        Slide to transform the live preview. The customized CSS is reflected
        in real time — copy it when you're happy.
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

      {/* Hue */}
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

      {/* Saturation */}
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

      {/* Scale */}
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

      {/* Speed */}
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
        <CodeBlock
          code={customizedCss}
          filename="customized.css"
          language="css"
          effect={{ id: effect.id, name: effect.name, category: effect.category }}
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
