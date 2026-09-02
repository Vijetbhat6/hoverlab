/**
 * A creator's course landing page, assembled from blocks.
 *
 * One person selling one thing. That is a different sale from every other
 * page in this catalog, and the difference is that the product and the
 * person are the same object — nobody buys a course from an organisation:
 *
 *   navbar          two links, one price, no account
 *   hero            the result someone got, in their words, above the pitch
 *   logo strip      where past students work now — the outcome, not the brand
 *   outcomes        what you will be able to do, not what is covered
 *   curriculum      the modules, tabbed, so the length is visible not scary
 *   instructor      who is teaching it, at length, because that is the product
 *   pricing         one number, one payment, a real refund policy
 *   faq             time commitment, prerequisites, refunds, does it expire
 *   cta             the ask, with the cohort date attached
 *   footer          minimal, because there are three other pages at most
 *
 * WHY A TESTIMONIAL IS THE HERO. A course cannot demo. Screenshots of
 * lecture slides sell nothing, and the headline claim is unfalsifiable by
 * definition. The nearest thing to a demo is somebody who finished it
 * saying what changed, which is why `<HeroTestimonial>` is here and not
 * three sections down where testimonials usually live.
 *
 * WHY THE INSTRUCTOR SECTION IS AS LONG AS IT IS. `<TeamGrid>` with one
 * member reads oddly on a company site and is exactly right here: the
 * decision being made is whether to spend nine weeks listening to this
 * particular person. A two-line bio under a headshot is the most common
 * reason a good course does not sell.
 *
 * WHY THE REFUND POLICY IS ON THE PAGE RATHER THAN IN THE TERMS. It is the
 * single biggest objection to a several-hundred-pound purchase from an
 * individual with no brand behind them. A specific, generous, checkable
 * policy stated in the pricing block does more work than any amount of
 * testimonial.
 *
 * Every section takes props, so this file is a running order rather than a
 * wall of copy — swap the content without touching the layout.
 */

import * as React from 'react'
import { Gauge, KeyRound, Puzzle, ShieldCheck } from 'lucide-react'

import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroTestimonial } from '@/lib/blocks/sources/hero-testimonial'
import { LogoStrip } from '@/lib/blocks/sources/logo-strip'
import { FeatureIconGrid } from '@/lib/blocks/sources/feature-icon-grid'
import { FeatureTabs } from '@/lib/blocks/sources/feature-tabs'
import { TeamGrid } from '@/lib/blocks/sources/team-grid'
import { PricingSingle } from '@/lib/blocks/sources/pricing-single'
import { FaqAccordion } from '@/lib/blocks/sources/faq-accordion'
import { CtaInlineCard } from '@/lib/blocks/sources/cta-inline-card'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

