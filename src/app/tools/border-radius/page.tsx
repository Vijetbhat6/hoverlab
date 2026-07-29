'use client'

/**
 * Border-radius / Squircle generator.
 *
 * Three modes:
 *  1. Standard — per-corner border-radius with linked or independent corners.
 *  2. Squircle — superellipse formula popularized by Apple. Generates an
 *     SVG path so designers can paste a true squircle (not just border-radius).
 *  3. Fluid — `min()` based responsive border-radius that scales with viewport.
 *
 * Outputs production CSS + (for squircle) an SVG path string.
 */

import * as React from 'react'
import { Square, Copy, Check, Link2, Link2Off } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'hoverlab:tool:border-radius'

type Mode = 'standard' | 'squircle' | 'fluid'

interface BRState {
  mode: Mode
  // standard
  tl: number
  tr: number
  br: number
  bl: number
  linked: boolean
  // squircle
  squircleSize: number
  squircleCurve: number // 0-1, higher = more curved
  // fluid
  fluidMin: number
  fluidMax: number
  // preview
  previewSize: number
  previewColor: string
}

const DEFAULT_STATE: BRState = {
  mode: 'standard',
  tl: 16,
  tr: 16,
  br: 16,
  bl: 16,
  linked: true,
  squircleSize: 200,
  squircleCurve: 0.6,
  fluidMin: 4,
  fluidMax: 32,
  previewSize: 220,
  previewColor: '#10b981',
}

/**
 * Generate a squircle (superellipse) SVG path.
 * Formula: |x/a|^n + |y/b|^n = 1, where n controls curvature.
 * n=2 → circle/ellipse; n=4 → classic squircle; n→∞ → rectangle.
 *
 * We sample 64 points around the curve and emit a closed SVG path.
 */
