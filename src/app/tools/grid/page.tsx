'use client'

/**
 * CSS Grid Generator.
 *
 * Twenty tools on this site and not one of them touched layout. Every one
 * was paint (colour, gradient, shadow, radius, grain), type, or an asset —
 * which is the half of CSS you reach for once the boxes are already in the
 * right places. "css grid generator" is the most-searched CSS tool query
 * there is, and we answered it with nothing.
 *
 * The thing that makes grid worth a generator rather than a cheat sheet is
 * `grid-template-areas`. Track sizing you can hold in your head; an ASCII
 * map of a page layout you cannot, and the rule that every named area must
 * form one solid rectangle is the rule everybody breaks and nobody can see
 * they have broken — the property simply stops applying, silently, with no
 * console warning and no clue beyond "my layout is wrong". So the painter
 * here validates rectangularity on every stroke and names the area that
 * broke it, which is the one thing a hand-typed template string cannot do.
 *
 * Two authoring modes, because there are genuinely two grids people write:
 *
 *   Tracks      explicit columns and rows, the layout you designed.
 *   Responsive  repeat(auto-fit, minmax(X, 1fr)) — the card wall that
 *               reflows on its own with no media query. Four tokens long
 *               and almost nobody remembers the order.
 */

import * as React from 'react'
import { LayoutGrid, Plus, Trash2 } from 'lucide-react'

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
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { useToolState } from '@/hooks/use-tool-state'
import { cn } from '@/lib/utils'

const TOOL = '/tools/grid'

/* ------------------------------------------------------------------ tracks */

type TrackKind = 'fr' | 'px' | 'rem' | 'percent' | 'auto' | 'min' | 'max' | 'minmax'

interface Track {
  kind: TrackKind
  /** The number for the sized kinds. For `minmax` it is the fr on the max side. */
  value: number
  /** Floor in px, `minmax` only. */
  min: number
}

const TRACK_LABELS: Record<TrackKind, string> = {
  fr: 'fr — share of the leftover',
  px: 'px — fixed',
  rem: 'rem — fixed, scales with root',
  percent: '% — of the container',
  auto: 'auto — as big as it needs',
  min: 'min-content — as narrow as it can',
  max: 'max-content — as wide as it wants',
  minmax: 'minmax(px, fr) — floor, then flexible',
}

/** Trailing zeros in `1.00fr` read as precision that isn't there. */
function round(n: number): number {
  return Math.round(n * 100) / 100
}

function trackCss(t: Track): string {
  switch (t.kind) {
    case 'fr':
      return `${round(t.value)}fr`
    case 'px':
      return `${Math.round(t.value)}px`
    case 'rem':
      return `${round(t.value)}rem`
    case 'percent':
      return `${round(t.value)}%`
    case 'auto':
      return 'auto'
    case 'min':
      return 'min-content'
    case 'max':
      return 'max-content'
    case 'minmax':
      return `minmax(${Math.round(t.min)}px, ${round(t.value)}fr)`
  }
}

/**
 * `repeat()` collapses runs of identical tracks.
 *
 * A six-column grid written out is `1fr 1fr 1fr 1fr 1fr 1fr`, which is both
 * longer and worse at saying what it means than `repeat(6, 1fr)`. Runs of
 * three or more only — `repeat(2, 1fr)` is more characters than `1fr 1fr`.
 */
function tracksCss(tracks: Track[]): string {
  const parts = tracks.map(trackCss)
  const out: string[] = []
  let i = 0
  while (i < parts.length) {
    let run = 1
    while (i + run < parts.length && parts[i + run] === parts[i]) run++
    out.push(run >= 3 ? `repeat(${run}, ${parts[i]})` : parts.slice(i, i + run).join(' '))
    i += run
  }
  return out.join(' ')
}

/* ------------------------------------------------------------------- areas */

/**
 * A fixed palette of area names rather than free text.
 *
 * Free text means a text input per cell, and the whole point of the painter
 * is that a cell is assigned in one click. These are the names real page
 * layouts use; anyone who wants `promo-rail` renames it in the output they
 * were going to read anyway.
 */
const AREA_NAMES = ['header', 'sidebar', 'main', 'aside', 'footer', 'hero'] as const
type AreaName = (typeof AREA_NAMES)[number]

