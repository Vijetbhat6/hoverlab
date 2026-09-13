/**
 * <DeviceShowcase> — a laptop with a handset overlapping it.
 *
 * The arrangement every product hero uses, and the one that is fiddly enough
 * that people paste a screenshot of it instead. Two things make it fiddly and
 * both are handled here:
 *
 * 1. **The overlap is a negative margin, not absolute positioning.** Absolute
 *    positioning takes the phone out of flow, so the container collapses to
 *    the laptop's height and the phone hangs over whatever is below it. A
 *    negative inline-start margin keeps both in flow and keeps the group's
 *    height honest.
 *
 * 2. **It stacks rather than shrinking.** Below `sm` the two frames sit one
 *    above the other with the overlap removed, because a laptop scaled to fit
 *    a 360px viewport has a screen 200px wide and shows nothing. Every
 *    image-based version of this arrangement simply gets smaller.
 *
 * The negative margin is `-ms-` and not `-ml-`, so the phone sits on the
 * correct side of the laptop in an RTL layout rather than off the far edge.
 */

import * as React from 'react'

import { LaptopFrame } from './laptop-frame'
import { PhoneFrame } from './phone-frame'

export interface DeviceShowcaseProps {
  /** What the laptop shows. */
  desktop?: React.ReactNode
  /** What the handset shows. */
  mobile?: React.ReactNode
  /** Which side the handset sits on. */
  phoneSide?: 'start' | 'end'
  /** Laptop width in px; the handset is sized from it. */
  width?: number
  className?: string
}

export function DeviceShowcase({
  desktop,
  mobile,
  phoneSide = 'end',
  width = 460,
  className = '',
}: DeviceShowcaseProps) {
  const phone = (
    <PhoneFrame
      width={Math.round(width * 0.3)}
      buttons={false}
      className={
        phoneSide === 'end'
          ? 'z-10 -ms-10 mt-10 hidden sm:block'
          : 'z-10 -me-10 mt-10 hidden sm:block'
      }
    >
      {mobile}
    </PhoneFrame>
  )

  return (
    <div className={`flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:gap-0 ${className}`}>
      {phoneSide === 'start' ? phone : null}
      <LaptopFrame width={width}>{desktop}</LaptopFrame>
      {phoneSide === 'end' ? phone : null}

      {/* The stacked fallback. Rendered only below `sm`, where the overlapped
          copy above is hidden — two elements rather than one so neither
          layout has to fight the other's margins. */}
      <div className="sm:hidden">
        <PhoneFrame width={Math.round(width * 0.42)} buttons={false}>
          {mobile}
        </PhoneFrame>
      </div>
    </div>
  )
}
