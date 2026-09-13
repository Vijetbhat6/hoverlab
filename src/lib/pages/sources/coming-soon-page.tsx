/**
 * The coming-soon page.
 *
 *   waitlist  the email capture, which is the entire purpose
 *   what      three rows saying what it will actually do
 *   timing    the second capture, with the honest date
 *   footer    minimal, because there is nothing else to link to
 *
 * The one rule this page exists to demonstrate: **say what the thing is.**
 * The commonest coming-soon page is a logo, a countdown and an email field,
 * which asks a stranger to commit an address to a product they cannot
 * describe. Three specific rows about what it does convert several times
 * better than any amount of mystery, and they cost nothing — if the product
 * is too secret to describe, it is too secret to collect emails for.
 *
 * No countdown timer. A countdown is a commitment to a date, in public, on a
 * product that has not shipped — and the most common outcome is a page
 * showing a timer that expired three weeks ago, which is worse than having
 * shown nothing. "Early access opens in March" can slip quietly; a clock at
 * zero cannot.
 *
 * Deliberately the shortest page in the catalog. There is nothing else to
 * say yet, and padding it out is how a pre-launch page starts making claims
 * it cannot keep.
 */

import * as React from 'react'
import { HeroWaitlist } from '@/lib/blocks/sources/hero-waitlist'
import { FeatureRows } from '@/lib/blocks/sources/feature-rows'
import { NewsletterSignup } from '@/lib/blocks/sources/newsletter-signup'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const WHAT_IT_DOES = [
  {
    eyebrow: 'The problem',
    title: 'Your close takes nine days and two of them are matching',
    body: 'Two systems that have never agreed, a spreadsheet holding them together, and one person who understands the spreadsheet. That is the situation this is being built for.',
    bullets: ['Ledger and bank, reconciled hourly', 'Rules you can read aloud', 'Exceptions surfaced, not hidden'],
  },
  {
    eyebrow: 'The shape',
    title: 'Import first, automate second, never the other way round',
    body: 'Nothing is automated until four years of history is in and reconciles to the same totals. It is slower to start and it is the only order that finds the faults already in your data.',
    bullets: ['Full history import before go-live', 'Totals matched before any rule runs', 'Every automated match reversible'],
  },
  {
    eyebrow: 'The honest part',
    title: 'What it will not do at launch',
    body: 'No mobile app, no conditional approval routing, and two of the six importers are not written yet. Listing this now is cheaper for both of us than discovering it in March.',
    bullets: ['No native mobile at launch', 'Basic approvals only', 'Four of six importers ready'],
  },
]

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        <div id="notify">
          <HeroWaitlist
            heading="A close that finishes on the third working day"
            subheading="Acme is being built for finance teams reconciling two systems by hand. Early access opens in March, in order of joining, and there is no charge during it."
            placeholder="you@company.com"
            submitLabel="Join the waitlist"
            successMessage="You are on the list. You will hear from us in March and not before."
            note="No other email goes to this address. One click to leave."
            waitlistCount={2140}
          />
        </div>

        <FeatureRows
          heading="What it is, before you give us an address"
          subheading="Including the third row, which is what it will not do yet."
          rows={WHAT_IT_DOES}
        />

        <NewsletterSignup
          heading="Early access opens in March"
          subheading="Invitations go out in the order people joined. No countdown clock on this page, because a clock at zero is worse than no clock at all."
          ctaLabel="Join the waitlist"
          note="2,140 people ahead of you, and that number is real."
        />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
