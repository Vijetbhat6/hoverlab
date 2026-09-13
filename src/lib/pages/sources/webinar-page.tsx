/**
 * The event / webinar registration page.
 *
 *   hero      the date and the sign-up, above everything
 *   agenda    what is actually covered, by the minute
 *   speakers  who is presenting
 *   faq       the four questions that stop people registering
 *   book      the second chance to register, at the bottom
 *
 * Two registration points, not one. This page is short enough to read in
 * full, and a reader who has just been convinced by the agenda should not
 * have to scroll back up — the duplicate form at the end converts materially
 * better than the hero form alone on every event page anyone has measured.
 *
 * The agenda is timed. "Deep dive into best practices" is what event pages
 * say and it tells nobody whether the hour is worth theirs; "18 minutes on
 * the import, with the failure modes" does. A reader who knows exactly what
 * they are getting is also the reader who turns up, which is the number that
 * actually matters — registrations are vanity, attendance is the event.
 *
 * "Recording sent to everyone who registers, whether or not you attend" is
 * in the FAQ because it is the single most common reason people do not
 * register: they know they are busy that Thursday.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroBooking } from '@/lib/blocks/sources/hero-booking'
import { FeatureRows } from '@/lib/blocks/sources/feature-rows'
import { TeamGrid } from '@/lib/blocks/sources/team-grid'
import { FaqAccordion } from '@/lib/blocks/sources/faq-accordion'
import { NewsletterSignup } from '@/lib/blocks/sources/newsletter-signup'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

/*
  Real dates rather than the block's demo days.

  An event page whose dates are the component's placeholders is the single
  most embarrassing thing this template could ship — and on a catalog hub two
  copies of the default set collide on their day ids, so the second one's
  buttons are wired to the first one's. Named dates fix both.
*/
const EVENT_DAYS = [
  { weekday: 'Tue', day: '17', slots: 40 },
  { weekday: 'Thu', day: '19', slots: 120 },
  { weekday: 'Tue', day: '24', slots: 210 },
  { weekday: 'Thu', day: '26', slots: 260 },
]

const SESSIONS = [
  {
    eyebrow: '0–18 min',
    title: 'Getting four years of history in, and proving it reconciles',
    body: 'Live, against a real dataset with real problems in it — including the duplicate-supplier fault we hit at Halyard. The import is the whole cost of a migration and it is where every demo stops short.',
    bullets: ['4.1M rows, start to finish', 'Reconciling totals before go-live', 'What the three commonest import failures look like'],
  },
  {
    eyebrow: '18–38 min',
    title: 'Writing matching rules an auditor can read',
    body: 'Six rules covering 80% of volume, and the argument for leaving the tail manual. We will write one badly first, then fix it, because the failure is more instructive than the finished version.',
    bullets: ['Rule syntax and review queue', 'Why we stop at 80%', 'Making every automated match reversible'],
  },
  {
    eyebrow: '38–60 min',
    title: 'Questions, unfiltered',
    body: 'Not a curated Q&A. Everything asked in the chat gets answered on the call or in a follow-up email within two working days, including the ones about competitors.',
    bullets: ['No pre-screened questions', 'Written follow-up within two days', 'Competitor questions answered honestly'],
  },
]

const EVENT_FAQ = [
  {
    question: 'I cannot make that time. Is it recorded?',
    answer:
      'Yes, and it is sent to everyone who registers whether or not they attend — no separate "watch on demand" form afterwards. Register even if Thursday is already lost.',
  },
  {
    question: 'Is this a product demo?',
    answer:
      'Two-thirds of it is the product doing a real migration, so honestly yes — but against a messy dataset rather than a prepared one, and the failures stay in. There is no slide deck.',
  },
  {
    question: 'Will I be called by a salesperson afterwards?',
    answer:
      'No. You get the recording and one email asking whether it was useful. If you want a conversation there is a link in it, and if you do not, nothing else happens.',
  },
  {
    question: 'Can I send a colleague instead?',
    answer:
      'Forward the confirmation — the link is not personalised. Registering the whole team is fine too and costs us nothing.',
  },
]

export default function WebinarPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Events" ctaLabel="Register" ctaHref="#agenda" />

      <main>
        <HeroBooking
          eyebrow="Live workshop · 60 minutes · Free"
          heading="Migrating four years of ledger history, live"
          subheading="A real import against a real dataset with real faults in it, then twenty minutes of matching rules and twenty of unfiltered questions. Recording sent to everyone who registers."
          submitLabel="Save my place"
          days={EVENT_DAYS}
        />

        <div id="agenda">
          <FeatureRows
            heading="The hour, by the minute"
            subheading="So you can decide whether it is worth yours before you give us an email address."
            rows={SESSIONS}
          />
        </div>

        <TeamGrid
          heading="Who is presenting"
          intro="Both of them do customer migrations for a living and neither works in marketing, which is why the demo is allowed to fail on stage."
        />

        <FaqAccordion
          heading="Before you register"
          subheading="Including the one that stops most people, which is the recording."
          items={EVENT_FAQ}
        />

        <NewsletterSignup
          heading="Register, or hear about the next one"
          subheading="One email when a workshop is scheduled, roughly every six weeks. Nothing else is sent to this address."
          ctaLabel="Save my place"
          note="Recording sent to everyone who registers, attending or not."
        />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
