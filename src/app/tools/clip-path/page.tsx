'use client'

/**
 * Clip-path & Blob Generator.
 *
 * Two modes:
 *  1. Presets — the classic polygon() shapes (chevron, star, arrow, speech
 *     bubble…), each with the one or two parameters that shape actually has,
 *     because "star" is not one shape but a family of them.
 *  2. Blob — an organic closed curve: N control points around a circle with
 *     per-point radius jitter, smoothed Catmull-Rom → cubic bezier, drawn in
 *     a 0–100 box so the same path works as SVG anywhere.
 *
 * Both previews sit over a checkerboard, because a clip only reads as a cut
 * when you can see what it removed. polygon() takes percentages and scales
 * with the element; path() clips in px, so the blob output says so.
 */

import * as React from 'react'
import { Shapes, Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SliderField } from '@/components/control-field'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { arbitraryValue } from '@/lib/tailwind-arbitrary'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { ToolWorkbench } from '@/components/designer-tools/tool-workbench'
import { useToolState } from '@/hooks/use-tool-state'
import { cn } from '@/lib/utils'

const TOOL = '/tools/clip-path'

type Mode = 'presets' | 'blob'

interface ShapeParam {
  label: string
  description: string
  min: number
  max: number
  step: number
  def: number
  unit: string
}

interface ShapePreset {
  id: string
  name: string
  /** Up to two params, mapped to state.p1 / state.p2 in order. */
  params: ShapeParam[]
  points: (p1: number, p2: number) => [number, number][]
}

const PRESETS: ShapePreset[] = [
  {
    id: 'triangle',
    name: 'Triangle',
    params: [
      {
        label: 'Apex position',
        description: 'Where the top point sits, left to right. 50% is an isosceles triangle; the extremes give you a right triangle.',
        min: 0,
        max: 100,
        step: 1,
        def: 50,
        unit: '%',
      },
    ],
    points: (p1) => [
      [p1, 0],
      [100, 100],
      [0, 100],
    ],
  },
  {
    id: 'chevron',
    name: 'Chevron',
    params: [
      {
        label: 'Depth',
        description: 'How far the arrowhead cuts in and out. Shallow reads as a breadcrumb separator; deep reads as a direction sign.',
        min: 5,
        max: 45,
        step: 1,
        def: 25,
        unit: '%',
      },
    ],
    points: (p1) => [
      [100 - p1, 0],
      [100, 50],
      [100 - p1, 100],
      [0, 100],
      [p1, 50],
      [0, 0],
    ],
  },
  {
    id: 'arrow',
    name: 'Arrow',
    params: [
      {
        label: 'Shaft thickness',
        description: 'Height of the arrow shaft relative to the head. Thin looks like a pointer; thick looks like a banner.',
        min: 10,
        max: 90,
        step: 1,
        def: 40,
        unit: '%',
      },
      {
        label: 'Head length',
        description: 'How much of the width the arrowhead takes. Longer heads look faster.',
        min: 10,
        max: 60,
        step: 1,
        def: 30,
        unit: '%',
      },
    ],
    points: (p1, p2) => {
      const top = (100 - p1) / 2
      return [
        [0, top],
        [100 - p2, top],
        [100 - p2, 0],
        [100, 50],
        [100 - p2, 100],
        [100 - p2, 100 - top],
        [0, 100 - top],
      ]
    },
  },
  {
    id: 'star',
    name: 'Star',
    params: [
      {
        label: 'Points',
        description: 'Number of star points. Five is the icon everyone knows; more starts to read as a seal or a burst.',
        min: 4,
        max: 12,
        step: 1,
        def: 5,
        unit: '',
      },
      {
        label: 'Inset',
        description: 'Inner radius as a share of the outer one. Low values give sharp spikes; high values approach a polygon.',
        min: 20,
        max: 90,
        step: 1,
        def: 50,
        unit: '%',
      },
    ],
    points: (p1, p2) => {
      const n = Math.round(p1)
      const inner = 50 * (p2 / 100)
      const pts: [number, number][] = []
      for (let i = 0; i < n * 2; i++) {
        const r = i % 2 === 0 ? 50 : inner
        const a = (i * Math.PI) / n - Math.PI / 2
        pts.push([50 + r * Math.cos(a), 50 + r * Math.sin(a)])
      }
      return pts
    },
  },
  {
    id: 'pentagon',
    name: 'Pentagon',
    params: [],
    points: () => {
      const pts: [number, number][] = []
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2
        pts.push([50 + 50 * Math.cos(a), 50 + 50 * Math.sin(a)])
      }
      return pts
    },
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    params: [
      {
        label: 'Corner cut',
        description: 'How far the left and right points are pulled in. 25% is the regular-ish hexagon; 50% collapses it to a rhombus.',
        min: 5,
        max: 50,
        step: 1,
        def: 25,
        unit: '%',
      },
    ],
    points: (p1) => [
      [p1, 0],
      [100 - p1, 0],
      [100, 50],
      [100 - p1, 100],
      [p1, 100],
      [0, 50],
    ],
  },
  {
    id: 'rhombus',
    name: 'Rhombus',
    params: [],
    points: () => [
      [50, 0],
      [100, 50],
      [50, 100],
      [0, 50],
    ],
  },
  {
    id: 'trapezoid',
    name: 'Trapezoid',
    params: [
      {
        label: 'Top inset',
        description: 'How much narrower the top edge is than the bottom. 0 is a rectangle; near 50 it becomes a triangle.',
        min: 0,
        max: 49,
        step: 1,
        def: 20,
        unit: '%',
      },
    ],
    points: (p1) => [
      [p1, 0],
      [100 - p1, 0],
      [100, 100],
      [0, 100],
    ],
  },
  {
    id: 'speech',
    name: 'Speech bubble',
    params: [
      {
        label: 'Tail position',
        description: 'Where the tail points along the bottom edge. Aim it at the speaker.',
        min: 10,
        max: 70,
        step: 1,
        def: 50,
        unit: '%',
      },
    ],
    points: (p1) => [
      [0, 0],
      [100, 0],
      [100, 75],
      [p1 + 25, 75],
      [p1 + 25, 100],
      [p1, 75],
      [0, 75],
    ],
  },
  {
    id: 'cross',
    name: 'Cross',
    params: [
      {
        label: 'Bar thickness',
        description: 'Width of both bars. Thin is a crosshair; thick is a plus button.',
        min: 10,
        max: 60,
        step: 1,
        def: 34,
        unit: '%',
      },
    ],
    points: (p1) => {
      const a = (100 - p1) / 2
      const b = a + p1
      return [
        [a, 0],
        [b, 0],
        [b, a],
        [100, a],
        [100, b],
        [b, b],
        [b, 100],
        [a, 100],
        [a, b],
        [0, b],
        [0, a],
        [a, a],
      ]
    },
  },
  {
    id: 'close',
    name: 'Close (X)',
    params: [
      {
        label: 'Stroke thickness',
        description: 'Weight of the two diagonal strokes. Thin is a delete glyph; thick is a warning mark.',
        min: 5,
        max: 40,
        step: 1,
        def: 20,
        unit: '%',
      },
    ],
    points: (p1) => [
      [p1, 0],
      [0, p1],
      [50 - p1, 50],
      [0, 100 - p1],
      [p1, 100],
      [50, 50 + p1],
      [100 - p1, 100],
      [100, 100 - p1],
      [50 + p1, 50],
      [100, p1],
      [100 - p1, 0],
      [50, 50 - p1],
    ],
  },
]

