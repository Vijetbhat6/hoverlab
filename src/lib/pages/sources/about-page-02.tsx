/**
 * The about page, take 02 — the founder's letter.
 *
 *   letter      one voice, signed and dated, making the argument
 *   beliefs     the three convictions the letter rests on
 *   proof       one customer who bet on it
 *   hiring      the open roles, because this page recruits
 *   cta         the way in
 *
 * Take 01 refuses a hero on the grounds that a reader who clicked "About"
 * wants evidence, not a pitch. That is true of a company with a six-year
 * record to point at. It is the wrong bet for a company whose best asset is
 * still conviction — a two-year-old company with no retention curve worth
 * printing has nothing to put in `stats-narrative`, and four made-up numbers
 * would be worse than none.
 *
 * So this take leads with `hero-editorial`: a dateline, a byline, and a
 * standfirst. The signal is that a named person is accountable for what
 * follows, which is the substitute for a track record when you do not have
 * one yet.
 *
 * The second difference is who it is for. Take 01 ends on a reference
 * request — a buyer checking the company is real. This one ends on the job
 * board, because the about page of a small company is read by candidates far
 * more often than by customers, and sending them to /careers via the footer
 * loses most of them.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroEditorial } from '@/lib/blocks/sources/hero-editorial'
import { FeatureRows } from '@/lib/blocks/sources/feature-rows'
import { TestimonialSpotlight } from '@/lib/blocks/sources/testimonial-spotlight'
import { JobListingBoard } from '@/lib/blocks/sources/job-listing-board'
import { CtaInlineCard } from '@/lib/blocks/sources/cta-inline-card'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const BELIEFS = [
  {
    eyebrow: 'First',
    title: 'The person who answers should be able to fix it',
    body: 'Support tiers exist to protect engineering time, and they work — at the cost of putting a translator between the problem and the person who can solve it. We have not hired a tier one, and the cost of that is real: our response times are slower than a scripted queue. We think the trade is worth it and we would rather say so than quietly rank badly on a metric we chose not to optimise.',
    bullets: [
      'Every engineer does one support day a fortnight',
      'Median first reply: 4 hours, business days only',
      'No chatbot, no deflection funnel, no ticket deflection target',
    ],
  },
  {
    eyebrow: 'Second',
    title: 'A finance tool should be boring on purpose',
    body: 'We ship on Tuesdays and we ship small. Nobody wants their reconciliation software to have a redesign the week of close, so the interface has moved very little in two years and most of the work has gone under it. This is the least exciting thing about the company and it is the reason customers stay.',
    bullets: [
      'No breaking API change since launch',
      'Release notes published before the release, not after',
      'Month-end freeze: nothing ships between the 28th and the 3rd',
    ],
  },
  {
    eyebrow: 'Third',
    title: 'We would rather lose the deal than win it by implying',
    body: 'We are not SOC 2 Type II yet. We are Type I, the audit window for Type II closes in March, and every enterprise deal we have lost this year we lost on that line. The alternative was to write "SOC 2 compliant" and let the reader assume, which is what most of this market does, and which would have made the sentence you are reading impossible to write.',
    bullets: [
      'Type I today, Type II expected Q2',
      'Sub-processor list published, with change notice',
      'Security questionnaire answered in full before a call, not after',
    ],
  },
]

const DEPARTMENTS = [
  {
    name: 'Engineering',
    openings: [
      {
        title: 'Backend engineer, ledger',
        location: 'Lisbon or remote (UTC±3)',
        remote: true,
        type: 'Full-time',
        salary: '€78k–€96k',
      },
      {
        title: 'Engineer, integrations',
        location: 'Lisbon or remote (UTC±3)',
        remote: true,
        type: 'Full-time',
        salary: '€70k–€88k',
      },
    ],
  },
  {
    name: 'Support',
    openings: [
      {
        title: 'Support engineer (accounting background)',
        location: 'Remote (UTC±3)',
        remote: true,
        type: 'Full-time',
        salary: '€52k–€64k',
      },
    ],
  },
]

export default function AboutPage02() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="About" ctaLabel="Talk to us" ctaHref="#about-page-02-letter" />

      <main>
        <div id="about-page-02-letter">
          <HeroEditorial
            kicker="About Acme"
            heading="We are two years old and we are telling you that on purpose"
            standfirst="Most about pages of companies our size are written to sound like companies four times our size. This one is not, because the thing we are actually selling — that a named person will answer when reconciliation breaks on the last Friday of the month — stops being true at four times our size."
            authorName="Dana Okonkwo, co-founder"
            publishedAt="2026-01-14"
            readingTime="4 min read"
            linkLabel="Read the engineering notes"
            linkHref="#about-page-02-beliefs"
          />
        </div>

        <div id="about-page-02-beliefs">
          <FeatureRows
            heading="Three things we decided early and have not revisited"
            subheading="Each of these costs us something measurable. That is how you can tell they are real commitments rather than values-page furniture."
            rows={BELIEFS}
          />
        </div>

        {/*
          One customer, not a logo wall. A logo wall is a claim about how
          many; this page's argument is about what kind, and a single named
          finance lead explaining why they took the risk carries that better
          than nine grey rectangles.
        */}
        <TestimonialSpotlight
          quote="They were eighteen months old and pre-Type-II when we signed, which my CFO hated. What sold it was that their founder answered the security questionnaire herself, in full, including the three rows where the answer was no."
          name="Priya Raman"
          role="Financial Controller"
          company="Meridian Foods"
          stats={[
            { value: '6 days', label: 'From first call to signed' },
            { value: '3', label: 'Questions answered "no"' },
          ]}
        />

        <JobListingBoard
          heading="The roles open right now"
          intro="Three of them, which is what a company of nineteen people can absorb in a quarter. If the list is empty by the time you read this, the speculative address below is read by a person."
          departments={DEPARTMENTS}
          speculativeEmail="hiring@acme.example"
        />

        <CtaInlineCard
          contextLabel="Still reading"
          heading="Ask for the reference we would rather you didn't"
          body="We will introduce you to a customer who churned and came back, and tell you what went wrong the first time. It is a better use of half an hour than a demo."
          actionLabel="Request that introduction"
          href="#about-page-02-letter"
          fineprint="One email, no calendar link, and we will not add you to anything."
        />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
