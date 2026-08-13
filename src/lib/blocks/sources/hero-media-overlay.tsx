/**
 * <HeroMediaOverlay> — full-bleed media behind copy, with the contrast fixed.
 *
 * The pattern every marketing site reaches for and most get wrong. Two
 * things make the difference between this and unreadable white-on-photo:
 *
 *  - A scrim. Not a flat 40% black wash over everything, but a gradient
 *    that is dense where the text sits and clears where the image is worth
 *    seeing. Text over an unknown photograph has *no* guaranteed contrast
 *    ratio, so the scrim is not decoration — it is the only reason this
 *    passes at all.
 *  - Fixed light-on-dark colours inside the media area. This one section
 *    deliberately does not follow the theme: the background is a
 *    photograph either way, so flipping the copy to dark in light mode
 *    would put dark text on a dark image.
 *
 * `children` is the media slot. Pass an `<img>`, a `<video muted loop
 * playsInline>` or nothing at all — the fallback is a themed gradient, so
 * the block still renders as a hero before anyone wires up an asset.
 *
 * A background video should be muted and `playsInline`, and should carry
 * `motion-reduce:hidden` so it is not forced on someone who asked for
 * stillness — the poster frame is a complete experience.
 */

import * as React from 'react'
import { ArrowRight, Play } from 'lucide-react'

export interface HeroMediaOverlayProps {
  eyebrow?: string
  heading?: string
  subheading?: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
  /** The media layer — an <img> or <video>. Falls back to a gradient. */
  children?: React.ReactNode
  className?: string
}

export function HeroMediaOverlay({
  eyebrow = 'Autumn collection',
  heading = 'Made to be worn out.',
  subheading =
    'Twelve pieces, cut from deadstock wool in a mill that has been running since 1908. Built to outlast the season that named them.',
  primaryLabel = 'Shop the collection',
  primaryHref = '#',
  secondaryLabel = 'Watch the film',
  secondaryHref = '#',
  children,
  className = '',
}: HeroMediaOverlayProps) {
  return (
    <section className={`relative isolate overflow-hidden ${className}`}>
      {/* -- Media ------------------------------------------------------- */}
      <div aria-hidden className="absolute inset-0 -z-20 [&>*]:h-full [&>*]:w-full [&>*]:object-cover">
        {children ?? (
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-primary/40" />
        )}
      </div>

      {/* -- Scrim. Dense at the bottom-left where the copy sits. --------- */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/50 to-black/20"
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col justify-end px-4 py-24 sm:px-6 lg:px-8 lg:py-36">
        <div className="max-w-2xl">
          {eyebrow ? (
            <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              {eyebrow}
            </span>
          ) : null}

          <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-7xl">
            {heading}
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-white/85 sm:text-lg">
            {subheading}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href={primaryHref}
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-white px-6 text-sm font-semibold text-slate-900 shadow-lg shadow-black/25 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              {primaryLabel}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </a>
            <a
              href={secondaryHref}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              <Play aria-hidden className="h-4 w-4" />
              {secondaryLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
