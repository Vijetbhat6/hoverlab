/**
 * The blog index — the page that has to sell reading, not the product.
 *
 * Three sections and no more. The post grid is the page; the newsletter
 * form sits under it because "subscribe" is an easier yes after someone
 * has seen what the posts are like, not before; and the footer is minimal
 * because a reader mid-browse does not need the sitemap.
 *
 * What is deliberately absent: a hero. A blog index that opens with a
 * full-viewport banner about the blog pushes the actual posts below the
 * fold — the featured card inside <BlogPostGrid> already does the job of
 * making one post loud.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { BlogPostGrid } from '@/lib/blocks/sources/blog-post-grid'
import { NewsletterSignup } from '@/lib/blocks/sources/newsletter-signup'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Acme" activeLabel="Blog" />

      <main>
        <BlogPostGrid />

        <NewsletterSignup
          heading="New posts, straight to you"
          subheading="One email when something ships worth reading. No digest padding, no re-sends."
        />
      </main>

      <FooterMinimal brand="Acme" />
    </div>
  )
}
