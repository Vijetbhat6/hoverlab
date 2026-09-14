'use client'

/**
 * The effect detail page's live-preview stage, plus the two controls that
 * decide what you are actually looking at: what is *behind* the effect,
 * and how much room it gets.
 *
 * Both exist because a preview stage is not neutral furniture — it is half
 * the judgement. An effect authored against `bg-slate-950` looks confident
 * on the dark surface the catalog ships it on and falls apart on white;
 * a glow reads as a glow on near-black and as a smudge on #fff. Until now
 * the page picked one surface per effect and that was the end of it, so
 * the one question a visitor is actually asking — "will this survive on
 * *my* background?" — could only be answered by copying the CSS out and
 * pasting it somewhere else.
 *
 * The height is the same argument on the other axis. `stageMinHeight`
 * sizes the box by category, which is a good guess and only ever a guess:
 * a mesh gradient wants the whole viewport, a hover button wants to be
 * seen small and near other things, and nobody but the reader knows which
 * of those they are doing.
 *
 * Two things this file is careful about:
 *
 *  - **The rail and the chips live outside the traced frame.** `frameId`
 *    goes on the stage element alone, because `<CopyFrameForFigma>` walks
 *    that subtree and turns every box in it into a Figma layer. A resize
 *    grip rendered inside the stage would paste into Figma as a small grey
 *    rectangle nobody asked for. Overlaying the effect was the other
 *    reason to keep it out: the rail sits in flow *under* the stage, so it
 *    never covers the artifact it is resizing.
 *
 *  - **The backdrop override paints inline and keeps the surface class.**
 *    Dropping the class was the obvious move and the wrong one, because
 *    `previewClass` is not reliably a background: the full-bleed
 *    categories use it to carry `p-0`, so removing it to paint a colour
 *    would hand a mesh gradient back its 32px of padding and shrink the
 *    preview every time somebody touched the backdrop. An inline style
 *    beats a utility class on specificity, so `backgroundColor` wins on
 *    its own — paired with `background-image: none`, without which a
 *    `previewClass` carrying a gradient would sit on top of the colour
 *    and hide it.
 *
 * A pleasant side effect of putting the colour inline on the stage: the
 * Figma tracer reads computed styles, so a frame copied against a custom
 * backdrop arrives in Figma on that backdrop.
 */

import * as React from 'react'
import { RotateCcw } from 'lucide-react'

import { normalizeHex } from '@/lib/color-tools'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ *
 *  Backdrop
 * ------------------------------------------------------------------ */

/** White, for "does this survive on a light page". */
const LIGHT = '#ffffff'
/**
 * slate-950 — the same value as the `bg-slate-950` that dark-authored
 * effects already preview against, so switching a dark effect to "Dark"
 * is a no-op rather than a subtle shift the reader has to second-guess.
 */
const DARK = '#020617'
/**
 * Where the custom chip starts: a mid grey, chosen because it is the one
 * backdrop that shows up *both* failure modes at once — light fringing
 * and dark halos are each visible against it, where white hides one and
 * near-black hides the other.
 */
const CUSTOM_SEED = '#6b7280'

type BackdropMode = 'default' | 'light' | 'dark' | 'custom'

interface Backdrop {
  mode: BackdropMode
  /** Last colour the chip held. Kept across mode switches so that
   *  Light → Dark → custom returns to the colour you picked, not the seed. */
  hex: string
}

const INITIAL: Backdrop = { mode: 'default', hex: CUSTOM_SEED }

/**
 * The backdrop is a reading preference, not a property of the effect, so
 * it outlives the page. Somebody auditing a category against their own
 * brand colour is going through twenty effects; asking them to re-pick it
 * on each one would make the feature not worth using.
 */
const STORAGE_KEY = 'hoverlab:effect-backdrop'

function readBackdrop(): Backdrop | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Backdrop>
    const mode = parsed.mode
    if (mode !== 'default' && mode !== 'light' && mode !== 'dark' && mode !== 'custom') {
      return null
    }
    return { mode, hex: normalizeHex(parsed.hex ?? '') ?? CUSTOM_SEED }
  } catch {
    /* private mode, quota, a hand-edited value — the default is fine */
    return null
  }
}

