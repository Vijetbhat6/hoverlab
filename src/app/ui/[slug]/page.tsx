/**
 * /ui/[slug] — one intent hub.
 *
 * A saved query with editorial copy around it: the paragraph, the grid of
 * whatever the query actually matched, an FAQ, and a dense set of links out
 * to sibling hubs and to the taxonomy pages underneath. See
 * `lib/hubs/catalog.ts` for why these exist and what keeps them from being
 * doorway pages.
 *
 * Fully static — `dynamicParams = false` and every slug prerendered — and
 * every number on the page is resolved from the catalog at build time
 * rather than typed into the prose. A hub cannot claim a count it does not
 * have, and cannot list an artifact the catalog does not contain.
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, Layers, Search } from 'lucide-react'

import { JsonLd } from '@/components/json-ld'
import { ArtifactResultGrid, effectCssFor } from '@/components/artifact-result-grid'
import { HUBS, getHub } from '@/lib/hubs/catalog'
import { hubFaq, relatedHubs, resolveHub, LEAD_LIMIT } from '@/lib/hubs/resolve'
import { LEVEL_LABEL, type ArtifactLevel } from '@/lib/artifact-types'
import { breadcrumbLd, faqLd, itemListLd } from '@/lib/structured-data'
import { CATEGORIES, categorySlug } from '@/lib/effect-types'
import { BLOCK_CATEGORIES, blockCategorySlug } from '@/lib/blocks/block-types'
import { PRIMITIVE_CATEGORIES, primitiveCategorySlug } from '@/lib/primitives/primitive-types'
import { absoluteUrl } from '@/lib/site'

export const dynamicParams = false

export function generateStaticParams() {
  return HUBS.map((hub) => ({ slug: hub.slug }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const hub = getHub(slug)
  if (!hub) return { title: 'Not found — Hoverlab' }

  const { total } = resolveHub(hub)

  /*
   * The count leads the title because it is the one thing in it that is
   * both true and specific — "37 glassmorphism cards" is a different
   * promise from "glassmorphism cards", and it is computed rather than
   * claimed. It also keeps 80 titles from collapsing into the same shape
   * in a results page.
   */
  const title = `${total.toLocaleString('en-US')} ${hub.title} — copy-paste — Hoverlab`
  const description = hub.tagline

  return {
    title,
    description,
    keywords: [hub.title.toLowerCase(), ...(hub.keywords ?? [])],
    alternates: { canonical: `/ui/${hub.slug}` },
    openGraph: {
      url: absoluteUrl(`/ui/${hub.slug}`),
      title,
      description,
      type: 'website',
      siteName: 'Hoverlab',
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function IntentHubPage({ params }: PageProps) {
  const { slug } = await params
  const hub = getHub(slug)
  if (!hub) notFound()

  const resolved = resolveHub(hub)
  const { groups, total } = resolved
  const [lead, ...rails] = groups
  const faq = hubFaq(resolved)
  const related = relatedHubs(hub)

  // Every effect on the page in one <style>: the lead grid and the rails
  // both, since an effect rail under a block-led hub needs its CSS too.
  const css = effectCssFor(groups.flatMap((g) => g.items))

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd
        data={itemListLd(
          hub.title,
          `/ui/${hub.slug}`,
          resolved.all.map((hit) => ({ name: hit.name, path: hit.href })),
          total,
        )}
      />
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'UI', path: '/ui' },
          { name: hub.title },
        ])}
      />
      {/* The FAQ below, in the form a search engine reads. Every question
          in it is rendered on the page — marking up questions that are not
          there is a manual-action category rather than a grey area. */}
      <JsonLd data={faqLd(faq)} />

      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}

      <header className="border-b border-border/60">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/ui"
            prefetch={false}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" />
            All UI collections
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/ui" className="hover:text-foreground">
            UI
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">{hub.title}</span>
        </nav>

        <h1 className="type-page">{hub.title}</h1>
        <p className="mt-3 max-w-2xl text-pretty text-lg text-muted-foreground">{hub.tagline}</p>

        {/* The paragraph. Prose rather than a feature list on purpose —
            it is the only part of the page a person reads before they
            start scanning previews. */}
        <p className="mt-5 max-w-3xl text-pretty text-body">{hub.lede}</p>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">
            <Layers aria-hidden className="h-3.5 w-3.5" />
            {total.toLocaleString('en-US')} matching
          </span>
          {groups.map((group) => (
            <span
              key={group.level}
              className="rounded-full border border-border/60 bg-card/60 px-3 py-1 font-medium text-muted-foreground"
            >
              {group.total.toLocaleString('en-US')}{' '}
              {group.total === 1
                ? LEVEL_LABEL[group.level].one.toLowerCase()
                : LEVEL_LABEL[group.level].many.toLowerCase()}
            </span>
          ))}
          <span className="rounded-full border border-border/60 px-3 py-1 font-medium text-muted-foreground">
            Free to copy
          </span>
        </div>

        {/* -- The grid ------------------------------------------------- */}
        <section className="mt-10" aria-labelledby="results-heading">
          <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-border/60 pb-3">
            <h2 id="results-heading" className="text-lg font-bold tracking-tight">
              {LEVEL_LABEL[lead.level].many}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {lead.total.toLocaleString('en-US')}
              </span>
            </h2>
            <Link
              href={taxonomyHref(hub.lead, lead.items[0]?.category)}
              prefetch={false}
              className="shrink-0 text-sm font-semibold text-primary hover:underline"
            >
              Browse the category →
            </Link>
          </div>

          <ArtifactResultGrid level={lead.level} items={lead.items} />

          {lead.total > LEAD_LIMIT ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Showing {LEAD_LIMIT} of {lead.total.toLocaleString('en-US')}.{' '}
              <Link
                href={`/browse?q=${encodeURIComponent(searchTerm(hub.title))}&level=${hub.lead}`}
                prefetch={false}
                className="font-semibold text-primary hover:underline"
              >
                Search the rest →
              </Link>
            </p>
          ) : null}
        </section>

        {/* -- The other rungs the same phrase reaches ------------------- */}
        {rails.map((rail) => (
          <section key={rail.level} className="mt-12" aria-labelledby={`rail-${rail.level}`}>
            <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-border/60 pb-3">
              <h2 id={`rail-${rail.level}`} className="text-lg font-bold tracking-tight">
                {LEVEL_LABEL[rail.level].many}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {rail.total.toLocaleString('en-US')}
                </span>
              </h2>
              <Link
                href={taxonomyHref(rail.level, rail.items[0]?.category)}
                prefetch={false}
                className="shrink-0 text-sm font-semibold text-primary hover:underline"
              >
                See all →
              </Link>
            </div>
            <ArtifactResultGrid level={rail.level} items={rail.items} />
          </section>
        ))}

        {/* -- FAQ ------------------------------------------------------ */}
        <section className="mt-16 border-t border-border/60 pt-10" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-2xl font-bold tracking-tight">
            Questions about {hub.title.toLowerCase()}
          </h2>
          <dl className="mt-6 max-w-3xl space-y-6">
            {faq.map((entry) => (
              <div key={entry.q}>
                <dt className="font-semibold">{entry.q}</dt>
                <dd className="mt-1.5 text-pretty text-muted-foreground">{entry.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* -- Cross-links ---------------------------------------------- *
            The reason a set of these is worth more than any one of them:
            every hub is two clicks from every other, and the taxonomy hubs
            underneath are reachable from all of them. */}
        <section className="mt-16 border-t border-border/60 pt-10" aria-labelledby="related-heading">
          <h2
            id="related-heading"
            className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Related collections
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((sibling) => {
              const count = resolveHub(sibling).total
              return (
                <Link
                  key={sibling.slug}
                  href={`/ui/${sibling.slug}`}
                  prefetch={false}
                  className="group rounded-xl border border-border/60 bg-card/60 p-4 transition-colors hover:border-primary/40 hover:bg-card"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold group-hover:text-primary">{sibling.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {count.toLocaleString('en-US')}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{sibling.tagline}</p>
                </Link>
              )
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/ui"
              prefetch={false}
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
            >
              All collections
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
            <span className="text-muted-foreground">or</span>
            <Link
              href="/browse"
              prefetch={false}
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Search aria-hidden className="h-3.5 w-3.5" />
              search the whole catalog
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 *  Links out
 * ------------------------------------------------------------------ */

/**
 * The taxonomy hub under a given level, scoped to a category when one of
 * the results names it.
 *
 * Three of the five levels have per-category hubs and two do not, so this
 * falls back to the tier hub rather than inventing a URL. Getting that
 * wrong would produce a 404 on every hub page at once, which is the sort
 * of thing `check-hubs` cannot catch — the href is built here, not in the
 * data.
 */
function taxonomyHref(level: ArtifactLevel, category: string | undefined): string {
  if (!category) return LEVEL_HUB[level]

  /*
   * The category arrives as a plain string (that is all `BrowseHit` keeps)
   * and each slug helper wants its own union, so each branch looks the name
   * up in the real list. That is not ceremony: it narrows the type *and*
   * makes an unknown category fall back to the tier hub instead of building
   * a URL for a category page that does not exist.
   */
  switch (level) {
    case 'effect': {
      const found = CATEGORIES.find((c) => c === category)
      return found ? `/category/${categorySlug(found)}` : LEVEL_HUB.effect
    }
    case 'block': {
      const found = BLOCK_CATEGORIES.find((c) => c === category)
      return found ? `/blocks/${blockCategorySlug(found)}` : LEVEL_HUB.block
    }
    case 'primitive': {
      const found = PRIMITIVE_CATEGORIES.find((c) => c === category)
      return found ? `/primitives/${primitiveCategorySlug(found)}` : LEVEL_HUB.primitive
    }
    default:
      return LEVEL_HUB[level]
  }
}

const LEVEL_HUB: Record<ArtifactLevel, string> = {
  effect: '/library',
  primitive: '/primitives',
  block: '/blocks',
  page: '/pages',
  template: '/templates',
}

/**
 * The hub title as a search term for /browse.
 *
 * Strips the framework words that are in the title for the searcher's
 * benefit rather than the index's — "React pricing tables" finds nothing
 * useful as a literal query, "pricing tables" finds the pricing blocks.
 */
function searchTerm(title: string): string {
  return title
    .replace(/\b(css|react|tailwind|html)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}
