/**
 * The services page — for a business that sells work, not licences.
 *
 *   personas     who each engagement is for, named by situation
 *   detail       what the work actually involves
 *   prices       a comparison table, because a service list without money on
 *                it is a lead-capture form wearing a page
 *   faq          the four questions that decide whether someone enquires
 *   booking      the call
 *
 * `ComparisonTable` rather than `PricingTiers` here, and that is the whole
 * trap this page exists to avoid: `PricingTiers` has a monthly/yearly toggle
 * that cannot be turned off, which is wrong for anything not billed per
 * month. A fixed-fee engagement rendered in a subscription control tells the
 * reader they are signing up to a recurring charge.
 *
 * Prices are ranges with the variable named. "From £12,000" teaches nothing;
 * "£12–18k, depending on how many source systems" tells the reader which of
 * the two numbers is theirs before they book a call to find out.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { PersonaCards } from '@/lib/blocks/sources/persona-cards'
import { FeatureRows } from '@/lib/blocks/sources/feature-rows'
import { ComparisonTable } from '@/lib/blocks/sources/comparison-table'
import { FaqAccordion } from '@/lib/blocks/sources/faq-accordion'
import { BookingScheduler } from '@/lib/blocks/sources/booking-scheduler'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const WHO = [
  {
    name: 'Audit',
    headline: 'You think something is wrong and cannot prove it',
    bullets: [
      'Two weeks, fixed fee',
      'A written report you own outright',
      'No obligation to hire us for the fix',
    ],
    ctaLabel: 'See what an audit covers',
  },
  {
    name: 'Build',
    headline: 'You know what to do and have nobody free to do it',
    bullets: [
      'Six to twelve weeks',
      'Your repo, your CI, your review process',
      'Handover session and a written runbook',
    ],
    ctaLabel: 'See a typical build',
  },
  {
    name: 'Embed',
    headline: 'You need the capability, not the deliverable',
    bullets: [
      'Three months minimum',
      'Two of ours alongside two of yours',
      'Pairing, not a parallel team',
    ],
    ctaLabel: 'See how embedding works',
  },
]

const WORK = [
  {
    eyebrow: 'Always first',
    title: 'A week of reading before anyone writes code',
    body: 'The repository, the incident history, the last two post-mortems and an hour with whoever has been there longest. Every engagement that has gone badly for us skipped this to start faster.',
    bullets: ['Codebase and infra review', 'Incident and on-call history', 'One interview per team'],
  },
  {
    eyebrow: 'How we bill',
    title: 'Fixed fee per phase, never by the hour',
    body: 'Hourly billing makes our incentive the opposite of yours on the only question that matters — how long this takes. The phase price is agreed before the phase starts and does not move unless the scope does, in writing.',
    bullets: ['Phase priced before it begins', 'Scope changes re-quoted, not absorbed silently', 'Unused phases simply are not invoiced'],
  },
  {
    eyebrow: 'What you keep',
    title: 'Everything, including the reasoning',
    body: 'Code, infrastructure, documents and the decision log with the alternatives we rejected and why. A handover that is only the code leaves the next person re-deciding everything from scratch.',
    bullets: ['Full IP assignment', 'Decision log with alternatives', 'Runbook written by whoever is on call next'],
  },
]

const PRICES = [
  {
    feature: 'Typical duration',
    values: ['2 weeks', '6–12 weeks', '3 months, rolling'],
  },
  {
    feature: 'Fee',
    values: ['£9k fixed', '£12–18k per phase', '£22k per month'],
  },
  {
    feature: 'What moves the number',
    values: ['Nothing — it is fixed', 'Source systems in scope', 'People embedded'],
  },
  { feature: 'Written report', values: [true, true, true] },
  { feature: 'We write production code', values: [false, true, true] },
  { feature: 'Your team pairs with ours', values: [false, false, true] },
  { feature: 'Handover runbook', values: [false, true, true] },
  { feature: 'Notice to stop', values: ['n/a', 'End of phase', '30 days'] },
]

const SERVICE_FAQ = [
  {
    question: 'Will you sign our MSA rather than use yours?',
    answer:
      'Usually yes. Our standard terms exist so a small engagement does not need a legal review; if you have your own, send it and we will redline rather than negotiate from scratch.',
  },
  {
    question: 'Can we stop after the audit?',
    answer:
      'That is a normal outcome and the fee is structured for it. Around a third of audits end with a report that the client’s own team then acts on, which is a good result and we would rather have the reference.',
  },
  {
    question: 'Who actually does the work?',
    answer:
      'The people you meet on the call. We do not have a bench of juniors behind a senior pitch team, which is also why we can only run four engagements at a time.',
  },
  {
    question: 'What if we are unhappy halfway through?',
    answer:
      'Stop at the end of the current phase and pay only for that phase. There is no termination fee and no minimum term on Audit or Build.',
  },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Services" ctaLabel="Book a call" ctaHref="#engagements" />

      <main>
        <PersonaCards
          heading="Three ways to work with us"
          subheading="Named by the situation you are in rather than by how much they cost, because the wrong engagement at the right price is still wrong."
          personas={WHO}
        />

        <FeatureRows
          heading="How the work runs"
          subheading="The three things clients ask about before they ask about price."
          rows={WORK}
        />

        <div id="engagements">
          <ComparisonTable
            heading="What each one costs"
            subheading="Ranges, with the variable named. If a number here is not the number you would be quoted, the difference is in the row underneath it."
            columns={['Audit', 'Build', 'Embed']}
            rows={PRICES}
            highlightColumn={1}
          />
        </div>

        <FaqAccordion
          heading="Before you enquire"
          subheading="The four that come up on nearly every first call."
          items={SERVICE_FAQ}
        />

        <BookingScheduler
          heading="Thirty minutes, no deck"
          description="Bring the problem rather than the requirements. If we are the wrong people for it, we will say so on the call and suggest who is not."
          durationMinutes={30}
        />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
