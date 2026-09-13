/**
 * The portfolio index, take 02 — one project per screen.
 *
 *   opener      the most recent project, full width, as the front door
 *   projects    three more at length, each with its constraint named
 *   record      the studio in four numbers
 *   brief       a form, because this page's whole job is to start one
 *
 * Take 01 is a contents page: excerpts that name the outcome and the
 * constraint, arranged as a list you scan. It assumes the visitor will read
 * several and pick one, which is how a portfolio works when the projects are
 * comparable and the visitor is shopping.
 *
 * This take assumes the opposite and it is the assumption most studio sites
 * should make: nobody reads four case studies. A prospective client reads
 * roughly one and a half projects before deciding whether to make contact,
 * so the question is not "how do I help them browse" but "which one project
 * do they land on, and is it doing enough work on its own".
 *
 * Hence full-bleed and sequential rather than gridded. Each project gets a
 * screen, the most recent one gets the hero, and there are four in total
 * rather than eleven — a portfolio index that scrolls past the fourth
 * project is optimising for a reader who left at the second.
 *
 * The deliberate inclusion is the constraint on every project. "Redesigned
 * the booking flow" is indistinguishable between good and bad studios;
 * "redesigned it without touching the payment provider, because migrating it
 * would have cost the client their Q4" is the sentence that demonstrates
 * judgement, and it is the only kind of sentence a portfolio can carry that
 * a competitor cannot copy.
 *
 * `contact-sales-form` rather than a CTA panel: this page exists to start a
 * brief, and a button to a contact page loses most of the people who would
 * have typed two sentences into a box that was already in front of them.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroMediaOverlay } from '@/lib/blocks/sources/hero-media-overlay'
import { CollectionStorySplit } from '@/lib/blocks/sources/collection-story-split'
import { FeatureRows } from '@/lib/blocks/sources/feature-rows'
import { StatsBand } from '@/lib/blocks/sources/stats-band'
import { ContactSalesForm } from '@/lib/blocks/sources/contact-sales-form'
import { FooterMega } from '@/lib/blocks/sources/footer-mega'

const OPENER_POINTS = [
  {
    label: 'The constraint: we could not touch the payment provider',
    detail: 'Migrating it would have put the client through a PCI re-certification in the same quarter as their peak season. So the redesign had to work around a checkout step we were not allowed to change, and roughly a third of the design work went into making that step feel like it belonged.',
  },
  {
    label: 'What actually moved',
    detail: 'Completed bookings up 22% year on year, on flat traffic. The larger number is that support tickets about the booking flow fell by two-thirds, which is what the client noticed first.',
  },
  {
    label: 'What we would do differently',
    detail: 'We spent three weeks on a seat-selection interaction that testing later showed nobody used. It shipped anyway because removing it was politically awkward by then, and it is still there.',
  },
]

const PROJECTS = [
  {
    eyebrow: 'Lantern Trust · 2025 · Identity and site',
    title: 'A charity that needed to look smaller, not bigger',
    body: 'Lantern had grown to forty staff and their brand had grown with it — into something that read like a government department. Donations from individuals had been falling for three years while institutional grants rose, and the board had attributed it to the market. The work was mostly subtraction: a warmer palette, photography of four named people instead of nine hundred beneficiaries, and a donation flow that stopped asking for a title.',
    bullets: [
      'The constraint: no rebrand budget, so the wordmark stayed exactly as it was',
      'Individual donations up 31% in the first year',
      'What we got wrong: the first photography round was too casual and had to be reshot',
    ],
  },
  {
    eyebrow: 'Kestrel Software · 2025 · Product design',
    title: 'Making an admin panel that three people use feel worth building',
    body: 'An internal tool with a total user base of three, which is the kind of project that normally gets a template and a shrug. It was worth doing properly because those three people spent six hours a day in it, and the existing version was costing roughly ninety minutes of that to navigation alone. We rebuilt around keyboard-first navigation and a single command palette.',
    bullets: [
      'The constraint: no new backend endpoints, at all, for six months',
      'Measured task time down 40% across the four commonest jobs',
      'What we got wrong: we shipped without a mouse-only path and had to add one',
    ],
  },
  {
    eyebrow: 'Harbourside Retail · 2024 · Design system',
    title: 'The system that replaced four systems and nearly became a fifth',
    body: 'Four teams, four component libraries, and a genuine question about whether consolidating them was worth a quarter of everyone’s time. We argued it was not, initially, and were overruled. Six months later the honest assessment is that it was worth it for three of the four teams and a waste for the fourth, whose product is different enough that they now maintain a documented fork.',
    bullets: [
      'The constraint: no team could stop shipping during the migration',
      '3 of 4 teams migrated fully; the fourth runs a documented fork',
      'What we got wrong: we should have scoped the fourth team out on day one',
    ],
  },
]

const RECORD = [
  { value: '11 yrs', label: 'Studio age', caption: 'Same two founders' },
  { value: '4', label: 'People', caption: 'Deliberately, and we turn work away' },
  { value: '6–14 wks', label: 'Typical engagement', caption: 'Shorter than that is usually a bad fit' },
  { value: '2 of 3', label: 'Clients who come back', caption: 'The number we watch' },
]

export default function PortfolioIndexPage02() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Vellum" activeLabel="Work" ctaLabel="Start a brief" ctaHref="#portfolio-index-page-02-brief" />

      <main>
        {/*
          Full width and first. A prospective client reads about one and a
          half projects before deciding whether to make contact, so the
          question is not how to help them browse — it is whether the one
          project they land on does enough work alone.
        */}
        <HeroMediaOverlay
          eyebrow="Most recent · Meridian Foods · 2026"
          heading="A booking flow rebuilt around a step we were not allowed to change"
          subheading="Twelve weeks, four people, and a payment provider that could not be touched during peak season. Completed bookings up 22% on flat traffic — and a seat-selection interaction we spent three weeks on that nobody uses."
          primaryLabel="Read this one"
          primaryHref="#portfolio-index-page-02-opener"
          secondaryLabel="See the other three"
          secondaryHref="#portfolio-index-page-02-projects"
        />

        <div id="portfolio-index-page-02-opener">
          <CollectionStorySplit
            eyebrow="Meridian Foods"
            heading="What the twelve weeks actually contained"
            intro="Three points, and the third is the one that should tell you most about how we work."
            points={OPENER_POINTS}
          />
        </div>

        {/*
          A constraint on every project, and a mistake on every project.
          "Redesigned the booking flow" is identical between a good studio
          and a bad one; the sentence naming what could not be changed is
          the only kind a competitor cannot copy.
        */}
        <div id="portfolio-index-page-02-projects">
          <FeatureRows
            heading="Three more"
            subheading="Four projects in total rather than eleven. A portfolio that scrolls past the fourth is optimising for a reader who left at the second."
            rows={PROJECTS}
          />
        </div>

        <StatsBand stats={RECORD} />

        {/*
          A form, not a button. This page exists to start a brief, and a
          link to /contact loses most of the people who would have typed two
          sentences into a box already in front of them.
        */}
        <div id="portfolio-index-page-02-brief">
          <ContactSalesForm
            heading="Start a brief"
            intro="Two sentences is enough to begin. We reply within two days either with questions or with the name of a studio we think fits better — we turn down roughly half of what comes in, usually on timing rather than on fit."
            submitLabel="Send it"
          />
        </div>
      </main>

      <FooterMega
        brand="Vellum"
        tagline="A four-person design studio. Eleven years, same two founders, and we turn work away."
      />
    </div>
  )
}
