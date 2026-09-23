/**
 * One property — the page a buyer sends to three other people.
 *
 *   gallery    the rooms
 *   facts      price, beds, tenure, council tax, EPC, in one panel
 *   detail     the description, written by somebody who went inside
 *   specifics  the things that decide a purchase and are usually buried
 *   nearby     what else is on the books at this price
 *   viewing    the booking
 *
 * A PROPERTY PAGE IS A PRODUCT DETAIL PAGE WITH DIFFERENT STAKES, and it is
 * worth being explicit about what that means for the layout: the gallery and
 * a sticky facts panel side by side is exactly <ProductGallery> plus
 * <ProductBuyBox>, and reusing them here rather than writing bespoke markup
 * is the argument for the catalog having a block tier at all.
 *
 * WHAT CHANGES IS WHICH FACTS ARE ABOVE THE FOLD. On a commerce page that is
 * price and variant; on a property it is tenure, lease length, council tax
 * band and EPC rating — the four things that can end a purchase and that
 * portal listings habitually bury below eleven photographs. <ProductSpecSplit>
 * carries them as a named section rather than as a table nobody scrolls to.
 *
 * <ProductBuyBox> IS USED AS THE ENQUIRY PANEL, not a cart. Its variants
 * become the viewing slots, which is the same shape — a set of mutually
 * exclusive options with availability — and its `onAddToCart` is deliberately
 * not passed, because this is a server component and the block is a client
 * one. A function cannot cross that boundary.
 *
 * THE DESCRIPTION IS WRITTEN LIKE A HUMAN SAW THE HOUSE. The demo copy names
 * a problem — the third bedroom is small, the garden faces north-east — on
 * purpose, because a listing that names one flaw is read as honest about the
 * rest, and a template whose placeholder text is "stunning" teaches the
 * opposite.
 *
 * Anchors are prefixed `pd-`.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { ProductGallery } from '@/lib/blocks/sources/product-gallery'
import { ProductBuyBox } from '@/lib/blocks/sources/product-buy-box'
import { ProductSpecSplit } from '@/lib/blocks/sources/product-spec-split'
import { ProductInfoAccordion } from '@/lib/blocks/sources/product-info-accordion'
import { ListingMapSplit } from '@/lib/blocks/sources/listing-map-split'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const VIEWING_SLOTS = [
  { value: 'thu-1730', label: 'Thu 19 Mar, 5.30pm', inStock: true },
  { value: 'fri-1200', label: 'Fri 20 Mar, midday', inStock: true },
  { value: 'sat-1000', label: 'Sat 21 Mar, 10am', inStock: false },
  { value: 'sat-1400', label: 'Sat 21 Mar, 2pm', inStock: true },
  { value: 'mon-1800', label: 'Mon 23 Mar, 6pm', inStock: true },
]

const LEGALS = [
  {
    label: 'Freehold',
    detail:
      'No lease, no ground rent, no service charge. The title is registered and we have the plan — ask and we will send it before you view rather than after you offer.',
  },
  {
    label: 'Council tax band D — £2,314 a year',
    detail: 'Bristol City Council, 2026/27 rate. Single-occupancy discount would take it to £1,735.',
  },
  {
    label: 'EPC rating D (64), potential B (84)',
    detail:
      'Solid walls, so the gap is mostly internal insulation and the boiler, which is a 2011 Worcester and will want replacing within five years. The full certificate is linked below.',
  },
  {
    label: 'No chain above',
    detail:
      'The owners have already completed on a purchase in Wales. Realistically eight to ten weeks from offer if your side is ready.',
  },
]

/*
  `id` is required and is emitted into the DOM, so it is prefixed — /pages
  renders every page preview on one document and a bare `rooms` would
  collide with any other accordion in the catalog.
*/
const DETAIL_SECTIONS = [
  {
    id: 'pd-rooms',
    title: 'The rooms',
    defaultOpen: true,
    body: [
      'Four bedrooms across two floors. The main bedroom runs the full width at the front with the original shutters; the second is a good double overlooking the garden.',
      'The third is a genuine single — about 2.4 by 2.6 metres — and the fourth on the top floor is the one with the view, reached by a steep staircase that will not suit everybody. Two bathrooms, one of them recent. The kitchen was done in 2019 and opens onto the garden.',
    ],
    specs: [
      { label: 'Bedrooms', value: '4 (2 double, 1 single, 1 attic)' },
      { label: 'Bathrooms', value: '2 (one refitted 2022)' },
      { label: 'Reception rooms', value: '2, through-lounge' },
      { label: 'Floor area', value: '1,540 sq ft / 143 m²' },
    ],
  },
  {
    id: 'pd-garden',
    title: 'The garden and the outbuilding',
    body: [
      'About eighteen metres, walled, and facing north-east — so it gets the morning and loses the sun by mid-afternoon in summer.',
      'There is a brick outbuilding at the end currently used as a bike store, with power but no heating. Two of the neighbours have converted theirs into studios and the planning precedent is there.',
    ],
  },
  {
    id: 'pd-area',
    title: 'The street and the area',
    body: [
      'Hampton Road is residential with permit parking, zone RD, currently with no waiting list.',
      'Redland station is a seven-minute walk for the Severn Beach line and Gloucester Road with its shops is about ten. Catchment for Redland Green School, which is the reason most people on this street are on this street.',
    ],
  },
  {
    id: 'pd-caveats',
    title: 'What we would want to know if we were buying it',
    body: [
      'There is a crack above the bay window that the owners had looked at in 2023. The engineer’s report says historic movement with no ongoing issue, and we will send you the report rather than wait to be asked.',
      'The loft is boarded but not insulated to current standard, and the boiler is a 2011 Worcester that will want replacing within five years. Nothing else we are aware of, and we would tell you if there were.',
    ],
  },
]

