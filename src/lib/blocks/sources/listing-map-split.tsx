/**
 * <ListingMapSplit> — the map-and-results split every property search uses.
 *
 * Results on the start edge, a map on the end edge, both visible at once.
 * It is the defining screen of the genre — estate agents, holiday lets,
 * restaurant finders, anything where "where is it" is the first filter and
 * "what is it" is the second — and it is the one layout a catalog of
 * marketing sections cannot fake, because the two panes have to scroll
 * independently and the map has to stay put.
 *
 * THE MAP IS DECORATIVE AND SAYS SO. This is the decision worth reading.
 * A drawn map is a picture: it carries no information anyone can get at
 * without sight, and pins on it that duplicate the list beside them make a
 * keyboard user tab through every property twice to reach the pagination.
 * So the whole map pane is `aria-hidden` with no focusable descendants,
 * and the result list is not a companion to it — the list *is* the content,
 * and the map is an illustration of the list. When you swap in a real map,
 * keep that shape: the library's markers should not be in the tab order
 * unless they do something the list cannot.
 *
 * IT IS DRAWN, NOT TILED. No Mapbox token, no Google bill, no network
 * request, no layout shift, and nothing to rate-limit in a preview — an
 * inline SVG of plausible streets, a river and two parks. It is honest
 * about being a placeholder in the sense that nobody will mistake it for
 * their city, and it holds the exact space a real map will occupy, which is
 * the thing a screenshot in an `<img>` does not do at every breakpoint.
 *
 * PINS CARRY PRICE, NOT A GENERIC MARKER. A teardrop tells you a property
 * exists somewhere you can already see there is a property; the price is
 * the thing that makes a map worth scanning at all, and it is how a reader
 * decides which of forty pins to look up in the list.
 *
 * On a phone the map goes above the list at a fixed height rather than
 * disappearing, because "roughly where" is most of what a map is for on a
 * small screen, and a hidden map is the reason those sites ship a
 * map/list toggle nobody finds.
 */

import * as React from 'react'
import { Bed, Bath, Maximize2, MapPin } from 'lucide-react'

function instanceId(...parts: (string | undefined)[]): string {
  const text = parts.filter(Boolean).join('|')
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = (Math.imul(hash, 31) + text.charCodeAt(i)) | 0
  return (hash >>> 0).toString(36).slice(0, 6)
}

export interface MapListing {
  title: string
  address: string
  /** Pre-formatted, currency included. See the note in <PriceTickerStrip>. */
  price: string
  /** The short form for the pin — "£615k". Falls back to `price`. */
  pinLabel?: string
  beds?: number
  baths?: number
  /** Floor area as a string, unit included — "1,240 sq ft", "115 m²". */
  area?: string
  /** A status worth a chip: "Under offer", "New", "Reduced". */
  status?: string
  /** Per-cent coordinates on the map pane, 0–100 from the top-left. */
  x?: number
  y?: number
  href?: string
}

export interface ListingMapSplitProps {
  heading?: string
  /** The result count, as a sentence. "142 homes in Bristol BS8". */
  resultSummary?: string
  listings?: MapListing[]
  className?: string
}

const DEFAULT_LISTINGS: MapListing[] = [
  {
    title: 'Four-bedroom Victorian terrace',
    address: 'Hampton Road, Redland',
    price: '£615,000',
    pinLabel: '£615k',
    beds: 4,
    baths: 2,
    area: '1,540 sq ft',
    status: 'New',
    x: 26,
    y: 30,
    href: '#',
  },
  {
    title: 'Two-bedroom garden flat',
    address: 'Chandos Road, Cotham',
    price: '£385,000',
    pinLabel: '£385k',
    beds: 2,
    baths: 1,
    area: '780 sq ft',
    x: 58,
    y: 22,
    href: '#',
  },
  {
    title: 'Warehouse conversion, top floor',
    address: 'Wapping Wharf, Harbourside',
    price: '£549,950',
    pinLabel: '£550k',
    beds: 3,
    baths: 2,
    area: '1,180 sq ft',
    status: 'Reduced',
    x: 44,
    y: 63,
    href: '#',
  },
  {
    title: 'Three-bedroom semi with studio',
    address: 'Kellaway Avenue, Bishopston',
    price: '£472,500',
    pinLabel: '£473k',
    beds: 3,
    baths: 1,
    area: '1,090 sq ft',
    x: 71,
    y: 48,
    href: '#',
  },
  {
    title: 'One-bedroom period conversion',
    address: 'Pembroke Road, Clifton',
    price: '£289,000',
    pinLabel: '£289k',
    beds: 1,
    baths: 1,
    area: '540 sq ft',
    status: 'Under offer',
    x: 16,
    y: 58,
    href: '#',
  },
  {
    title: 'Five-bedroom detached, corner plot',
    address: 'Downs Park East, Westbury Park',
    price: '£895,000',
    pinLabel: '£895k',
    beds: 5,
    baths: 3,
    area: '2,310 sq ft',
    x: 34,
    y: 12,
    href: '#',
  },
]

/**
 * The drawn map.
 *
 * `aria-hidden` on the whole pane, with the pins as spans rather than
 * links — see the header. `preserveAspectRatio="none"` so the streets
 * stretch to whatever box the pane ends up as rather than letterboxing.
 */
