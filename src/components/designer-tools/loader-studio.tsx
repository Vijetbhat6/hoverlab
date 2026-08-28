'use client'

/**
 * The loader generator's controls, preview and catalog rail.
 *
 * Split from the route because the rail is fed from the full effect catalog,
 * which is a server-only module — importing `lib/effects` from a client
 * component pulls 1.6 MB of JSON into the browser. The page picks the 35
 * loaders out of it on the server and hands down just those; everything
 * stateful lives here.
 *
 * The rail is the reason this tool is not another spinner generator. There
 * are already 35 loaders in the catalog, hand-written and generated, and the
 * usual relationship between a gallery and a generator is that they ignore
 * each other: you copy CSS out of one and then hand-edit numbers you cannot
 * see. Here, picking one reads its own stylesheet — size, thickness,
 * duration, colour, how many children it has — and opens the sliders on those
 * values. It is an approximation, it says so on the tin, and it is a far
 * better starting point than a default.
 */

import * as React from 'react'
import Link from 'next/link'
import { ArrowUpRight, LoaderCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SliderField } from '@/components/control-field'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { useToolState } from '@/hooks/use-tool-state'
import { brandFromHex, normalizeHex } from '@/lib/color-tools'
import {
  buildLoader,
  DEFAULT_LOADER,
  LOADER_FAMILIES,
  seedFromCss,
  type LoaderFamily,
  type LoaderState,
} from '@/lib/loader-tools'
import { cn } from '@/lib/utils'

const TOOL = '/tools/loader'

/** The preview box's id, which the preview's copy of the CSS is scoped to. */
const PREVIEW_ID = 'loader-preview'

/** One of the catalog's own loaders, as the page hands it down. */
export interface CatalogLoader {
  id: string
  name: string
  html: string
  css: string
  tags: string[]
  /** Effects drawn for a dark surface need one to be legible. */
  darkSurface?: boolean
}

interface LoaderStudioState extends LoaderState {
  /** Preview surface. Half these loaders are only ever seen on one of them. */
  surface: 'light' | 'dark'
  /** Which catalog loader seeded the current state, if any. */
  seededFrom: string | null
}

const DEFAULT_STATE: LoaderStudioState = {
  ...DEFAULT_LOADER,
  surface: 'light',
  seededFrom: null,
}

/**
 * The HTML snippet as JSX.
 *
 * Two substitutions and nothing more, because that is genuinely all a loader
 * needs — there is no style attribute and no self-closing tag to fix. Written
 * out rather than run through the SVG toolkit's converter, which would be a
 * dependency on a much larger function for a job with two cases.
 */
function toJsx(html: string): string {
  return html.replace(/\bclass=/g, 'className=')
}

