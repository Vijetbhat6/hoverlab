'use client'

/**
 * Gradient Studio tool.
 *
 * Visual editor for linear / radial / conic gradients with multiple
 * color stops. Stop positions are draggable on a track; the angle is
 * adjustable via a slider or a 360° dial. Output is production CSS.
 */

import * as React from 'react'
import Link from 'next/link'
import { Pipette, Plus, Trash2, Shuffle, Copy, Check, ArrowRight } from 'lucide-react'
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
import { ToolWorkbench } from '@/components/designer-tools/tool-workbench'
import { useToolState } from '@/hooks/use-tool-state'
import { brandFromHex, normalizeHex, randomHex } from '@/lib/color-tools'
import { cn } from '@/lib/utils'

type GradientType = 'linear' | 'radial' | 'conic'

interface Stop {
  id: string
  color: string
  /** Position 0-100. */
  position: number
}

const TOOL = '/tools/gradient'

const GRADIENT_TYPES: GradientType[] = ['linear', 'radial', 'conic']

/**
 * The stops in a value, if it holds a usable set.
 *
 * Two or more, each with the three fields the CSS builder reads. This check
 * was written twice inline — once for the localStorage restore and once for
 * the shared link — and a preset restored off the account is now a third
 * caller, so it lives here instead. Returns null rather than a repaired
 * array: a gradient missing half its stops is not the gradient someone
 * saved, and falling back to the default says so plainly.
 */
function validStops(value: unknown): Stop[] | null {
  if (!Array.isArray(value) || value.length < 2) return null
  const stops = value.filter(
    (s): s is Stop =>
      !!s &&
      typeof s === 'object' &&
      typeof (s as Stop).id === 'string' &&
      typeof (s as Stop).color === 'string' &&
      typeof (s as Stop).position === 'number',
  )
  return stops.length >= 2 ? stops : null
}

interface GradientState {
  type: GradientType
  angle: number
  stops: Stop[]
  oklch: boolean
}

const DEFAULT_STATE: GradientState = {
  type: 'linear',
  angle: 135,
  oklch: false,
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
  // Working state stays local and ungated; named presets need an account.
  // See `use-tool-state.ts` for why the two layers are separate.
  const tool = useToolState<GradientState>(TOOL, DEFAULT_STATE)
  const { state, setState } = tool

  /*
    Read through a guard, not straight out of state.

    Four routes now write here — this browser's stored blob, a shared link,
    a preset off the account, and the controls below — and only the last is
    typed. Validating on read means one guard for all four; the three
    inline copies this replaced were one route each, which is how the
    fourth would have arrived unchecked.
  */
  const type = GRADIENT_TYPES.includes(state.type) ? state.type : DEFAULT_STATE.type
  const angle = Number.isFinite(state.angle) ? state.angle : DEFAULT_STATE.angle
  const oklch = typeof state.oklch === 'boolean' ? state.oklch : DEFAULT_STATE.oklch
  const stops = validStops(state.stops) ?? DEFAULT_STATE.stops

  const setType = (v: GradientType) => setState((s) => ({ ...s, type: v }))
  const setAngle = (v: number) => setState((s) => ({ ...s, angle: v }))
  const setOklch = (v: boolean) => setState((s) => ({ ...s, oklch: v }))
  const setStops = (next: (arr: Stop[]) => Stop[]) =>
    setState((s) => ({ ...s, stops: next(validStops(s.stops) ?? DEFAULT_STATE.stops) }))

  React.useEffect(() => {
    // A shared link's state wins over whatever this browser had stored.
    // Declared after `useToolState`, so the hook's restore has already run
    // by the time this does — which is what keeps that precedence true.
    const shared = readSharedState<Partial<GradientState>>()
    if (!shared) return
    setState((s) => ({
      type:
        shared.type && GRADIENT_TYPES.includes(shared.type) ? shared.type : s.type,
      angle: typeof shared.angle === 'number' ? shared.angle : s.angle,
      oklch: typeof shared.oklch === 'boolean' ? shared.oklch : s.oklch,
      stops: validStops(shared.stops) ?? s.stops,
    }))
    // `setState` is stable; the shared link is read once, on mount.
  }, [])

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
    const interp = oklch ? ' in oklch' : ''
    if (type === 'linear') return `linear-gradient(${angle}deg${interp}, ${stopsStr})`
    if (type === 'radial') return `radial-gradient(circle${interp}, ${stopsStr})`
    return `conic-gradient(from ${angle}deg${interp}, ${stopsStr})`
  }, [type, angle, sortedStops, oklch])

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
      <ToolWorkbench controlsWidth="380px">
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
                <ShareLinkButton state={{ type, angle, stops, oklch }} />
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
                <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                  Direction the gradient runs. 0° goes bottom to top and the
                  angle turns clockwise, so 90° runs left to right.
                </p>
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

            <div className="mt-5 flex items-start justify-between gap-3">
              <div>
                <Label className="text-sm font-medium">OKLCH interpolation</Label>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  Blends the stops in oklch, which avoids the grey dead zone
                  between complementary colors.
                </p>
              </div>
              <Switch
                checked={oklch}
                onCheckedChange={setOklch}
                aria-label="Interpolate in oklch"
              />
            </div>
          </div>

          <CopyCssCard code={cssBlock} title="CSS" language="css" />

          <Button asChild variant="outline" size="sm" className="w-full gap-1.5">
            <Link href={`/tools/glassmorphism?bg=${encodeURIComponent(cssValue)}`}>
              Use as glassmorphism background
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>

          {/* Tailwind class hint */}
          <div className="rounded-lg border border-border bg-muted/20 p-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Tailwind tip:</span>{' '}
            Use this in <code className="rounded bg-muted px-1 font-mono">bg-[{cssValue}]</code>{' '}
            for arbitrary gradients, or define it as a CSS variable in your
            <code className="ml-1 rounded bg-muted px-1 font-mono">tailwind.config.js</code>.
          </div>

          {/* After the controls, never before them — the ask lands once the
              gradient exists rather than in front of it. */}
          <ToolPresetsBar tool={tool} noun="gradient" />

          {/* The first stop is the one a gradient is usually built out from,
              and it is the only single hue a multi-stop blend can offer. */}
          <UseInCatalog tool={TOOL} brand={brandFromHex(sortedStops[0]?.color ?? '')} />
        </div>
      </ToolWorkbench>
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
        className="h-8 w-9 cursor-pointer rounded border border-field bg-transparent"
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
          aria-label={`Position of the ${stop.color} stop, as a percentage along the gradient`}
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
