import { getEffectMeta } from '@/lib/effect-index'
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-card'

/**
 * Share card for /effect/[slug]. Layout lives in `@/lib/og-card`, which
 * every tier renders through.
 */

export const runtime = 'nodejs'
export const alt = 'Hoverlab effect'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

interface OGImageProps {
  params: Promise<{ slug: string }>
}

export default async function EffectOGImage({ params }: OGImageProps) {
  const { slug } = await params
  const effect = getEffectMeta(slug)

  // An unknown slug renders a generic card rather than throwing — the page
  // itself already 404s, and a broken image URL in a crawler's queue is a
  // worse failure than a plain one.
  return ogCard({
    level: 'effect',
    badge: effect?.category ?? 'Hoverlab',
    kind: 'CSS effect',
    name: effect?.name ?? 'Effect not found',
    description:
      effect?.description ??
      'A curated, open-source library of beautiful CSS effects.',
    path: `/effect/${slug}`,
  })
}
