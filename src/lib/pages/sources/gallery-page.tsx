/**
 * The gallery page — a visual showcase for work that has to be seen.
 *
 *   hero      one image, with the copy over it
 *   screens   the switchable views
 *   bento     what each view is for, in the grid
 *   quote     one client, with the numbers
 *   cta       the way in
 *
 * Built for a studio, a product tour, a case-study gallery, a hardware page —
 * anywhere the artefact is the argument and the prose is a caption.
 *
 * The one decision: **the gallery is a switcher, not an infinite grid.** A
 * masonry wall of forty images is a page nobody finishes and a Largest
 * Contentful Paint nobody forgives. Four or five named views, one visible at
 * a time, makes each one worth looking at and keeps the page to a single
 * image's weight on load.
 *
 * The `swatch` on each view is a gradient rather than a photograph on
 * purpose: a template that ships with stock photography teaches everyone who
 * fills it in to keep the stock photography. A coloured plate is obviously a
 * placeholder and gets replaced.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroMediaOverlay } from '@/lib/blocks/sources/hero-media-overlay'
import { ProductGallery } from '@/lib/blocks/sources/product-gallery'
import { BentoFeatures } from '@/lib/blocks/sources/bento-features'
import { TestimonialSpotlight } from '@/lib/blocks/sources/testimonial-spotlight'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const VIEWS = [
  { id: 'close', label: 'The close dashboard', swatch: 'from-indigo-200 to-indigo-400' },
  { id: 'rules', label: 'Matching rules', swatch: 'from-teal-200 to-teal-400' },
  { id: 'exceptions', label: 'Exception queue', swatch: 'from-amber-200 to-amber-400' },
  { id: 'audit', label: 'Auditor view', swatch: 'from-slate-200 to-slate-400' },
]

const TILES = [
  {
    title: 'The close dashboard',
    body: 'One number — days to close — and the three things standing between you and it. Everything else is a click away rather than on screen, because a dashboard that shows everything is a dashboard nobody reads on the ninth day.',
    span: 'sm:col-span-2',
  },
  {
    title: 'Matching rules',
    body: 'Written as sentences, not as a query builder. If you cannot read a rule aloud to an auditor, it should not be running unattended.',
  },
  {
    title: 'The exception queue',
    body: 'Where the 20% we deliberately do not automate ends up. Sorted by how much money is at stake, not by date.',
  },
  {
    title: 'The auditor view',
    body: 'Read-only, immutable, and shareable with someone who will never have an account. Built for one customer’s year-end and now the feature CFOs mention first.',
    span: 'sm:col-span-2',
  },
]

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Product" ctaLabel="Start free" ctaHref="#screens" />

      <main>
        <HeroMediaOverlay
          eyebrow="A look at it"
          heading="Four screens, and what each one is for"
          subheading="This is the whole product. There is no fifth screen behind a sales call, and nothing here is a mock-up of something unbuilt."
          primaryLabel="Try it with your data"
          primaryHref="#screens"
          secondaryLabel="Book a walkthrough"
        />

        <div id="screens">
          <ProductGallery views={VIEWS} />
        </div>

        <BentoFeatures
          heading="What you are looking at"
          subheading="One paragraph per screen, including the reason it is shaped that way."
          tiles={TILES}
        />

        <TestimonialSpotlight
          quote="The exception queue sorted by money rather than by date changed how we work more than any of the automation did."
          name="Dmitri Petrov"
          role="Systems Accountant"
          company="Ferrous"
          stats={[
            { value: '4', label: 'Screens, total' },
            { value: '0', label: 'Features behind a demo call' },
            { value: '3.0', label: 'Days to close' },
          ]}
        />

        <CtaSplitPanel
          heading="Screenshots only get you so far"
          supporting="Import your own data into a free sandbox workspace and look at your own numbers in these four screens instead of ours."
          primaryLabel="Start a sandbox"
          secondaryLabel="Book a walkthrough"
        />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
