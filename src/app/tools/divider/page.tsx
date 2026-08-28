'use client'

/**
 * Section Divider Generator.
 *
 * The shape between two full-width bands — the wave, the tilt, the notch —
 * is one of the few pieces of a marketing page that is genuinely hard to
 * hand-author. It is an SVG path expressed in a viewBox nobody wants to
 * reason about, and getting it wrong shows up as a hairline of background
 * bleeding through at the seam, which is the kind of bug that survives to
 * production because it only appears at certain zoom levels.
 *
 * Two things this does that a screenshot of a path does not:
 *
 *   The seam. Every shape here is drawn to overshoot its band by a fraction
 *   of a pixel and the SVG is emitted with `display: block`, because the two
 *   ways this always breaks are the inline-element baseline gap under the
 *   svg and antialiasing at the exact boundary. Both are invisible in the
 *   generator and obvious on a deployed page.
 *
 *   The colour. A divider is not a shape on a background, it is the *join*
 *   between two backgrounds, so the preview shows both bands and the shape
 *   defaults to `currentColor` — which is what lets one copied snippet be
 *   reused between a light section and a dark one instead of hard-coding a
 *   hex that is wrong in the other theme.
 */

import * as React from 'react'
import { Waves } from 'lucide-react'

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
import { cn } from '@/lib/utils'

const TOOL = '/tools/divider'

/** The viewBox is fixed and the SVG scales — one path works at every width. */
const W = 1440

type Shape =
  | 'wave'
  | 'curve'
  | 'tilt'
  | 'triangle'
  | 'zigzag'
  | 'arrow'
  | 'book'
  | 'split'

const SHAPE_LABELS: Record<Shape, string> = {
  wave: 'Wave — repeating humps',
  curve: 'Curve — one soft arc',
  tilt: 'Tilt — a straight diagonal',
  triangle: 'Triangle — a single peak',
  zigzag: 'Zigzag — hard points',
  arrow: 'Arrow — a notch',
  book: 'Book — arc with a lifted edge',
  split: 'Split — two arcs meeting',
}

interface DividerState {
  shape: Shape
  height: number
  /** How tall the feature is inside the band, as a percentage of height. */
  amplitude: number
  /** Humps, points, or how far along the peak sits — shape decides. */
  count: number
  flipX: boolean
  flipY: boolean
  layers: number
  /** Emit `currentColor` instead of a literal, so one snippet fits both themes. */
  useCurrentColor: boolean
  color: string
  /** Preview only: the band the shape is cut out of. */
  topColor: string
  bottomColor: string
}

const DEFAULT_STATE: DividerState = {
  shape: 'wave',
  height: 120,
  amplitude: 55,
  count: 3,
  flipX: false,
  flipY: false,
  layers: 1,
  useCurrentColor: true,
  color: '#10b981',
  topColor: '#0f172a',
  bottomColor: '#ffffff',
}

const n = (v: number) => Math.round(v * 10) / 10

/**
 * The filled path for one layer.
 *
 * Every shape is written as a profile across the top edge and then closed
 * down the right side, along the bottom and back up the left — so the fill
 * is always the *lower* band and flipping is a transform rather than eight
 * more path variants. `h + 1` on the closing edge is the overshoot that
 * kills the antialiased hairline at the seam.
 */
function buildPath(shape: Shape, h: number, amp: number, count: number): string {
  const a = (amp / 100) * h
  const close = `L${W},${n(h + 1)} L0,${n(h + 1)} Z`

  switch (shape) {
    case 'wave': {
      // Quadratic humps rather than a sampled sine: four numbers per hump
      // instead of forty, and at these amplitudes the difference from a true
      // sine is well under a pixel.
      const seg = W / count
      const mid = h - a / 2
      let d = `M0,${n(mid)}`
      for (let i = 0; i < count; i++) {
        const dir = i % 2 === 0 ? -1 : 1
        d += ` q${n(seg / 2)},${n(dir * a)} ${n(seg)},0`
      }
      return `${d} ${close}`
    }
    case 'curve':
      return `M0,${n(h)} C${n(W * 0.25)},${n(h - a * 1.6)} ${n(W * 0.75)},${n(
        h - a * 1.6,
      )} ${W},${n(h)} ${close}`
    case 'tilt':
      return `M0,${n(h)} L${W},${n(h - a)} ${close}`
    case 'triangle': {
      // `count` re-read as the peak's position, 1–9 → 10%–90% across.
      const peak = (count / 10) * W
      return `M0,${n(h)} L${n(peak)},${n(h - a)} L${W},${n(h)} ${close}`
    }
    case 'zigzag': {
      const seg = W / count
      let d = `M0,${n(h)}`
      for (let i = 0; i < count; i++) {
        d += ` L${n(seg * (i + 0.5))},${n(h - a)} L${n(seg * (i + 1))},${n(h)}`
      }
      return `${d} ${close}`
    }
    case 'arrow': {
      const half = W / 2
      const notch = (count / 10) * W
      return `M0,${n(h - a)} L${n(half - notch / 2)},${n(h - a)} L${n(half)},${n(
        h,
      )} L${n(half + notch / 2)},${n(h - a)} L${W},${n(h - a)} ${close}`
    }
    case 'book':
      return `M0,${n(h)} C${n(W * 0.35)},${n(h - a * 2)} ${n(W * 0.65)},${n(
        h - a * 2,
      )} ${W},${n(h - a * 0.15)} ${close}`
    case 'split': {
      const half = W / 2
      return `M0,${n(h - a)} C${n(W * 0.2)},${n(h - a)} ${n(W * 0.3)},${n(h)} ${n(
        half,
      )},${n(h)} C${n(W * 0.7)},${n(h)} ${n(W * 0.8)},${n(h - a)} ${W},${n(h - a)} ${close}`
    }
  }
}

