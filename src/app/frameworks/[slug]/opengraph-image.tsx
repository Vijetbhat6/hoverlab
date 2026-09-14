import { notFound } from 'next/navigation'

import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-card'
import { FRAMEWORK_STORIES, getFrameworkStory, SUPPORT_LABELS } from '@/lib/frameworks'
import { TOTAL_COUNT } from '@/lib/catalog-stats'

/**
 * Share card for one framework's page.
 *
 * This is the card that matters more than the hub's, and for the reason
 * these pages exist at all: the link that gets posted is "Hoverlab for
 * Svelte" in a Svelte channel, never "Hoverlab's framework support matrix".
 * A framework page sharing bare is the whole packaging exercise falling
 * over at the last step.
 *
 * `generateStaticParams` mirrors the page's, so all seven are baked at
 * build time rather than rendered on the first scrape — a crawler that
 * times out on a cold satori render gets no card, and it does not come
 * back.
 */

export const runtime = 'nodejs'
export const alt = 'Hoverlab, in your framework'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export function generateStaticParams() {
  return FRAMEWORK_STORIES.map((framework) => ({ slug: framework.id }))
}

export default async function FrameworkOGImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const story = getFrameworkStory(slug)
  if (!story) notFound()

  /*
   * The card says which rung it actually reaches, rather than a bare
   * count.
   *
   * "1,047 effects · Converted" and "Markup only" are different promises,
   * and the card is the one surface where an over-claim travels furthest —
   * it gets screenshotted into threads we never see. Derived from the same
   * two fields the page's table reads.
   */
  const kind =
    story.effects === 'none'
      ? `Blocks & pages · ${SUPPORT_LABELS[story.blocks]}`
      : `${TOTAL_COUNT.toLocaleString('en-US')} effects · ${SUPPORT_LABELS[story.effects]}`

  return ogCard({
    level: 'effect',
    badge: story.label,
    kind,
    name: story.headline,
    description: story.summary,
    path: `/frameworks/${story.id}`,
  })
}
