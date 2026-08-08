/**
 * A complete SaaS marketing page, assembled from blocks.
 *
 * The ordering is the argument, and it is the part worth copying even if
 * you replace every section: hook, then proof, then substance, then price,
 * then objections, then a way to leave that is not the back button.
 *
 *   navbar          a way around before a reason to stay
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
 *   footer          every other page on the site
 *
 * Every section takes props, so this file is a running order rather than a
 * wall of copy — swap the content without touching the layout.
 *
 * The hero used to be hand-rolled here, on the argument that it is the one
 * section worth writing per-product. That was true about the *copy* and
 * false about the markup: <HeroCentered> takes every string as a prop, so
 * the per-product part is the six lines below and the layout is shared with
 * the rest of the catalog. Keeping a private copy of it meant this page
 * silently stopped benefiting from fixes to the block.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroCentered } from '@/lib/blocks/sources/hero-centered'
import { FooterMega } from '@/lib/blocks/sources/footer-mega'
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
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Acme"
        activeLabel="Product"
        signInHref="/login"
        ctaLabel="Start free"
        ctaHref="/signup"
      />

      <main>
        {/* The only per-product part of the hero is the copy — everything
            else comes from the block. */}
        <HeroCentered
          announcement="Every section of a real product, ready to paste"
          announcementHref="/changelog"
          heading="Ship the interface you sketched"
          subheading="No component library to adopt, no design system to negotiate, no runtime to ship."
          primaryLabel="Start free"
          primaryHref="/signup"
          secondaryLabel="Read the docs"
          secondaryHref="/docs"
          logos={[]}
        />

        {/* The hero's own logo strip is off above, because the next section
            is a logo cloud — the same proof twice reads as thin. */}
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

      <FooterMega brand="Acme" />
    </div>
  )
}
