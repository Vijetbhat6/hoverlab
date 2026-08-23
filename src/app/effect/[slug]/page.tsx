import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import type { Metadata } from 'next'
import { EffectDetail } from '@/components/effect-detail'
import { JsonLd } from '@/components/json-ld'
import { EFFECTS, type Effect } from '@/lib/effects'
import { EFFECT_ID_ALIASES } from '@/lib/effect-aliases'
import { categorySlug } from '@/lib/effect-types'
import { artifactBreadcrumbLd, artifactLd } from '@/lib/structured-data'
import { addedAt, formatAdded } from '@/lib/recency'

/**
 * Pre-generate EVERY effect page at build time.
 *
 * This previously emitted only the ~64 featured effects and let the other
 * 1,550+ render on demand. That was the wrong trade: these pages are the
 * product's entire long-tail SEO surface ("css shimmer skeleton loader",
 * "glassmorphism card hover"), and an on-demand page serves its first
 * request — often Googlebot's crawl — as a cold render. Static HTML for
 * all of them means every crawl hit is a cache hit.
 *
 * `dynamicParams` stays true so a slug added to the catalog between
 * deploys still resolves instead of 404ing.
 */
export const dynamicParams = true

export function generateStaticParams() {
  return EFFECTS.map((e) => ({ slug: e.id }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

/**
 * Generate per-page metadata for social sharing / SEO.
 * Each effect gets its own <title>, description, and a dynamic Open
 * Graph image (served by opengraph-image.tsx in this directory).
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const effect = EFFECTS.find((e) => e.id === slug)
  if (!effect) {
    return {
      title: 'Effect not found — Hoverlab',
    }
  }
  return {
    title: `${effect.name} — Hoverlab`,
    description: effect.description,
    keywords: [
      effect.category,
      'CSS',
      'CSS effect',
      'animation',
      ...(effect.tags ?? []),
    ],
    // Canonical URL per effect. Without it, the same page reachable via
    // share links with query strings (?opts=…, ?utm_source=…) looks like
    // duplicate content and splits ranking signals across variants.
    alternates: {
      canonical: `/effect/${effect.id}`,
    },
    openGraph: {
      url: `/effect/${effect.id}`,
      title: `${effect.name} — Hoverlab`,
      description: effect.description,
      type: 'article',
      siteName: 'Hoverlab',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${effect.name} — Hoverlab`,
      description: effect.description,
    },
  }
}

export default async function EffectPage({ params }: PageProps) {
  const { slug } = await params
  const idx = EFFECTS.findIndex((e) => e.id === slug)

  if (idx === -1) {
    /*
     * Before 404ing, check whether this id was retired by a rename. Two
     * families moved when their display names turned out to collide with
     * older ones, and those URLs are the long-tail SEO surface this page
     * exists to serve — a 404 throws away whatever they had accumulated.
     * 308 rather than 307 so the move is cached and search engines
     * transfer ranking to the new id.
     */
    const alias = EFFECT_ID_ALIASES[slug]
    if (alias) {
      permanentRedirect(`/effect/${alias}`)
    }
    notFound()
  }

  const effect = EFFECTS[idx]

  // Find up to 6 similar effects (same category, excluding self).
  const similar: Effect[] = []
  for (let i = 0; i < EFFECTS.length && similar.length < 6; i++) {
    const candidate = EFFECTS[i]
    if (candidate.id === effect.id) continue
    if (candidate.category !== effect.category) continue
    similar.push(candidate)
  }

  // Prev / next navigation across the full catalog (in canonical order).
  const prev = idx > 0 ? EFFECTS[idx - 1] : null
  const next = idx < EFFECTS.length - 1 ? EFFECTS[idx + 1] : null

  const catSlug = categorySlug(effect.category)
  const added = addedAt('effect', effect.id)

  return (
    <>
      {/*
        Structured data. This page is the long-tail landing surface — the
        one someone reaches by searching "css shimmer skeleton loader" — so
        it declares what it is (source code, in CSS, free, under our
        licence) and where it sits, rather than leaving both to be guessed
        from markup.
      */}
      <JsonLd
        data={artifactLd({
          level: 'effect',
          id: effect.id,
          name: effect.name,
          description: effect.description,
          category: effect.category,
          keywords: effect.tags,
          datePublished: added,
        })}
      />
      <JsonLd
        data={artifactBreadcrumbLd('effect', effect.name, {
          name: effect.category,
          path: `/category/${catSlug}`,
        })}
      />

      {/*
        The visible crumb trail, rendered here rather than inside
        <EffectDetail> so the client component stays untouched. The padding
        matches its container so the two read as one column.

        The detail component's own "Back to library" button is a sibling of
        this, not a duplicate of it: that one is the escape hatch, this one
        is the position — and the category link is the internal link that
        makes a deep page part of the site instead of an orphan.
      */}
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 pt-6 text-xs text-muted-foreground sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <span aria-hidden className="mx-1.5">
            /
          </span>
          <Link href="/library" className="transition-colors hover:text-foreground">
            Effects
          </Link>
          <span aria-hidden className="mx-1.5">
            /
          </span>
          <Link
            href={`/category/${catSlug}`}
            className="transition-colors hover:text-foreground"
          >
            {effect.category}
          </Link>
          <span aria-hidden className="mx-1.5">
            /
          </span>
          <span className="text-foreground">{effect.name}</span>
        </nav>
        {/* The catalog's first visible sense of time. See lib/recency.ts —
            the date comes out of git history, not out of a field someone
            has to remember to set. */}
        {added ? <span>Added {formatAdded(added)}</span> : null}
      </div>

      <EffectDetail effect={effect} similar={similar} prev={prev} next={next} />
    </>
  )
}
