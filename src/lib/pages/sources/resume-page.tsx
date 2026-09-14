/**
 * The résumé page — a personal site whose home page is the CV itself.
 *
 *   nav        four links, no logo, no menu
 *   document   the CV, printable
 *   contact    one way to reach the person
 *   footer     the same four links
 *
 * THE ARGUMENT FOR THIS PAGE EXISTING AT ALL. Most personal sites put the
 * CV behind a "Résumé" link and a PDF download, which means the document
 * that decides whether someone gets a reply is the one artefact that is
 * never updated and never indexed. Making it the home page inverts that:
 * the canonical copy is HTML, it is searchable, it is readable on a phone,
 * and printing it produces the PDF rather than the other way round.
 *
 * IT IS DELIBERATELY FOUR BLOCKS. Every temptation here is to add — a
 * testimonial rail, a skills chart, a logo cloud of former employers. All
 * of them push the second job below the fold and none of them are read.
 * The restraint is the design: a hiring manager gives this page under a
 * minute and spends it on the roles, so the roles start about 400px down
 * and nothing interrupts them.
 *
 * NO HERO. A masthead with the person's name is already the first thing in
 * <ResumeDocument>, and stacking a marketing hero on top of it would say
 * the name twice and push the content that matters off the first screen.
 * This is the rare page where the content block *is* the hero, and the
 * navbar sits straight on top of it.
 *
 * The contact section uses <CtaSplitPanel> rather than a form. Somebody
 * reading a CV wants an address they can paste into their own mail client,
 * not a five-field form that posts into a void; the reassurance points
 * carry the three facts a recruiter asks in their first message anyway —
 * notice period, location, visa.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { ResumeDocument } from '@/lib/blocks/sources/resume-document'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const LINKS = [
  { label: 'CV', href: '#rp-cv' },
  { label: 'Projects', href: '#rp-cv' },
  { label: 'Writing', href: '#rp-cv' },
  { label: 'Contact', href: '#rp-contact' },
]

export default function ResumePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Aisling Moreau"
        links={LINKS}
        activeLabel="CV"
        ctaLabel="Get in touch"
        ctaHref="#rp-contact"
      />

      <main>
        <div id="rp-cv">
          <ResumeDocument />
        </div>

        <div id="rp-contact">
          <CtaSplitPanel
            heading="Currently taking calls about principal and staff roles"
            supporting="The fastest route is email. Tell me what the system does and what has stopped working about it — that is the part I want to hear before anything about the company."
            primaryLabel="aisling@moreau.dev"
            secondaryLabel="Download this as a PDF"
            reassurance={[
              { text: 'Available from March — one month’s notice' },
              { text: 'Lisbon (UTC+1), remote or hybrid, EU right to work' },
              { text: 'No take-home tests, but happy to pair for an afternoon' },
            ]}
          />
        </div>
      </main>

      <FooterMinimal
        brand="Aisling Moreau"
        links={LINKS}
        socials={[
          { label: 'GitHub', href: '#', icon: 'github' },
          { label: 'Twitter', href: '#', icon: 'twitter' },
        ]}
      />
    </div>
  )
}