/** Whether `count` is humps/points or a position, so the label can say so. */
function countMeaning(shape: Shape): { label: string; description: string } | null {
  switch (shape) {
    case 'wave':
      return {
        label: 'Humps',
        description:
          'How many times the wave rises and falls across the full width. Odd numbers land the shape asymmetrically at the two edges, which usually reads as more deliberate than a perfectly symmetric one.',
      }
    case 'zigzag':
      return {
        label: 'Points',
        description:
          'How many peaks the sawtooth has. Past about eight it stops reading as a divider and starts reading as a texture.',
      }
    case 'triangle':
      return {
        label: 'Peak position',
        description:
          'Where the apex sits across the width, in tenths. Five is centred; off-centre points the eye toward whichever side is next.',
      }
    case 'arrow':
      return {
        label: 'Notch width',
        description:
          'How wide the cut in the middle is, in tenths of the full width. Narrow reads as an arrow; wide reads as a valley.',
      }
    default:
      return null
  }
}

export default function DividerToolPage() {
  const tool = useToolState<DividerState>(TOOL, DEFAULT_STATE)
  const { state, setState } = tool

  const update = (patch: Partial<DividerState>) => setState((s) => ({ ...s, ...patch }))

  const fill = state.useCurrentColor ? 'currentColor' : state.color

  /*
    Layers are the same shape at decreasing amplitude and increasing
    frequency, stacked back to front at falling opacity. That combination is
    what reads as depth; two identical waves offset vertically just read as
    a mistake.
  */
  const layers = React.useMemo(
    () =>
      Array.from({ length: state.layers }, (_, i) => ({
        d: buildPath(
          state.shape,
          state.height,
          state.amplitude * (1 - i * 0.28),
          Math.max(1, state.count + i),
        ),
        opacity: i === 0 ? 1 : Number((1 - i * 0.45).toFixed(2)),
      })).reverse(),
    [state.shape, state.height, state.amplitude, state.count, state.layers],
  )

  /*
    Flipping as translate-then-scale rather than scale plus a
    transform-origin.

    `scale(-1, 1)` mirrors about the SVG's origin, which is its top-left
    corner — so on its own it flips the shape straight out of the viewBox.
    The usual fix is `transform-origin: center`, which is a presentation
    attribute with patchy history and which React will not accept in its
    hyphenated form at all. Translating by the width first and then scaling
    lands the mirrored shape exactly back where it started, needs no origin,
    and renders identically everywhere.
  */
  const flipTransform =
    state.flipX || state.flipY
      ? `translate(${state.flipX ? W : 0}, ${state.flipY ? state.height : 0}) scale(${
          state.flipX ? -1 : 1
        }, ${state.flipY ? -1 : 1})`
      : undefined

  const transform = flipTransform ? ` transform="${flipTransform}"` : ''

  /*
    `display: block` is not decoration.

    An <svg> is an inline element, so it sits on a text baseline and leaves
    two or three pixels of the parent's background showing underneath — the
    single most common way a divider ships broken. It goes in the emitted
    markup rather than in a note the reader has to act on.
  */
  const svg = `<svg
  class="divider"
  viewBox="0 0 ${W} ${state.height}"
  preserveAspectRatio="none"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
  focusable="false"
>
  <g${transform}>
${layers
  .map(
    (layer) =>
      `    <path d="${layer.d}" fill="${fill}"${
        layer.opacity < 1 ? ` opacity="${layer.opacity}"` : ''
      }/>`,
  )
  .join('\n')}
  </g>
</svg>`

  const cssBlock = `.divider {
  display: block;      /* an inline svg leaves a baseline gap under it */
  width: 100%;
  height: ${state.height}px;
  /* The shape is painted in the *lower* section's colour, so it reads as
     that section pushing up into the one above. */
  color: ${state.useCurrentColor ? 'var(--section-below, #ffffff)' : state.color};
}

/* Put it between the two bands, with no margin on either side. */
.section-above { background: ${state.topColor}; }
.section-below { background: ${state.bottomColor}; }`

  const htmlBlock = `<section class="section-above"> … </section>
${svg}
<section class="section-below"> … </section>`

  const meaning = countMeaning(state.shape)

  return (
    <ToolLayout
      name="SVG Section Divider Generator"
      tagline="Waves, tilts and notches for the seam between two bands — with the baseline gap and the antialiased hairline already dealt with"
      icon={<Waves className="h-5 w-5" />}
    >
      <ToolWorkbench controlsWidth="380px">
        <div className="space-y-4">
          {/* Both bands, because a divider is a join and not a shape. */}
          <div className="overflow-hidden rounded-xl border border-border shadow-sm">
            <div
              className="flex h-32 items-center justify-center text-xs font-semibold"
              style={{ background: state.topColor, color: state.bottomColor }}
            >
              Section above
            </div>
            <svg
              viewBox={`0 0 ${W} ${state.height}`}
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
              style={{
                display: 'block',
                width: '100%',
                height: state.height,
                color: state.useCurrentColor ? state.bottomColor : undefined,
                background: state.topColor,
              }}
            >
              <g transform={flipTransform}>
                {layers.map((layer, i) => (
                  <path key={i} d={layer.d} fill={fill} opacity={layer.opacity} />
                ))}
              </g>
            </svg>
            <div
              className="flex h-32 items-center justify-center text-xs font-semibold"
              style={{ background: state.bottomColor, color: state.topColor }}
            >
              Section below
            </div>
          </div>

          <CopyCssCard code={svg} title="SVG" language="svg" />
          <CopyCssCard code={cssBlock} title="CSS" language="css" />
          <CopyCssCard code={htmlBlock} title="Placement" language="html" />

          <UseInCatalog tool={TOOL} />
        </div>

        {/* Controls */}
        <div className="space-y-5">
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Shape</Label>
            <Select
              value={state.shape}
              onValueChange={(v) => update({ shape: v as Shape })}
            >
              <SelectTrigger aria-label="Divider shape">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SHAPE_LABELS) as Shape[]).map((shape) => (
                  <SelectItem key={shape} value={shape}>
                    {SHAPE_LABELS[shape]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <SliderField
              label="Height"
              description="How much vertical room the divider occupies. This is real page height — a 200px wave costs 200px of scroll, which is a lot to spend on a transition."
              value={state.height}
              min={24}
              max={280}
              step={4}
              display={`${state.height}px`}
              onChange={(v) => update({ height: v })}
            />
            <SliderField
              label="Depth"
              description="How far the shape reaches into the band, as a share of the height. Low is a suggestion of a curve; high is a statement."
              value={state.amplitude}
              min={5}
              max={100}
              step={1}
              display={`${state.amplitude}%`}
              onChange={(v) => update({ amplitude: v })}
            />
            {meaning ? (
              <SliderField
                label={meaning.label}
                description={meaning.description}
                value={state.count}
                min={1}
                max={9}
                step={1}
                display={String(state.count)}
                onChange={(v) => update({ count: v })}
              />
            ) : null}
            <SliderField
              label="Layers"
              description="Stacks the same shape again at lower amplitude, higher frequency and reduced opacity. Two layers reads as depth; three is the most that still reads as one divider."
              value={state.layers}
              min={1}
              max={3}
              step={1}
              display={String(state.layers)}
              onChange={(v) => update({ layers: v })}
            />
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Orientation</Label>
            <ToggleField
              label="Flip horizontally"
              description="Mirrors left to right. The fastest way to make the same shape not look repeated when you use it twice on one page."
              checked={state.flipX}
              onChange={(v) => update({ flipX: v })}
            />
            <ToggleField
              label="Flip vertically"
              description="Turns the shape upside down, so the band above pushes into the one below instead of the other way round. Swap the two colours below to match."
              checked={state.flipY}
              onChange={(v) => update({ flipY: v })}
            />
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Colour</Label>
            <ToggleField
              label="Emit currentColor"
              description="The shape inherits `color` from its container rather than carrying a hex. One copied snippet then works in both themes and in every section, which a literal cannot do."
              checked={state.useCurrentColor}
              onChange={(v) => update({ useCurrentColor: v })}
            />
            {!state.useCurrentColor ? (
              <ColorRow
                label="Shape fill"
                hint="Baked into the path"
                value={state.color}
                onChange={(color) => update({ color })}
              />
            ) : null}
            <ColorRow
              label="Section above"
              hint="Preview only"
              value={state.topColor}
              onChange={(topColor) => update({ topColor })}
            />
            <ColorRow
              label="Section below"
              hint="Preview only — and what currentColor resolves to"
              value={state.bottomColor}
              onChange={(bottomColor) => update({ bottomColor })}
            />
            <p className="text-[11px] leading-snug text-muted-foreground">
              The shape is filled with the colour of the section{' '}
              <em>below</em> it, sitting on the colour of the section above. That is
              what makes it read as one band pushing into the other rather than as a
              third thing between them.
            </p>
          </div>

          <ToolPresetsBar tool={tool} noun="divider" />
        </div>
      </ToolWorkbench>
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
