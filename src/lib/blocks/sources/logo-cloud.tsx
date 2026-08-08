/**
 * <LogoCloud> — an infinite horizontal marquee of customer logos.
 *
 * The track holds the list twice and translates by exactly -50%, so the
 * second copy lands where the first began and the loop has no seam. Edges
 * fade out with a mask rather than a gradient overlay, which keeps it
 * correct on any page background.
 *
 * Honours `prefers-reduced-motion` by stopping the scroll and wrapping
 * instead — a permanent horizontal crawl is a vestibular trigger, and it is
 * also unreadable.
 */

import * as React from 'react'

export interface LogoCloudProps {
  logos?: string[]
  caption?: string
  /** Seconds for one full pass. Longer reads calmer. */
  duration?: number
  className?: string
}

const DEFAULT_LOGOS = [
  'Northwind',
  'Contoso',
  'Initech',
  'Umbrella',
  'Globex',
  'Soylent',
  'Hooli',
  'Vandelay',
]

export function LogoCloud({
  logos = DEFAULT_LOGOS,
  caption = 'Trusted by teams shipping every day',
  duration = 40,
  className = '',
}: LogoCloudProps) {
  return (
    <section className={`w-full py-12 ${className}`}>
      {caption ? (
        <p className="mb-8 text-center text-sm font-medium text-muted-foreground">
          {caption}
        </p>
      ) : null}

      <div
        className="group relative overflow-hidden"
        style={{
          maskImage:
            'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
        }}
      >
        <div
          className="flex w-max items-center gap-14 motion-safe:animate-[logo-marquee_var(--logo-duration)_linear_infinite] motion-reduce:flex-wrap motion-reduce:justify-center group-hover:[animation-play-state:paused]"
          style={{ ['--logo-duration' as string]: `${duration}s` }}
        >
          {[...logos, ...logos].map((name, i) => (
            <span
              key={`${name}-${i}`}
              aria-hidden={i >= logos.length}
              className="shrink-0 text-xl font-bold tracking-tight text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes logo-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}
