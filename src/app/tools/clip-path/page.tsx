'use client'

/**
 * Clip-path, Blob & Shape Magic.
 *
 * Three modes:
 *  1. Presets — the classic polygon() shapes (chevron, star, arrow, speech
 *     bubble…), each with the one or two parameters that shape actually has,
 *     because "star" is not one shape but a family of them.
 *  2. Blob — an organic closed curve: N control points around a circle with
 *     per-point radius jitter, smoothed Catmull-Rom → cubic bezier, drawn in
 *     a 0–100 box so the same path works as SVG anywhere.
 *
 *  3. Merge — Shape Magic. Several circles that blend into one organic
 *     outline, dragged around a canvas. The merged edge is real geometry
 *     rather than a gooey filter, which is what lets it leave as an SVG, a
 *     React component, a clip-path or a PNG. See `lib/shape-magic.ts` for
 *     why that distinction is the whole point.
 *
 * Every preview sits over a checkerboard, because a clip only reads as a cut
 * when you can see what it removed. polygon() takes percentages and scales
 * with the element; path() clips in px, so both path outputs say so.
 */

import * as React from 'react'
import { Plus, Shapes, Shuffle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SliderField } from '@/components/control-field'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { DownloadBar, type DownloadAction } from '@/components/designer-tools/download-bar'
import { ShapeStage } from '@/components/designer-tools/shape-stage'
import { downloadBlob, downloadText, svgToPngBlob } from '@/lib/download'
import {
  mergedShapePath,
  shapeClipPathCss,
  shapeReactComponent,
  shapeSvg,
  smoothClosedPath,
  type Metaball,
} from '@/lib/shape-magic'
import { arbitraryValue } from '@/lib/tailwind-arbitrary'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { ToolWorkbench } from '@/components/designer-tools/tool-workbench'
import { useToolState } from '@/hooks/use-tool-state'
import { cn } from '@/lib/utils'

const TOOL = '/tools/clip-path'

type Mode = 'presets' | 'blob' | 'merge'

/** The modes, in the order the switcher shows them. Also the share-link allow-list. */
const MODES: Mode[] = ['presets', 'blob', 'merge']

/**
 * What each mode is called in the switcher.
 *
 * Was `capitalize` on the raw key, which is fine for two words that happen
 * to describe themselves and wrong for the third: "Merge" is the verb, and
 * the thing it makes is the reason to press it.
 */
const MODE_LABEL: Record<Mode, string> = {
  presets: 'Presets',
  blob: 'Blob',
  merge: 'Shape Magic',
}

interface ShapeParam {
  label: string
  description: string
  min: number
  max: number
  step: number
  def: number
  unit: string
}

interface ShapePreset {
  id: string
  name: string
  /** Up to two params, mapped to state.p1 / state.p2 in order. */
  params: ShapeParam[]
  points: (p1: number, p2: number) => [number, number][]
}

