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

import { cn } from '@/lib/utils'
import { useHeaderHeight } from '@/hooks/use-header-height'

/** Height budget for the strip's live area, in px. */
const STRIP_HEIGHT = 132

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
  const stripRef = React.useRef<HTMLDivElement>(null)

  const [pinned, setPinned] = React.useState(false)
  const [scale, setScale] = React.useState(1)
  const [natural, setNatural] = React.useState({ width: 0, height: 0 })

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
      {pinned && stage ? (
        <div
          ref={stripRef}
          style={maxWidth ? ({ '--strip-max': maxWidth } as React.CSSProperties) : undefined}
          className={cn(
            'pointer-events-auto absolute inset-x-0 top-2 animate-in fade-in slide-in-from-top-1 overflow-hidden rounded-xl border border-border bg-background/95 shadow-lg backdrop-blur duration-150 motion-reduce:animate-none',
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
          <div className="border-t border-border/60 px-3 py-1 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Live preview
          </div>
        </div>
      ) : null}
    </div>
  )
}
