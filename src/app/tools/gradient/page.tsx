'use client'

/**
 * Gradient Studio tool.
 *
 * Visual editor for linear / radial / conic gradients with multiple
 * color stops. Stop positions are draggable on a track; the angle is
 * adjustable via a slider or a 360° dial. Output is production CSS.
 */

import * as React from 'react'
import { Pipette, Plus, Trash2, Shuffle, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { normalizeHex, randomHex } from '@/lib/color-tools'
import { cn } from '@/lib/utils'

type GradientType = 'linear' | 'radial' | 'conic'

interface Stop {
  id: string
  color: string
  /** Position 0-100. */
  position: number
}

const STORAGE_KEY = 'hoverlab:tool:gradient'

interface GradientState {
  type: GradientType
  angle: number
  stops: Stop[]
}

const DEFAULT_STATE: GradientState = {
  type: 'linear',
  angle: 135,
  stops: [
    { id: 's1', color: '#f43f5e', position: 0 },
    { id: 's2', color: '#f59e0b', position: 50 },
    { id: 's3', color: '#10b981', position: 100 },
  ],
}

let stopCounter = 100
function newStopId() {
  return `s${++stopCounter}`
}

export default function GradientToolPage() {
  const [type, setType] = React.useState<GradientType>('linear')
  const [angle, setAngle] = React.useState(135)
  const [stops, setStops] = React.useState<Stop[]>(DEFAULT_STATE.stops)

  // Hydrate.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.type && ['linear', 'radial', 'conic'].includes(parsed.type)) {
          setType(parsed.type)
        }
        if (typeof parsed.angle === 'number') setAngle(parsed.angle)
        if (Array.isArray(parsed.stops) && parsed.stops.length >= 2) {
          const valid = parsed.stops.filter(
            (s: Stop) =>
              s && typeof s.id === 'string' && typeof s.color === 'string' && typeof s.position === 'number',
          )
          if (valid.length >= 2) setStops(valid)
        }
      }
    } catch {
      /* ignore */
    }
  }, [])

  // Persist.
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ type, angle, stops }))
    } catch {
      /* ignore */
    }
  }, [type, angle, stops])

  // Sort stops by position for the CSS output (but keep the user's
  // editing order in the UI).
  const sortedStops = React.useMemo(
    () => [...stops].sort((a, b) => a.position - b.position),
    [stops],
  )

  const cssValue = React.useMemo(() => {
    const stopsStr = sortedStops
      .map((s) => `${s.color} ${s.position}%`)
      .join(', ')
    if (type === 'linear') return `linear-gradient(${angle}deg, ${stopsStr})`
    if (type === 'radial') return `radial-gradient(circle, ${stopsStr})`
    return `conic-gradient(from ${angle}deg, ${stopsStr})`
  }, [type, angle, sortedStops])

  const cssBlock = React.useMemo(() => {
    return `.gradient {\n  background: ${cssValue};\n  /* Fallback for older browsers */\n  background-color: ${sortedStops[0]?.color ?? '#000'};\n}`
  }, [cssValue, sortedStops])

  // Stop manipulation.
  const updateStop = (id: string, patch: Partial<Stop>) => {
    setStops((arr) => arr.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }
  const removeStop = (id: string) => {
    setStops((arr) => (arr.length <= 2 ? arr : arr.filter((s) => s.id !== id)))
  }
  const addStop = () => {
    const lastPos = stops[stops.length - 1]?.position ?? 100
    const newPos = Math.min(100, lastPos + 10)
    setStops((arr) => [...arr, { id: newStopId(), color: randomHex(), position: newPos }])
  }
  const randomize = () => {
    setStops((arr) =>
      arr.map((s) => ({ ...s, color: randomHex() })),
    )
  }

  return (
    <ToolLayout
      name="Gradient Studio"
      tagline="Visually compose multi-stop gradients"
      icon={<Pipette className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* Preview + stop track */}
        <div className="space-y-4">
          <div
            className="h-80 w-full rounded-xl border border-border shadow-inner"
            style={{ background: cssValue }}
          />

          {/* Stop track */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm font-medium">Color stops</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={randomize}>
                  <Shuffle className="h-3 w-3" /> Randomize colors
                </Button>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={addStop}>
                  <Plus className="h-3 w-3" /> Add stop
                </Button>
              </div>
            </div>

            <div
              className="relative mb-2 h-6 w-full overflow-hidden rounded border border-border"
              style={{ background: cssValue }}
            >
              {/* Stop markers — purely visual; the actual editing happens in
                  the per-stop rows below. This keeps the UI accessible. */}
              {sortedStops.map((s) => (
                <div
                  key={s.id}
                  className="absolute top-0 h-6 w-1 -translate-x-1/2 border-x border-white/80 bg-white/40 shadow"
                  style={{ left: `${s.position}%` }}
                  aria-hidden
                />
              ))}
            </div>

            {/* Per-stop rows */}
            <div className="space-y-2">
              {stops.map((stop) => (
                <StopRow
                  key={stop.id}
                  stop={stop}
                  canRemove={stops.length > 2}
                  onChange={(patch) => updateStop(stop.id, patch)}
                  onRemove={() => removeStop(stop.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-2 block text-sm font-medium">Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['linear', 'radial', 'conic'] as GradientType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    'rounded-md border px-3 py-2 text-xs font-medium capitalize transition-colors',
                    type === t
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background hover:bg-muted',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {(type === 'linear' || type === 'conic') && (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <Label className="text-sm font-medium">Angle</Label>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">{angle}°</span>
                </div>
                <Slider
                  value={[angle]}
                  min={0}
                  max={360}
                  step={1}
                  onValueChange={(arr) => setAngle(arr[0])}
                />
                {/* Quick angle presets */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAngle(a)}
                      className={cn(
                        'rounded border px-2 py-0.5 font-mono text-[10px] tabular-nums',
                        angle === a
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:bg-muted',
                      )}
                    >
                      {a}°
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <CopyCssCard code={cssBlock} title="CSS" language="css" />

          {/* Tailwind class hint */}
          <div className="rounded-lg border border-border bg-muted/20 p-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Tailwind tip:</span>{' '}
            Use this in <code className="rounded bg-muted px-1 font-mono">bg-[{cssValue}]</code>{' '}
            for arbitrary gradients, or define it as a CSS variable in your
            <code className="ml-1 rounded bg-muted px-1 font-mono">tailwind.config.js</code>.
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}

/* ============================================================
 *  Stop row
 * ========================================================== */

interface StopRowProps {
  stop: Stop
  canRemove: boolean
  onChange: (patch: Partial<Stop>) => void
  onRemove: () => void
}

function StopRow({ stop, canRemove, onChange, onRemove }: StopRowProps) {
  const [copied, setCopied] = React.useState(false)

  const onCopyColor = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(stop.color)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      /* ignore */
    }
  }, [stop.color])

  return (
    <div className="flex items-center gap-2 rounded-md border border-border/60 bg-background p-2">
      <input
        type="color"
        value={stop.color}
        onChange={(e) => onChange({ color: e.target.value })}
        className="h-8 w-9 cursor-pointer rounded border border-border bg-transparent"
        aria-label={`Stop ${stop.id} color`}
      />
      <button
        type="button"
        onClick={onCopyColor}
        className="font-mono text-xs hover:text-primary"
        title="Copy hex"
      >
        {copied ? <Check className="inline h-3 w-3 text-emerald-500" /> : <Copy className="inline h-3 w-3" />}
        {' '}{stop.color}
      </button>
      <div className="ml-auto flex items-center gap-2">
        <Slider
          value={[stop.position]}
          min={0}
          max={100}
          step={1}
          onValueChange={(arr) => onChange({ position: arr[0] })}
          className="w-32"
        />
        <span className="w-10 text-right font-mono text-xs tabular-nums text-muted-foreground">
          {stop.position}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive disabled:opacity-30"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label="Remove stop"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