function squirclePath(size: number, curve: number): string {
  const a = size / 2
  const b = size / 2
  // Map curve [0, 1] to exponent [2, 8]. curve=0.5 → n=4 (classic).
  const n = 2 + curve * 6
  const cx = a
  const cy = b
  const points: [number, number][] = []
  const steps = 64
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const cosT = Math.cos(t)
    const sinT = Math.sin(t)
    // Parametric superellipse: x = a * sign(cos) * |cos|^(2/n), same for y.
    const x = cx + a * Math.sign(cosT) * Math.pow(Math.abs(cosT), 2 / n)
    const y = cy + b * Math.sign(sinT) * Math.pow(Math.abs(sinT), 2 / n)
    points.push([x, y])
  }
  // Build path with cubic smoothing (Catmull-Rom → Bezier).
  let d = `M ${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`
  for (let i = 0; i < points.length; i++) {
    const p0 = points[(i - 1 + points.length) % points.length]
    const p1 = points[i]
    const p2 = points[(i + 1) % points.length]
    const p3 = points[(i + 2) % points.length]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`
  }
  d += ' Z'
  return d
}

export default function BorderRadiusToolPage() {
  const [state, setState] = React.useState<BRState>(DEFAULT_STATE)

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setState((prev) => ({ ...prev, ...parsed }))
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

  const update = (patch: Partial<BRState>) => setState((s) => ({ ...s, ...patch }))

  // When linked, dragging any corner updates all four.
  const setCorner = (corner: 'tl' | 'tr' | 'br' | 'bl', value: number) => {
    if (state.linked) {
      update({ tl: value, tr: value, br: value, bl: value })
    } else {
      update({ [corner]: value })
    }
  }

  // Outputs per mode.
  const standardCss = React.useMemo(() => {
    const { tl, tr, br, bl } = state
    if (tl === tr && tr === br && br === bl) {
      return `.box {\n  border-radius: ${tl}px;\n}`
    }
    return `.box {\n  border-radius: ${tl}px ${tr}px ${br}px ${bl}px;\n}`
  }, [state.tl, state.tr, state.br, state.bl])

  const squircleSvgPath = React.useMemo(
    () => squirclePath(state.squircleSize, state.squircleCurve),
    [state.squircleSize, state.squircleCurve],
  )

  const squircleCss = React.useMemo(() => {
    return `/* SVG path (paste into <path d="...">) */\n/* ${squircleSvgPath} */\n\n.squircle {\n  width: ${state.squircleSize}px;\n  height: ${state.squircleSize}px;\n  /* For browsers that support clip-path: path() */\n  clip-path: path('${squircleSvgPath}');\n  background: ${state.previewColor};\n}`
  }, [squircleSvgPath, state.squircleSize, state.previewColor])

  const fluidCss = React.useMemo(() => {
    return `.box {\n  /* Scales from ${state.fluidMin}px (mobile) to ${state.fluidMax}px (desktop) */\n  border-radius: min(${state.fluidMax}px, ${state.fluidMin}px + 2vw);\n}`
  }, [state.fluidMin, state.fluidMax])

  // Preview style.
  const previewStyle = React.useMemo<React.CSSProperties>(() => {
    if (state.mode === 'standard') {
      return {
        width: state.previewSize,
        height: state.previewSize,
        backgroundColor: state.previewColor,
        borderRadius: `${state.tl}px ${state.tr}px ${state.br}px ${state.bl}px`,
      }
    }
    if (state.mode === 'fluid') {
      return {
        width: state.previewSize,
        height: state.previewSize,
        backgroundColor: state.previewColor,
        borderRadius: `min(${state.fluidMax}px, ${state.fluidMin}px + 2vw)`,
      }
    }
    // squircle — use SVG.
    return {}
  }, [state])

  return (
    <ToolLayout
      name="Border-radius & Squircle"
      tagline="Standard · squircle · fluid"
      icon={<Square className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* Preview */}
        <div className="space-y-4">
          <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-border bg-card p-8">
            {state.mode === 'squircle' ? (
              <svg
                width={state.previewSize}
                height={state.previewSize}
                viewBox={`0 0 ${state.squircleSize} ${state.squircleSize}`}
                style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.12))' }}
              >
                <path d={squircleSvgPath} fill={state.previewColor} />
              </svg>
            ) : (
              <div
                className="shadow-lg"
                style={{
                  ...previewStyle,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                }}
              />
            )}
          </div>

          {/* Mode selector */}
          <div className="flex gap-2">
            {(['standard', 'squircle', 'fluid'] as Mode[]).map((m) => (
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
          {state.mode === 'standard' && (
            <CopyCssCard code={standardCss} title="CSS" language="css" />
          )}
          {state.mode === 'squircle' && (
            <>
              <CopyCssCard code={squircleSvgPath} title="SVG path data" language="svg" />
              <CopyCssCard code={squircleCss} title="CSS with clip-path" language="css" />
            </>
          )}
          {state.mode === 'fluid' && <CopyCssCard code={fluidCss} title="CSS" language="css" />}
        </div>

        {/* Controls */}
        <div className="space-y-5">
          {state.mode === 'standard' && (
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <Label className="text-sm font-medium">Corner radii</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => update({ linked: !state.linked })}
                >
                  {state.linked ? (
                    <>
                      <Link2 className="h-3 w-3" /> Linked
                    </>
                  ) : (
                    <>
                      <Link2Off className="h-3 w-3" /> Independent
                    </>
                  )}
                </Button>
              </div>

              {state.linked ? (
                <SliderRow
                  label="All corners"
                  value={state.tl}
                  min={0}
                  max={150}
                  step={1}
                  display={`${state.tl}px`}
                  onChange={(v) => setCorner('tl', v)}
                />
              ) : (
                <div className="space-y-3">
                  <SliderRow
                    label="Top-left"
                    value={state.tl}
                    min={0}
                    max={150}
                    step={1}
                    display={`${state.tl}px`}
                    onChange={(v) => setCorner('tl', v)}
                  />
                  <SliderRow
                    label="Top-right"
                    value={state.tr}
                    min={0}
                    max={150}
                    step={1}
                    display={`${state.tr}px`}
                    onChange={(v) => setCorner('tr', v)}
                  />
                  <SliderRow
                    label="Bottom-right"
                    value={state.br}
                    min={0}
                    max={150}
                    step={1}
                    display={`${state.br}px`}
                    onChange={(v) => setCorner('br', v)}
                  />
                  <SliderRow
                    label="Bottom-left"
                    value={state.bl}
                    min={0}
                    max={150}
                    step={1}
                    display={`${state.bl}px`}
                    onChange={(v) => setCorner('bl', v)}
                  />
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-1.5">
                {[
                  { label: 'Sharp', v: 0 },
                  { label: 'Subtle', v: 4 },
                  { label: 'Soft', v: 8 },
                  { label: 'Rounded', v: 16 },
                  { label: 'Bold', v: 24 },
                  { label: 'Pill', v: 999 },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() =>
                      state.linked
                        ? update({ tl: p.v, tr: p.v, br: p.v, bl: p.v })
                        : update({ tl: p.v, tr: p.v, br: p.v, bl: p.v })
                    }
                    className="rounded border border-border px-2 py-0.5 text-[11px] hover:bg-muted"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {state.mode === 'squircle' && (
            <div className="rounded-lg border border-border bg-card p-5">
              <Label className="mb-3 block text-sm font-medium">Squircle parameters</Label>
              <SliderRow
                label="Size"
                value={state.squircleSize}
                min={80}
                max={400}
                step={4}
                display={`${state.squircleSize}px`}
                onChange={(v) => update({ squircleSize: v })}
              />
              <div className="mt-3">
                <SliderRow
                  label="Curvature"
                  value={state.squircleCurve}
                  min={0}
                  max={1}
                  step={0.01}
                  display={state.squircleCurve.toFixed(2)}
                  onChange={(v) => update({ squircleCurve: v })}
                />
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>circle (n=2)</span>
                  <span>squircle (n=4)</span>
                  <span>rect (n=8)</span>
                </div>
              </div>
              <div className="mt-4 flex gap-1.5">
                {[
                  { label: 'Circle', v: 0 },
                  { label: 'Soft squircle', v: 0.33 },
                  { label: 'Classic squircle', v: 0.5 },
                  { label: 'Hard squircle', v: 0.75 },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => update({ squircleCurve: p.v })}
                    className="rounded border border-border px-2 py-0.5 text-[11px] hover:bg-muted"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {state.mode === 'fluid' && (
            <div className="rounded-lg border border-border bg-card p-5">
              <Label className="mb-3 block text-sm font-medium">Fluid range</Label>
              <SliderRow
                label="Min (mobile)"
                value={state.fluidMin}
                min={0}
                max={32}
                step={1}
                display={`${state.fluidMin}px`}
                onChange={(v) => update({ fluidMin: v })}
              />
              <div className="mt-3">
                <SliderRow
                  label="Max (desktop)"
                  value={state.fluidMax}
                  min={8}
                  max={80}
                  step={1}
                  display={`${state.fluidMax}px`}
                  onChange={(v) => update({ fluidMax: v })}
                />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Uses <code className="rounded bg-muted px-1 font-mono">min(max, min + 2vw)</code> so
                the radius scales smoothly between viewport sizes without media queries.
              </p>
            </div>
          )}

          {/* Common: preview size + color */}
          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-3 block text-sm font-medium">Preview</Label>
            <SliderRow
              label="Size"
              value={state.previewSize}
              min={80}
              max={400}
              step={4}
              display={`${state.previewSize}px`}
              onChange={(v) => update({ previewSize: v })}
            />
            <div className="mt-3 flex items-center gap-3">
              <Label className="text-xs text-muted-foreground">Color</Label>
              <input
                type="color"
                value={state.previewColor}
                onChange={(e) => update({ previewColor: e.target.value })}
                className="h-8 w-9 cursor-pointer rounded border border-border bg-transparent"
              />
              <Input
                value={state.previewColor}
                onChange={(e) => update({ previewColor: e.target.value })}
                className="h-8 flex-1 font-mono text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}

/* ============================================================
 *  Slider row helper
 * ========================================================== */

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (v: number) => void
}

function SliderRow({ label, value, min, max, step, display, onChange }: SliderRowProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-mono text-xs tabular-nums">{display}</span>
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
