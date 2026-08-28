'use client'

/**
 * Colour Blindness Simulator.
 *
 * The companion to `/tools/contrast`, and the half it cannot answer.
 * Contrast is a luminance question: it tells you whether text can be read
 * against its background, and a palette can pass AAA on every pair while
 * still being unusable — because two of its colours are the same colour to
 * eight percent of men.
 *
 * That is the failure this catches, and the reason the output is a list of
 * *collisions* rather than a row of pretty recoloured swatches. A simulated
 * palette is interesting; "these two categories in your chart become the
 * same colour under deuteranopia" is actionable, and it is the thing nobody
 * discovers until a user writes in.
 *
 * On the model: this is the Machado, Oliveira & Fernandes (2009) linear
 * transform, applied in linear-light sRGB, which is what the well-known
 * simulators use. It is a good model and it is not an eye. Anomalous
 * trichromacy at partial severity is interpolated towards identity rather
 * than using the paper's per-severity matrices — close, not exact, and said
 * so on the page. Treat a pass here as "no obvious collision", never as a
 * substitute for shipping a second cue alongside colour.
 */

import * as React from 'react'
import { Eye, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SliderField, ToggleField } from '@/components/control-field'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { ToolWorkbench } from '@/components/designer-tools/tool-workbench'
import { useToolState } from '@/hooks/use-tool-state'
import { normalizeHex } from '@/lib/color-tools'
import {
  IDENTITY,
  SEVERE_THRESHOLD,
  VISIONS,
  atSeverity,
  findCollisions,
  simulateHex,
} from '@/lib/color-blindness'
import { cn } from '@/lib/utils'

const TOOL = '/tools/colorblind'

interface Swatch {
  id: number
  hex: string
  label: string
}

interface ColorblindState {
  swatches: Swatch[]
  severity: number
  showUi: boolean
}

const DEFAULT_STATE: ColorblindState = {
  swatches: [
    { id: 1, hex: '#22c55e', label: 'Success' },
    { id: 2, hex: '#ef4444', label: 'Error' },
    { id: 3, hex: '#f59e0b', label: 'Warning' },
    { id: 4, hex: '#3b82f6', label: 'Info' },
  ],
  severity: 100,
  showUi: true,
}

