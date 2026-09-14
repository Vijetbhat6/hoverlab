'use client'

/**
 * The editing surface for /builder — the outline, the canvas, and dragging.
 *
 * ── WHAT CHANGED, AND WHAT DID NOT ──────────────────────────────────────
 *
 * `/compare` conceded the Composition row to React Bits and Shadcnblocks
 * because theirs drag and ours had two arrows. This is the drag. What it
 * deliberately did not change is where a composition lives: a drop calls
 * `moveTo` and navigates to the result, exactly as the arrows always did.
 * There is still one source of truth and it is still the URL, so the back
 * button is still an undo stack — including for gestures, which is a
 * property the obvious client-state build would have had to add back.
 *
 * ── WHY THE ARROWS ARE STILL HERE ───────────────────────────────────────
 *
 * Not as a fallback nobody uses. HTML5 drag-and-drop has no keyboard
 * interface at all — `dragstart` fires from a pointer and nothing else —
 * so a builder whose only reorder is a drag cannot be operated without a
 * mouse. The arrow links ARE the keyboard interface, they are real
 * navigations, and they work with JavaScript switched off. Dragging is the
 * faster way to say the same thing, not the only way.
 *
 * ── THE OPTIMISTIC ORDER, AND WHY IT IS INDICES ─────────────────────────
 *
 * Every edit is a server round trip, which is the right trade for a control
 * clicked a handful of times and the wrong one for a gesture: releasing the
 * pointer and watching the row spring back for 200ms before it lands reads
 * as a dropped drag. So a drop reorders locally at once and navigates
 * behind it.
 *
 * The local order is a permutation of INDICES, not of ids or of nodes. It
 * has to be, for two reasons. The previews are server-rendered React nodes
 * handed down as an array — reordering them by id is impossible when the
 * same block appears twice, which is a composition this builder supports on
 * purpose. And the outline row and the preview section at position i have
 * to move together; one array of indices moves both, and cannot desync.
 *
 * ── THE RSC BOUNDARY ────────────────────────────────────────────────────
 *
 * `sections` crosses from a server component into this client one, which is
 * legal — rendered element trees serialize. What does not is a function, so
 * nothing in this component's props is one: the metadata arrives as plain
 * objects and every edit is computed here from `items`. A callback prop
 * would pass `tsc` and every catalog check and then red the prerender.
 */

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowDown,
  ArrowUp,
  CopyPlus,
  GripVertical,
  Layers,
  X,
} from 'lucide-react'

import { ResponsivePreview } from '@/components/responsive-preview'
import {
  builderHref,
  COMPOSITION_PARAM,
  duplicateAt,
  insertAt,
  MAX_SECTIONS,
  moveAt,
  moveTo,
  removeAt,
  serializeComposition,
  THEME_PARAM,
} from '@/lib/builder/compose'
import { COMPOSITION_THEME_CLASS } from '@/lib/builder/theme'
import { cn } from '@/lib/utils'

/**
 * Drag payload types.
 *
 * Two, because a drag means different things depending on where it started:
 * from the picker it is "add this block", from the outline or the canvas it
 * is "move the section at this position". Encoding that in the MIME type
 * rather than in the data is what lets `dragover` tell them apart —
 * `getData` returns empty during a drag by design, and `types` is all a
 * drop target can read while deciding whether to accept.
 */
export const BLOCK_DRAG_TYPE = 'application/x-hoverlab-block'
const SECTION_DRAG_TYPE = 'application/x-hoverlab-section'

/** One row of the composition. Serializable — it crosses the RSC boundary. */
export interface BuilderSection {
  id: string
  name: string
  category: string
}

