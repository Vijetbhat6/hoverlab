/**
 * The roadmap, take 02 — themes and refusals, no dates.
 *
 *   framing     why there are no quarters on this page
 *   themes      the four problems being worked on, as problems
 *   declined    what we decided not to build, and why
 *   vote        the widget that actually orders the list
 *   digest      a subscription, for people who will not check back
 *
 * Take 01 is a board plus a changelog: now / next / later columns, with the
 * last three releases underneath so the shipped column has dates attached.
 * It is the right page when you can hold a date — a team with a predictable
 * release train and the discipline to move a card rather than quietly let it
 * rot in "next".
 *
 * Most teams cannot, and a roadmap with dates they miss is worse than no
 * roadmap: every slipped quarter spends credibility that the page was built
 * to earn. This take makes the opposite bet. No columns, no quarters, no
 * "coming soon" — four themes stated as problems, each with the constraint
 * that makes it hard, and nothing that can be missed because nothing was
 * promised.
 *
 * The section that makes it honest rather than merely vague is `declined`.
 * A roadmap listing only what you might build is a wish list; the answer
 * most customers actually need is "will you ever do X", and four rows of
 * "no, and here is why" is a more useful page than forty rows of "later".
 * It is also the section that takes nerve, which is why most roadmaps lack
 * it.
 *
 * `feedback-widget` sits under the themes rather than in a corner because on
 * this page it is not a satisfaction survey — it is the input that orders
 * the list, and saying so is the only thing that makes voting worth a
 * reader's thirty seconds.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroEditorial } from '@/lib/blocks/sources/hero-editorial'
import { FeatureRows } from '@/lib/blocks/sources/feature-rows'
import { FaqObjectionList } from '@/lib/blocks/sources/faq-objection-list'
import { FeedbackWidget } from '@/lib/blocks/sources/feedback-widget'
import { NewsletterSignup } from '@/lib/blocks/sources/newsletter-signup'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const THEMES = [
  {
    eyebrow: 'Being worked on now',
    title: 'Inter-company elimination without a spreadsheet',
    body: 'Twelve-entity customers currently drop out of the product at exactly this step and finish the consolidation by hand, which means the close we shortened by four days gets one of them back. The hard part is not the arithmetic — it is that every group nets differently and we have not found a rule shape that covers more than about seventy percent of them.',
    bullets: [
      'Blocking 31 customers, by far the largest single group',
      'The constraint: no rule shape yet that covers enough groups',
      'Two engineers, started November',
    ],
  },
  {
    eyebrow: 'Being worked on now',
    title: 'Match rules that explain themselves',
    body: 'A rule set at 94 percent is excellent until an auditor asks why line 4,181 matched, and the current answer is a rule id. We want a sentence. This is mostly a data-modelling problem and slightly a writing problem, and the writing half is the part that has stalled twice.',
    bullets: [
      'Requested by every customer who has been audited',
      'The constraint: explanations that are true but not book-length',
      'One engineer, restarted January',
    ],
  },
  {
    eyebrow: 'Next, probably',
    title: 'Dynamics 365 write support',
    body: 'The connector reads today. Writing journals back needs a different API surface with different governance limits, and the beta has four customers on it. This one has a real chance of moving ahead of the theme above it, because it is well understood and merely laborious.',
    bullets: [
      '4 customers in beta, 9 more waiting',
      'The constraint: governance limits, not complexity',
      'Unstaffed until elimination ships',
    ],
  },
  {
    eyebrow: 'We want to, and cannot yet',
    title: 'SOC 2 Type II',
    body: 'Not a feature, and the single most common reason we lose an enterprise deal. The observation window closes in March and the report follows it. Listed here because "on the roadmap" is how most vendors describe this and we would rather give you the actual month.',
    bullets: [
      'Type I today, report available under NDA',
      'Observation window closes March 2026',
      'Report expected Q2 — this is the one date on the page',
    ],
  },
]

const DECLINED = [
  {
    id: 'self-host',
    label: 'Self-hosting',
    detail:
      'No, and not later. A nineteen-person team cannot support customer-operated deployments of a system that touches a general ledger, and every version of us that tried would be worse at the hosted product. If this is a hard requirement, two of our competitors do it and we will name them on a call.',
    tone: 'critical' as const,
    status: 'Never',
  },
  {
    id: 'supplier-portal',
    label: 'A supplier portal',
    detail:
      'No. It is a genuinely good adjacent product and it is a different company — different buyer, different support load, different security surface. We lost two customers to a competitor over this and still think it is the right call.',
    tone: 'critical' as const,
    status: 'Not ours',
  },
  {
    id: 'ai-close',
    label: 'An AI that closes the books for you',
    detail:
      'No. We will keep using models to suggest matches, which is what the 94 percent already is. We will not ship something that posts a journal without a person, because the failure mode is a restatement and nobody has an answer for that yet.',
    tone: 'warning' as const,
    status: 'Suggest, not post',
  },
  {
    id: 'mobile',
    label: 'A mobile app',
    detail:
      'No, and the reason is boring: we have looked at the numbers twice and nobody reconciles on a phone. The web app is responsive enough to approve an exception from a train, which is the only mobile use case that showed up.',
    tone: 'neutral' as const,
    status: 'Responsive web',
  },
]

export default function RoadmapPage02() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Roadmap" ctaLabel="Request something" ctaHref="#roadmap-page-02-vote" />

      <main>
        <HeroEditorial
          kicker="Roadmap"
          heading="There are no quarters on this page, on purpose"
          standfirst="We tried a dated roadmap for a year and missed enough of it that the page became a liability — every slipped quarter spent credibility the roadmap existed to build. What follows instead is four problems we are working on, stated as problems, plus the four things we have decided not to build. Exactly one date appears below and it is the SOC 2 one."
          authorName="Dana Okonkwo, co-founder"
          publishedAt="2026-01-09"
          readingTime="5 min read"
          linkLabel="Jump to what we declined"
          linkHref="#roadmap-page-02-declined"
        />

        <FeatureRows
          heading="What is being worked on"
          subheading="Each with the constraint that makes it hard, because &ldquo;in progress&rdquo; with no constraint attached is how a card sits in a column for three quarters."
          rows={THEMES}
        />

        {/*
          The section that makes this page honest rather than merely vague.
          "Will you ever do X" is the question most customers actually have,
          and four rows of "no, and here is why" answers it better than forty
          rows of "later".
        */}
        <div id="roadmap-page-02-declined">
          <FaqObjectionList
            heading="What we have decided not to build"
            intro="Four refusals with reasons. Two of them have cost us named customers, which is noted in the rows rather than left out."
            rows={DECLINED}
          />
        </div>

        <div id="roadmap-page-02-vote" className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6">
          <FeedbackWidget
            heading="This is genuinely how the list gets ordered"
            placeholder="What would you build next, and what does it currently cost you to live without?"
            attachmentNote="Elimination reached the top of the list because 31 customers wrote it here. The second sentence is the one we read most closely."
          />
        </div>

        <NewsletterSignup
          heading="Or hear about it when it ships"
          subheading="One email per release, written by whoever built the thing. No dates, no teasers, and nothing on the weeks we ship nothing."
          ctaLabel="Subscribe to releases"
          note="Roughly two a month. Unsubscribe link in every one, and it works."
        />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
