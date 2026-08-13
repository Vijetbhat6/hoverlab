/**
 * The changelog page — proof of life, published on a route of its own.
 *
 * A changelog does two jobs and neither is documentation: it tells the
 * evaluator the product is alive, and it tells the customer what changed
 * before they find out the hard way. That is why it gets the site chrome
 * rather than the docs frame — its readers arrive from a "what's new"
 * link or a status email, not from a guide.
 *
 * The subscribe form sits under the timeline because "tell me when this
 * page changes" is the exact promise a release-notes email makes — it is
 * the one place on the site where the newsletter ask is not a detour.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { ChangelogTimeline } from '@/lib/blocks/sources/changelog-timeline'
import { NewsletterSignup } from '@/lib/blocks/sources/newsletter-signup'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Changelog" />

      <main>
        <ChangelogTimeline />

        <NewsletterSignup
          heading="Get release notes as they ship"
          subheading="One email per release — what changed, what might break, and what to try first."
        />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
