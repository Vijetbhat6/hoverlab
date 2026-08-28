'use client'

/**
 * The live height of the site header, for anything that pins beneath it.
 *
 * The header is not one height. It is 65px from `md` up, but its nav wraps
 * on to a second row on a phone — 85px between 360 and 430px wide, and
 * 125px at 320px. Every `sticky top-16` on the site is really an assertion
 * that the header is 64px tall, which is true on exactly none of those
 * widths, and anything pinned at that offset spends a phone visit tucked
 * behind the nav.
 *
 * It follows the header rather than measuring once, so a rotation or a
 * rewrap moves what is pinned along with it.
 */

import * as React from 'react'

/** Used before the measurement lands, and if there is no header to find. */
export const HEADER_FALLBACK = 64

export function useHeaderHeight(): number {
  const [height, setHeight] = React.useState(HEADER_FALLBACK)

  React.useEffect(() => {
    const header = document.querySelector('header')
    if (!header) return

    const measure = () =>
      setHeight(Math.round(header.getBoundingClientRect().height) || HEADER_FALLBACK)

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(header)
    return () => observer.disconnect()
  }, [])

  return height
}
