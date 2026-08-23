import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-card'
import { DESIGNER_TOOLS } from '@/lib/designer-tools'

/**
 * Share card for the /tools hub.
 *
 * Each individual tool already had one. The hub that collects them — the
 * page someone links when they mean "all of it" — did not.
 */

export const runtime = 'nodejs'
export const alt = 'Hoverlab designer tools'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function ToolsHubOGImage() {
  return ogCard({
    level: 'page',
    badge: 'Tools',
    kind: `${DESIGNER_TOOLS.length} tools`,
    name: 'Free designer tools',
    description:
      'Design tokens, palettes, shadows, type scales, WCAG contrast, clip-paths, favicons and OG cards — every one runs in your browser. No account, no install.',
    path: '/tools',
  })
}
