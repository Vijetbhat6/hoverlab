'use client'

/**
 * Cubic-bezier easing studio.
 *
 * Visual editor for CSS `cubic-bezier(x1, y1, x2, y2)` timing functions.
 * Drag the two control points on an SVG canvas, see the curve live, and
 * watch a demo ball animate along a horizontal track using the current
 * easing. Includes named preset gallery (ease, ease-in, ease-out, ease-in-out,
 * ease-in-quad, ease-out-cubic, ease-in-out-quart, back, anticipate, etc.)
 * plus a "loop preview" toggle.
 */

import * as React from 'react'
import { Activity, Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'hoverlab:tool:easing'

interface BezierPoint {
  x: number
  y: number
}

interface EasingState {
  p1: BezierPoint
  p2: BezierPoint
  duration: number // seconds
  playing: boolean
  reducedMotion: boolean
}

const DEFAULT_STATE: EasingState = {
  p1: { x: 0.25, y: 0.1 },
  p2: { x: 0.25, y: 1 },
  duration: 1.5,
  playing: true,
  reducedMotion: false,
}

interface Preset {
  id: string
  name: string
  p1: BezierPoint
  p2: BezierPoint
}

const PRESETS: Preset[] = [
  { id: 'linear', name: 'linear', p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } },
  { id: 'ease', name: 'ease', p1: { x: 0.25, y: 0.1 }, p2: { x: 0.25, y: 1 } },
  { id: 'ease-in', name: 'ease-in', p1: { x: 0.42, y: 0 }, p2: { x: 1, y: 1 } },
  { id: 'ease-out', name: 'ease-out', p1: { x: 0, y: 0 }, p2: { x: 0.58, y: 1 } },
  { id: 'ease-in-out', name: 'ease-in-out', p1: { x: 0.42, y: 0 }, p2: { x: 0.58, y: 1 } },
  { id: 'in-quad', name: 'ease-in-quad', p1: { x: 0.55, y: 0.085 }, p2: { x: 0.68, y: 0.53 } },
  { id: 'out-quad', name: 'ease-out-quad', p1: { x: 0.25, y: 0.46 }, p2: { x: 0.45, y: 0.94 } },
  { id: 'in-cubic', name: 'ease-in-cubic', p1: { x: 0.55, y: 0.055 }, p2: { x: 0.675, y: 0.19 } },
  { id: 'out-cubic', name: 'ease-out-cubic', p1: { x: 0.215, y: 0.61 }, p2: { x: 0.355, y: 1 } },
  { id: 'in-out-quart', name: 'ease-in-out-quart', p1: { x: 0.77, y: 0 }, p2: { x: 0.175, y: 1 } },
  { id: 'in-back', name: 'ease-in-back', p1: { x: 0.6, y: -0.28 }, p2: { x: 0.735, y: 0.045 } },
  { id: 'out-back', name: 'ease-out-back', p1: { x: 0.175, y: 0.885 }, p2: { x: 0.32, y: 1.275 } },
  { id: 'in-out-back', name: 'ease-in-out-back', p1: { x: 0.68, y: -0.55 }, p2: { x: 0.265, y: 1.55 } },
  { id: 'anticipate', name: 'anticipate', p1: { x: 0.5, y: -0.4 }, p2: { x: 0.5, y: 1.4 } },
]

// Compute y for a given x on the cubic bezier defined by p0=(0,0), p1, p2, p3=(1,1).
// Uses Newton-Raphson root-finding on the x(t) equation.
// CSS cubic-bezier anchors are p0=(0,0) and p3=(1,1), so the full
// formulas are:
//   x(t) = 3(1-t)²t·p1.x + 3(1-t)t²·p2.x + t³
//   y(t) = 3(1-t)²t·p1.y + 3(1-t)t²·p2.y + t³
// (the t³ term comes from the (1,1) anchor).
function bezierY(p1: BezierPoint, p2: BezierPoint, x: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  let t = x // initial guess
  for (let i = 0; i < 8; i++) {
    const xt =
      3 * (1 - t) * (1 - t) * t * p1.x +
      3 * (1 - t) * t * t * p2.x +
      t * t * t
    const dx =
      3 * (1 - t) * (1 - t) * p1.x +
      6 * (1 - t) * t * (p2.x - p1.x) +
      3 * t * t * (1 - p2.x)
    if (Math.abs(dx) < 1e-6) break
    t = t - (xt - x) / dx
    t = Math.max(0, Math.min(1, t))
  }
  return (
    3 * (1 - t) * (1 - t) * t * p1.y +
    3 * (1 - t) * t * t * p2.y +
    t * t * t
  )
}

