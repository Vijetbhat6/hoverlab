import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-card'
import { BLOCK_INDEX } from '@/lib/blocks/block-index'

/** Share card for /builder. */

export const runtime = 'nodejs'
export const alt = 'Hoverlab page builder'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function BuilderOGImage() {
  return ogCard({
    // `page` because that is what the builder produces — the rung above the
    // blocks it composes, and the same colour the /pages hub carries.
    level: 'page',
    badge: 'Builder',
    // Counted, not typed. A card advertising a block total that the picker
    // disagrees with is the exact failure `check-claimed-counts` exists for.
    kind: `${BLOCK_INDEX.length} sections · no account`,
    name: 'Compose a page out of real sections',
    description:
      'Pick sections, order them, watch the actual components render, and leave with the page source and the one command that installs it. The layout is the link.',
    path: '/builder',
  })
}
