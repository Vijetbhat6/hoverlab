'use client'

/**
 * The two-column shell every Designer Tool uses: preview on the left,
 * controls on the right.
 *
 * It exists because that shell was written out by hand 25 times as
 *
 *   <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
 *
 * and not one of those 25 copies pinned anything. Measured on the running
 * app at 1440x900: by the time you have scrolled far enough to reach the
 * last control, the preview is 0% visible on 16 of 20 tools — you are
 * dragging a slider while the thing it changes is off the top of the
 * screen. At 390x844 the columns stack, so it is 19 of 20, and on
 * /tools/tokens the control panel is 5,718px tall against a 588px preview.
 *
 * Two different problems, because the two breakpoints fail differently:
 *
 *  - Wide: both columns scroll together and the short one leaves first.
 *    Pinning the preview column fixes it outright. `self-start` is the
 *    part that matters — grid items stretch by default, and a stretched
 *    item is already as tall as its row, so `sticky` has no travel to do
 *    and silently does nothing.
 *
 *  - Narrow: there is no second column to pin. So once the real preview
 *    has scrolled past the header, a condensed copy of it takes over in a
 *    strip below the header, and hands back when you scroll up again.
 *
 * The strip itself is <StageStrip>, which is deliberately not part of this
 * component: the playground needs the same strip without the same grid —
 * its preview lives inside an editor card and its sliders in a separate
 * column — so the two halves of the fix are separable.
 */

import * as React from 'react'

import { cn } from '@/lib/utils'
import { StageStrip, STAGE_ATTR } from '@/components/designer-tools/stage-strip'

export interface ToolWorkbenchProps {
  /**
   * Exactly two children, in the order they appear on the page. This
   * mirrors the markup it replaces, so adopting it in a tool page is a
   * two-line change rather than a rewrite.
   */
  children: React.ReactNode
  /**
   * Which side the preview is on, and therefore which child is which.
   * The tools split roughly evenly into `1fr_380px` (preview left) and
   * `380px_1fr` (preview right), and the two fail differently when
   * stacked: preview-left puts the output above the fold and the controls
   * below it, preview-right does the reverse and hides the output from
   * the moment the page loads.
   */
  previewSide?: 'left' | 'right'
  /**
   * Width of the controls column at `lg` and up. Tools were already
   * choosing between 280 and 420px; keeping that as a prop avoids
   * re-tuning thirty layouts to prove a point about consistency.
   */
  controlsWidth?: string
  className?: string
}

export function ToolWorkbench({
  children,
  previewSide = 'left',
  controlsWidth = '380px',
  className,
}: ToolWorkbenchProps) {
  const [first, second] = React.Children.toArray(children)
  const preview = previewSide === 'left' ? first : second
  const controls = previewSide === 'left' ? second : first

  const stage = firstElement(preview)
  const markedPreview = markStage(preview)

  return (
    <div className={cn('relative', className)}>
      {/*
        The strip lives here, as a child of the whole workbench rather than
        of the preview column, so it stays pinned for the entire length of
        the controls instead of scrolling away with the column it stands in
        for. Narrowed to the preview column's width so it does not band
        across the page on a wide screen.
      */}
      <StageStrip
        stage={stage}
        maxWidth={`calc(100% - ${controlsWidth} - 1.5rem)`}
        alignRight={previewSide === 'right'}
      />

      {/*
        `self-start` un-stretches the preview column so sticky has somewhere
        to travel; `max-h` plus `overflow-y-auto` keeps the tall previews
        (typography at 2,737px, easing at 1,148px) reachable instead of
        pinning their tops and stranding their bottoms below the fold
        permanently.
      */}
      <div
        className={cn(
          'grid grid-cols-1 gap-6',
          previewSide === 'left'
            ? 'lg:grid-cols-[minmax(0,1fr)_var(--tool-controls)]'
            : 'lg:grid-cols-[var(--tool-controls)_minmax(0,1fr)]',
        )}
        style={{ '--tool-controls': controlsWidth } as React.CSSProperties}
      >
        {previewSide === 'right' ? <div className="min-w-0">{controls}</div> : null}
        <div
          className={cn(
            'min-w-0 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain',
            // Stacked, the preview goes first whichever column it is in.
            //
            // The controls-first tools used to stack controls-first too,
            // which put the output below a wall of sliders — you scrolled
            // down to see what you had made. The strip cannot cover that
            // case: at the top of the page the rail has not reached its
            // pin point, so drawing it there floats a card over the first
            // controls rather than under the header. Showing the preview
            // first is the fix the strip was standing in for.
            previewSide === 'right' && 'order-first lg:order-none',
          )}
        >
          {markedPreview}
        </div>
        {previewSide === 'left' ? <div className="min-w-0">{controls}</div> : null}
      </div>
    </div>
  )
}

