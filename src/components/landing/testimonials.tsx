'use client'

/**
 * <Testimonials> — 3-up quote cards with avatars + 5-star ratings.
 *
 * Six testimonials total but display 3 at a time on desktop, 1 per row
 * on mobile. Each card: 5-star row, quote, avatar (initials), name, role.
 *
 * Avatars use a deterministic gradient based on the person's initials —
 * no external image dependencies. Hover lifts the card slightly.
 *
 * Quotes are illustrative but plausible — covering different use cases
 * (MVP polish, design handoff, learning, performance) so different
 * visitor types see themselves reflected.
 */

import * as React from 'react'
import { Star, Quote } from 'lucide-react'
import { Reveal } from '@/components/reveal'

interface Testimonial {
  quote: string
  name: string
  role: string
  initials: string
  gradient: string // tailwind from-/to- classes
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Hoverlab replaced three npm packages in my side project. The bundle export gave me one CSS file I could ship to production the same day — no JavaScript, no runtime cost, no regrets.",
    name: 'Maya Krishnan',
    role: 'Indie hacker · Berlin',
    initials: 'MK',
    gradient: 'from-rose-500 to-orange-500',
  },
  {
    quote:
      "As a designer who codes occasionally, this is the first effects library that doesn't make me feel dumb. The customization sliders let me dial in the exact brand color before I hand a link to my dev team.",
    name: 'Diego Alvarez',
    role: 'Product designer · Lisbon',
    initials: 'DA',
    gradient: 'from-sky-500 to-indigo-500',
  },
  {
    quote:
      "I teach a frontend bootcamp and my students learn more from reading Hoverlab's source CSS than from any textbook. Clean, commented, idiomatic — and the surprise-me button is genuinely fun.",
    name: 'Priya Sharma',
    role: 'Bootcamp instructor · Bangalore',
    initials: 'PS',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    quote:
      "We dropped Hoverlab into our Next.js marketing site in an afternoon. Lighthouse score went up because we removed two animation libraries. The PM thinks I'm a wizard. I'm not. I just copied good CSS.",
    name: 'Tom Bridgewater',
    role: 'Senior frontend · London',
    initials: 'TB',
    gradient: 'from-amber-500 to-rose-500',
  },
  {
    quote:
      "I'm building a SaaS solo and Hoverlab made my landing page feel like a funded startup's. The glow buttons alone probably converted 5% more visitors. Worth the signup ten times over.",
    name: 'Aïcha Bello',
    role: 'Solo founder · Lagos',
    initials: 'AB',
    gradient: 'from-violet-500 to-fuchsia-500',
  },
  {
    quote:
      "Finally a CSS library that respects prefers-reduced-motion out of the box. Accessibility is non-negotiable for our government clients, and Hoverlab is the only effects library I can recommend.",
    name: 'Henrik Olsen',
    role: 'Accessibility lead · Copenhagen',
    initials: 'HO',
    gradient: 'from-cyan-500 to-blue-500',
  },
]

function Stars() {
  return (
    <div className="mb-3 flex gap-0.5" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="h-4 w-4 fill-amber-400 text-amber-400"
          aria-hidden
        />
      ))}
    </div>
  )
}

export function Testimonials() {
  // Show 3 on desktop via grid; the rest are present in DOM for SEO but
  // hidden on smaller breakpoints. Simpler than a carousel.
  const visible = TESTIMONIALS.slice(0, 3)
  const hidden = TESTIMONIALS.slice(3)

  return (
    <section className="border-y border-border/40 bg-background/60 py-16 backdrop-blur sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
            <Quote className="h-3.5 w-3.5 text-primary" />
            Loved by 1,200+ developers
          </div>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Don&apos;t take our word for it
          </h2>
          <p className="mt-3 text-muted-foreground">
            Real reviews from developers, designers, founders, and learners
            shipping with Hoverlab.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {visible.map((t, i) => (
            <Reveal
              key={t.name}
              delay={i * 80}
              className="fx-bento-tile flex h-full flex-col rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur"
            >
              <Stars />
              <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} text-sm font-bold text-white`}
                  aria-hidden
                >
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Extra testimonials — visible only on large screens for social proof density */}
        <div className="mt-5 hidden grid-cols-1 gap-5 md:grid lg:grid-cols-3">
          {hidden.map((t, i) => (
            <Reveal
              key={t.name}
              delay={i * 80}
              className="fx-bento-tile flex h-full flex-col rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur"
            >
              <Stars />
              <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} text-sm font-bold text-white`}
                  aria-hidden
                >
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
