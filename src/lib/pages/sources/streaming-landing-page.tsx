/**
 * A streaming service's front page — the catalogue is the pitch.
 *
 *   hero       the thing currently worth watching
 *   rails      what is in here, as rows you can scan
 *   sample     a real watch screen, before you pay
 *   devices    where it plays, which is a purchase blocker
 *   price      one plan, one price
 *   answers    downloads, cancellation, ads, sharing
 *
 * THE CATALOGUE SELLS ITSELF AND EVERYTHING ELSE IS FRICTION. A streaming
 * landing page that leads with a feature grid — "4K! Offline! No ads!" — is
 * selling the delivery mechanism rather than the thing being delivered, and
 * nobody subscribes to a delivery mechanism. So the rails come second, right
 * after the hero, and the features are compressed into one section far down
 * where they act as objection handling rather than as the argument.
 *
 * PUTTING A REAL <VideoPlayerShell> ON THE MARKETING PAGE IS THE UNUSUAL
 * DECISION and it is the best one here. Every competitor shows a phone
 * mockup or a device montage; showing the actual watch screen — the player,
 * the episode rail, the metadata — answers "what is this like to use"
 * without a trial, and it is the strongest thing a page in this category
 * can do. It is also honest, because it is the same component the product
 * ships.
 *
 * <ProductRail> CARRIES THE CATALOGUE ROWS. Its `currency` prop is an ISO
 * code fed to `Intl.NumberFormat`, not a symbol — and since nothing here has
 * a per-item price, the rails are given a zero price and the rail is used
 * for its scroll-and-scan shape rather than its commerce chrome. That is a
 * deliberate reuse, and it is called out because the alternative was a new
 * block that would have been <ProductRail> with the prices deleted.
 *
 * <PricingSingle>, NOT <PricingTiers>. One plan is the product decision
 * being advertised, and a tier table with one column looks like an error.
 *
 * Anchors are prefixed `sv-`.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroMediaOverlay } from '@/lib/blocks/sources/hero-media-overlay'
import { ProductRail } from '@/lib/blocks/sources/product-rail'
import { VideoPlayerShell } from '@/lib/blocks/sources/video-player-shell'
import { FeatureIconGrid } from '@/lib/blocks/sources/feature-icon-grid'
import { PricingSingle } from '@/lib/blocks/sources/pricing-single'
import { FaqTwoColumn } from '@/lib/blocks/sources/faq-two-column'
import { FooterMega } from '@/lib/blocks/sources/footer-mega'
import { Download, MonitorPlay, Subtitles, UserRoundCheck } from 'lucide-react'

/* Price 0 throughout — the rail is reused for its scroll-and-scan shape,
   not for its commerce chrome. See the header. */
const NEW_THIS_WEEK = [
  { id: 'sv-1', name: 'Profiling, end to end · 7 episodes', price: 0, swatch: 'from-sky-500/30 to-indigo-500/30' },
  { id: 'sv-2', name: 'The Incident · a 4-part documentary', price: 0, swatch: 'from-rose-500/30 to-orange-500/30' },
  { id: 'sv-3', name: 'Reading a Flame Graph · 18 min', price: 0, swatch: 'from-emerald-500/30 to-teal-500/30' },
  { id: 'sv-4', name: 'Postgres at Scale · 12 episodes', price: 0, swatch: 'from-violet-500/30 to-fuchsia-500/30' },
  { id: 'sv-5', name: 'Design Systems, Year Three · 9 episodes', price: 0, swatch: 'from-amber-500/30 to-red-500/30' },
  { id: 'sv-6', name: 'On Call · a live-recorded series', price: 0, swatch: 'from-cyan-500/30 to-blue-500/30' },
]

const CONTINUE = [
  { id: 'sv-7', name: 'Profiling, end to end · ep 3 of 7', price: 0, swatch: 'from-sky-500/30 to-indigo-500/30' },
  { id: 'sv-8', name: 'Migrations Without Downtime · ep 2 of 5', price: 0, swatch: 'from-lime-500/30 to-emerald-500/30' },
  { id: 'sv-9', name: 'The Incident · ep 1 of 4', price: 0, swatch: 'from-rose-500/30 to-orange-500/30' },
  { id: 'sv-10', name: 'Accessible by Default · ep 6 of 8', price: 0, swatch: 'from-purple-500/30 to-pink-500/30' },
  { id: 'sv-11', name: 'Type Systems in Anger · ep 4 of 10', price: 0, swatch: 'from-slate-500/30 to-zinc-500/30' },
]

const FEATURES = [
  {
    icon: Download,
    title: 'Download anything, keep it 30 days',
    body: 'Every episode, at full quality, on up to four devices. Nothing expires after 48 hours the way it does elsewhere, and a download you started stays valid if your subscription lapses mid-series.',
  },
  {
    icon: MonitorPlay,
    title: 'No ads, ever, on any plan',
    body: 'There is one plan and it has never had an ad tier, a "with ads" discount, or a mid-roll. This is a product decision rather than a current promotion.',
  },
  {
    icon: Subtitles,
    title: 'Subtitles and transcripts on everything',
    body: 'Human-written, not auto-generated, in six languages. Every episode also has a searchable transcript, which is how most people actually find the bit they wanted to re-watch.',
  },
  {
    icon: UserRoundCheck,
    title: 'Five profiles, and no household check',
    body: 'Watch on three screens at once from anywhere. We do not check IP addresses, ask for a verification code, or have an opinion about who is in your household.',
  },
]