export function BuilderSurface({
  items,
  theme,
  sections,
}: {
  /** The composition's metadata, in order. */
  items: BuilderSection[]
  /** The encoded theme, threaded into every edit URL. */
  theme: string | null
  /**
   * The server-rendered previews, one per entry in `items` and in the same
   * order. Positional alignment is the contract; the page builds both from
   * one list.
   */
  sections: React.ReactNode[]
}) {
  const router = useRouter()

  const ids = React.useMemo(() => items.map((item) => item.id), [items])
  const key = ids.join(',')

  /* ---------------------------------------------------------------- *
   *  Optimistic order
   * ---------------------------------------------------------------- */

  const [order, setOrder] = React.useState<number[] | null>(null)
  const [applied, setApplied] = React.useState(key)

  /*
   * Adjusting state during render rather than in an effect. When the server
   * catches up — or the reader hits back, or opens a different link — the
   * props are the truth again and the local permutation has to go. Doing it
   * in an effect renders one frame of the stale order first, which for a
   * back-button undo is the undone edit flashing back into view.
   */
  if (applied !== key) {
    setApplied(key)
    setOrder(null)
  }

  /** Positions to render, and how they map back to the props arrays. */
  const positions = order ?? items.map((_, i) => i)

  /** The composition as it currently appears, optimistic order included. */
  const shown = positions.map((i) => ids[i])

  /* ---------------------------------------------------------------- *
   *  Drag state
   * ---------------------------------------------------------------- */

  /** Index in `shown` being dragged, or null. */
  const [from, setFrom] = React.useState<number | null>(null)
  /** Gap the pointer is over: 0..shown.length. Null when nothing hovers. */
  const [gap, setGap] = React.useState<number | null>(null)

  const atCapacity = shown.length >= MAX_SECTIONS

  function clearDrag() {
    setFrom(null)
    setGap(null)
  }

  /**
   * Commit a new composition: show it immediately, then navigate.
   *
   * `push`, not `replace`. The whole design rests on history being the undo
   * stack, and a drag that did not push would make the one edit a reader is
   * most likely to get wrong the one edit they cannot take back.
   */
  function commit(nextShown: string[], nextPositions: number[] | null) {
    clearDrag()
    if (nextPositions) setOrder(nextPositions)
    router.push(builderHref(nextShown, theme), { scroll: false })
  }

  /** Reorder within the composition. `to` is a gap index, not a final one. */
  function dropSection(at: number) {
    if (from === null) return
    // A gap below the dragged row is one index further along than the
    // position the row ends up in, because removing it shifts the rest up.
    const target = at > from ? at - 1 : at
    if (target === from) {
      clearDrag()
      return
    }
    commit(moveTo(shown, from, target), moveTo(positions, from, target))
  }

  /** Insert a block dragged in from the picker. */
  function dropBlock(id: string, at: number) {
    if (atCapacity) {
      clearDrag()
      return
    }
    // No optimistic order for an insert: there is no server-rendered
    // preview for a section that was not in the last render, so the canvas
    // has nothing to show until the navigation lands. Reordering what is
    // already there is the case worth being instant.
    commit(insertAt(shown, at, id), null)
  }

  /**
   * What a `dragover` is carrying, as far as a drop target can tell.
   *
   * `types` is readable mid-drag; `getData` is not. Anything else — a file,
   * a URL, text dragged out of another tab — is not ours and is left alone
   * rather than swallowed, so the browser's own default still happens.
   */
  function dragKind(event: React.DragEvent): 'section' | 'block' | null {
    const types = Array.from(event.dataTransfer.types)
    if (types.includes(SECTION_DRAG_TYPE)) return 'section'
    if (types.includes(BLOCK_DRAG_TYPE)) return 'block'
    return null
  }

  /** Gap index for a pointer over a row: its top half, or its bottom half. */
  function gapFor(event: React.DragEvent<HTMLElement>, index: number): number {
    const box = event.currentTarget.getBoundingClientRect()
    return event.clientY - box.top < box.height / 2 ? index : index + 1
  }

  function onRowDragOver(event: React.DragEvent<HTMLElement>, index: number) {
    const kind = dragKind(event)
    if (!kind) return
    event.preventDefault()
    event.dataTransfer.dropEffect = kind === 'block' ? 'copy' : 'move'
    setGap(gapFor(event, index))
  }

  function onRowDrop(event: React.DragEvent<HTMLElement>, index: number) {
    const kind = dragKind(event)
    if (!kind) return
    event.preventDefault()
    const at = gapFor(event, index)
    if (kind === 'section') dropSection(at)
    else dropBlock(event.dataTransfer.getData(BLOCK_DRAG_TYPE), at)
  }

  function startSectionDrag(event: React.DragEvent, index: number) {
    event.dataTransfer.setData(SECTION_DRAG_TYPE, String(index))
    /*
     * A `text/plain` copy as well, and it is not redundant. Without any
     * standard type some browsers refuse to start the drag at all, and a
     * drag that escapes the page — onto the address bar, into an editor —
     * should produce the section's name rather than nothing.
     */
    event.dataTransfer.setData('text/plain', items[positions[index]]?.name ?? '')
    event.dataTransfer.effectAllowed = 'move'
    setFrom(index)
  }

  /* ---------------------------------------------------------------- *
   *  Render
   * ---------------------------------------------------------------- */

  const previewHref = `/preview/builder?${COMPOSITION_PARAM}=${serializeComposition(
    shown,
  )}${theme ? `&${THEME_PARAM}=${encodeURIComponent(theme)}` : ''}`

  if (items.length === 0) {
    return (
      <div className="grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div>
          <OutlineHeading count={0} />
          <p
            onDragOver={(event) => {
              if (dragKind(event) === 'block') event.preventDefault()
            }}
            onDrop={(event) => {
              if (dragKind(event) !== 'block') return
              event.preventDefault()
              dropBlock(event.dataTransfer.getData(BLOCK_DRAG_TYPE), 0)
            }}
            className="mt-4 rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground"
          >
            Nothing in the page yet. Add a section below — a hero is the usual
            first one — or drag one up here.
          </p>
        </div>
        <div className="min-w-0">
          <h2 className="type-section">Canvas</h2>
          <div className="mt-4 rounded-2xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
            Your page renders here as you add sections.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)]">
      {/* ------------------------------------------------------------ *
          The outline. Sticky, because it is also the drop target for
          sections dragged up out of the picker further down the page.
       * ------------------------------------------------------------ */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <OutlineHeading count={shown.length} />

        <ol
          className="mt-4 space-y-2"
          onDragLeave={(event) => {
            // Only when the pointer leaves the list itself, not when it
            // crosses between two rows inside it — every row boundary would
            // otherwise flicker the drop indicator off and on.
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setGap(null)
            }
          }}
          onDrop={clearDrag}
        >
          {positions.map((position, index) => {
            const meta = items[position]
            const dragging = from === index

            return (
              <li
                key={position}
                draggable
                onDragStart={(event) => startSectionDrag(event, index)}
                onDragEnd={clearDrag}
                onDragOver={(event) => onRowDragOver(event, index)}
                onDrop={(event) => onRowDrop(event, index)}
                className={cn(
                  'relative flex items-start gap-2 rounded-xl border border-border/60 bg-card/50 p-3 transition-opacity',
                  dragging && 'opacity-40',
                )}
              >
                {/* Where the section would land. Rendered on the row rather
                    than between rows so it needs no extra elements in the
                    list, which keeps the drop geometry to one box per row. */}
                {gap === index && <DropLine edge="top" />}
                {gap === index + 1 && <DropLine edge="bottom" />}

                <span
                  aria-hidden
                  className="mt-0.5 cursor-grab text-muted-foreground/60 active:cursor-grabbing"
                  title="Drag to reorder"
                >
                  <GripVertical className="h-4 w-4" />
                </span>
                <span className="mt-0.5 w-4 shrink-0 text-xs tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/block/${meta.id}`}
                    className="block truncate text-sm font-medium underline-offset-4 hover:underline"
                  >
                    {meta.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">{meta.category}</span>
                </div>
                <SectionControls
                  ids={shown}
                  index={index}
                  name={meta.name}
                  theme={theme}
                  atCapacity={atCapacity}
                />
              </li>
            )
          })}
        </ol>

        <div className="mt-3 flex items-center justify-between gap-3">
          <Link
            href={builderHref([], theme)}
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Start over
          </Link>
          <span className="text-xs text-muted-foreground">
            Drag a row, or use the arrows
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------ *
          The canvas. Real components, stacked, each wrapped in the same
          PreviewGuard the detail pages use — a composed page holds
          several blocks that each believe they own the <h1>, and demo
          links that point at routes this site does not have.

          Inside ResponsivePreview, whose frame is how a composition gets
          checked at phone width: Tailwind's breakpoints are viewport
          media queries, so a narrow box would render the desktop layout
          squeezed. The frame is read-only by necessity — the editing
          furniture below lives in this document and cannot overlay
          another one — which is an honest split: edit at full width,
          verify at a real width.
       * ------------------------------------------------------------ */}
      <div className="min-w-0">
        <h2 className="type-section">Canvas</h2>
        <p className="mb-3 mt-1 text-sm text-muted-foreground">
          Hover a section to move, duplicate or remove it. Drag it to reorder.
        </p>

        <ResponsivePreview name="this composition" frameSrc={previewHref}>
          <div
            className={cn(
              'overflow-hidden rounded-2xl border border-border/60 bg-background',
              COMPOSITION_THEME_CLASS,
            )}
          >
            {positions.map((position, index) => {
              const meta = items[position]
              return (
                <section
                  key={position}
                  draggable
                  onDragStart={(event) => startSectionDrag(event, index)}
                  onDragEnd={clearDrag}
                  onDragOver={(event) => onRowDragOver(event, index)}
                  onDrop={(event) => onRowDrop(event, index)}
                  aria-label={`Section ${index + 1}: ${meta.name}`}
                  className={cn(
                    'group/section relative border-b border-border/40 last:border-b-0 transition-opacity',
                    from === index && 'opacity-40',
                  )}
                >
                  {gap === index && <DropLine edge="top" />}
                  {gap === index + 1 && <DropLine edge="bottom" />}

                  {/* The floating toolbar. Revealed by CSS on hover and on
                      focus-within rather than by state, so it costs no
                      render and exists before hydration. */}
                  <div className="pointer-events-none absolute left-2 right-2 top-2 z-10 flex items-center justify-between gap-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover/section:opacity-100">
                    <span className="pointer-events-auto inline-flex cursor-grab items-center gap-1.5 rounded-lg border border-border/60 bg-background/95 px-2 py-1 text-xs font-medium shadow-sm backdrop-blur active:cursor-grabbing">
                      <GripVertical aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="max-w-[12rem] truncate">{meta.name}</span>
                    </span>
                    <span className="pointer-events-auto inline-flex items-center gap-0.5 rounded-lg border border-border/60 bg-background/95 p-0.5 shadow-sm backdrop-blur">
                      <SectionControls
                        ids={shown}
                        index={index}
                        name={meta.name}
                        theme={theme}
                        atCapacity={atCapacity}
                      />
                    </span>
                  </div>

                  {/*
                    `pointer-events-none` on the rendered block.

                    A section in the canvas is a thing being arranged, not a
                    thing being used: without this, dragging one starts a
                    text selection or a link drag from whatever is under the
                    pointer, and clicking "Buy now" in a preview navigates
                    somewhere that does not exist. The detail pages keep
                    their blocks interactive, because there the block IS the
                    subject. Here the composition is.
                  */}
                  <div className="pointer-events-none select-none">{sections[position]}</div>
                </section>
              )
            })}
          </div>
        </ResponsivePreview>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 *  Parts
 * ------------------------------------------------------------------ */

function OutlineHeading({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="type-section flex items-center gap-2">
        <Layers className="h-4 w-4 text-muted-foreground" aria-hidden />
        Outline
      </h2>
      <span className="text-xs text-muted-foreground">
        {count} / {MAX_SECTIONS}
      </span>
    </div>
  )
}

/**
 * Where a dragged section would land.
 *
 * Absolutely positioned on the row it belongs to, so the list needs no
 * placeholder elements that would themselves have to be excluded from the
 * drop geometry. `-top-1`/`-bottom-1` rather than `top-0`, so the line sits
 * in the gap between two rows instead of over the edge of one.
 */
function DropLine({ edge }: { edge: 'top' | 'bottom' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute left-0 right-0 z-20 h-0.5 rounded-full bg-primary',
        edge === 'top' ? '-top-1' : '-bottom-1',
      )}
    />
  )
}

