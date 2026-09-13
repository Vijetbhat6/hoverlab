/**
 * The testimonials wall, take 02 — segmented by reader, not sorted by score.
 *
 *   quote       one quote as the hero, chosen for recognition not praise
 *   pick        three roles, so the reader self-selects
 *   carousel    the quotes for the role they picked
 *   spread      the full rating distribution, ones included
 *   logos       who, grouped by segment
 *
 * Take 01 leads with third-party scores on the grounds that they are the
 * only part of the page the company does not control, and keeps the
 * four-star quotes in so the wall does not read as filtered. Both are good
 * instincts and this take keeps the second one.
 *
 * Where it differs: take 01 is organised by credibility, and this one is
 * organised by *relevance*. A wall of forty quotes has a specific failure —
 * it is uniformly impressive and uniformly irrelevant, because a CFO does
 * not care what a bookkeeper liked, and both leave having read three
 * arbitrary quotes. Sorting by score does nothing for that; sorting by who
 * is talking does.
 *
 * So `persona-cards` acts as a filter and the carousel below it is the
 * answer. The hero quote is deliberately not the most flattering one
 * available — it is the most *recognisable*, which is a different
 * selection criterion and a better one for the first screen.
 *
 * `review-distribution-band` stays because the argument from take 01 still
 * holds and gets stronger here: a page that lets you filter is a page that
 * could be hiding something in the unfiltered view, so the full spread —
 * including the four one-star reviews and what they were about — has to be
 * on it.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroTestimonial } from '@/lib/blocks/sources/hero-testimonial'
import { PersonaCards } from '@/lib/blocks/sources/persona-cards'
import { TestimonialCarousel } from '@/lib/blocks/sources/testimonial-carousel'
import { ReviewDistributionBand } from '@/lib/blocks/sources/review-distribution-band'
import { LogoSegments } from '@/lib/blocks/sources/logo-segments'
import { CtaInlineCard } from '@/lib/blocks/sources/cta-inline-card'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const ROLES = [
  {
    name: 'I am the controller',
    headline: 'You will live in this daily and you will write the rules',
    bullets: [
      'Nine quotes from people who do the close themselves',
      'Including two about how bad week six is',
      'The rule editor comes up in seven of the nine',
    ],
    href: '#quotes',
    ctaLabel: 'Read those nine',
  },
  {
    name: 'I am the CFO',
    headline: 'You are signing this and you will not open it monthly',
    bullets: [
      'Eleven quotes about risk, audit and key-person dependency',
      'Close duration appears in all of them',
      'Two are about a migration that went badly',
    ],
    href: '#quotes',
    ctaLabel: 'Read those eleven',
  },
  {
    name: 'I am the engineer',
    headline: 'You will connect it and then hope never to think about it',
    bullets: [
      'Six quotes about the API, webhooks and governance limits',
      'The NetSuite governance issue comes up twice',
      'One is a complaint about our retry policy, from before we fixed it',
    ],
    href: '#quotes',
    ctaLabel: 'Read those six',
  },
]

const QUOTES = [
  {
    quote: 'Week six was the week I nearly stopped. The software was matching 71 percent and my spreadsheet was matching 96. What changed it was being handed the rule editor instead of a support queue — I knew why our suppliers invoice under three trading names and nobody at Acme ever could.',
    name: 'Priya Raman',
    role: 'Financial Controller',
    company: 'Meridian Foods',
    rating: 5,
  },
  {
    quote: 'The parallel month found nine rules that had been quietly wrong for two years. I resented every day of it and I would insist on it again.',
    name: 'Tobias Lund',
    role: 'CFO',
    company: 'Northwind Logistics',
    rating: 5,
  },
  {
    quote: 'Our rollout took six months and should have taken two. Two of those months were ours — we changed our chart of accounts mid-migration, which was a stupid thing to do. The other two were theirs, and they have said so publicly, which is more than I expected.',
    name: 'Grace Adeyemi',
    role: 'Group Financial Controller',
    company: 'Harbourside Retail',
    rating: 3,
  },
  {
    quote: 'What I actually bought was that three people can now run the close instead of one. The four-days-instead-of-nine is what I put in the board pack; the key-person thing is what kept me awake.',
    name: 'Marcus Feld',
    role: 'CFO',
    company: 'Kestrel Software',
    rating: 5,
  },
  {
    quote: 'Their retry policy took our NetSuite integration down for forty minutes in November, along with everyone else’s. The post-mortem was published in five days and named the actual cause rather than "an upstream provider". I have been on the other side of that conversation and it usually goes differently.',
    name: 'Ivan Petrov',
    role: 'Platform Engineer',
    company: 'Northwind Logistics',
    rating: 4,
  },
  {
    quote: 'Two auditors in a row have accepted the match evidence without a follow-up question. That is the entire review.',
    name: 'Helen Cross',
    role: 'Financial Controller',
    company: 'Lantern Trust',
    rating: 5,
  },
]

const DISTRIBUTION = [
  { label: '5 star', value: '118', detail: '64% — mostly controllers' },
  { label: '4 star', value: '41', detail: '22% — the commonest complaint is week six' },
  { label: '3 star', value: '17', detail: '9% — rollouts that overran' },
  { label: '2 star', value: '5', detail: '3% — all five predate the rule editor' },
  { label: '1 star', value: '4', detail: '2% — three about pricing, one about the Nov outage' },
]

const SEGMENTS = [
  {
    name: 'Multi-entity groups',
    count: '87 customers',
    logos: ['Meridian Foods', 'Northwind Logistics', 'Harbourside Retail', 'Kestrel Software'],
  },
  {
    name: 'Non-profits and trusts',
    count: '23 customers',
    logos: ['Lantern Trust', 'Bridgewater Foundation', 'Orrell Charity'],
  },
  {
    name: 'Accounting practices',
    count: '31 practices',
    logos: ['Vos & Partners', 'Brady Fractional', 'Nowak Advisory'],
  },
]

export default function TestimonialsPage02() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Customers" ctaLabel="Talk to a customer" ctaHref="#testimonials-page-02-reference" />

      <main>
        {/*
          Not the most flattering quote available — the most recognisable.
          On a first screen, "I nearly stopped in week six" does more work
          than any superlative, because the reader has been in week six of
          something.
        */}
        <HeroTestimonial
          eyebrow="185 reviews · 4.4 average"
          heading="Sorted by who is talking, not by how good it is"
          subheading="A wall of forty quotes is uniformly impressive and uniformly irrelevant — a CFO does not care what a bookkeeper liked. Pick the row that is you and read the nine or eleven that were written by people in your job."
          primaryLabel="Find quotes for my role"
          primaryHref="#testimonials-page-02-pick"
          secondaryLabel="See the full rating spread"
          secondaryHref="#testimonials-page-02-spread"
          quote="Week six was the week I nearly stopped. The software was matching 71 percent and my spreadsheet was matching 96."
          authorName="Priya Raman"
          authorTitle="Financial Controller, Meridian Foods"
        />

        <div id="testimonials-page-02-pick">
          <PersonaCards
            heading="Which of these is you?"
            subheading="Twenty-six quotes across three roles. Each group includes the unflattering ones, which is why the counts do not add up to a marketing number."
            personas={ROLES}
          />
        </div>

        <div id="testimonials-page-02-quotes">
          <TestimonialCarousel
            eyebrow="Controllers and CFOs"
            heading="What people in your job said"
            testimonials={QUOTES}
          />
        </div>

        {/*
          A page that lets you filter is a page that could be hiding
          something in the unfiltered view. The full spread — ones included,
          with what they were about — is what stops that being true.
        */}
        <div id="testimonials-page-02-spread">
          <ReviewDistributionBand
            eyebrow="All 185 reviews"
            heading="The whole distribution, including the four ones"
            intro="Pulled from G2 and Capterra rather than collected by us. The four one-star reviews are three about pricing and one about the November outage, and all four are readable at source."
            metrics={DISTRIBUTION}
          />
        </div>

        <LogoSegments
          eyebrow="Who these people work for"
          heading="Grouped by segment, because the logo strip is the least informative"
          subheading="A single row of logos tells you how many. Grouping tells you whether anyone like you is on it, which is the only question a logo wall is ever really asked."
          segments={SEGMENTS}
        />

        <div id="testimonials-page-02-reference">
          <CtaInlineCard
            contextLabel="Read enough quotes"
            heading="Talk to one of them instead"
            body="Six customers take reference calls, including Grace at Harbourside, whose rollout took three times longer than it should have. We introduce by email and then leave the thread."
            actionLabel="Request a reference call"
            href="#testimonials-page-02-reference"
            fineprint="No salesperson on the line, and you can ask for the Harbourside one by name."
          />
        </div>
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
