/**
 * A restaurant's home page — the three facts, then the food.
 *
 *   hero       the room, the name, and the two buttons that matter
 *   facts      opening hours, address, phone, as content and not a footer
 *   menu       an extract, typeset like the real one
 *   story      who cooks and where the food comes from
 *   reviews    the ratings, because this category lives on them
 *   book       the table
 *
 * A RESTAURANT SITE HAS EXACTLY TWO JOBS and almost every one of them
 * forgets the second. The first is "book a table"; the second is "are you
 * open now and where are you", which is the query 70% of visitors arrive
 * with, usually on a phone, often standing outside. So <StatsBand> carries
 * hours, address and phone as a first-class section directly under the
 * hero rather than leaving them to the footer — the single highest-value
 * decision on the page and the one that costs nothing.
 *
 * THE MENU EXTRACT IS THE PROOF. Photography sells a room; a menu sells a
 * meal, and a restaurant page that makes you click through to a PDF to
 * find out what the food is has lost the booking. <MenuCourseList> is shown
 * here with one course, typeset exactly as the full menu is on /menu, so
 * the extract and the real thing cannot drift apart.
 *
 * NO PRICING BLOCK, NO FEATURE GRID, NO LOGO CLOUD. The temptation is to
 * reach for the SaaS furniture and it is wrong in every case: a menu is
 * the price list, "features" of a restaurant is a category error, and the
 * logos of suppliers are of interest to nobody outside the trade. What
 * replaces them is <TestimonialRatings>, because in hospitality the star
 * average genuinely is the purchase decision.
 *
 * Anchors are prefixed `rs-`.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroMediaOverlay } from '@/lib/blocks/sources/hero-media-overlay'
import { StatsBand } from '@/lib/blocks/sources/stats-band'
import { MenuCourseList } from '@/lib/blocks/sources/menu-course-list'
import { ProductSpecSplit } from '@/lib/blocks/sources/product-spec-split'
import { TestimonialRatings } from '@/lib/blocks/sources/testimonial-ratings'
import { TestimonialGrid } from '@/lib/blocks/sources/testimonial-grid'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const PRACTICALITIES = [
  { value: 'Wed–Sun', label: 'Open', caption: '6pm – 10pm, kitchen closes 9.30' },
  { value: '18 Cotham Hill', label: 'Bristol BS6 6LF', caption: 'Five minutes from Clifton Down' },
  { value: '0117 946 2210', label: 'Phone', caption: 'Answered from 4pm on service days' },
  { value: '38', label: 'Covers', caption: 'One room, one sitting per table' },
]

/* One course only — the full menu is on /menu, typeset identically. */
const EXTRACT = [
  {
    name: 'This week, to begin',
    note: 'The full menu changes when the produce does',
    dishes: [
      {
        name: 'Devilled eggs, brown crab, lovage',
        description: 'Six halves. The crab is picked here on the morning it arrives.',
        price: '9',
        marks: ['gf', 's'],
      },
      {
        name: 'Bread and cultured butter',
        description: 'Sourdough from the Tuesday bake, salted butter churned in house.',
        price: '5',
        marks: ['v'],
      },
      {
        name: 'Chicory, pear, hazelnut, aged ewe’s cheese',
        description:
          'Bitter, sweet, salt. The pears are from a single orchard in Herefordshire.',
        price: '11',
        marks: ['v', 'gf', 'n'],
      },
    ],
  },
]

const STORY = [
  {
    label: 'One menu, changed when the produce changes',
    detail:
      'Not seasonally and not on a schedule — when the box that arrives on Tuesday is different, the menu is different on Wednesday. It is why there is no printed menu and why the website is the menu.',
  },
  {
    label: 'Everything from within about ninety miles',
    detail:
      'Except the salt, the pepper and the olive oil, and we are not going to pretend otherwise. The lamb is from one farm on the Mendips and the fish comes up from Brixham on the same van every morning.',
  },
  {
    label: 'Six people, and that is the whole business',
    detail:
      'Two in the kitchen, two on the floor, and the two of us who own it working both. Service charge goes to them and is split evenly including the kitchen, which is not the industry norm.',
  },
  {
    label: 'One sitting per table',
    detail:
      'Your table is yours for the evening. We would rather do 38 covers properly than turn 70 and ask you to leave before pudding.',
  },
]

