/**
 * A job board's home page — a two-sided marketplace where only one side reads.
 *
 *   search     the query, because candidates arrive with a role in mind
 *   board      the openings, grouped by craft
 *   why        what makes this board different from the big one
 *   employers  the other side, addressed once and briefly
 *   answers    salary transparency, agencies, and the rules
 *
 * THE HARD PART OF A JOB BOARD IS THAT IT HAS TWO AUDIENCES AND ONLY ONE
 * OF THEM IS ON THIS PAGE. Candidates outnumber employers by three orders
 * of magnitude and they arrive from a search for a job title. So the whole
 * page is built for them, and the employer side gets one section near the
 * bottom plus a nav link — which is enough, because an employer who wants
 * to post arrives looking for the price and will scroll to find it.
 *
 * <JobListingBoard> GROUPS BY DEPARTMENT RATHER THAN RANKING. A flat list
 * of forty roles makes every candidate read forty; grouping by craft means
 * a designer reads three. The block already argues this in its own header,
 * and the reason it is the right block for a whole board rather than just a
 * careers page is that the grouping scales — at forty roles the headers are
 * doing more work, not less.
 *
 * SALARY IS ON EVERY ROW AND THAT IS THE PRODUCT. A board whose listings
 * say "competitive" is the same board as every other one. Making it a rule
 * is the only durable differentiator a job board has, it is the reason
 * candidates come back, and it is why the FAQ leads with it rather than
 * burying it.
 *
 * <StatsBand> CARRIES THE LIQUIDITY NUMBERS. The question behind "should I
 * use this board" is "is anybody hiring on it", and the honest answer is
 * three figures — live roles, employers, and how fast the average one is
 * filled. A logo cloud of employers would be the weaker substitute.
 *
 * Anchors are prefixed `jb-`.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroSearch } from '@/lib/blocks/sources/hero-search'
import { JobListingBoard } from '@/lib/blocks/sources/job-listing-board'
import { StatsBand } from '@/lib/blocks/sources/stats-band'
import { FeatureIconGrid } from '@/lib/blocks/sources/feature-icon-grid'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FaqTwoColumn } from '@/lib/blocks/sources/faq-two-column'
import { FooterNewsletter } from '@/lib/blocks/sources/footer-newsletter'
import { BadgeCheck, Banknote, Globe2, ShieldOff } from 'lucide-react'

const DEPARTMENTS = [
  {
    name: 'Engineering',
    openings: [
      { title: 'Senior Backend Engineer, Payments', location: 'Berlin', remote: true, type: 'Full-time', salary: '€95k–€120k', href: '#' },
      { title: 'Staff Engineer, Developer Platform', location: 'Remote, EU', remote: true, type: 'Full-time', salary: '€120k–€150k', href: '#' },
      { title: 'Site Reliability Engineer', location: 'Amsterdam', remote: true, type: 'Full-time', salary: '€90k–€115k', href: '#' },
      { title: 'iOS Engineer', location: 'Lisbon', type: 'Full-time', salary: '€65k–€85k', href: '#' },
      { title: 'Engineering Manager, Growth', location: 'London', remote: true, type: 'Full-time', salary: '£105k–£130k', href: '#' },
    ],
  },
  {
    name: 'Design',
    openings: [
      { title: 'Senior Product Designer', location: 'Remote, EU', remote: true, type: 'Full-time', salary: '€75k–€95k', href: '#' },
      { title: 'Design Systems Designer', location: 'Copenhagen', remote: true, type: 'Full-time', salary: 'DKK 620k–760k', href: '#' },
      { title: 'Content Designer', location: 'London', type: 'Part-time, 3 days', salary: '£48k–£58k pro rata', href: '#' },
    ],
  },
  {
    name: 'Data and research',
    openings: [
      { title: 'Analytics Engineer', location: 'Remote, EU', remote: true, type: 'Full-time', salary: '€70k–€90k', href: '#' },
      { title: 'User Researcher', location: 'Dublin', remote: true, type: '12-month contract', salary: '€65k–€80k', href: '#' },
    ],
  },
  {
    name: 'Go-to-market',
    openings: [
      { title: 'Developer Advocate', location: 'Remote, worldwide', remote: true, type: 'Full-time', salary: '$120k–$145k', href: '#' },
      { title: 'Solutions Engineer, EMEA', location: 'Munich', remote: true, type: 'Full-time', salary: '€85k–€105k', href: '#' },
      { title: 'Technical Writer', location: 'Remote, EU', remote: true, type: 'Contract, 6 months', salary: '€480/day', href: '#' },
    ],
  },
]

const LIQUIDITY = [
  { value: '1,340', label: 'Live roles', caption: 'Every one with a salary range' },
  { value: '286', label: 'Employers', caption: 'Direct only, no agencies' },
  { value: '19 days', label: 'Median time to hire', caption: 'Posted to offer accepted' },
  { value: '0', label: 'Recruiter spam', caption: 'Your profile is not sold' },
]

const RULES = [
  {
    icon: Banknote,
    title: 'A salary range, or it does not go up',
    body: 'Not "competitive", not "DOE", and not a range so wide it is meaningless. We reject about one posting in six on this rule alone, and we tell the employer why.',
  },
  {
    icon: ShieldOff,
    title: 'No agencies, ever',
    body: 'Every listing is posted by the company doing the hiring. You will never apply through a middleman who cannot answer a question about the team.',
  },
  {
    icon: Globe2,
    title: 'Remote means remote, with the countries named',
    body: '"Remote" that turns out to mean one time zone and a visa you do not have wastes a fortnight. Employers list the countries they can actually employ in.',
  },
  {
    icon: BadgeCheck,
    title: 'The process is published before you apply',
    body: 'Number of stages, whether there is a take-home, how long it is, and whether it is paid. On the listing, not in an email after the first call.',
  },
]

const QUESTIONS = [
  {
    question: 'Is it really free for candidates?',
    answer:
      'Yes, and there is no account required to browse or to apply — applications go straight to the employer’s own system. We make money from employers posting, which is the only model where our incentives and yours point the same way.',
  },
  {
    question: 'Why do some listings have a wide salary band?',
    answer:
      'Usually because the role spans two levels. We allow a band up to about 35% wide and reject anything broader, because past that the number stops being information. If a band looks wrong to you, the report link on every listing reaches a person.',
  },
  {
    question: 'Will my details be sold to recruiters?',
    answer:
      'No. There is no candidate database to sell — we do not have one. Applications are passed to the employer and nothing is retained beyond a count. This is the main reason the board exists.',
  },
  {
    question: 'How do I know a listing is still open?',
    answer:
      'Every posting expires after 30 days unless the employer confirms it is live, and the date it was last confirmed is on each listing. Roughly a fifth of postings lapse this way each month, which is the point.',
  },
  {
    question: 'Can I get new roles by email?',
    answer:
      'One email a week, filtered to the crafts and countries you pick, and unsubscribing is one click from any of them. No "we miss you" emails, and the list is never rented.',
  },
  {
    question: 'I am an employer. What does it cost?',
    answer:
      '£199 for a 30-day posting, or £1,490 for ten to use over a year. No subscription, no annual contract, and no upsell to a "featured" slot — every listing is shown the same way.',
  },
]

export default function JobBoardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Plainspoken"
        links={[
          { label: 'Jobs', href: '#jb-board' },
          { label: 'Companies', href: '#jb-rules' },
          { label: 'Post a job', href: '#jb-employers' },
        ]}
        activeLabel="Jobs"
        ctaLabel="Post a job"
        ctaHref="#jb-employers"
      />

      <main>
        <HeroSearch
          heading="Every job here has a salary on it"
          subheading="1,340 live roles from 286 companies hiring directly. No agencies, no “competitive salary”, and no account needed to apply."
          placeholder="Try “backend”, “design systems” or “remote EU”"
          submitLabel="Search jobs"
          inputId="jb-search-input"
          suggestions={['Remote, EU', 'Engineering manager', 'Part-time', 'Contract', 'Under 4 interview stages']}
        />

        <div id="jb-board">
          <JobListingBoard
            heading="This week’s openings"
            intro="Thirteen of 1,340, grouped by craft so you can read three rows instead of forty. Every one lists a real range, the countries the employer can hire in, and the number of stages."
            departments={DEPARTMENTS}
            speculativeEmail="hello@plainspoken.jobs"
          />
        </div>

        <StatsBand stats={LIQUIDITY} />

        <div id="jb-rules">
          <FeatureIconGrid
            heading="Four rules, applied to every listing"
            subheading="They are why postings get rejected and why the board is smaller than the big ones. That is the trade, and it is deliberate."
            features={RULES}
            columns={2}
          />
        </div>

        <div id="jb-employers">
          <CtaSplitPanel
            heading="Hiring? £199 for thirty days"
            supporting="One price, one listing, shown the same way as everybody else’s. No subscription and nothing to cancel — and we will tell you before it goes live if the range needs work."
            primaryLabel="Post a job"
            secondaryLabel="Buy ten for £1,490"
            reassurance={[
              { text: 'Reviewed by a person within one working day' },
              { text: 'Expires after 30 days unless you confirm it is still open' },
              { text: 'Refunded in full if we reject it' },
            ]}
          />
        </div>

        <FaqTwoColumn
          heading="How this board works"
          subheading="For both sides, since the rules are the product and they only work if everyone knows them."
          items={QUESTIONS}
          helpTitle="Something wrong with a listing?"
          helpBody="Every posting has a report link and it reaches a person, not a queue. Salary bands that look wrong are the report we act on fastest."
          helpCtaLabel="Report a listing"
        />
      </main>

      <FooterNewsletter
        brand="Plainspoken"
        heading="One email a week, filtered to your craft"
        subheading="New roles matching the crafts and countries you pick. One click to leave, and the list is never rented."
        note="We do not keep a candidate database, so there is nothing here to sell."
        columns={[
          {
            heading: 'Candidates',
            links: [
              { label: 'Browse jobs', href: '#jb-board' },
              { label: 'Remote roles', href: '#' },
              { label: 'Salary data', href: '#' },
            ],
          },
          {
            heading: 'Employers',
            links: [
              { label: 'Post a job', href: '#jb-employers' },
              { label: 'Pricing', href: '#jb-employers' },
              { label: 'Posting rules', href: '#jb-rules' },
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
