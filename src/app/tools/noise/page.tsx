'use client'

/**
 * Noise Texture Generator.
 *
 * Grain overlays usually arrive as a 50KB PNG exported from Photoshop and
 * copied between projects forever. The browser already ships the generator:
 * SVG's `<feTurbulence>` is Perlin noise as a primitive, so a complete grain
 * texture fits in a data URI a few hundred bytes long — no request, no asset
 * to version, works offline. Same zero-request approach as the placeholders
 * tool.
 *
 * The part a raw texture cannot show you is compositing: grain only reads as
 * film grain once it is blended over a real surface, and `overlay` on a
 * gradient looks nothing like `multiply` on a white card. So the preview
 * layers the noise over both, with the blend mode as a first-class control.
 */

import * as React from 'react'
import { Film } from 'lucide-react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SliderField, ToggleField } from '@/components/control-field'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { ToolWorkbench } from '@/components/designer-tools/tool-workbench'
import { useToolState } from '@/hooks/use-tool-state'

const TOOL = '/tools/noise'

type NoiseType = 'fractalNoise' | 'turbulence'
type BlendMode = 'overlay' | 'soft-light' | 'multiply' | 'screen' | 'normal'

const BLEND_MODES: BlendMode[] = ['overlay', 'soft-light', 'multiply', 'screen', 'normal']

interface NoiseState {
  type: NoiseType
  /** Slider position 0–100, mapped to baseFrequency logarithmically. */
  freqT: number
  octaves: number
  opacity: number // %
  monochrome: boolean
  tile: number // px
  blend: BlendMode
}

const DEFAULT_STATE: NoiseState = {
  type: 'fractalNoise',
  freqT: 65,
  octaves: 3,
  opacity: 40,
  monochrome: true,
  tile: 128,
  blend: 'soft-light',
}

/**
 * Perceived grain size scales multiplicatively with frequency — 0.1 → 0.2
 * is a bigger visual jump than 1.9 → 2.0 — so the slider walks a log curve
 * from 0.1 to 2 instead of a linear one.
 */
function freqOf(t: number): number {
  return Math.round(0.1 * Math.pow(20, t / 100) * 1000) / 1000
}

