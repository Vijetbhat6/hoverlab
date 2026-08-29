'use client'

/**
 * A condensed copy of the preview, pinned under the header for as long as
 * the real one is off screen.
 *
 * This is the half of the fix that pinning a column cannot do. Pinning
 * works when the controls and the thing they control are in the same grid
 * row: the preview column stays put while the controls scroll past it. It
 * stops working the moment they are not — when the columns stack on a
 * phone, or when the controls live in a different container entirely, as
 * the playground's sliders do. `position: sticky` only holds an element
 * inside its own containing block, so a preview pinned in one column is
 * simply gone by the time you reach a slider in the next one.
 *
 * So the strip re-renders the page's own preview subtree, smaller. Not a
 * screenshot and not a second implementation — the same React elements
 * reading the same state, which is what makes it impossible for it to show
 * something the real preview does not. It mounts only while the real one
 * is out of sight, so a visitor already looking at the preview pays
 * nothing for it.
 *
 * Placement matters: the rail is `sticky`, so it holds for exactly as long
 * as its parent is on screen. Mount it as a child of the element that
 * spans the whole editing region — the grid that holds both the preview
 * and the controls — not inside the preview's own column, or it will
 * scroll away with the thing it is standing in for.
 */

import * as React from 'react'
import { ChevronUp } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useHeaderHeight } from '@/hooks/use-header-height'

/** Height budget for the strip's live area, in px. */
const STRIP_HEIGHT = 132

/** How long the readout keeps showing a control after you let go, in ms. */
const READOUT_LINGER = 1800

/**
 * Marks the real, in-flow preview for the strip to watch and measure.
 * Put it on the visual output itself, not on the column that holds it.
 */
export const STAGE_ATTR = 'data-tool-stage'

export interface StageStripProps {
  /**
   * The preview to draw in the strip — normally the same element that is
   * rendered in flow with `data-tool-stage` on it.
   */
  stage: React.ReactNode
  /**
   * Width the strip is allowed to occupy at `lg` and up, as a CSS length.
   * Defaults to the full width of the rail; tools narrow it to their
   * preview column so it does not band across the page.
   */
  maxWidth?: string
  /** Align the strip to the right at `lg` and up (preview-right layouts). */
  alignRight?: boolean
  className?: string
}