const PRESETS: ShapePreset[] = [
  {
    id: 'triangle',
    name: 'Triangle',
    params: [
      {
        label: 'Apex position',
        description: 'Where the top point sits, left to right. 50% is an isosceles triangle; the extremes give you a right triangle.',
        min: 0,
        max: 100,
        step: 1,
        def: 50,
        unit: '%',
      },
    ],
    points: (p1) => [
      [p1, 0],
      [100, 100],
      [0, 100],
    ],
  },
  {
    id: 'chevron',
    name: 'Chevron',
    params: [
      {
        label: 'Depth',
        description: 'How far the arrowhead cuts in and out. Shallow reads as a breadcrumb separator; deep reads as a direction sign.',
        min: 5,
        max: 45,
        step: 1,
        def: 25,
        unit: '%',
      },
    ],
    points: (p1) => [
      [100 - p1, 0],
      [100, 50],
      [100 - p1, 100],
      [0, 100],
      [p1, 50],
      [0, 0],
    ],
  },
  {
    id: 'arrow',
    name: 'Arrow',
    params: [
      {
        label: 'Shaft thickness',
        description: 'Height of the arrow shaft relative to the head. Thin looks like a pointer; thick looks like a banner.',
        min: 10,
        max: 90,
        step: 1,
        def: 40,
        unit: '%',
      },
      {
        label: 'Head length',
        description: 'How much of the width the arrowhead takes. Longer heads look faster.',
        min: 10,
        max: 60,
        step: 1,
        def: 30,
        unit: '%',
      },
    ],
    points: (p1, p2) => {
      const top = (100 - p1) / 2
      return [
        [0, top],
        [100 - p2, top],
        [100 - p2, 0],
        [100, 50],
        [100 - p2, 100],
        [100 - p2, 100 - top],
        [0, 100 - top],
      ]
    },
  },
  {
    id: 'star',
    name: 'Star',
    params: [
      {
        label: 'Points',
        description: 'Number of star points. Five is the icon everyone knows; more starts to read as a seal or a burst.',
        min: 4,
        max: 12,
        step: 1,
        def: 5,
        unit: '',
      },
      {
        label: 'Inset',
        description: 'Inner radius as a share of the outer one. Low values give sharp spikes; high values approach a polygon.',
        min: 20,
        max: 90,
        step: 1,
        def: 50,
        unit: '%',
      },
    ],
    points: (p1, p2) => {
      const n = Math.round(p1)
      const inner = 50 * (p2 / 100)
      const pts: [number, number][] = []
      for (let i = 0; i < n * 2; i++) {
        const r = i % 2 === 0 ? 50 : inner
        const a = (i * Math.PI) / n - Math.PI / 2
        pts.push([50 + r * Math.cos(a), 50 + r * Math.sin(a)])
      }
      return pts
    },
  },
  {
    id: 'pentagon',
    name: 'Pentagon',
    params: [],
    points: () => {
      const pts: [number, number][] = []
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2
        pts.push([50 + 50 * Math.cos(a), 50 + 50 * Math.sin(a)])
      }
      return pts
    },
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    params: [
      {
        label: 'Corner cut',
        description: 'How far the left and right points are pulled in. 25% is the regular-ish hexagon; 50% collapses it to a rhombus.',
        min: 5,
        max: 50,
        step: 1,
        def: 25,
        unit: '%',
      },
    ],
    points: (p1) => [
      [p1, 0],
      [100 - p1, 0],
      [100, 50],
      [100 - p1, 100],
      [p1, 100],
      [0, 50],
    ],
  },
  {
    id: 'rhombus',
    name: 'Rhombus',
    params: [],
    points: () => [
      [50, 0],
      [100, 50],
      [50, 100],
      [0, 50],
    ],
  },
  {
    id: 'trapezoid',
    name: 'Trapezoid',
    params: [
      {
        label: 'Top inset',
        description: 'How much narrower the top edge is than the bottom. 0 is a rectangle; near 50 it becomes a triangle.',
        min: 0,
        max: 49,
        step: 1,
        def: 20,
        unit: '%',
      },
    ],
    points: (p1) => [
      [p1, 0],
      [100 - p1, 0],
      [100, 100],
      [0, 100],
    ],
  },
  {
    id: 'speech',
    name: 'Speech bubble',
    params: [
      {
        label: 'Tail position',
        description: 'Where the tail points along the bottom edge. Aim it at the speaker.',
        min: 10,
        max: 70,
        step: 1,
        def: 50,
        unit: '%',
      },
    ],
    points: (p1) => [
      [0, 0],
      [100, 0],
      [100, 75],
      [p1 + 25, 75],
      [p1 + 25, 100],
      [p1, 75],
      [0, 75],
    ],
  },
  {
    id: 'cross',
    name: 'Cross',
    params: [
      {
        label: 'Bar thickness',
        description: 'Width of both bars. Thin is a crosshair; thick is a plus button.',
        min: 10,
        max: 60,
        step: 1,
        def: 34,
        unit: '%',
      },
    ],
    points: (p1) => {
      const a = (100 - p1) / 2
      const b = a + p1
      return [
        [a, 0],
        [b, 0],
        [b, a],
        [100, a],
        [100, b],
        [b, b],
        [b, 100],
        [a, 100],
        [a, b],
        [0, b],
        [0, a],
        [a, a],
      ]
    },
  },
  {
    id: 'close',
    name: 'Close (X)',
    params: [
      {
        label: 'Stroke thickness',
        description: 'Weight of the two diagonal strokes. Thin is a delete glyph; thick is a warning mark.',
        min: 5,
        max: 40,
        step: 1,
        def: 20,
        unit: '%',
      },
    ],
    points: (p1) => [
      [p1, 0],
      [0, p1],
      [50 - p1, 50],
      [0, 100 - p1],
      [p1, 100],
      [50, 50 + p1],
      [100 - p1, 100],
      [100, 100 - p1],
      [50 + p1, 50],
      [100, p1],
      [100 - p1, 0],
      [50, 50 - p1],
    ],
  },
]

