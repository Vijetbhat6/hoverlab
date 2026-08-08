import { TEMPLATE_COUNT } from '@/lib/templates/template-index'
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-card'

/** Share card for the /templates hub. */

export const runtime = 'nodejs'
export const alt = 'Hoverlab templates'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function TemplatesHubOGImage() {
  return ogCard({
    level: 'template',
    badge: 'Templates',
    kind: `${TEMPLATE_COUNT} starters`,
    name: 'Multi-page starters, ready to clone',
    description:
      'Complete projects — every route, every page, every block — downloadable as a zip and running in a minute.',
    path: '/templates',
  })
}
