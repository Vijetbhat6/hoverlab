/**
 * The community page.
 *
 *   band      where the community actually is, with member counts
 *   stats     the size of it, so the invitation is not into an empty room
 *   voices    what members say, unedited
 *   groups    the local and topic groups
 *   signup    the digest, for people who will not join a chat app
 *
 * The counts are the argument. "Join our community" with no number is an
 * invitation into a room that might be empty, and the reader's prior — from
 * every abandoned Discord they have joined — is that it is. A channel with
 * 4,100 members and a last-message time is a different proposition, and the
 * numbers are cheap to render honestly.
 *
 * The digest at the end exists because most people will not install another
 * chat app for a product they are evaluating. A community page whose only
 * door is Discord loses everyone who has decided they have enough Discords,
 * which is now most people.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { CommunityBand } from '@/lib/blocks/sources/community-band'
import { StatsBand } from '@/lib/blocks/sources/stats-band'
import { TestimonialGrid } from '@/lib/blocks/sources/testimonial-grid'
import { LogoSegments } from '@/lib/blocks/sources/logo-segments'
import { NewsletterSignup } from '@/lib/blocks/sources/newsletter-signup'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const SIZE = [
  { value: '4,180', label: 'In the forum', caption: 'Median reply time: 3 hours' },
  { value: '61', label: 'Community answers a week', caption: 'Against 40 from staff' },
  { value: '14', label: 'Local groups', caption: 'Meeting at least quarterly' },
  { value: '2019', label: 'Running since', caption: 'Same forum, same archive' },
]

const VOICES = [
  {
    quote:
      'I asked a question at 11pm expecting nothing until Monday. Two other users had it solved before anyone from Acme woke up, and one of them had hit exactly the same importer bug.',
    name: 'Bogdan Petrov',
    role: 'Financial controller',
    rating: 5,
  },
  {
    quote:
      'The rule library that members share is genuinely the reason we stayed. Half our matching rules started as somebody else’s post.',
    name: 'Sanne de Vries',
    role: 'Head of finance ops',
    rating: 5,
  },
  {
    quote:
      'Staff post in the same threads as everyone else and do not delete the critical ones. That is rarer than it should be and it is why the archive is worth searching.',
    name: 'Kenji Tanaka',
    role: 'Systems accountant',
    rating: 4,
  },
]

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Community" ctaLabel="Join the forum" ctaHref="#groups" />

      <main>
        <CommunityBand
          heading="Four thousand people who close the books for a living"
          subheading="The forum has been running since 2019 with the same searchable archive. Staff post in the same threads as everyone else, and the critical posts stay up."
        />

        <StatsBand stats={SIZE} />

        <TestimonialGrid
          heading="What members say about it"
          subheading="Quoted with permission and not edited for length, including the four-star one."
          testimonials={VOICES}
        />

        <div id="groups">
          <LogoSegments
            eyebrow="Local and topic groups"
            heading="Fourteen groups that meet without us"
            subheading="Organised by members, listed here, not run by our marketing team. If there is none near you, we will pay for the first room."
          />
        </div>

        <NewsletterSignup
          heading="Not another chat app?"
          subheading="The monthly digest is the ten threads worth reading, as an email. No account, no app, and it is the same content."
          ctaLabel="Get the digest"
          note="Monthly. One click to stop."
        />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
