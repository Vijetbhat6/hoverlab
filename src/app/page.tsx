'use client'

/**
 * Landing page ("/") — the first thing visitors see.
 *
 *  - Marketing hero: what Hoverlab is, who it's for, what's in the box.
 *  - Live effect showcase (4 featured tiles, no auth required to view).
 *  - Category overview.
 *  - Primary CTA → /browse, secondary → /signup (or /library when signed in).
 *
 * The primary action is deliberately not an auth screen: the catalog is
 * public, so the front door sends people into it rather than asking them to
 * register for something they can already do. See the note above the buttons.
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
  Package,
  Code2,
  Zap,
  Shield,
  Layers,
  Palette,
  Copy,
  Terminal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/auth-provider'
import { SiteHeader } from '@/components/site-header'
import { CatalogSearchForm } from '@/components/catalog-search-form'
import { LandingShowcase } from '@/components/landing-showcase'
import { Reveal } from '@/components/reveal'
import { StatsBand } from '@/components/landing/stats-band'
import { LadderBand } from '@/components/landing/ladder-band'
import { FaqAccordion } from '@/components/landing/faq-accordion'
import { LogoMarquee } from '@/components/landing/logo-marquee'
import { CodePreviewWindow } from '@/components/landing/code-preview'
import { UseCases } from '@/components/landing/use-cases'
import { PricingTiers } from '@/components/landing/pricing-tiers'
import { ComparisonTable } from '@/components/landing/comparison-table'
import { NewsletterSignup } from '@/components/landing/newsletter-signup'
import { CommunityBand } from '@/components/landing/community-band'
import { CATEGORIES } from '@/lib/effect-types'
import { TOTAL_COUNT, countByCategory } from '@/lib/catalog-stats'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { PAGE_COUNT } from '@/lib/pages/page-index'
import { TEMPLATE_COUNT } from '@/lib/templates/template-index'

/**
 * The four rungs, as entry points under the hero search.
 *
 * Counts come from `catalog-stats` and the three index modules' `*_COUNT`
 * exports rather than from `lib/browse` — that module builds its flattened
 * index off `EFFECT_INDEX`, and importing it here would put 772 KB of
 * metadata into the bundle of the highest-traffic page to render four
 * numbers.
 */
const HERO_TIERS = [
  { label: 'Effects', href: '/library', count: TOTAL_COUNT },
  { label: 'Blocks', href: '/blocks', count: BLOCK_COUNT },
  { label: 'Pages', href: '/pages', count: PAGE_COUNT },
  { label: 'Templates', href: '/templates', count: TEMPLATE_COUNT },
]

