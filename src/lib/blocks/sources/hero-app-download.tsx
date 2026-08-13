/**
 * <HeroAppDownload> — a mobile hero with a drawn phone and store buttons.
 *
 * The hero for a product whose install is an app store, not a signup form.
 * The two store buttons are the whole conversion path, so they are real
 * links with real accessible names rather than badge images — a hosted
 * badge PNG is one more asset to serve, it does not inherit the theme, and
 * its alt text is invariably left as "app-store-badge.png".
 *
 * The phone is `aria-hidden` for the same reason the panel in
 * <HeroSplit> is: reading out a fake notification list as though it were
 * the visitor's own is worse than saying nothing.
 *
 * The rating line is real text, not a row of star glyphs — "4.9 out of 5,
 * 12,400 ratings" is what a screen reader should say, and five separate
 * star characters is not that.
 */

import * as React from 'react'
import { Apple, Play, Star } from 'lucide-react'

export interface HeroAppDownloadProps {
  eyebrow?: string
  heading?: string
  subheading?: string
  iosHref?: string
  androidHref?: string
  /** Average rating, shown as text beside the store links. */
  rating?: number
  ratingCount?: string
  className?: string
}

const NOTIFICATIONS = [
  { title: 'Deep work', detail: '2h 14m today', accent: true },
  { title: 'Streak', detail: '18 days' },
  { title: 'Next session', detail: 'in 25 min' },
]

export function HeroAppDownload({
  eyebrow = 'Now on iOS and Android',
  heading = 'Your focus, finally in one place.',
  subheading =
    'Track deep work, block the noise and see where your attention actually went — without a dashboard you need a manual to read.',
  iosHref = '#',
  androidHref = '#',
  rating = 4.9,
  ratingCount = '12,400 ratings',
  className = '',
}: HeroAppDownloadProps) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
        {/* -- Copy ------------------------------------------------------ */}
        <div className="max-w-xl">
          {eyebrow ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              {eyebrow}
            </span>
          ) : null}

          <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {heading}
          </h1>

          <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {subheading}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={iosHref}
              className="inline-flex h-14 items-center gap-3 rounded-xl bg-foreground px-5 text-background transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Apple aria-hidden className="h-6 w-6" />
              <span className="text-left leading-tight">
                <span className="block text-[10px] uppercase tracking-wide opacity-70">
                  Download on the
                </span>
                <span className="block text-sm font-semibold">App Store</span>
              </span>
            </a>

            <a
              href={androidHref}
              className="inline-flex h-14 items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-5 backdrop-blur transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Play aria-hidden className="h-6 w-6 text-primary" />
              <span className="text-left leading-tight">
                <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                  Get it on
                </span>
                <span className="block text-sm font-semibold">Google Play</span>
              </span>
            </a>
          </div>

          <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <Star aria-hidden className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span>
              {rating} out of 5 · {ratingCount}
            </span>
          </p>
        </div>

        {/* -- Phone ----------------------------------------------------- */}
        <div aria-hidden className="relative flex justify-center lg:justify-end">
          <div className="w-64 rounded-[2.5rem] border-8 border-foreground/85 bg-card shadow-2xl shadow-black/30">
            {/* Notch */}
            <div className="flex justify-center pt-2">
              <span className="h-1.5 w-16 rounded-full bg-foreground/25" />
            </div>

            <div className="space-y-3 p-4">
              <div className="pt-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Wednesday
                </div>
                <div className="mt-0.5 text-2xl font-bold tracking-tight">Focus</div>
              </div>

              {/* Progress ring stand-in */}
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-center">
                <div className="text-3xl font-extrabold tracking-tight">72%</div>
                <div className="mt-1 text-[10px] text-muted-foreground">of daily goal</div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border/60">
                  <div className="h-full w-[72%] rounded-full bg-primary" />
                </div>
              </div>

              {NOTIFICATIONS.map((n) => (
                <div
                  key={n.title}
                  className={`flex items-center justify-between rounded-xl border p-3 ${
                    n.accent
                      ? 'border-primary/40 bg-primary/10'
                      : 'border-border/60 bg-background/70'
                  }`}
                >
                  <span className="text-xs font-medium">{n.title}</span>
                  <span className="text-[10px] text-muted-foreground">{n.detail}</span>
                </div>
              ))}
            </div>

            {/* Home indicator */}
            <div className="flex justify-center pb-3">
              <span className="h-1 w-24 rounded-full bg-foreground/25" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
