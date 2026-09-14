/**
 * The estate agency home page — search first, everything else after.
 *
 *   search     the one input the whole category is built around
 *   results    the map-and-list split
 *   market     what the local numbers actually are
 *   valuation  the other half of the business
 *   answers    fees, contracts, and the questions sellers do not ask
 *
 * THE SEARCH BOX IS THE HERO AND NOTHING SHARES THE SCREEN WITH IT. Every
 * visitor to an estate agency site is in one of two modes — buying, which
 * starts with a place name, or selling, which starts with "what is mine
 * worth". The buyer is far more numerous, so they get the first screen
 * outright and the seller gets a dedicated section further down rather than
 * a competing button in the hero.
 *
 * <ListingMapSplit> DIRECTLY UNDER THE SEARCH, WITH RESULTS ALREADY IN IT.
 * A search page that renders an empty state until you type is a page that
 * shows a new visitor nothing. Pre-populating with the most recent listings
 * means the first screen already demonstrates the stock, the price range
 * and the area — which is the actual question behind "have you got anything
 * in Redland".
 *
 * <HeroSearch> IS A CLIENT BLOCK WITH AN `onSearch` PROP AND IT IS NOT
 * PASSED. This page is a server component and a function cannot cross that
 * boundary. The block falls back to its own internal handling, which is
 * correct for a template — the reader wires it to their own search route.
 * `inputId` is set explicitly for the same reason the anchors are prefixed:
 * every page preview on /pages shares one DOM, and a second search input
 * with the same generated id would break the label association on both.
 *
 * THE MARKET SECTION IS THE TRUST DEVICE. Anyone can list houses; publishing
 * the average time to sell and the gap between asking and achieved price is
 * the thing a competitor will not do, and it is what a seller is actually
 * comparing agents on.
 *
 * Anchors are prefixed `pr-`.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroSearch } from '@/lib/blocks/sources/hero-search'
import { ListingMapSplit } from '@/lib/blocks/sources/listing-map-split'
import { StatsBenchmarkBand } from '@/lib/blocks/sources/stats-benchmark-band'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FaqTwoColumn } from '@/lib/blocks/sources/faq-two-column'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const MARKET = [
  {
    label: 'Average time to sell',
    value: '41 days',
    detail: 'Instruction to agreed sale, our own sales in BS6 and BS8, last twelve months',
  },
  {
    label: 'Achieved against asking',
    value: '98.4%',
    detail: 'Median. We publish this because the agent who talks you into a high asking price is not doing you a favour',
  },
  {
    label: 'Sales that fell through',
    value: '11%',
    detail: 'Against a national average nearer a third. We check chains before we agree a sale, not after',
  },
  {
    label: 'Fee, sole agency',
    value: '1.2% + VAT',
    detail: 'No withdrawal fee, no marketing charge, no tie-in beyond eight weeks',
  },
]

const SELLER_QUESTIONS = [
  {
    question: 'What does the 1.2% actually cover?',
    answer:
      'Photography, floor plan, EPC, the listing on the two portals that matter, every viewing accompanied by one of us, and the negotiation. There is no separate marketing package and no charge if we do not sell it. The only thing you pay for separately is a conveyancer, and they are not us.',
  },
  {
    question: 'How long am I tied in for?',
    answer:
      'Eight weeks of sole agency, then it rolls month to month and you can leave with two weeks’ notice. Twelve- and sixteen-week tie-ins are common in this city and they exist to protect the agent, not you.',
  },
  {
    question: 'Will you tell me my house is worth more than it is?',
    answer:
      'No, and this is the main thing that loses us instructions. Over-valuing wins the listing and then costs the seller three months and a reduction. Our valuation comes with the three comparable sales it is based on, and you can check every one of them on the Land Registry yourself.',
  },
  {
    question: 'Who conducts the viewings?',
    answer:
      'One of the four of us, always, including evenings and Saturdays. We do not send a viewings assistant who has never been in the house and cannot answer a question about the boiler.',
  },
  {
    question: 'Do you charge for professional photography?',
    answer:
      'No. It is in the fee, it is done by a photographer rather than a phone, and it includes a floor plan with measurements. A listing without a floor plan gets materially fewer enquiries and we are not going to sell you one as an upgrade.',
  },
  {
    question: 'What happens if I take it off the market?',
    answer:
      'Nothing. No withdrawal fee and no invoice for work done. Circumstances change, and an agency that charges you for changing your mind has made your decision about them for you.',
  },
]

export default function PropertySearchPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Halyard & Co"
        links={[
          { label: 'Buy', href: '#pr-results' },
          { label: 'Sell', href: '#pr-valuation' },
          { label: 'Market', href: '#pr-market' },
          { label: 'Our team', href: '#' },
        ]}
        activeLabel="Buy"
        ctaLabel="Book a valuation"
        ctaHref="#pr-valuation"
      />

      <main>
        <HeroSearch
          heading="Houses and flats across Bristol"
          subheading="142 properties on our books today. Search by street, postcode or area — or scroll down, everything is already on the map."
          placeholder="Try “Redland”, “BS8” or “Hampton Road”"
          submitLabel="Search"
          inputId="pr-search-input"
          suggestions={['Redland', 'Clifton', 'Bishopston', 'Southville', 'BS6', 'Two bedrooms under £400k']}
        />

        <div id="pr-results">
          <ListingMapSplit
            heading="Most recently listed"
            resultSummary="142 properties across Bristol · showing the six added this week"
          />
        </div>

        <div id="pr-market">
          <StatsBenchmarkBand
            eyebrow="Our numbers"
            heading="What we actually achieve, published"
            intro="From our own completed sales over the last twelve months, not from a national index. Any agent can quote the market; these are the four figures that separate one agent from another, and most will not print them."
            metrics={MARKET}
          />
        </div>

        <div id="pr-valuation">
          <CtaSplitPanel
            heading="Thinking of selling?"
            supporting="A valuation takes about forty minutes and comes with the three comparable sales it is based on, so you can check the reasoning rather than trust the number. There is no obligation and we will not ring you afterwards unless you ask."
            primaryLabel="Book a valuation"
            secondaryLabel="Get an instant estimate"
            reassurance={[
              { text: '1.2% + VAT, sole agency, no withdrawal fee' },
              { text: 'Eight-week term, then two weeks’ notice' },
              { text: 'Every viewing conducted by one of the four of us' },
            ]}
          />
        </div>

        <FaqTwoColumn
          heading="Questions sellers should ask every agent"
          subheading="Including the two that are awkward. If an agency cannot answer these in writing before you sign, that is the answer."
          items={SELLER_QUESTIONS}
          helpTitle="Ask us something else"
          helpBody="One of the four partners answers this inbox, usually the same day. No call-back form and no lead-qualification script."
          helpCtaLabel="Email the partners"
        />
      </main>

      <FooterMinimal
        brand="Halyard & Co"
        links={[
          { label: 'Buy', href: '#pr-results' },
          { label: 'Sell', href: '#pr-valuation' },
          { label: 'Fees', href: '#pr-market' },
          { label: 'Complaints', href: '#' },
        ]}
      />
    </div>
  )
}
