'use client'

/**
 * <BentoGrid> — asymmetric Apple/Stripe-style feature showcase.
 *
 * 6 tiles in a 4-column × 3-row grid with mixed sizes:
 *  - Big tile (2×2): pure-CSS hero with live demo
 *  - Wide tile (2×1): copy-paste workflow snippet
 *  - Tall tile (1×2): big stat
 *  - Small (1×1): license badge
 *  - Small (1×1): PWA badge
 *  - Wide (2×1): testimonial quote
 *
 * Tiles lift on hover (.fx-bento-tile), wrapped in <Reveal> for fade-in.
 */

import * as React from 'react'
import { Copy, Shield, Smartphone, Sparkles, Quote } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { CATEGORIES } from '@/lib/effect-types'
import { TOTAL_COUNT } from '@/lib/catalog-stats'

export function BentoGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Reveal className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Why developers choose Hoverlab
        </h2>
        <p className="mt-3 text-muted-foreground">
          Six reasons it beats writing CSS from scratch or pulling in another
          dependency.
        </p>
      </Reveal>

      {/* 4-column × 3-row grid on lg. Tiles span varying cells. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-3">
        {/* Big tile: pure CSS demo (2×2 on lg) */}
        <Reveal
          className="fx-bento-tile relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-emerald-600/5 p-6 sm:col-span-2 lg:row-span-2"
          delay={0}
        >
          <div className="flex h-full flex-col justify-between gap-6">
            <div>
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">
                Pure CSS, zero JavaScript
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Every effect is plain HTML + plain CSS. No React, no Vue, no
                runtime. Paste into a static HTML file and it just works —
                or drop into your framework of choice. The browser does all
                the work.
              </p>
            </div>
            {/* Mini live demo: 3 buttons with hover effects */}
            <div className="flex flex-wrap gap-2">
              <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-105 hover:shadow-lg hover:shadow-primary/30">
                Hover me
              </button>
              <button className="rounded-lg border border-primary/40 bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                And me
              </button>
              <button className="group relative overflow-hidden rounded-lg bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-foreground hover:text-background">
                <span className="relative z-10">Try me too</span>
              </button>
            </div>
          </div>
          {/* decorative blob */}
          <div
            aria-hidden
            className="fx-aurora-blob pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
          />
        </Reveal>

        {/* Wide tile: copy-paste snippet (2×1) */}
        <Reveal
          className="fx-bento-tile overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-6 sm:col-span-2"
          delay={80}
        >
          <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Copy className="h-4 w-4" />
          </div>
          <h3 className="text-base font-semibold tracking-tight">
            One click to copy
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Click any effect&apos;s copy button — HTML and CSS land in your
            clipboard, ready to paste.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-muted/60 p-3 text-xs leading-relaxed">
            <code className="font-mono">
              <span className="text-primary">{'<button '}</span>
              <span className="text-amber-500">{'class'}</span>
              <span className="text-muted-foreground">{'='}</span>
              <span className="text-emerald-500">{'"fx-glow"'}</span>
              <span className="text-primary">{'>'}</span>
              {'\n  Hover me\n'}
              <span className="text-primary">{'</button>'}</span>
            </code>
          </pre>
        </Reveal>

        {/* Tall tile: big stat (1×2) */}
        <Reveal
          className="fx-bento-tile flex flex-col justify-between rounded-2xl border border-border/60 bg-card/80 p-6 lg:row-span-2"
          delay={160}
        >
          <div>
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
              <Shield className="h-4 w-4" />
            </div>
            <div className="fx-stat-pop text-5xl font-extrabold tracking-tight text-foreground">
              {TOTAL_COUNT.toLocaleString('en-US')}+
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground/80">
              Effects ready to ship
            </div>
          </div>
          <div className="mt-6 border-t border-border/60 pt-4">
            {/*
              The tail used to enumerate all twelve categories by name. There
              are {CATEGORIES.length} now, so a hard-coded list reads as the
              whole taxonomy while naming barely a third of it — the first
              few plus a count is both shorter and true.
            */}
            <p className="text-xs leading-relaxed text-muted-foreground">
              Across <span className="font-semibold text-foreground">{CATEGORIES.length} categories</span> — buttons, loaders, cards, text, backgrounds, charts, 3D, neon and {CATEGORIES.length - 8} more.
            </p>
          </div>
        </Reveal>

        {/* Small tile: license (1×1) */}
        <Reveal
          className="fx-bento-tile flex flex-col justify-between rounded-2xl border border-border/60 bg-card/80 p-5"
          delay={0}
        >
          <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight">Clear license</div>
            <div className="text-xs text-muted-foreground">
              Free for personal use, Pro for commercial
            </div>
          </div>
        </Reveal>

        {/* Small tile: PWA (1×1) */}
        <Reveal
          className="fx-bento-tile flex flex-col justify-between rounded-2xl border border-border/60 bg-card/80 p-5"
          delay={80}
        >
          <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15 text-sky-500">
            <Smartphone className="h-4 w-4" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight">PWA</div>
            <div className="text-xs text-muted-foreground">
              Installable, offline-first
            </div>
          </div>
        </Reveal>

        {/* Wide tile: testimonial quote (2×1) */}
        <Reveal
          className="fx-bento-tile relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 to-primary/5 p-6 sm:col-span-2"
          delay={160}
        >
          <Quote className="mb-3 h-6 w-6 text-primary/40" />
          <blockquote className="text-sm leading-relaxed text-foreground/90">
            &ldquo;I shipped three landing pages in a weekend using Hoverlab.
            The copy-paste workflow is unreal — no more digging through
            CodePen at 2am.&rdquo;
          </blockquote>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 text-xs font-bold text-white">
              MK
            </div>
            <div className="text-xs">
              <div className="font-semibold">Maya K.</div>
              <div className="text-muted-foreground">Indie hacker, Berlin</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