const fmt = (n: number) => String(Math.round(n * 10) / 10)

function polygonValue(points: [number, number][]): string {
  return `polygon(${points.map(([x, y]) => `${fmt(x)}% ${fmt(y)}%`).join(', ')})`
}

/** Deterministic PRNG so a blob can be regenerated (and persisted) by seed. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Catmull-Rom through all points → closed cubic-bezier SVG path. */
function smoothClosedPath(points: [number, number][]): string {
  const n = points.length
  let d = `M ${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n]
    const p1 = points[i]
    const p2 = points[(i + 1) % n]
    const p3 = points[(i + 2) % n]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`
  }
  return d + ' Z'
}

function blobPath(count: number, jitter: number, seed: number): string {
  const rand = mulberry32(seed)
  const step = (Math.PI * 2) / count
  const pts: [number, number][] = []
  for (let i = 0; i < count; i++) {
    // Jitter the angle a little and the radius a lot; even at 100% the
    // radius keeps 40% of its length so the blob never self-intersects.
    const a = i * step - Math.PI / 2 + (rand() - 0.5) * step * 0.5 * (jitter / 100)
    const r = 48 * (1 - rand() * 0.6 * (jitter / 100))
    pts.push([50 + r * Math.cos(a), 50 + r * Math.sin(a)])
  }
  return smoothClosedPath(pts)
}

const CHECKER_STYLE: React.CSSProperties = {
  backgroundImage:
    'repeating-conic-gradient(rgba(127, 127, 127, 0.22) 0% 25%, rgba(127, 127, 127, 0.06) 0% 50%)',
  backgroundSize: '24px 24px',
}

interface ClipState {
  mode: Mode
  presetId: string
  p1: number
  p2: number
  blobPoints: number
  blobJitter: number
  blobSeed: number
  gradFrom: string
  gradTo: string
}