/** Distinct hues so a painted map is readable at a glance, in both themes. */
const AREA_TINT: Record<AreaName, string> = {
  header: 'bg-sky-500/25 text-sky-700 dark:text-sky-300 border-sky-500/40',
  sidebar: 'bg-violet-500/25 text-violet-700 dark:text-violet-300 border-violet-500/40',
  main: 'bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
  aside: 'bg-amber-500/25 text-amber-700 dark:text-amber-300 border-amber-500/40',
  footer: 'bg-rose-500/25 text-rose-700 dark:text-rose-300 border-rose-500/40',
  hero: 'bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 border-cyan-500/40',
}

/** `.` is grid's own token for "leave this cell empty". */
const EMPTY = '.'

/**
 * Which names fail the one rule `grid-template-areas` enforces.
 *
 * Every cell bearing a name must sit inside the solid bounding rectangle of
 * that name, with no gaps. An L-shape, or the same name in two disconnected
 * patches, makes the entire declaration invalid — the browser drops it and
 * every other area with it. That failure is silent, which is why this runs
 * on every stroke rather than on copy.
 */
function invalidAreas(areas: string[][]): string[] {
  const bad: string[] = []
  const names = new Set(areas.flat().filter((n) => n !== EMPTY))

  for (const name of names) {
    let top = Infinity
    let left = Infinity
    let bottom = -1
    let right = -1
    let count = 0

    areas.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (cell !== name) return
        count++
        top = Math.min(top, r)
        left = Math.min(left, c)
        bottom = Math.max(bottom, r)
        right = Math.max(right, c)
      }),
    )

    if (count !== (bottom - top + 1) * (right - left + 1)) bad.push(name)
  }
  return bad
}

/** Grow or shrink the painted map to match the current track counts. */
function fitAreas(areas: string[][], rows: number, cols: number): string[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => areas[r]?.[c] ?? EMPTY),
  )
}

function areasCss(areas: string[][], indent = '    '): string {
  return areas.map((row) => `${indent}"${row.join(' ')}"`).join('\n')
}

/* ------------------------------------------------------------------- state */

type Mode = 'tracks' | 'responsive'
type Fit = 'auto-fit' | 'auto-fill'
type ItemAlign = 'stretch' | 'start' | 'center' | 'end'
type ContentAlign =
  | 'stretch'
  | 'start'
  | 'center'
  | 'end'
  | 'space-between'
  | 'space-around'

interface GridState {
  mode: Mode
  cols: Track[]
  rows: Track[]
  colGap: number
  rowGap: number
  linkGaps: boolean
  justifyItems: ItemAlign
  alignItems: ItemAlign
  justifyContent: ContentAlign
  alignContent: ContentAlign
  /** Responsive mode: the floor each card refuses to go below. */
  minPx: number
  fit: Fit
  useAreas: boolean
  areas: string[][]
  /** Preview only — how many boxes to drop in when no areas are painted. */
  items: number
}

const DEFAULT_STATE: GridState = {
  mode: 'tracks',
  cols: [
    { kind: 'px', value: 240, min: 160 },
    { kind: 'fr', value: 1, min: 160 },
  ],
  rows: [
    { kind: 'auto', value: 1, min: 80 },
    { kind: 'fr', value: 1, min: 80 },
    { kind: 'auto', value: 1, min: 80 },
  ],
  colGap: 16,
  rowGap: 16,
  linkGaps: true,
  justifyItems: 'stretch',
  alignItems: 'stretch',
  justifyContent: 'stretch',
  alignContent: 'stretch',
  minPx: 220,
  fit: 'auto-fit',
  useAreas: true,
  areas: [
    ['header', 'header'],
    ['sidebar', 'main'],
    ['footer', 'footer'],
  ],
  items: 6,
}

/* -------------------------------------------------------------------- page */

