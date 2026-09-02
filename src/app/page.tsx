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
import { ArrowRight, Copy, Search, Sparkles, Terminal, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/auth-provider'
import { SiteHeader } from '@/components/site-header'
import { CatalogSearchForm } from '@/components/catalog-search-form'
import { LandingShowcase } from '@/components/landing-showcase'
import { Reveal } from '@/components/reveal'
import { SiteFooter } from '@/components/site-footer'
import { AgentBand } from '@/components/landing/agent-band'
import { FrameworkBand } from '@/components/landing/framework-band'
import { LadderBand } from '@/components/landing/ladder-band'
import { FaqAccordion } from '@/components/landing/faq-accordion'
import { PricingTiers } from '@/components/landing/pricing-tiers'
import { ComparisonTable } from '@/components/landing/comparison-table'
import { NewsletterSignup } from '@/components/landing/newsletter-signup'
import { CommunityBand } from '@/components/landing/community-band'
import { HeroEffectWall } from '@/components/landing/hero-effect-wall'
import { CATEGORIES } from '@/lib/effect-types'
import { DESIGNER_TOOLS } from '@/lib/designer-tools'
import { TOTAL_COUNT } from '@/lib/catalog-stats'
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

/**
 * Everything in the catalog, as one number.
 *
 * This expression already existed inline, labelling the secondary
 * "Browse all N components" button. It is now the headline as well, which
 * is the whole point: the count is generated at build time from
 * `generated-catalog-stats.json` and the three index modules, so it is
 * exact and it is never stale. An unrounded number reads as a live
 * counter; "1,000+" reads as marketing.
 */
const CATALOG_TOTAL = TOTAL_COUNT + BLOCK_COUNT + PAGE_COUNT + TEMPLATE_COUNT

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
      {/*
        The backdrop is the catalog, running.

        This was four blurred colour blobs — primary, rose, amber,
        emerald. They carried no information and were the same gradient
        wash every other 2026 SaaS hero ships. The wall behind the
        headline is 18 real effects at ~12% opacity: a demo and a
        background at once, and the one thing a marketplace of
        third-party uploads cannot copy, because its cards are JPEGs
        somebody else drew.
      */}
      <HeroEffectWall />

      {/*
        The same header as everywhere else. This page used to carry its own,
        with five ladder links to the catalog's nine surfaces and none of the
        bundle, compare or search controls — so the front door offered a
        different, smaller product than the one behind it.
      */}
      <SiteHeader />

      {/*
        The landmark the skip link in <SiteHeader> targets. The front door
        had no <main> at all, so a screen reader had no way to jump the
        nine-item nav and there was nothing for "Skip to content" to reach.
      */}
      <main id="main-content">

      {/* Hero */}
      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pt-32">
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
          {/*
            The number leads.

            "Beautiful UI, ready to copy." was an adjective and a promise,
            and the catalog's actual size — the one fact that separates
            this from a gist — was set at 12 px in the pill above, smaller
            than the decorative "01 / 02 / 03" step markers further down
            the page. /library already gets this right; its h1 is
            literally "835 CSS effects". This is that headline, one level
            up, spanning all four rungs.
          */}
          <h1 className="type-display text-gradient-heading">
            {CATALOG_TOTAL.toLocaleString('en-US')} components,
            <br className="hidden sm:inline" /> ready to copy.
          </h1>
          {/*
            The positioning paragraph.

            Everything in it was already built and none of it was ever said
            in one place: the ladder had a band, the agent transports had a
            band, the licence had a page, and a visitor had to assemble the
            product out of three sections and infer the combination. The
            combination IS the product — a catalog that is one thing whether
            a person or an agent reaches for it — and no competitor in this
            category can currently write this sentence.

            Order is deliberate. The ladder first, because it is what the
            headline's number counts. The four routes second, because that
            is the differentiator. Free third, because it is the objection a
            developer is already forming. The licence last, because it is
            the only thing being sold and saying so here is cheaper than
            having someone discover it at a paywall.

            Kept to one paragraph on purpose. This page has twice deleted a
            "why us" section for restating what the section below it already
            says with a table; this earns its place by being the only thing
            that states the whole, and it must not grow into a fourth.
          */}
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-body sm:text-lg lg:text-xl">
            Hoverlab is a curated, open-source catalog that starts at a single
            hover state and goes all the way up to a project you can deploy —
            and the same artifact is reachable four ways: here, from{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
              npx hoverlab add
            </code>
            , from{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
              npx shadcn add
            </code>
            , and from an editor agent over MCP. Browsing, copying and
            installing are free and need no account and no key. What Pro sells
            is the{' '}
            <Link href="/licence" className="font-medium text-primary hover:underline">
              licence to ship it
            </Link>
            .
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

          {/*
            Both buttons go to the catalog.

            The secondary one used to read "Create a free account", four
            lines above a note saying no account is needed — the first of
            three places this page argued with itself. A visitor who is not
            signed in has exactly one useful next step here, and it is not
            a form.
          */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="outline" className="h-12 gap-1.5 px-6" asChild>
              <Link href="/browse">
                Browse all {CATALOG_TOTAL.toLocaleString('en-US')} components
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" className="h-12 gap-1.5 px-6" asChild>
              <Link href={!loading && user ? '/library' : '/tools'}>
                {!loading && user
                  ? 'Open your library'
                  : `Or start with ${DESIGNER_TOOLS.length} free tools`}
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No account needed to browse or copy · Sign up only to save
            favorites and sync them across devices
          </p>
        </div>
      </section>

      {/*
        <StatsBand> and <LogoMarquee> came out here.

        The stats band was the third rendition of the same four numbers in
        the first screen: the hero badge counts them, the tier chips under
        the search count them again, and the ladder below counts them a
        third time with the same labels. The marquee said "works with your
        stack" in twenty scrolling wordmarks, which is a claim the CLI
        section makes concretely a screen later.
      */}

      {/* The four tiers — effects up to templates */}
      <LadderBand />

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


      {/*
        The six-card features grid used to sit here, and the bento grid
        before it.

        Both answered "why this over the alternatives" — and so does the
        comparison table two sections down, which is the one that answers
        it with a table rather than with adjectives. A visitor who has just
        read six cards making that case does not read the table making it
        again; they start scrolling past everything.

        One card was not making that case, though: "Install from the
        terminal" carried the CLI, the MCP server and the Figma pairing,
        which is the only claim on this page no competitor can make. That
        is now <AgentBand> below, at the size it deserves.
      */}

      {/* The CLI, the MCP server, and the Figma matcher */}
      <AgentBand />

      {/*
        Multi-framework output, at the size a competitor gives it.

        Immediately after the agent band because the two are the same kind
        of claim — "this is not just a website you copy out of" — and
        because both were previously findable only by someone who already
        knew to look. Vue, Svelte and Astro output has shipped for months
        inside a tab strip on a detail page, while Flowbite and React Bits
        market multi-framework in their mastheads.

        Before the comparison table, deliberately: the table argues against
        the alternatives, and this is one of the rows it is arguing with.
      */}
      <FrameworkBand />

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

      {/*
        How it works.

        Step 01 used to be "Create your account", six sections below a hero
        that says no account is needed to browse or copy. Both statements
        were true of different products, and a visitor reading them in
        order could not tell which one this is.

        These three are what actually happens: you search, you copy, you
        install. None of them needs an account, which is the point — the
        signup ask now lives where it earns itself, on the favourite and
        bundle controls that genuinely need somewhere to save to.
      */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Three steps to your next UI
          </h2>
          <p className="mt-3 text-muted-foreground">
            No setup, no boilerplate, no account. Search, copy, install.
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
              icon={<Search className="h-5 w-5" />}
              title="Search"
              description="One query ranks across all four rungs at once — a hover state, a finished section, a whole screen or a starter project, side by side. Nothing to sign in to."
            />
          </Reveal>
          <Reveal delay={120}>
            <StepCard
              number="02"
              icon={<Copy className="h-5 w-5" />}
              title="Copy"
              description="Effects hand you HTML and CSS in one click. Blocks and above hand you the real files with their imports and dependency list — and you can tune hue, scale and speed before you take it."
            />
          </Reveal>
          <Reveal delay={240}>
            <StepCard
              number="03"
              icon={<Terminal className="h-5 w-5" />}
              title="Install"
              description="Or skip the browser entirely: npx hoverlab add <id> writes it straight into your repo, detects your framework, and lists the dependencies you still need."
            />
          </Reveal>
        </div>
      </section>

      {/*
        <UseCases> came out here — a four-card persona grid ("built for
        everyone who ships UI"). It was the third section in a row making
        the case for the product rather than showing it, after the agent
        band and the comparison table, and it was the one making it in the
        most general terms. Anyone still reading at this point has already
        decided the product is for them; what they want next is the price.
      */}

      {/* Pricing tiers */}
      <PricingTiers />

      {/*
        The 32-category chip wall came out here.

        Its real job was internal linking — handing crawlers and scrollers
        a route into every category hub. The site footer now carries that
        job on every page rather than on this one, which is both wider
        reach and less of this page. The categories themselves are one
        click away from /library and /category.
      */}

      {/*
        The designer tools band.

        The tools are the one part of the site that needs no account — the
        sitemap calls them the only organic entry point while the catalog is
        gated — and until this section existed the front door never mentioned
        them. A visitor bouncing off the sign-up wall should leave knowing
        there are twenty things here they can use right now.
      */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {DESIGNER_TOOLS.length} free designer tools
            </h2>
            <p className="mt-3 text-muted-foreground">
              Design tokens, palettes, shadows, type scales, WCAG contrast,
              clip-paths, noise textures and more — every tool runs entirely
              in your browser. No account, no install, works offline.
            </p>
          </div>
          <Button variant="outline" className="gap-1.5" asChild>
            <Link href="/tools">
              Open the tools hub
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Reveal>
        <Reveal delay={80} className="flex flex-wrap gap-2">
          {DESIGNER_TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground"
            >
              <tool.icon className="h-3.5 w-3.5 text-primary/80" />
              {tool.name}
            </Link>
          ))}
        </Reveal>
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
              {/*
                The last line of the page used to be "Create your free
                account in seconds", with Sign up and Sign in as the only
                two buttons — the third and loudest place this page
                contradicted its own hero. Someone who has read to the
                bottom wants the catalog, not a form: the primary button
                now goes where the hero's does, and the secondary offers
                the terminal, which needs no account at all.

                Signed-in visitors get their library instead, since the
                catalog link they already followed once is not news.
              */}
              <p className="mx-auto mt-4 max-w-xl text-pretty text-body sm:text-lg">
                Search {(TOTAL_COUNT + BLOCK_COUNT + PAGE_COUNT + TEMPLATE_COUNT).toLocaleString('en-US')}{' '}
                components in one query, copy what fits, and keep going. No
                account, no install, no credit card.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" className="h-12 gap-1.5 px-6" asChild>
                  <Link href={!loading && user ? '/library' : '/browse'}>
                    {!loading && user ? 'Open your library' : 'Browse the catalog'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-12 gap-1.5 px-6"
                  asChild
                >
                  <Link href="/docs/cli">
                    <Terminal className="h-4 w-4" />
                    Or install from the terminal
                  </Link>
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

      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  )
}

/* ---------- sub-components ---------- */

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
