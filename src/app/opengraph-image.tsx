import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-card'
import { TOTAL_COUNT } from '@/lib/catalog-stats'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { PAGE_COUNT } from '@/lib/pages/page-index'
import { TEMPLATE_COUNT } from '@/lib/templates/template-index'

/**
 * Share card for the site root — the most-pasted URL there is.
 *
 * Every detail page and every tool generated one of these; the homepage,
 * /library, /tools, /paths and /docs did not, so the five URLs most likely
 * to be dropped into a Slack channel or a tweet posted as bare links.
 *
 * `template` accent: this card stands for the whole ladder, and the top
 * rung is the one that says the catalog goes further than effects.
 */

export const runtime = 'nodejs'
export const alt = 'Hoverlab — CSS effects, blocks, pages and templates'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function RootOGImage() {
  return ogCard({
    level: 'template',
    badge: 'Hoverlab',
    kind: `${(TOTAL_COUNT + BLOCK_COUNT + PAGE_COUNT + TEMPLATE_COUNT).toLocaleString('en-US')} components`,
    name: 'Beautiful UI, ready to copy',
    description:
      `A curated catalog that starts at a single hover state and goes up to a deployable project: ${TOTAL_COUNT.toLocaleString('en-US')} effects, ${BLOCK_COUNT} blocks, ${PAGE_COUNT} pages, ${TEMPLATE_COUNT} templates.`,
    path: '/',
  })
}