export function StageStrip({
  stage,
  maxWidth,
  alignRight = false,
  className,
}: StageStripProps) {
  const railRef = React.useRef<HTMLDivElement>(null)
  const stripRef = React.useRef<HTMLButtonElement>(null)

  const [pinned, setPinned] = React.useState(false)
  const [scale, setScale] = React.useState(1)
  const [natural, setNatural] = React.useState({ width: 0, height: 0 })
  const [readout, setReadout] = React.useState<string | null>(null)
  const [atPin, setAtPin] = React.useState(false)

  // The strip parks under the header — which is not one number, see the hook.
  const headerHeight = useHeaderHeight()

  // Scoped to the rail's own container, so two workbenches on one page
  // cannot end up watching each other's preview.
  const findStage = React.useCallback(
    () => railRef.current?.parentElement?.querySelector(`[${STAGE_ATTR}]`) ?? null,
    [],
  )

  React.useEffect(() => {
    const el = findStage()
    if (!el) {
      setPinned(false)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // "Is ENOUGH of it on screen", not "is any of it".
        //
        // `!isIntersecting` was the first attempt and it left two holes. On
        // the controls-first layouts the preview sits below the controls,
        // so at the last slider it pokes into the viewport by six pixels —
        // technically intersecting, so no strip, and six pixels of preview.
        // And on wide screens a pinned column releases near the end of the
        // controls, because a box 804px tall needs 804px of runway below
        // the pin and the grid runs out of it. That is how sticky works,
        // not something to configure away.
        const visible = entry.intersectionRect.height
        const enough = Math.min(STRIP_HEIGHT, entry.boundingClientRect.height * 0.6)
        setPinned(visible < enough)
      },
      {
        rootMargin: `-${headerHeight}px 0px 0px 0px`,
        threshold: [0, 0.05, 0.1, 0.2, 0.35, 0.5, 0.75, 1],
      },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [findStage, headerHeight])

  // Measure the real stage so the copy is scaled to fit rather than
  // guessed at — tool stages run from 102px to 1,148px tall.
  React.useEffect(() => {
    const el = findStage()
    if (!el) return

    const measure = () => {
      const rect = el.getBoundingClientRect()
      const available = stripRef.current?.getBoundingClientRect().width ?? rect.width
      if (!rect.width || !rect.height) return
      setNatural({ width: rect.width, height: rect.height })
      // Scale to fit, but stop shrinking once the stage is more than three
      // strips tall: past that it only fits by becoming an illegible smudge
      // (the colour-blindness simulator's stage is 3,400px — true fit-scale
      // renders it at 4%). The top third at a readable size beats all of it
      // at none, and the box below clips the rest.
      const fitHeight = Math.min(rect.height, STRIP_HEIGHT * 3)
      setScale(Math.min(1, available / rect.width, STRIP_HEIGHT / fitHeight))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [pinned, findStage])

  /*
    Name the control under the user's hand.

    Seeing the preview change answers "what did that do"; it does not
    answer "which of the eleven sliders am I on", and on a phone the label
    you are dragging is off screen along with everything else. So the strip
    reads the control back — "Blur · 12px".

    It listens for pointer and key activity rather than `input` events,
    because the sliders are Radix and Radix does not fire one: the value
    lives in `aria-valuenow` on the thumb and changes through its own
    handlers. Watching what is being touched works for those, for native
    inputs, and for buttons, without any of them having to declare
    anything.
  */
  React.useEffect(() => {
    const region = railRef.current?.parentElement
    if (!region) return

    let clearTimer: number | undefined

    const describe = (el: Element): string | null => describeControl(el, region)

    const update = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return
      // Ignore the strip's own chrome and anything inside the preview.
      if (stripRef.current?.contains(target)) return
      if (target.closest(`[${STAGE_ATTR}]`)) return

      const text = describe(target)
      if (!text) return
      setReadout((prev) => (prev === text ? prev : text))

      window.clearTimeout(clearTimer)
      clearTimer = window.setTimeout(() => setReadout(null), READOUT_LINGER)
    }

    const onPointerDown = (e: Event) => update(e.target)
    const onPointerMove = (e: Event) => {
      // Only while dragging — a hover is not an edit.
      if ((e as PointerEvent).buttons === 0) return
      update(e.target)
    }
    const onKeyOrInput = (e: Event) => update(e.target)

    region.addEventListener('pointerdown', onPointerDown, true)
    region.addEventListener('pointermove', onPointerMove, true)
    region.addEventListener('keyup', onKeyOrInput, true)
    region.addEventListener('input', onKeyOrInput, true)
    region.addEventListener('change', onKeyOrInput, true)

    return () => {
      window.clearTimeout(clearTimer)
      region.removeEventListener('pointerdown', onPointerDown, true)
      region.removeEventListener('pointermove', onPointerMove, true)
      region.removeEventListener('keyup', onKeyOrInput, true)
      region.removeEventListener('input', onKeyOrInput, true)
      region.removeEventListener('change', onKeyOrInput, true)
    }
  }, [])

  /*
    Is the rail actually pinned, or merely rendered?

    `sticky` does nothing until you have scrolled to it, and on the
    controls-first tools the preview starts below the fold — so the strip
    was "needed" from the moment the page loaded, and drew itself at the
    rail's resting position partway down the page. On /tools/tokens at
    scroll 0 that put a 158px card at y=275 directly over the first slider
    at y=311: the control was hidden, and tapping it hit the strip, which
    scrolled the page instead.

    So the strip renders only once the rail has reached the offset it pins
    at. Below that point the real preview is somewhere on the way and the
    page can be left alone.
  */
  React.useEffect(() => {
    const rail = railRef.current
    if (!rail) return

    const sync = () => setAtPin(rail.getBoundingClientRect().top <= headerHeight + 1)
    sync()
    window.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    return () => {
      window.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [headerHeight])

  /** Take the reader back to the real preview the strip stands in for. */
  const jumpToStage = React.useCallback(() => {
    const el = findStage()
    if (!el) return
    const top = window.scrollY + el.getBoundingClientRect().top - headerHeight - 12
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: Math.max(0, top), behavior: reduced ? 'auto' : 'smooth' })
  }, [findStage, headerHeight])

  return (
    /*
      A zero-height sticky rail. The card inside is absolutely positioned,
      so the strip appearing does not push the controls down — a layout
      shift under the user's thumb mid-drag is worse than the problem being
      solved.
    */
    <div
      ref={railRef}
      className={cn('pointer-events-none sticky z-30 h-0', className)}
      style={{ top: headerHeight }}
    >
      {pinned && atPin && stage ? (
        <button
          ref={stripRef}
          type="button"
          onClick={jumpToStage}
          aria-label="Scroll back to the live preview"
          style={maxWidth ? ({ '--strip-max': maxWidth } as React.CSSProperties) : undefined}
          className={cn(
            'pointer-events-auto absolute inset-x-0 top-2 block w-full animate-in fade-in slide-in-from-top-1 overflow-hidden rounded-xl border border-border bg-background/95 text-left shadow-lg backdrop-blur duration-150 transition-colors hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:animate-none',
            maxWidth && 'lg:max-w-[var(--strip-max)]',
            alignRight && 'lg:ml-auto',
          )}
        >
          <div
            className="relative w-full overflow-hidden"
            style={{
              height:
                Math.min(STRIP_HEIGHT, Math.round(natural.height * scale)) || STRIP_HEIGHT,
            }}
          >
            {/*
              aria-hidden and inert together: the copy is decoration, so it
              is neither announced twice nor a second set of tab stops for
              controls that already exist further down the page.
            */}
            <div
              aria-hidden="true"
              inert
              className="pointer-events-none absolute left-1/2 top-0"
              style={{
                width: natural.width || undefined,
                height: natural.height || undefined,
                transform: `translateX(-50%) scale(${scale})`,
                transformOrigin: 'top center',
              }}
            >
              {stage}
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 border-t border-border/60 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <span className="truncate">{readout ?? 'Live preview'}</span>
            <ChevronUp className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
          </div>
        </button>
      ) : null}
    </div>
  )
}

/** Interactive things worth naming in the readout. */
const CONTROL_SELECTOR =
  'input,select,textarea,button,[role="slider"],[role="switch"],[role="radio"]'

/**
 * "Blur · 2px" for whatever the user is currently touching.
 *
 * Harder than it sounds, because the tools do not agree on markup. The
 * shared `SliderField` puts `aria-label` and an `id` on the Radix root and
 * the formatted value in a mono span. The shadow tool's own `NumberSlider`
 * puts neither on the root: the name is a `<label>` two levels up and the
 * value is a number input with the unit in a span beside it. And in both
 * cases the element you actually grab is the thumb, which carries no name
 * at all.
 *
 * So the name and the value are resolved separately — climb for the name,
 * then read the value out of the field that name belongs to.
 */
function describeControl(target: Element, region: Element): string | null {
  const control = target.closest(CONTROL_SELECTOR)
  if (!control) return null

  const labelled = findLabelled(control, region)
  if (!labelled) return null

  const value = readValue(labelled.scope, control)
  return value ? `${labelled.name} · ${value}` : labelled.name
}

/**
 * The nearest name at or above the control, plus the field it names — the
 * value is read from that same field, so the two cannot come from
 * different sliders.
 */
function findLabelled(
  control: Element,
  region: Element,
): { name: string; scope: Element } | null {
  let node: Element | null = control
  for (let depth = 0; node && node !== region && depth < 6; depth++) {
    const direct = directName(node)
    if (direct) return { name: direct, scope: node.parentElement ?? node }

    // A `<label>` belonging to THIS field. Kept shallow on purpose: one
    // level higher is the two-column grid of sliders, where the first
    // label is a different control's.
    const label = node.querySelector(':scope > label, :scope > * > label')
    const text = label?.textContent?.trim()
    if (text) return { name: text, scope: node }

    node = node.parentElement
  }
  return null
}

/** A name the element states about itself, rather than one inferred. */
function directName(el: Element): string | null {
  const aria = el.getAttribute('aria-label')?.trim()
  if (aria) return aria

  const labelledBy = el.getAttribute('aria-labelledby')
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim())
      .filter(Boolean)
      .join(' ')
    if (text) return text
  }

  if (el.id) {
    const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`)
    const text = label?.textContent?.trim()
    if (text) return text
  }

  // Only for things whose own text IS their name. A general textContent
  // fallback reads a slider's whole field row and reports "Blurpx".
  if (el.tagName === 'BUTTON' || el.tagName === 'A') {
    const own = el.textContent?.trim()
    if (own && own.length <= 32) return own
  }

  return null
}

/** How many sliders a container holds — one means it is a field, not a group. */
function sliderCount(el: Element): number {
  return el.querySelectorAll('[role="slider"],input[type="range"]').length
}

/** The field's current value, preferring whatever it already displays. */
function readValue(scope: Element, control: Element): string | null {
  // Only read the displayed value out of a container that holds a single
  // slider. The easing editor's four bezier handles share one "Parameters"
  // card, and scraping its mono text produced the value
  // "x10.250y10.100x20.250y21.000" — every handle at once, which is worse
  // than no value at all. A group falls through to the ARIA value of the
  // one handle actually being dragged.
  if (sliderCount(scope) > 1) return ariaValue(control)

  // A number/range input is the value, and any short span beside it is its
  // unit — "2" and "px" are much better together than apart.
  const input = scope.querySelector(
    'input[type="number"],input[type="range"],input[type="text"]',
  )
  if (input instanceof HTMLInputElement && input.value !== '') {
    const beside = input.nextElementSibling?.textContent?.trim() ?? ''
    return beside && beside.length <= 4 ? `${input.value}${beside}` : input.value
  }

  // SliderField renders the formatted value — "12px", "1.25x" — in a mono
  // span next to its label.
  //
  // Leaf elements only, and short ones. In the easing editor `.font-mono`
  // sits on a wrapper around all four bezier inputs, so taking the first
  // match produced "x10.250y10.100x20.250y21.000" — the entire curve
  // reported as the value of one handle.
  for (const el of scope.querySelectorAll('.font-mono')) {
    if (el.children.length > 0) continue
    const text = el.textContent?.trim()
    if (text && text.length <= 16) return text
  }

  const aria = ariaValue(control)
  if (aria) return aria

  const checked = control.getAttribute('aria-checked') ?? control.getAttribute('aria-pressed')
  if (checked === 'true' || checked === 'false') return checked === 'true' ? 'on' : 'off'

  if (control instanceof HTMLInputElement) {
    if (control.type === 'checkbox' || control.type === 'radio') {
      return control.checked ? 'on' : 'off'
    }
    return control.value || null
  }
  if (control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement) {
    return control.value || null
  }
  return null
}

/** The value the control states about itself. */
function ariaValue(control: Element): string | null {
  return (
    control.getAttribute('aria-valuetext')?.trim() ||
    control.getAttribute('aria-valuenow')?.trim() ||
    null
  )
}