export default function ColorblindToolPage() {
  const tool = useToolState<ColorblindState>(TOOL, DEFAULT_STATE)
  const { state, setState } = tool

  const update = (patch: Partial<ColorblindState>) => setState((s) => ({ ...s, ...patch }))

  const severity = state.severity / 100

  /** Every vision × every swatch, plus the collisions in each. */
  const results = React.useMemo(
    () =>
      VISIONS.map((vision) => {
        const matrix =
          vision.id === 'normal' ? IDENTITY : atSeverity(vision.matrix, severity)
        const hexes = state.swatches.map((s) => simulateHex(s.hex, matrix))
        return { vision, hexes, collisions: findCollisions(state.swatches, hexes) }
      }),
    [state.swatches, severity],
  )

  const totalCollisions = results.reduce((n, r) => n + r.collisions.length, 0)

  const cssBlock = `:root {
${state.swatches
  .map(
    (s) =>
      `  --${s.label.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'colour'}: ${s.hex};`,
  )
  .join('\n')}
}`

  return (
    <ToolLayout
      name="Colour Blindness Simulator"
      tagline="Which pairs in your palette become the same colour — the failure a contrast checker cannot see"
      icon={<Eye className="h-5 w-5" />}
    >
      <ToolWorkbench controlsWidth="380px">
        <div className="space-y-4">
          {/* The verdict first. A wall of recoloured swatches is a picture;
              the count of collisions is the finding. */}
          <div
            className={cn(
              'rounded-xl border px-5 py-4',
              totalCollisions === 0
                ? 'border-emerald-500/40 bg-emerald-500/10'
                : 'border-amber-500/40 bg-amber-500/10',
            )}
          >
            <p className="text-sm font-semibold">
              {totalCollisions === 0
                ? 'No collisions found'
                : `${totalCollisions} collision${totalCollisions === 1 ? '' : 's'} across ${
                    results.filter((r) => r.collisions.length).length
                  } vision type${
                    results.filter((r) => r.collisions.length).length === 1 ? '' : 's'
                  }`}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {totalCollisions === 0
                ? 'Every pair in this palette stays distinguishable under each simulation at this severity. That is a good floor — it is not a substitute for a second cue. Colour should never be the only thing carrying a meaning.'
                : 'A collision means two of these colours land close enough together under that simulation that a person is unlikely to tell them apart in a legend or a status dot. Change one of the pair, or add a shape, an icon, or a label so colour is not the only signal.'}
            </p>
          </div>

          {/* Each vision, as a row of the palette. */}
          <div className="space-y-3">
            {results.map(({ vision, hexes, collisions }) => (
              <div
                key={vision.id}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border/60 px-4 py-2.5">
                  <span className="text-sm font-semibold">{vision.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {vision.prevalence}
                  </span>
                  {collisions.length ? (
                    <span className="ml-auto rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                      {collisions.length} collision{collisions.length === 1 ? '' : 's'}
                    </span>
                  ) : (
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                      clear
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
                  {state.swatches.map((swatch, i) => (
                    <div key={swatch.id} className="min-w-0">
                      <div
                        className="h-16 rounded-lg border border-border/60"
                        style={{ background: hexes[i] }}
                      />
                      <div className="mt-1.5 truncate text-[11px] font-medium">
                        {swatch.label}
                      </div>
                      <div className="font-mono text-[10px] uppercase text-muted-foreground">
                        {hexes[i]}
                      </div>
                    </div>
                  ))}
                </div>

                {collisions.length ? (
                  <ul className="space-y-1 border-t border-border/60 px-4 py-3">
                    {collisions.map(({ a, b, distance }) => (
                      <li key={`${a.id}-${b.id}`} className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {a.label} and {b.label}
                        </span>{' '}
                        {distance < SEVERE_THRESHOLD
                          ? 'are effectively the same colour here'
                          : 'are hard to tell apart here'}{' '}
                        <span className="font-mono text-[10px]">
                          (ΔE {distance.toFixed(3)})
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <p className="border-t border-border/60 bg-muted/20 px-4 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
                  {vision.what}
                </p>
              </div>
            ))}
          </div>

          {state.showUi ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-border/60 px-4 py-2.5 text-sm font-semibold">
                In context
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {results
                  .filter((r) => r.vision.id !== 'normal')
                  .slice(0, 3)
                  .map(({ vision, hexes }) => (
                    <div key={vision.id}>
                      <div className="mb-2 text-[11px] font-semibold text-muted-foreground">
                        {vision.name}
                      </div>
                      <ul className="space-y-1.5">
                        {state.swatches.map((swatch, i) => (
                          <li key={swatch.id} className="flex items-center gap-2 text-xs">
                            <span
                              aria-hidden
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ background: hexes[i] }}
                            />
                            <span className="truncate">{swatch.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
              <p className="border-t border-border/60 bg-muted/20 px-4 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
                Status dots at the size real interfaces use them. Large blocks
                flatter a palette — a 10px dot in a list is where two similar
                colours actually stop being two colours.
              </p>
            </div>
          ) : null}

          <CopyCssCard code={cssBlock} title="Palette as custom properties" language="css" />

          <UseInCatalog tool={TOOL} />
        </div>

        {/* Controls */}
        <div className="space-y-5">
          <div className="space-y-3 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <Label className="block text-sm font-medium">Palette</Label>
              <span className="text-[11px] text-muted-foreground">
                {state.swatches.length}
              </span>
            </div>

            <ul className="space-y-2">
              {state.swatches.map((swatch) => (
                <li key={swatch.id} className="flex items-center gap-1.5">
                  <input
                    type="color"
                    aria-label={`${swatch.label} colour`}
                    value={swatch.hex}
                    onChange={(e) =>
                      update({
                        swatches: state.swatches.map((s) =>
                          s.id === swatch.id ? { ...s, hex: e.target.value } : s,
                        ),
                      })
                    }
                    className="h-9 w-11 shrink-0 cursor-pointer rounded-md border border-border bg-background p-1"
                  />
                  <input
                    type="text"
                    aria-label={`${swatch.label} hex`}
                    value={swatch.hex}
                    onChange={(e) => {
                      // Typed hex is only committed once it parses, so the
                      // field stays editable mid-keystroke instead of
                      // snapping back to the last valid value.
                      const raw = e.target.value
                      const parsed = normalizeHex(raw)
                      update({
                        swatches: state.swatches.map((s) =>
                          s.id === swatch.id ? { ...s, hex: parsed ?? raw } : s,
                        ),
                      })
                    }}
                    className="h-9 w-20 shrink-0 rounded-md border border-border bg-background px-2 font-mono text-xs uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <input
                    type="text"
                    aria-label={`Label for ${swatch.hex}`}
                    value={swatch.label}
                    onChange={(e) =>
                      update({
                        swatches: state.swatches.map((s) =>
                          s.id === swatch.id ? { ...s, label: e.target.value } : s,
                        ),
                      })
                    }
                    className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground"
                    // Two colours is the smallest thing that can collide.
                    disabled={state.swatches.length <= 2}
                    aria-label={`Remove ${swatch.label}`}
                    onClick={() =>
                      update({ swatches: state.swatches.filter((s) => s.id !== swatch.id) })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              disabled={state.swatches.length >= 10}
              onClick={() => {
                const id = Math.max(0, ...state.swatches.map((s) => s.id)) + 1
                update({
                  swatches: [
                    ...state.swatches,
                    { id, hex: '#8b5cf6', label: `Series ${state.swatches.length + 1}` },
                  ],
                })
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Add colour
            </Button>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Simulation</Label>
            <SliderField
              label="Severity"
              description="100% is dichromacy — the cone is absent. Lower values approximate anomalous trichromacy, which is far more common than the complete forms and is where most real users sit. Worth checking at 60%: a palette can pass at full severity and fail in the middle."
              value={state.severity}
              min={10}
              max={100}
              step={5}
              display={`${state.severity}%`}
              onChange={(v) => update({ severity: v })}
            />
            <ToggleField
              label="Show status dots"
              description="Renders the palette at the size interfaces actually use it. Large swatches flatter a palette; a 10px dot in a list is the honest test."
              checked={state.showUi}
              onChange={(v) => update({ showUi: v })}
            />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              The transform is the Machado, Oliveira &amp; Fernandes (2009) model,
              applied in linear-light sRGB. Partial severity is interpolated
              towards identity rather than using the paper&rsquo;s per-severity
              matrices — close, not exact. It is a good guide and it is not an
              eye: treat a clear result as &ldquo;no obvious collision&rdquo;, and
              still carry meaning in something other than colour.
            </p>
          </div>

          <ToolPresetsBar tool={tool} noun="palette" />
        </div>
      </ToolWorkbench>
    </ToolLayout>
  )
}
