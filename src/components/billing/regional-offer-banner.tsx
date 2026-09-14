'use client'

/**
 * <RegionalOfferBanner> — the PPP bar: a flag, a sentence, and a code.
 *
 * WHY IT IS SITE-WIDE AND NOT ON /pricing
 *
 * /pricing already knows the visitor's region and already renders their
 * discounted figure. The problem is everybody who never gets there. A
 * visitor from Delhi lands on a category page from search, reads nothing
 * about price, and either leaves or reaches /pricing carrying an assumption
 * formed from every other catalog in this category — all of which list in
 * dollars. India is the largest single country at every catalog here that
 * publishes numbers, so that is not a rounding error in the funnel; it is
 * the funnel.
 *
 * THE THREE PARTS, AND WHY THE SHAPE IS CONSTANT
 *
 *   flag      The visitor's own country, from the same geolocation header
 *             the discount is decided by. Decoration — `aria-hidden`, and
 *             the country is named in words in the sentence beside it, both
 *             because Windows renders no flag glyphs and because a flag is
 *             not something a screen reader can usefully announce.
 *   sentence  One sentence. Country, plan, figure. It is read in the second
 *             and a half somebody spends deciding whether a bar at the top
 *             of a page is an advert, so it does not get a second clause.
 *   code      The coupon, copyable — or, when there is no coupon to type,
 *             a statement in the same slot saying so. Same shape either
 *             way, because the alternative is a bar that visibly changes
 *             size depending on a Polar setting nobody can see.
 *
 * WHY IT CAN RENDER NOTHING, AND ON THIS DEPLOYMENT WILL
 *
 * Everything it could say is a claim about what a card is about to be
 * charged, so it says only what `lib/billing/codes.ts` can substantiate
 * from the Polar configuration. That configuration is still drifting — the
 * organisation has a handful of the thirty-five discounts it eventually
 * needs — and the bar is written so that every intermediate state is
 * either true or silent, never a promise the till refuses:
 *
 *   automatic  The discount ids are set, so checkout applies them from the
 *              request header and refuses typed codes. Shows the price, and
 *              says in the code slot that there is nothing to enter —
 *              because a bar that mentions a discount without one sends
 *              people hunting for a field that will reject whatever they
 *              put in it.
 *   code       No discount ids, but a percentage coupon exists. Shows the
 *              code, copyable, and the percentage it is worth. Says nothing
 *              about the resulting price: see `PublicOffer.entryPrice`.
 *   null       Neither is configured, the two halves disagree, or the
 *              visitor is outside the priced countries. Renders nothing.
 *
 * The null case is the one to hold on to while the dashboard is half-done.
 * It is not a broken bar; it is the bar declining to name a discount it
 * cannot stand behind, which is the only version of this worth shipping
 * before the ids settle.
 *
 * WHY IT IS IN THE FLOW AND NOT FIXED TO THE VIEWPORT
 *
 * It sits at the top of the document, above every surface's own sticky
 * nav, and scrolls away with the page. A fixed bar would have to be
 * subtracted from that nav's offset on forty-odd routes, and there is
 * already one viewport-fixed element competing for the bottom edge (the
 * cookie banner). This appears once, is read once, and is dismissible —
 * which is the behaviour of a notice, not of chrome.
 *
 * DISMISSAL IS PER-BROWSER AND PERMANENT
 *
 * localStorage, wrapped: private mode throws on access in some browsers,
 * and a discount notice is not worth a blank page. A visitor who dismissed
 * it and wants it back finds the same figures on /pricing, which is where
 * the bar sends them anyway.
 */

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Check, Copy, X } from 'lucide-react'

import { usePricing } from '@/hooks/use-pricing'
import { countryNameFor, flagFor } from '@/lib/country-display'
import { track } from '@/lib/analytics'

const DISMISS_KEY = 'hl:regional-offer-dismissed'

/**
 * Routes that render a document but must not carry site chrome.
 *
 * `/preview/[level]/[slug]` and `/preview/builder` are what the responsive
 * preview iframes point at, and their whole purpose is the artifact alone in
 * a real viewport — that route's own docblock says "no header, no footer, no
 * nav, that furniture is what the reader is trying to see past". Mounting
 * this in the root layout puts furniture in every one of those frames, above
 * the thing being previewed, in a box the size of a phone.
 *
 * A prefix match rather than a list of exact paths: both preview routes are
 * dynamic, and an exact-match table would need an entry per artifact.
 *
 * `/embed/[slug]` needs no entry — it is a `route.ts` serving raw HTML and
 * never touches this layout at all.
 */
const CHROMELESS_PREFIXES = ['/preview']

/**
 * The flag, inside the sentence rather than beside it.
 *
 * Inline, and a child of the `<p>`, because the bar is a wrapping flex row:
 * as a flex item of its own the flag is its own wrap opportunity, and at
 * phone width it took a whole line to itself above the text it belongs to.
 * Inside the paragraph it wraps with the first words instead.
 *
 * `aria-hidden` with no text alternative. The country is named in words
 * immediately after it, so an alt of "Flag of India" would have a screen
 * reader say the country twice — and on Windows, where no flag glyph
 * exists and this renders as two boxed letters, the words are the whole
 * message rather than a caption for it.
 */
function Flag({ flag }: { flag: string | null }) {
  if (!flag) return null
  return (
    // `me-`, not `mr-`: the gap belongs after the flag in reading order, and
    // this bar renders on the RTL surfaces too — see `check:rtl`.
    <span aria-hidden className="me-1.5 text-base leading-none">
      {flag}
    </span>
  )
}

