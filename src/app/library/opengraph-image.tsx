import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-card'
import { TOTAL_COUNT } from '@/lib/catalog-stats'
import { CATEGORIES } from '@/lib/effect-types'

/** Share card for the /library hub. */

export const runtime = 'nodejs'
export const alt = 'Hoverlab effects library'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function LibraryHubOGImage() {
  return ogCard({
    level: 'effect',
    badge: 'Effects',
    kind: `${TOTAL_COUNT.toLocaleString('en-US')} effects`,
    name: 'Pure-CSS effects, copy-ready',
    description:
      `Buttons, loaders, cards, text, backgrounds, navigation and more across ${CATEGORIES.length} categories. Live demos, no JavaScript, no dependencies.`,
    path: '/library',
  })
}
