/**
 * A marketplace landing page, assembled from blocks.
 *
 * A marketplace has two audiences with opposite wants and one page to serve
 * both, and every structural decision here is about that:
 *
 *   navbar          two CTAs, which no other page in this catalog does
 *   hero            a search field, because buyers arrive knowing what they want
 *   segments        what is actually on here, before anyone claims quality
 *   rail            real listings with real prices — the fastest proof there is
 *   comparison      the seller pitch, as before-and-after economics
 *   testimonials    sellers, not buyers, because sellers are the harder sale
 *   faq             searchable, because the two audiences ask different things
 *   cta             the seller ask, once, at the end
 *   footer          the full sitemap a browse-led site needs for SEO
 *
 * THE SEARCH FIELD IS THE HERO, NOT A HEADLINE. A buyer on a marketplace
 * has already decided to buy something — the job is to get them to a
 * results page in one action. `<HeroSearch>` with real suggestions beats
 * any amount of copy about curation.
 *
 * WHY THE SELLER SECTIONS ARE THE BOTTOM HALF. Supply is the harder side to
 * acquire and the temptation is to lead with it. Do that and the buyer, who
 * is the reason a seller would join, bounces off a page about commission
 * rates. Buyers first, sellers below the fold, one seller CTA in the nav
 * for the ones who came looking for it.
 *
 * TWO CTAs IN THE NAVBAR is a deliberate exception to the one-ask rule
 * every other page here follows. On a marketplace the two asks go to
 * genuinely different people, so splitting them costs nothing — the seller
 * link is not stealing buyer conversions, it is catching traffic the buyer
 * funnel would have dropped.
 *
 * Every section takes props, so this file is a running order rather than a
 * wall of copy — swap the content without touching the layout.
 */

import * as React from 'react'

import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroSearch } from '@/lib/blocks/sources/hero-search'
import { LogoSegments } from '@/lib/blocks/sources/logo-segments'
import { ProductRail } from '@/lib/blocks/sources/product-rail'
import { StatsComparison } from '@/lib/blocks/sources/stats-comparison'
import { TestimonialCarousel } from '@/lib/blocks/sources/testimonial-carousel'
import { FaqSearch } from '@/lib/blocks/sources/faq-search'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterMega } from '@/lib/blocks/sources/footer-mega'

