'use client'

/**
 * Flexbox Playground.
 *
 * The companion to the grid generator, and the other half of the layout gap
 * this section had. Flexbox does not need a *generator* the way grid does —
 * there is no template string to author — but it badly needs a playground,
 * because the properties are not the hard part. The hard part is that three
 * of them interact and the interaction is invisible:
 *
 *   `flex: 1` is not `flex-grow: 1`. It is `1 1 0%`, and the `0%` basis is
 *   what makes items equal width regardless of content. `flex-grow: 1` on
 *   its own keeps `basis: auto`, so items stay content-sized and merely
 *   share the *leftover* — which is why "flex: 1 makes them equal but
 *   flex-grow: 1 doesn't" is the single most common flexbox confusion.
 *
 *   A flex item will not shrink below its content's `min-content` size,
 *   because `min-width` computes to `auto` on flex items rather than `0`.
 *   Long unbroken text therefore blows out the row and nothing in the flex
 *   properties explains it. The fix is `min-width: 0`, and the tool offers
 *   it as a control so the overflow can be produced and then cured.
 *
 * So this shows the resolved shorthand alongside the controls, and calls
 * both traps out where they happen rather than in a paragraph nobody reads.
 */

import * as React from 'react'
import { Plus, StretchVertical, Trash2 } from 'lucide-react'

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

const TOOL = '/tools/flexbox'

type Direction = 'row' | 'row-reverse' | 'column' | 'column-reverse'
type Wrap = 'nowrap' | 'wrap' | 'wrap-reverse'
type Justify =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly'
type Align = 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline'
type AlignContent = Align | 'space-between' | 'space-around'
type SelfAlign = 'auto' | Align
/** `auto` is the initial value and means "my content's size". */
type BasisUnit = 'auto' | 'px' | 'percent' | 'content'

interface Item {
  id: number
  grow: number
  shrink: number
  basisUnit: BasisUnit
  basisValue: number
  order: number
  alignSelf: SelfAlign
  /** How much text the box carries — the only thing that makes basis visible. */
  words: number
}

interface FlexState {
  direction: Direction
  wrap: Wrap
  justifyContent: Justify
  alignItems: Align
  alignContent: AlignContent
  gap: number
  rowGap: number
  linkGaps: boolean
  /** Squeezes the container so shrink and wrap have something to do. */
  width: number
  /** `min-width: 0` on every item — the cure for the overflow trap. */
  minWidthZero: boolean
  items: Item[]
  selected: number
}

const LOREM = [
  'Flex',
  'items',
  'refuse',
  'to',
  'shrink',
  'below',
  'their',
  'content',
  'unless',
  'you',
  'tell',
  'them',
  'they',
  'may',
]

function makeItem(id: number): Item {
  return {
    id,
    grow: 0,
    shrink: 1,
    basisUnit: 'auto',
    basisValue: 200,
    order: 0,
    alignSelf: 'auto',
    words: 2,
  }
}

const DEFAULT_STATE: FlexState = {
  direction: 'row',
  wrap: 'nowrap',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  alignContent: 'stretch',
  gap: 12,
  rowGap: 12,
  linkGaps: true,
  width: 100,
  minWidthZero: false,
  items: [makeItem(1), makeItem(2), makeItem(3)],
  selected: 1,
}

function basisCss(item: Item): string {
  switch (item.basisUnit) {
    case 'auto':
      return 'auto'
    case 'content':
      return 'content'
    case 'px':
      return `${Math.round(item.basisValue)}px`
    case 'percent':
      return `${Math.round(item.basisValue)}%`
  }
}

/**
 * The shorthand, written the way the browser resolves it.
 *
 * `flex` is emitted rather than the three longhands because the shorthand
 * is what people write, and because the two famous keyword forms are worth
 * naming: `flex: 1` and `flex: auto` both look like grow settings and only
 * one of them equalises. Anything that is not one of those keywords prints
 * as the explicit triple, which is always correct and never surprising.
 */
function flexShorthand(item: Item): string {
  const basis = basisCss(item)
  if (item.grow === 1 && item.shrink === 1 && basis === '0%') return '1'
  if (item.grow === 1 && item.shrink === 1 && basis === 'auto') return 'auto'
  if (item.grow === 0 && item.shrink === 1 && basis === 'auto') return 'initial'
  if (item.grow === 0 && item.shrink === 0 && basis === 'auto') return 'none'
  return `${item.grow} ${item.shrink} ${basis}`
}

const DEFAULT_ITEM = makeItem(0)

/** Whether an item says anything the container has not already said. */
function itemIsDefault(item: Item): boolean {
  return (
    item.grow === DEFAULT_ITEM.grow &&
    item.shrink === DEFAULT_ITEM.shrink &&
    item.basisUnit === DEFAULT_ITEM.basisUnit &&
    item.order === 0 &&
    item.alignSelf === 'auto'
  )
}

