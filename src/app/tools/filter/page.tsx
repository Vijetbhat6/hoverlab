'use client'

/**
 * CSS Filter & Blend Mode Playground.
 *
 * `filter`, `backdrop-filter` and `mix-blend-mode` are three properties
 * that share one problem: you cannot predict them. Nobody knows what
 * `saturate(1.4) hue-rotate(-15deg)` looks like on their own artwork, and
 * nobody can tell `overlay` from `soft-light` from `hard-light` without
 * seeing all three on the same surface. They are the properties most
 * reached for by trial and error, which makes them exactly the properties
 * worth putting real controls on.
 *
 * Three things this insists on:
 *
 *   Filter order is not commutative and the tool preserves the CSS order
 *   rather than a tidy alphabetical one, because `blur(4px) brightness(2)`
 *   and `brightness(2) blur(4px)` are genuinely different pictures.
 *
 *   `backdrop-filter` is the same function list applied to what is *behind*
 *   an element, and it is the one people reach for while writing `filter`
 *   and wondering why their card went blurry instead of the page under it.
 *   Same controls, one switch, both previewed.
 *
 *   Nothing loads. The subject is drawn in CSS — the whole tools section
 *   works offline and makes no third-party request, and a filter playground
 *   that needs a stock photo from a CDN would be the one exception.
 */

import * as React from 'react'
import { Aperture, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import { arbitraryValue, classes } from '@/lib/tailwind-arbitrary'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { ToolWorkbench } from '@/components/designer-tools/tool-workbench'
import { useToolState } from '@/hooks/use-tool-state'
import { cn } from '@/lib/utils'

const TOOL = '/tools/filter'

type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity'

const BLEND_MODES: BlendMode[] = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
]

interface FilterState {
  blur: number
  brightness: number
  contrast: number
  grayscale: number
  hueRotate: number
  invert: number
  saturate: number
  sepia: number
  opacity: number
  /** drop-shadow, which is not box-shadow: it follows the alpha, not the box. */
  shadowOn: boolean
  shadowX: number
  shadowY: number
  shadowBlur: number
  shadowColor: string
  /** Apply the list to what is behind the element instead of to the element. */
  backdrop: boolean
  blend: BlendMode
  subject: 'photo' | 'text' | 'ui'
}

const DEFAULT_STATE: FilterState = {
  blur: 0,
  brightness: 100,
  contrast: 100,
  grayscale: 0,
  hueRotate: 0,
  invert: 0,
  saturate: 100,
  sepia: 0,
  opacity: 100,
  shadowOn: false,
  shadowX: 0,
  shadowY: 8,
  shadowBlur: 12,
  shadowColor: '#000000',
  backdrop: false,
  blend: 'normal',
  subject: 'photo',
}

/**
 * The function list, in CSS order, with the no-ops dropped.
 *
 * Order is preserved deliberately — see the header. Identity values are
 * omitted because `brightness(1)` in a copied rule is a line the reader has
 * to check does nothing.
 */