const RATINGS = [
  {
    quote:
      'The hogget for two is the best thing I have eaten in this city. Carved at the table, gone in twenty minutes, and they were not precious about us ordering three puddings between two.',
    name: 'Ffion R.',
    role: 'Booked for an anniversary',
    rating: 5,
  },
  {
    quote:
      'Small room, so book. We turned up on a Saturday without one and were sent away kindly, which is fair enough. Came back Wednesday and it was worth the wait.',
    name: 'Daniel O.',
    role: 'Local, now a regular',
    rating: 5,
  },
  {
    quote:
      'Told them about a nut allergy when booking and they had already crossed two things off by the time we sat down. Nobody made it a performance. That is rarer than it should be.',
    name: 'Sameera K.',
    role: 'Dinner for four',
    rating: 5,
  },
  {
    quote:
      'Excellent food, and honestly quite loud when it is full. If you want a quiet conversation take the early sitting at six rather than eight.',
    name: 'Martin H.',
    role: 'Weeknight dinner',
    rating: 4,
  },
]

export default function RestaurantLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Quay & Larder"
        links={[
          { label: 'Menu', href: '#rs-menu' },
          { label: 'About', href: '#rs-story' },
          { label: 'Find us', href: '#rs-facts' },
        ]}
        activeLabel="Menu"
        ctaLabel="Book a table"
        ctaHref="#rs-book"
      />

      <main>
        <HeroMediaOverlay
          eyebrow="Cotham Hill, Bristol"
          heading="Thirty-eight covers, one menu, and it changes when the food does"
          subheading="A small dining room doing one sitting a night. Wednesday to Sunday, six until ten, and the table is yours for the evening."
          primaryLabel="Book a table"
          primaryHref="#rs-book"
          secondaryLabel="Read tonight’s menu"
          secondaryHref="#rs-menu"
        />

        {/* Directly under the hero, not in the footer. See the header. */}
        <div id="rs-facts">
          <StatsBand stats={PRACTICALITIES} />
        </div>

        <div id="rs-menu">
          <MenuCourseList
            heading="Tonight, to begin"
            standfirst="An extract. The full menu — three courses, the wine list and the cheese — is on the menu page, and it is the same document the kitchen is working from right now."
            courses={EXTRACT}
            footnote="Please tell us about allergies when you book rather than when you arrive. We cook in one kitchen and cannot promise any dish is free of a trace, but we can usually change one."
          />
        </div>

        <div id="rs-story">
          <ProductSpecSplit
            eyebrow="How it works"
            heading="Four things worth knowing before you book"
            intro="None of them are unusual in a good restaurant and most restaurant websites leave all four out, which is why people arrive expecting something else."
            points={STORY}
          />
        </div>

        <TestimonialRatings
          score="4.8"
          totalReviews="312 reviews"
          headline="Rated 4.8 across Google, OpenTable and the Good Food Guide"
          breakdown={[
            { stars: 5, count: 241 },
            { stars: 4, count: 52 },
            { stars: 3, count: 13 },
            { stars: 2, count: 4 },
            { stars: 1, count: 2 },
          ]}
          sources={[
            { name: 'Google', score: '4.8', href: '#' },
            { name: 'OpenTable', score: '4.9', href: '#' },
            { name: 'Good Food Guide', score: '4.6', href: '#' },
          ]}
        />

        <TestimonialGrid
          heading="What people say"
          subheading="Four of the 312. The four-star one is here on purpose — the room really is loud when it is full, and we would rather you knew that before you booked an anniversary."
          testimonials={RATINGS}
        />

        <div id="rs-book">
          <CtaSplitPanel
            heading="Book a table"
            supporting="Wednesday to Sunday, sittings from six. Tables for six or more are best done by phone so we can talk about the menu first."
            primaryLabel="Check availability"
            secondaryLabel="Call 0117 946 2210"
            reassurance={[
              { text: 'No deposit for tables of five or fewer' },
              { text: 'Cancel free up to 24 hours before' },
              { text: 'Step-free access, and an accessible WC' },
            ]}
          />
        </div>
      </main>

      <FooterMinimal
        brand="Quay & Larder"
        links={[
          { label: 'Menu', href: '#rs-menu' },
          { label: 'Book', href: '#rs-book' },
          { label: 'Find us', href: '#rs-facts' },
          { label: 'Gift vouchers', href: '#' },
        ]}
      />
    </div>
  )
}
