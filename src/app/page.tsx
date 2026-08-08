'use client'

/**
 * Landing page ("/") — the first thing visitors see.
 *
 *  - Marketing hero: what Hoverlab is, who it's for, what's in the box.
 *  - Live effect showcase (4 featured tiles, no auth required to view).
 *  - Category overview.
 *  - Primary CTA → /signup, secondary → /login.
 *  - If the user is already logged in, the CTA becomes "Open the library →".
 *
 * Authenticated visitors are redirected to /library by middleware, so
 * reaching this page while logged in is rare — but we still handle it
 * gracefully.
 */

import * as React from 'react'
import Link from 'next/link'
import {
  Wand2,
  Sparkles,
  ArrowRight,
  Heart,
  Package,
  Code2,
  Zap,
  Shield,
  Github,
  Layers,
  Palette,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/auth-provider'
import { LandingShowcase } from '@/components/landing-showcase'
import { Reveal } from '@/components/reveal'
import { StatsBand } from '@/components/landing/stats-band'
import { LadderBand } from '@/components/landing/ladder-band'
import { FaqAccordion } from '@/components/landing/faq-accordion'
import { LogoMarquee } from '@/components/landing/logo-marquee'
import { BentoGrid } from '@/components/landing/bento-grid'
import { CodePreviewWindow } from '@/components/landing/code-preview'
import { UseCases } from '@/components/landing/use-cases'
import { Testimonials } from '@/components/landing/testimonials'
import { PricingTiers } from '@/components/landing/pricing-tiers'
import { ComparisonTable } from '@/components/landing/comparison-table'
import { ChangelogTimeline } from '@/components/landing/changelog-timeline'
import { Roadmap } from '@/components/landing/roadmap'
import { NewsletterSignup } from '@/components/landing/newsletter-signup'
import { CommunityBand } from '@/components/landing/community-band'
import { CATEGORIES } from '@/lib/effect-types'
import { TOTAL_COUNT, countByCategory } from '@/lib/catalog-stats'

export default function LandingPage() {
  const { user, loading } = useAuth()

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-lg shadow-primary/30">
              <Wand2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight">Hoverlab</span>
              <span className="text-[11px] text-muted-foreground">
                A living CSS effects library
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hidden gap-1.5 sm:inline-flex"
              asChild
            >
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer noopener"
              >
                <Github className="h-4 w-4" /> GitHub
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {TOTAL_COUNT.toLocaleString('en-US')} effects · {CATEGORIES.length} categories · zero dependencies
          </div>
          <h1 className="text-balance bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
            Beautiful CSS effects,
            <br className="hidden sm:inline" /> ready to copy.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg lg:text-xl">
            Hoverlab is a curated, open-source library of pure-CSS effects —
            buttons, loaders, cards, charts, 3D, neon, patterns and {CATEGORIES.length - 7}{' '}
            more categories. Live demos, copy-ready code, and zero JavaScript
            required. Sign in to save your favorites and bundle them for
            export.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {!loading && user ? (
              <Button size="lg" className="h-12 gap-1.5 px-6" asChild>
                <Link href="/library">
                  Open the library
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button size="lg" className="h-12 gap-1.5 px-6" asChild>
                <Link href="/signup">
                  Create your free account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              className="h-12 gap-1.5 px-6"
              asChild
            >
              <Link href="/login">I already have an account</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Free forever · No credit card · Your favorites sync across devices
          </p>
        </div>
      </section>

      {/* Stats band */}
      <StatsBand />

      {/* The four tiers — effects up to templates */}
      <LadderBand />

      {/* Logo marquee — works with every stack */}
      <LogoMarquee />

      {/* Live showcase */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <Reveal className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              A taste of what&apos;s inside
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Four live demos. No screenshots — these are real, running
              effects rendered in your browser.
            </p>
          </div>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {TOTAL_COUNT.toLocaleString('en-US')} total effects
          </Badge>
        </Reveal>
        <Reveal delay={80}>
          <LandingShowcase />
        </Reveal>
      </section>

      {/* Code preview window — from browser to production */}
      <CodePreviewWindow />

      {/* Features grid */}
      <section className="border-y border-border/40 bg-background/60 py-16 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to ship
            </h2>
            <p className="mt-3 text-muted-foreground">
              From a single hover button to a full design system. Hoverlab gives
              you the building blocks, the source code, and a place to save
              what you love.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Reveal delay={0}>
              <FeatureCard
                icon={<Layers className="h-5 w-5" />}
                title={`${TOTAL_COUNT.toLocaleString('en-US')}+ effects`}
                description={`Hand-crafted and generated effects across ${CATEGORIES.length} categories — from buttons, loaders and cards to charts, 3D, neon, masks and micro-interactions.`}
              />
            </Reveal>
            <Reveal delay={80}>
              <FeatureCard
                icon={<Code2 className="h-5 w-5" />}
                title="Copy-ready code"
                description="Every effect ships with its HTML and CSS in one click. No JavaScript, no framework lock-in, no build step. Paste into any project — React, Vue, plain HTML, anything."
              />
            </Reveal>
            <Reveal delay={160}>
              <FeatureCard
                icon={<Palette className="h-5 w-5" />}
                title="Live customization"
                description="Hue, saturation, scale, and speed sliders let you tune every effect to your brand. Six preset palettes (Sunset, Ocean, Forest, Monochrome, Neon, Pastel) get you started in one click."
              />
            </Reveal>
            <Reveal delay={0}>
              <FeatureCard
                icon={<Heart className="h-5 w-5" />}
                title="Favorites that follow you"
                description="Sign in to save effects you love. Your favorites sync to your account and show up on any device — never lose a carefully curated list to a cleared cache again."
              />
            </Reveal>
            <Reveal delay={80}>
              <FeatureCard
                icon={<Package className="h-5 w-5" />}
                title="Bundle & export"
                description="Add effects to your bundle with their current customization, then export the whole bundle as one minified CSS file. Build your own design system file in minutes."
              />
            </Reveal>
            <Reveal delay={160}>
              <FeatureCard
                icon={<Shield className="h-5 w-5" />}
                title="Pure CSS, zero risk"
                description="No npm install, no dependency bloat, no supply-chain risk. The CSS is right there — read it, edit it, own it. Perfect for prototypes, production, and learning."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Bento grid — why developers choose Hoverlab */}
      <BentoGrid />

      {/* Comparison table — Hoverlab vs alternatives */}
      <ComparisonTable />

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Three steps to your next UI
          </h2>
          <p className="mt-3 text-muted-foreground">
            No setup, no boilerplate. Sign up, browse, copy.
          </p>
        </Reveal>

        <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Connector line — desktop only */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
          />
          <Reveal delay={0}>
            <StepCard
              number="01"
              icon={<Sparkles className="h-5 w-5" />}
              title="Create your account"
              description="Free forever, just an email and password. Your favorites and bundle are saved to your account from this point on."
            />
          </Reveal>
          <Reveal delay={120}>
            <StepCard
              number="02"
              icon={<Layers className="h-5 w-5" />}
              title="Browse & customize"
              description="Filter by category, search by keyword, hit Surprise Me for inspiration. Open any effect to tweak hue, saturation, scale, and speed in real time."
            />
          </Reveal>
          <Reveal delay={240}>
            <StepCard
              number="03"
              icon={<Copy className="h-5 w-5" />}
              title="Copy or bundle"
              description="Grab a single effect's code with one click, or add several to your bundle and export them together as one CSS file ready to drop into your project."
            />
          </Reveal>
        </div>
      </section>

      {/* Use cases — built for everyone who ships UI */}
      <UseCases />

      {/* Pricing tiers */}
      <PricingTiers />

      {/* Categories overview */}
      <section className="border-y border-border/40 bg-background/60 py-16 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {CATEGORIES.length} categories to explore
            </h2>
            <p className="mt-3 text-muted-foreground">
              From micro-interactions to full-page backgrounds, every category
              is curated for quality and ready to drop into production.
            </p>
          </Reveal>
          <Reveal delay={80} className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const count = countByCategory(c)
              return (
                <Link
                  key={c}
                  href={`/library?filter=${encodeURIComponent(c)}`}
                  className="group inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground"
                >
                  {c}
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                    {count}
                  </span>
                </Link>
              )
            })}
          </Reveal>
        </div>
      </section>

      {/* Testimonials — social proof */}
      <Testimonials />

      {/* Changelog timeline — what's new */}
      <ChangelogTimeline />

      {/* FAQ */}
      <FaqAccordion />

      {/* Roadmap — now / next / later */}
      <Roadmap />

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-emerald-600/10 px-6 py-16 text-center sm:px-12 sm:py-24">
            <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -right-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="relative">
              <Zap className="mx-auto mb-4 h-10 w-10 text-primary" />
              <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                Ready to make your UI move?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground sm:text-lg">
                Create your free account in seconds. Your favorites and bundle
                will sync across every device you sign in on.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" className="h-12 gap-1.5 px-6" asChild>
                  <Link href="/signup">
                    Get started — it&apos;s free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-12 px-6"
                  asChild
                >
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
              <p className="mt-6 text-xs text-muted-foreground">
                Join 1,200+ developers and designers shipping prettier UIs with pure CSS.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Newsletter signup */}
      <NewsletterSignup />

      {/* Community band — GitHub / Discord / X */}
      <CommunityBand />

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-600 text-white">
              <Wand2 className="h-4 w-4" />
            </div>
            <span>Hoverlab — A living CSS effects library</span>
          </div>
          <p className="font-mono text-xs">
            Built with pure CSS · No JavaScript frameworks required
          </p>
        </div>
      </footer>
    </div>
  )
}

/* ---------- sub-components ---------- */

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/0 blur-2xl transition-colors group-hover:bg-primary/10"
      />
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="relative h-full rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur transition-all hover:border-primary/40 hover:-translate-y-1">
      <div className="absolute right-4 top-4 text-5xl font-extrabold text-muted-foreground/10">
        {number}
      </div>
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-4 ring-background">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  )
}
