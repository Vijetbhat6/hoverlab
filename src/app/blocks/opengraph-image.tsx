import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-card'

/** Share card for the /blocks hub. */

export const runtime = 'nodejs'
export const alt = 'Hoverlab blocks'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function BlocksHubOGImage() {
  return ogCard({
    level: 'block',
    badge: 'Blocks',
    kind: `${BLOCK_COUNT} sections`,
    name: 'Copy-paste UI blocks',
    description:
      'Pricing tables, FAQs, testimonial walls, feature grids and more — Tailwind classes, no component library required.',
    path: '/blocks',
  })
}