export default function LandingPage() {
  const { user, loading } = useAuth()

  /*
   * No `overflow-hidden` on the wrapper below, unlike every other version of
   * it. It was containing the decorative blobs — but `overflow: hidden` on an
   * ancestor also makes that ancestor the scroll container for anything
   * sticky inside it, and this page's header was inside it. The "sticky"
   * header on the front door has never actually stuck. The blobs are clipped
   * by their own wrapper, which already has the property.
   */
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {/*
        The same header as everywhere else. This page used to carry its own,
        with five ladder links to the catalog's nine surfaces and none of the
        bundle, compare or search controls — so the front door offered a
        different, smaller product than the one behind it.
      */}
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          {/*
            The badge used to read "… · zero dependencies", which was true of
            a catalog that held nothing but CSS. Blocks and everything above
            them are React source with real imports, so the claim now belongs
            to the effects rung alone — where the features grid still makes
            it. Here the counts do more work anyway: they are the ladder.
          */}
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {TOTAL_COUNT.toLocaleString('en-US')} effects · {BLOCK_COUNT} blocks ·{' '}
            {PAGE_COUNT} pages · {TEMPLATE_COUNT} templates
          </div>
          <h1 className="type-display text-gradient-heading">
            Beautiful UI,
            <br className="hidden sm:inline" /> ready to copy.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-body sm:text-lg lg:text-xl">
            Hoverlab is a curated, open-source catalog that starts at a single
            hover state and goes all the way up to a project you can deploy.
            Copy one of {TOTAL_COUNT.toLocaleString('en-US')} pure-CSS effects,
            drop in a finished pricing section, or clone a whole starter — live
            demos and real source at every rung, with{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
              npx hoverlab add
            </code>{' '}
            if you&apos;d rather stay in the terminal.
          </p>
          {/*
            The front door is a search box, not a signup decision.

            /browse is the best surface on the site — one query ranked across
            all four rungs — and it was reachable only by noticing a nav item.
            The hero's job is to hand someone the thing they came for, and
            what a developer arrives wanting is "do you have a pricing
            section", not "which of these two auth screens". So the search
            leads, the tier chips give it a floor for anyone who does not
            have a word in mind, and the account comes after the catalog has
            made its case — nothing here needs one. proxy.ts leaves /browse,
            /library and every detail page public, and copy works signed out.
          */}
          <CatalogSearchForm
            size="lg"
            label="Search every effect, block, page and template"
            className="mx-auto mt-9 max-w-2xl"
          />

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {HERO_TIERS.map((tier) => (
              <Link
                key={tier.href}
                href={tier.href}
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {tier.label}
                <span className="text-muted-foreground/70">
                  {tier.count.toLocaleString('en-US')}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="outline" className="h-12 gap-1.5 px-6" asChild>
              <Link href="/browse">
                Browse all {(TOTAL_COUNT + BLOCK_COUNT + PAGE_COUNT + TEMPLATE_COUNT).toLocaleString('en-US')} components
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {!loading && user ? (
              <Button size="lg" variant="ghost" className="h-12 gap-1.5 px-6" asChild>
                <Link href="/library">Open your library</Link>
              </Button>
            ) : (
              <Button size="lg" variant="ghost" className="h-12 gap-1.5 px-6" asChild>
                <Link href="/signup">Create a free account</Link>
              </Button>
            )}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No account needed to browse or copy · Sign up only to save
            favorites and sync them across devices
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
                title="Four tiers, one catalog"
                description={`${TOTAL_COUNT.toLocaleString('en-US')}+ effects across ${CATEGORIES.length} categories, ${BLOCK_COUNT} blocks, ${PAGE_COUNT} pages and ${TEMPLATE_COUNT} deployable templates. Each tier is built from the one below it, so you can drill from a template down to the button inside it.`}
              />
            </Reveal>
            <Reveal delay={80}>
              <FeatureCard
                icon={<Code2 className="h-5 w-5" />}
                title="Copy-ready source"
                description="Effects hand you HTML and CSS in one click. Blocks and above hand you the actual files — components, their imports, and the dependency list — laid out the way they'll sit in your repo."
              />
            </Reveal>
            <Reveal delay={160}>
              <FeatureCard
                icon={<Terminal className="h-5 w-5" />}
                title="Install from the terminal"
                description="npx hoverlab add <id> writes any effect, block, page or template straight into your project — it detects your setup and picks the right paths. Free, no account, no token. There's an MCP server too, so your editor's agent can search the catalog."
              />
            </Reveal>
            <Reveal delay={0}>
              <FeatureCard
                icon={<Palette className="h-5 w-5" />}
                title="Live customization"
                description="Hue, saturation, scale, and speed sliders let you tune every effect to your brand. Six preset palettes (Sunset, Ocean, Forest, Monochrome, Neon, Pastel) get you started in one click."
              />
            </Reveal>
            <Reveal delay={80}>
              <FeatureCard
                icon={<Package className="h-5 w-5" />}
                title="Favorites, bundles & export"
                description="Save what you love and it syncs to every device you sign in on. Add effects to a bundle with their customization intact, then export the lot as one minified CSS file — or as Vue, Svelte or Tailwind."
              />
            </Reveal>
            <Reveal delay={160}>
              <FeatureCard
                icon={<Shield className="h-5 w-5" />}
                title="Pure CSS at the base"
                description="Every effect is plain HTML and CSS — no npm install, no supply-chain risk, nothing to keep updated. Blocks and above are React components and list their dependencies up front, so you always know what you're taking on."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/*
        The bento grid used to sit here. It was a second "why developers
        choose Hoverlab" immediately after the features grid above, making
        the same six points in a different box shape — and a visitor who has
        just read them does not read them again, they start scrolling past
        everything, including the comparison table that follows and is the
        one section actually arguing against the alternatives.
      */}

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
              title="Pick your rung"
              description="One search covers all four tiers. Take a single hover state, a finished section, a whole screen, or a starter project — then tune hue, saturation, scale and speed in real time."
            />
          </Reveal>
          <Reveal delay={240}>
            <StepCard
              number="03"
              icon={<Copy className="h-5 w-5" />}
              title="Copy, bundle, or install"
              description="Grab the source with one click, bundle several and export them as one CSS file, or run npx hoverlab add <id> to write it straight into your repo."
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
              {CATEGORIES.length} effect categories to explore
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

      {/*
        Three sections came out here.

        Testimonials: six quotes attributed to named people in named cities —
        "Maya Krishnan, Indie hacker, Berlin" — who do not exist. Invented
        endorsements are the one thing on this page with real downside: the
        audience is developers, the names are checkable, and a single person
        searching one of them turns every other claim on the page into a
        maybe. Put it back the moment there are real quotes to put in it.

        Changelog and roadmap: both are real and both are worth publishing,
        but neither belongs on the front door. They answer "what has this
        project been up to", which is a question you ask after deciding to
        care — the FAQ below answers the questions people have before that.
        They belong under /docs.
      */}

      {/* FAQ */}
      <FaqAccordion />

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
              <p className="mx-auto mt-4 max-w-xl text-pretty text-body sm:text-lg">
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
              {/*
                "Join 1,200+ developers and designers" was here. Nothing
                counts that number, so it was a claim we could not stand
                behind on the last line before the sign-up button — the
                worst possible place to be caught inventing one. What the
                catalog actually contains is verifiable and does the same
                job, so it says that instead.
              */}
              <p className="mt-6 text-xs text-muted-foreground">
                {TOTAL_COUNT.toLocaleString('en-US')} effects, {BLOCK_COUNT}{' '}
                blocks, {PAGE_COUNT} pages and {TEMPLATE_COUNT} templates —
                free, open source, no credit card.
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
            <span>Hoverlab — Effects, blocks, pages and templates</span>
          </div>
          <p className="font-mono text-xs">
            npx hoverlab add &lt;id&gt; · Free CLI and public API
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
