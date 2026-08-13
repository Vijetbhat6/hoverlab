/**
 * The careers page, ordered the way a candidate actually reads it.
 *
 *   team        who they would work with — faces before job titles
 *   openings    the actual list, grouped by craft
 *   faq         the questions people won't ask in a screening call
 *   cta         a way in for the reader no listing fits
 *   footer      done
 *
 * The FAQ items are careers-specific, not the product FAQ reused. Visa
 * support, remote policy and interview shape are the questions that decide
 * whether someone applies, and answering them here is cheaper for both
 * sides than answering them one recruiter email at a time.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { TeamGrid } from '@/lib/blocks/sources/team-grid'
import { JobListingBoard } from '@/lib/blocks/sources/job-listing-board'
import { FaqAccordion } from '@/lib/blocks/sources/faq-accordion'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const CAREERS_FAQ = [
  {
    question: 'Is the team remote?',
    answer:
      'Remote-first across European and American time zones, with a four-hour overlap window. We meet in person twice a year, and the company pays for it.',
  },
  {
    question: 'Do you sponsor visas?',
    answer:
      'Yes, for roles marked as sponsoring in the listing. The process runs in parallel with the offer, not after it, so sponsorship never delays a start date.',
  },
  {
    question: 'What does the interview look like?',
    answer:
      'A conversation, a paid work sample you do on your own time, and a debrief with the people you would sit with. No whiteboard algorithms, no surprise rounds.',
  },
  {
    question: 'I don’t see a role that fits. Should I still write?',
    answer:
      'Yes. Several people on the team joined through a speculative note that named the problem they wanted to work on. Tell us that, and skip the cover letter.',
  },
]

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Careers" ctaLabel="See openings" ctaHref="#openings" />

      <main>
        <TeamGrid />

        <div id="openings">
          <JobListingBoard />
        </div>

        <FaqAccordion
          heading="Before you apply"
          subheading="The things candidates ask once there's an offer, answered while it can still save you time."
          items={CAREERS_FAQ}
        />

        <CtaSplitPanel />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
