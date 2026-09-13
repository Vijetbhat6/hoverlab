/**
 * The portfolio index — a studio's or freelancer's list of work.
 *
 *   editorial  who this is and what they do, in one screen
 *   projects   the work, filterable by discipline
 *   clients    who they were for
 *   numbers    the practice, in four figures
 *   cta        the enquiry
 *
 * The excerpts name the outcome and the constraint, never the aesthetic. "A
 * booking flow rebuilt in six weeks against a fixed launch date" is something
 * a prospective client can map onto their own problem; "a bold, modern
 * experience" is not, and a portfolio index made entirely of the second kind
 * gives a reader no way to choose which project to open.
 *
 * `hero-editorial` rather than a marketing hero, because a portfolio index is
 * closer to a magazine contents page than to a landing page: the reader is
 * scanning for one piece, and the top of the page should establish a voice
 * and then get out of the way.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroEditorial } from '@/lib/blocks/sources/hero-editorial'
import { BlogPostGrid } from '@/lib/blocks/sources/blog-post-grid'
import { LogoGrid } from '@/lib/blocks/sources/logo-grid'
import { StatsBand } from '@/lib/blocks/sources/stats-band'
import { CtaSplitPanel } from '@/lib/blocks/sources/cta-split-panel'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'

const FEATURED = {
  slug: 'halyard-booking',
  category: 'Product design',
  title: 'A booking flow rebuilt in six weeks against a fixed launch date',
  excerpt:
    'Four steps down to two, on a deadline that could not move because the marketing spend was already booked. The interesting part is what we cut to make it.',
  author: 'Studio Northwind',
  date: 'November 2025',
  readMinutes: 5,
}

const PROJECTS = [
  {
    slug: 'meridia-design-system',
    category: 'Design systems',
    title: 'One design system across three brands that refused to merge',
    excerpt:
      'Shared primitives, separate tokens, and a governance model that survived the two teams disagreeing about buttons for a year.',
    author: 'Studio Northwind',
    date: 'September 2025',
    readMinutes: 7,
  },
  {
    slug: 'ferrous-identity',
    category: 'Brand',
    title: 'An identity for a foundry that had never had one',
    excerpt:
      'Ninety years of letterhead, no logo anyone could find the original of. We redrew it from a 1962 casting rather than starting again.',
    author: 'Studio Northwind',
    date: 'July 2025',
    readMinutes: 4,
  },
  {
    slug: 'saltwater-sites',
    category: 'Web',
    title: 'Nineteen hotel sites from one template without them looking like it',
    excerpt:
      'Shared structure, per-property photography and typography. The constraint was that no two could be mistaken for each other.',
    author: 'Studio Northwind',
    date: 'May 2025',
    readMinutes: 6,
  },
  {
    slug: 'quartzly-onboarding',
    category: 'Product design',
    title: 'Cutting onboarding from eleven screens to four',
    excerpt:
      'Most of the eleven existed to collect data that was already available from the integration. The work was mostly deletion.',
    author: 'Studio Northwind',
    date: 'February 2025',
    readMinutes: 5,
  },
  {
    slug: 'isobar-reporting',
    category: 'Data design',
    title: 'A carbon report that a board would actually read',
    excerpt:
      'One page, four numbers, and a method appendix nobody has to open. The previous version was fifty-two pages and was not read.',
    author: 'Studio Northwind',
    date: 'December 2024',
    readMinutes: 6,
  },
]

const PRACTICE = [
  { value: '11', label: 'Years', caption: 'Same two founders' },
  { value: '6', label: 'People', caption: 'No subcontracting' },
  { value: '4', label: 'Projects at a time', caption: 'A hard ceiling' },
  { value: '68%', label: 'Repeat clients', caption: 'Last five years' },
]

export default function PortfolioIndexPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavbarSimple brand="Northwind" activeLabel="Work" ctaLabel="Enquire" ctaHref="#projects" />

      <main>
        <HeroEditorial
          kicker="Studio Northwind"
          heading="We design the parts people have to use twice a day"
          standfirst="Product design, design systems and the occasional identity, for companies whose software is the job rather than the marketing. Four projects at a time, which is a ceiling and not a stage."
          authorName="Established 2015"
          publishedLabel="Selected work"
          publishedAt="2015–2026"
          readingTime="Six projects"
          linkLabel="How we work"
        />

        <div id="projects">
          <BlogPostGrid
            heading="Selected work"
            featured={FEATURED}
            posts={PROJECTS}
            categories={['All', 'Product design', 'Design systems', 'Brand', 'Web', 'Data design']}
          />
        </div>

        <LogoGrid caption="Who the work was for" />

        <StatsBand stats={PRACTICE} />

        <CtaSplitPanel
          heading="Four at a time, and two of those slots are spoken for"
          supporting="Tell us the problem and the deadline. If we cannot take it we will say so in the first reply and name someone who can."
          primaryLabel="Start an enquiry"
          secondaryLabel="Read how we work"
        />
      </main>

      <FooterMinimal brand="Northwind" />
    </div>
  )
}
