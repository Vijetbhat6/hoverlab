import { getPageMeta } from '@/lib/pages/page-index'
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-card'

/** Share card for /page/[slug]. */

export const runtime = 'nodejs'
export const alt = 'Hoverlab page'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

interface OGImageProps {
  params: Promise<{ slug: string }>
}

export default async function PageOGImage({ params }: OGImageProps) {
  const { slug } = await params
  const page = getPageMeta(slug)

  return ogCard({
    level: 'page',
    badge: page?.category ?? 'Hoverlab',
    kind: 'Composed page',
    name: page?.name ?? 'Page not found',
    description:
      page?.description ??
      'Whole screens assembled from blocks — copy the page, keep the parts.',
    path: `/page/${slug}`,
  })
}
