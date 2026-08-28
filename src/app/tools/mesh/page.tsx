'use client'

/**
 * Mesh Gradient Generator.
 *
 * `/tools/gradient` does linear and radial — two stops on an axis. What it
 * cannot do is the soft multi-colour wash that every modern hero uses, and
 * the reason is that CSS has no mesh gradient primitive. There is no
 * property to reach for, which is why almost every one of these on the web
 * is a PNG: someone made it in Figma, exported it at 2x, and now the hero
 * carries 400KB of image and cannot be recoloured without going back.
 *
 * It does not need to be. Stacking several `radial-gradient()`s that fade
 * to `transparent` over a base colour is a mesh gradient in everything but
 * name — pure CSS, a few hundred bytes, recolourable by editing a hex, and
 * it scales to any size because there are no pixels involved.
 *
 * The one real trap is the fade. `transparent` is `rgba(0,0,0,0)` — black
 * with no alpha — so in the sRGB interpolation browsers used for years, a
 * colour fading to `transparent` passes through grey on the way out and
 * every blob gets a dirty halo. Fading to the same colour at zero alpha
 * instead keeps the hue all the way down, which is what this emits.
 */

import * as React from 'react'
import { Blend, Plus, Shuffle, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SliderField, ToggleField } from '@/components/control-field'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { ToolWorkbench } from '@/components/designer-tools/tool-workbench'
import { useToolState } from '@/hooks/use-tool-state'
import { cn } from '@/lib/utils'

const TOOL = '/tools/mesh'

interface Blob {
  id: number
  /** Position as a percentage of the box — resolution-independent. */
  x: number
  y: number
  /** Radius as a percentage of the box's width. */
  size: number
  color: string
  /** Peak alpha at the centre, before the fade to nothing. */
  alpha: number
}

interface MeshState {
  base: string
  blobs: Blob[]
  selected: number
  /** Radial blobs can be circles or ellipses; ellipses read as more organic. */
  ellipse: boolean
  /** Emit the sRGB-safe fade rather than `transparent`. */
  safeFade: boolean
  grain: boolean
  height: number
}

const PALETTE = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6']

const DEFAULT_STATE: MeshState = {
  base: '#0b1120',
  blobs: [
    { id: 1, x: 15, y: 20, size: 62, color: '#6366f1', alpha: 70 },
    { id: 2, x: 82, y: 18, size: 55, color: '#ec4899', alpha: 60 },
    { id: 3, x: 60, y: 88, size: 70, color: '#06b6d4', alpha: 55 },
  ],
  selected: 1,
  ellipse: true,
  safeFade: true,
  grain: false,
  height: 380,
}

/** `#rrggbb` → `r, g, b`, so the fade can name the same colour at zero alpha. */
function rgbOf(hex: string): string {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6)
  const int = Number.parseInt(full, 16)
  if (Number.isNaN(int)) return '0, 0, 0'
  return `${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}`
}

function blobCss(blob: Blob, ellipse: boolean, safeFade: boolean): string {
  const rgb = rgbOf(blob.color)
  const from = `rgba(${rgb}, ${(blob.alpha / 100).toFixed(2)})`
  // The whole point: fade to the same hue at zero alpha, not to `transparent`,
  // which is transparent *black* and drags every blob through grey.
  const to = safeFade ? `rgba(${rgb}, 0)` : 'transparent'
  const shape = ellipse ? `${blob.size}% ${Math.round(blob.size * 0.8)}%` : `${blob.size}%`
  return `radial-gradient(${ellipse ? 'ellipse' : 'circle'} ${shape} at ${blob.x}% ${blob.y}%, ${from} 0%, ${to} 100%)`
}

/**
 * A grain overlay, inline, so the whole mesh is still one `background`.
 *
 * Deliberately tiny and fixed: this is the finishing touch that stops a
 * large smooth gradient from banding on an 8-bit display, not a texture
 * tool. `/tools/noise` is the texture tool, and the rail at the foot of
 * this page points at it.
 */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\")"

