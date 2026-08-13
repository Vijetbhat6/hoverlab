/**
 * <BlogPostGrid> — a blog index with one featured post and a grid of the rest.
 *
 * Every index page has one post the team actually wants read this week; a
 * uniform grid buries it at position one, same size as position six. Here
 * the featured post gets a full-width card with a drawn cover, and only
 * then does the grid start — so the hierarchy is in the layout, not in an
 * editor's hope that visitors read left to right.
 *
 * The whole card is the link. A title-only link leaves the cover and the
 * excerpt as dead pixels that look clickable and are not — the most common
 * blog-card papercut.
 */

import * as React from 'react'
import { Clock } from 'lucide-react'

export interface BlogPost {
  slug: string
  category: string
  title: string
  excerpt: string
  author: string
  /** ISO date — `2026-07-08`. */
  date: string
  readMinutes: number
}

export interface BlogPostGridProps {
  featured?: BlogPost
  posts?: BlogPost[]
  categories?: string[]
  heading?: string
  className?: string
}

const DEFAULT_FEATURED: BlogPost = {
  slug: '/blog/incident-review-culture',
  category: 'Engineering',
  title: 'How we run incident reviews nobody dreads',
  excerpt:
    'Blameless is easy to say and hard to schedule. The template, the timebox, and the one question we ask before anyone opens a dashboard.',
  author: 'Priya Raman',
  date: '2026-07-08',
  readMinutes: 9,
}

const DEFAULT_POSTS: BlogPost[] = [
  {
    slug: '/blog/design-tokens-migration',
    category: 'Design',
    title: 'Migrating 214 components to semantic tokens',
    excerpt: 'Six weeks, zero visual regressions, one codemod we should have written first.',
    author: 'Dana Whitfield',
    date: '2026-06-24',
    readMinutes: 7,
  },
  {
    slug: '/blog/postgres-partitioning',
    category: 'Engineering',
    title: 'Partitioning the events table before it partitioned us',
    excerpt: 'At 1.8B rows the vacuum stopped keeping up. What we tried, in order.',
    author: 'Marco Silva',
    date: '2026-06-10',
    readMinutes: 11,
  },
  {
    slug: '/blog/pricing-page-rewrite',
    category: 'Product',
    title: 'The pricing page rewrite that halved support tickets',
    excerpt: 'Turns out "Contact us" was doing a lot of damage for a two-word button.',
    author: 'Alex Chen',
    date: '2026-05-28',
    readMinutes: 5,
  },
  {
    slug: '/blog/hiring-writing-samples',
    category: 'Company',
    title: 'We stopped doing take-homes and asked for a doc instead',
    excerpt: 'A written design doc predicts on-the-job performance better than a weekend project.',
    author: 'Samir Haddad',
    date: '2026-05-14',
    readMinutes: 6,
  },
]

const DEFAULT_CATEGORIES = ['All posts', 'Engineering', 'Design', 'Product', 'Company']

export function BlogPostGrid({
  featured = DEFAULT_FEATURED,
  posts = DEFAULT_POSTS,
  categories = DEFAULT_CATEGORIES,
  heading = 'From the blog',
  className = '',
}: BlogPostGridProps) {
  return (
    <section className={`mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{heading}</h2>
        <ul className="flex flex-wrap gap-2">
          {categories.map((category, i) => (
            <li key={category}>
              <a
                href="#"
                aria-current={i === 0 ? 'page' : undefined}
                className={
                  i === 0
                    ? 'inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground'
                    : 'inline-block rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                }
              >
                {category}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <a
        href={featured.slug}
        className="group mb-5 grid overflow-hidden rounded-2xl border border-border/60 bg-card/80 transition-shadow hover:shadow-lg md:grid-cols-2"
      >
        <div
          aria-hidden
          className="relative min-h-48 bg-gradient-to-br from-primary/25 via-primary/10 to-muted md:min-h-full"
        >
          <div className="absolute inset-x-8 bottom-0 top-10 rounded-t-xl border border-b-0 border-border/60 bg-background/80 p-4">
            <div className="h-2 w-1/3 rounded bg-primary/40" />
            <div className="mt-3 h-2 w-3/4 rounded bg-muted-foreground/25" />
            <div className="mt-2 h-2 w-2/3 rounded bg-muted-foreground/25" />
            <div className="mt-2 h-2 w-1/2 rounded bg-muted-foreground/15" />
          </div>
        </div>
        <div className="flex flex-col p-6 sm:p-8">
          <span className="w-fit rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
            {featured.category}
          </span>
          <h3 className="mt-4 text-balance text-2xl font-bold tracking-tight transition-colors group-hover:text-primary sm:text-3xl">
            {featured.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{featured.excerpt}</p>
          <PostMeta post={featured} className="mt-auto pt-6" />
        </div>
      </a>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post) => (
          <li key={post.slug}>
            <a
              href={post.slug}
              className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card/80 p-5 transition-shadow hover:shadow-lg"
            >
              <span className="w-fit rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                {post.category}
              </span>
              <h3 className="mt-3 text-balance font-bold tracking-tight transition-colors group-hover:text-primary">
                {post.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
              <PostMeta post={post} className="mt-auto pt-4" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function PostMeta({ post, className = '' }: { post: BlogPost; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground ${className}`}>
      <span className="font-medium text-foreground/80">{post.author}</span>
      <time dateTime={post.date}>
        {new Date(`${post.date}T00:00:00Z`).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'UTC',
        })}
      </time>
      <span className="inline-flex items-center gap-1">
        <Clock aria-hidden className="h-3 w-3" />
        {post.readMinutes} min read
      </span>
    </div>
  )
}
