/**
 * <PhoneFrame> — a handset or tablet bezel around your own content.
 *
 * The set everyone ships is three assets: iPhone, Android, iPad. They are
 * three assets because they were drawn three times. They are not three
 * *things*: the difference between a modern iPhone and a modern Android
 * handset is the cut-out at the top and about four pixels of corner radius,
 * and a tablet is the same object with a different aspect ratio and no
 * cut-out at all. Drawn once with those as props, the file count goes from
 * three to one and "Pixel with a punch-hole on the left" stops being a
 * request somebody has to fill.
 *
 * Like `<BrowserFrame>`, it takes `children` rather than an image source,
 * so a live component can sit inside it.
 *
 * The status bar is drawn rather than typed. A hard-coded "9:41" is a
 * trademark-adjacent detail of one vendor's marketing, and a real clock
 * would be a hydration mismatch on every server-rendered page (see the same
 * trap in `maintenance-window-state`). `time` is a prop with a neutral
 * default, so it is the caller's decision and always the same on both sides
 * of the render.
 */

import * as React from 'react'

export interface PhoneFrameProps {
  children?: React.ReactNode
  /** Handset or tablet. Changes the aspect ratio and the corner radius. */
  device?: 'phone' | 'tablet'
  /**
   * The cut-out at the top of the screen. This — not the case — is what
   * makes a frame read as one platform or another.
   */
  cutout?: 'island' | 'notch' | 'punch' | 'none'
  /** Draw the status bar and home indicator. */
  chrome?: boolean
  /** Shown at the left of the status bar. Never derived from the clock. */
  time?: string
  /** Rendered width. The height follows from the device's aspect ratio. */
  width?: number
  /** Side buttons on the case. Off for a flat "screen only" look. */
  buttons?: boolean
  className?: string
}

export function PhoneFrame({
  children,
  device = 'phone',
  cutout = 'island',
  chrome = true,
  time = '12:30',
  width = 260,
  buttons = true,
  className = '',
}: PhoneFrameProps) {
  const tablet = device === 'tablet'

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width }}
      // The case, the buttons and the bars are all decoration wrapped around
      // whatever the caller passed. Only the children carry meaning, so the
      // decoration is hidden and the children are not — which is why
      // `aria-hidden` is on the individual pieces and never on this element.
    >
      {buttons ? (
        <>
          <span
            aria-hidden
            className="absolute -left-[3px] top-[18%] h-[6%] w-[3px] rounded-l-sm bg-foreground/25"
          />
          <span
            aria-hidden
            className="absolute -left-[3px] top-[28%] h-[9%] w-[3px] rounded-l-sm bg-foreground/25"
          />
          <span
            aria-hidden
            className="absolute -right-[3px] top-[24%] h-[12%] w-[3px] rounded-r-sm bg-foreground/25"
          />
        </>
      ) : null}

      <div
        className={`relative overflow-hidden border-[6px] border-foreground/85 bg-foreground/85 shadow-xl ${
          tablet ? 'rounded-[1.75rem]' : 'rounded-[2.25rem]'
        }`}
      >
        <div
          className={`relative w-full overflow-hidden bg-background ${
            tablet ? 'aspect-[3/4] rounded-[1.3rem]' : 'aspect-[9/19.5] rounded-[1.8rem]'
          }`}
        >
          {chrome ? (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pt-2 text-[10px] font-medium text-foreground">
              <span>{time}</span>
              <span aria-hidden className="flex items-center gap-1">
                {/* Signal, wifi and battery as shapes — three glyph imports
                    for a decorative strip is a dependency the tier does not
                    need to take on. */}
                <span className="flex items-end gap-[1.5px]">
                  <span className="h-1 w-[2px] rounded-sm bg-current" />
                  <span className="h-[5px] w-[2px] rounded-sm bg-current" />
                  <span className="h-[7px] w-[2px] rounded-sm bg-current" />
                </span>
                <span className="ms-0.5 h-2 w-3.5 rounded-[3px] border border-current p-[1.5px]">
                  <span className="block h-full w-2/3 rounded-[1px] bg-current" />
                </span>
              </span>
            </div>
          ) : null}

          {cutout === 'island' ? (
            <span
              aria-hidden
              className="absolute left-1/2 top-2 z-30 h-6 w-20 -translate-x-1/2 rounded-full bg-foreground/85"
            />
          ) : null}
          {cutout === 'notch' ? (
            <span
              aria-hidden
              className="absolute left-1/2 top-0 z-30 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-foreground/85"
            />
          ) : null}
          {cutout === 'punch' ? (
            <span
              aria-hidden
              className="absolute left-1/2 top-2.5 z-30 size-3 -translate-x-1/2 rounded-full bg-foreground/85"
            />
          ) : null}

          <div className={`h-full w-full ${chrome ? 'pt-9' : ''}`}>{children}</div>

          {chrome && !tablet ? (
            <span
              aria-hidden
              className="absolute bottom-2 left-1/2 h-1 w-1/3 -translate-x-1/2 rounded-full bg-foreground/40"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
