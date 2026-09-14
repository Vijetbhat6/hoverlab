/**
 * A newsletter's landing page — one decision, made from the archive.
 *
 *   hero       the pitch and the field, together
 *   proof      who reads it, as a number and as names
 *   archive    the back issues, which are the actual argument
 *   sample     what one looks like inside
 *   voices     what readers say, which for a newsletter is unusually honest
 *   terms      cadence, unsubscribe, what happens to your address
 *
 * A NEWSLETTER PAGE HAS EXACTLY ONE CONVERSION AND THE ARCHIVE IS WHAT
 * DRIVES IT. Nobody subscribes to a description; they subscribe after
 * reading one issue and wanting the next. So <BlogPostGrid> carrying real
 * back issues sits high on the page, above the testimonials and above the
 * feature-style explanation, and the headlines are specific enough to be
 * worth clicking on their own.
 *
 * <HeroWaitlist> RATHER THAN <HeroCentered> PLUS A FORM. The email field
 * belongs in the first screen — a newsletter page where you have to scroll
 * to find the input is asking for a second decision it does not need — and
 * <HeroWaitlist> is the one hero in the catalog with the field built in and
 * a subscriber count beside it. `onSubmit` is deliberately not passed: this
 * is a server component, the block is a client one, and the block's own
 * success state is the right default.
 *
 * THE TERMS SECTION IS THE CONVERSION BLOCKER, NOT A FOOTNOTE. Every
 * hesitation about a newsletter is the same three worries — how often, can
 * I get out, will you sell my address — and answering them next to the
 * second signup form measurably does more than another testimonial.
 * <ProductSpecSplit> carries them as content rather than as small print.
 *
 * NO PRICING BLOCK even though there is a paid tier, because the free list
 * is the product being sold here: the paid upgrade is offered inside the
 * emails, where a reader who already values them can see the point. Putting
 * a pricing table on the landing page converts the free signup worse and
 * the paid one no better.
 *
 * Anchors are prefixed `nl-`.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroWaitlist } from '@/lib/blocks/sources/hero-waitlist'
import { LogoStrip } from '@/lib/blocks/sources/logo-strip'
import { BlogPostGrid } from '@/lib/blocks/sources/blog-post-grid'
import { StatsNarrative } from '@/lib/blocks/sources/stats-narrative'
import { TestimonialGrid } from '@/lib/blocks/sources/testimonial-grid'
import { ProductSpecSplit } from '@/lib/blocks/sources/product-spec-split'
import { FooterNewsletter } from '@/lib/blocks/sources/footer-newsletter'

const FEATURED = {
  slug: 'the-cache-we-deleted',
  category: 'Issue 148',
  title: 'The cache we deleted, and the four weeks of arguing that preceded it',
  excerpt:
    'A caching layer that everyone agreed was load-bearing turned out to be hiding a query plan that went quadratic. The interesting part is not the fix — it is how long it took to be allowed to look.',
  author: 'Elin Sørensen',
  date: '6 March 2026',
  readMinutes: 9,
}

const ISSUES = [
  {
    slug: 'estimates',
    category: 'Issue 147',
    title: 'Why your estimates are wrong in a direction you can predict',
    excerpt:
      'Seven teams, three years of estimates against actuals. The bias is consistent enough to correct for, and nobody does, because correcting for it feels like admitting something.',
    author: 'Elin Sørensen',
    date: '27 February 2026',
    readMinutes: 7,
  },
  {
    slug: 'oncall',
    category: 'Issue 146',
    title: 'The alert you have never once acted on',
    excerpt:
      'An audit of 214 alert rules across four companies. Two thirds had never resulted in an action. Deleting them is the highest-leverage reliability work available and nobody is measured on it.',
    author: 'Elin Sørensen',
    date: '20 February 2026',
    readMinutes: 6,
  },
  {
    slug: 'migrations',
    category: 'Issue 145',
    title: 'Moving 4TB without a maintenance window, step by step',
    excerpt:
      'The whole runbook, including the two steps we got wrong and had to roll back. Long, and the only issue this year that people have printed.',
    author: 'Guest: Hana Lindqvist',
    date: '13 February 2026',
    readMinutes: 14,
  },
  {
    slug: 'interviews',
    category: 'Issue 144',
    title: 'Paying for take-home tests changed who applied',
    excerpt:
      'Applications fell 20% and the proportion who finished the process rose from 31% to 68%. The people who started applying were different in a way we did not predict.',
    author: 'Elin Sørensen',
    date: '6 February 2026',
    readMinutes: 8,
  },
  {
    slug: 'docs',
    category: 'Issue 143',
    title: 'Documentation is a tier-one service and yours is not on-call',
    excerpt:
      'If the docs going down would stop customers self-serving, they are production. Almost nobody treats them that way, including us until last year.',
    author: 'Elin Sørensen',
    date: '30 January 2026',
    readMinutes: 5,
  },
]

const READERS = [
  {
    quote:
      'The only newsletter I read the week it arrives rather than in a batch on a Sunday. It is long, which is unusual and correct — the short ones have nothing to say.',
    name: 'Tobias Renner',
    role: 'Staff engineer, Contoso',
  },
  {
    quote:
      'I have forwarded the estimates issue to three managers and it changed how one of them ran planning. That is a better hit rate than most books.',
    name: 'Priya Ramanathan',
    role: 'Engineering manager',
  },
  {
    quote:
      'It is one email a week and it is genuinely one email a week. No “quick note”, no webinar invitation, no course launch. I have been on it four years.',
    name: 'Marcus Oyelaran',
    role: 'Principal engineer, Umbra',
  },
  {
    quote:
      'Half the issues are about things that went wrong, with the numbers left in. I do not know anywhere else that publishes the rollback as well as the launch.',
    name: 'Dev Kaur',
    role: 'Platform lead, Aperture',
  },
]

const TERMS = [
  {
    label: 'One email, Friday morning, that is all',
    detail:
      'There is no second email, no digest, no “we noticed you have not opened”. If a week has nothing worth 2,000 words, nothing is sent — that has happened nine times in three years.',
  },
  {
    label: 'Unsubscribe in one click, from any issue',
    detail:
      'A link in the footer that works immediately and does not ask you to confirm, log in, or explain. There is no re-engagement sequence afterwards.',
  },
  {
    label: 'Your address is never sold, rented or shared',
    detail:
      'Not to sponsors, not to a partner, not as part of a "network". Sponsors get a slot in the email and a click count, and never a list.',
  },
  {
    label: 'Every issue is public a fortnight later',
    detail:
      'The archive is free and unpaywalled, and always will be. Subscribing buys it two weeks early and in your inbox, which is worth something to some people and nothing to others.',
  },
]

export default function NewsletterLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="The Long Way Round"
        links={[
          { label: 'Archive', href: '#nl-archive' },
          { label: 'About', href: '#nl-terms' },
          { label: 'Sponsor', href: '#' },
        ]}
        activeLabel="Archive"
        ctaLabel="Subscribe"
        ctaHref="#nl-subscribe"
      />

      <main>
        <div id="nl-subscribe">
          <HeroWaitlist
            heading="One long email about software, every Friday"
            subheading="Postmortems with the numbers left in, migrations with the rollback described, and interview processes assessed against what they actually selected for. Free, and about 2,000 words."
            placeholder="you@company.com"
            submitLabel="Subscribe"
            waitlistCount={41280}
            note="One email a week. Unsubscribe in one click. Your address is never sold."
            successMessage="You’re in — the next issue lands on Friday morning. The most recent one is on its way to you now."
          />
        </div>

        <LogoStrip
          claim="Read by engineers at"
          logos={['Northwind', 'Contoso', 'Umbra', 'Vandelay', 'Aperture', 'Lumon']}
        />

        <div id="nl-archive">
          <BlogPostGrid
            heading="The last six issues"
            featured={FEATURED}
            posts={ISSUES}
            categories={['All', 'Postmortems', 'Process', 'Reliability', 'Hiring']}
          />
        </div>

        <StatsNarrative
          eyebrow="Three years in"
          heading="41,280 subscribers and a 62% open rate, which is the number that matters"
          body="A large list that nobody opens is a vanity metric and a rented audience. This one is small by newsletter standards and is read, which is why the sponsor slots are booked out to June and why there is only ever one of them."
          stats={[
            { value: '41,280', label: 'Subscribers', source: 'March 2026, verified addresses only' },
            { value: '62%', label: 'Open rate', source: 'Rolling 12-issue average' },
            { value: '148', label: 'Issues, no skipped weeks bar nine', source: 'Since March 2023' },
            { value: '0', label: 'Times the list has been shared', source: 'And there is no mechanism to' },
          ]}
          ctaLabel="Read the archive"
          ctaHref="#nl-archive"
        />

        <TestimonialGrid
          heading="What readers say"
          subheading="Unedited, and picked to include the two that describe it as long — because it is, and somebody who wants a three-minute read should know before subscribing."
          testimonials={READERS}
        />

        <div id="nl-terms">
          <ProductSpecSplit
            eyebrow="The terms"
            heading="What subscribing actually signs you up for"
            intro="The three worries everybody has about giving an address to a newsletter, answered before you are asked to give one a second time."
            points={TERMS}
          />
        </div>
      </main>

      <FooterNewsletter
        brand="The Long Way Round"
        heading="Start with this Friday’s"
        subheading="Free, weekly, about 2,000 words, and the archive is public a fortnight after each issue goes out."
        note="One click to leave, from any issue, with no re-engagement sequence afterwards."
        columns={[
          {
            heading: 'Read',
            links: [
              { label: 'The archive', href: '#nl-archive' },
              { label: 'Best of 2025', href: '#' },
              { label: 'RSS', href: '#' },
            ],
          },
          {
            heading: 'About',
            links: [
              { label: 'Who writes it', href: '#' },
              { label: 'Sponsor an issue', href: '#' },
              { label: 'Privacy', href: '#nl-terms' },
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