export default function MeshToolPage() {
  const tool = useToolState<MeshState>(TOOL, DEFAULT_STATE)
  const { state, setState } = tool

  const update = (patch: Partial<MeshState>) => setState((s) => ({ ...s, ...patch }))

  const selected = state.blobs.find((b) => b.id === state.selected) ?? state.blobs[0]

  function patchBlob(id: number, next: Partial<Blob>) {
    update({ blobs: state.blobs.map((b) => (b.id === id ? { ...b, ...next } : b)) })
  }

  /*
    Layer order matters: the first gradient in the list paints on top, and
    the base colour has to be last or it covers everything. That is the
    reverse of how the blobs are listed in the editor, which reads
    bottom-up like a stack of paint.
  */
  const layers = state.blobs.map((b) => blobCss(b, state.ellipse, state.safeFade))
  const backgroundImage = [state.grain ? GRAIN : null, ...layers].filter(Boolean).join(',\n    ')

  const cssBlock = `.mesh {
  background-color: ${state.base};
  background-image:
    ${backgroundImage};
}`

  const previewStyle: React.CSSProperties = {
    backgroundColor: state.base,
    backgroundImage: [state.grain ? GRAIN : null, ...layers].filter(Boolean).join(', '),
    height: state.height,
  }

  /** New blobs land somewhere plausible rather than always dead centre. */
  function addBlob() {
    const id = Math.max(0, ...state.blobs.map((b) => b.id)) + 1
    const spot = state.blobs.length
    update({
      blobs: [
        ...state.blobs,
        {
          id,
          x: [50, 20, 80, 35, 65, 50][spot % 6],
          y: [50, 75, 60, 25, 85, 15][spot % 6],
          size: 55,
          color: PALETTE[spot % PALETTE.length],
          alpha: 60,
        },
      ],
      selected: id,
    })
  }

  /*
    Shuffle moves the blobs, not the colours.

    A randomiser that also rerolls the palette gives you a new gradient
    every time and never the one you were converging on. Keeping the hues
    and moving the positions is the difference between exploring a
    composition and starting over.
  */
  function shuffle() {
    update({
      blobs: state.blobs.map((b, i) => ({
        ...b,
        // Deterministic per index and blob count, so the same press on the
        // same arrangement is repeatable within a session.
        x: Math.round(15 + ((i * 47 + state.blobs.length * 23) % 70)),
        y: Math.round(12 + ((i * 71 + state.blobs.length * 37) % 76)),
        size: 45 + ((i * 17) % 35),
      })),
    })
  }

  return (
    <ToolLayout
      name="Mesh Gradient Generator"
      tagline="The soft multi-colour wash every hero uses — as stacked CSS radial gradients rather than a 400KB PNG"
      icon={<Blend className="h-5 w-5" />}
    >
      <ToolWorkbench controlsWidth="380px">
        <div className="space-y-4">
          {/* The canvas. Handles sit on the blobs so position is direct
              rather than two sliders you have to translate in your head. */}
          <div className="relative overflow-hidden rounded-xl border border-border shadow-sm">
            <div style={previewStyle} className="relative">
              {state.blobs.map((blob, i) => (
                <button
                  key={blob.id}
                  type="button"
                  onClick={() => update({ selected: blob.id })}
                  aria-pressed={blob.id === state.selected}
                  aria-label={`Blob ${i + 1} at ${blob.x} percent across, ${blob.y} percent down`}
                  style={{ left: `${blob.x}%`, top: `${blob.y}%`, background: blob.color }}
                  className={cn(
                    'absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-lg transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                    blob.id === state.selected
                      ? 'scale-125 border-white'
                      : 'border-white/60 hover:scale-110',
                  )}
                />
              ))}
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Click a handle to select that blob; move it with the position sliders.
            Everything here is percentages, so the same CSS fills a 320px card and a
            2560px hero identically.
          </p>

          <CopyCssCard code={cssBlock} title="CSS" language="css" />

          {/* A mesh has a dominant hue, so the catalog exit is offered with
              one — unlike the layout tools, which have no colour to hand it. */}
          <UseInCatalog tool={TOOL} />
        </div>

        {/* Controls */}
        <div className="space-y-5">
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <Label className="block text-sm font-medium">Blobs</Label>
              <span className="text-[11px] text-muted-foreground">{state.blobs.length}</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {state.blobs.map((blob, i) => (
                <button
                  key={blob.id}
                  type="button"
                  onClick={() => update({ selected: blob.id })}
                  aria-pressed={blob.id === state.selected}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    blob.id === state.selected
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/50',
                  )}
                >
                  <span
                    aria-hidden
                    className="h-3 w-3 rounded-full border border-border/60"
                    style={{ background: blob.color }}
                  />
                  {i + 1}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                // Six blobs is roughly where each new one stops being
                // distinguishable and starts just raising the average
                // lightness of the whole wash.
                disabled={state.blobs.length >= 6}
                onClick={addBlob}
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={shuffle}
              >
                <Shuffle className="h-3.5 w-3.5" /> Shuffle
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground"
                disabled={state.blobs.length <= 2 || !selected}
                aria-label="Remove selected blob"
                onClick={() => {
                  if (!selected) return
                  const rest = state.blobs.filter((b) => b.id !== selected.id)
                  update({ blobs: rest, selected: rest[0]?.id ?? 1 })
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {selected ? (
            <div className="space-y-4 rounded-lg border border-border bg-card p-5">
              <Label className="block text-sm font-medium">
                Blob {state.blobs.findIndex((b) => b.id === selected.id) + 1}
              </Label>

              <div className="flex gap-2">
                <input
                  type="color"
                  aria-label="Blob colour"
                  value={selected.color}
                  onChange={(e) => patchBlob(selected.id, { color: e.target.value })}
                  className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-border bg-background p-1"
                />
                <div className="flex min-w-0 flex-1 flex-wrap gap-1">
                  {PALETTE.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      aria-label={`Use ${hex}`}
                      onClick={() => patchBlob(selected.id, { color: hex })}
                      style={{ background: hex }}
                      className="h-9 w-6 rounded border border-border/60 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  ))}
                </div>
              </div>

              <SliderField
                label="Across"
                description="Horizontal centre, as a percentage of the box. Blobs anchored past the edge — under 0 or over 100 — give you a partial wash bleeding in, which usually looks better than a full circle sitting in frame."
                value={selected.x}
                min={-20}
                max={120}
                step={1}
                display={`${selected.x}%`}
                onChange={(v) => patchBlob(selected.id, { x: v })}
              />
              <SliderField
                label="Down"
                description="Vertical centre. Same trick: the most convincing meshes have most of their blobs half outside the frame."
                value={selected.y}
                min={-20}
                max={120}
                step={1}
                display={`${selected.y}%`}
                onChange={(v) => patchBlob(selected.id, { y: v })}
              />
              <SliderField
                label="Size"
                description="Radius as a percentage of the box's width. Overlapping blobs are the point — where two meet is where the third colour you did not choose appears."
                value={selected.size}
                min={10}
                max={120}
                step={1}
                display={`${selected.size}%`}
                onChange={(v) => patchBlob(selected.id, { size: v })}
              />
              <SliderField
                label="Strength"
                description="Alpha at the centre, before the fade out. Below about 40% the blob stops competing with the base colour and starts tinting it, which is usually the more expensive-looking result."
                value={selected.alpha}
                min={5}
                max={100}
                step={1}
                display={`${selected.alpha}%`}
                onChange={(v) => patchBlob(selected.id, { alpha: v })}
              />
            </div>
          ) : null}

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">The wash</Label>

            <div className="space-y-1.5">
              <Label htmlFor="mesh-base" className="text-xs font-semibold">
                Base colour
              </Label>
              <div className="flex gap-2">
                <input
                  id="mesh-base"
                  type="color"
                  value={state.base}
                  onChange={(e) => update({ base: e.target.value })}
                  className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-border bg-background p-1"
                />
                <input
                  type="text"
                  aria-label="Base colour hex"
                  value={state.base}
                  onChange={(e) => update({ base: e.target.value })}
                  className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 font-mono text-xs uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <p className="text-[11px] leading-snug text-muted-foreground">
                What the blobs fade into. A dark base with bright blobs is the look
                everyone is copying; a light base needs the blob strengths halved or
                it turns to mud.
              </p>
            </div>

            <ToggleField
              label="Elliptical blobs"
              description="Squashes each radial to 4:5 rather than a true circle. Perfect circles read as spotlights; ellipses read as light."
              checked={state.ellipse}
              onChange={(v) => update({ ellipse: v })}
            />
            <ToggleField
              label="Fade without the grey halo"
              description="Emits rgba(r, g, b, 0) instead of `transparent`. They sound identical and are not: `transparent` is transparent BLACK, so a colour fading to it travels through grey and every blob gets a dirty ring. Turn this off and watch the edges."
              checked={state.safeFade}
              onChange={(v) => update({ safeFade: v })}
            />
            <ToggleField
              label="Add grain"
              description="An inline noise layer over the top. Large smooth gradients band visibly on 8-bit displays, and a little grain is the standard cure. For a real texture with controls, use the noise tool."
              checked={state.grain}
              onChange={(v) => update({ grain: v })}
            />
            <SliderField
              label="Preview height"
              description="Preview only. Meshes read completely differently at hero height and at card height — the blobs that looked balanced at 380px often crowd at 160px."
              value={state.height}
              min={120}
              max={600}
              step={10}
              display={`${state.height}px`}
              onChange={(v) => update({ height: v })}
            />
          </div>

          <ToolPresetsBar tool={tool} noun="mesh" />
        </div>
      </ToolWorkbench>
    </ToolLayout>
  )
}
