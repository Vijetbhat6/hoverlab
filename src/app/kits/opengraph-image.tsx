import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-card'
import { KITS } from '@/lib/kits/catalog'
import { kitSize } from '@/lib/kits/resolve'

/** Share card for the /kits hub. */

export const runtime = 'nodejs'
export const alt = 'Hoverlab kits'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function KitsHubOGImage() {
  // Counted, not typed — the same rule the hub page follows, so the card
  // and the page it links to cannot advertise different totals.
  const pieces = KITS.reduce((n, kit) => n + kitSize(kit), 0)

  return ogCard({
    // `block` because a kit is sold and shaped like the block rung, and
    // ogCard's levels are a visual palette rather than a taxonomy — there
    // is no 'kit' level and inventing one would mean a fifth colour for
    // one page.
    level: 'block',
    badge: 'Kits',
    kind: `${KITS.length} kits · ${pieces} pieces`,
    name: 'Everything for one job, in one place',
    description:
      'A kit names the template, the screens, the sections and the polish that build one kind of product — so the choosing is done and the building is what is left.',
    path: '/kits',
  })
}
