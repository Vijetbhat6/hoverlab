'use client'

/**
 * Shadow Builder tool.
 *
 * Layer up to 8 box-shadows or text-shadows with independent x / y / blur /
 * spread / color / opacity / inset controls. One tool for both because the
 * mental model is identical — layered offsets of the same silhouette — and
 * text-shadow is just the subset without spread and inset, so those two
 * controls disappear in text mode rather than living on a separate page.
 * Preview against a card (or a headline) on a light, dark or matching
 * surface. Output is production CSS.
 *
 * The starting stacks (see `lib/shadow-presets.ts`) exist because the
 * shadows worth having are conventions rather than tuning, and two of them
 * cannot be reached by dragging at all: neumorphism is a pair of shadows
 * whose colours are derived from the surface behind the element, on a page
 * painted that same colour. That is why the surface has a third setting —
 * previewing the style on a stage of a different colour would be showing
 * something that cannot exist where the CSS is pasted.
 */

import * as React from 'react'
import {
  Blend,
  Layers,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Square,
  Type,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { readSharedState, ShareLinkButton } from '@/components/designer-tools/share-link'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { useToolState } from '@/hooks/use-tool-state'
import { normalizeHex, hexToRgb } from '@/lib/color-tools'
import {
  looksNeumorphic,
  neumorphicBase,
  neumorphicWarning,
  shadowPresetsFor,
  type ShadowPreset,
} from '@/lib/shadow-presets'
import { cn } from '@/lib/utils'

interface ShadowLayer {
  id: string
  enabled: boolean
  inset: boolean
  x: number
  y: number
  blur: number
  spread: number
  color: string
  opacity: number
}

const TOOL = '/tools/shadow'

let layerCounter = 0
function newLayerId() {
  return `l${++layerCounter}`
}

function defaultLayers(): ShadowLayer[] {
  return [
    {
      id: newLayerId(),
      enabled: true,
      inset: false,
      x: 0,
      y: 1,
      blur: 2,
      spread: 0,
      color: '#000000',
      opacity: 0.05,
    },
    {
      id: newLayerId(),
      enabled: true,
      inset: false,
      x: 0,
      y: 1,
      blur: 4,
      spread: -1,
      color: '#000000',
      opacity: 0.1,
    },
    {
      id: newLayerId(),
      enabled: true,
      inset: false,
      x: 0,
      y: 8,
      blur: 24,
      spread: -4,
      color: '#000000',
      opacity: 0.15,
    },
  ]
}

type ShadowMode = 'box' | 'text'

/**
 * `match` paints the stage in the card's own colour.
 *
 * Not a preview nicety — it is the precondition for neumorphism. That style
 * is two shadows derived from the surface behind the element, and previewing
 * it on a stage that is a different colour shows something that cannot exist
 * anywhere the CSS is actually pasted.
 */
type Surface = 'light' | 'dark' | 'match'

interface ShadowState {
  layers: ShadowLayer[]
  mode: ShadowMode
  surface: Surface
  cardColor: string
  textColor: string
}

/**
 * Called once, at module scope, so the ids in it are stable.
 *
 * `defaultLayers()` mints ids from a counter, and this object is spread on
 * every restore — calling it per render would hand React a new key for the
 * same row on every keystroke.
 */
const DEFAULT_STATE: ShadowState = {
  layers: defaultLayers(),
  mode: 'box',
  surface: 'light',
  cardColor: '#ffffff',
  // Separate from cardColor: the card default (white) would make the text
  // preview invisible on the light surface.
  textColor: '#18181b',
}

/**
 * The layers in a value, if it holds a usable stack.
 *
 * Same argument as `validStops` in the gradient tool: this check existed
 * twice inline — once for the localStorage restore, once for the shared
 * link — and a preset restored off the account is a third caller. One
 * shadow with no layers is not a shadow, so an unusable value falls back to
 * the default stack rather than rendering nothing.
 */
function validLayers(value: unknown): ShadowLayer[] | null {
  if (!Array.isArray(value) || value.length < 1) return null
  const layers = value.filter(
    (l): l is ShadowLayer =>
      !!l && typeof l === 'object' && typeof (l as ShadowLayer).id === 'string',
  )
  return layers.length >= 1 ? layers : null
}

function layerToCss(l: ShadowLayer, mode: ShadowMode): string {
  const rgb = hexToRgb(l.color)
  if (!rgb) return ''
  // text-shadow has no inset or spread — those two are box-only.
  const parts = [
    mode === 'box' && l.inset ? 'inset' : '',
    `${l.x}px`,
    `${l.y}px`,
    `${l.blur}px`,
    mode === 'box' && l.spread !== 0 ? `${l.spread}px` : '',
    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${l.opacity.toFixed(2)})`,
  ].filter(Boolean)
  return parts.join(' ')
}

export default function ShadowToolPage() {
  // Working state stays local and ungated; named presets need an account.
  // See `use-tool-state.ts` for why the two layers are separate.
  const tool = useToolState<ShadowState>(TOOL, DEFAULT_STATE)
  const { state, setState } = tool

  // Read through a guard: four routes write here — stored state, a shared
  // link, a preset off the account, and the controls below — and only the
  // last of them is typed.
  const layers = validLayers(state.layers) ?? DEFAULT_STATE.layers
  const mode: ShadowMode = state.mode === 'text' ? 'text' : 'box'
  const surface: Surface =
    state.surface === 'dark' || state.surface === 'match' ? state.surface : 'light'
  const cardColor =
    typeof state.cardColor === 'string' ? state.cardColor : DEFAULT_STATE.cardColor
  const textColor =
    typeof state.textColor === 'string' ? state.textColor : DEFAULT_STATE.textColor

  const setMode = (v: ShadowMode) => setState((s) => ({ ...s, mode: v }))
  const setSurface = (v: Surface) => setState((s) => ({ ...s, surface: v }))
  const setCardColor = (v: string) => setState((s) => ({ ...s, cardColor: v }))
  const setTextColor = (v: string) => setState((s) => ({ ...s, textColor: v }))
  const setLayers = (next: (arr: ShadowLayer[]) => ShadowLayer[]) =>
    setState((s) => ({ ...s, layers: next(validLayers(s.layers) ?? DEFAULT_STATE.layers) }))

  React.useEffect(() => {
    // A shared link's state wins over whatever this browser had stored.
    // Declared after `useToolState`, so the hook's restore has already run
    // by the time this does — which is what keeps that precedence true.
    const shared = readSharedState<Partial<ShadowState>>()
    if (!shared) return
    setState((s) => ({
      layers: validLayers(shared.layers) ?? s.layers,
      mode: shared.mode === 'box' || shared.mode === 'text' ? shared.mode : s.mode,
      surface:
        shared.surface === 'light' ||
        shared.surface === 'dark' ||
        shared.surface === 'match'
          ? shared.surface
          : s.surface,
      cardColor: typeof shared.cardColor === 'string' ? shared.cardColor : s.cardColor,
      textColor: typeof shared.textColor === 'string' ? shared.textColor : s.textColor,
    }))
    // `setState` is stable; the shared link is read once, on mount.
  }, [])

  const cssValue = React.useMemo(() => {
    return layers
      .filter((l) => l.enabled)
      .map((l) => layerToCss(l, mode))
      .filter(Boolean)
      .join(',\n    ')
  }, [layers, mode])

  const cssBlock = React.useMemo(() => {
    const selector = mode === 'box' ? '.card' : '.heading'
    const property = mode === 'box' ? 'box-shadow' : 'text-shadow'
    if (!cssValue) return `${selector} {\n  ${property}: none;\n}`
    return `${selector} {\n  ${property}:\n    ${cssValue};\n}`
  }, [cssValue, mode])

  const updateLayer = (id: string, patch: Partial<ShadowLayer>) => {
    setLayers((arr) => arr.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }
  const removeLayer = (id: string) => {
    setLayers((arr) => (arr.length <= 1 ? arr : arr.filter((l) => l.id !== id)))
  }
  const addLayer = () => {
    setLayers((arr) => [
      ...arr,
      {
        id: newLayerId(),
        enabled: true,
        inset: false,
        x: 0,
        y: 2,
        blur: 4,
        spread: 0,
        color: '#000000',
        opacity: 0.1,
      },
    ])
  }
  /*
    Applying a preset replaces the stack rather than adding to it.

    Two of these are computed from the element's own colour, and the pair only
    reads as one surface if both halves come from the same base — merging them
    into whatever was already there would give a shape lit from three
    directions. The neumorphic ones also move the two settings they cannot
    work without: a matching backdrop, and a base colour that has room to be
    both lightened and darkened. Loading a preset that visibly does nothing
    would teach the visitor the tool is broken rather than that white is a
    bad base.
  */
  const applyPreset = (preset: ShadowPreset) => {
    setState((s) => {
      const source = preset.mode === 'text' ? textColor : cardColor
      const base = preset.needsMatchingSurface ? neumorphicBase(source) : source
      return {
        ...s,
        mode: preset.mode,
        layers: preset
          .layers(base)
          .map((spec) => ({ id: newLayerId(), enabled: true, ...spec })),
        ...(preset.needsMatchingSurface
          ? { surface: 'match' as const, cardColor: base }
          : {}),
      }
    })
  }

  /*
    `match` is a box-mode idea only.

    A text preview on a stage painted the text's own colour is a blank
    rectangle. Rather than forbid the combination — someone can arrive at it
    by switching modes with a neumorphic stack loaded — the stage falls back
    to light and the button disappears, so the state is never a dead end.
  */
  const stageSurface: Surface = surface === 'match' && mode === 'text' ? 'light' : surface

  // Live rather than only on apply: the colour is a picker people keep
  // dragging, and dragging it to white is how the effect dies in silence.
  const neumorphicNote =
    mode === 'box' && looksNeumorphic(layers.filter((l) => l.enabled))
      ? neumorphicWarning(cardColor)
      : null

  const moveLayer = (id: string, dir: -1 | 1) => {
    setLayers((arr) => {
      const idx = arr.findIndex((l) => l.id === id)
      if (idx < 0) return arr
      const next = idx + dir
      if (next < 0 || next >= arr.length) return arr
      const copy = [...arr]
      ;[copy[idx], copy[next]] = [copy[next], copy[idx]]
      return copy
    })
  }

  return (
    <ToolLayout
      name="Shadow Builder"
      tagline="Layer up to 8 box-shadows or text-shadows"
      icon={<Layers className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        {/* Preview */}
        <div className="space-y-4">
          <div
            className={cn(
              'flex h-96 items-center justify-center rounded-xl border border-border p-8 transition-colors',
              stageSurface === 'dark' && 'bg-zinc-900',
              stageSurface === 'light' && 'bg-zinc-100',
            )}
            style={
              stageSurface === 'match' ? { backgroundColor: cardColor } : undefined
            }
          >
            {mode === 'box' ? (
              <div
                className="flex h-48 w-72 items-center justify-center rounded-xl text-sm font-medium"
                style={{
                  backgroundColor: cardColor,
                  color: '#000',
                  boxShadow: cssValue || 'none',
                }}
              >
                Preview card
              </div>
            ) : (
              <span
                className="select-none text-6xl font-bold tracking-tight sm:text-7xl"
                style={{
                  color: textColor,
                  textShadow: cssValue || 'none',
                }}
              >
                Shadow
              </span>
            )}
          </div>

          {/* Mode + surface controls */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
            <Label className="text-sm font-medium">Shadow</Label>
            <div className="flex gap-1">
              <Button
                variant={mode === 'box' ? 'default' : 'outline'}
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setMode('box')}
              >
                <Square className="h-3.5 w-3.5" /> Box
              </Button>
              <Button
                variant={mode === 'text' ? 'default' : 'outline'}
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setMode('text')}
              >
                <Type className="h-3.5 w-3.5" /> Text
              </Button>
            </div>
            <Label className="ml-2 text-sm font-medium">Surface</Label>
            <div className="flex gap-1">
              <Button
                variant={surface === 'light' ? 'default' : 'outline'}
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setSurface('light')}
              >
                <Sun className="h-3.5 w-3.5" /> Light
              </Button>
              <Button
                variant={surface === 'dark' ? 'default' : 'outline'}
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setSurface('dark')}
              >
                <Moon className="h-3.5 w-3.5" /> Dark
              </Button>
              {mode === 'box' ? (
                <Button
                  variant={surface === 'match' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => setSurface('match')}
                  title="Paint the stage in the card's own colour"
                >
                  <Blend className="h-3.5 w-3.5" /> Match
                </Button>
              ) : null}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">
                {mode === 'box' ? 'Card color' : 'Text color'}
              </Label>
              <input
                type="color"
                value={mode === 'box' ? cardColor : textColor}
                onChange={(e) =>
                  mode === 'box'
                    ? setCardColor(e.target.value)
                    : setTextColor(e.target.value)
                }
                className="h-8 w-9 cursor-pointer rounded border border-border bg-transparent"
              />
            </div>
          </div>

          {/*
            Starting stacks.

            The builder opened on a blank three-layer ramp and eight sliders,
            which is the right tool for someone who already knows the shape
            they want. The interesting shadows are conventions rather than
            tuning — an elevation ramp is a specific relationship between
            three layers, and neumorphism is a pair whose colours come from
            the surface. Neither is reachable by dragging.
          */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2.5 flex items-center gap-1.5">
              <Wand2 aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
              <Label className="text-sm font-medium">Start from</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {shadowPresetsFor(mode).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  title={preset.blurb}
                  className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {preset.name}
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-[11px] leading-snug text-muted-foreground">
              Each one replaces the stack — a shadow is a relationship between
              its layers, and half of the last one left underneath is a
              different effect. The two neumorphic entries are computed from
              the card colour and switch the stage to{' '}
              <span className="font-medium text-foreground">Match</span>,
              because that style only exists when the element and the page are
              the same colour.
            </p>

            {/*
              The caveat that has to travel with the style.

              Neumorphism is low-contrast by construction, and on a base near
              white or near black one half of the pair has nowhere to go — the
              element ends up lit from one side and reads as a smudge. Saying
              so beats emitting CSS that looks broken for reasons the visitor
              cannot see.
            */}
            {neumorphicNote ? (
              <p
                role="status"
                className="mt-2.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-2 text-[11px] leading-snug text-foreground"
              >
                {neumorphicNote}
              </p>
            ) : null}
          </div>
        </div>

        {/* Layers + output */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Layers ({layers.length}/8)
            </Label>
            <div className="flex items-center gap-1.5">
              <ShareLinkButton state={{ layers, mode, surface, cardColor, textColor }} />
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={addLayer}
                disabled={layers.length >= 8}
              >
                <Plus className="h-3 w-3" /> Add layer
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {layers.map((layer, i) => (
              <LayerCard
                key={layer.id}
                layer={layer}
                mode={mode}
                index={i}
                total={layers.length}
                onChange={(patch) => updateLayer(layer.id, patch)}
                onRemove={() => removeLayer(layer.id)}
                onMove={(dir) => moveLayer(layer.id, dir)}
              />
            ))}
          </div>

          <CopyCssCard code={cssBlock} title="CSS" language="css" />

          {/* After the layers, never before them — the ask lands once the
              stack exists rather than in front of it. A layered shadow is
              among the most tedious things on this site to rebuild from
              memory, which is exactly what makes it worth naming. */}
          <ToolPresetsBar tool={tool} noun="shadow" />

          {/* No `brand`: shadow colour is nearly always black at low alpha,
              and the card behind it is a surface rather than an identity. */}
          <UseInCatalog tool={TOOL} />
        </div>
      </div>
    </ToolLayout>
  )
}

/* ============================================================
 *  Layer card
 * ========================================================== */

interface LayerCardProps {
  layer: ShadowLayer
  mode: ShadowMode
  index: number
  total: number
  onChange: (patch: Partial<ShadowLayer>) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}

function LayerCard({ layer, mode, index, total, onChange, onRemove, onMove }: LayerCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 transition-opacity',
        layer.enabled ? 'border-border' : 'border-border/40 opacity-60',
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange({ enabled: !layer.enabled })}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
          aria-label={layer.enabled ? 'Disable layer' : 'Enable layer'}
          title={layer.enabled ? 'Disable' : 'Enable'}
        >
          {layer.enabled ? (
            <Eye className="h-4 w-4 text-primary" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <span className="text-xs font-semibold text-muted-foreground">
          Layer {index + 1}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 disabled:opacity-30"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label="Move layer up"
          >
            ↑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 disabled:opacity-30"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label="Move layer down"
          >
            ↓
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive disabled:opacity-30"
            onClick={onRemove}
            disabled={total <= 1}
            aria-label="Remove layer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/*
        One explainer for the set, rather than a line under each of the five
        controls. They repeat per layer, and a stacked shadow has three or
        four layers — the same four sentences printed sixteen times stops
        being help and becomes wallpaper.
      */}
      <p className="mb-3 text-[11px] leading-snug text-muted-foreground">
        <strong className="font-semibold text-foreground">X / Y</strong> move the
        shadow — a light source above the element means Y positive, X near zero.{' '}
        <strong className="font-semibold text-foreground">Blur</strong> softens the
        edge, and wants to be larger than Y or the shadow reads as an outline.
        {mode === 'box' ? (
          <>
            {' '}
            <strong className="font-semibold text-foreground">Spread</strong> grows
            or shrinks the shape before blurring; negative values pull it in so
            only a sliver shows.
          </>
        ) : null}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <NumberSlider
          label="X"
          value={layer.x}
          min={-50}
          max={50}
          step={1}
          unit="px"
          onChange={(v) => onChange({ x: v })}
        />
        <NumberSlider
          label="Y"
          value={layer.y}
          min={-50}
          max={50}
          step={1}
          unit="px"
          onChange={(v) => onChange({ y: v })}
        />
        <NumberSlider
          label="Blur"
          value={layer.blur}
          min={0}
          max={100}
          step={1}
          unit="px"
          onChange={(v) => onChange({ blur: v })}
        />
        {mode === 'box' ? (
          <NumberSlider
            label="Spread"
            value={layer.spread}
            min={-50}
            max={50}
            step={1}
            unit="px"
            onChange={(v) => onChange({ spread: v })}
          />
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <input
          type="color"
          value={layer.color}
          onChange={(e) => onChange({ color: e.target.value })}
          className="h-8 w-9 cursor-pointer rounded border border-field bg-transparent"
          aria-label="Shadow color"
        />
        <Input
          value={layer.color}
          onChange={(e) => {
            const n = normalizeHex(e.target.value)
            onChange({ color: n ?? e.target.value })
          }}
          className="h-8 flex-1 font-mono text-xs"
        />
        {mode === 'box' ? (
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-muted-foreground">Inset</Label>
            <Switch
              checked={layer.inset}
              onCheckedChange={(v) => onChange({ inset: v })}
              aria-label="Inset shadow"
            />
          </div>
        ) : null}
      </div>

      <div className="mt-3">
        <NumberSlider
          label="Opacity"
          value={layer.opacity}
          min={0}
          max={1}
          step={0.01}
          unit=""
          onChange={(v) => onChange({ opacity: v })}
        />
      </div>
    </div>
  )
}

/* ============================================================
 *  Number + Slider combo
 * ========================================================== */

interface NumberSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (v: number) => void
}

function NumberSlider({ label, value, min, max, step, unit, onChange }: NumberSliderProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              if (!Number.isNaN(v)) onChange(v)
            }}
            className="h-6 w-12 rounded border border-border bg-background px-1 text-right font-mono text-[11px] tabular-nums"
          />
          {unit && <span className="text-[10px] text-muted-foreground">{unit}</span>}
        </div>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(arr) => onChange(arr[0])}
      />
    </div>
  )
}