/** The colour to paint, or null to leave the effect's own surface alone. */
function resolveBackdrop({ mode, hex }: Backdrop): string | null {
  if (mode === 'light') return LIGHT
  if (mode === 'dark') return DARK
  if (mode === 'custom') return hex
  return null
}

/* ------------------------------------------------------------------ *
 *  Height
 * ------------------------------------------------------------------ */

const MIN_HEIGHT = 120
/**
 * A ceiling on the ceiling. Past this the stage stops being a preview and
 * starts being a page, and `<CopyFrameForFigma>` has to trace all of it.
 */
const HARD_MAX = 900
/** Arrow-key step, and the coarser one for PageUp/PageDown and Shift. */
const STEP = 16
const COARSE_STEP = 64
/** How long the px readout lingers after the last change, in ms. */
const READOUT_LINGER = 1200

/**
 * The tallest the stage may get at this viewport.
 *
 * Capped against the window rather than left at `HARD_MAX` because the
 * stage is `position: sticky`: a box taller than the space under the
 * header has no runway to pin in, so dragging past that point would
 * silently break the pinning that the Customize tab depends on — you
 * would be watching the hue slider with the preview scrolled off screen,
 * which is the exact bug the sticky wrapper was added to fix.
 */
function maxForViewport(viewportHeight: number): number {
  return Math.max(MIN_HEIGHT + 60, Math.min(HARD_MAX, Math.round(viewportHeight * 0.7)))
}

/* ------------------------------------------------------------------ *
 *  Component
 * ------------------------------------------------------------------ */

export interface EffectStageProps {
  /** The effect's markup, injected as-is. */
  html: string
  /** Tailwind `min-h-*` classes chosen for the effect's category. */
  minHeightClass: string
  /** The surface the effect was authored against — a class, not a colour. */
  surfaceClass: string
  /** DOM id the Figma tracer walks. Goes on the stage and nothing else. */
  frameId: string
  /** Ring the stage while the Customize sliders are off their defaults. */
  customized?: boolean
  /**
   * Changing this drops a dragged height back to the category default.
   * Pass the effect id: prev/next is a client navigation that may reuse
   * this component instance, and 600px chosen for a mesh gradient is the
   * wrong box for the hover button you land on next.
   */
  resetKey?: string
  /**
   * The page's own handle on the stage element — the spotlight effects
   * query into it for `[data-spotlight]`.
   */
  stageRef?: React.RefObject<HTMLDivElement | null>
  className?: string
}

