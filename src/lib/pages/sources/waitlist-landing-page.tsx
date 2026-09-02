/**
 * A pre-launch landing page, assembled from blocks.
 *
 * The running order is not the SaaS one with the pricing section deleted,
 * and that is the whole point of it existing separately. A product you
 * cannot buy yet has a different argument to make:
 *
 *   navbar          a way around, and the same CTA as the hero
 *   hero            one field, one button — the only conversion on the page
 *   logo strip      who is already waiting, since there are no customers yet
 *   stats           scarcity and momentum, which is all the proof there is
 *   features        what it will do, in three claims and no screenshots
 *   testimonial     one named beta user, because a grid of six would be a lie
 *   faq             the objections a waitlist creates: when, cost, my data
 *   cta             the same ask again, for people who scrolled past it
 *   footer          minimal — there are no other pages yet
 *
 * TWO DELIBERATE ABSENCES. There is no pricing section: naming a number
 * before the product exists converts worse than "early access is free for
 * the first cohort", and locks you into it publicly. And there is no
 * screenshot hero — a mock of an unfinished product is the one thing beta
 * users reliably remember and hold you to.
 *
 * ONE CTA, REPEATED. Every button on this page does the same thing. A
 * pre-launch page with a "book a demo" secondary is a page that splits its
 * only metric across two funnels for no reason.
 *
 * Every section takes props, so this file is a running order rather than a
 * wall of copy — swap the content without touching the layout.
 */

import * as React from 'react'
import { CalendarClock, Layers, Sparkles } from 'lucide-react'

import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroWaitlist } from '@/lib/blocks/sources/hero-waitlist'
import { LogoStrip } from '@/lib/blocks/sources/logo-strip'
import { StatsBand } from '@/lib/blocks/sources/stats-band'
import { FeatureIconGrid } from '@/lib/blocks/sources/feature-icon-grid'
import { TestimonialSpotlight } from '@/lib/blocks/sources/testimonial-spotlight'
import { FaqTwoColumn } from '@/lib/blocks/sources/faq-two-column'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

export default function WaitlistLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Orbit"
        links={[
          { label: 'Why Orbit', href: '#why' },
          { label: 'Questions', href: '#answers' },
        ]}
        activeLabel="Why Orbit"
        // The secondary slot is "Sign in" by default, which is a dead link
        // on a product nobody has an account for — and a dead link in the
        // navbar is the first thing a sceptical visitor clicks. The beta
        // notes are the honest thing to put in a pre-launch page's second
        // slot: the people who click it are the people who convert.
        signInLabel="Beta notes"
        signInHref="#"
        ctaLabel="Join the waitlist"
        ctaHref="#waitlist"
      />

      <main>
        <div id="waitlist">
          <HeroWaitlist
            heading="Your calendar, minus the negotiation"
            subheading="Orbit reads the meeting out of the thread and books it, in the gap everyone can actually make. No polls, no back-and-forth, no third message asking about Tuesday."
            placeholder="you@company.com"
            submitLabel="Request early access"
            successMessage="You're in. We'll mail you when your cohort opens."
            note="Free for the first cohort. No card, and no marketing list."
            waitlistCount={4820}
          />
        </div>

        {/* Not customers — people who signed up. Claiming otherwise is the
            single most common lie on a pre-launch page. */}
        <LogoStrip
          claim="Engineers on the list work at"
          logos={['Northwind', 'Contoso', 'Lumon', 'Vandelay', 'Initech']}
        />

        <StatsBand
          stats={[
            {
              value: '4,820',
              label: 'on the waitlist',
              caption: 'Since the first demo, 9 March',
            },
            {
              value: '120',
              label: 'per cohort',
              caption: 'Small enough that we answer every email',
            },
            {
              value: 'Q4',
              label: 'general availability',
              caption: 'Cohorts open monthly until then',
            },
          ]}
        />

        <div id="why">
          <FeatureIconGrid
            heading="Three things, done properly"
            subheading="Not a feature list — the three decisions the product is built around. Everything else follows from them."
            columns={3}
            features={[
              {
                icon: Sparkles,
                title: 'It reads the thread',
                body: 'Forward the mail and Orbit works out who needs to be there, how long it should run, and which week you actually meant. You confirm; you do not fill anything in.',
              },
              {
                icon: CalendarClock,
                title: 'It defends the gaps',
                body: 'Focus blocks are real appointments, not a colour. Orbit will move a meeting before it splits an afternoon, and tells the other side why in a sentence you can edit.',
              },
              {
                icon: Layers,
                title: 'It leaves no residue',
                body: 'Cancel and every hold disappears from every calendar it touched. No orphaned invites, no ghost blocks a month later, no cleanup task nobody owns.',
              },
            ]}
          />
        </div>

        {/* One quote, named, with the numbers attached. Six anonymous ones
            would read as invented — which, for a product in beta, they
            usually are. */}
        <TestimonialSpotlight
          quote="We ran the beta across a 40-person engineering org for six weeks. The scheduling threads didn't get shorter — they stopped happening."
          name="Dana Okonkwo"
          role="VP Engineering"
          company="Northwind"
          stats={[
            { value: '6 weeks', label: 'in private beta' },
            { value: '−71%', label: 'scheduling messages' },
            { value: '3.5 hrs', label: 'returned per person, per week' },
          ]}
        />

        <div id="answers">
          <FaqTwoColumn
            heading="What people ask before they sign up"
            subheading="The four we get most, answered the way we would answer them in a reply."
            items={[
              {
                question: 'When do I actually get in?',
                answer:
                  'Cohorts open monthly, 120 people each, in signup order. You will get a date rather than a "soon" — and if you are more than one cohort away we say so in the first mail rather than at the end.',
              },
              {
                question: 'What will it cost when it launches?',
                answer:
                  'The first cohort is free permanently, not free for a trial. After that we expect to charge per seat per month, in the range you would expect for a calendar tool. We are not naming a number we might have to walk back.',
              },
              {
                question: 'What do you do with my calendar data?',
                answer:
                  'Read the events, write the ones you confirm, and nothing else. It is not training data, it is not sold, and it is deleted within 30 days of you leaving. The data-processing agreement is available before you connect anything.',
              },
              {
                question: 'Does it work with Outlook, or only Google?',
                answer:
                  'Both at launch. The beta is Google-first because that is what the first cohort ran; Outlook support is in the second. If you are Outlook-only, say so when you sign up and we will slot you accordingly.',
              },
            ]}
            helpTitle="Something we have not covered?"
            helpBody="Mail the founders directly. Both of us read it, and one of us replies the same day."
            helpCtaLabel="hello@orbit.example"
            helpCtaHref="mailto:hello@orbit.example"
          />
        </div>

        <CtaSplitPanel
          heading="Get in before the cohort fills"
          supporting="120 places a month, in signup order. It takes an email address and about four seconds."
          primaryLabel="Join the waitlist"
          primaryHref="#waitlist"
          secondaryLabel="Read the beta notes"
          secondaryHref="#"
          reassurance={[
            { text: 'Free for the first cohort, permanently' },
            { text: 'No card, no sales call' },
            { text: 'One email when your cohort opens — that is all' },
          ]}
        />
      </main>

      <FooterMinimal
        brand="Orbit"
        links={[
          { label: 'Privacy', href: '#' },
          { label: 'Terms', href: '#' },
          { label: 'hello@orbit.example', href: 'mailto:hello@orbit.example' },
        ]}
        socials={[{ label: 'Orbit on X', href: '#', icon: 'twitter' }]}
      />
    </div>
  )
}