export default function MarketplaceLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Thicket"
        links={[
          { label: 'Browse', href: '/browse' },
          { label: 'Makers', href: '#makers' },
          { label: 'How it works', href: '#how' },
        ]}
        activeLabel="Browse"
        // The seller ask lives in the secondary slot. See the header note on
        // why this page carries two CTAs when the others carry one.
        signInLabel="Sell on Thicket"
        signInHref="#sell"
        ctaLabel="Sign in"
        ctaHref="/login"
      />

      <main>
        <HeroSearch
          heading="Made by someone, somewhere near you"
          subheading="Nine thousand independent makers, no dropshippers, no resold factory stock. Every listing names the person who made it and the town they made it in."
          placeholder="Try “oak chopping board” or “ceramics, Bristol”"
          submitLabel="Search"
          suggestions={[
            'hand-thrown mugs',
            'letterpress cards',
            'leather aprons',
            'sourdough starter kits',
            'wool blankets',
          ]}
        />

        {/* What is actually on here, before any claim about quality. A
            marketplace that leads with "curated" and shows nothing reads as
            empty, which for a marketplace is the only fatal impression. */}
        <div id="makers">
          <LogoSegments
            eyebrow="What is on Thicket"
            heading="Nine categories, and the makers are named in every one"
            subheading="Counts are live and include only sellers who have shipped an order in the last 90 days — a directory padded with dormant accounts is a directory nobody buys from twice."
            segments={[
              {
                name: 'Ceramics and glass',
                count: '1,840 makers',
                logos: ['Ash & Ember', 'Coldwater Clay', 'Pothouse', 'Kiln Sixteen'],
              },
              {
                name: 'Wood and furniture',
                count: '1,210 makers',
                logos: ['Grain & Gable', 'Slow Timber', 'Bench No.4', 'Larchfield'],
              },
              {
                name: 'Textiles',
                count: '2,470 makers',
                logos: ['Fold Studio', 'Weft & Warp', 'Tansy Wool', 'Cloth Hall'],
              },
              {
                name: 'Food and drink',
                count: '930 makers',
                logos: ['Crumb Bakehouse', 'Hedgerow Preserve', 'Salt Marsh', 'Nine Acre'],
              },
            ]}
          />
        </div>

        {/* Real listings with real prices. Nothing else on the page proves
            the marketplace is stocked as quickly as this does. */}
        <ProductRail
          heading="Shipping this week"
          subheading="Live listings from makers with stock on hand — not a curated editorial selection that is out of stock by the time you click."
          // No `currency` prop: it is an ISO code for `Intl.NumberFormat`,
          // not a symbol, and the block already defaults to GBP/en-GB.
          // Passing "£" throws `RangeError: Invalid currency code`.
          viewAllHref="/browse"
          products={[
            { id: 'p1', name: 'Thrown stoneware mug — Coldwater Clay', price: 2800, swatch: 'from-stone-200 to-stone-400' },
            { id: 'p2', name: 'Oak end-grain board — Bench No.4', price: 7400, swatch: 'from-amber-200 to-amber-600' },
            { id: 'p3', name: 'Undyed wool throw — Fold Studio', price: 12500, swatch: 'from-neutral-200 to-neutral-500' },
            { id: 'p4', name: 'Letterpress card set of 8 — Pothouse', price: 1600, swatch: 'from-rose-200 to-rose-400' },
            { id: 'p5', name: 'Waxed canvas apron — Larchfield', price: 6800, swatch: 'from-lime-200 to-lime-600' },
            { id: 'p6', name: 'Sourdough starter kit — Crumb Bakehouse', price: 2200, swatch: 'from-yellow-200 to-yellow-500' },
          ]}
        />

        {/* The seller pitch, as arithmetic rather than adjectives. */}
        <div id="sell">
          <StatsComparison
            eyebrow="For makers"
            heading="What a stall on Thicket does to the numbers"
            beforeLabel="Craft fairs and Instagram"
            afterLabel="After twelve months on Thicket"
            rows={[
              {
                metric: 'Orders per month',
                before: '11',
                after: '74',
                improvement: '6.7×',
                direction: 'up',
              },
              {
                metric: 'Hours spent selling, not making',
                before: '22 hrs',
                after: '6 hrs',
                improvement: '−73%',
                direction: 'down',
              },
              {
                metric: 'Average order value',
                before: '£34',
                after: '£51',
                improvement: '+50%',
                direction: 'up',
              },
              {
                metric: 'Commission and fees',
                before: '£0 + stall hire',
                after: '6% + payment fees',
                improvement: 'Flat',
              },
              {
                metric: 'Repeat customers',
                before: '9%',
                after: '31%',
                improvement: '3.4×',
                direction: 'up',
              },
            ]}
            footnote="Medians across 1,204 sellers who joined in 2024 and were still listing twelve months later. Sellers who left inside the year are excluded, which flatters these numbers — 18% did, and the exit survey mostly says the volume was more than they wanted to make."
          />
        </div>

        {/* Sellers, not buyers. Supply is the harder side to convince, and a
            buyer saying "lovely mug" does not convince a maker of anything. */}
        <TestimonialCarousel
          eyebrow="Makers"
          heading="From people who moved their whole business onto it"
          testimonials={[
            {
              quote:
                'I did eleven craft fairs in 2023 and made less than I now make in a good fortnight. The part nobody mentions is the weekends back — I have not stood behind a trestle table in a cold hall since March.',
              name: 'Rowan Lisle',
              role: 'Potter',
              company: 'Coldwater Clay',
              rating: 5,
            },
            {
              quote:
                'The 6% is real money and I resented it for about two months. Then I worked out what my own website plus the ad spend to make anyone visit it had been costing, and stopped resenting it.',
              name: 'Ada Mbeki',
              role: 'Weaver',
              company: 'Fold Studio',
              rating: 5,
            },
            {
              quote:
                'The volume caught me out. I went from making things to running a small factory in about four months, and I had to deliberately raise prices to slow it down. That is a good problem and it is still a problem.',
              name: 'Jonah Pretorius',
              role: 'Furniture maker',
              company: 'Bench No.4',
              rating: 4,
            },
            {
              quote:
                'They removed a seller who was reselling factory ceramics as handmade within a day of me reporting it. That is the whole reason I am still here rather than on the bigger one.',
              name: 'Ines Carvalho',
              role: 'Ceramicist',
              company: 'Pothouse',
              rating: 5,
            },
          ]}
        />

        {/* Searchable, because the two audiences ask entirely different
            things and a single accordion makes each of them scroll past the
            other's questions. */}
        <div id="how">
          <FaqSearch
            eyebrow="Buying and selling"
            heading="Ask it the way you would say it"
            inputLabel="Search the questions"
            placeholder="commission, returns, shipping, verification…"
            questions={[
              {
                question: 'What does it cost to sell?',
                answer:
                  '6% of the item price plus the payment processor’s fee, taken at the point of sale. No listing fee, no monthly fee, no charge for photographs or promotion. If nothing sells, you pay nothing.',
                keywords: ['commission', 'fees', 'cost', 'price', 'charge'],
              },
              {
                question: 'How do you know a seller actually makes the things?',
                answer:
                  'Every seller submits work-in-progress photographs from their own workspace before their first listing goes live, and we spot-check them again at random. Reselling factory stock is the one thing that gets an account removed the same day rather than warned.',
                keywords: ['verification', 'handmade', 'fake', 'resell', 'authentic'],
              },
              {
                question: 'Who handles shipping?',
                answer:
                  'The maker does, from their own workshop, using their own packaging. We buy the labels in bulk and pass the rate through, which is usually cheaper than a small seller can get alone. Nothing goes through a Thicket warehouse because there is not one.',
                keywords: ['shipping', 'delivery', 'postage', 'fulfilment'],
              },
              {
                question: 'What happens if something arrives broken?',
                answer:
                  'Report it within 14 days with a photograph and we refund you immediately, then settle it with the maker separately. The buyer is never left waiting on a dispute between two other parties.',
                keywords: ['broken', 'damaged', 'refund', 'returns', 'dispute'],
              },
              {
                question: 'Can I return something I simply do not like?',
                answer:
                  'Within 14 days for anything not made to order, at your cost for the return postage. Commissioned and personalised pieces are not returnable, and the listing says so before you buy rather than in the confirmation email.',
                keywords: ['returns', 'refund', 'change my mind', 'cancel'],
              },
              {
                question: 'When do sellers get paid?',
                answer:
                  'Seven days after the order is marked delivered, into the account on file, with no minimum threshold. There is no rolling reserve and no payout schedule that quietly holds a month of your money.',
                keywords: ['payout', 'paid', 'money', 'bank', 'when'],
              },
              {
                question: 'Do you take international sellers?',
                answer:
                  'UK, Ireland and the EU today. We will not open a country until we can settle payouts in the local currency without a conversion fee falling on the maker, which is why the list is short.',
                keywords: ['international', 'countries', 'eu', 'abroad', 'ireland'],
              },
            ]}
            contactLabel="Ask us directly"
            contactHref="mailto:hello@thicket.example"
          />
        </div>

        <CtaSplitPanel
          heading="Open a stall"
          supporting="Twenty minutes to list your first piece, and nothing to pay until something sells."
          primaryLabel="Start selling"
          primaryHref="#sell"
          secondaryLabel="See the seller handbook"
          secondaryHref="#"
          reassurance={[
            { text: '6% and the payment fee — that is the whole list' },
            { text: 'No listing fee, no monthly fee, no exclusivity' },
            { text: 'Paid seven days after delivery, no threshold' },
          ]}
        />
      </main>

      <FooterMega
        brand="Thicket"
        tagline="A marketplace for people who make things, and the people who would rather buy from them."
        statusLabel="All systems normal"
        statusHref="#"
        regionNote="Shipping across the UK, Ireland and the EU."
        columns={[
          {
            heading: 'Buy',
            links: [
              { label: 'Browse everything', href: '/browse' },
              { label: 'Ceramics and glass', href: '/browse' },
              { label: 'Wood and furniture', href: '/browse' },
              { label: 'Textiles', href: '/browse' },
              { label: 'Food and drink', href: '/browse' },
              { label: 'Gift cards', href: '#' },
            ],
          },
          {
            heading: 'Sell',
            links: [
              { label: 'Open a stall', href: '#sell' },
              { label: 'Fees explained', href: '#how' },
              { label: 'Seller handbook', href: '#' },
              { label: 'Verification', href: '#how', badge: 'How it works' },
              { label: 'Seller forum', href: '#' },
            ],
          },
          {
            heading: 'Help',
            links: [
              { label: 'Orders and delivery', href: '#how' },
              { label: 'Returns', href: '#how' },
              { label: 'Report a listing', href: '#' },
              { label: 'Contact us', href: 'mailto:hello@thicket.example' },
            ],
          },
          {
            heading: 'Company',
            links: [
              { label: 'About', href: '#' },
              { label: 'How we vet makers', href: '#how' },
              { label: 'Press', href: '#' },
              { label: 'Careers', href: '#' },
            ],
          },
        ]}
        legalLinks={[
          { label: 'Terms', href: '#' },
          { label: 'Privacy', href: '#' },
          { label: 'Cookies', href: '#' },
          { label: 'Seller agreement', href: '#' },
        ]}
      />
    </div>
  )
}
