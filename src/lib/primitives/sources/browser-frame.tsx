/**
 * <BrowserFrame> — desktop browser chrome around whatever you put in it.
 *
 * The reason to ship this rather than a PNG of a browser window: every
 * mockup frame in circulation is an image with a fixed slot, so the thing
 * inside it has to be an image too. That rules out the case that matters
 * most — putting your *live* interface in the frame. A hero that shows a
 * real, running component inside browser chrome has no screenshot to
 * regenerate when the UI changes, and no 400KB PNG on the critical path.
 *
 * So this is a wrapper with `children`. An `<img>`, an `<iframe>`, a video,
 * or a live React tree all work, and the frame does not care which.
 *
 * Drawn, not imaged. Three spans and a rounded div are the entire chrome,
 * which means it inherits the page's own dark mode instead of needing a
 * second asset for it, and it stays sharp at any zoom.
 *
 * Accessibility, which mockup frames almost universally get wrong: the
 * chrome is decoration and is `aria-hidden`, so a screen reader is not read
 * a list of traffic-light buttons that do nothing. The URL is the exception
 * — it is information a sighted reader is being given, so it stays in the
 * tree — and the whole frame is a `<figure>` when a caption is supplied,
 * because that is what a labelled illustration is.
 */

import * as React from 'react'
import { Lock, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'

export interface BrowserFrameProps {
  children?: React.ReactNode
  /** Shown in the address bar. Omit for a frame with an empty bar. */
  url?: string
  /** The tab title. Only the `chrome` variant draws a tab. */
  title?: string
  /**
   * `safari` is the macOS window: traffic lights and a centred pill.
   * `chrome` adds a tab strip and left-aligns the omnibox.
   * `minimal` is the chrome-less version for when the frame is a device hint
   * rather than a browser claim.
   */
  variant?: 'safari' | 'chrome' | 'minimal'
  /** Aspect ratio of the content area, as a Tailwind class. */
  aspect?: string
  /** A caption. Supplying one makes the frame a `<figure>`. */
  caption?: React.ReactNode
  className?: string
}

export function BrowserFrame({
  children,
  url = 'app.example.com',
  title = 'Dashboard',
  variant = 'safari',
  aspect = 'aspect-[16/10]',
  caption,
  className = '',
}: BrowserFrameProps) {
  const frame = (
    <div
      className={`overflow-hidden rounded-xl border border-border bg-card shadow-lg ${
        caption ? '' : className
      }`}
    >
      {variant !== 'minimal' ? (
        <div className="flex items-center gap-3 border-b border-border bg-muted/60 px-3 py-2.5">
          <div aria-hidden className="flex shrink-0 gap-1.5">
            {/*
              Grey circles, not red/yellow/green. A coloured set is a direct
              copy of one vendor's window controls and puts a trademark into
              every page that pastes this; the shape alone is what makes the
              frame read as a browser.
            */}
            <span className="size-3 rounded-full bg-foreground/15" />
            <span className="size-3 rounded-full bg-foreground/15" />
            <span className="size-3 rounded-full bg-foreground/15" />
          </div>

          {variant === 'chrome' ? (
            <div
              aria-hidden
              className="hidden min-w-0 max-w-44 shrink items-center gap-2 rounded-t-md bg-background px-3 py-1 text-xs text-muted-foreground sm:flex"
            >
              <span className="size-3 shrink-0 rounded-sm bg-foreground/15" />
              <span className="truncate">{title}</span>
            </div>
          ) : null}

          {variant === 'chrome' ? (
            <div aria-hidden className="hidden shrink-0 items-center gap-1 text-muted-foreground sm:flex">
              {/*
                Back and forward turn round in RTL, because real browsers
                do: in an Arabic UI, Back sits on the right and points
                right. The row itself reverses on its own — `flex` is
                direction-aware — so only the glyphs need saying.

                Reload does not: a circular arrow means "again", not a
                direction, and mirroring it would make it turn the way no
                reload button turns.
              */}
              <ChevronLeft className="size-3.5 rtl:rotate-180" />
              <ChevronRight className="size-3.5 rtl:rotate-180" />
              <RotateCw className="size-3" />
            </div>
          ) : null}

          <div
            className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-background px-2.5 py-1 text-xs text-muted-foreground ${
              variant === 'safari' ? 'justify-center' : ''
            }`}
          >
            <Lock aria-hidden className="size-3 shrink-0" />
            <span className="truncate">{url}</span>
          </div>

          {/*
            A spacer the exact width of the traffic lights, so the centred
            pill in the `safari` variant is centred on the window rather than
            on the space left over — the difference is 30px and it is the
            detail that makes a drawn frame look wrong without anyone being
            able to say why.
          */}
          {variant === 'safari' ? <div aria-hidden className="w-[54px] shrink-0" /> : null}
        </div>
      ) : null}

      <div className={`${aspect} w-full overflow-hidden bg-background`}>{children}</div>
    </div>
  )

  if (!caption) return frame

  return (
    <figure className={`m-0 ${className}`}>
      {frame}
      <figcaption className="mt-2 text-center text-xs text-muted-foreground">{caption}</figcaption>
    </figure>
  )
}
