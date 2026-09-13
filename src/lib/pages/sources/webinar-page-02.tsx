/**
 * The webinar page, take 02 — the replay, after the event.
 *
 *   player      watch it now, no form in the way
 *   chapters    what is in it, timestamped, so a skim is possible
 *   clips       the three moments worth sending to a colleague
 *   questions   what was asked live, answered in text
 *   resources   the one thing that does ask for an address
 *
 * Take 01 sells a live event: registration at the top and again at the
 * bottom, an agenda timed by the minute, and the speakers' faces to justify
 * the hour. Every element of it is arguing for a commitment at a specific
 * future time.
 *
 * The problem is that a webinar page outlives its webinar by years. Most of
 * its lifetime traffic arrives after the date, from search, and take 01
 * greets that visitor with a registration form for an event that already
 * happened — the single commonest failure in this page type. Teams paper
 * over it by swapping the button for "watch the recording" behind the same
 * gate, which converts worse than either option honestly chosen.
 *
 * So this take assumes the event is over and the recording is the product.
 * The video is ungated and first, because a gate in front of content that
 * is already on YouTube trades a real audience for a worse one. The gate
 * moves to the resources at the end — the template and the transcript — where
 * it is asking for an address in exchange for something the reader cannot
 * get elsewhere, which is a trade rather than a toll.
 *
 * The live Q&A is transcribed rather than left in the recording. It is
 * usually the most useful twenty minutes and the least watchable, and as
 * text it is also the part that ranks.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroMediaOverlay } from '@/lib/blocks/sources/hero-media-overlay'
import { FeatureRows } from '@/lib/blocks/sources/feature-rows'
import { TestimonialVideo } from '@/lib/blocks/sources/testimonial-video'
import { FaqGrid } from '@/lib/blocks/sources/faq-grid'
import { NewsletterSignup } from '@/lib/blocks/sources/newsletter-signup'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const CHAPTERS = [
  {
    eyebrow: '00:00 – 06:12',
    title: 'Why multi-entity close breaks at eleven entities and not at ten',
    body: 'The threshold is not size, it is the point at which one person stops being able to hold the whole reconciliation in their head. Priya walks through the 340-tab workbook that ran Meridian for six years and identifies the exact three tabs that made it unmaintainable.',
    bullets: ['Skip to 04:30 for the workbook itself', 'The three-tab diagnosis is at 05:48'],
  },
  {
    eyebrow: '06:12 – 22:40',
    title: 'Writing match rules that survive an auditor',
    body: 'The longest chapter and the reason most people are here. Live rule-writing against a real ledger, including two rules that turn out to be wrong and the exception queue catching them. Nothing here is pre-baked; the 71-percent number on screen at 14:02 is what it actually was.',
    bullets: ['Live rule editing from 09:15', 'The two wrong rules: 14:02 and 17:36'],
  },
  {
    eyebrow: '22:40 – 31:05',
    title: 'The parallel month, and why cutting it is a mistake',
    body: 'Tobias makes the case for running both systems for one close, which is the advice most people in the chat disagreed with at the time. He also names what it costs: roughly two extra days of controller time.',
    bullets: ['The disagreement starts at 24:10', 'Cost breakdown at 28:55'],
  },
  {
    eyebrow: '31:05 – 52:18',
    title: 'Live Q&A',
    body: 'Twenty-one minutes, thirty-four questions, and the answers are transcribed further down this page because this chapter is the most useful and the least watchable part of the recording.',
    bullets: ['Transcribed in full below', 'Three questions we could not answer live are answered there too'],
  },
]

const CLIPS = [
  {
    name: 'Priya Raman',
    role: 'Financial Controller',
    company: 'Meridian Foods',
    pullQuote: 'Week six was the week I nearly stopped. The software was matching 71 percent and my spreadsheet was matching 96.',
    duration: '2:14',
  },
  {
    name: 'Tobias Lund',
    role: 'CFO',
    company: 'Northwind Logistics',
    pullQuote: 'The parallel month found nine rules that had been quietly wrong for two years. A straight cutover would have inherited all nine.',
    duration: '1:48',
  },
  {
    name: 'Dana Okonkwo',
    role: 'Co-founder',
    company: 'Acme',
    pullQuote: 'If your close is under four days already, we will make it slower for about a quarter. That is a real thing and we should say it out loud.',
    duration: '1:02',
  },
]

const QA = [
  {
    question: 'Does this work if our entities are on different ledgers?',
    answer:
      'Yes, and about a fifth of customers are in that position — typically NetSuite for the group and Xero for two acquisitions nobody has migrated. Rules are written once and reference a normalised line, so they do not care which ledger it came from.',
  },
  {
    question: 'What happens to rules when the chart of accounts changes?',
    answer:
      'A rule referencing a deleted account is suspended rather than silently skipped, and it appears in the exception queue with the reason. This was asked three times in the chat and the answer live was slightly wrong — it suspends, it does not fail the sync.',
  },
  {
    question: 'How long before we see 90 percent?',
    answer:
      'Twelve weeks is the median, and week six is typically in the sixties. If your data has a lot of supplier trading-name variance it is faster, because that is the pattern the structural rules handle best.',
  },
  {
    question: 'Can auditors see how a match was decided?',
    answer:
      'They can see which rule fired and what it matched on. A plain-language explanation is being built and is not shipped — asked at 44:10, and the honest answer then and now is that a rule id is not good enough.',
  },
  {
    question: 'Is the rule editor available on every plan?',
    answer:
      'Yes, all plans, and it is not an add-on. This is a deliberate difference from at least one competitor where rule changes go through a support ticket.',
  },
  {
    question: 'What was the actual cost of the parallel month?',
    answer:
      'Two days of controller time at Meridian and three at Northwind. Both said it was worth it; Tobias makes the case at 28:55 and is more convincing than we are.',
  },
]

export default function WebinarPage02() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Resources" ctaLabel="Get the template" ctaHref="#webinar-page-02-resources" />

      <main>
        {/*
          Ungated and first. Most of this page's lifetime traffic arrives
          months after the event; greeting it with a registration form for a
          date that has passed is the commonest failure in this page type,
          and a gate in front of a recording that is already on YouTube
          trades a real audience for a worse one.
        */}
        <HeroMediaOverlay
          eyebrow="Recorded 12 November 2025 · 52 minutes"
          heading="Closing eleven entities in four days"
          subheading="The full recording, no registration. A controller, a CFO and one of our founders, including the twenty-minute Q&A and the part where our own software is losing to a spreadsheet."
          primaryLabel="Play the recording"
          primaryHref="#webinar-page-02-chapters"
          secondaryLabel="Read the Q&A instead"
          secondaryHref="#webinar-page-02-qa"
        />

        <div id="webinar-page-02-chapters">
          <FeatureRows
            heading="What is in it"
            subheading="Timestamped, because almost nobody watches fifty-two minutes and the second chapter is the one most people came for."
            rows={CHAPTERS}
          />
        </div>

        <TestimonialVideo
          eyebrow="Three clips"
          heading="The moments worth sending to a colleague"
          subheading="Each under three minutes and each survives being watched without context — which is the only test that matters for a clip someone pastes into Slack."
          testimonials={CLIPS}
        />

        <div id="webinar-page-02-qa">
          <FaqGrid
            heading="The live Q&A, in text"
            subheading="Thirty-four questions were asked; these are the six that came up more than once. Two answers correct what was said live, and both corrections are marked."
            items={QA}
          />
        </div>

        {/*
          The gate, and the only one on the page. It asks for an address in
          exchange for something the reader cannot get elsewhere, which is a
          trade — unlike a gate in front of the video, which is a toll.
        */}
        <div id="webinar-page-02-resources">
          <NewsletterSignup
            heading="The rule-writing template and the full transcript"
            subheading="The seventeen-rule starting set Priya used, as a file, plus the complete 52-minute transcript. This is the one thing on the page that asks for an email address."
            ctaLabel="Send me both"
            note="Two files, one email, and you are not subscribed to anything by submitting this."
          />
        </div>
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