const fmt = (n: number) => String(Math.round(n * 10) / 10)

function polygonValue(points: [number, number][]): string {
  return `polygon(${points.map(([x, y]) => `${fmt(x)}% ${fmt(y)}%`).join(', ')})`
}

/** Deterministic PRNG so a blob can be regenerated (and persisted) by seed. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function blobPath(count: number, jitter: number, seed: number): string {
  const rand = mulberry32(seed)
  const step = (Math.PI * 2) / count
  const pts: [number, number][] = []
  for (let i = 0; i < count; i++) {
    // Jitter the angle a little and the radius a lot; even at 100% the
    // radius keeps 40% of its length so the blob never self-intersects.
    const a = i * step - Math.PI / 2 + (rand() - 0.5) * step * 0.5 * (jitter / 100)
    const r = 48 * (1 - rand() * 0.6 * (jitter / 100))
    pts.push([50 + r * Math.cos(a), 50 + r * Math.sin(a)])
  }
  return smoothClosedPath(pts)
}

const CHECKER_STYLE: React.CSSProperties = {
  backgroundImage:
    'repeating-conic-gradient(rgba(127, 127, 127, 0.22) 0% 25%, rgba(127, 127, 127, 0.06) 0% 50%)',
  backgroundSize: '24px 24px',
}

interface ClipState {
  mode: Mode
  presetId: string
  p1: number
  p2: number
  blobPoints: number
  blobJitter: number
  blobSeed: number
  /** Shape Magic: the circles that merge into one outline. */
  balls: Metaball[]
  /** Which of them the sliders and the arrow keys are aimed at. */
  selected: number
  /** How readily they blend, 0-100. See `lib/shape-magic.ts`. */
  gooeyness: number
  gradFrom: string
  gradTo: string
}

const DEFAULT_STATE: ClipState = {
  mode: 'presets',
  presetId: 'star',
  p1: 5,
  p2: 50,
  blobPoints: 6,
  blobJitter: 55,
  blobSeed: 1337,
  /*
    Three circles rather than two.

    Two make a peanut, which demonstrates merging but looks like a mistake.
    Three in a loose triangle is the shape that shows what the tool is for
    on first load, and it is also the arrangement where moving the
    gooeyness slider visibly changes the topology rather than just the
    waist.
  */
  balls: [
    { id: 1, x: 38, y: 40, r: 20 },
    { id: 2, x: 62, y: 44, r: 16 },
    { id: 3, x: 50, y: 68, r: 14 },
  ],
  selected: 1,
  gooeyness: 55,
  gradFrom: '#10b981',
  gradTo: '#6366f1',
}

/**
 * The fields `useToolState`'s shape guard cannot check on a shared link.
 *
 * The guard guarantees types: `mode` is a string, `presetId` is a string,
 * `balls` is an array of objects with three numbers each. It cannot know
 * that `mode` is one of three, that `presetId` has to name a shape that
 * still exists, or that `selected` has to name a circle that is actually in
 * the list — `PRESETS` is data this file owns, and the other two are
 * relationships between fields rather than properties of one.
 *
 * All three matter on render. An unrecognised `mode` matches no output
 * branch and draws an empty panel. A stale `presetId` falls back to the
 * first shape while the controls claim otherwise. And a `selected` naming
 * nothing leaves the radius slider driving a circle that does not exist,
 * which reads as a tool that has stopped responding.
 *
 * The empty-`balls` case is the one worth spelling out: the guard drops
 * array elements individually, so a link mangled in transit can arrive with
 * a well-typed empty list. That is a canvas with nothing on it and no
 * selection, so it falls back to the default arrangement rather than to a
 * blank stage nobody can tell from a bug.
 *
 * Numbers are otherwise left alone. Seed, points, jitter and gooeyness are
 * clamped by their sliders; a link carrying an out-of-range one draws an
 * odd shape, which is a shape, not a broken page.
 */
