import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { EffectDetail } from '@/components/effect-detail'
import { EFFECTS, type Effect } from '@/lib/effects'

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

  return (
    <>
      <EffectDetail effect={effect} similar={similar} prev={prev} next={next} />
    </>
  )
}
