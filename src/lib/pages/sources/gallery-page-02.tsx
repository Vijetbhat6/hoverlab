/**
 * The gallery, take 02 — the whole grid, filterable.
 *
 *   toolbar     how many there are, and how to sort them
 *   filters     what is currently narrowing the set, removable
 *   grid        everything, at once
 *   story       one piece, expanded, to show what a detail view holds
 *
 * Take 01 is a switcher: four named views, one visible at a time, so the
 * page weighs one image on load rather than forty. That is the right call
 * for a curated gallery where the sequence is the argument and the set is
 * small enough to have been chosen deliberately.
 *
 * It is the wrong call for a catalogue. Once there are ninety pieces the
 * curation is gone whether you admit it or not, and a switcher becomes a
 * navigation puzzle: the visitor cannot tell how much exists, cannot
 * compare two things in different views, and has no way to ask "show me the
 * brass ones under £200".
 *
 * So this take shows everything and spends its design budget on narrowing
 * rather than on sequencing. The toolbar states the total up front — a grid
 * that lazily reveals its size makes the visitor scroll to find out, which
 * is the same information delivered worse.
 *
 * The weight problem take 01 solves by hiding, this one has to solve
 * honestly: ninety images is a real payload, and the answer is intrinsic
 * sizing plus lazy loading below the fold, not a switcher. That is a
 * trade-off rather than a free win, and it is the reason both takes exist.
 *
 * `collection-story-split` at the end is the concession to take 01's
 * argument: a catalogue flattens everything to a thumbnail, so one piece
 * gets the long treatment to show that a detail view exists.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { CollectionToolbar } from '@/lib/blocks/sources/collection-toolbar'
import { AppliedFiltersBar } from '@/lib/blocks/sources/applied-filters-bar'
import { ProductGrid } from '@/lib/blocks/sources/product-grid'
import { CollectionStorySplit } from '@/lib/blocks/sources/collection-story-split'
import { CtaInlineCard } from '@/lib/blocks/sources/cta-inline-card'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const SORTS = [
  { value: 'featured', label: 'Curated order' },
  { value: 'newest', label: 'Most recent' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
]

const FILTERS = [
  { id: 'available', field: 'Availability', value: 'In stock', locked: true },
  { id: 'material', field: 'Material', value: 'Brass' },
  { id: 'maker', field: 'Maker', value: 'Okonkwo Studio' },
]

const PIECES = [
  {
    id: 'p1',
    name: 'Hexagonal brass wall sconce',
    price: 185,
    rating: 4.8,
    reviewCount: 24,
    badge: 'One of 12',
    swatch: '#b08d57',
  },
  {
    id: 'p2',
    name: 'Turned oak stool, low',
    price: 240,
    compareAt: 290,
    rating: 4.6,
    reviewCount: 11,
    swatch: '#c9a227',
  },
  {
    id: 'p3',
    name: 'Slipware serving dish, deep blue',
    price: 96,
    rating: 4.9,
    reviewCount: 38,
    swatch: '#2f4a6d',
  },
  {
    id: 'p4',
    name: 'Brass and walnut desk lamp',
    price: 420,
    rating: 5,
    reviewCount: 7,
    badge: 'One of 6',
    swatch: '#8c6239',
  },
  {
    id: 'p5',
    name: 'Hand-thrown carafe, unglazed',
    price: 74,
    rating: 4.4,
    reviewCount: 52,
    swatch: '#a8927b',
  },
  {
    id: 'p6',
    name: 'Folded steel bookend, pair',
    price: 130,
    rating: 4.7,
    reviewCount: 19,
    soldOut: true,
    swatch: '#4a4a4a',
  },
  {
    id: 'p7',
    name: 'Linen apron, undyed',
    price: 68,
    rating: 4.5,
    reviewCount: 41,
    swatch: '#ded5c4',
  },
  {
    id: 'p8',
    name: 'Cast bronze door pull',
    price: 310,
    rating: 4.9,
    reviewCount: 9,
    badge: 'Made to order',
    swatch: '#7d6b52',
  },
]

const STORY_POINTS = [
  {
    label: 'Twelve were made and eleven were kept',
    detail: 'The twelfth cracked in the second firing of the patina, which is a roughly one-in-ten outcome on this shape and the reason the run is small rather than the reason it is expensive.',
  },
  {
    label: 'The brass is reclaimed, and it shows',
    detail: 'Sourced from decommissioned marine fittings, so the colour varies between pieces more than a mill-stock sconce would. If you want two that match, say so and we will pick from the same batch.',
  },
  {
    label: 'It will go dark, and that is not a fault',
    detail: 'Unlacquered brass patinates to a deep brown over about eighteen months. We do not lacquer it because lacquer eventually fails in patches, which looks considerably worse than an even patina.',
  },
  {
    label: 'Six weeks, not six days',
    detail: 'Each one is spun, not cast, and the patina takes a fortnight on its own. The lead time is on every product page rather than discovered at checkout.',
  },
]

export default function GalleryPage02() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Okonkwo Studio" activeLabel="Work" ctaLabel="Commission a piece" ctaHref="#gallery-page-02-commission" />

      <main>
        <div className="mx-auto w-full max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ninety-four pieces
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
            Everything the studio currently has, including what is sold out
            and what is made to order. Past about ninety pieces the curation
            is gone whether we admit it or not, so this is a catalogue with
            filters rather than a sequence with a story.
          </p>
        </div>

        {/*
          The total is stated rather than discovered. A grid that reveals
          its size only by scrolling delivers the same fact, later and worse.
        */}
        <div className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
          <CollectionToolbar total={94} sortOptions={SORTS} />
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <AppliedFiltersBar filters={FILTERS} matched={8} total={94} sortOptions={SORTS} />
        </div>

        <ProductGrid products={PIECES} currency="GBP" locale="en-GB" />

        {/*
          The concession to take 01's argument. A catalogue flattens
          everything to a thumbnail, so one piece gets the long treatment —
          otherwise nothing on the page shows that a detail view exists, and
          the work reads as stock.
        */}
        <CollectionStorySplit
          eyebrow="One piece, at length"
          heading="Hexagonal brass wall sconce"
          intro="What a detail page holds, using the piece at the top of the grid. The third point is the one people email about six months later."
          points={STORY_POINTS}
        />

        <div id="gallery-page-02-commission">
          <CtaInlineCard
            contextLabel="Nothing here quite right"
            heading="Commissions open twice a year"
            body="Four slots each time, currently taking names for the spring run. Most commissions are a variation on something already in the grid rather than a blank sheet, and those are the ones that go well."
            actionLabel="Join the commission list"
            href="#gallery-page-02-commission"
            fineprint="Two emails a year. The spring list closes at the end of February."
          />
        </div>
      </main>

      <FooterMinimal brand="Okonkwo Studio" />
    </div>
  )
}