/**
 * Move, duplicate and remove, for one section.
 *
 * Links, in both places they appear — the outline row and the canvas
 * toolbar. Every one of them is "here is the next composition" expressed as
 * a URL, which is what makes them work under a keyboard, in a new tab, and
 * with JavaScript off, and what puts each edit in history as its own step.
 */
function SectionControls({
  ids,
  index,
  name,
  theme,
  atCapacity,
}: {
  ids: string[]
  index: number
  name: string
  theme: string | null
  atCapacity: boolean
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <ControlLink
        href={builderHref(moveAt(ids, index, -1), theme)}
        disabled={index === 0}
        label={`Move ${name} up`}
      >
        <ArrowUp className="h-3.5 w-3.5" aria-hidden />
      </ControlLink>
      <ControlLink
        href={builderHref(moveAt(ids, index, 1), theme)}
        disabled={index === ids.length - 1}
        label={`Move ${name} down`}
      >
        <ArrowDown className="h-3.5 w-3.5" aria-hidden />
      </ControlLink>
      <ControlLink
        href={builderHref(duplicateAt(ids, index), theme)}
        disabled={atCapacity}
        label={`Duplicate ${name}`}
      >
        <CopyPlus className="h-3.5 w-3.5" aria-hidden />
      </ControlLink>
      <ControlLink href={builderHref(removeAt(ids, index), theme)} label={`Remove ${name}`}>
        <X className="h-3.5 w-3.5" aria-hidden />
      </ControlLink>
    </div>
  )
}

/**
 * One control.
 *
 * A disabled control renders as a `<span>` rather than a greyed `<a>`,
 * because an anchor with no href is not focusable and an anchor that points
 * at the composition it already is would be a navigation to nowhere.
 */
function ControlLink({
  href,
  disabled = false,
  label,
  children,
}: {
  href: string
  disabled?: boolean
  label: string
  children: React.ReactNode
}) {
  const shape =
    'inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60'

  if (disabled) {
    return (
      <span className={`${shape} text-muted-foreground/40`} aria-hidden>
        {children}
      </span>
    )
  }

  return (
    <Link
      href={href}
      scroll={false}
      draggable={false}
      className={`${shape} text-muted-foreground transition-colors hover:bg-muted hover:text-foreground`}
    >
      {children}
      <span className="sr-only">{label}</span>
    </Link>
  )
}
