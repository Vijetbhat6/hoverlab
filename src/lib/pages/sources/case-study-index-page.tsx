/**
 * The case-study index.
 *
 *   ratings   the aggregate, so the page opens with evidence rather than a
 *             promise
 *   grid      the studies, filterable by industry
 *   logos     everyone else, for the reader whose industry is not here
 *   cta       the way in
 *
 * The one decision worth stating: **the excerpts lead with the result, not
 * with the customer's situation.** "Closed the month in three days" belongs
 * in the card; "Halyard Components is a mid-sized manufacturer founded in
 * 1994" belongs in the study. An index of studies is a list of outcomes
 * someone is scanning for one that resembles their own problem, and a card
 * that opens with a company biography makes that scan impossible.
 *
 * Categories are industries rather than product features, for the same
 * reason: the reader is looking for themselves, not for a module.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { TestimonialRatings } from '@/lib/blocks/sources/testimonial-ratings'
import { BlogPostGrid } from '@/lib/blocks/sources/blog-post-grid'
import { LogoCloud } from '@/lib/blocks/sources/logo-cloud'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const FEATURED = {
  slug: 'halyard-components',
  category: 'Manufacturing',
  title: 'Closed the month in three days, with the same six people',
  excerpt:
    'Nine and a half days down to three, 93% less manual matching, and no new hire — across four years of history in two systems that had never agreed with each other.',
  author: 'Priya Raman',
  date: '4 November 2025',
  readMinutes: 6,
}

const STUDIES = [
  {
    slug: 'meridia-health',
    category: 'Healthcare',
    title: 'Passed an unannounced audit with a login instead of a fortnight',
    excerpt:
      'Read-only auditor access and an immutable log turned the year-end request list from eleven days of screenshots into a two-day review.',
    author: 'Tomás Ferreira',
    date: '18 September 2025',
    readMinutes: 5,
  },
  {
    slug: 'northwind-logistics',
    category: 'Logistics',
    title: 'Cut 1,900 monthly exceptions to 210 without automating the tail',
    excerpt:
      'Six matching rules covered 80% of the volume. The rest stayed manual deliberately, because a rule nobody can explain to an auditor is a liability.',
    author: 'Anika Kapoor',
    date: '2 August 2025',
    readMinutes: 7,
  },
  {
    slug: 'saltwater-group',
    category: 'Hospitality',
    title: 'Nineteen sites on one close calendar for the first time',
    excerpt:
      'Each site had its own spreadsheet and its own deadline. Consolidation took five weeks and found £41,000 of duplicated supplier charges on the way.',
    author: 'Yusuf Haddad',
    date: '14 June 2025',
    readMinutes: 4,
  },
  {
    slug: 'quartzly',
    category: 'Software',
    title: 'Went from monthly to weekly reporting without new headcount',
    excerpt:
      'The interesting part is what did not change: the same six people, the same close process, and a reporting cadence four times faster.',
    author: 'Ingrid Halvorsen',
    date: '30 April 2025',
    readMinutes: 5,
  },
  {
    slug: 'kestrel-labs',
    category: 'Biotech',
    title: 'Grant reporting that survives being audited by three funders',
    excerpt:
      'Three funders, three formats, one ledger. The reconciliation that used to be a person’s whole February is now a scheduled export.',
    author: 'Omar Aziz',
    date: '11 March 2025',
    readMinutes: 6,
  },
]

export default function CaseStudyIndexPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Customers" ctaLabel="Talk to sales" ctaHref="#studies" />

      <main>
        <TestimonialRatings
          score="4.7"
          outOf={5}
          totalReviews="612"
          headline="What customers say when we are not in the room"
          sources={[
            { name: 'G2', score: '4.7' },
            { name: 'Capterra', score: '4.6' },
            { name: 'TrustRadius', score: '8.9/10' },
          ]}
        />

        <div id="studies">
          <BlogPostGrid
            heading="Written up in full, with the numbers"
            featured={FEATURED}
            posts={STUDIES}
            categories={['All', 'Manufacturing', 'Healthcare', 'Logistics', 'Hospitality', 'Software', 'Biotech']}
          />
        </div>

        <LogoCloud caption="Another 1,400 teams who have not written one up" />

        <CtaSplitPanel
          heading="Nothing here looks like your problem?"
          supporting="Ask for a reference in your industry instead. We will introduce you to a customer who has been with us long enough to have complaints as well as compliments."
          primaryLabel="Request a reference"
          secondaryLabel="Book a working session"
        />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