function sanitizeShared(shared: ClipState): ClipState {
  const balls =
    Array.isArray(shared.balls) && shared.balls.length > 0 ? shared.balls : DEFAULT_STATE.balls

  return {
    ...shared,
    mode: MODES.includes(shared.mode) ? shared.mode : DEFAULT_STATE.mode,
    presetId: PRESETS.some((p) => p.id === shared.presetId)
      ? shared.presetId
      : DEFAULT_STATE.presetId,
    balls,
    selected: balls.some((b) => b.id === shared.selected) ? shared.selected : balls[0].id,
  }
}

export default function ClipPathToolPage() {
  // Working state stays local and ungated; named presets need an account.
  // See `use-tool-state.ts` for why the two layers are separate.
  const tool = useToolState<ClipState>(TOOL, DEFAULT_STATE, sanitizeShared)
  const { state, setState } = tool
  const gradientId = React.useId()

  const update = (patch: Partial<ClipState>) => setState((s) => ({ ...s, ...patch }))

  const preset = PRESETS.find((p) => p.id === state.presetId) ?? PRESETS[0]

  const selectPreset = (p: ShapePreset) =>
    update({
      presetId: p.id,
      p1: p.params[0]?.def ?? 0,
      p2: p.params[1]?.def ?? 0,
    })

  const gradient = `linear-gradient(135deg, ${state.gradFrom}, ${state.gradTo})`

  const polygon = React.useMemo(
    () => polygonValue(preset.points(state.p1, state.p2)),
    [preset, state.p1, state.p2],
  )

  const polygonCss = React.useMemo(
    () => `.shape {\n  clip-path: ${polygon};\n}`,
    [polygon],
  )

  /*
    The same shape as a Tailwind class.

    The arbitrary-PROPERTY form, because there is no `clip-path` utility to
    hang a value off — `[clip-path:…]` is the whole mechanism Tailwind
    offers for a property it does not model, and it is exactly right here.
  */
  const tailwindClass = React.useMemo(
    () => `[clip-path:${arbitraryValue(polygon)}]`,
    [polygon],
  )

  const blobD = React.useMemo(
    () => blobPath(state.blobPoints, state.blobJitter, state.blobSeed),
    [state.blobPoints, state.blobJitter, state.blobSeed],
  )

  const blobCss = React.useMemo(
    () =>
      `.blob {\n  /* The curve is drawn in a 0–100 box. clip-path: path() clips in px,\n     so keep the element 100×100px (or transform: scale() it) — or put the\n     path in an SVG <clipPath clipPathUnits="objectBoundingBox"> to make\n     the clip scale with any element. */\n  width: 100px;\n  height: 100px;\n  clip-path: path('${blobD}');\n}`,
    [blobD],
  )

  const blobSvg = React.useMemo(
    () => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">\n  <path d="${blobD}" />\n</svg>`,
    [blobD],
  )

  const regenerate = () => update({ blobSeed: Math.floor(Math.random() * 2 ** 31) })

  /* ---------------------------------------------------------------- *
   *  Shape Magic
   * ---------------------------------------------------------------- */

  const selectedBall =
    state.balls.find((b) => b.id === state.selected) ?? state.balls[0]

  /*
    The contour, recomputed whenever a circle or the blend moves.

    It is a grid sweep — ~9,000 field evaluations at the default resolution
    — which is cheap enough to run on every drag frame and far too much to
    run on every render, hence the memo. The dependency is the balls array
    itself: `useToolState` replaces it on each edit, so identity is an
    honest signal here rather than a trap.
  */
  const mergedD = React.useMemo(
    () => mergedShapePath(state.balls, { gooeyness: state.gooeyness }),
    [state.balls, state.gooeyness],
  )

  const mergeSvg = React.useMemo(() => shapeSvg(mergedD), [mergedD])
  const mergeReact = React.useMemo(() => shapeReactComponent(mergedD, 'Blob'), [mergedD])
  const mergeCss = React.useMemo(() => shapeClipPathCss(mergedD), [mergedD])

  /** Move one circle. Kept stable so the stage does not re-bind on each drag frame. */
  const moveBall = React.useCallback(
    (id: number, x: number, y: number) =>
      setState((s) => ({ ...s, balls: s.balls.map((b) => (b.id === id ? { ...b, x, y } : b)) })),
    [setState],
  )

  const selectBall = React.useCallback(
    (id: number) => setState((s) => ({ ...s, selected: id })),
    [setState],
  )

  function patchSelected(patch: Partial<Metaball>) {
    update({
      balls: state.balls.map((b) => (b.id === state.selected ? { ...b, ...patch } : b)),
    })
  }

  function addBall() {
    // Ids are max+1 rather than length+1: removing the middle circle and
    // adding another would otherwise mint an id that is already taken, and
    // two circles sharing one would move together for no visible reason.
    const id = state.balls.reduce((max, b) => Math.max(max, b.id), 0) + 1
    update({
      balls: [...state.balls, { id, x: 50, y: 50, r: 14 }],
      selected: id,
    })
  }

  function removeBall() {
    // The last circle is not removable. An empty canvas has no shape, no
    // selection and no obvious way back, and "add one" is not a state a
    // tool should be able to strand someone in.
    if (state.balls.length <= 1) return
    const balls = state.balls.filter((b) => b.id !== state.selected)
    update({ balls, selected: balls[0].id })
  }

  function scatter() {
    update({
      balls: state.balls.map((b) => ({
        ...b,
        x: 25 + Math.random() * 50,
        y: 25 + Math.random() * 50,
        r: 10 + Math.random() * 12,
      })),
    })
  }

  const mergeExports = React.useMemo<DownloadAction[]>(
    () => [
      {
        label: 'SVG',
        title: 'The outline as a standalone SVG file',
        run: () => downloadText(mergeSvg, 'shape.svg', 'image/svg+xml'),
      },
      {
        label: 'PNG',
        title: 'Rasterised at 1024×1024, on a transparent ground',
        run: async () => {
          /*
            Rasterised from the export SVG, not from the stage.

            The stage carries the drag handles and a gradient that only ever
            existed to make the preview legible, and a PNG with dashed
            circles baked into it is not the artifact anyone asked for.
            Going through `shapeSvg` means the file is the same geometry the
            SVG and clip-path exports carry, filled flat in the first
            gradient stop so it is visible against anything.
          */
          const blob = await svgToPngBlob(shapeSvg(mergedD, state.gradFrom), 1024, 1024)
          if (!blob) return false
          downloadBlob(blob, 'shape.png')
        },
      },
    ],
    [mergeSvg, mergedD, state.gradFrom],
  )

  return (
    <ToolLayout
      name="Clip-path, Blob & Shape Magic"
      tagline="Polygon presets, organic blobs, and circles that merge into one shape"
      icon={<Shapes className="h-5 w-5" />}
    >
      <ToolWorkbench controlsWidth="380px">
        {/* Preview */}
        <div className="space-y-4">
          <div
            className="flex min-h-[400px] items-center justify-center rounded-xl border border-border p-8"
            style={CHECKER_STYLE}
          >
            {state.mode === 'presets' ? (
              <div
                className="h-[280px] w-[280px]"
                style={{ background: gradient, clipPath: polygon }}
              />
            ) : state.mode === 'merge' ? (
              <div className="h-[280px] w-[280px]">
                <ShapeStage
                  balls={state.balls}
                  d={mergedD}
                  selectedId={state.selected}
                  onSelect={selectBall}
                  onMove={moveBall}
                  from={state.gradFrom}
                  to={state.gradTo}
                />
              </div>
            ) : (
              <svg width={280} height={280} viewBox="0 0 100 100" role="img" aria-label="Blob preview">
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={state.gradFrom} />
                    <stop offset="100%" stopColor={state.gradTo} />
                  </linearGradient>
                </defs>
                <path d={blobD} fill={`url(#${gradientId})`} />
              </svg>
            )}
          </div>

          {/* Mode selector */}
          <div className="flex items-center gap-2">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => update({ mode: m })}
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

          {/* Per-mode output */}
          {state.mode === 'presets' && (
            <>
              <CopyCssCard code={polygonCss} title="CSS" language="css" />
              <CopyCssCard code={tailwindClass} title="Tailwind class" language="html" />
            </>
          )}
          {state.mode === 'blob' && (
            <>
              <CopyCssCard code={blobCss} title="CSS with clip-path" language="css" />
              <CopyCssCard code={blobSvg} title="SVG path" language="svg" />
            </>
          )}
          {state.mode === 'merge' && (
            <>
              {/*
                Four formats, in the order they are worth taking. The React
                component first because it is the one that stays editable
                and takes its colour from where it lands; the clip-path last
                because it is the one with a caveat attached.
              */}
              <CopyCssCard code={mergeReact} title="React component" language="tsx" />
              <CopyCssCard code={mergeSvg} title="SVG" language="svg" />
              <CopyCssCard code={mergeCss} title="CSS with clip-path" language="css" />
              <DownloadBar actions={mergeExports} />
            </>
          )}

          {/* No `brand`: the fill gradient is preview scaffolding, not an
              identity — the copied CSS carries no colour at all. */}
          <UseInCatalog tool={TOOL} />
        </div>

        {/* Controls */}
        <div className="space-y-5">
          {state.mode === 'presets' && (
            <>
              <div className="rounded-lg border border-border bg-card p-5">
                <Label className="mb-3 block text-sm font-medium">Shape</Label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectPreset(p)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-md border p-2.5 transition-colors',
                        state.presetId === p.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-muted',
                      )}
                      aria-pressed={state.presetId === p.id}
                    >
                      <span
                        className="block h-9 w-9"
                        style={{
                          background: gradient,
                          clipPath: polygonValue(
                            p.points(p.params[0]?.def ?? 0, p.params[1]?.def ?? 0),
                          ),
                        }}
                      />
                      <span className="text-[11px] leading-tight text-muted-foreground">
                        {p.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {preset.params.length > 0 && (
                <div className="space-y-4 rounded-lg border border-border bg-card p-5">
                  <Label className="block text-sm font-medium">{preset.name} parameters</Label>
                  {preset.params.map((param, i) => {
                    const key = i === 0 ? 'p1' : 'p2'
                    const value = i === 0 ? state.p1 : state.p2
                    return (
                      <SliderField
                        key={`${preset.id}-${key}`}
                        label={param.label}
                        description={param.description}
                        value={value}
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        display={`${value}${param.unit}`}
                        onChange={(v) => update({ [key]: v })}
                      />
                    )
                  })}
                </div>
              )}
            </>
          )}

          {state.mode === 'blob' && (
            <div className="space-y-4 rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Blob</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={regenerate}
                >
                  <Shuffle className="h-3 w-3" /> Regenerate
                </Button>
              </div>
              <SliderField
                label="Control points"
                description="How many points the curve passes through. Few points give a soft pebble; many give a wavy, coral-like edge."
                value={state.blobPoints}
                min={3}
                max={12}
                step={1}
                display={String(state.blobPoints)}
                onChange={(v) => update({ blobPoints: v })}
              />
              <SliderField
                label="Randomness"
                description="How far each point may wander from the circle. 0% is a perfect circle; high values get lumpy but never self-intersect."
                value={state.blobJitter}
                min={0}
                max={100}
                step={1}
                display={`${state.blobJitter}%`}
                onChange={(v) => update({ blobJitter: v })}
              />
              <p className="text-xs text-muted-foreground">
                The same seed always draws the same blob, so a shape you like survives a
                reload. Regenerate rolls a new one.
              </p>
            </div>
          )}

          {state.mode === 'merge' && (
            <div className="space-y-4 rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Circles</Label>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={scatter}
                  >
                    <Shuffle className="h-3 w-3" /> Scatter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={addBall}
                  >
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={removeBall}
                    disabled={state.balls.length <= 1}
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </Button>
                </div>
              </div>

              {/*
                The selector is a row of buttons rather than a dropdown: the
                canvas already shows which circle is which, and a menu that
                hides three items costs a click to tell you nothing.
              */}
              <div className="flex flex-wrap gap-1.5">
                {state.balls.map((ball, i) => (
                  <button
                    key={ball.id}
                    type="button"
                    onClick={() => selectBall(ball.id)}
                    aria-pressed={ball.id === state.selected}
                    className={cn(
                      'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                      ball.id === state.selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-muted',
                    )}
                  >
                    Circle {i + 1}
                  </button>
                ))}
              </div>

              <SliderField
                label="Blend"
                description="How far each circle's influence reaches. Low keeps them separate until they physically overlap; high grows a neck between circles that are some way apart."
                value={state.gooeyness}
                min={0}
                max={100}
                step={1}
                display={`${state.gooeyness}%`}
                onChange={(v) => update({ gooeyness: v })}
              />

              {/*
                X, Y and radius as sliders, not only as a drag.

                WCAG 2.2's 2.5.7 requires a non-drag route to anything a
                drag can do, and this is that route — alongside the arrow
                keys on the canvas handles themselves. It is also simply
                better for precision: nobody drags a circle to exactly 50.
              */}
              <SliderField
                label="Selected circle — across"
                description="Horizontal position in the 0–100 box the exported path is drawn in."
                value={selectedBall.x}
                min={0}
                max={100}
                step={1}
                display={String(Math.round(selectedBall.x))}
                onChange={(v) => patchSelected({ x: v })}
              />
              <SliderField
                label="Selected circle — down"
                description="Vertical position, measured from the top."
                value={selectedBall.y}
                min={0}
                max={100}
                step={1}
                display={String(Math.round(selectedBall.y))}
                onChange={(v) => patchSelected({ y: v })}
              />
              <SliderField
                label="Selected circle — radius"
                description="A lone circle keeps this radius exactly, whatever the blend is set to — so sizing and merging never fight each other."
                value={selectedBall.r}
                min={2}
                max={40}
                step={1}
                display={String(Math.round(selectedBall.r))}
                onChange={(v) => patchSelected({ r: v })}
              />

              <p className="text-xs text-muted-foreground">
                Drag a circle on the canvas, or focus one and use the arrow keys
                (hold Shift for bigger steps). The circles are scaffolding — what
                every export carries is the merged outline alone.
              </p>
            </div>
          )}

          {/* Common: fill gradient */}
          <div className="rounded-lg border border-border bg-card p-5">
            <Label className="mb-3 block text-sm font-medium">Fill gradient</Label>
            <div className="space-y-3">
              {(
                [
                  { key: 'gradFrom', label: 'From' },
                  { key: 'gradTo', label: 'To' },
                ] as const
              ).map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <Label className="w-10 text-xs text-muted-foreground">{label}</Label>
                  <input
                    type="color"
                    value={state[key]}
                    onChange={(e) => update({ [key]: e.target.value })}
                    className="h-8 w-9 cursor-pointer rounded border border-field bg-transparent"
                    aria-label={`Gradient ${label.toLowerCase()} color`}
                  />
                  <Input
                    value={state[key]}
                    onChange={(e) => update({ [key]: e.target.value })}
                    className="h-8 flex-1 font-mono text-xs"
                    aria-label={`Gradient ${label.toLowerCase()} colour, as a hex value`}
                  />
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Fill is preview-only — the copied CSS is just the clip, ready to apply to
              your own element or image.
            </p>
          </div>

          {/* After the controls, never before them — the ask lands once the
              shape exists rather than in front of it. */}
          <ToolPresetsBar tool={tool} noun="shape" />
        </div>
      </ToolWorkbench>
    </ToolLayout>
  )
}
