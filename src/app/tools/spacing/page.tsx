'use client'

/**
 * Spacing Scale Generator tool.
 *
 * Most spacing systems die because the gaps between adjacent steps are
 * either indistinguishable (8 vs 10) or a cliff (8 vs 32). This tool
 * generates the whole ladder from two decisions — a base unit and a
 * progression (linear multiples or a modular ratio, the same five ratios
 * the typography tool uses) — then draws every step at its actual size,
 * so you can see whether neighbours read as different before you commit.
 * Steps get t-shirt names centered so "md" is always 1× base, and export
 * as CSS variables, Tailwind spacing config, or JSON, in px or rem.
 */

import * as React from 'react'
import { StretchHorizontal } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { SliderField } from '@/components/control-field'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'hoverlab:tool:spacing'

// Same ratio presets as the typography tool, so a designer using both
// tools can build type and spacing on one ratio.
const SCALE_RATIOS = [
  { id: '1.2', label: '1.2 — Minor Third', value: 1.2 },
  { id: '1.25', label: '1.25 — Major Third', value: 1.25 },
  { id: '1.333', label: '1.333 — Perfect Fourth', value: 1.333 },
  { id: '1.5', label: '1.5 — Perfect Fifth', value: 1.5 },
  { id: '1.618', label: '1.618 — Golden Ratio', value: 1.618 },
]

type Mode = 'linear' | 'modular'
type OutputUnit = 'px' | 'rem'

interface SpacingState {
  base: number // px
  mode: Mode
  ratio: number
  steps: number
  unit: OutputUnit
}

const DEFAULT_STATE: SpacingState = {
  base: 4,
  mode: 'linear',
  ratio: 1.5,
  steps: 8,
  unit: 'rem',
}

// rem is computed at the browser default root, not the tool's base.
const REM_ROOT = 16

/** T-shirt name for a step at `offset` from the 1× base step. */
function stepName(offset: number): string {
  if (offset === 0) return 'md'
  if (offset === 1) return 'lg'
  if (offset === -1) return 'sm'
  if (offset === 2) return 'xl'
  if (offset === -2) return 'xs'
  return offset > 0 ? `${offset - 1}xl` : `${-offset - 1}xs`
}

function fmtPx(n: number): string {
  return String(Math.round(n * 100) / 100)
}

function fmtRem(n: number): string {
  return (n / REM_ROOT).toFixed(4).replace(/\.?0+$/, '')
}

interface Step {
  name: string
  px: number
}