export default function PropertyDetailPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Halyard & Co"
        links={[
          { label: 'Buy', href: '#' },
          { label: 'Sell', href: '#' },
          { label: 'Market', href: '#' },
          { label: 'Our team', href: '#' },
        ]}
        activeLabel="Buy"
        ctaLabel="Book a viewing"
        ctaHref="#pd-viewing"
      />

      <main>
        <header className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            New this week · Redland, Bristol
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Four-bedroom Victorian terrace, Hampton Road
          </h1>
          <p className="mt-2 text-muted-foreground">
            Freehold · 1,540 sq ft · walled garden · no chain above
          </p>
        </header>

        {/* Gallery and enquiry panel side by side — the commerce shape,
            with viewing slots where the variants would be. */}
        <div className="mx-auto mt-8 grid w-full max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8">
          <ProductGallery />

          <div id="pd-viewing" className="min-w-0">
            <ProductBuyBox
              name="Hampton Road, Redland"
              price={615000}
              currency="GBP"
              locale="en-GB"
              variantLabel="Viewing slot"
              variants={VIEWING_SLOTS}
              maxQuantity={4}
            />
          </div>
        </div>

        <ProductSpecSplit
          eyebrow="The legals"
          heading="The four facts that decide a purchase"
          intro="Tenure, council tax, EPC and chain position. Portal listings bury these under eleven photographs; they are the first thing a buyer's solicitor will ask and the first thing that ends a sale."
          points={LEGALS}
        />

        <ProductInfoAccordion sections={DETAIL_SECTIONS} />

        <div id="pd-nearby">
          <ListingMapSplit
            heading="Others at around this price"
            resultSummary="Six properties between £470,000 and £900,000, all within a mile"
          />
        </div>

        <CtaSplitPanel
          heading="Come and see it"
          supporting="Viewings are conducted by one of the four partners, evenings and Saturdays included. We will send the engineer's report, the EPC and the title plan before you come rather than after you offer."
          primaryLabel="Book a viewing"
          primaryHref="#pd-viewing"
          secondaryLabel="Ask us a question"
          reassurance={[
            { text: 'Engineer’s report and EPC sent before the viewing' },
            { text: 'No chain above — eight to ten weeks is realistic' },
            { text: 'Permit parking zone RD, no waiting list' },
          ]}
        />
      </main>

      <FooterMinimal
        brand="Halyard & Co"
        links={[
          { label: 'Buy', href: '#' },
          { label: 'Sell', href: '#' },
          { label: 'Fees', href: '#' },
          { label: 'Complaints', href: '#' },
        ]}
      />
    </div>
  )
}
