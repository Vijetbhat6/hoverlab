'use client'

/**
 * <LogoMarquee> — infinite-scrolling "Works with your stack" strip.
 *
 * Two rows scrolling in opposite directions, each showing 10 framework
 * names. The track is duplicated so when copy 1 scrolls out, copy 2 is
 * in place — seamless infinite loop via translateX(-50%).
 *
 * Hover pauses the animation. Reduced-motion users see a static row.
 * Mask gradients on the edges fade logos in/out for a polished feel.
 *
 * Why text-only logos (no SVGs): we'd need licenses for brand marks.
 * Wordmarks in monospace read clearly and match the dev-tool aesthetic.
 */

import * as React from 'react'
import { Reveal } from '@/components/reveal'

interface Stack {
  name: string
  glyph: string // monospace shorthand / symbol
}

const ROW_A: Stack[] = [
  { name: 'React', glyph: '⚛' },
  { name: 'Vue', glyph: '◆' },
  { name: 'Svelte', glyph: '◉' },
  { name: 'Angular', glyph: '▲' },
  { name: 'Solid', glyph: '●' },
  { name: 'Astro', glyph: '✦' },
  { name: 'Next.js', glyph: '▲' },
  { name: 'Remix', glyph: '◈' },
  { name: 'Qwik', glyph: '⬡' },
  { name: 'HTMX', glyph: '⬢' },
]

const ROW_B: Stack[] = [
  { name: 'Tailwind', glyph: '≈' },
  { name: 'Bootstrap', glyph: '◗' },
  { name: 'Bulma', glyph: '◽' },
  { name: 'Plain HTML', glyph: '</>' },
  { name: 'WordPress', glyph: 'W' },
  { name: 'Webflow', glyph: '▻' },
  { name: 'Framer', glyph: '◧' },
  { name: 'Figma', glyph: '◇' },
  { name: 'Notion', glyph: '▢' },
  { name: 'Gutenberg', glyph: '▦' },
]

function Tile({ stack }: { stack: Stack }) {
  return (
    <div className="flex shrink-0 items-center gap-2 px-6 py-2">
      <span
        aria-hidden
        className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 font-mono text-sm text-primary"
      >
        {stack.glyph}
      </span>
      <span className="text-sm font-medium text-muted-foreground">
        {stack.name}
      </span>
    </div>
  )
}

export function LogoMarquee() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Works with every stack
          </p>
          <h2 className="mt-2 text-balance text-2xl font-bold tracking-tight sm:text-3xl">
            Drop into any project, no framework required
          </h2>
        </Reveal>
      </div>

      <div className="fx-marquee fx-marquee-mask space-y-3 overflow-hidden">
        {/* Row A — leftward */}
        <div className="fx-marquee-track">
          {[...ROW_A, ...ROW_A].map((s, i) => (
            <Tile key={`a-${i}`} stack={s} />
          ))}
        </div>
        {/* Row B — rightward */}
        <div className="fx-marquee-track fx-marquee-track--reverse">
          {[...ROW_B, ...ROW_B].map((s, i) => (
            <Tile key={`b-${i}`} stack={s} />
          ))}
        </div>
      </div>
    </section>
  )
}