export default function SpacingToolPage() {
  const [state, setState] = React.useState<SpacingState>(DEFAULT_STATE)

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

  const scale = React.useMemo<Step[]>(() => {
    const out: Step[] = []
    if (state.mode === 'linear') {
      // Multiples of base: 0.5×, then 1×, 2×, 3×… The 1× step is index 1.
      for (let i = 0; i < state.steps; i++) {
        const mult = i === 0 ? 0.5 : i
        out.push({ name: stepName(i - 1), px: state.base * mult })
      }
    } else {
      // base × ratio^n with n centered on 0 so md sits mid-ladder.
      const below = Math.floor((state.steps - 1) / 2)
      for (let n = -below; n < state.steps - below; n++) {
        out.push({ name: stepName(n), px: state.base * Math.pow(state.ratio, n) })
      }
    }
    return out
  }, [state.base, state.mode, state.ratio, state.steps])

  const value = React.useCallback(
    (px: number) => (state.unit === 'px' ? `${fmtPx(px)}px` : `${fmtRem(px)}rem`),
    [state.unit],
  )

  const cssOutput = React.useMemo(() => {
    const lines = scale
      .map((s) => `  --space-${s.name}: ${value(s.px)}; /* ${fmtPx(s.px)}px */`)
      .join('\n')
    return `:root {\n${lines}\n}`
  }, [scale, value])

  const tailwindOutput = React.useMemo(() => {
    const entries = scale
      .map((s) => `          '${s.name}': '${value(s.px)}',`)
      .join('\n')
    return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      spacing: {\n${entries}\n      }\n    }\n  }\n}`
  }, [scale, value])

  const jsonOutput = React.useMemo(() => {
    return JSON.stringify(
      Object.fromEntries(scale.map((s) => [s.name, value(s.px)])),
      null,
      2,
    )
  }, [scale, value])

  const maxPx = scale[scale.length - 1]?.px ?? 1

  return (
    <ToolLayout
      name="Spacing Scale Generator"
      tagline="Linear or modular spacing tokens in px or rem"
      icon={<StretchHorizontal className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        {/* Controls */}
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-3 block text-sm font-medium">Scale</Label>
            <SliderField
              label="Base unit"
              description="The 1× step every other step is derived from. 4px and 8px are the common grid bases; md always equals this value."
              value={state.base}
              min={2}
              max={16}
              step={1}
              display={`${state.base}px`}
              onChange={(v) => setState((s) => ({ ...s, base: v }))}
            />
            <div className="mt-4">
              <SliderField
                label="Steps"
                description="How many stops the ladder has. Fewer steps force clearer decisions; more steps risk neighbours that are visually identical."
                value={state.steps}
                min={4}
                max={12}
                step={1}
                display={String(state.steps)}
                onChange={(v) => setState((s) => ({ ...s, steps: v }))}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-2 block text-sm font-medium">Progression</Label>
            <div className="grid grid-cols-2 gap-1">
              {(['linear', 'modular'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setState((s) => ({ ...s, mode: m }))}
                  className={cn(
                    'rounded-md border px-2.5 py-1.5 text-xs capitalize transition-colors',
                    state.mode === m
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted',
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {state.mode === 'linear'
                ? 'Multiples of the base: 0.5×, 1×, 2×, 3×… Even gaps that map cleanly onto a pixel grid.'
                : 'Base × ratio per step. Gaps grow with size, so large sections breathe without inflating small gaps.'}
            </p>
            {state.mode === 'modular' && (
              <div className="mt-3">
                <Label className="mb-2 block text-xs text-muted-foreground">Ratio</Label>
                <div className="grid grid-cols-1 gap-1">
                  {SCALE_RATIOS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setState((s) => ({ ...s, ratio: r.value }))}
                      className={cn(
                        'rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors',
                        state.ratio === r.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-muted',
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-2 block text-sm font-medium">Output unit</Label>
            <div className="grid grid-cols-2 gap-1">
              {(['px', 'rem'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setState((s) => ({ ...s, unit: u }))}
                  className={cn(
                    'rounded-md border px-2.5 py-1.5 text-xs transition-colors',
                    state.unit === u
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted',
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              rem is computed at the {REM_ROOT}px browser default, so tokens
              scale with the user&apos;s font-size preference.
            </p>
          </div>
        </div>

        {/* Preview + output */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="border-b border-border/60 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
              Spacing scale (
              {state.mode === 'linear'
                ? `linear, ${state.base}px base`
                : `${state.ratio}× ratio, ${state.base}px base`}
              )
            </div>
            <div className="space-y-2 overflow-x-auto p-5">
              {scale.map((s) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="w-9 shrink-0 font-mono text-[10px] uppercase text-muted-foreground">
                    {s.name}
                  </span>
                  {/* Bar width is the real value — the point of the preview
                      is judging whether adjacent steps are distinguishable. */}
                  <div
                    className={cn(
                      'h-4 shrink-0 rounded-sm bg-gradient-to-r from-primary to-emerald-600',
                      s.name === 'md' && 'ring-2 ring-primary/40 ring-offset-1 ring-offset-background',
                    )}
                    style={{ width: `${s.px}px` }}
                  />
                  <span className="whitespace-nowrap font-mono text-[11px] tabular-nums text-muted-foreground">
                    {fmtPx(s.px)}px
                    <span className="opacity-60"> · {fmtRem(s.px)}rem</span>
                  </span>
                </div>
              ))}
              {maxPx > 480 && (
                <p className="pt-1 text-[11px] text-muted-foreground">
                  Large steps extend past the card — scroll the row to see them
                  at full size.
                </p>
              )}
            </div>
          </div>

          <CopyCssCard code={cssOutput} title="CSS variables" language="css" />
          <CopyCssCard code={tailwindOutput} title="Tailwind config" language="js" />
          <CopyCssCard code={jsonOutput} title="JSON" language="json" />
        </div>
      </div>
    </ToolLayout>
  )
}
