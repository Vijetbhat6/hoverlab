/**
 * The testimonials wall.
 *
 *   ratings   the aggregate and the sources, first
 *   video     the three on camera
 *   voices    the wall itself
 *   carousel  the longer quotes, which do not fit a card
 *   logos     everyone who has not said anything
 *
 * Aggregate scores go first because they are the only part of this page the
 * company does not control. A wall of hand-picked quotes is understood by
 * every reader to be hand-picked; a 4.7 from 612 reviews on a third-party
 * site is not, and putting it above the quotes is what makes the quotes worth
 * reading.
 *
 * The four-star quotes stay in. A wall where every review is five stars reads
 * as filtered — because it is — and one mild criticism does more for the
 * credibility of the other thirty than a thirty-first rave would.
 *
 * Roles, not just names. "Marisol Q., Financial Controller at a 400-person
 * manufacturer" is evidence; "Marisol Q., Happy Customer" is not, and the
 * reader is scanning for someone whose job resembles their own.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { TestimonialRatings } from '@/lib/blocks/sources/testimonial-ratings'
import { TestimonialVideo } from '@/lib/blocks/sources/testimonial-video'
import { TestimonialGrid } from '@/lib/blocks/sources/testimonial-grid'
import { TestimonialCarousel } from '@/lib/blocks/sources/testimonial-carousel'
import { LogoCloud } from '@/lib/blocks/sources/logo-cloud'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const ON_CAMERA = [
  {
    name: 'Marisol Quintero',
    role: 'Financial Controller',
    company: 'Halyard Components',
    pullQuote: 'I had budgeted for a new hire to survive the close. We did not need one.',
    duration: '2:40',
  },
  {
    name: 'Kofi Mensah',
    role: 'Finance Director',
    company: 'Saltwater Group',
    pullQuote: 'Nineteen sites on one calendar for the first time, and it found £41,000 on the way.',
    duration: '3:15',
  },
  {
    name: 'Elif Yilmaz',
    role: 'Head of Finance Ops',
    company: 'Meridia Health',
    pullQuote: 'The auditors got a login instead of a fortnight of screenshots.',
    duration: '1:55',
  },
]

const WALL = [
  {
    quote:
      'Nine and a half days to three. The part I did not expect was that the exceptions got easier to explain, not just fewer.',
    name: 'Marisol Quintero',
    role: 'Financial Controller, Halyard Components',
    rating: 5,
  },
  {
    quote:
      'The importer choked twice on our data. Both times it told us exactly which rows and why, which is more than the last three tools managed between them.',
    name: 'Dmitri Petrov',
    role: 'Systems Accountant, Ferrous',
    rating: 4,
  },
  {
    quote: 'Support is engineers on a rota. The bug I reported on Tuesday shipped on Friday.',
    name: 'Anika Kapoor',
    role: 'Finance Manager, Quartzly',
    rating: 5,
  },
  {
    quote:
      'Approval routing is genuinely weaker than what we came from and they told us so on the sales call. We bought it anyway for the reconciliation and the honesty.',
    name: 'Liam Walsh',
    role: 'CFO, Driftless',
    rating: 4,
  },
  {
    quote: 'Read-only auditor access turned year-end from eleven days into two.',
    name: 'Elif Yilmaz',
    role: 'Head of Finance Ops, Meridia Health',
    rating: 5,
  },
  {
    quote:
      'Exported everything to CSV on day three to prove we could leave. That we could is why we stayed.',
    name: 'Yuki Sato',
    role: 'Group Financial Controller, Longshore',
    rating: 5,
  },
]

const LONGER = [
  {
    quote:
      'We ran both systems in parallel for a full quarter because I did not believe the numbers. They matched every month, including the one where we found a duplicate supplier that had been inflating a cost centre since 2022 — which was our fault, not either tool’s, and only one of them surfaced it.',
    name: 'Marisol Quintero',
    role: 'Financial Controller',
    company: 'Halyard Components',
    rating: 5,
  },
  {
    quote:
      'The thing I tell people is that it is slower to start than it looks. They insist on importing four years of history and reconciling it before any rule runs, and I resented that for about a fortnight. Then it found the fault and I stopped resenting it.',
    name: 'Kofi Mensah',
    role: 'Finance Director',
    company: 'Saltwater Group',
    rating: 5,
  },
  {
    quote:
      'Not everything is better. Our approval chains were more sophisticated in the old system and we have had to simplify them, which was a real cost and one I would weigh again. The close going from nine days to three outweighed it, but it was not free.',
    name: 'Liam Walsh',
    role: 'CFO',
    company: 'Driftless',
    rating: 4,
  },
]

export default function TestimonialsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Customers" ctaLabel="Start free" ctaHref="#voices" />

      <main>
        <TestimonialRatings
          score="4.7"
          outOf={5}
          totalReviews="612"
          headline="The part of this page we do not control"
          sources={[
            { name: 'G2', score: '4.7' },
            { name: 'Capterra', score: '4.6' },
            { name: 'TrustRadius', score: '8.9/10' },
          ]}
        />

        <TestimonialVideo
          eyebrow="On camera"
          heading="Three customers, unscripted"
          subheading="Filmed on their own machines, in one take, with no agency involved. That is why the audio is what it is."
          testimonials={ON_CAMERA}
        />

        <div id="voices">
          <TestimonialGrid
            heading="The wall"
            subheading="Quoted with permission and not edited for length. The four-star ones are in here too, because a wall of nothing but fives is a wall nobody believes."
            testimonials={WALL}
          />
        </div>

        <TestimonialCarousel
          eyebrow="At greater length"
          heading="The ones that did not fit in a card"
          testimonials={LONGER}
        />

        <LogoCloud caption="And 1,400 teams who have never said a word about us in public" />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