function buildNoiseSvg(s: NoiseState): string {
  const freq = freqOf(s.freqT)
  // stitchTiles makes the edges wrap, so the texture tiles seamlessly at
  // exactly the tile size. A fixed seed keeps the output stable across
  // copies of the same settings.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s.tile}" height="${s.tile}" viewBox="0 0 ${s.tile} ${s.tile}">
  <filter id="n" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="${s.type}" baseFrequency="${freq}" numOctaves="${s.octaves}" stitchTiles="stitch" seed="7"/>${
      s.monochrome ? '\n    <feColorMatrix type="saturate" values="0"/>' : ''
    }
  </filter>
  <rect width="100%" height="100%" filter="url(#n)" opacity="${(s.opacity / 100).toFixed(2)}"/>
</svg>`
}

// encodeURIComponent covers everything a data URI in a CSS url() can trip
// on — quotes, #, %, angle brackets. Attribute-only markup, so collapsing
// whitespace first is safe and keeps the URI shorter.
const toDataUri = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\s+/g, ' '))}`

export default function NoiseToolPage() {
  // Working state stays local and ungated; named presets need an account.
  // See `use-tool-state.ts` for why the two layers are separate.
  const tool = useToolState<NoiseState>(TOOL, DEFAULT_STATE)
  const { state, setState } = tool

  const update = (patch: Partial<NoiseState>) => setState((s) => ({ ...s, ...patch }))

  const svg = buildNoiseSvg(state)
  const uri = toDataUri(svg)

  const overlayStyle: React.CSSProperties = {
    backgroundImage: `url("${uri}")`,
    backgroundSize: `${state.tile}px ${state.tile}px`,
    mixBlendMode: state.blend,
  }

  const cssBlock = `/* Film grain overlay. Give the parent position: relative;
   the ::after covers it without eating clicks. */
.grain {
  position: relative;
}

.grain::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: url("${uri}");
  background-size: ${state.tile}px ${state.tile}px;
  mix-blend-mode: ${state.blend};
}`

  return (
    <ToolLayout
      name="Noise Texture Generator"
      tagline="Film grain as an SVG data URI — one CSS rule, zero requests"
      icon={<Film className="h-5 w-5" />}
    >
      <ToolWorkbench controlsWidth="360px">
        {/* Preview: the same noise composited over the two surfaces it will
            actually land on. */}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative min-h-[260px] overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary via-violet-500 to-emerald-500">
              <div className="absolute inset-0" style={overlayStyle} aria-hidden="true" />
              <div className="relative z-10 flex h-full min-h-[260px] flex-col justify-end p-5">
                <div className="text-sm font-semibold text-white">Over a gradient</div>
                <div className="text-xs text-white/80">mix-blend-mode: {state.blend}</div>
              </div>
            </div>
            <div className="relative min-h-[260px] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="absolute inset-0" style={overlayStyle} aria-hidden="true" />
              <div className="relative z-10 flex h-full min-h-[260px] flex-col justify-end p-5">
                <div className="text-sm font-semibold">Over a card surface</div>
                <div className="text-xs text-muted-foreground">
                  {freqOf(state.freqT)} / {state.octaves} octave{state.octaves === 1 ? '' : 's'}
                </div>
              </div>
            </div>
          </div>

          <CopyCssCard code={cssBlock} title="CSS" language="css" />
          <CopyCssCard code={svg} title="Raw SVG tile" language="svg" />

          {/* No `brand`: grain is monochrome by construction. */}
          <UseInCatalog tool={TOOL} />
        </div>

        {/* Controls */}
        <div className="space-y-5">
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Noise</Label>

            <div className="space-y-1.5">
              <Label htmlFor="noise-type" className="text-xs font-semibold">
                Type
              </Label>
              <Select
                value={state.type}
                onValueChange={(v) => update({ type: v as NoiseType })}
              >
                <SelectTrigger id="noise-type" aria-label="Noise type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fractalNoise">fractalNoise — smooth grain</SelectItem>
                  <SelectItem value="turbulence">turbulence — veined, marbled</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] leading-snug text-muted-foreground">
                fractalNoise is the film-grain one. turbulence folds the noise
                back on itself and reads as marble or water.
              </p>
            </div>

            <SliderField
              label="Base frequency"
              description="Grain size, inverted: low values are big soft blotches, high values are fine sand. The slider is logarithmic because that is how the change is perceived."
              value={state.freqT}
              min={0}
              max={100}
              step={1}
              display={String(freqOf(state.freqT))}
              onChange={(v) => update({ freqT: v })}
            />
            <SliderField
              label="Octaves"
              description="Layers of detail stacked at doubling frequencies. One is flat static; more adds structure, with diminishing returns past four."
              value={state.octaves}
              min={1}
              max={6}
              step={1}
              display={String(state.octaves)}
              onChange={(v) => update({ octaves: v })}
            />
            <SliderField
              label="Opacity"
              description="Baked into the SVG itself, so the one background-image rule is the whole effect. Grain wants to be felt, not seen — most surfaces sit under 50%."
              value={state.opacity}
              min={0}
              max={100}
              step={1}
              display={`${state.opacity}%`}
              onChange={(v) => update({ opacity: v })}
            />
            <ToggleField
              label="Monochrome"
              description="Desaturates the noise so it acts as pure luminance grain. Off, feTurbulence emits RGB static — colourful confetti rather than film."
              checked={state.monochrome}
              onChange={(v) => update({ monochrome: v })}
            />
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Compositing</Label>

            <div className="space-y-1.5">
              <Label htmlFor="noise-blend" className="text-xs font-semibold">
                Blend mode
              </Label>
              <Select
                value={state.blend}
                onValueChange={(v) => update({ blend: v as BlendMode })}
              >
                <SelectTrigger id="noise-blend" aria-label="Blend mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLEND_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] leading-snug text-muted-foreground">
                How the grain meets the surface underneath. soft-light and
                overlay keep the surface colour; multiply darkens, screen
                lightens, normal just paints on top.
              </p>
            </div>

            <SliderField
              label="Tile size"
              description="Edge length of the repeating tile. stitchTiles makes the seams invisible, so smaller tiles mean a shorter data URI at no visual cost — go bigger only if you can spot the repeat."
              value={state.tile}
              min={64}
              max={512}
              step={32}
              display={`${state.tile}px`}
              onChange={(v) => update({ tile: v })}
            />
          </div>

          {/* After the controls, never before them — the ask lands once the
              grain exists rather than in front of it. */}
          <ToolPresetsBar tool={tool} noun="grain" />
        </div>
      </ToolWorkbench>
    </ToolLayout>
  )
}