function filterCss(s: FilterState): string {
  const parts: string[] = []
  if (s.blur > 0) parts.push(`blur(${s.blur}px)`)
  if (s.brightness !== 100) parts.push(`brightness(${round(s.brightness / 100)})`)
  if (s.contrast !== 100) parts.push(`contrast(${round(s.contrast / 100)})`)
  if (s.grayscale > 0) parts.push(`grayscale(${round(s.grayscale / 100)})`)
  if (s.hueRotate !== 0) parts.push(`hue-rotate(${s.hueRotate}deg)`)
  if (s.invert > 0) parts.push(`invert(${round(s.invert / 100)})`)
  if (s.saturate !== 100) parts.push(`saturate(${round(s.saturate / 100)})`)
  if (s.sepia > 0) parts.push(`sepia(${round(s.sepia / 100)})`)
  if (s.opacity !== 100) parts.push(`opacity(${round(s.opacity / 100)})`)
  if (s.shadowOn)
    parts.push(`drop-shadow(${s.shadowX}px ${s.shadowY}px ${s.shadowBlur}px ${s.shadowColor})`)
  return parts.join(' ')
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

/** Presets that are actual looks, not random slider positions. */
const PRESETS: Array<{ name: string; hint: string; patch: Partial<FilterState> }> = [
  {
    name: 'Reset',
    hint: 'Every function back to identity',
    patch: {
      blur: 0,
      brightness: 100,
      contrast: 100,
      grayscale: 0,
      hueRotate: 0,
      invert: 0,
      saturate: 100,
      sepia: 0,
      opacity: 100,
      shadowOn: false,
    },
  },
  {
    name: 'Faded',
    hint: 'Washed-out, for a background image under text',
    patch: { brightness: 112, contrast: 88, saturate: 70, grayscale: 10, blur: 0 },
  },
  {
    name: 'Punchy',
    hint: 'The default "make it pop" adjustment',
    patch: { contrast: 118, saturate: 135, brightness: 102, grayscale: 0, sepia: 0 },
  },
  {
    name: 'Duotone-ish',
    hint: 'Flatten to one hue, then push it',
    patch: { grayscale: 100, sepia: 100, hueRotate: 190, saturate: 320, contrast: 105 },
  },
  {
    name: 'Frosted backdrop',
    hint: 'The glass card look — needs backdrop on',
    patch: { backdrop: true, blur: 12, saturate: 160, brightness: 105 },
  },
  {
    name: 'Night',
    hint: 'Cooled and dimmed, the way a dark theme wants it',
    patch: { brightness: 82, contrast: 108, saturate: 85, hueRotate: -12, sepia: 0 },
  },
]

export default function FilterToolPage() {
  const tool = useToolState<FilterState>(TOOL, DEFAULT_STATE)
  const { state, setState } = tool

  const update = (patch: Partial<FilterState>) => setState((s) => ({ ...s, ...patch }))

  const filter = filterCss(state)
  const property = state.backdrop ? 'backdrop-filter' : 'filter'

  /*
    The same stack as Tailwind classes.

    One arbitrary PROPERTY — `[filter:…]` — rather than the per-function
    utilities `blur-[…] saturate-[…] …`, and that is a correctness choice
    rather than a stylistic one. Tailwind's individual filter utilities
    compose through CSS variables in a fixed order, so a stack that depends
    on ordering (a hue-rotate before a sepia is not the same picture as
    after) cannot be expressed by listing them. Emitting the whole value
    keeps the output identical to the CSS above and to the preview.

    `mix-blend-mode` has real utilities with no such caveat, so it uses one.
  */
  const tailwindClass =
    classes(
      filter ? `[${property}:${arbitraryValue(filter)}]` : '',
      state.backdrop && filter ? `[-webkit-${property}:${arbitraryValue(filter)}]` : '',
      state.blend !== 'normal' ? `mix-blend-${state.blend}` : '',
    ) ||
    // Every control at its identity value produces no classes at all, and an
    // empty code block reads as a bug rather than as "nothing to apply".
    '<!-- every filter is at its default, so there is nothing to apply -->'

  /*
    `-webkit-backdrop-filter` is still load-bearing.

    Safari shipped the property behind the prefix and unprefixed support is
    recent enough that omitting it silently drops the effect on a large
    share of iOS traffic — the exact audience most likely to be looking at
    a glass card. `filter` needs no such thing.
  */
  const cssBlock = [
    '.subject {',
    filter ? `  ${property}: ${filter};` : `  /* no filter functions active */`,
    state.backdrop && filter ? `  -webkit-${property}: ${filter};` : null,
    state.blend !== 'normal' ? `  mix-blend-mode: ${state.blend};` : null,
    state.backdrop
      ? '  /* backdrop-filter needs something behind it to filter, and a\n     background that is not fully opaque to see through. */\n  background: rgba(255, 255, 255, 0.12);'
      : null,
    '}',
  ]
    .filter(Boolean)
    .join('\n')

  const subjectStyle: React.CSSProperties = {
    ...(state.backdrop
      ? { backdropFilter: filter || undefined, WebkitBackdropFilter: filter || undefined }
      : { filter: filter || undefined }),
    mixBlendMode: state.blend === 'normal' ? undefined : state.blend,
  }

  return (
    <ToolLayout
      name="CSS Filter & Blend Mode Playground"
      tagline="Every filter function, backdrop-filter, and all sixteen blend modes — on a subject drawn in CSS, with nothing loaded"
      icon={<Aperture className="h-5 w-5" />}
    >
      <ToolWorkbench controlsWidth="380px">
        <div className="space-y-4">
          {/* The stage. In backdrop mode the subject is a pane over the
              artwork; otherwise the artwork itself is filtered. */}
          <div className="overflow-hidden rounded-xl border border-border shadow-sm">
            <div className="relative min-h-[340px]">
              <Artwork
                subject={state.subject}
                style={state.backdrop ? undefined : subjectStyle}
              />
              {state.backdrop ? (
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div
                    style={subjectStyle}
                    className="flex h-40 w-full max-w-sm flex-col items-center justify-center rounded-2xl border border-white/25 bg-white/10 text-white shadow-2xl"
                  >
                    <span className="text-sm font-semibold">The pane</span>
                    <span className="mt-1 text-xs opacity-80">
                      backdrop-filter, not filter
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {state.backdrop
              ? 'backdrop-filter applies the same function list to whatever is behind the element. The pane itself stays sharp — that is the whole difference, and it is why a card you meant to frost came out blurry when you used filter.'
              : 'filter applies to the element and everything inside it, including its text and its children. Switch to backdrop below to filter what is behind instead.'}
          </p>

          <CopyCssCard code={cssBlock} title="CSS" language="css" />
          <CopyCssCard code={tailwindClass} title="Tailwind classes" language="html" />

          <UseInCatalog tool={TOOL} />
        </div>

        {/* Controls */}
        <div className="space-y-5">
          <div className="space-y-3 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Looks</Label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => update(preset.patch)}
                  className="rounded-lg border border-border px-3 py-2 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    {preset.name === 'Reset' ? (
                      <RotateCcw aria-hidden className="h-3 w-3" />
                    ) : null}
                    {preset.name}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                    {preset.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Target</Label>
            <ToggleField
              label="Filter the backdrop instead"
              description="Switches every slider below from `filter` to `backdrop-filter`. The functions are identical; what changes is whether they hit the element or what is showing through it."
              checked={state.backdrop}
              onChange={(v) => update({ backdrop: v })}
            />
            <div className="space-y-1.5">
              <Label htmlFor="filter-subject" className="text-xs font-semibold">
                Subject
              </Label>
              <Select
                value={state.subject}
                onValueChange={(v) => update({ subject: v as FilterState['subject'] })}
              >
                <SelectTrigger id="filter-subject" aria-label="Preview subject">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photo">Artwork — colour and gradient</SelectItem>
                  <SelectItem value="text">Text on a surface</SelectItem>
                  <SelectItem value="ui">A UI card</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] leading-snug text-muted-foreground">
                Worth switching: a contrast bump that flatters artwork will
                often destroy small text, and blur on a UI card shows you what
                your users see mid-transition.
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <div className="flex items-baseline justify-between gap-3">
              <Label className="block text-sm font-medium">Functions</Label>
              <span className="font-mono text-[10px] text-muted-foreground">
                {filter ? `${filter.split(' ').length} active` : 'none'}
              </span>
            </div>

            <SliderField
              label="blur"
              description="A gaussian blur in pixels. The one function here that is genuinely expensive — it repaints every frame it animates, so blur a still element freely and an animating one carefully."
              value={state.blur}
              min={0}
              max={40}
              step={0.5}
              display={`${state.blur}px`}
              onChange={(v) => update({ blur: v })}
            />
            <SliderField
              label="brightness"
              description="Multiplies every channel. Above 100% it clips the highlights permanently — detail lost here cannot be recovered by lowering contrast afterwards."
              value={state.brightness}
              min={0}
              max={300}
              step={1}
              display={`${round(state.brightness / 100)}`}
              onChange={(v) => update({ brightness: v })}
            />
            <SliderField
              label="contrast"
              description="Pushes values away from mid-grey. The usual pairing is a small contrast lift with a small brightness cut, because contrast alone tends to darken the result."
              value={state.contrast}
              min={0}
              max={300}
              step={1}
              display={`${round(state.contrast / 100)}`}
              onChange={(v) => update({ contrast: v })}
            />
            <SliderField
              label="saturate"
              description="Under 100% drains colour; over, it pushes. Above roughly 200% it stops looking vivid and starts looking broken, which is exactly what the duotone preset exploits."
              value={state.saturate}
              min={0}
              max={400}
              step={1}
              display={`${round(state.saturate / 100)}`}
              onChange={(v) => update({ saturate: v })}
            />
            <SliderField
              label="hue-rotate"
              description="Spins every hue around the wheel by this many degrees. Combined with a full grayscale and sepia, it is how you tint an image to one arbitrary colour without touching the source."
              value={state.hueRotate}
              min={-180}
              max={180}
              step={1}
              display={`${state.hueRotate}deg`}
              onChange={(v) => update({ hueRotate: v })}
            />
            <SliderField
              label="grayscale"
              description="Removes colour. Reaching for this and saturate(0) is the same result by two routes; grayscale composes better with sepia afterwards."
              value={state.grayscale}
              min={0}
              max={100}
              step={1}
              display={`${round(state.grayscale / 100)}`}
              onChange={(v) => update({ grayscale: v })}
            />
            <SliderField
              label="sepia"
              description="Maps everything onto a warm brown axis. On its own it is a photo-app cliché; at 100% with a hue-rotate after it, it is a duotone."
              value={state.sepia}
              min={0}
              max={100}
              step={1}
              display={`${round(state.sepia / 100)}`}
              onChange={(v) => update({ sepia: v })}
            />
            <SliderField
              label="invert"
              description="Flips every channel. Mostly useful partially, or on a monochrome icon that has to survive a theme it was not drawn for."
              value={state.invert}
              min={0}
              max={100}
              step={1}
              display={`${round(state.invert / 100)}`}
              onChange={(v) => update({ invert: v })}
            />
            <SliderField
              label="opacity"
              description="Same result as the opacity property here, but it composes inside the filter chain — so anything after it sees the faded version, which the property cannot do."
              value={state.opacity}
              min={0}
              max={100}
              step={1}
              display={`${round(state.opacity / 100)}`}
              onChange={(v) => update({ opacity: v })}
            />
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">drop-shadow</Label>
            <ToggleField
              label="Add a drop-shadow"
              description="Not box-shadow. This traces the element's actual alpha, so a transparent PNG or an SVG icon casts a shadow shaped like the artwork rather than like its rectangle. It is the only way to shadow a cut-out."
              checked={state.shadowOn}
              onChange={(v) => update({ shadowOn: v })}
            />
            {state.shadowOn ? (
              <>
                <SliderField
                  label="Offset X"
                  description="Horizontal throw. Zero with a vertical offset is the neutral, light-from-above shadow that reads as depth rather than as direction."
                  value={state.shadowX}
                  min={-40}
                  max={40}
                  step={1}
                  display={`${state.shadowX}px`}
                  onChange={(v) => update({ shadowX: v })}
                />
                <SliderField
                  label="Offset Y"
                  description="Vertical throw."
                  value={state.shadowY}
                  min={-40}
                  max={40}
                  step={1}
                  display={`${state.shadowY}px`}
                  onChange={(v) => update({ shadowY: v })}
                />
                <SliderField
                  label="Blur"
                  description="Softness. drop-shadow takes no spread argument — that is the one thing box-shadow can do and this cannot."
                  value={state.shadowBlur}
                  min={0}
                  max={60}
                  step={1}
                  display={`${state.shadowBlur}px`}
                  onChange={(v) => update({ shadowBlur: v })}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label="Shadow colour"
                    value={state.shadowColor}
                    onChange={(e) => update({ shadowColor: e.target.value })}
                    className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-border bg-background p-1"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Shadow colour — a dark tint of the subject reads better than black
                  </span>
                </div>
              </>
            ) : null}
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">mix-blend-mode</Label>
            <p className="text-[11px] leading-snug text-muted-foreground">
              How the subject composites with what is underneath. Unlike the filters
              above, this is not an adjustment of the element — it is a rule for how
              two layers combine, so it does nothing at all if there is nothing behind.
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {BLEND_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => update({ blend: mode })}
                  aria-pressed={state.blend === mode}
                  className={cn(
                    'rounded-md border px-2 py-1.5 font-mono text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    state.blend === mode
                      ? 'border-primary bg-primary/10 font-semibold text-primary'
                      : 'border-border hover:bg-muted/50',
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <ToolPresetsBar tool={tool} noun="look" />
        </div>
      </ToolWorkbench>
    </ToolLayout>
  )
}

/**
 * The subject, drawn rather than loaded.
 *
 * Three subjects because filters lie about themselves on any single one: a
 * contrast curve that flatters a gradient will crush small text, and blur
 * on a UI card is the only way to see what a mid-transition frame really
 * looks like.
 */
function Artwork({
  subject,
  style,
}: {
  subject: FilterState['subject']
  style?: React.CSSProperties
}) {
  if (subject === 'text') {
    return (
      <div
        style={style}
        className="flex min-h-[340px] flex-col justify-center gap-3 bg-gradient-to-br from-amber-100 via-rose-100 to-sky-100 p-10 dark:from-amber-950 dark:via-rose-950 dark:to-sky-950"
      >
        <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          Small text is the honest test
        </h3>
        <p className="max-w-md text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          A contrast lift that makes artwork sing will quietly destroy body copy, and a
          blur of two pixels is the difference between soft and unreadable. If the
          filter has to sit on a container that holds text, judge it here.
        </p>
        <p className="max-w-md text-xs text-slate-600 dark:text-slate-400">
          11px, the size real interfaces use for captions and metadata.
        </p>
      </div>
    )
  }

  if (subject === 'ui') {
    return (
      <div
        style={style}
        className="flex min-h-[340px] items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-8 dark:from-slate-800 dark:to-slate-900"
      >
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-emerald-500" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">Filter preview</div>
              <div className="text-xs text-muted-foreground">A card, at card size</div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-2 w-full rounded bg-muted" />
            <div className="h-2 w-4/5 rounded bg-muted" />
            <div className="h-2 w-2/3 rounded bg-muted" />
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-8 flex-1 rounded-lg bg-primary/90" />
            <div className="h-8 w-20 rounded-lg border border-border" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={style}
      className="relative min-h-[340px] overflow-hidden bg-[#0b1120]"
      aria-hidden
    >
      {/* Big saturated shapes, because filters are only legible on colour
          that has somewhere to move. */}
      <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 opacity-80 blur-2xl" />
      <div className="absolute right-0 top-8 h-64 w-64 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 opacity-80 blur-2xl" />
      <div className="absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-500 opacity-80 blur-2xl" />
      <div className="absolute inset-0 flex items-end p-8">
        <div className="rounded-xl bg-black/30 px-4 py-3 text-white backdrop-blur-sm">
          <div className="text-lg font-bold">Artwork</div>
          <div className="text-xs opacity-80">
            Drawn in CSS — nothing here makes a request
          </div>
        </div>
      </div>
    </div>
  )
}