/**
 * The stage to copy into the strip: the preview column's first element.
 *
 * Every tool page writes its preview column as a `space-y-*` stack whose
 * first item is the visual output and whose later items are mode
 * switches and a CSS card. Only the first belongs in a 132px strip.
 *
 * A column that is not a plain element with children (a fragment, a
 * component) has no first element to reach for, so the whole column is
 * used and the scale-to-fit handles the rest.
 */
function firstElement(column: React.ReactNode): React.ReactNode {
  if (!React.isValidElement(column)) return column
  const children = (column.props as { children?: React.ReactNode }).children
  const items = React.Children.toArray(children)
  const first = items[stageIndex(items)]
  return first ?? column
}

/**
 * Tags that occupy no space and show nothing, so cannot be the stage.
 *
 * The scrollbar tool opens its preview column with
 * `<style>{previewCss}</style>` — the custom scrollbar rules have to be
 * real CSS for the preview to be honest about what ships. Taking "the
 * first element" literally picked that, so the observer watched a 0x0 node
 * that is never visible and therefore never triggered, and the strip would
 * have rendered a copy of a stylesheet.
 */
const INVISIBLE_TAGS = new Set(['style', 'script', 'link', 'meta', 'template', 'title'])

/** Index of the first child that can actually be seen. */
function stageIndex(items: React.ReactNode[]): number {
  return items.findIndex(
    (child) =>
      React.isValidElement(child) &&
      !(typeof child.type === 'string' && INVISIBLE_TAGS.has(child.type)),
  )
}

/**
 * The same column, with its stage tagged so the observers can find that
 * element in the DOM rather than the column wrapping it.
 *
 * This is not cosmetic. Watching the wrapper is what the first version
 * did, and on /tools/tokens the wrapper is 5,453px tall — so "the preview
 * has left the screen" only became true long after the preview had left
 * the screen, and the strip was scaled to fit a box forty times the size
 * of the thing being drawn in it.
 */
function markStage(column: React.ReactNode): React.ReactNode {
  if (!React.isValidElement(column)) return column
  const children = (column.props as { children?: React.ReactNode }).children
  const items = React.Children.toArray(children)
  const index = stageIndex(items)
  if (index === -1) return column

  const child = items[index] as React.ReactElement<Record<string, unknown>>

  /*
    Clone only what will actually carry the attribute.

    `cloneElement` puts a prop on an element; whether that prop reaches
    the DOM is up to what the element renders. A host element like `<div>`
    passes unknown attributes straight through, but a Fragment has no DOM
    node to put it on and React drops it silently — which is how the svg
    and contrast tools ended up with no marker at all, and therefore an
    observer watching nothing and a strip that could never appear. The
    same is true of any component that does not spread its props.

    So anything that is not a host element gets a plain wrapper instead.
    That is two of the thirty-one tools, and a bare `<div>` inside a
    `space-y-*` stack changes nothing about how it lays out.
  */
  const marked =
    typeof child.type === 'string' ? (
      React.cloneElement(child, { [STAGE_ATTR]: '' })
    ) : (
      <div {...{ [STAGE_ATTR]: '' }}>{child}</div>
    )
  return React.cloneElement(
    column as React.ReactElement<{ children?: React.ReactNode }>,
    undefined,
    ...items.map((child, i) => (i === index ? marked : child)),
  )
}