const CANVAS = 320 // SVG viewport size
const PADDING = 24

function toCanvas(p: BezierPoint): { cx: number; cy: number } {
  return {
    cx: PADDING + p.x * (CANVAS - 2 * PADDING),
    cy: CANVAS - PADDING - p.y * (CANVAS - 2 * PADDING),
  }
}

function fromCanvas(cx: number, cy: number): BezierPoint {
  return {
    x: Math.max(0, Math.min(1, (cx - PADDING) / (CANVAS - 2 * PADDING))),
    y: Math.max(-0.5, Math.min(1.5, (CANVAS - PADDING - cy) / (CANVAS - 2 * PADDING))),
  }
}

export default function EasingToolPage() {
  const [state, setState] = React.useState<EasingState>(DEFAULT_STATE)
  const draggingRef = React.useRef<'p1' | 'p2' | null>(null)
  const svgRef = React.useRef<SVGSVGElement | null>(null)

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setState((prev) => ({ ...prev, ...parsed, playing: prev.playing }))
      }
    } catch {
      /* ignore */
    }
  }, [])

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  const update = (patch: Partial<EasingState>) =>
    setState((s) => ({ ...s, ...patch }))

  const cssValue = React.useMemo(() => {
    return `cubic-bezier(${state.p1.x.toFixed(3)}, ${state.p1.y.toFixed(3)}, ${state.p2.x.toFixed(3)}, ${state.p2.y.toFixed(3)})`
  }, [state.p1, state.p2])

  const cssBlock = React.useMemo(() => {
    return `.animated {\n  transition: transform ${state.duration}s ${cssValue};\n  /* or: animation-timing-function: ${cssValue}; */\n}`
  }, [cssValue, state.duration])

  // Pointer drag handlers.
  const onPointerDown = (which: 'p1' | 'p2') => (e: React.PointerEvent) => {
    e.preventDefault()
    draggingRef.current = which
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const cx = ((e.clientX - rect.left) / rect.width) * CANVAS
    const cy = ((e.clientY - rect.top) / rect.height) * CANVAS
    const p = fromCanvas(cx, cy)
    if (draggingRef.current === 'p1') update({ p1: p })
    else update({ p2: p })
  }
  const onPointerUp = () => {
    draggingRef.current = null
  }

  const p1c = toCanvas(state.p1)
  const p2c = toCanvas(state.p2)
  const p0c = { cx: PADDING, cy: CANVAS - PADDING }
  const p3c = { cx: CANVAS - PADDING, cy: PADDING }

  // Build curve path string for the SVG.
  const curvePath = `M ${p0c.cx},${p0c.cy} C ${p1c.cx},${p1c.cy} ${p2c.cx},${p2c.cy} ${p3c.cx},${p3c.cy}`

  // Sample the curve to draw small dots along it for visual confirmation.
  const samples = React.useMemo(() => {
    const pts: { cx: number; cy: number }[] = []
    for (let i = 0; i <= 20; i++) {
      const x = i / 20
      const y = bezierY(state.p1, state.p2, x)
      pts.push(toCanvas({ x, y }))
    }
    return pts
  }, [state.p1, state.p2])

  // Find matching preset.
  const matchingPreset = React.useMemo(() => {
    return PRESETS.find(
      (p) =>
        Math.abs(p.p1.x - state.p1.x) < 0.005 &&
        Math.abs(p.p1.y - state.p1.y) < 0.005 &&
        Math.abs(p.p2.x - state.p2.x) < 0.005 &&
        Math.abs(p.p2.y - state.p2.y) < 0.005,
    )
  }, [state.p1, state.p2])

  return (
    <ToolLayout
      name="Easing Studio"
      tagline="cubic-bezier visual editor"
      icon={<Activity className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: curve editor + preview */}
        <div className="space-y-4">
          {/* Curve canvas */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <Label className="text-sm font-medium">Curve editor</Label>
              <span className="font-mono text-xs text-muted-foreground">
                {matchingPreset ? matchingPreset.name : 'custom'}
              </span>
            </div>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${CANVAS} ${CANVAS}`}
              className="w-full touch-none select-none"
              style={{ aspectRatio: '1 / 1' }}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            >
              {/* Grid */}
              {[0.25, 0.5, 0.75].map((g) => {
                const cx = toCanvas({ x: g, y: 0 }).cx
                const cy = toCanvas({ x: 0, y: g }).cy
                return (
                  <g key={g} stroke="hsl(var(--border))" strokeWidth={0.5} opacity={0.5}>
                    <line x1={cx} y1={PADDING} x2={cx} y2={CANVAS - PADDING} />
                    <line x1={PADDING} y1={cy} x2={CANVAS - PADDING} y2={cy} />
                  </g>
                )
              })}
              {/* Axes */}
              <rect
                x={PADDING}
                y={PADDING}
                width={CANVAS - 2 * PADDING}
                height={CANVAS - 2 * PADDING}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth={1}
              />
              {/* Control polygon (dashed) */}
              <line
                x1={p0c.cx}
                y1={p0c.cy}
                x2={p1c.cx}
                y2={p1c.cy}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1}
                strokeDasharray="3,3"
                opacity={0.5}
              />
              <line
                x1={p2c.cx}
                y1={p2c.cy}
                x2={p3c.cx}
                y2={p3c.cy}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1}
                strokeDasharray="3,3"
                opacity={0.5}
              />
              {/* Sample dots along the curve */}
              {samples.map((s, i) => (
                <circle
                  key={i}
                  cx={s.cx}
                  cy={s.cy}
                  r={1.5}
                  fill="hsl(var(--primary))"
                  opacity={0.4}
                />
              ))}
              {/* The curve itself */}
              <path
                d={curvePath}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              {/* Control points */}
              <circle
                cx={p1c.cx}
                cy={p1c.cy}
                r={8}
                fill="hsl(var(--primary))"
                stroke="hsl(var(--background))"
                strokeWidth={2}
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={onPointerDown('p1')}
              />
              <circle
                cx={p2c.cx}
                cy={p2c.cy}
                r={8}
                fill="hsl(var(--primary))"
                stroke="hsl(var(--background))"
                strokeWidth={2}
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={onPointerDown('p2')}
              />
              {/* Labels */}
              <text x={p0c.cx - 4} y={p0c.cy + 16} fontSize={9} fill="hsl(var(--muted-foreground))">
                0,0
              </text>
              <text x={p3c.cx - 18} y={p3c.cy - 8} fontSize={9} fill="hsl(var(--muted-foreground))">
                1,1
              </text>
            </svg>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Drag the two dots to reshape the curve. Y can overshoot [0,1] for bounce/anticipation.
            </p>
          </div>

          {/* Live preview */}
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-2">
              <span className="text-xs font-medium text-muted-foreground">Live preview</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => update({ playing: !state.playing })}
                >
                  {state.playing ? (
                    <>
                      <Pause className="h-3 w-3" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3" /> Play
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => update({ playing: true })}
                >
                  <RotateCcw className="h-3 w-3" /> Restart
                </Button>
              </div>
            </div>
            <div className="space-y-3 p-6">
              <PreviewTrack
                cssValue={cssValue}
                duration={state.duration}
                playing={state.playing}
                label="translateX"
                transform="translateX"
              />
              <PreviewTrack
                cssValue={cssValue}
                duration={state.duration}
                playing={state.playing}
                label="scale"
                transform="scale"
              />
              <PreviewTrack
                cssValue={cssValue}
                duration={state.duration}
                playing={state.playing}
                label="opacity"
                transform="opacity"
              />
            </div>
          </div>

          <CopyCssCard code={cssBlock} title="CSS" language="css" />
        </div>

        {/* Right: presets + controls */}
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-3 block text-sm font-medium">Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => update({ p1: p.p1, p2: p.p2 })}
                  className={cn(
                    'rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
                    matchingPreset?.id === p.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted',
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-3 block text-sm font-medium">Parameters</Label>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">x1</span>
                <span className="tabular-nums">{state.p1.x.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">y1</span>
                <span className="tabular-nums">{state.p1.y.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">x2</span>
                <span className="tabular-nums">{state.p2.x.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">y2</span>
                <span className="tabular-nums">{state.p2.y.toFixed(3)}</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Duration</span>
                <span className="font-mono text-xs tabular-nums">{state.duration.toFixed(2)}s</span>
              </div>
              <Slider
                value={[state.duration]}
                min={0.2}
                max={4}
                step={0.05}
                onValueChange={(arr) => update({ duration: arr[0] })}
              />
              <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                How long the demo above takes. It changes the preview only —
                the curve you copy is independent of duration.
              </p>
            </div>
          </div>

          {/* Curve mini-map showing y over x */}
          <div className="rounded-lg border border-border bg-card p-4">
            <Label className="mb-2 block text-xs font-medium text-muted-foreground">
              Progress over time
            </Label>
            <svg viewBox="0 0 200 100" className="w-full">
              <rect x={0} y={0} width={200} height={100} fill="none" stroke="hsl(var(--border))" strokeWidth={1} />
              <polyline
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                points={samples
                  .map((s) => {
                    const x = ((s.cx - PADDING) / (CANVAS - 2 * PADDING)) * 200
                    const y = 100 - ((s.cy - PADDING) / (CANVAS - 2 * PADDING)) * 100
                    return `${x},${y}`
                  })
                  .join(' ')}
              />
            </svg>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}

/* ============================================================
 *  Preview track — animates a ball using the current easing
 * ========================================================== */

interface PreviewTrackProps {
  cssValue: string
  duration: number
  playing: boolean
  label: string
  transform: 'translateX' | 'scale' | 'opacity'
}

function PreviewTrack({ cssValue, duration, playing, label, transform }: PreviewTrackProps) {
  const [tick, setTick] = React.useState(0)

  // Restart the animation when `playing` flips to true, and re-trigger
  // whenever the easing or duration changes (so the user sees the new
  // curve immediately).
  React.useEffect(() => {
    if (!playing) return
    setTick((t) => t + 1)
    const interval = setInterval(() => setTick((t) => t + 1), duration * 1000 + 400)
    return () => clearInterval(interval)
  }, [playing, cssValue, duration])

  const ballStyle: React.CSSProperties = {
    animationName: transform === 'translateX' ? 'easing-preview-x' : transform === 'scale' ? 'easing-preview-scale' : 'easing-preview-opacity',
    animationDuration: `${duration}s`,
    animationTimingFunction: cssValue.startsWith('linear') ? 'linear' : cssValue,
    animationIterationCount: 'infinite',
    animationDirection: 'alternate',
    animationPlayState: playing ? 'running' : 'paused',
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="relative h-12 overflow-hidden rounded border border-border/60 bg-muted/30">
        <div
          key={tick}
          className="absolute left-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-primary shadow-md"
          style={ballStyle}
        />
      </div>
      {/* Keyframes injected once per page (defined globally in <style jsx global>) */}
      <style jsx global>{`
        @keyframes easing-preview-x {
          from { transform: translateX(0); }
          to   { transform: translateX(calc(100% - 40px)); }
        }
        @keyframes easing-preview-scale {
          from { transform: translateX(0) scale(0.5); }
          to   { transform: translateX(calc(100% - 40px)) scale(1.4); }
        }
        @keyframes easing-preview-opacity {
          from { transform: translateX(0); opacity: 0.2; }
          to   { transform: translateX(calc(100% - 40px)); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