export function LoaderStudio({ catalog }: { catalog: CatalogLoader[] }) {
  const tool = useToolState<LoaderStudioState>(TOOL, DEFAULT_STATE)
  const { state, setState } = tool

  const update = (patch: Partial<LoaderStudioState>) =>
    setState((s) => ({ ...s, ...patch }))

  const output = React.useMemo(
    () =>
      buildLoader({
        family: state.family,
        className: state.className,
        size: state.size,
        thickness: state.thickness,
        speed: state.speed,
        count: state.count,
        gap: state.gap,
        color: state.color,
        trackColor: state.trackColor,
        label: state.label,
      }),
    [state],
  )

  const family = LOADER_FAMILIES.find((entry) => entry.id === state.family)!

  /*
    Every catalog loader's CSS in one <style> tag rather than one per card.

    Class names are globally unique per effect (`fx-…-<seq>`), so they cannot
    collide, and 35 style elements to render 35 spinners is 35 style
    recalculations for no reason. This is the same rule the catalog's own
    grids follow.
  */
  const catalogCss = React.useMemo(
    () => catalog.map((loader) => loader.css).join('\n\n'),
    [catalog],
  )

  /*
    The preview's copy of the CSS, scoped to the preview box.

    The class name is the user's to choose, and someone typing `card` or
    `button` into that field would otherwise inject a rule that restyles this
    page's own cards and buttons — a tool that visibly breaks the site while
    you use it. Prefixing every selector with the preview's id contains it.

    Only the preview is rewritten. The CSS in the copy card below is the
    unscoped original, because that is the file the user is taking away, and
    it has to work in their project rather than inside this box. Every
    selector the builder emits starts with `.<className>`, and keyframe names
    carry no dot, so the substitution cannot touch anything else.
  */
  const previewCss = React.useMemo(
    () => output.css.split(`.${state.className}`).join(`#${PREVIEW_ID} .${state.className}`),
    [output.css, state.className],
  )

  function seedFrom(loader: CatalogLoader) {
    update({
      ...seedFromCss(loader.css, loader.html, loader.tags, loader.name),
      seededFrom: loader.name,
    })
  }

  const brand = brandFromHex(state.color)

  return (
    <ToolLayout
      name="Loader Generator"
      tagline="Spinners, dots, bars and pulses as pure CSS — tuned on sliders, seeded from the 35 loaders already in the catalog, and emitted with the reduced-motion guard and the status role that hand-written ones go without"
      icon={<LoaderCircle className="h-5 w-5" />}
    >
      {/* The catalog's own CSS, once. */}
      <style dangerouslySetInnerHTML={{ __html: catalogCss }} />
      {/* And the generated loader's, so the preview is the real thing rather
          than a React re-implementation of it. */}
      <style dangerouslySetInnerHTML={{ __html: previewCss }} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-3 py-2">
              <p className="text-xs font-medium">
                {family.name}
                {state.seededFrom ? (
                  <span className="ml-2 font-normal text-muted-foreground">
                    seeded from {state.seededFrom}
                  </span>
                ) : null}
              </p>
              <div className="flex overflow-hidden rounded-md border border-border">
                {(['light', 'dark'] as const).map((surface) => (
                  <button
                    key={surface}
                    type="button"
                    onClick={() => update({ surface })}
                    aria-pressed={state.surface === surface}
                    className={cn(
                      'px-2.5 py-1 text-[11px] font-medium capitalize transition-colors',
                      state.surface === surface
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted',
                    )}
                  >
                    {surface}
                  </button>
                ))}
              </div>
            </div>
            <div
              id={PREVIEW_ID}
              className={cn(
                'flex min-h-[240px] items-center justify-center p-10',
                state.surface === 'dark' ? 'bg-slate-950' : 'bg-white',
              )}
            >
              {/* Sized to the page for the two families that are full-width. */}
              <div
                className={
                  state.family === 'bar' || state.family === 'shimmer'
                    ? 'w-full max-w-md'
                    : undefined
                }
                dangerouslySetInnerHTML={{ __html: output.html }}
              />
            </div>
          </div>

          <p className="text-[11px] leading-snug text-muted-foreground">
            {family.note}
          </p>

          <CopyCssCard code={output.html} title="HTML" language="html" />
          <CopyCssCard code={toJsx(output.html)} title="JSX" language="jsx" />
          <CopyCssCard code={output.css} title="CSS" language="css" />

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">What ships with it</h2>
            <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">
                  A reduced-motion guard.
                </span>{' '}
                Every loader here animates forever, which is exactly what
                <code className="mx-1 font-mono">prefers-reduced-motion</code>
                exists to stop. The guard collapses the duration rather than
                setting <code className="font-mono">animation: none</code>, so
                the loader ends on its final keyframe instead of vanishing.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  A status role and a name.
                </span>{' '}
                <code className="font-mono">role=&quot;status&quot;</code> plus
                a visually-hidden &ldquo;{state.label}…&rdquo;, so the interval
                where sighted users are told to wait is not silence for
                everyone else.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Keyframes named after your class.
                </span>{' '}
                <code className="font-mono">{output.keyframes.join(', ')}</code>
                . Keyframe names are global — two loaders sharing one means the
                second stylesheet silently redefines the first.
              </li>
            </ul>
          </div>

          {/* ------------------------------------------- The catalog rail */}
          <section aria-labelledby="from-catalog" className="rounded-2xl border border-border/60 bg-card/60 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="from-catalog" className="text-sm font-semibold">
                Start from one of the {catalog.length} in the catalog
              </h2>
              {/* The category hub, not `/library?filter=` — the hub is the
                  indexable page for "css loaders" and the one worth sending
                  someone to from here. */}
              <Link
                href="/category/loaders"
                className="text-xs text-primary hover:underline"
              >
                See them all
              </Link>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              These are the real entries, running. Picking one reads its own
              stylesheet — size, thickness, duration, colour, how many parts it
              has — and opens the sliders on those numbers. It lands on the
              nearest family rather than reproducing the original exactly; for
              the exact CSS, open the effect.
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {catalog.map((loader) => (
                <li
                  key={loader.id}
                  className="overflow-hidden rounded-lg border border-border/60 bg-background"
                >
                  <div
                    className={cn(
                      'flex h-24 items-center justify-center overflow-hidden p-4',
                      loader.darkSurface ? 'bg-slate-950' : 'bg-muted/30',
                    )}
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: loader.html }}
                  />
                  <div className="border-t border-border/60 p-2">
                    <p className="truncate text-[11px] font-medium" title={loader.name}>
                      {loader.name}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 flex-1 px-2 text-[10px]"
                        onClick={() => seedFrom(loader)}
                      >
                        Start from this
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 shrink-0 p-0"
                      >
                        <Link href={`/effect/${loader.id}`} aria-label={`Open ${loader.name}`}>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <UseInCatalog brand={brand} tool={TOOL} />
        </div>

        {/* ------------------------------------------------ Controls */}
        <div className="space-y-5">
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Family</Label>
            <Select
              value={state.family}
              onValueChange={(value) =>
                update({ family: value as LoaderFamily, seededFrom: null })
              }
            >
              <SelectTrigger aria-label="Loader family">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOADER_FAMILIES.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <SliderField
              label={state.family === 'bar' || state.family === 'shimmer' ? 'Height' : 'Size'}
              description="One number sizes the whole thing — dots, orbit radius and stroke inset are all derived from it. A loader with nine independent measurements is one nobody gets right."
              value={state.size}
              min={12}
              max={120}
              step={1}
              display={`${state.size}px`}
              onChange={(size) => update({ size })}
            />
            <SliderField
              label="Thickness"
              description="Border, stroke or bar width. Below about 2px a spinner disappears on a low-DPI screen; above about a tenth of the size it stops reading as a ring."
              value={state.thickness}
              min={1}
              max={16}
              step={1}
              display={`${state.thickness}px`}
              onChange={(thickness) => update({ thickness })}
            />
            <SliderField
              label="Speed"
              description="One full cycle. Under about 0.6s a spinner reads as frantic and makes a wait feel broken; over about 2s it reads as stalled."
              value={state.speed}
              min={0.2}
              max={4}
              step={0.1}
              display={`${state.speed.toFixed(1)}s`}
              onChange={(speed) => update({ speed })}
            />
            {family.multiplied ? (
              <>
                <SliderField
                  label="Count"
                  description="How many dots or bars. Three is the convention for dots and five for bars; more reads as a visualisation rather than as a wait."
                  value={state.count}
                  min={2}
                  max={8}
                  step={1}
                  display={String(state.count)}
                  onChange={(count) => update({ count })}
                />
                <SliderField
                  label="Gap"
                  description="Space between them. Tight enough and the group reads as one object, which is what you want — three separate dots read as three things loading."
                  value={state.gap}
                  min={0}
                  max={24}
                  step={1}
                  display={`${state.gap}px`}
                  onChange={(gap) => update({ gap })}
                />
              </>
            ) : null}
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Colour</Label>
            <ColorRow
              label="Loader"
              hint="The lit part"
              value={state.color}
              onChange={(color) => update({ color })}
            />
            <div className="space-y-1.5">
              <Label htmlFor="track-color" className="text-xs font-semibold">
                Track
              </Label>
              <Input
                id="track-color"
                value={state.trackColor}
                onChange={(e) => update({ trackColor: e.target.value })}
                className="h-9 font-mono text-xs"
              />
              <p className="text-[11px] leading-snug text-muted-foreground">
                A full CSS colour rather than a picker, because this one is
                almost always translucent — a track at{' '}
                <code className="font-mono">20%</code> of the loader colour sits
                correctly on any surface, which an opaque grey does not.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => {
                const hex = normalizeHex(state.color)
                if (hex) update({ trackColor: `${hex}33` })
              }}
            >
              Derive the track from the loader colour
            </Button>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Output</Label>
            <div className="space-y-1.5">
              <Label htmlFor="loader-class" className="text-xs font-semibold">
                Class name
              </Label>
              <Input
                id="loader-class"
                value={state.className}
                onChange={(e) =>
                  update({
                    // A class that starts with a digit, or carries a space, is
                    // a selector that silently matches nothing.
                    className:
                      e.target.value
                        .replace(/[^A-Za-z0-9_-]/g, '-')
                        .replace(/^[^A-Za-z_]+/, '') || 'loader',
                  })
                }
                className="h-9 font-mono text-xs"
              />
              <p className="text-[11px] leading-snug text-muted-foreground">
                Everything is namespaced to it, keyframes included, so two
                loaders from this tool can live in one stylesheet.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loader-label" className="text-xs font-semibold">
                Announced text
              </Label>
              <Input
                id="loader-label"
                value={state.label}
                onChange={(e) => update({ label: e.target.value })}
                className="h-9 text-xs"
              />
              <p className="text-[11px] leading-snug text-muted-foreground">
                What a screen reader says when this appears. Name the operation
                — &ldquo;Saving changes&rdquo; beats &ldquo;Loading&rdquo;.
              </p>
            </div>
          </div>

          <ToolPresetsBar tool={tool} noun="loader" />
        </div>
      </div>
    </ToolLayout>
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
  const [draft, setDraft] = React.useState(value)
  React.useEffect(() => setDraft(value), [value])

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
          // The well only understands `#rrggbb`; a seeded loader may have
          // arrived carrying `rgba(…)` from the catalog, and passing that in
          // resets the well to black. Falling back keeps the two in step.
          value={normalizeHex(value) ?? '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-border bg-background p-1"
        />
        <input
          type="text"
          aria-label={`${label} colour`}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            onChange(e.target.value)
          }}
          className={cn(
            'h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 font-mono text-xs',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        />
      </div>
    </div>
  )
}
