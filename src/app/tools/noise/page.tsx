'use client'

/**
 * Noise & Texture Lab.
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
 *
 * The second mode is Texture Lab, which inverts the relationship: instead
 * of generating a texture from nothing, it takes an image of yours and
 * reduces it to one — dithered, halftoned or as ASCII. Same page because
 * it is the same job ("I need a texture") approached from the other end,
 * and because the grain mode is where someone arrives from a search and
 * the image mode is what they did not know they could also have.
 *
 * The image is decoded and processed in the tab. Nothing is uploaded; see
 * `components/designer-tools/texture-lab.tsx`.
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
import { DownloadBar, type DownloadAction } from '@/components/designer-tools/download-bar'
import { downloadBlob, downloadText, svgToPngBlob } from '@/lib/download'
import { arbitrary, classes } from '@/lib/tailwind-arbitrary'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { ToolWorkbench } from '@/components/designer-tools/tool-workbench'
import { useToolState } from '@/hooks/use-tool-state'
import {
  DEFAULT_TEXTURE,
  TextureLab,
  TextureLabControls,
  sanitizeTexture,
  type TextureSettings,
} from '@/components/designer-tools/texture-lab'
import { cn } from '@/lib/utils'

const TOOL = '/tools/noise'

type NoiseType = 'fractalNoise' | 'turbulence'
type BlendMode = 'overlay' | 'soft-light' | 'multiply' | 'screen' | 'normal'

const BLEND_MODES: BlendMode[] = ['overlay', 'soft-light', 'multiply', 'screen', 'normal']

type NoiseMode = 'grain' | 'image'

/** The modes, in switcher order. Also the share-link allow-list. */
const MODES: NoiseMode[] = ['grain', 'image']

const MODE_LABEL: Record<NoiseMode, string> = {
  grain: 'Grain generator',
  image: 'Texture Lab',
}

interface NoiseState {
  mode: NoiseMode
  /** Texture Lab's settings. The image itself is never persisted — see its docblock. */
  texture: TextureSettings
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
  mode: 'grain',
  texture: DEFAULT_TEXTURE,
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

/**
 * The two things `useToolState`'s shape guard cannot check on a shared link.
 *
 * The guard is a type check: it knows `mode` is a string and that `texture`
 * is an object of the right shape, and it cannot know that `mode` is one of
 * two, or that `texture.process` names a process this file implements. Both
 * matter on render — an unrecognised mode matches no branch and draws an
 * empty page — and neither is a property the guard could ever derive,
 * because the valid values are data this module owns.
 */
function sanitizeShared(shared: NoiseState): NoiseState {
  return {
    ...shared,
    mode: MODES.includes(shared.mode) ? shared.mode : DEFAULT_STATE.mode,
    texture: sanitizeTexture({ ...DEFAULT_TEXTURE, ...shared.texture }),
  }
}

export default function NoiseToolPage() {
  // Working state stays local and ungated; named presets need an account.
  // See `use-tool-state.ts` for why the two layers are separate.
  const tool = useToolState<NoiseState>(TOOL, DEFAULT_STATE, { sanitizeShared })
  const { state, setState } = tool

  const update = (patch: Partial<NoiseState>) => setState((s) => ({ ...s, ...patch }))

  const updateTexture = React.useCallback(
    (patch: Partial<TextureSettings>) =>
      setState((s) => ({ ...s, texture: { ...s.texture, ...patch } })),
    [setState],
  )

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

  /*
    The same grain as Tailwind classes.

    This one is on an `after:` variant rather than on the element, because
    the grain is an overlay: it has to sit above the element's own
    background without covering its content or eating clicks. That is what
    the CSS above spends a `::after` rule on, and Tailwind can say it in
    one line — but only if `content-['']` comes with it. A pseudo-element
    with no `content` does not render at all, which is the single most
    common way a copied `after:` class list does nothing.
  */
  const tailwindClass = classes(
    'relative',
    'after:absolute',
    "after:content-['']",
    'after:inset-0',
    'after:pointer-events-none',
    `after:${arbitrary('bg', `url("${uri}")`)}`,
    /*
      `length:` is required, not decorative. Tailwind infers what an
      arbitrary `bg-[…]` means from the value, and `16px 16px` looks like a
      background-POSITION — which is what it would compile to, tiling the
      grain at its natural size and putting it 16px in from the corner. The
      type hint is the difference between a texture and a smudge.
    */
    `after:${arbitrary('bg', `length:${state.tile}px ${state.tile}px`)}`,
    `after:mix-blend-${state.blend}`,
  )

  /*
    The tile as a file.

    Both formats earn their place. The SVG is the source — a few hundred
    bytes, resolution-independent, and re-editable — and is what belongs in
    a repo. The PNG is for the tools that cannot take an SVG filter at all,
    which is most of the design software someone might want to carry this
    grain into. Exported at the tile size so it still tiles seamlessly;
    scaling it afterwards is what breaks the seam.
  */
  const exports = React.useMemo<DownloadAction[]>(
    () => [
      {
        label: 'SVG',
        title: 'The source tile — small, sharp at any size, still editable',
        run: () => downloadText(svg, `noise-${state.tile}.svg`, 'image/svg+xml'),
      },
      {
        label: 'PNG',
        title: `${state.tile} x ${state.tile}, tiles seamlessly at that exact size`,
        run: async () => {
          const blob = await svgToPngBlob(svg, state.tile, state.tile)
          if (!blob) return false
          downloadBlob(blob, `noise-${state.tile}.png`)
        },
      },
    ],
    [svg, state.tile],
  )

  return (
    <ToolLayout
      name="Noise & Texture Lab"
      tagline="Generate film grain, or turn an image into a dither, halftone or ASCII"
      icon={<Film className="h-5 w-5" />}
    >
      <ToolWorkbench controlsWidth="360px">
        {/* Preview: the same noise composited over the two surfaces it will
            actually land on — or, in the other mode, your own image. */}
        <div className="space-y-4">
          {/*
            The switcher sits above the stage rather than in the controls
            column. It changes what the whole page is, not one parameter of
            it, and on a phone the controls column is below the fold — so
            a mode switch down there would be a thing most visitors never
            discover the tool has.
          */}
          <div className="flex items-center gap-2">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => update({ mode: m })}
                aria-pressed={state.mode === m}
                className={cn(
                  'flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                  state.mode === m
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background hover:bg-muted',
                )}
              >
                {MODE_LABEL[m]}
              </button>
            ))}
          </div>

          {state.mode === 'image' ? (
            <TextureLab settings={state.texture} onChange={updateTexture} />
          ) : (
          <>
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
          <CopyCssCard code={tailwindClass} title="Tailwind classes" language="html" />
          <CopyCssCard code={svg} title="Raw SVG tile" language="svg" />

          <DownloadBar actions={exports} />
          </>
          )}

          {/* No `brand`: both modes are monochrome by construction. */}
          <UseInCatalog tool={TOOL} />
        </div>

        {/* Controls */}
        <div className="space-y-5">
          {state.mode === 'image' ? (
            <TextureLabControls settings={state.texture} onChange={updateTexture} />
          ) : (
          <>
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
          </>
          )}

          {/* After the controls, never before them — the ask lands once the
              texture exists rather than in front of it. Shared by both
              modes: a preset carries the whole state, so one saved in
              Texture Lab reopens in Texture Lab. */}
          <ToolPresetsBar tool={tool} noun={state.mode === 'image' ? 'texture' : 'grain'} />
        </div>
      </ToolWorkbench>
    </ToolLayout>
  )
}