const QUESTIONS = [
  {
    question: 'Can I cancel whenever I want?',
    answer:
      'Yes, from the account page in two clicks, and it takes effect at the end of the period you have already paid for rather than immediately. No retention flow, no phone call, and no offer of two months free on the way out.',
  },
  {
    question: 'What happens to my downloads if I cancel?',
    answer:
      'Anything already downloaded stays playable for 30 days from when you downloaded it, including after the subscription ends. Most services revoke on cancellation; we think that is mean, given you paid for the month.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'No trial, and the first month is the same price as every other month — but roughly 40 hours of the catalogue is free to watch without an account at all, including the whole first series of Profiling. Watch that and decide.',
  },
  {
    question: 'How many people can watch at once?',
    answer:
      'Three streams, five profiles, and we do not check where they are. No household verification, no travel restrictions, and no "you seem to be away from home" email.',
  },
  {
    question: 'What quality does it stream at?',
    answer:
      '4K HDR where the source allows, adaptive down to about 1.5Mbps. There is no quality tier and no surcharge for 4K — the plan you can buy is the best one there is.',
  },
  {
    question: 'Will the price go up?',
    answer:
      'It has once in five years, from £7 to £9, announced two months ahead. If it changes again, existing subscribers keep their price for twelve months and are told before it happens rather than in the receipt.',
  },
]

export default function StreamingLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Longform"
        links={[
          { label: 'Browse', href: '#sv-rails' },
          { label: 'How it looks', href: '#sv-watch' },
          { label: 'Price', href: '#sv-price' },
        ]}
        activeLabel="Browse"
        signInLabel="Sign in"
        ctaLabel="Subscribe — £9/mo"
        ctaHref="#sv-price"
      />

      <main>
        <HeroMediaOverlay
          eyebrow="New series · Profiling, end to end"
          heading="Seven hours on finding out what is actually slow"
          subheading="Long-form technical film-making with the profiler open the whole time. 240 hours in the catalogue, no ads on any plan, and about 40 hours of it free without an account."
          primaryLabel="Watch the first episode free"
          primaryHref="#sv-watch"
          secondaryLabel="See what is in here"
          secondaryHref="#sv-rails"
        />

        <div id="sv-rails">
          <ProductRail
            heading="New this week"
            subheading="Six of the fourteen series added this month. Everything is released complete — there is no weekly drip."
            products={NEW_THIS_WEEK}
            currency="GBP"
            locale="en-GB"
            viewAllHref="#sv-rails"
          />

          <ProductRail
            heading="Most watched right now"
            subheading="What other people are part-way through. Nothing here is sponsored or promoted — it is a count."
            products={CONTINUE}
            currency="GBP"
            locale="en-GB"
            viewAllHref="#sv-rails"
          />
        </div>

        {/* The actual product, on the marketing page. See the header. */}
        <div id="sv-watch">
          <VideoPlayerShell />
        </div>

        <FeatureIconGrid
          heading="The four things people ask before subscribing"
          subheading="Downloads, ads, subtitles and sharing — in that order, because that is the order they come up. None of them is an upsell."
          features={FEATURES}
          columns={2}
        />

        <div id="sv-price">
          <PricingSingle
            planName="Longform"
            price="£9"
            cadence="a month"
            heading="One plan, and it is the best one"
            subheading="No ad tier, no 4K surcharge, no annual lock-in. The thing you can buy is the whole thing."
            features={[
              '240 hours, everything in the catalogue',
              '4K HDR wherever the source allows',
              'Downloads that keep for 30 days, on four devices',
              'Three simultaneous streams, five profiles',
              'Human-written subtitles and transcripts, six languages',
              'No ads, and there has never been an ad tier',
              'Cancel in two clicks, effective at the end of the period',
            ]}
            ctaLabel="Subscribe for £9 a month"
            note="About 40 hours are free to watch with no account at all, including the whole first series. Try that before you pay for anything."
          />
        </div>

        <FaqTwoColumn
          heading="Before you subscribe"
          subheading="Cancellation, downloads, sharing and price rises — the four places streaming services usually disappoint people."
          items={QUESTIONS}
          helpTitle="Something else?"
          helpBody="Support is email and it is answered by people who work here, usually within a day and always within three."
          helpCtaLabel="Email support"
        />
      </main>

      <FooterMega
        brand="Longform"
        tagline="Long-form technical film-making. 240 hours, one plan, no ads and no ad tier."
        statusLabel="Streaming normally"
        regionNote="Available worldwide · subtitles in six languages"
        columns={[
          {
            heading: 'Watch',
            links: [
              { label: 'Browse everything', href: '#sv-rails' },
              { label: 'Free without an account', href: '#', badge: '40 hrs' },
              { label: 'New this month', href: '#sv-rails' },
              { label: 'Transcripts', href: '#' },
            ],
          },
          {
            heading: 'Account',
            links: [
              { label: 'Sign in', href: '#' },
              { label: 'Subscribe', href: '#sv-price' },
              { label: 'Cancel', href: '#' },
              { label: 'Devices', href: '#' },
            ],
          },
          {
            heading: 'About',
            links: [
              { label: 'How it is made', href: '#' },
              { label: 'Accessibility', href: '#' },
              { label: 'Work with us', href: '#' },
              { label: 'Contact', href: '#' },
            ],
          },
        ]}
        legalLinks={[
          { label: 'Privacy', href: '#' },
          { label: 'Terms', href: '#' },
        ]}
      />
    </div>
  )
}