function DrawnMap({ listings }: { listings: MapListing[] }) {
  return (
    <div
      aria-hidden
      className="relative h-full w-full overflow-hidden rounded-2xl border border-border/60 bg-muted/40"
    >
      {/* `aria-hidden` here as well as on the wrapper. The wrapper alone is
          enough for a browser, but the drawing is the thing being hidden
          and saying so on the element itself survives somebody later
          lifting this <svg> out into its own component. */}
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-full w-full text-border"
      >
        {/* Parks — under the streets, as they are on a real map. */}
        <rect x="4" y="4" width="22" height="17" rx="2" className="fill-emerald-500/15" />
        <rect x="72" y="62" width="24" height="26" rx="2" className="fill-emerald-500/15" />

        {/* The river. One curve, wide stroke, no outline. */}
        <path
          d="M-2 78 C 18 70, 30 88, 50 80 S 82 66, 102 74"
          className="fill-none stroke-sky-500/25"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Streets. Two weights, because a map where every road is the same
            width reads as graph paper. */}
        <g className="stroke-current opacity-70" strokeWidth="1.1" strokeLinecap="round">
          <path d="M0 26 H100" />
          <path d="M0 52 H100" />
          <path d="M30 0 V100" />
          <path d="M64 0 V100" />
        </g>
        <g className="stroke-current opacity-35" strokeWidth="0.5" strokeLinecap="round">
          <path d="M0 14 H100" />
          <path d="M0 38 H100" />
          <path d="M0 66 H100" />
          <path d="M0 90 H100" />
          <path d="M14 0 V100" />
          <path d="M46 0 V100" />
          <path d="M80 0 V100" />
          <path d="M92 0 V100" />
        </g>
      </svg>

      {/* Price pins, positioned over the drawing. Logical properties, so
          the layout still reads correctly right-to-left. */}
      {listings.map((listing) =>
        listing.x == null || listing.y == null ? null : (
          <span
            key={listing.title}
            /* The pin is centred on its coordinate, and `insetInlineStart`
               resolves to `right` in RTL — so the same negative shift would
               push it the wrong way there and the pin would sit half a label
               off its point. The `rtl:` counterpart flips it back. */
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30 bg-background px-2 py-0.5 text-[11px] font-semibold tabular-nums text-primary shadow-sm rtl:translate-x-1/2"
            style={{ insetInlineStart: `${listing.x}%`, top: `${listing.y}%` }}
          >
            {listing.pinLabel ?? listing.price}
          </span>
        ),
      )}
    </div>
  )
}

function ListingCard({ listing }: { listing: MapListing }) {
  return (
    <li>
      <a
        href={listing.href ?? '#'}
        className="group flex gap-4 rounded-xl border border-border/60 bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
      >
        {/* The photo slot. A flat tinted panel rather than a remote image:
            it holds the exact space a real photograph will take without a
            request, a licence or a layout shift. */}
        <div
          aria-hidden
          className="hidden h-24 w-32 shrink-0 rounded-lg bg-gradient-to-br from-muted to-muted/40 ring-1 ring-inset ring-border/50 sm:block"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-base font-semibold tabular-nums text-card-foreground">
              {listing.price}
            </p>
            {listing.status ? (
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                {listing.status}
              </span>
            ) : null}
          </div>

          <p className="mt-0.5 truncate text-sm font-medium text-card-foreground">
            {listing.title}
          </p>

          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin aria-hidden className="h-3 w-3 shrink-0" />
            <span className="truncate">{listing.address}</span>
          </p>

          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {listing.beds != null ? (
              <span className="inline-flex items-center gap-1">
                <Bed aria-hidden className="h-3.5 w-3.5" />
                {listing.beds} bed
              </span>
            ) : null}
            {listing.baths != null ? (
              <span className="inline-flex items-center gap-1">
                <Bath aria-hidden className="h-3.5 w-3.5" />
                {listing.baths} bath
              </span>
            ) : null}
            {listing.area ? (
              <span className="inline-flex items-center gap-1">
                <Maximize2 aria-hidden className="h-3.5 w-3.5" />
                {listing.area}
              </span>
            ) : null}
          </p>
        </div>
      </a>
    </li>
  )
}

export function ListingMapSplit({
  heading = 'Homes for sale in Bristol',
  resultSummary = '142 properties · sorted by newest listed',
  listings = DEFAULT_LISTINGS,
  className = '',
}: ListingMapSplitProps) {
  const headingId = `listing-map-heading-${instanceId(heading, resultSummary)}`

  return (
    <section
      aria-labelledby={headingId}
      className={`mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 ${className}`}
    >
      <header>
        <h2 id={headingId} className="text-2xl font-bold tracking-tight sm:text-3xl">
          {heading}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{resultSummary}</p>
      </header>

      {/* The map first in source order on narrow screens, beside the list
          on wide ones. `lg:order-last` rather than two renders — one DOM,
          one set of pins, no duplicate content to keep in step. */}
      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <div className="h-64 shrink-0 lg:sticky lg:top-6 lg:order-last lg:h-[34rem] lg:w-[46%] lg:self-start">
          <DrawnMap listings={listings} />
        </div>

        <ul className="flex-1 space-y-3">
          {listings.map((listing) => (
            <ListingCard key={listing.title} listing={listing} />
          ))}
        </ul>
      </div>
    </section>
  )
}