const DEFAULT_STATE: ClipState = {
  mode: 'presets',
  presetId: 'star',
  p1: 5,
  p2: 50,
  blobPoints: 6,
  blobJitter: 55,
  blobSeed: 1337,
  gradFrom: '#10b981',
  gradTo: '#6366f1',
}

/**
 * The two fields `useToolState`'s shape guard cannot check on a shared link.
 *
 * The guard guarantees `mode` is a string and `presetId` is a string. It
 * cannot know that `mode` is one of two, or that `presetId` has to name a
 * shape that still exists — `PRESETS` is data this file owns. Both matter
 * on render: an unrecognised `mode` matches neither output branch and draws
 * an empty panel, and a stale `presetId` would silently fall back to the
 * first shape while the controls claimed otherwise.
 *
 * Numbers are left alone. Seed, points and jitter fully determine the blob,
 * and the sliders clamp them; a link carrying an out-of-range one draws an
 * odd shape, which is a shape, not a broken page.
 */
function sanitizeShared(shared: ClipState): ClipState {
  return {
    ...shared,
    mode: shared.mode === 'presets' || shared.mode === 'blob' ? shared.mode : DEFAULT_STATE.mode,
    presetId: PRESETS.some((p) => p.id === shared.presetId)
      ? shared.presetId
      : DEFAULT_STATE.presetId,
  }
}

