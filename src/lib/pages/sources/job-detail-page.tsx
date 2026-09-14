/**
 * One job listing — the page a candidate reads twice and then applies from.
 *
 *   header     the role, as an article header, because it is a document
 *   facts      salary, location, stages, contract — before the prose
 *   process    every stage, with how long and whether it is paid
 *   role       what the job is, in sections that can be skimmed
 *   company    who is hiring, and their numbers
 *   apply      the form, and what happens after it
 *
 * THE FACTS COME BEFORE THE PROSE, WHICH IS THE OPPOSITE OF MOST LISTINGS.
 * A candidate deciding whether to spend forty minutes on an application is
 * answering four questions — how much, where, how many stages, and is there
 * a take-home — and every one of them is usually four paragraphs down,
 * after the company's mission statement. <ProductSpecSplit> puts them
 * directly under the header, which costs the employer nothing and saves the
 * reader the scroll.
 *
 * <ArticleHeader> RATHER THAN A HERO. A job listing is a document with an
 * author, a date and a reading time, not a marketing page — and treating it
 * as one gets the typography right for free, including the measure, which
 * matters because this is a page people genuinely read top to bottom.
 *
 * THE PROCESS SECTION IS THE DIFFERENTIATOR. Publishing the stages, their
 * length and whether the take-home is paid is rare enough that it is worth
 * a whole section, and it is the single thing a candidate most wants and
 * most rarely gets. <FeatureRows> carries it because each stage genuinely
 * has a body and bullets — who is in the room, what they ask, what happens
 * if it goes badly.
 *
 * <MultiStepForm>'s `onSubmit` IS NOT PASSED. The block is a client
 * component and this page is a server one, so a handler cannot cross the
 * boundary; the block's own success state is the right default for a
 * template, and wiring it to a real applicant tracking system is one line
 * in one place.
 *
 * Anchors are prefixed `jd-`.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { ArticleHeader } from '@/lib/blocks/sources/article-header'
import { ProductSpecSplit } from '@/lib/blocks/sources/product-spec-split'
import { FeatureRows } from '@/lib/blocks/sources/feature-rows'
import { ProductInfoAccordion } from '@/lib/blocks/sources/product-info-accordion'
import { CustomerOutcomeBand } from '@/lib/blocks/sources/customer-outcome-band'
import { MultiStepForm } from '@/lib/blocks/sources/multi-step-form'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const FACTS = [
  {
    label: '€95,000 – €120,000, plus equity',
    detail:
      'Band 4 on a published ladder. Where you land in it is decided at the offer stage from the interview, not negotiated — and the ladder is public on their engineering handbook.',
  },
  {
    label: 'Berlin, or remote from anywhere they can employ',
    detail:
      'Germany, Netherlands, Ireland, Portugal, Spain and the UK. They will not employ through a contractor-of-record, so if you are outside those six this role is not open to you.',
  },
  {
    label: 'Four stages, about six hours in total',
    detail:
      'One of them is a take-home and it is paid at €600. No stage is a whiteboard algorithm, and the whole process is designed to fit in two weeks.',
  },
  {
    label: 'Permanent, full-time, 4-day week optional at 80% pay',
    detail:
      'Twelve of the thirty-one engineers take it. It is a standing offer rather than something to negotiate, and taking it does not affect the promotion ladder.',
  },
]

const PROCESS = [
  {
    eyebrow: 'Stage one · 30 minutes',
    title: 'A call with the hiring manager',
    body: 'Video, camera optional. Half of it is them describing the team honestly, including what is currently broken about it.',
    bullets: [
      'No CV walkthrough — they have read it',
      'You will be told the salary band again before anything else',
      'Outcome within two working days, either way',
    ],
  },
  {
    eyebrow: 'Stage two · take-home, paid €600',
    title: 'A small change to a real repository',
    body: 'A cut-down version of their payments service with one failing test and an ambiguous requirement. Timeboxed at four hours, and they mean it — they read what you did in four, not what you could do in twelve.',
    bullets: [
      'Paid whether or not you go further, invoiced or paid by transfer',
      'You can decline it and do a 90-minute pairing session instead',
      'The ambiguity is deliberate; asking about it is part of the answer',
    ],
  },
  {
    eyebrow: 'Stage three · 90 minutes',
    title: 'Pairing on your own take-home, with two engineers',
    body: 'You extend what you wrote, with the two people who will review your code every week. Your editor, your machine, your keybindings.',
    bullets: [
      'No new problem to understand under time pressure',
      'They will push back on a decision to see how you argue, not to win',
      'Break whenever you want; it is not a test of stamina',
    ],
  },
  {
    eyebrow: 'Stage four · 45 minutes',
    title: 'A conversation with two people you would work with daily',
    body: 'Not a culture-fit screen with a veto. One engineer from another team and one person from support, on how you work with people who are not engineers.',
    bullets: [
      'You get the last fifteen minutes for your own questions',
      'Offer or rejection within three working days, with reasons',
      'They will tell you who else was in the process and where you placed',
    ],
  },
]

const ROLE_SECTIONS = [
  {
    id: 'jd-about',
    title: 'What the job actually is',
    defaultOpen: true,
    body: [
      'The payments service moves about €40m a month for 9,000 businesses and is the part of the product that cannot be down. You would be the fourth engineer on it, working mostly in Go with a Postgres ledger underneath.',
      'The first six months are a specific project: splitting settlement out of the main service so that a slow bank connection stops holding up everything else. That work is scoped, funded and already agreed — it is not a "we will find you something" role.',
    ],
    specs: [
      { label: 'Stack', value: 'Go, Postgres, Temporal, Terraform, AWS' },
      { label: 'Team', value: '4 engineers, 1 PM, shared designer' },
      { label: 'On-call', value: '1 week in 6, compensated, ~2 pages a week' },
      { label: 'Reports to', value: 'Engineering Manager, Payments' },
    ],
  },
  {
    id: 'jd-looking-for',
    title: 'What they are looking for',
    body: [
      'Five or more years writing backend services that handle money, or something with the same consequences — ticketing, healthcare, logistics. The language matters much less than having been on the wrong end of a reconciliation.',
      'They explicitly do not require a degree, Go experience, or prior fintech. Two of the four on the team came from other domains and the ramp is budgeted at three months.',
    ],
  },
  {
    id: 'jd-not-looking-for',
    title: 'What this role is not',
    body: [
      'Not a greenfield rewrite — the service is seven years old and most weeks you are working inside it rather than beside it.',
      'Not a management track in disguise; there is a staff path and this is on it. And not a role with a nine-month notice period, a non-compete, or unpaid overtime, none of which they use.',
    ],
  },
]

const COMPANY = [
  { label: 'Engineers', value: '31', detail: 'Of 140 people, across six countries' },
  { label: 'Founded', value: '2018', detail: 'Series B, 2024, profitable since Q3 2025' },
  { label: 'Median tenure', value: '3.1 years', detail: 'Published annually with the attrition rate' },
  { label: 'Pay bands', value: 'Public', detail: 'The whole ladder is in their handbook, externally readable' },
]

export default function JobDetailPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Plainspoken"
        links={[
          { label: 'Jobs', href: '#' },
          { label: 'Companies', href: '#' },
          { label: 'Post a job', href: '#' },
        ]}
        activeLabel="Jobs"
        ctaLabel="Apply"
        ctaHref="#jd-apply"
      />

      <main>
        <ArticleHeader
          category="Engineering · Northwind Payments"
          title="Senior Backend Engineer, Payments"
          standfirst="Berlin or remote in six countries. €95k–€120k on a published ladder, four interview stages totalling about six hours, and the take-home is paid."
          author="Northwind"
          role="Posting confirmed live 11 March"
          date="Posted 4 March 2026"
          readMinutes={6}
        />

        <ProductSpecSplit
          eyebrow="Before you read any further"
          heading="The four things you actually want to know"
          intro="Salary, location, process and contract. They are here rather than under three paragraphs of mission statement, which is a rule of this board and not a favour from the employer."
          points={FACTS}
        />

        <div id="jd-process">
          <FeatureRows
            heading="The whole process, published"
            subheading="Four stages, about six hours, designed to fit in two weeks. Nothing below is a surprise you will meet on the day."
            rows={PROCESS}
          />
        </div>

        <ProductInfoAccordion sections={ROLE_SECTIONS} />

        <CustomerOutcomeBand
          eyebrow="About Northwind"
          heading="The employer, in four numbers"
          intro="Published by them, and checkable — the pay ladder and the annual attrition report are both on their public handbook."
          metrics={COMPANY}
        />

        <div id="jd-apply">
          <MultiStepForm
            heading="Apply for this role"
            steps={['About you', 'Your experience', 'Practical']}
            submitLabel="Send application"
            successMessage="Sent to Northwind directly. They reply to every application within five working days, including the rejections, and this board keeps nothing but a count."
          />
        </div>
      </main>

      <FooterMinimal
        brand="Plainspoken"
        links={[
          { label: 'All jobs', href: '#' },
          { label: 'Posting rules', href: '#' },
          { label: 'Report this listing', href: '#' },
          { label: 'Privacy', href: '#' },
        ]}
      />
    </div>
  )
}
