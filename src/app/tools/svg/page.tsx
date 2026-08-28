'use client'

/**
 * The SVG toolkit — four jobs that are usually four websites.
 *
 * Optimise, convert to JSX or a data URI, generate a pattern, generate a
 * wave. Nobody has put them together, so the actual workflow — take the file
 * the designer exported, shrink it, turn it into the component your codebase
 * takes — is three tabs in three different products, each with its own paste
 * box, and the thing you paste into the second one is the thing you copied
 * out of the first.
 *
 * Here the source is one piece of state. Optimise a file and switch to
 * Convert and it is already the optimised markup being converted — which is
 * the correct order and the one everyone gets wrong, because converting
 * first means shipping Illustrator's layer names into a React component.
 * Generate a pattern or a wave and the same two exports are waiting, so a
 * shape made here leaves as a component or a background rather than as a
 * file you then have to process somewhere else.
 *
 * Everything runs in the tab. Nothing is uploaded, which for this tool is not
 * a privacy slogan — an SVG is a document that can carry script, and the
 * usual answer to "optimise my SVG" is to post it to a server. The preview
 * here is sanitised before it touches the DOM whatever the optimiser options
 * say, because `innerHTML` will not run a `<script>` but very much will fire
 * an `onload` on the root element.
 */

import * as React from 'react'
import { Download, FileCode2, Shapes, Upload, Waves as WavesIcon, Wand2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { useToolState } from '@/hooks/use-tool-state'
import {
  buildPatternCss,
  buildPatternSvg,
  buildWaveLayers,
  buildWaveSvg,
  byteLength,
  DEFAULT_JSX_OPTIONS,
  DEFAULT_OPTIMIZE_OPTIONS,
  DEFAULT_PATTERN_STATE,
  DEFAULT_WAVE_STATE,
  looksLikeSvg,
  optimizeSvg,
  PATTERN_LABELS,
  sanitizeSvgForPreview,
  svgToDataUri,
  svgToJsx,
  WAVE_LABELS,
  WAVE_WIDTH,
  type JsxOptions,
  type OptimizeOptions,
  type PatternKind,
  type PatternState,
  type WaveKind,
  type WaveState,
} from '@/lib/svg-tools'
import { cn } from '@/lib/utils'

const TOOL = '/tools/svg'

type Mode = 'optimise' | 'convert' | 'pattern' | 'wave'

const MODES: Array<{ id: Mode; label: string; icon: React.ReactNode }> = [
  { id: 'optimise', label: 'Optimise', icon: <Wand2 className="h-4 w-4" /> },
  { id: 'convert', label: 'JSX & data URI', icon: <FileCode2 className="h-4 w-4" /> },
  { id: 'pattern', label: 'Pattern', icon: <Shapes className="h-4 w-4" /> },
  { id: 'wave', label: 'Wave', icon: <WavesIcon className="h-4 w-4" /> },
]

/**
 * The file the tool opens with.
 *
 * Deliberately a *bad* SVG rather than a clean one: it carries the prolog,
 * an Illustrator comment, a layer name, an unused id and eleven decimal
 * places, so the optimiser has something to do on the first frame and the
 * report is a demonstration rather than a row of zeros.
 */
const SAMPLE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generator: Adobe Illustrator 27.0.0, SVG Export Plug-In -->
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <title>Bookmark</title>
  <g id="Layer_1" data-name="Layer 1">
    <path d="M19.000000001 21.0000001 L12.00000001 16.33333333 L5 21 L5.0 5.0 A2 2 0 0 1 7 3 L17 3 A2 2 0 0 1 19 5 Z"/>
  </g>
</svg>`

interface SvgToolState {
  mode: Mode
  /** The pasted or uploaded source, shared by Optimise and Convert. */
  source: string
  optimize: OptimizeOptions
  jsx: JsxOptions
  /** base64 rather than the URL-encoded data URI. */
  base64: boolean
  pattern: PatternState
  wave: WaveState
}

const DEFAULT_STATE: SvgToolState = {
  mode: 'optimise',
  source: SAMPLE_SVG,
  optimize: DEFAULT_OPTIMIZE_OPTIONS,
  jsx: DEFAULT_JSX_OPTIONS,
  base64: false,
  pattern: DEFAULT_PATTERN_STATE,
  wave: DEFAULT_WAVE_STATE,
}

/** Bytes, in the unit a human reads. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

export default function SvgToolkitPage() {
  const tool = useToolState<SvgToolState>(TOOL, DEFAULT_STATE)
  const { state, setState } = tool

  const update = (patch: Partial<SvgToolState>) => setState((s) => ({ ...s, ...patch }))

  const result = React.useMemo(
    () => optimizeSvg(state.source, state.optimize),
    [state.source, state.optimize],
  )

  /*
    Which markup the generating modes hand to the exporters.

    Optimise and Convert work on what was pasted; Pattern and Wave work on
    what was just generated. Routing it through one variable is what lets the
    export cards below be written once — and is why a wave can be copied as a
    React component without a round trip through the paste box.
  */
  const generated = React.useMemo(() => {
    if (state.mode === 'pattern') return buildPatternSvg(state.pattern)
    if (state.mode === 'wave') return buildWaveSvg(state.wave)
    return result.output
  }, [state.mode, state.pattern, state.wave, result.output])

  const jsx = React.useMemo(
    () => svgToJsx(generated, state.jsx),
    [generated, state.jsx],
  )
  const dataUri = React.useMemo(
    () => svgToDataUri(generated, state.base64),
    [generated, state.base64],
  )

  const isSvg = looksLikeSvg(state.source)
  const savedPercent =
    result.before > 0 ? Math.round(((result.before - result.after) / result.before) * 100) : 0

  async function onUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    // `file.text()` reads it in the tab. Nothing leaves the machine, which
    // for a format that can carry script is the only defensible default.
    update({ source: await file.text() })
    event.target.value = ''
  }

  function download(markup: string, name: string) {
    const blob = new Blob([markup], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = name
    anchor.click()
    /*
      Revoked on the next tick, not immediately.

      `click()` on an object URL starts the download asynchronously, and
      revoking in the same statement occasionally cancels it before the
      browser has read the blob — a failure that reproduces on a slow machine
      and never on the one it was written on.
    */
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <ToolLayout
      name="SVG Toolkit"
      tagline="Optimise a file, turn it into a React component or a data URI, and generate the patterns and waves you were going to download from somewhere else — all four in the tab, none of it uploaded"
      icon={<Wand2 className="h-5 w-5" />}
    >
      {/* Mode switcher. Full width above both columns, because switching mode
          changes what the controls on the right even are. */}
      <div className="mb-6 flex flex-wrap gap-2">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => update({ mode: mode.id })}
            aria-current={state.mode === mode.id ? 'true' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors',
              state.mode === mode.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background hover:bg-muted',
            )}
          >
            {mode.icon}
            {mode.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/*
          `min-w-0` is load-bearing here in a way it is not on most tool
          pages. A grid item's default `min-width: auto` refuses to shrink
          below its content, and this column's content includes a data URI on
          one unbroken line — so without it the `1fr` column grows to the
          width of the URI and pushes the controls off the screen entirely.
        */}
        <div className="min-w-0 space-y-4">
          {/* ---------------------------------------------- Optimise */}
          {state.mode === 'optimise' ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PreviewPane label="Before" markup={state.source} size={result.before} />
                <PreviewPane
                  label="After"
                  markup={result.output}
                  size={result.after}
                  highlight={savedPercent > 0}
                />
              </div>

              {isSvg ? (
                <div className="rounded-lg border border-border bg-card p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-sm font-semibold">What ran</h2>
                    <p className="font-mono text-xs text-muted-foreground">
                      {formatBytes(result.before)} → {formatBytes(result.after)}
                      {savedPercent > 0 ? (
                        <span className="ml-2 font-semibold text-emerald-500">
                          −{savedPercent}%
                        </span>
                      ) : null}
                    </p>
                  </div>

                  {result.passes.length ? (
                    <ul className="mt-3 space-y-1.5">
                      {result.passes.map((pass) => (
                        <li
                          key={pass.label}
                          className="flex items-baseline justify-between gap-4 text-xs"
                        >
                          <span className="text-muted-foreground">
                            {pass.label}
                            {pass.count > 1 ? (
                              <span className="ml-1.5 text-[11px] opacity-70">
                                ×{pass.count}
                              </span>
                            ) : null}
                          </span>
                          <span className="shrink-0 font-mono tabular-nums">
                            {pass.saved > 0 ? `−${formatBytes(pass.saved)}` : '—'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Nothing to remove — this file is already clean.
                    </p>
                  )}

                  {result.warnings.map((warning) => (
                    <p
                      key={warning}
                      className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs leading-snug text-amber-700 dark:text-amber-300"
                    >
                      {warning}
                    </p>
                  ))}
                </div>
              ) : null}

              <CopyCssCard code={result.output} title="Optimised SVG" language="svg" />

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => download(result.output, 'optimised.svg')}
                >
                  <Download className="h-4 w-4" />
                  Download .svg
                </Button>
                <Button size="sm" variant="ghost" onClick={() => update({ mode: 'convert' })}>
                  Now turn it into a component
                </Button>
              </div>
            </>
          ) : null}

          {/* ---------------------------------------------- Convert */}
          {state.mode === 'convert' ? (
            <>
              <PreviewPane
                label="The markup being converted — already optimised"
                markup={generated}
                size={byteLength(generated)}
              />
              <CopyCssCard code={jsx} title={`${state.jsx.componentName}.tsx`} language="jsx" />
              <CopyCssCard code={dataUri} title="Data URI" language="uri" />
              <CopyCssCard
                code={`.icon {
  /* A data URI in CSS needs no request and cannot 404. The mask form is
     the one worth knowing: it paints the shape in the element's own
     colour, so one file works in both themes. */
  background-image: url("${dataUri}");
  background-size: contain;
  background-repeat: no-repeat;
}

.icon-tinted {
  mask-image: url("${dataUri}");
  mask-size: contain;
  mask-repeat: no-repeat;
  background-color: currentColor;
}`}
                title="CSS"
                language="css"
              />
            </>
          ) : null}

          {/* ---------------------------------------------- Pattern */}
          {state.mode === 'pattern' ? (
            <>
              <div
                className="h-72 overflow-hidden rounded-xl border border-border"
                // The pattern is decoration in a preview box; the copyable
                // output below is the real artifact.
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: buildPatternSvg(state.pattern) }}
              />
              <CopyCssCard
                code={buildPatternCss(state.pattern)}
                title="CSS — the form you actually want"
                language="css"
              />
              <CopyCssCard code={generated} title="SVG" language="svg" />
              <CopyCssCard code={jsx} title={`${state.jsx.componentName}.tsx`} language="jsx" />
            </>
          ) : null}

          {/* ---------------------------------------------- Wave */}
          {state.mode === 'wave' ? (
            <>
              <div className="overflow-hidden rounded-xl border border-border bg-card p-6">
                <WavePreview state={state.wave} />
              </div>
              <p className="text-[11px] leading-snug text-muted-foreground">
                Building the seam between two full-width bands instead? The{' '}
                <a href="/tools/divider" className="text-primary hover:underline">
                  section divider
                </a>{' '}
                draws the same family of shapes against both bands at once, which
                is the only way to see whether the join actually works.
              </p>
              <CopyCssCard code={generated} title="SVG" language="svg" />
              <CopyCssCard code={jsx} title={`${state.jsx.componentName}.tsx`} language="jsx" />
              <CopyCssCard
                code={`.hero {
  background-image: url("${dataUri}");
  background-repeat: no-repeat;
  background-position: bottom;
  background-size: 100% auto;
}`}
                title="CSS background"
                language="css"
              />
            </>
          ) : null}

          <UseInCatalog tool={TOOL} />
        </div>

        {/* ---------------------------------------------- Controls */}
        <div className="space-y-5">
          {state.mode === 'optimise' || state.mode === 'convert' ? (
            <div className="space-y-3 rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="svg-source" className="text-sm font-medium">
                  Your SVG
                </Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" asChild className="h-7 px-2 text-xs">
                    <label>
                      <Upload className="h-3.5 w-3.5" />
                      Open a file
                      <input
                        type="file"
                        accept=".svg,image/svg+xml"
                        className="sr-only"
                        onChange={onUpload}
                      />
                    </label>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => update({ source: SAMPLE_SVG })}
                  >
                    Sample
                  </Button>
                </div>
              </div>
              <Textarea
                id="svg-source"
                value={state.source}
                onChange={(e) => update({ source: e.target.value })}
                spellCheck={false}
                rows={10}
                placeholder="Paste an <svg> here, or open a file. It stays in this tab."
                className="font-mono text-xs"
              />
              {state.source.trim() && !isSvg ? (
                <p role="alert" className="text-xs text-destructive">
                  That does not contain an &lt;svg&gt; element. Paste the file&apos;s
                  contents rather than a link to it.
                </p>
              ) : null}
            </div>
          ) : null}

          {state.mode === 'optimise' ? (
            <div className="space-y-4 rounded-lg border border-border bg-card p-5">
              <Label className="block text-sm font-medium">Passes</Label>
              <SliderField
                label="Number precision"
                description="Decimal places kept on path and transform data. Two is invisible at any normal size and is where most of the saving in an exported icon lives; go below one and curves start to visibly kink."
                value={state.optimize.precision}
                min={0}
                max={5}
                step={1}
                display={String(state.optimize.precision)}
                onChange={(precision) =>
                  update({ optimize: { ...state.optimize, precision } })
                }
              />
              <ToggleField
                label="Drop width and height"
                description="Leaves the viewBox to define the aspect ratio, so the SVG fills whatever box you put it in. Skipped automatically when there is no viewBox to fall back on."
                checked={state.optimize.stripDimensions}
                onChange={(stripDimensions) =>
                  update({ optimize: { ...state.optimize, stripDimensions } })
                }
              />
              <ToggleField
                label="Remove unreferenced ids"
                description="Layer names from the editor, kept only when a url(), a <use> or an animation names them. Skipped entirely if the file has its own <style>, where a selector could reach an id in ways this cannot see."
                checked={state.optimize.stripUnusedIds}
                onChange={(stripUnusedIds) =>
                  update({ optimize: { ...state.optimize, stripUnusedIds } })
                }
              />
              <ToggleField
                label="Colours to currentColor"
                description="Makes the icon inherit the colour of the text around it — one file for both themes. fill=&quot;none&quot; is left alone, because on a stroked icon that is structure and not colour."
                checked={state.optimize.useCurrentColor}
                onChange={(useCurrentColor) =>
                  update({ optimize: { ...state.optimize, useCurrentColor } })
                }
              />
              <ToggleField
                label="Remove scripts and handlers"
                description="An SVG is a document and can carry script. On by default; the preview above sanitises regardless, but the copied output is exactly what this switch says it is."
                checked={state.optimize.stripScripts}
                onChange={(stripScripts) =>
                  update({ optimize: { ...state.optimize, stripScripts } })
                }
              />
              <ToggleField
                label="Remove <title> and <desc>"
                description="Off, unlike most optimisers. A <title> is the accessible name of an inline SVG — deleting it to save nine bytes turns a labelled control into 'graphic'."
                checked={state.optimize.stripTitles}
                onChange={(stripTitles) =>
                  update({ optimize: { ...state.optimize, stripTitles } })
                }
              />
            </div>
          ) : null}

          {state.mode !== 'optimise' ? (
            <div className="space-y-4 rounded-lg border border-border bg-card p-5">
              <Label className="block text-sm font-medium">Component output</Label>
              <div className="space-y-1.5">
                <Label htmlFor="component-name" className="text-xs font-semibold">
                  Component name
                </Label>
                <Input
                  id="component-name"
                  value={state.jsx.componentName}
                  onChange={(e) =>
                    update({
                      jsx: {
                        ...state.jsx,
                        // JSX requires a capitalised identifier — a lowercase
                        // name is parsed as an HTML tag, which fails at the
                        // call site with a message about an unknown element.
                        componentName:
                          e.target.value.replace(/[^A-Za-z0-9]/g, '') || 'Icon',
                      },
                    })
                  }
                  className="h-9 font-mono text-xs"
                />
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Capitalised and alphanumeric: JSX reads a lowercase name as an
                  HTML tag rather than as your component.
                </p>
              </div>
              <ToggleField
                label="TypeScript"
                description="Types the component as React.SVGProps<SVGSVGElement>, which is what makes className, width and onClick type-check at the call site."
                checked={state.jsx.typescript}
                onChange={(typescript) => update({ jsx: { ...state.jsx, typescript } })}
              />
              <ToggleField
                label="Spread props onto the root"
                description="Lets a caller pass className, size or aria-hidden through. Without it the component is a fixed picture and every usage needs a wrapper."
                checked={state.jsx.spreadProps}
                onChange={(spreadProps) => update({ jsx: { ...state.jsx, spreadProps } })}
              />
              <ToggleField
                label="Colours to currentColor"
                description="Applied on the way into the component, so the icon takes the colour of the text it sits in."
                checked={state.jsx.currentColor}
                onChange={(currentColor) => update({ jsx: { ...state.jsx, currentColor } })}
              />
              <ToggleField
                label="Base64 data URI"
                description="Off by default. A URL-encoded SVG is usually smaller than its base64 form and stays readable in the stylesheet; base64 is only worth it when a build step mangles the punctuation."
                checked={state.base64}
                onChange={(base64) => update({ base64 })}
              />
            </div>
          ) : null}

          {state.mode === 'pattern' ? (
            <div className="space-y-4 rounded-lg border border-border bg-card p-5">
              <Label className="block text-sm font-medium">Pattern</Label>
              <Select
                value={state.pattern.kind}
                onValueChange={(kind) =>
                  update({ pattern: { ...state.pattern, kind: kind as PatternKind } })
                }
              >
                <SelectTrigger aria-label="Pattern shape">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PATTERN_LABELS) as PatternKind[]).map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {PATTERN_LABELS[kind]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <SliderField
                label="Tile size"
                description="The period of the repeat. Under about 8px the pattern reads as noise; over about 60 it reads as individual objects rather than as a texture."
                value={state.pattern.size}
                min={6}
                max={80}
                step={1}
                display={`${state.pattern.size}px`}
                onChange={(size) => update({ pattern: { ...state.pattern, size } })}
              />
              <SliderField
                label="Weight"
                description="Line width, or dot radius for the dot field. The single control that decides whether a pattern sits behind your content or fights it."
                value={state.pattern.weight}
                min={0.5}
                max={8}
                step={0.5}
                display={`${state.pattern.weight}px`}
                onChange={(weight) => update({ pattern: { ...state.pattern, weight } })}
              />
              <SliderField
                label="Angle"
                description="Rotates the tiling lattice, not the marks inside the tile — which is why the pattern stays seamless at 37° rather than showing a grid of visible squares."
                value={state.pattern.angle}
                min={0}
                max={90}
                step={1}
                display={`${state.pattern.angle}°`}
                onChange={(angle) => update({ pattern: { ...state.pattern, angle } })}
              />
              <SliderField
                label="Opacity"
                description="Applied to the marks rather than to the element, so text you put on top stays at full contrast. This is the bug in every hand-written version of this."
                value={state.pattern.opacity}
                min={0.02}
                max={1}
                step={0.02}
                display={state.pattern.opacity.toFixed(2)}
                onChange={(opacity) => update({ pattern: { ...state.pattern, opacity } })}
              />
              <ColorRow
                label="Marks"
                hint="The pattern itself"
                value={state.pattern.foreground}
                onChange={(foreground) => update({ pattern: { ...state.pattern, foreground } })}
              />
              <ColorRow
                label="Background"
                hint="Stays a CSS colour, not part of the URI"
                value={state.pattern.background}
                onChange={(background) => update({ pattern: { ...state.pattern, background } })}
              />
            </div>
          ) : null}

          {state.mode === 'wave' ? (
            <div className="space-y-4 rounded-lg border border-border bg-card p-5">
              <Label className="block text-sm font-medium">Shape</Label>
              <Select
                value={state.wave.kind}
                onValueChange={(kind) =>
                  update({ wave: { ...state.wave, kind: kind as WaveKind } })
                }
              >
                <SelectTrigger aria-label="Wave shape">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(WAVE_LABELS) as WaveKind[]).map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {WAVE_LABELS[kind]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {state.wave.kind === 'blob' ? (
                <>
                  <SliderField
                    label="Points"
                    description="How many vertices the curve passes through. Six is the classic organic blob; past ten it starts reading as a circle with a texture."
                    value={state.wave.count}
                    min={3}
                    max={10}
                    step={1}
                    display={String(state.wave.count)}
                    onChange={(count) => update({ wave: { ...state.wave, count } })}
                  />
                  <SliderField
                    label="Randomness"
                    description="How far each vertex wanders from the base circle. At zero you get a mathematically exact circle, which is a useful thing to be able to check."
                    value={state.wave.randomness}
                    min={0}
                    max={0.9}
                    step={0.05}
                    display={state.wave.randomness.toFixed(2)}
                    onChange={(randomness) => update({ wave: { ...state.wave, randomness } })}
                  />
                  <SliderField
                    label="Seed"
                    description="Which blob you get. Same seed, same shape, every render — so the SVG you copy is the one you were looking at."
                    value={state.wave.seed}
                    min={1}
                    max={60}
                    step={1}
                    display={String(state.wave.seed)}
                    onChange={(seed) => update({ wave: { ...state.wave, seed } })}
                  />
                </>
              ) : (
                <>
                  <SliderField
                    label="Height"
                    description="How much vertical room the shape takes. This is real page height — a 240px wave costs 240px of scroll."
                    value={state.wave.height}
                    min={40}
                    max={320}
                    step={4}
                    display={`${state.wave.height}px`}
                    onChange={(height) => update({ wave: { ...state.wave, height } })}
                  />
                  <SliderField
                    label="Depth"
                    description="How far the curve reaches into that height, as a share of it. Low is a suggestion; high is a statement."
                    value={state.wave.amplitude}
                    min={5}
                    max={100}
                    step={1}
                    display={`${state.wave.amplitude}%`}
                    onChange={(amplitude) => update({ wave: { ...state.wave, amplitude } })}
                  />
                  <SliderField
                    label="Count"
                    description="Humps or points across the width. Odd numbers land asymmetrically at the two edges, which usually reads as more deliberate than perfect symmetry."
                    value={state.wave.count}
                    min={1}
                    max={9}
                    step={1}
                    display={String(state.wave.count)}
                    onChange={(count) => update({ wave: { ...state.wave, count } })}
                  />
                </>
              )}

              <SliderField
                label="Layers"
                description="Stacks the same shape again at lower amplitude and reduced opacity. Two reads as depth; three is the most that still reads as one shape."
                value={state.wave.layers}
                min={1}
                max={3}
                step={1}
                display={String(state.wave.layers)}
                onChange={(layers) => update({ wave: { ...state.wave, layers } })}
              />
              <ToggleField
                label="Flip horizontally"
                description="Mirrors left to right. The fastest way to stop the same shape looking repeated when you use it twice on one page."
                checked={state.wave.flipX}
                onChange={(flipX) => update({ wave: { ...state.wave, flipX } })}
              />
              <ToggleField
                label="Flip vertically"
                description="Turns the shape upside down, so it hangs from the top of its box rather than sitting on the bottom."
                checked={state.wave.flipY}
                onChange={(flipY) => update({ wave: { ...state.wave, flipY } })}
              />
              <ToggleField
                label="Emit currentColor"
                description="The shape inherits colour from its container instead of carrying a hex, so one snippet works in both themes."
                checked={state.wave.useCurrentColor}
                onChange={(useCurrentColor) =>
                  update({ wave: { ...state.wave, useCurrentColor } })
                }
              />
              {!state.wave.useCurrentColor ? (
                <ColorRow
                  label="Fill"
                  hint="Baked into the path"
                  value={state.wave.color}
                  onChange={(color) => update({ wave: { ...state.wave, color } })}
                />
              ) : null}
            </div>
          ) : null}

          <ToolPresetsBar tool={tool} noun="SVG setup" />
        </div>
      </div>
    </ToolLayout>
  )
}

/**
 * One side of the before/after pair.
 *
 * `sanitizeSvgForPreview` is not optional and not tied to the optimiser's
 * script switch: this is arbitrary markup going into the DOM of a page the
 * visitor is signed into. The optimiser's own switch governs what gets
 * *copied out*; this governs what runs, and the answer to that is nothing.
 */
function PreviewPane({
  label,
  markup,
  size,
  highlight = false,
}: {
  label: string
  markup: string
  size: number
  highlight?: boolean
}) {
  const safe = React.useMemo(() => sanitizeSvgForPreview(markup), [markup])

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-baseline justify-between gap-2 border-b border-border/60 bg-muted/40 px-3 py-2">
        <span className="text-xs font-medium">{label}</span>
        <span
          className={cn(
            'font-mono text-[11px] tabular-nums',
            highlight ? 'text-emerald-500' : 'text-muted-foreground',
          )}
        >
          {formatBytes(size)}
        </span>
      </div>
      {/*
        A checkerboard, because half of what gets pasted here has a
        transparent background and half has a white one, and on a white card
        those two look identical right up until the icon is on a dark page.

        `[&_svg]` fixes the drawn size on both sides. Two different reasons,
        one rule: an icon whose width and height the optimiser has just
        removed fills whatever box it is given and would be 900px tall, while
        the original still carries `width="24"` and would be drawn a
        thumbnail next to it — making the optimiser look like it had resized
        the artwork. Height with an automatic width keeps the aspect ratio
        the viewBox declares.
      */}
      <div
        className="flex min-h-[180px] items-center justify-center p-6 [&_svg]:h-24 [&_svg]:w-auto [&_svg]:max-w-full"
        style={{
          backgroundImage:
            'repeating-conic-gradient(oklch(0 0 0 / 0.06) 0% 25%, transparent 0% 50%)',
          backgroundSize: '16px 16px',
        }}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    </div>
  )
}

/** The wave, drawn as React rather than as injected markup. */
function WavePreview({ state }: { state: WaveState }) {
  const layers = buildWaveLayers(state)
  const isBlob = state.kind === 'blob'
  const width = isBlob ? 200 : WAVE_WIDTH
  const height = isBlob ? 200 : state.height

  const transform =
    state.flipX || state.flipY
      ? `translate(${state.flipX ? width : 0}, ${state.flipY ? height : 0}) scale(${
          state.flipX ? -1 : 1
        }, ${state.flipY ? -1 : 1})`
      : undefined

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={isBlob ? undefined : 'none'}
      aria-hidden="true"
      focusable="false"
      style={{
        display: 'block',
        width: isBlob ? 240 : '100%',
        height: isBlob ? 240 : state.height,
        margin: isBlob ? '0 auto' : undefined,
        color: state.useCurrentColor ? state.color : undefined,
      }}
    >
      <g transform={transform}>
        {layers.map((layer, index) => (
          <path
            key={index}
            d={layer.d}
            fill={state.useCurrentColor ? 'currentColor' : state.color}
            opacity={layer.opacity}
          />
        ))}
      </g>
    </svg>
  )
}

/** A native colour well plus the hex, because designers arrive with a hex. */
function ColorRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: string
  onChange: (value: string) => void
}) {
  const id = React.useId()
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="text-xs font-semibold">
          {label}
        </Label>
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      </div>
      <div className="flex gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-border bg-background p-1"
        />
        <input
          type="text"
          aria-label={`${label} hex`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 font-mono text-xs uppercase',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        />
      </div>
    </div>
  )
}
