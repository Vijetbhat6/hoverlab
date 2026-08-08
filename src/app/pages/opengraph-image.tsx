import { PAGE_COUNT } from '@/lib/pages/page-index'
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-card'

/** Share card for the /pages hub. */

export const runtime = 'nodejs'
export const alt = 'Hoverlab pages'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function PagesHubOGImage() {
  return ogCard({
    level: 'page',
    badge: 'Pages',
    kind: `${PAGE_COUNT} screens`,
    name: 'Whole pages, already assembled',
    description:
      'Landing pages, dashboards, checkouts and auth screens — each one composed from blocks you can swap out.',
    path: '/pages',
  })
}
