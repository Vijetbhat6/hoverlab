/**
 * A consumer mobile-app landing page, assembled from blocks.
 *
 * This page has one job the others do not: get somebody onto a store
 * listing. Almost every difference from the SaaS running order follows from
 * that single constraint.
 *
 *   navbar          two links, because a consumer will not read five
 *   hero            both store badges and the rating, above the fold
 *   ratings         the App Store score, broken down — the proof that works
 *   features        tabbed, so one screen is shown at a time rather than six
 *   stats           the numbers a consumer actually weighs: users, streaks
 *   pricing         a single price, because there is only one thing to buy
 *   faq             cancellation, family sharing, offline — the store's own
 *                   review section, answered before they go and read it
 *   cta             the download ask again, sized for a thumb
 *   footer          newsletter, since a consumer app's list is its retention
 *
 * WHY RATINGS SIT WHERE LOGOS WOULD. A B2B page opens its proof with
 * customer logos. A consumer has never heard of your customers and has
 * absolutely heard of the App Store — the star breakdown is the only social
 * proof on the page they already know how to read, so it goes first and
 * nothing competes with it.
 *
 * WHY ONE PRICE. A consumer app with three tiers is a consumer app nobody
 * subscribes to; the decision it forces costs more conversions than the
 * extra revenue it captures. `<PricingSingle>` states the number, the
 * annual saving, and what is included, and asks once.
 *
 * Every section takes props, so this file is a running order rather than a
 * wall of copy — swap the content without touching the layout.
 */

import * as React from 'react'

import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroAppDownload } from '@/lib/blocks/sources/hero-app-download'
import { TestimonialRatings } from '@/lib/blocks/sources/testimonial-ratings'
import { FeatureTabs } from '@/lib/blocks/sources/feature-tabs'
import { StatsBand } from '@/lib/blocks/sources/stats-band'
import { PricingSingle } from '@/lib/blocks/sources/pricing-single'
import { FaqAccordion } from '@/lib/blocks/sources/faq-accordion'
import { CtaInlineCard } from '@/lib/blocks/sources/cta-inline-card'
import { FooterNewsletter } from '@/lib/blocks/sources/footer-newsletter'

export default function MobileAppLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Tempo"
        links={[
          { label: 'Features', href: '#features' },
          { label: 'Pricing', href: '#pricing' },
        ]}
        activeLabel="Features"
        signInLabel="Support"
        signInHref="#faq"
        ctaLabel="Download"
        ctaHref="#download"
      />

      <main>
        <div id="download">
          <HeroAppDownload
            eyebrow="iOS and Android — 34 MB"
            heading="The habit tracker that shuts up"
            subheading="Tempo notices when you are on holiday, when you are ill, and when a streak is about to make you lie to an app. It adjusts instead of nagging."
            iosHref="#"
            androidHref="#"
            rating={4.8}
            ratingCount="21,400 ratings"
          />
        </div>

        {/* First proof on the page. See the header note on why this replaces
            the logo cloud a B2B page would put here. */}
        <TestimonialRatings
          score="4.8"
          outOf={5}
          totalReviews="21,400 ratings"
          headline="What people write in the reviews"
          breakdown={[
            { stars: 5, count: 16_900 },
            { stars: 4, count: 3_100 },
            { stars: 3, count: 890 },
            { stars: 2, count: 320 },
            { stars: 1, count: 190 },
          ]}
          sources={[
            { name: 'App Store', score: '4.8', href: '#' },
            { name: 'Google Play', score: '4.7', href: '#' },
          ]}
        />

        <div id="features">
          <FeatureTabs
            heading="One screen at a time"
            subheading="Four things the app does. Tap through them rather than reading a grid of twelve."
          />
        </div>

        <StatsBand
          stats={[
            {
              value: '1.2M',
              label: 'people tracking something',
              caption: 'Across 94 countries',
            },
            {
              value: '68%',
              label: 'still active at six months',
              caption: 'The number most habit apps do not publish',
            },
            {
              value: '0',
              label: 'ads, ever',
              caption: 'And no third-party analytics SDKs',
            },
          ]}
        />

        <div id="pricing">
          <PricingSingle
            heading="One price, everything in it"
            subheading="No tiers to compare, no feature held back to make the next one look better."
            planName="Tempo Plus"
            price="$3.99"
            cadence="per month, billed annually"
            compareAtPrice="$6.99"
            savingLabel="Save 43% annually"
            features={[
              'Unlimited habits — the free app stops at three',
              'Adaptive streaks that survive holidays and sick days',
              'Apple Health and Google Fit, two-way',
              'Home-screen and lock-screen widgets',
              'Full export as CSV or JSON, any time, free plan included',
              'Family Sharing for up to six people at no extra cost',
            ]}
            ctaLabel="Start 14-day free trial"
            ctaHref="#download"
            note="Cancel in two taps from inside the app. No email, no retention offer."
          />
        </div>

        <div id="faq">
          <FaqAccordion
            heading="Before you download"
            items={[
              {
                question: 'Is the free version actually usable?',
                answer:
                  'Three habits, unlimited history, widgets and export. That is the app most people need; Plus exists for the ones tracking a dozen things at once. The free version is not time-limited and never becomes read-only.',
              },
              {
                question: 'How do I cancel?',
                answer:
                  'Settings, Subscription, Cancel — two taps, inside the app, no chat window and no offer screen. Billing is through the App Store or Play Store, so you can also cancel there and we cannot stop you.',
              },
              {
                question: 'Does it work offline?',
                answer:
                  'Entirely. Everything is stored on the device and syncs when it can. The app has no loading spinner on launch because it is not waiting for us.',
              },
              {
                question: 'What happens to my data if I stop paying?',
                answer:
                  'You drop to three active habits and keep every one of your records. Nothing is deleted and nothing is locked — you can export the lot from the free tier at any point.',
              },
              {
                question: 'Does Family Sharing cost extra?',
                answer:
                  'No. One subscription covers up to six people in your family group, which is how Apple intended it to work and how vanishingly few apps implement it.',
              },
            ]}
          />
        </div>

        <CtaInlineCard
          contextLabel="Free for 14 days"
          heading="Try it for a fortnight"
          body="Long enough to see whether it sticks, which is the only test that matters for a habit app. No card up front."
          actionLabel="Get Tempo"
          href="#download"
          fineprint="iOS 16+ and Android 10+. 34 MB. No ads, no trackers."
        />
      </main>

      <FooterNewsletter
        brand="Tempo"
        heading="One mail a month"
        subheading="What changed in the app and one thing we learned about habits. No streak guilt, no discount codes."
        placeholder="you@example.com"
        submitLabel="Subscribe"
        successMessage="Subscribed. First one lands at the start of next month."
        note="Unsubscribe in one click. We do not sell the list."
        columns={[
          {
            heading: 'App',
            links: [
              { label: 'Features', href: '#features' },
              { label: 'Pricing', href: '#pricing' },
              { label: "What's new", href: '#' },
            ],
          },
          {
            heading: 'Support',
            links: [
              { label: 'Help centre', href: '#' },
              { label: 'Contact us', href: '#' },
              { label: 'System status', href: '#' },
            ],
          },
          {
            heading: 'Company',
            links: [
              { label: 'About', href: '#' },
              { label: 'Blog', href: '#' },
              { label: 'Press kit', href: '#' },
            ],
          },
        ]}
        legalLinks={[
          { label: 'Privacy', href: '#' },
          { label: 'Terms', href: '#' },
          { label: 'Data export', href: '#' },
        ]}
      />
    </div>
  )
}