export function RegionalOfferBanner() {
  const { offer, region, country } = usePricing()
  const pathname = usePathname()
  const chromeless = CHROMELESS_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
  const [dismissed, setDismissed] = React.useState(true)
  const [copied, setCopied] = React.useState(false)

  /*
    Starts dismissed and is un-dismissed on mount.

    The inverse — start visible, hide if stored — renders the bar for one
    frame on every page load for everyone who has already closed it, which is
    both a flash of unwanted content and a layout shift at the very top of
    the document. Erring towards hidden costs nothing: `offer` arrives from a
    fetch anyway, so there is no first paint in which this could have shown.
  */
  React.useEffect(() => {
    try {
      if (window.localStorage.getItem(DISMISS_KEY) !== '1') setDismissed(false)
    } catch {
      setDismissed(false)
    }
  }, [])

  /*
    The country's name in the reader's own language.

    Resolved in an effect rather than during render because it reads
    `navigator.language`, which the server does not have. Computing it inline
    would make the first client render disagree with the markup React is
    hydrating against and throw away the tree — for a word. Until it lands,
    and on any runtime whose Intl has no region data, the sentence falls back
    to naming the region generically; see `label` below.
  */
  const [countryName, setCountryName] = React.useState<string | null>(null)
  React.useEffect(() => {
    setCountryName(countryNameFor(country, navigator.languages as string[]))
  }, [country])

  const flag = flagFor(country)

  // Fired once per visitor per page load, and only when something is
  // actually on screen — an impression event on a bar that rendered null
  // would report the whole world as having seen the India price.
  const seen = React.useRef(false)
  React.useEffect(() => {
    if (!offer || dismissed || chromeless || seen.current) return
    seen.current = true
    track('regional_offer_shown', { region: region ?? 'unknown', kind: offer.kind })
  }, [offer, dismissed, chromeless, region])

  if (!offer || dismissed || chromeless) return null

  function dismiss() {
    setDismissed(true)
    try {
      window.localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Closing it for this page view is most of the value.
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      track('regional_offer_code_copied', { region: region ?? 'unknown', code })
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard denied — the code is rendered as selectable text inside
      // the button, so there is still a way to take it.
    }
  }

  /*
    How the sentence names the place.

    "Pricing for India" where the country is known, and "Regional pricing"
    where it is not — which happens on a request with no geolocation header
    and on a runtime with no Intl region data. The fallback is deliberately
    vaguer rather than wronger: the offer itself was resolved from a band,
    so "regional" is exactly as specific as what we actually know.
  */
  const label = countryName ? `Pricing for ${countryName}` : 'Regional pricing'

  return (
    <div
      // `polite`, not `alert`: it is worth hearing and not worth interrupting.
      role="status"
      // `relative` is load-bearing: the dismiss button below is absolutely
      // positioned, and without a positioned ancestor it escapes to the
      // nearest one — which on most surfaces is the page, putting an X in
      // the top-right corner of the whole document.
      className="relative border-b border-primary/20 bg-primary/5 px-4 py-2 text-sm"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 pr-6 text-center sm:pr-0">
        {offer.kind === 'automatic' ? (
          <p className="text-muted-foreground">
            <Flag flag={flag} />
            <span className="font-semibold text-foreground">{label}:</span> Pro is{' '}
            <span className="font-semibold text-foreground">{offer.entryPrice}</span>{' '}
            here, not <span className="line-through">{offer.listPrice}</span>.
          </p>
        ) : (
          <p className="text-muted-foreground">
            <Flag flag={flag} />
            <span className="font-semibold text-foreground">{label}:</span>{' '}
            <span className="font-semibold text-foreground">
              {offer.percentOff}% off
            </span>{' '}
            with this code at checkout.
          </p>
        )}

        {/*
          The code slot. A coupon to copy, or the reason there isn't one.

          The `automatic` half is not filler. It is the answer to the
          question the sentence has just raised — a discount was mentioned,
          so where do I type it — and getting it wrong costs a sale twice
          over: once to the buyer who hunts for a field that isn't there,
          and once to the buyer who finds Polar's coupon box and has
          whatever they invent rejected. Checkout sets
          `allowDiscountCodes: false` exactly when this branch is taken.
        */}
        {offer.kind === 'code' ? (
          <>
            <button
              type="button"
              onClick={() => copyCode(offer.code as string)}
              aria-label={`Copy discount code ${offer.code}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-background px-2 py-0.5 font-mono text-xs font-semibold tracking-wide text-foreground transition-colors hover:border-primary/60"
            >
              {offer.code}
              {copied ? (
                <Check aria-hidden className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy aria-hidden className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
            {/* Announced separately from the icon swap above, which a screen
                reader would not notice. */}
            <span aria-live="polite" className="sr-only">
              {copied ? 'Code copied' : ''}
            </span>
          </>
        ) : (
          <span className="rounded-md border border-primary/20 px-2 py-0.5 text-xs text-muted-foreground">
            Applied at checkout — no code needed
          </span>
        )}

        <Link
          href="/pricing"
          className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
        >
          See pricing
        </Link>
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss regional pricing notice"
        className="absolute right-3 top-1.5 rounded p-1 text-muted-foreground transition-colors hover:text-foreground sm:right-4"
      >
        <X aria-hidden className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
