/**
 * <LaptopFrame> — a lid, a hinge and a base around your own content.
 *
 * The one frame people reach for in a hero, and the one that is almost
 * always a PNG. As markup it costs three divs, inherits dark mode, and lets
 * the screen hold a live interface rather than a picture of one.
 *
 * The base is the part worth getting right and the part every CSS version
 * gets wrong. A real laptop's base is wider than its lid and tapers — so it
 * is drawn as a trapezoid, with the taper done by `clip-path` rather than by
 * the old border trick. Borders cannot be rounded independently and cannot
 * carry a background, which is why the border version always ends up as a
 * flat grey wedge with a hard edge.
 *
 * `clip-path` degrades safely: with no support the base renders as a plain
 * rectangle, which is a slightly boxier laptop and nothing worse.
 */

import * as React from 'react'

export interface LaptopFrameProps {
  children?: React.ReactNode
  /** Rendered width of the lid. The base extends past it on both sides. */
  width?: number
  /** Aspect ratio of the screen, as a Tailwind class. */
  aspect?: string
  /** Draw the base and hinge. Off gives a bare monitor. */
  base?: boolean
  className?: string
}

export function LaptopFrame({
  children,
  width = 420,
  aspect = 'aspect-[16/10]',
  base = true,
  className = '',
}: LaptopFrameProps) {
  return (
    <div className={`shrink-0 ${className}`} style={{ width }}>
      <div className="overflow-hidden rounded-xl border-[10px] border-b-[14px] border-foreground/85 bg-foreground/85 shadow-xl">
        <div className={`${aspect} relative w-full overflow-hidden bg-background`}>
          <span
            aria-hidden
            className="absolute left-1/2 top-1 z-10 size-1 -translate-x-1/2 rounded-full bg-foreground/30"
          />
          {children}
        </div>
      </div>

      {base ? (
        <div aria-hidden className="relative mx-auto" style={{ width: '112%' }}>
          <div
            className="h-3 rounded-b-lg bg-foreground/85"
            // 2.6% on each side is the taper. Expressed as a percentage so it
            // holds at any `width`, which a pixel value would not.
            style={{ clipPath: 'polygon(2.6% 0, 97.4% 0, 94% 100%, 6% 100%)' }}
          />
          {/* The notch a thumb goes into. Drawn as a light bar on the base
              rather than as a cut-out, because a cut-out needs a second
              clip-path and shows the page through the laptop. */}
          <div className="absolute left-1/2 top-0 h-1 w-16 -translate-x-1/2 rounded-b-md bg-background/25" />
        </div>
      ) : null}
    </div>
  )
}