export default function FlexboxToolPage() {
  const tool = useToolState<FlexState>(TOOL, DEFAULT_STATE)
  const { state, setState } = tool

  const update = (patch: Partial<FlexState>) => setState((s) => ({ ...s, ...patch }))

  const rowGap = state.linkGaps ? state.gap : state.rowGap

  function patchItem(id: number, next: Partial<Item>) {
    update({ items: state.items.map((it) => (it.id === id ? { ...it, ...next } : it)) })
  }

  const selected =
    state.items.find((it) => it.id === state.selected) ?? state.items[0] ?? DEFAULT_ITEM

  /*
    Only non-initial container properties reach the output — the same rule
    the grid generator follows. `display: flex` and the gap always print;
    everything else earns its line.
  */
  const containerLines = [
    'display: flex;',
    state.direction !== 'row' ? `flex-direction: ${state.direction};` : null,
    state.wrap !== 'nowrap' ? `flex-wrap: ${state.wrap};` : null,
    state.justifyContent !== 'flex-start'
      ? `justify-content: ${state.justifyContent};`
      : null,
    state.alignItems !== 'stretch' ? `align-items: ${state.alignItems};` : null,
    // align-content only does anything on a wrapped container with more
    // than one line, so emitting it on `nowrap` would be a line that can
    // never fire.
    state.wrap !== 'nowrap' && state.alignContent !== 'stretch'
      ? `align-content: ${state.alignContent};`
      : null,
    state.gap === rowGap ? `gap: ${state.gap}px;` : `gap: ${rowGap}px ${state.gap}px;`,
  ].filter(Boolean) as string[]

  const itemBlocks = state.items
    .map((item, index) => {
      if (itemIsDefault(item) && !state.minWidthZero) return null
      const lines = [
        itemIsDefault(item) ? null : `  flex: ${flexShorthand(item)};`,
        item.order !== 0 ? `  order: ${item.order};` : null,
        item.alignSelf !== 'auto' ? `  align-self: ${item.alignSelf};` : null,
        state.minWidthZero
          ? `  min-width: 0; /* lets it shrink past its content */`
          : null,
      ].filter(Boolean)
      return lines.length ? `.item-${index + 1} {\n${lines.join('\n')}\n}` : null
    })
    .filter(Boolean)

  const cssBlock = [
    `.row {\n${containerLines.map((l) => `  ${l}`).join('\n')}\n}`,
    ...itemBlocks,
  ].join('\n\n')

  const htmlBlock = `<div class="row">\n${state.items
    .map((_, i) => `  <div class="item-${i + 1}">Item ${i + 1}</div>`)
    .join('\n')}\n</div>`

  const tailwind = [
    'flex',
    state.direction === 'row-reverse'
      ? 'flex-row-reverse'
      : state.direction === 'column'
        ? 'flex-col'
        : state.direction === 'column-reverse'
          ? 'flex-col-reverse'
          : '',
    state.wrap === 'wrap' ? 'flex-wrap' : state.wrap === 'wrap-reverse' ? 'flex-wrap-reverse' : '',
    state.justifyContent !== 'flex-start'
      ? `justify-${state.justifyContent.replace('flex-', '').replace('space-', '')}`
      : '',
    state.alignItems !== 'stretch' ? `items-${state.alignItems.replace('flex-', '')}` : '',
    state.gap === rowGap ? `gap-[${state.gap}px]` : `gap-x-[${state.gap}px] gap-y-[${rowGap}px]`,
  ]
    .filter(Boolean)
    .join(' ')

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: state.direction,
    flexWrap: state.wrap,
    justifyContent: state.justifyContent,
    alignItems: state.alignItems,
    alignContent: state.alignContent,
    columnGap: state.gap,
    rowGap,
    width: `${state.width}%`,
    minHeight: 260,
  }

  return (
    <ToolLayout
      name="Flexbox Playground"
      tagline="Every flex property against a live row — including the two that look like grow settings and are not"
      icon={<StretchVertical className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {/* The row. The dashed rail is the container: without a visible
              edge, justify-content and the width slider both look like they
              are doing nothing. */}
          <div className="overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-3">
              <div style={containerStyle}>
                {state.items.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => update({ selected: item.id })}
                    aria-pressed={item.id === state.selected}
                    style={{
                      flexGrow: item.grow,
                      flexShrink: item.shrink,
                      flexBasis: basisCss(item),
                      order: item.order,
                      alignSelf: item.alignSelf === 'auto' ? undefined : item.alignSelf,
                      minWidth: state.minWidthZero ? 0 : undefined,
                    }}
                    className={cn(
                      'overflow-hidden rounded-lg border px-3 py-3 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      item.id === state.selected
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-border bg-background hover:bg-muted/60',
                    )}
                  >
                    <span className="block font-semibold">Item {index + 1}</span>
                    <span className="mt-0.5 block font-mono text-[10px] opacity-70">
                      flex: {flexShorthand(item)}
                    </span>
                    {item.words > 0 ? (
                      <span className="mt-1 block text-[11px] leading-snug opacity-80">
                        {LOREM.slice(0, item.words).join(' ')}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Click a box to edit it. The dashed rail is the flex container —{' '}
              {state.width}% of the space available.
            </p>
          </div>

          <CopyCssCard code={cssBlock} title="CSS" language="css" />
          <CopyCssCard code={htmlBlock} title="HTML" language="html" />
          <CopyCssCard code={tailwind} title="Tailwind (container)" language="html" />

          <UseInCatalog tool={TOOL} />
        </div>

        {/* Controls */}
        <div className="space-y-5">
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Container</Label>
            <Row
              id="flex-dir"
              label="flex-direction"
              hint="Which way the main axis runs"
              value={state.direction}
              options={['row', 'row-reverse', 'column', 'column-reverse']}
              onChange={(v) => update({ direction: v as Direction })}
            />
            <Row
              id="flex-wrap"
              label="flex-wrap"
              hint="What happens when they run out of room"
              value={state.wrap}
              options={['nowrap', 'wrap', 'wrap-reverse']}
              onChange={(v) => update({ wrap: v as Wrap })}
            />
            <Row
              id="flex-jc"
              label="justify-content"
              hint="Along the main axis"
              value={state.justifyContent}
              options={[
                'flex-start',
                'flex-end',
                'center',
                'space-between',
                'space-around',
                'space-evenly',
              ]}
              onChange={(v) => update({ justifyContent: v as Justify })}
            />
            <Row
              id="flex-ai"
              label="align-items"
              hint="Across the cross axis"
              value={state.alignItems}
              options={['stretch', 'flex-start', 'flex-end', 'center', 'baseline']}
              onChange={(v) => update({ alignItems: v as Align })}
            />
            <Row
              id="flex-ac"
              label="align-content"
              hint="The wrapped lines as a group"
              value={state.alignContent}
              options={[
                'stretch',
                'flex-start',
                'flex-end',
                'center',
                'space-between',
                'space-around',
              ]}
              onChange={(v) => update({ alignContent: v as AlignContent })}
              // Not merely ignored — there is only ever one line to align.
              disabled={state.wrap === 'nowrap'}
              disabledHint="Needs flex-wrap: wrap — with one line there is nothing to distribute."
            />
            <SliderField
              label={state.linkGaps ? 'Gap' : 'Column gap'}
              description="Space between items. Flex gaps do not collapse and do not appear on the outside edge, so this is not the same as a margin on every child."
              value={state.gap}
              min={0}
              max={64}
              step={1}
              display={`${state.gap}px`}
              onChange={(v) => update({ gap: v })}
            />
            {!state.linkGaps ? (
              <SliderField
                label="Row gap"
                description="Between wrapped lines. Only visible once flex-wrap is on and the items actually wrap."
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
              description="One value emits the short gap: 12px. Off, you get gap: row column."
              checked={state.linkGaps}
              onChange={(v) => update({ linkGaps: v })}
            />
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <Label className="block text-sm font-medium">
                Item {state.items.findIndex((it) => it.id === selected.id) + 1}
              </Label>
              <span className="font-mono text-[11px] text-muted-foreground">
                flex: {flexShorthand(selected)}
              </span>
            </div>

            <SliderField
              label="flex-grow"
              description="Share of the leftover space this item claims. Zero means it never gets any. Two items at 1 and 2 split the surplus one-third / two-thirds — the ratio is between siblings, not a multiplier on the item."
              value={selected.grow}
              min={0}
              max={5}
              step={1}
              display={String(selected.grow)}
              onChange={(v) => patchItem(selected.id, { grow: v })}
            />
            <SliderField
              label="flex-shrink"
              description="How readily it gives space back when the row overflows. One is the default, which is why items you never touched still get squeezed. Zero pins the width and pushes the overflow onto everyone else."
              value={selected.shrink}
              min={0}
              max={5}
              step={1}
              display={String(selected.shrink)}
              onChange={(v) => patchItem(selected.id, { shrink: v })}
            />

            <div className="space-y-1.5">
              <Label htmlFor="flex-basis" className="font-mono text-xs font-semibold">
                flex-basis
              </Label>
              <div className="flex gap-2">
                <Select
                  value={selected.basisUnit}
                  onValueChange={(v) => patchItem(selected.id, { basisUnit: v as BasisUnit })}
                >
                  <SelectTrigger id="flex-basis" aria-label="flex-basis unit" className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">auto — my content</SelectItem>
                    <SelectItem value="px">px</SelectItem>
                    <SelectItem value="percent">%</SelectItem>
                    <SelectItem value="content">content</SelectItem>
                  </SelectContent>
                </Select>
                {selected.basisUnit === 'px' || selected.basisUnit === 'percent' ? (
                  <input
                    type="number"
                    aria-label="flex-basis value"
                    value={selected.basisValue}
                    min={0}
                    step={selected.basisUnit === 'px' ? 10 : 5}
                    onChange={(e) =>
                      patchItem(selected.id, { basisValue: Number(e.target.value) || 0 })
                    }
                    className="h-9 w-20 rounded-md border border-border bg-background px-2 font-mono text-xs tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                ) : null}
              </div>
              <p className="text-[11px] leading-snug text-muted-foreground">
                The size it starts from, before grow and shrink argue about the
                rest. This is the property behind the most common flexbox
                surprise:{' '}
                <code className="font-mono">flex: 1</code> means{' '}
                <code className="font-mono">1 1 0%</code> and makes items{' '}
                <em>equal</em>, while <code className="font-mono">flex-grow: 1</code>{' '}
                alone leaves the basis at <code className="font-mono">auto</code> and
                only shares out the <em>surplus</em>, so wordier items stay wider.
                Set 0% here to see them equalise.
              </p>
              {/* One click to the setting the paragraph just described. */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  patchItem(selected.id, { grow: 1, shrink: 1, basisUnit: 'percent', basisValue: 0 })
                }
              >
                Set this item to <code className="mx-1 font-mono">flex: 1</code>
              </Button>
            </div>

            <SliderField
              label="order"
              description="Moves the item without moving the markup. Negative pulls it earlier. Worth knowing that this reorders paint only — tab order and screen readers still follow the DOM, so a visual order that contradicts the source is a real accessibility bug."
              value={selected.order}
              min={-3}
              max={3}
              step={1}
              display={String(selected.order)}
              onChange={(v) => patchItem(selected.id, { order: v })}
            />
            <Row
              id="flex-self"
              label="align-self"
              hint="Overrides align-items, for this one"
              value={selected.alignSelf}
              options={['auto', 'stretch', 'flex-start', 'flex-end', 'center', 'baseline']}
              onChange={(v) => patchItem(selected.id, { alignSelf: v as SelfAlign })}
            />
            <SliderField
              label="Content length"
              description="Preview only. How many words this box carries — the only thing that makes a basis of auto look different from a basis of zero."
              value={selected.words}
              min={0}
              max={12}
              step={1}
              display={`${selected.words} word${selected.words === 1 ? '' : 's'}`}
              onChange={(v) => patchItem(selected.id, { words: v })}
            />
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">The room they have</Label>
            <SliderField
              label="Container width"
              description="Preview only. Narrow it until the row overflows — that is where flex-shrink, flex-wrap and the min-width trap below all start to matter."
              value={state.width}
              min={25}
              max={100}
              step={1}
              display={`${state.width}%`}
              onChange={(v) => update({ width: v })}
            />
            <ToggleField
              label="min-width: 0 on every item"
              description="The cure for the overflow nobody can explain: min-width computes to auto on a flex item, not zero, so an item will not shrink below its longest unbreakable word no matter what flex-shrink says. Narrow the container above with this off, then turn it on."
              checked={state.minWidthZero}
              onChange={(v) => update({ minWidthZero: v })}
            />
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <Label className="block text-sm font-medium">Items</Label>
              <span className="text-[11px] text-muted-foreground">{state.items.length}</span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                disabled={state.items.length >= 10}
                onClick={() => {
                  const id = Math.max(0, ...state.items.map((i) => i.id)) + 1
                  update({ items: [...state.items, makeItem(id)], selected: id })
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-muted-foreground"
                // Two is the floor: one item cannot demonstrate a single
                // property on this page.
                disabled={state.items.length <= 2}
                onClick={() => {
                  const items = state.items.filter((it) => it.id !== selected.id)
                  update({ items, selected: items[items.length - 1]?.id ?? 1 })
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </Button>
            </div>
          </div>

          <ToolPresetsBar tool={tool} noun="row" />
        </div>
      </div>
    </ToolLayout>
  )
}

/** A labelled select with the property name in mono and a plain-English hint. */
function Row({
  id,
  label,
  hint,
  value,
  options,
  onChange,
  disabled,
  disabledHint,
}: {
  id: string
  label: string
  hint: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
  disabled?: boolean
  disabledHint?: string
}) {
  return (
    <div className={cn('space-y-1.5', disabled && 'opacity-60')}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="font-mono text-xs font-semibold">
          {label}
        </Label>
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      </div>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
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
      {disabled && disabledHint ? (
        <p className="text-[11px] leading-snug text-muted-foreground">{disabledHint}</p>
      ) : null}
    </div>
  )
}
