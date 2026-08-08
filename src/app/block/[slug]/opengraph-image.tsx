import { getBlockMeta } from '@/lib/blocks/block-index'
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-card'

/**
 * Share card for /block/[slug].
 *
 * Reads the *index*, not `blocks.ts` — the card needs a name, a category
 * and a sentence, and pulling the full catalog in would drag ~53 KB of TSX
 * source into an image route that renders none of it.
 */

export const runtime = 'nodejs'
export const alt = 'Hoverlab block'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

interface OGImageProps {
  params: Promise<{ slug: string }>
}

export default async function BlockOGImage({ params }: OGImageProps) {
  const { slug } = await params
  const block = getBlockMeta(slug)

  return ogCard({
    level: 'block',
    badge: block?.category ?? 'Hoverlab',
    kind: 'React block',
    name: block?.name ?? 'Block not found',
    description:
      block?.description ??
      'Full page sections you can paste into any React project.',
    path: `/block/${slug}`,
  })
}
