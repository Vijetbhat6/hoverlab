import { getTemplateMeta } from '@/lib/templates/template-index'
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-card'

/**
 * Share card for /template/[slug].
 *
 * `template-index` deliberately never touches `templates.ts`, which
 * assembles whole projects out of the page and block catalogs — see the
 * note at the top of that module.
 */

export const runtime = 'nodejs'
export const alt = 'Hoverlab template'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

interface OGImageProps {
  params: Promise<{ slug: string }>
}

export default async function TemplateOGImage({ params }: OGImageProps) {
  const { slug } = await params
  const template = getTemplateMeta(slug)

  return ogCard({
    level: 'template',
    badge: template?.category ?? 'Hoverlab',
    kind: 'Starter template',
    name: template?.name ?? 'Template not found',
    description:
      template?.description ??
      'Multi-page starters you can clone and ship — every page built from the catalog.',
    path: `/template/${slug}`,
  })
}