export default function GridToolPage() {
  const tool = useToolState<GridState>(TOOL, DEFAULT_STATE)
  const { state, setState } = tool

  const update = (patch: Partial<GridState>) => setState((s) => ({ ...s, ...patch }))

  /** The name the painter paints with. */
  const [brush, setBrush] = React.useState<AreaName>('main')

  /*
    Areas are stored at whatever size they were painted, and the track
    editor can change the shape underneath them. Reconciling here rather
    than in every add/remove handler means there is one place that can get
    it wrong, and a preset saved at 3x2 opens correctly at any other shape.
  */
  const areas = React.useMemo(
    () => fitAreas(state.areas, state.rows.length, state.cols.length),
    [state.areas, state.rows.length, state.cols.length],
  )

  const areasOn = state.mode === 'tracks' && state.useAreas
  const broken = React.useMemo(() => (areasOn ? invalidAreas(areas) : []), [areas, areasOn])

  /** Names actually painted, in template order — the preview's item list. */
  const usedAreas = React.useMemo(() => {
    const seen: AreaName[] = []
    for (const row of areas) {
      for (const cell of row) {
        if (cell !== EMPTY && !seen.includes(cell as AreaName)) seen.push(cell as AreaName)
      }
    }
    return seen
  }, [areas])

  function paint(r: number, c: number, name: string) {
    const next = areas.map((row) => [...row])
    next[r][c] = name
    update({ areas: next })
  }

  const colGap = state.colGap
  const rowGap = state.linkGaps ? state.colGap : state.rowGap

  /*
    `min()` inside the minmax floor is not decoration.

    `minmax(220px, 1fr)` overflows its container the moment the container is
    narrower than 220px — a phone, or any nested column — because the floor
    is hard. `min(220px, 100%)` keeps the intent and drops the floor when
    there is genuinely less room than that, which is the fix most copies of
    this snippet on the web are missing.
  */
  const columnsCss =
    state.mode === 'responsive'
      ? `repeat(${state.fit}, minmax(min(${state.minPx}px, 100%), 1fr))`
      : tracksCss(state.cols)

  const rowsCss = state.mode === 'responsive' ? 'auto' : tracksCss(state.rows)

  /*
    Only non-default alignment reaches the output.

    A generator that emits `justify-items: stretch` teaches its reader the
    line is load-bearing when it is the initial value, and a block of eight
    properties where two matter is a block nobody reads.
  */
  const alignment: string[] = []
  if (state.justifyItems !== 'stretch') alignment.push(`justify-items: ${state.justifyItems};`)
  if (state.alignItems !== 'stretch') alignment.push(`align-items: ${state.alignItems};`)
  if (state.justifyContent !== 'stretch')
    alignment.push(`justify-content: ${state.justifyContent};`)
  if (state.alignContent !== 'stretch') alignment.push(`align-content: ${state.alignContent};`)

  const gapLine = colGap === rowGap ? `gap: ${rowGap}px;` : `gap: ${rowGap}px ${colGap}px;`

  const cssBlock = [
    '.layout {',
    '  display: grid;',
    `  grid-template-columns: ${columnsCss};`,
    state.mode === 'tracks' ? `  grid-template-rows: ${rowsCss};` : null,
    areasOn ? `  grid-template-areas:\n${areasCss(areas)};` : null,
    `  ${gapLine}`,
    ...alignment.map((line) => `  ${line}`),
    '}',
    areasOn && usedAreas.length
      ? '\n' + usedAreas.map((name) => `.${name} { grid-area: ${name}; }`).join('\n')
      : null,
  ]
    .filter(Boolean)
    .join('\n')

  const htmlBlock = areasOn
    ? `<div class="layout">\n${usedAreas
        .map((n) => `  <div class="${n}">${n}</div>`)
        .join('\n')}\n</div>`
    : `<div class="layout">\n${Array.from(
        { length: state.items },
        (_, i) => `  <div class="card">Item ${i + 1}</div>`,
      ).join('\n')}\n</div>`

  /*
    Tailwind arbitrary values, because three tools here already emit a
    Tailwind config and a grid written in utilities is the form most of this
    audience will paste. Underscores stand in for the spaces Tailwind cannot
    have inside a bracket.
  */
  const tailwind = [
    `grid grid-cols-[${columnsCss.replace(/\s+/g, '_')}]`,
    state.mode === 'tracks' && rowsCss !== 'auto'
      ? `grid-rows-[${rowsCss.replace(/\s+/g, '_')}]`
      : '',
    colGap === rowGap ? `gap-[${rowGap}px]` : `gap-x-[${colGap}px] gap-y-[${rowGap}px]`,
    state.justifyItems !== 'stretch' ? `justify-items-${state.justifyItems}` : '',
    state.alignItems !== 'stretch' ? `items-${state.alignItems}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  /* Preview -------------------------------------------------------------- */

  const previewStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: columnsCss,
    gridTemplateRows: state.mode === 'tracks' ? rowsCss : undefined,
    // A broken template is dropped by the browser anyway; passing it would
    // make the preview fall back silently and contradict the warning below.
    gridTemplateAreas:
      areasOn && broken.length === 0
        ? areas.map((r) => `"${r.join(' ')}"`).join(' ')
        : undefined,
    columnGap: colGap,
    rowGap,
    justifyItems: state.justifyItems,
    alignItems: state.alignItems,
    justifyContent: state.justifyContent === 'stretch' ? undefined : state.justifyContent,
    alignContent: state.alignContent === 'stretch' ? undefined : state.alignContent,
    minHeight: 340,
  }

  return (
    <ToolLayout
      name="CSS Grid Generator"
      tagline="Draw the layout, name the areas, copy the grid — with the rectangle rule checked as you paint"
      icon={<LayoutGrid className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {/* Live grid */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div style={previewStyle}>
              {areasOn
                ? usedAreas.map((name) => (
                    <div
                      key={name}
                      style={{ gridArea: name }}
                      className={cn(
                        'flex min-h-16 items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold',
                        AREA_TINT[name],
                      )}
                    >
                      .{name}
                    </div>
                  ))
                : Array.from({ length: state.items }, (_, i) => (
                    <div
                      key={i}
                      className="flex min-h-16 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary"
                    >
                      {i + 1}
                    </div>
                  ))}
            </div>
          </div>

          {broken.length > 0 ? (
            <p
              role="status"
              className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300"
            >
              <strong className="font-semibold">
                {broken.map((n) => `.${n}`).join(', ')}
              </strong>{' '}
              {broken.length === 1 ? 'is not a rectangle' : 'are not rectangles'}. Every
              cell with a name has to fill that name&rsquo;s bounding box — an L-shape,
              or two separate patches, makes the whole{' '}
              <code className="font-mono">grid-template-areas</code> invalid and the
              browser drops it without a word. The preview above is showing the grid
              without areas until this is fixed.
            </p>
          ) : null}

          <CopyCssCard code={cssBlock} title="CSS" language="css" />
          <CopyCssCard code={htmlBlock} title="HTML" language="html" />
          <CopyCssCard code={tailwind} title="Tailwind" language="html" />

          {/* No `brand`: a grid has no colour to hand the catalog. */}
          <UseInCatalog tool={TOOL} />
        </div>

        {/* Controls */}
        <div className="space-y-5">
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Kind of grid</Label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['tracks', 'Tracks', 'Columns and rows you name'],
                  ['responsive', 'Responsive', 'Cards that reflow themselves'],
                ] as const
              ).map(([value, label, hint]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update({ mode: value })}
                  aria-pressed={state.mode === value}
                  className={cn(
                    'rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    state.mode === value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/50',
                  )}
                >
                  <span className="block text-xs font-semibold">{label}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                    {hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {state.mode === 'responsive' ? (
            <div className="space-y-4 rounded-lg border border-border bg-card p-5">
              <Label className="block text-sm font-medium">The reflowing wall</Label>
              <SliderField
                label="Minimum card width"
                description="The floor a card refuses to go below. The browser fits as many as the container holds and shares the remainder — this one number replaces every breakpoint you would otherwise write."
                value={state.minPx}
                min={80}
                max={480}
                step={4}
                display={`${state.minPx}px`}
                onChange={(v) => update({ minPx: v })}
              />
              <div className="space-y-1.5">
                <Label htmlFor="grid-fit" className="text-xs font-semibold">
                  Empty tracks
                </Label>
                <Select value={state.fit} onValueChange={(v) => update({ fit: v as Fit })}>
                  <SelectTrigger id="grid-fit" aria-label="auto-fit or auto-fill">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto-fit">auto-fit — collapse them</SelectItem>
                    <SelectItem value="auto-fill">auto-fill — keep them</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  The only difference, and it only shows with fewer items than
                  columns: auto-fit collapses the empty tracks so the cards you have
                  stretch to fill the row; auto-fill holds them open and the cards
                  stay their natural width.
                </p>
              </div>
              <SliderField
                label="Preview items"
                description="Preview only — nothing here reaches the CSS. Drop it below the column count to see what auto-fit and auto-fill actually disagree about."
                value={state.items}
                min={1}
                max={16}
                step={1}
                display={String(state.items)}
                onChange={(v) => update({ items: v })}
              />
            </div>
          ) : (
            <>
              <TrackEditor
                title="Columns"
                tracks={state.cols}
                onChange={(cols) => update({ cols })}
              />
              <TrackEditor
                title="Rows"
                tracks={state.rows}
                onChange={(rows) => update({ rows })}
              />

              <div className="space-y-4 rounded-lg border border-border bg-card p-5">
                <Label className="block text-sm font-medium">Named areas</Label>
                <ToggleField
                  label="Paint a template"
                  description="Names the regions instead of counting line numbers, so a child says grid-area: sidebar and never has to know which column it landed in. Off, the grid just flows items in order."
                  checked={state.useAreas}
                  onChange={(v) => update({ useAreas: v })}
                />

                {state.useAreas ? (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {AREA_NAMES.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setBrush(name)}
                          aria-pressed={brush === name}
                          className={cn(
                            'rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            AREA_TINT[name],
                            brush === name ? 'ring-2 ring-ring ring-offset-1' : 'opacity-70',
                          )}
                        >
                          {name}
                        </button>
                      ))}
                    </div>

                    {/* The painter. One click assigns the brush; clicking a
                        cell that already holds the brush clears it, so the
                        eraser is the brush already in hand rather than a
                        seventh button. */}
                    <div
                      role="group"
                      aria-label="Area map"
                      className="grid gap-1"
                      style={{
                        gridTemplateColumns: `repeat(${state.cols.length}, minmax(0, 1fr))`,
                      }}
                    >
                      {areas.map((row, r) =>
                        row.map((cell, c) => {
                          const named = cell !== EMPTY
                          return (
                            <button
                              key={`${r}-${c}`}
                              type="button"
                              onClick={() => paint(r, c, cell === brush ? EMPTY : brush)}
                              aria-label={`Row ${r + 1}, column ${c + 1}: ${
                                named ? cell : 'empty'
                              }`}
                              className={cn(
                                'flex h-9 items-center justify-center rounded border px-1 text-[9px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                named
                                  ? AREA_TINT[cell as AreaName]
                                  : 'border-dashed border-border bg-muted/30 text-muted-foreground hover:bg-muted',
                              )}
                            >
                              {/* `truncate` rather than a slice: chopping to a
                                  fixed length rendered "sidebar" as "sideba",
                                  which reads as a typo rather than as an
                                  abbreviation. Ellipsis only when it has to. */}
                              <span className="truncate">{named ? cell : '·'}</span>
                            </button>
                          )
                        }),
                      )}
                    </div>
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      Click to paint with <span className="font-semibold">{brush}</span>;
                      click a painted cell again to clear it. The map follows the track
                      counts above.
                    </p>
                  </>
                ) : (
                  <SliderField
                    label="Preview items"
                    description="Preview only — how many boxes to flow into the grid so you can see where the tracks land."
                    value={state.items}
                    min={1}
                    max={16}
                    step={1}
                    display={String(state.items)}
                    onChange={(v) => update({ items: v })}
                  />
                )}
              </div>
            </>
          )}

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Gaps</Label>
            <SliderField
              label={state.linkGaps ? 'Gap' : 'Column gap'}
              description="The gutter between tracks. Grid gaps never collapse and never appear on the outside edge, which is the whole reason this replaced margins."
              value={state.colGap}
              min={0}
              max={64}
              step={1}
              display={`${state.colGap}px`}
              onChange={(v) => update({ colGap: v })}
            />
            {!state.linkGaps ? (
              <SliderField
                label="Row gap"
                description="Vertical gutter. Usually wants to be larger than the column gap when the rows carry text — horizontal space reads as separation faster than vertical does."
                value={state.rowGap}
                min={0}
                max={64}
                step={1}
                display={`${state.rowGap}px`}
                onChange={(v) => update({ rowGap: v })}
              />
            ) : null}
            <ToggleField
              label="Same in both directions"
              description="One value emits the short gap: 16px. Off, you get gap: row column — the same order as every other CSS shorthand."
              checked={state.linkGaps}
              onChange={(v) => update({ linkGaps: v })}
            />
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Alignment</Label>
            <p className="text-[11px] leading-snug text-muted-foreground">
              <span className="font-semibold text-foreground">items</span> moves each box
              inside its own cell.{' '}
              <span className="font-semibold text-foreground">content</span> moves the
              whole grid inside the container, and only does anything when the tracks add
              up to less than the space available.
            </p>
            <AlignSelect
              id="grid-ji"
              label="justify-items"
              hint="Horizontally, in the cell"
              value={state.justifyItems}
              options={['stretch', 'start', 'center', 'end']}
              onChange={(v) => update({ justifyItems: v as ItemAlign })}
            />
            <AlignSelect
              id="grid-ai"
              label="align-items"
              hint="Vertically, in the cell"
              value={state.alignItems}
              options={['stretch', 'start', 'center', 'end']}
              onChange={(v) => update({ alignItems: v as ItemAlign })}
            />
            <AlignSelect
              id="grid-jc"
              label="justify-content"
              hint="The whole grid, horizontally"
              value={state.justifyContent}
              options={['stretch', 'start', 'center', 'end', 'space-between', 'space-around']}
              onChange={(v) => update({ justifyContent: v as ContentAlign })}
            />
            <AlignSelect
              id="grid-ac"
              label="align-content"
              hint="The whole grid, vertically"
              value={state.alignContent}
              options={['stretch', 'start', 'center', 'end', 'space-between', 'space-around']}
              onChange={(v) => update({ alignContent: v as ContentAlign })}
            />
          </div>

          <ToolPresetsBar tool={tool} noun="layout" />
        </div>
      </div>
    </ToolLayout>
  )
}

/* --------------------------------------------------------------- fragments */

function AlignSelect({
  id,
  label,
  hint,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  hint: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="font-mono text-xs font-semibold">
          {label}
        </Label>
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/**
 * One axis of tracks: a row per track, with the unit as a select and the
 * number as an input, plus add and remove.
 *
 * A number input rather than a slider, because track sizes are values people
 * arrive with — 240px, 2fr — not values dialled in by feel, and a slider per
 * track would be twelve sliders on a six-column grid.
 */
function TrackEditor({
  title,
  tracks,
  onChange,
}: {
  title: string
  tracks: Track[]
  onChange: (tracks: Track[]) => void
}) {
  const noun = title.toLowerCase().replace(/s$/, '')
  const sized = (kind: TrackKind) => kind !== 'auto' && kind !== 'min' && kind !== 'max'

  function patch(index: number, next: Partial<Track>) {
    onChange(tracks.map((t, i) => (i === index ? { ...t, ...next } : t)))
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <Label className="block text-sm font-medium">{title}</Label>
        <span className="text-[11px] text-muted-foreground">{tracks.length}</span>
      </div>

      <ul className="space-y-2">
        {tracks.map((track, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span className="w-4 shrink-0 text-center font-mono text-[10px] text-muted-foreground">
              {i + 1}
            </span>
            {sized(track.kind) ? (
              <input
                type="number"
                aria-label={`${title} ${i + 1} size`}
                value={track.value}
                min={0}
                step={track.kind === 'px' ? 8 : 0.5}
                onChange={(e) => patch(i, { value: Number(e.target.value) || 0 })}
                className="h-9 w-16 shrink-0 rounded-md border border-border bg-background px-2 font-mono text-xs tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            ) : null}
            <Select
              value={track.kind}
              onValueChange={(v) => patch(i, { kind: v as TrackKind })}
            >
              <SelectTrigger
                aria-label={`${title} ${i + 1} unit`}
                className="h-9 min-w-0 flex-1 text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TRACK_LABELS) as TrackKind[]).map((kind) => (
                  <SelectItem key={kind} value={kind} className="text-xs">
                    {TRACK_LABELS[kind]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground"
              // One track is the floor: a grid with no columns has nothing
              // to show, and removing the last is never what was meant.
              disabled={tracks.length <= 1}
              onClick={() => onChange(tracks.filter((_, j) => j !== i))}
              aria-label={`Remove ${noun} ${i + 1}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>

      {/* The minmax floor lives here rather than inline: it is a second
          number on one track out of six, and giving every row room for it
          would cost every row the width. */}
      {tracks.some((t) => t.kind === 'minmax') ? (
        <div className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3">
          {tracks.map((track, i) =>
            track.kind === 'minmax' ? (
              <div key={i} className="flex items-center gap-2">
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {i + 1} floor
                </span>
                <input
                  type="number"
                  aria-label={`${title} ${i + 1} minimum in px`}
                  value={track.min}
                  min={0}
                  step={8}
                  onChange={(e) => patch(i, { min: Number(e.target.value) || 0 })}
                  className="h-8 w-20 rounded-md border border-border bg-background px-2 font-mono text-xs tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span className="text-[10px] text-muted-foreground">px</span>
              </div>
            ) : null,
          )}
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full gap-1.5"
        // Twelve is the classic layout grid, and well past the point where a
        // painted area map stays readable at this width.
        disabled={tracks.length >= 12}
        onClick={() => onChange([...tracks, { kind: 'fr', value: 1, min: 160 }])}
      >
        <Plus className="h-3.5 w-3.5" /> Add {noun}
      </Button>
    </div>
  )
}
