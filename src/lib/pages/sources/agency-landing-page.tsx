/**
 * A design-studio landing page, assembled from blocks.
 *
 * A studio is not selling a product, and every structural difference here
 * comes from that. There is no pricing section, no feature grid and no
 * trial — what a prospect is deciding is whether these particular people
 * are worth a first conversation, so the page is arranged around evidence
 * and faces rather than capabilities.
 *
 *   navbar          four links, because a studio site is a small site
 *   hero            full-bleed image with the copy over it — the one place
 *                   a studio gets to demonstrate rather than assert
 *   logo cloud      the client list, which is the entire pitch
 *   stats           outcomes with their sample sizes attached
 *   services        three engagements, described as engagements and not as
 *                   "capabilities" — a prospect is buying a shape of work
 *   team            the actual people, because that is what is being hired
 *   testimonial     one client, named, with the numbers from their project
 *   cta             a conversation, not a signup
 *   footer          minimal, with the address and the mail link
 *
 * NO PRICING, DELIBERATELY. A studio that publishes a day rate gets
 * shopped on it. The engagement descriptions do the qualifying instead —
 * someone who reads "eight to twelve weeks" and leaves was never going to
 * be a fit, and that is the section doing its job.
 *
 * THE TEAM SECTION IS NOT OPTIONAL HERE. Every other page in this catalog
 * could drop it. This one cannot: the client is buying named individuals,
 * and a studio page that hides who works there reads as a reseller.
 *
 * Every section takes props, so this file is a running order rather than a
 * wall of copy — swap the content without touching the layout.
 */

import * as React from 'react'

import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroMediaOverlay } from '@/lib/blocks/sources/hero-media-overlay'
import { LogoCloud } from '@/lib/blocks/sources/logo-cloud'
import { StatsNarrative } from '@/lib/blocks/sources/stats-narrative'
import { FeatureRows } from '@/lib/blocks/sources/feature-rows'
import { TeamGrid } from '@/lib/blocks/sources/team-grid'
import { TestimonialSpotlight } from '@/lib/blocks/sources/testimonial-spotlight'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

export default function AgencyLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple
        brand="Fieldwork"
        links={[
          { label: 'Work', href: '#work' },
          { label: 'Services', href: '#services' },
          { label: 'Studio', href: '#studio' },
        ]}
        activeLabel="Work"
        signInLabel="Journal"
        signInHref="/blog"
        ctaLabel="Start a project"
        ctaHref="#contact"
      />

      <main>
        {/* The block takes `children` as the media layer and falls back to a
            gradient. Drop an <Image> in here and the scrim, the type and the
            buttons all keep working — that is the whole reason the media is
            a slot rather than a `src` prop. */}
        <HeroMediaOverlay
          eyebrow="Design studio — London and Lisbon"
          heading="We design the parts nobody screenshots."
          subheading="Onboarding, settings, empty states, the error a customer hits at 2am. The unglamorous surfaces where products are actually kept or abandoned."
          primaryLabel="See the work"
          primaryHref="#work"
          secondaryLabel="Start a project"
          secondaryHref="#contact"
        />

        <div id="work">
          <LogoCloud
            caption="Fourteen years, sixty-odd products, a handful of them yours"
            logos={[
              'Northwind',
              'Contoso',
              'Lumon',
              'Initech',
              'Globex',
              'Umbrella',
              'Vandelay',
              'Soylent',
            ]}
          />
        </div>

        <StatsNarrative
          eyebrow="Outcomes"
          heading="Four numbers from projects we can name, with the sample attached"
          body="Studios quote their best case and call it a result. These are medians across every engagement of the last three years, including two that were cancelled — which is why they are less flattering than the figures on most studio sites, and why we will show you the working."
          stats={[
            {
              value: '+41%',
              label: 'activation, median across 9 onboarding projects',
              source: 'Client analytics, 90 days post-launch',
            },
            {
              value: '−63%',
              label: 'support tickets about the thing we redesigned',
              source: 'Six engagements with before/after data',
            },
            {
              value: '11 weeks',
              label: 'median engagement, start to handover',
              source: 'All 34 projects since 2023',
            },
            {
              value: '7 of 10',
              label: 'clients come back within two years',
              source: 'Excludes the four companies that no longer exist',
            },
          ]}
          ctaLabel="Read a full case study"
          ctaHref="/blog"
        />

        <div id="services">
          <FeatureRows
            heading="Three ways we work"
            subheading="Shapes of engagement rather than a capability list. Pick the one that matches where you are, or tell us we have the wrong three."
            rows={[
              {
                eyebrow: '2 weeks',
                title: 'Teardown',
                body: 'We use your product the way a new customer does, then hand back a prioritised list of what is costing you activation and what it would take to fix each one. Fixed fee. Roughly a third of these end with us telling you not to hire us.',
                bullets: [
                  'Annotated walkthrough of the real flows',
                  'Ranked by cost to you, not effort to us',
                  'Yours to hand to any studio, including not us',
                ],
              },
              {
                eyebrow: '8–12 weeks',
                title: 'Product design',
                body: 'The main engagement. We take one surface — onboarding, the settings area, the billing flow — from research through to built components your engineers can ship, working inside your repo and your design system rather than beside them.',
                bullets: [
                  'Research, interface design and front-end build',
                  'We write the components, not a spec of them',
                  'Weekly demo against your staging, not a Figma review',
                ],
              },
              {
                eyebrow: 'Ongoing',
                title: 'Embedded',
                body: 'Two or three days a week inside your team for six months or more, for companies at the point where the design work is continuous but a full-time hire is a year away. Same people every week, in your standups.',
                bullets: [
                  'Named designers, not a rotating bench',
                  'Three-month minimum, one-month notice',
                  'We help you hire your replacement for us',
                ],
              },
            ]}
          />
        </div>

        <div id="studio">
          <TeamGrid
            heading="The people who would actually do the work"
            intro="Fieldwork is six people and stays six people. You meet everyone in week one, and the person in the pitch is the person on the project — a sentence every studio writes and this is the size at which it is true."
          />
        </div>

        <TestimonialSpotlight
          quote="They spent the first fortnight telling us our onboarding problem was actually a pricing problem. Nobody we had paid before was willing to lose the next phase of work by saying that."
          name="Marisol Herrera"
          role="Chief Product Officer"
          company="Contoso"
          stats={[
            { value: '11 weeks', label: 'onboarding rebuild' },
            { value: '+52%', label: 'trial-to-paid conversion' },
            { value: '2 studios', label: 'tried it before us' },
          ]}
        />

        <div id="contact">
          <CtaSplitPanel
            heading="Tell us what is not working"
            supporting="A paragraph is enough to start. If we are the wrong studio for it we will say so in the reply, and usually name a better one."
            primaryLabel="Email the studio"
            primaryHref="mailto:studio@fieldwork.example"
            secondaryLabel="Book 30 minutes"
            secondaryHref="#"
            reassurance={[
              { text: 'A person replies, usually within a day' },
              { text: 'No proposal deck, no discovery invoice' },
              { text: 'Booked to about eight weeks out' },
            ]}
          />
        </div>
      </main>

      <FooterMinimal
        brand="Fieldwork"
        links={[
          { label: 'Journal', href: '/blog' },
          { label: 'Careers', href: '/careers' },
          { label: 'studio@fieldwork.example', href: 'mailto:studio@fieldwork.example' },
          { label: 'Privacy', href: '#' },
        ]}
        socials={[
          { label: 'Fieldwork on X', href: '#', icon: 'twitter' },
          { label: 'Fieldwork on GitHub', href: '#', icon: 'github' },
        ]}
      />
    </div>
  )
}
