/**
 * <HeroScreenshot> — centered copy above a browser-framed product shot.
 *
 * The layout for a product whose value is obvious on sight. Copy sells the
 * idea, the frame proves it exists, and the frame is what does the second
 * job: an unframed screenshot floating on a gradient reads as a mockup,
 * while the same image inside window chrome with a URL bar reads as
 * something already running.
 *
 * `children` replaces the placeholder, so this wraps a real <img> or <video>
 * without touching the frame:
 *
 *   <HeroScreenshot>
 *     <img src="/app.png" alt="" className="w-full" />
 *   </HeroScreenshot>
 *
 * Pass an empty `alt` when you do. The surrounding copy already says what
 * the product is, and a screenshot described twice is noise — the frame and
 * its placeholder are `aria-hidden` for the same reason.
 *
 * The frame is masked at the bottom rather than cropped, which is what
 * keeps a tall screenshot from dictating the height of the fold.
 */

import * as React from 'react'
import { ArrowRight, Lock, Star } from 'lucide-react'

export interface HeroScreenshotProps {
  eyebrow?: string
  heading?: string
  subheading?: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
  /** URL shown in the frame's address bar. Sell the product, not localhost. */
  addressBar?: string
  /** Rating strip under the CTAs. Omit to hide it. */
  rating?: { score: number; count: number; source: string }
  /** Real screenshot. Falls back to a drawn placeholder. */
  children?: React.ReactNode
  className?: string
}

export function HeroScreenshot({
  eyebrow = 'Analytics, without the spreadsheet',
  heading = 'See what your product is doing, right now.',
  subheading =
    'Every event, session and conversion in one place — with the answer already on screen instead of three filters away.',
  primaryLabel = 'Try it free',
  primaryHref = '#',
  secondaryLabel = 'Watch the tour',
  secondaryHref = '#',
  addressBar = 'app.acme.com/overview',
  rating = { score: 4.9, count: 812, source: 'G2' },
  children,
  className = '',
}: HeroScreenshotProps) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pt-20 sm:px-6 lg:px-8 lg:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          {eyebrow ? (
            <span className="inline-flex items-center rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              {eyebrow}
            </span>
          ) : null}

          <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {heading}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-pretty leading-relaxed text-muted-foreground sm:text-lg">
            {subheading}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={primaryHref}
              className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
            >
              {primaryLabel}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </a>
            <a
              href={secondaryHref}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border/60 bg-card/60 px-7 text-sm font-semibold backdrop-blur transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
            >
              {secondaryLabel}
            </a>
          </div>

          {rating ? (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span aria-hidden className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </span>
              <span>
                <span className="font-semibold text-foreground">{rating.score}</span> from{' '}
                {rating.count.toLocaleString('en-US')} reviews on {rating.source}
              </span>
            </div>
          ) : null}
        </div>

        {/* -- Framed shot --------------------------------------------- */}
        <div className="relative mt-14">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-t-2xl border border-b-0 border-border/60 bg-card/80 shadow-2xl shadow-black/25 backdrop-blur [mask-image:linear-gradient(to_bottom,#000_65%,transparent_100%)]">
            {/* Window chrome */}
            <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
              <div aria-hidden className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
              </div>
              <div className="flex flex-1 items-center justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-background/80 px-3 py-1 text-[11px] text-muted-foreground">
                  <Lock aria-hidden className="h-3 w-3" />
                  {addressBar}
                </span>
              </div>
              <div aria-hidden className="w-12" />
            </div>

            {children ?? <ScreenshotPlaceholder />}
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * The drawn stand-in for a real screenshot.
 *
 * Kept as a separate component so deleting it is one line once you have an
 * image — and so it stays out of the way of anyone reading the frame above.
 */
function ScreenshotPlaceholder() {
  return (
    <div aria-hidden className="flex h-[26rem] bg-background/60">
      {/* Sidebar */}
      <div className="hidden w-52 shrink-0 border-e border-border/60 p-4 sm:block">
        <div className="h-7 w-24 rounded-md bg-muted" />
        <div className="mt-6 space-y-2">
          {[true, false, false, false, false].map((active, i) => (
            <div
              key={i}
              className={`h-8 rounded-lg ${active ? 'bg-primary/15' : 'bg-muted/60'}`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div className="h-6 w-40 rounded-md bg-muted" />
          <div className="h-8 w-24 rounded-lg bg-primary/20" />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border/60 p-3">
              <div className="h-2.5 w-12 rounded bg-muted" />
              <div className="mt-2.5 h-5 w-20 rounded bg-muted/80" />
              <div className="mt-1.5 h-2 w-10 rounded bg-emerald-500/40" />
            </div>
          ))}
        </div>

        <div className="flex h-48 items-end gap-2 rounded-xl border border-border/60 p-4">
          {[42, 61, 48, 72, 55, 88, 69, 96, 77, 100, 84, 65, 91, 58].map((h, i) => (
            <div
              key={i}
              style={{ height: `${h}%` }}
              className="flex-1 rounded-sm bg-gradient-to-t from-primary/25 to-primary/80"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
