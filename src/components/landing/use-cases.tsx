'use client'

/**
 * <UseCases> — 4-card persona grid ("Built for everyone who ships UI").
 *
 * Each card: icon, persona name, "you want to" headline, 2-3 bullet
 * outcomes, and a subtle aurora-blob background that animates on hover.
 *
 * Personas: frontend devs, designers, founders/indie hackers, learners.
 * Chosen to cover the four main audiences that visit a CSS effects
 * library — every visitor should be able to self-identify.
 */

import * as React from 'react'
import { Code2, Palette, Rocket, GraduationCap, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Reveal } from '@/components/reveal'

interface Persona {
  icon: React.ReactNode
  name: string
  headline: string
  bullets: string[]
  accent: string // tailwind text color class for icon + bullet marker
  blob: string // tailwind bg color class for aurora blob
}

const PERSONAS: Persona[] = [
  {
    icon: <Code2 className="h-5 w-5" />,
    name: 'Frontend developers',
    headline: 'Ship UI polish without the busywork',
    bullets: [
      'Stop rewriting the same hover and focus states',
      'Bundle the effects you love into one CSS file',
      'Zero JS means zero bundle-size regression',
    ],
    accent: 'text-sky-500',
    blob: 'bg-sky-500/20',
  },
  {
    icon: <Palette className="h-5 w-5" />,
    name: 'Designers',
    headline: 'Bridge the gap between Figma and code',
    bullets: [
      'Show stakeholders live, interactive demos — not screenshots',
      'Customize hue, saturation, scale, and speed to match your brand',
      'Hand developers a copy-paste link instead of a spec doc',
    ],
    accent: 'text-rose-500',
    blob: 'bg-rose-500/20',
  },
  {
    icon: <Rocket className="h-5 w-5" />,
    name: 'Founders & indie hackers',
    headline: 'Make your MVP feel like a Series-B product',
    bullets: [
      'Polished micro-interactions in minutes, not sprints',
      'No design hire required for a launch-ready feel',
      'Pro covers commercial use — ship it in a paid product, no attribution',
    ],
    accent: 'text-amber-500',
    blob: 'bg-amber-500/20',
  },
  {
    icon: <GraduationCap className="h-5 w-5" />,
    name: 'Learners',
    headline: 'Study real-world CSS patterns',
    bullets: [
      'Read the source of every effect — clean, commented, idiomatic',
      'Learn transforms, transitions, and keyframes by example',
      'Fork an effect and make it your own — no setup required',
    ],
    accent: 'text-emerald-500',
    blob: 'bg-emerald-500/20',
  },
]

export function UseCases() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      {/* Aurora background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="fx-aurora-blob absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div
          className="fx-aurora-blob absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl"
          style={{ animationDelay: '4s' }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Built for everyone who ships UI
          </h2>
          <p className="mt-3 text-muted-foreground">
            Whether you&apos;re building a side project, scaling a startup,
            or just learning the ropes — Hoverlab meets you where you are.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {PERSONAS.map((p, i) => (
            <Reveal
              key={p.name}
              delay={i * 80}
              className="fx-bento-tile group relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur"
            >
              {/* hover blob */}
              <div
                aria-hidden
                className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full ${p.blob} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100`}
              />
              <div className="relative">
                <div
                  className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted ${p.accent}`}
                >
                  {p.icon}
                </div>
                <h3 className="text-lg font-bold tracking-tight">{p.name}</h3>
                <p className="mt-1 text-sm font-medium text-foreground/80">
                  {p.headline}
                </p>
                <ul className="mt-4 space-y-2">
                  {p.bullets.map((b, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span
                        aria-hidden
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${p.accent.replace('text-', 'bg-')}`}
                      />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-5 inline-flex items-center gap-1 text-sm font-semibold ${p.accent} hover:gap-2 transition-all`}
                >
                  Get started
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
