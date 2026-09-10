/**
 * The page a security questionnaire arrives from.
 *
 * The reader is not a buyer in the usual sense. They have already decided
 * they want the product; someone in their organisation has now asked them
 * to justify it, and they are looking for something they can forward. That
 * changes what the page is for: not persuasion, but ammunition.
 *
 * Which is why the order is unusual for a landing page.
 *
 *   hero          says what this is, and nothing more. A security page
 *                 that opens with a promise reads as marketing and gets
 *                 skimmed past by the person who needs the facts
 *   posture       the certifications and controls, early, because that is
 *                 the section being forwarded
 *   benchmarks    numbers with something to compare against, since a
 *                 figure with no denominator answers no question
 *   FAQ           the specific objections, in the specific words a
 *                 security reviewer uses
 *   contact       a route to a human, because past a certain size the
 *                 answer is always a call
 *
 * <CtaStickyBar> is held back until the reader is past a scroll threshold,
 * which is exactly right here: someone still reading the certification list
 * is not ready to be asked for anything, and a bar that appears immediately
 * on a compliance page reads as a vendor who would rather not be asked.
 *
 * The footer is <FooterMinimal> rather than the mega footer. A page whose
 * job is to be forwarded should end, not branch.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroSplit } from '@/lib/blocks/sources/hero-split'
import { SecurityPostureBand } from '@/lib/blocks/sources/security-posture-band'
import { StatsBenchmarkBand } from '@/lib/blocks/sources/stats-benchmark-band'
import { SecurityFaqList } from '@/lib/blocks/sources/security-faq-list'
import { ContactSalesForm } from '@/lib/blocks/sources/contact-sales-form'
import { CtaStickyBar } from '@/lib/blocks/sources/cta-sticky-bar'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

export default function SecurityLandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <NavbarSimple />
      <HeroSplit />

      <SecurityPostureBand />
      <StatsBenchmarkBand />
      <SecurityFaqList />
      <ContactSalesForm />

      <FooterMinimal />

      {/* Appears on scroll, so it cannot interrupt the section being read. */}
      <CtaStickyBar />
    </main>
  )
}
