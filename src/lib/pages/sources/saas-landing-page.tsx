/**
 * A complete SaaS marketing page, assembled from blocks.
 *
 * The ordering is the argument, and it is the part worth copying even if
 * you replace every section: hook, then proof, then substance, then price,
 * then objections, then a way to leave that is not the back button.
 *
 *   hero            what this is, in one line
 *   logo cloud      other people already decided this was fine
 *   features        what it actually does
 *   personas        which of these people is you
 *   code            proof it is as simple as claimed
 *   testimonials    proof from people, not from us
 *   pricing         the number, before they have to ask
 *   comparison      the number, justified
 *   faq             the objections, answered in their own words
 *   community       somewhere to go if the answer is "not yet"
 *
 * Every section takes props, so this file is a running order rather than a
 * wall of copy — swap the content without touching the layout.
 */

import * as React from 'react'
import { LogoCloud } from '@/lib/blocks/sources/logo-cloud'
import { BentoFeatures } from '@/lib/blocks/sources/bento-features'
import { PersonaCards } from '@/lib/blocks/sources/persona-cards'
import { CodeShowcase } from '@/lib/blocks/sources/code-showcase'
import { TestimonialGrid } from '@/lib/blocks/sources/testimonial-grid'
import { PricingTiers } from '@/lib/blocks/sources/pricing-tiers'
import { ComparisonTable } from '@/lib/blocks/sources/comparison-table'
import { FaqAccordion } from '@/lib/blocks/sources/faq-accordion'
import { CommunityBand } from '@/lib/blocks/sources/community-band'

export default function SaasLandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero — the one section worth writing per-product rather than
          reaching for a block, because it is the only sentence most
          visitors will read. */}
      <section className="mx-auto w-full max-w-4xl px-6 pb-8 pt-20 text-center sm:pt-28">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
          Now in public beta
        </span>

        <h1 className="mt-6 text-balance text-5xl font-extrabold tracking-tight sm:text-6xl">
          Ship the interface you sketched
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
          Every section of a real product, ready to paste. No component
          library to adopt, no design system to negotiate, no runtime to
          ship.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="/signup"
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start free
          </a>
          <a
            href="/docs"
            className="rounded-xl border border-border/60 bg-background px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            Read the docs
          </a>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Free forever tier · No card required
        </p>
      </section>

      <LogoCloud />
      <BentoFeatures />
      <PersonaCards />
      <CodeShowcase />
      <TestimonialGrid />
      <PricingTiers />
      <ComparisonTable />
      <FaqAccordion />
      <CommunityBand />
    </main>
  )
}