export default function CreatorCourseLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Deep Practice"
        links={[
          { label: 'Curriculum', href: '#curriculum' },
          { label: 'Who teaches it', href: '#instructor' },
        ]}
        activeLabel="Curriculum"
        signInLabel="Student login"
        signInHref="/login"
        ctaLabel="Join the March cohort"
        ctaHref="#enrol"
      />

      <main>
        {/* A course cannot demo. The nearest thing is somebody who finished
            it saying what changed. See the header note. */}
        <HeroTestimonial
          eyebrow="Nine weeks · next cohort 9 March"
          heading="Learn to read a codebase you did not write"
          subheading="The skill nobody teaches and every job assumes: getting oriented in fifty thousand lines of someone else's decisions, quickly, without reading all of it."
          primaryLabel="Join the March cohort"
          primaryHref="#enrol"
          secondaryLabel="See the curriculum"
          secondaryHref="#curriculum"
          quote="I had been a developer for six years and had quietly assumed everyone else found new codebases as slow as I did. Week three broke that. I onboarded onto a new team in September and was shipping in four days."
          authorName="Nadia Osei"
          authorTitle="Senior engineer, Northwind — cohort 4"
        />

        {/* Where students ended up, not who sponsors the course. */}
        <LogoStrip
          claim="Past students now work at"
          logos={['Northwind', 'Contoso', 'Lumon', 'Initech', 'Globex', 'Vandelay']}
        />

        <FeatureIconGrid
          heading="What you will be able to do in nine weeks"
          subheading="Written as capabilities rather than topics, because “covers dependency graphs” tells you nothing about whether you could use one on Monday."
          columns={2}
          features={[
            {
              icon: Gauge,
              title: 'Find the load-bearing 5% of a codebase in an afternoon',
              body: 'Most of any repository is leaves. There is a small core that everything else hangs off, and there are repeatable ways to find it that do not involve reading files in alphabetical order. You will do this on four real open-source projects, timed.',
            },
            {
              icon: Puzzle,
              title: 'Reconstruct the decisions nobody wrote down',
              body: 'Why is there a second cache here? Why does this module import nothing? Git history, issue threads and the shape of the code itself are evidence, and reading them is a learnable skill rather than seniority.',
            },
            {
              icon: KeyRound,
              title: 'Change something safely on day two',
              body: 'The goal of orientation is not understanding — it is a correct change. You will practise identifying the smallest safe edit and the blast radius around it, which is a different question from “how does this work”.',
            },
            {
              icon: ShieldCheck,
              title: 'Say “I do not know yet” with a plan attached',
              body: 'The professional version of being lost is a specific list of what you have ruled out and what you would look at next. Half the cohort says this is the part that changed how they are perceived at work.',
            },
          ]}
        />

        {/* Tabbed, so nine weeks reads as navigable rather than as a wall. */}
        <div id="curriculum">
          <FeatureTabs
            heading="Nine weeks, one repository a fortnight"
            subheading="Two hours of recorded material a week and a live session on Thursdays. Everything is recorded, and nobody has ever been penalised for watching it late."
          />
        </div>

        {/* One person, at length. `<TeamGrid>` with a single member would be
            odd on a company site and is exactly right here — the decision is
            whether to spend nine weeks listening to this particular person. */}
        <div id="instructor">
          <TeamGrid
            heading="Who is actually teaching it"
            intro="Not a faceless academy. One person, who answers the forum posts and runs the Thursday sessions live rather than shipping a recording from 2023."
            members={[
              {
                name: 'Marcus Okafor',
                role: 'Instructor — and the person who replies to your posts',
                bio: 'Fourteen years across four companies, most of it inherited code. Spent three years as the person a large payments company sent into failing projects, which is where this material came from — it is the checklist I built for myself and then found I could teach. I have run this cohort eleven times and rewritten a third of it since the first one.',
                initials: 'MO',
                twitter: '#',
                github: '#',
                linkedin: '#',
              },
            ]}
          />
        </div>

        <div id="enrol">
          <PricingSingle
            heading="One price, one payment"
            subheading="No upsell tier, no “community edition”, and no separate charge for the live sessions."
            planName="Deep Practice — March cohort"
            price="£480"
            cadence="one payment, no subscription"
            compareAtPrice="£640"
            savingLabel="£160 off until 20 February"
            features={[
              'Nine weeks of material, yours to keep permanently',
              'Nine live Thursday sessions, recorded if you miss one',
              'Four real codebases with worked solutions',
              'Written feedback on three submitted exercises',
              'A private forum where I answer, not a moderator',
              'Company invoice on request — most employers pay for this',
            ]}
            ctaLabel="Join the March cohort"
            ctaHref="#"
            // The single biggest objection to buying from an individual. It
            // is here rather than in the terms because this is where it is
            // being weighed.
            note="Full refund up to the end of week three, no reason needed, no form to fill in — reply to any email from me. 11 of 340 students have taken it. Access does not expire and there is no subscription to cancel."
          />
        </div>

        <FaqAccordion
          heading="Before you enrol"
          items={[
            {
              question: 'How much time does it actually take?',
              answer:
                'Two hours of recorded material and roughly three hours of exercises a week, plus a 90-minute live session on Thursdays at 18:00 UK. Call it six hours. People who treat it as three hours get noticeably less out of it, and I would rather say that than have you find out in week five.',
            },
            {
              question: 'What do I need to know already?',
              answer:
                'Comfort in at least one language and some experience of a codebase you did not start. Roughly two years in. It is not a beginner course and it is deliberately not an advanced one — the material is about a skill senior developers usually acquired by accident.',
            },
            {
              question: 'Which languages are the codebases in?',
              answer:
                'TypeScript, Python, Go and one Rust project. You do not need to know all four — that is somewhat the point, since orienting in an unfamiliar language is the harder version of the same skill. Every exercise has a worked solution.',
            },
            {
              question: 'What if I miss the live sessions?',
              answer:
                'They are recorded and posted the same evening, and the forum is where most of the actual discussion happens anyway. About a third of each cohort is in a timezone that makes 18:00 UK impossible and they do fine.',
            },
            {
              question: 'Will my employer pay for it?',
              answer:
                'Usually, yes. There is a one-page justification you can forward and I will invoice a company directly, with a PO number if procurement needs one. Roughly 60% of students go this route.',
            },
            {
              question: 'Does access expire?',
              answer:
                'No. The material, the recordings and the forum stay available, including the updates I make for later cohorts. There is no subscription and nothing to cancel.',
            },
            {
              question: 'What if it is not for me?',
              answer:
                'Full refund any time up to the end of week three — reply to an email and say so. No form, no exit interview, no attempt to talk you out of it. 11 people out of 340 have done it and I would rather that number were higher than have anyone stay resentful.',
            },
          ]}
        />

        <CtaInlineCard
          contextLabel="Next cohort — 9 March"
          heading="Thirty places, and they have gone early twice"
          body="Nine weeks, one payment, refundable to the end of week three. If March is wrong for you, the list will tell you when June opens and nothing else."
          actionLabel="Join the March cohort"
          href="#enrol"
          fineprint="£480 until 20 February, then £640. Company invoicing available."
        />
      </main>

      <FooterMinimal
        brand="Deep Practice"
        links={[
          { label: 'Curriculum', href: '#curriculum' },
          { label: 'Journal', href: '/blog' },
          { label: 'marcus@deeppractice.example', href: 'mailto:marcus@deeppractice.example' },
          { label: 'Terms', href: '#' },
        ]}
        socials={[
          { label: 'Marcus on X', href: '#', icon: 'twitter' },
          { label: 'Marcus on GitHub', href: '#', icon: 'github' },
        ]}
      />
    </div>
  )
}