export function EffectStage({
  html,
  minHeightClass,
  surfaceClass,
  frameId,
  customized = false,
  resetKey,
  stageRef,
  className,
}: EffectStageProps) {
  const innerRef = React.useRef<HTMLDivElement>(null)

  const setStage = React.useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node
      if (stageRef) stageRef.current = node
    },
    [stageRef],
  )

  /* -- backdrop ----------------------------------------------------- */

  const [backdrop, setBackdrop] = React.useState<Backdrop>(INITIAL)
  const [hydrated, setHydrated] = React.useState(false)

  // Read after mount, never during render: the server has no localStorage,
  // and a stored "Dark" applied during the first render is a hydration
  // mismatch on every effect page.
  React.useEffect(() => {
    const stored = readBackdrop()
    if (stored) setBackdrop(stored)
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    // Gated on `hydrated` so the first commit cannot write the default
    // over a stored choice before the read above has landed.
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(backdrop))
    } catch {
      /* ignore quota / privacy errors */
    }
  }, [hydrated, backdrop])

  const painted = resolveBackdrop(backdrop)

  /* -- hex chip ----------------------------------------------------- */

  // A draft, so that clearing the field to retype does not immediately
  // resolve to "invalid" and snap the stage back.
  const [draft, setDraft] = React.useState(backdrop.hex)
  React.useEffect(() => setDraft(backdrop.hex), [backdrop.hex])

  const applyHex = React.useCallback((raw: string) => {
    const hex = normalizeHex(raw)
    if (hex) setBackdrop({ mode: 'custom', hex })
    return hex
  }, [])

  /* -- height ------------------------------------------------------- */

  const [height, setHeight] = React.useState<number | null>(null)
  const [maxHeight, setMaxHeight] = React.useState(HARD_MAX)
  const [dragging, setDragging] = React.useState(false)
  const [readout, setReadout] = React.useState(false)

  const drag = React.useRef<{ startY: number; startHeight: number } | null>(null)
  const readoutTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    const sync = () => setMaxHeight(maxForViewport(window.innerHeight))
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  React.useEffect(() => {
    setHeight(null)
  }, [resetKey])

  const clampHeight = React.useCallback(
    (value: number) => Math.min(maxHeight, Math.max(MIN_HEIGHT, Math.round(value))),
    [maxHeight],
  )

  // Keep `aria-valuenow` honest before anyone has dragged: until then the
  // height is whatever the category floor and the content settled on, and
  // a separator that reports 0 is worse than one that reports nothing.
  const [measured, setMeasured] = React.useState(0)
  React.useEffect(() => {
    const el = innerRef.current
    if (!el) return
    const read = () => setMeasured(Math.round(el.getBoundingClientRect().height))
    read()
    const observer = new ResizeObserver(read)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    if (readoutTimer.current) clearTimeout(readoutTimer.current)
    if (height === null) {
      setReadout(false)
      return
    }
    setReadout(true)
    readoutTimer.current = setTimeout(() => setReadout(false), READOUT_LINGER)
    return () => {
      if (readoutTimer.current) clearTimeout(readoutTimer.current)
    }
  }, [height])

  function startDrag(e: React.PointerEvent<HTMLDivElement>) {
    const el = innerRef.current
    if (!el || e.button !== 0) return
    // Stops the gesture turning into a text selection across the page, and
    // on touch `touch-action: none` on the rail stops it scrolling instead.
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = {
      startY: e.clientY,
      startHeight: el.getBoundingClientRect().height,
    }
    setDragging(true)
  }

  function moveDrag(e: React.PointerEvent<HTMLDivElement>) {
    const state = drag.current
    if (!state) return
    setHeight(clampHeight(state.startHeight + (e.clientY - state.startY)))
  }

  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return
    drag.current = null
    setDragging(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  function onHandleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const current = height ?? measured
    if (!current) return

    let next: number | null = null
    switch (e.key) {
      // Down grows the stage, because the edge you are moving is the
      // bottom one — the same direction your hand would go.
      case 'ArrowDown':
        next = current + (e.shiftKey ? COARSE_STEP : STEP)
        break
      case 'ArrowUp':
        next = current - (e.shiftKey ? COARSE_STEP : STEP)
        break
      case 'PageDown':
        next = current + COARSE_STEP
        break
      case 'PageUp':
        next = current - COARSE_STEP
        break
      case 'Home':
        next = MIN_HEIGHT
        break
      case 'End':
        next = maxHeight
        break
      default:
        return
    }
    e.preventDefault()
    setHeight(clampHeight(next))
  }

  /* -- reset -------------------------------------------------------- */

  const touched = height !== null || backdrop.mode !== 'default'

  const reset = React.useCallback(() => {
    setHeight(null)
    setBackdrop((prev) => ({ mode: 'default', hex: prev.hex }))
  }, [])

  const shownHeight = height ?? measured

  return (
    <div className={cn('select-none', className)}>
      {/* -- backdrop chips ------------------------------------------ */}
      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <span
          id={`${frameId}-backdrop-label`}
          className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
        >
          Backdrop
        </span>

        <div
          role="radiogroup"
          aria-labelledby={`${frameId}-backdrop-label`}
          className="inline-flex items-center gap-0.5 rounded-lg border border-border/60 bg-muted/30 p-0.5"
        >
          <BackdropChip
            label="Default"
            active={backdrop.mode === 'default'}
            onSelect={() => setBackdrop((prev) => ({ ...prev, mode: 'default' }))}
          />
          <BackdropChip
            label="Light"
            swatch={LIGHT}
            active={backdrop.mode === 'light'}
            onSelect={() => setBackdrop((prev) => ({ ...prev, mode: 'light' }))}
          />
          <BackdropChip
            label="Dark"
            swatch={DARK}
            active={backdrop.mode === 'dark'}
            onSelect={() => setBackdrop((prev) => ({ ...prev, mode: 'dark' }))}
          />
        </div>

        {/*
          The hex chip. Two controls rather than one: the swatch opens the
          OS picker, which is how most people will reach for a colour, and
          the field takes a pasted brand hex, which is the case the picker
          serves badly — nobody eyedroppers their way to #5b21b6.
        */}
        <div
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border p-0.5 pr-1.5 transition-colors focus-within:ring-2 focus-within:ring-ring',
            backdrop.mode === 'custom'
              ? 'border-primary/50 bg-primary/5'
              : 'border-border/60 bg-muted/30',
          )}
        >
          <input
            type="color"
            value={backdrop.hex}
            onChange={(e) => setBackdrop({ mode: 'custom', hex: e.target.value })}
            aria-label="Custom backdrop colour"
            className="h-6 w-7 cursor-pointer rounded border border-border bg-transparent"
          />
          <input
            type="text"
            value={draft}
            spellCheck={false}
            inputMode="text"
            aria-label="Custom backdrop hex"
            onChange={(e) => {
              setDraft(e.target.value)
              // Apply as soon as it parses, so typing the last digit of a
              // six-character hex shows the result without a commit step.
              applyHex(e.target.value)
            }}
            onBlur={() => {
              if (!applyHex(draft)) setDraft(backdrop.hex)
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              e.preventDefault()
              if (!applyHex(draft)) setDraft(backdrop.hex)
            }}
            className="w-[72px] bg-transparent font-mono text-xs tabular-nums text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="#000000"
          />
        </div>

        {touched ? (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw aria-hidden="true" className="h-3 w-3" />
            Reset stage
          </button>
        ) : null}
      </div>

      {/* -- the stage ------------------------------------------------ */}
      {/*
        `frameId` and the effect's markup, and nothing else, for the
        tracer's sake. `height` wins over the category floor on purpose:
        somebody who has dragged the box to 140px means 140px, and the
        `overflow-hidden` already on the stage crops whatever does not fit.
      */}
      <div
        ref={setStage}
        id={frameId}
        className={cn(
          'relative flex items-center justify-center overflow-hidden rounded-xl border border-border/50 p-8',
          height === null && minHeightClass,
          surfaceClass,
          customized && 'ring-1 ring-primary/20',
        )}
        style={{
          ...(height === null ? null : { height }),
          ...(painted === null
            ? null
            : { backgroundColor: painted, backgroundImage: 'none' }),
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* -- resize rail ---------------------------------------------- */}
      {/*
        In flow under the stage rather than overlaid on its bottom edge:
        an overlay would sit on top of the artifact, which on the
        full-bleed categories is the part you are looking at.
      */}
      <div className="relative">
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize the preview stage"
          aria-valuenow={shownHeight || undefined}
          aria-valuemin={MIN_HEIGHT}
          aria-valuemax={maxHeight}
          tabIndex={0}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onHandleKeyDown}
          onDoubleClick={() => setHeight(null)}
          title="Drag to resize the preview — double-click to reset"
          className={cn(
            'group flex h-4 w-full cursor-ns-resize touch-none items-center justify-center rounded-b-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            dragging && 'bg-primary/5',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'h-1 w-10 rounded-full transition-colors',
              dragging
                ? 'bg-primary'
                : 'bg-border group-hover:bg-muted-foreground/60 group-focus-visible:bg-primary',
            )}
          />
        </div>

        {/*
          Absolutely positioned so the number appearing mid-drag does not
          reflow the rail under the pointer. Opaque, because it is floating
          beside a stage whose colour the reader just set to anything.
        */}
        {(dragging || readout) && shownHeight ? (
          <span className="pointer-events-none absolute right-0 top-0 rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground shadow-sm">
            {shownHeight}px
          </span>
        ) : null}
      </div>
    </div>
  )
}

/** One preset in the backdrop group. */
function BackdropChip({
  label,
  swatch,
  active,
  onSelect,
}: {
  label: string
  /** Colour dot, for the presets that are a colour. "Default" is not. */
  swatch?: string
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {swatch ? (
        <span
          aria-hidden="true"
          className="h-3 w-3 rounded-full border border-border/70"
          style={{ backgroundColor: swatch }}
        />
      ) : null}
      {label}
    </button>
  )
}
