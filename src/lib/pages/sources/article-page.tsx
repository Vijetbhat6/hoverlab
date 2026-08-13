/**
 * A single article — the page every post on the blog index links to.
 *
 * The header block carries the whole editorial identity (kicker, byline,
 * share row, type scale for the opening prose), so this page's job is
 * restraint: a reading column, a subscribe ask at the end, and nothing in
 * the margins competing with the text.
 *
 * The newsletter form comes *after* the article on purpose. The reader who
 * reaches it has finished a post and is at the most persuadable moment
 * they will ever be; the same form floating beside paragraph two is the
 * pattern readers install extensions to remove.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { ArticleHeader } from '@/lib/blocks/sources/article-header'
import { NewsletterSignup } from '@/lib/blocks/sources/newsletter-signup'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

export default function ArticlePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Blog" />

      <main>
        <ArticleHeader />

        <NewsletterSignup
          heading="Read the next one when it ships"
          subheading="One email per post. Unsubscribe is one click and actually works."
        />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
