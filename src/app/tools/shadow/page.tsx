'use client'

/**
 * Shadow Builder tool.
 *
 * Layer up to 8 box-shadows with independent x / y / blur / spread /
 * color / opacity / inset controls. Each layer has a colored swatch
 * and a "this layer enabled" toggle. Preview against a card on either
 * a light or dark surface. Output is production CSS.
 */

import * as React from 'react'
import { Layers, Plus, Trash2, Copy, Eye, EyeOff, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
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

function layerToCss(l: ShadowLayer): string {
  const rgb = hexToRgb(l.color)
  if (!rgb) return ''
  const parts = [
    l.inset ? 'inset' : '',
    `${l.x}px`,
    `${l.y}px`,
    `${l.blur}px`,
    l.spread !== 0 ? `${l.spread}px` : '',
    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${l.opacity.toFixed(2)})`,
  ].filter(Boolean)
  return parts.join(' ')
}

export default function ShadowToolPage() {
  const [layers, setLayers] = React.useState<ShadowLayer[]>(defaultLayers)
  const [surface, setSurface] = React.useState<'light' | 'dark'>('light')
  const [cardColor, setCardColor] = React.useState('#ffffff')

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
        if (typeof parsed.cardColor === 'string') setCardColor(parsed.cardColor)
      }
    } catch {
      /* ignore */
    }
  }, [])

  // Persist.
  React.useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ layers, surface, cardColor }),
      )
    } catch {
      /* ignore */
    }
  }, [layers, surface, cardColor])

  const cssValue = React.useMemo(() => {
    return layers
      .filter((l) => l.enabled)
      .map(layerToCss)
      .filter(Boolean)
      .join(',\n    ')
  }, [layers])

  const cssBlock = React.useMemo(() => {
    if (!cssValue) return '.card {\n  box-shadow: none;\n}'
    return `.card {\n  box-shadow:\n    ${cssValue};\n}`
  }, [cssValue])

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
      tagline="Layer up to 8 box-shadows"
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
            <div
              className="flex h-48 w-72 items-center justify-center rounded-xl text-sm font-medium"
              style={{
                backgroundColor: cardColor,
                color: surface === 'dark' ? '#000' : '#000',
                boxShadow: cssValue || 'none',
              }}
            >
              Preview card
            </div>
          </div>

          {/* Surface controls */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
            <Label className="text-sm font-medium">Surface</Label>
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
              <Label className="text-xs text-muted-foreground">Card color</Label>
              <input
                type="color"
                value={cardColor}
                onChange={(e) => setCardColor(e.target.value)}
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

          <div className="space-y-3">
            {layers.map((layer, i) => (
              <LayerCard
                key={layer.id}
                layer={layer}
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
  index: number
  total: number
  onChange: (patch: Partial<ShadowLayer>) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}

function LayerCard({ layer, index, total, onChange, onRemove, onMove }: LayerCardProps) {
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
        <NumberSlider
          label="Spread"
          value={layer.spread}
          min={-50}
          max={50}
          step={1}
          unit="px"
          onChange={(v) => onChange({ spread: v })}
        />
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
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground">Inset</Label>
          <Switch
            checked={layer.inset}
            onCheckedChange={(v) => onChange({ inset: v })}
            aria-label="Inset shadow"
          />
        </div>
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