export default function ClipPathToolPage() {
  // Working state stays local and ungated; named presets need an account.
  // See `use-tool-state.ts` for why the two layers are separate.
  const tool = useToolState<ClipState>(TOOL, DEFAULT_STATE, sanitizeShared)
  const { state, setState } = tool
  const gradientId = React.useId()

  const update = (patch: Partial<ClipState>) => setState((s) => ({ ...s, ...patch }))

  const preset = PRESETS.find((p) => p.id === state.presetId) ?? PRESETS[0]

  const selectPreset = (p: ShapePreset) =>
    update({
      presetId: p.id,
      p1: p.params[0]?.def ?? 0,
      p2: p.params[1]?.def ?? 0,
    })

  const gradient = `linear-gradient(135deg, ${state.gradFrom}, ${state.gradTo})`

  const polygon = React.useMemo(
    () => polygonValue(preset.points(state.p1, state.p2)),
    [preset, state.p1, state.p2],
  )

  const polygonCss = React.useMemo(
    () => `.shape {\n  clip-path: ${polygon};\n}`,
    [polygon],
  )

  /*
    The same shape as a Tailwind class.

    The arbitrary-PROPERTY form, because there is no `clip-path` utility to
    hang a value off — `[clip-path:…]` is the whole mechanism Tailwind
    offers for a property it does not model, and it is exactly right here.
  */
  const tailwindClass = React.useMemo(
    () => `[clip-path:${arbitraryValue(polygon)}]`,
    [polygon],
  )

  const blobD = React.useMemo(
    () => blobPath(state.blobPoints, state.blobJitter, state.blobSeed),
    [state.blobPoints, state.blobJitter, state.blobSeed],
  )

  const blobCss = React.useMemo(
    () =>
      `.blob {\n  /* The curve is drawn in a 0–100 box. clip-path: path() clips in px,\n     so keep the element 100×100px (or transform: scale() it) — or put the\n     path in an SVG <clipPath clipPathUnits="objectBoundingBox"> to make\n     the clip scale with any element. */\n  width: 100px;\n  height: 100px;\n  clip-path: path('${blobD}');\n}`,
    [blobD],
  )

  const blobSvg = React.useMemo(
    () => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">\n  <path d="${blobD}" />\n</svg>`,
    [blobD],
  )

  const regenerate = () => update({ blobSeed: Math.floor(Math.random() * 2 ** 31) })

  return (
    <ToolLayout
      name="Clip-path & Blob"
      tagline="Polygon shape presets & organic blobs"
      icon={<Shapes className="h-5 w-5" />}
    >
      <ToolWorkbench controlsWidth="380px">
        {/* Preview */}
        <div className="space-y-4">
          <div
            className="flex min-h-[400px] items-center justify-center rounded-xl border border-border p-8"
            style={CHECKER_STYLE}
          >
            {state.mode === 'presets' ? (
              <div
                className="h-[280px] w-[280px]"
                style={{ background: gradient, clipPath: polygon }}
              />
            ) : (
              <svg width={280} height={280} viewBox="0 0 100 100" role="img" aria-label="Blob preview">
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={state.gradFrom} />
                    <stop offset="100%" stopColor={state.gradTo} />
                  </linearGradient>
                </defs>
                <path d={blobD} fill={`url(#${gradientId})`} />
              </svg>
            )}
          </div>

          {/* Mode selector */}
          <div className="flex items-center gap-2">
            {(['presets', 'blob'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => update({ mode: m })}
                className={cn(
                  'flex-1 rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors',
                  state.mode === m
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background hover:bg-muted',
                )}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Per-mode output */}
          {state.mode === 'presets' && (
            <>
              <CopyCssCard code={polygonCss} title="CSS" language="css" />
              <CopyCssCard code={tailwindClass} title="Tailwind class" language="html" />
            </>
          )}
          {state.mode === 'blob' && (
            <>
              <CopyCssCard code={blobCss} title="CSS with clip-path" language="css" />
              <CopyCssCard code={blobSvg} title="SVG path" language="svg" />
            </>
          )}

          {/* No `brand`: the fill gradient is preview scaffolding, not an
              identity — the copied CSS carries no colour at all. */}
          <UseInCatalog tool={TOOL} />
        </div>

        {/* Controls */}
        <div className="space-y-5">
          {state.mode === 'presets' && (
            <>
              <div className="rounded-lg border border-border bg-card p-5">
                <Label className="mb-3 block text-sm font-medium">Shape</Label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectPreset(p)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-md border p-2.5 transition-colors',
                        state.presetId === p.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-muted',
                      )}
                      aria-pressed={state.presetId === p.id}
                    >
                      <span
                        className="block h-9 w-9"
                        style={{
                          background: gradient,
                          clipPath: polygonValue(
                            p.points(p.params[0]?.def ?? 0, p.params[1]?.def ?? 0),
                          ),
                        }}
                      />
                      <span className="text-[11px] leading-tight text-muted-foreground">
                        {p.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {preset.params.length > 0 && (
                <div className="space-y-4 rounded-lg border border-border bg-card p-5">
                  <Label className="block text-sm font-medium">{preset.name} parameters</Label>
                  {preset.params.map((param, i) => {
                    const key = i === 0 ? 'p1' : 'p2'
                    const value = i === 0 ? state.p1 : state.p2
                    return (
                      <SliderField
                        key={`${preset.id}-${key}`}
                        label={param.label}
                        description={param.description}
                        value={value}
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        display={`${value}${param.unit}`}
                        onChange={(v) => update({ [key]: v })}
                      />
                    )
                  })}
                </div>
              )}
            </>
          )}

          {state.mode === 'blob' && (
            <div className="space-y-4 rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Blob</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={regenerate}
                >
                  <Shuffle className="h-3 w-3" /> Regenerate
                </Button>
              </div>
              <SliderField
                label="Control points"
                description="How many points the curve passes through. Few points give a soft pebble; many give a wavy, coral-like edge."
                value={state.blobPoints}
                min={3}
                max={12}
                step={1}
                display={String(state.blobPoints)}
                onChange={(v) => update({ blobPoints: v })}
              />
              <SliderField
                label="Randomness"
                description="How far each point may wander from the circle. 0% is a perfect circle; high values get lumpy but never self-intersect."
                value={state.blobJitter}
                min={0}
                max={100}
                step={1}
                display={`${state.blobJitter}%`}
                onChange={(v) => update({ blobJitter: v })}
              />
              <p className="text-xs text-muted-foreground">
                The same seed always draws the same blob, so a shape you like survives a
                reload. Regenerate rolls a new one.
              </p>
            </div>
          )}

          {/* Common: fill gradient */}
          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-3 block text-sm font-medium">Fill gradient</Label>
            <div className="space-y-3">
              {(
                [
                  { key: 'gradFrom', label: 'From' },
                  { key: 'gradTo', label: 'To' },
                ] as const
              ).map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <Label className="w-10 text-xs text-muted-foreground">{label}</Label>
                  <input
                    type="color"
                    value={state[key]}
                    onChange={(e) => update({ [key]: e.target.value })}
                    className="h-8 w-9 cursor-pointer rounded border border-field bg-transparent"
                    aria-label={`Gradient ${label.toLowerCase()} color`}
                  />
                  <Input
                    value={state[key]}
                    onChange={(e) => update({ [key]: e.target.value })}
                    className="h-8 flex-1 font-mono text-xs"
                    aria-label={`Gradient ${label.toLowerCase()} colour, as a hex value`}
                  />
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Fill is preview-only — the copied CSS is just the clip, ready to apply to
              your own element or image.
            </p>
          </div>

          {/* After the controls, never before them — the ask lands once the
              shape exists rather than in front of it. */}
          <ToolPresetsBar tool={tool} noun="shape" />
        </div>
      </ToolWorkbench>
    </ToolLayout>
  )
}
