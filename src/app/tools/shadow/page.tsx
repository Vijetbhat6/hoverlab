'use client'

/**
 * Shadow Builder tool.
 *
 * Layer up to 8 box-shadows or text-shadows with independent x / y / blur /
 * spread / color / opacity / inset controls. One tool for both because the
 * mental model is identical — layered offsets of the same silhouette — and
 * text-shadow is just the subset without spread and inset, so those two
 * controls disappear in text mode rather than living on a separate page.
 * Preview against a card (or a headline) on either a light or dark surface.
 * Output is production CSS.
 */

import * as React from 'react'
import {
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { readSharedState, ShareLinkButton } from '@/components/designer-tools/share-link'
import { normalizeHex, hexToRgb } from '@/lib/color-tools'
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

const STORAGE_KEY = 'hoverlab:tool:shadow'

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
  const [layers, setLayers] = React.useState<ShadowLayer[]>(defaultLayers)
  const [mode, setMode] = React.useState<ShadowMode>('box')
  const [surface, setSurface] = React.useState<'light' | 'dark'>('light')
  const [cardColor, setCardColor] = React.useState('#ffffff')
  // Separate from cardColor: the card default (white) would make the text
  // preview invisible on the light surface.
  const [textColor, setTextColor] = React.useState('#18181b')

  // Hydrate.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed.layers) && parsed.layers.length >= 1) {
          setLayers(parsed.layers)
        }
        if (parsed.surface === 'light' || parsed.surface === 'dark') {
          setSurface(parsed.surface)
        }
        if (parsed.mode === 'box' || parsed.mode === 'text') {
          setMode(parsed.mode)
        }
        if (typeof parsed.cardColor === 'string') setCardColor(parsed.cardColor)
        if (typeof parsed.textColor === 'string') setTextColor(parsed.textColor)
      }
    } catch {
      /* ignore */
    }

    // A shared link's state wins over whatever this browser had stored.
    const shared = readSharedState<{
      layers?: ShadowLayer[]
      mode?: ShadowMode
      surface?: 'light' | 'dark'
      cardColor?: string
      textColor?: string
    }>()
    if (shared) {
      if (Array.isArray(shared.layers) && shared.layers.length >= 1) {
        setLayers(shared.layers)
      }
      if (shared.mode === 'box' || shared.mode === 'text') setMode(shared.mode)
      if (shared.surface === 'light' || shared.surface === 'dark') {
        setSurface(shared.surface)
      }
      if (typeof shared.cardColor === 'string') setCardColor(shared.cardColor)
      if (typeof shared.textColor === 'string') setTextColor(shared.textColor)
    }
  }, [])

  // Persist.
  React.useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ layers, mode, surface, cardColor, textColor }),
      )
    } catch {
      /* ignore */
    }
  }, [layers, mode, surface, cardColor, textColor])

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
              surface === 'dark' ? 'bg-zinc-900' : 'bg-zinc-100',
            )}
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
          className="h-8 w-9 cursor-pointer rounded border border-border bg-transparent"
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
