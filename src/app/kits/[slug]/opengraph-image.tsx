import { notFound } from 'next/navigation'

import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-card'
import { KITS, getKit } from '@/lib/kits/catalog'
import { kitSize, kitSummary } from '@/lib/kits/resolve'

/**
 * Share card for one kit.
 *
 * The hub has one of these too, and this is the one that matters: a kit
 * link is shared as "here is the storefront set", never as "here is the
 * kits index". /paths shipped only a hub card and its detail pages have
 * been sharing bare, which is the mistake not repeated here.
 *
 * `generateStaticParams` mirrors the page's, so every card is baked at
 * build time rather than rendered on the first scrape — a crawler that
 * times out on a cold satori render gets no card at all, and it does not
 * come back.
 */

export const runtime = 'nodejs'
export const alt = 'Hoverlab kit'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export function generateStaticParams() {
  return KITS.map((kit) => ({ slug: kit.slug }))
}

export default async function KitOGImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const kit = getKit(slug)
  if (!kit) notFound()

  return ogCard({
    level: 'block',
    badge: 'Kit',
    // The inventory rather than a bare total: "1 template · 6 pages · 15
    // blocks" is what tells someone whether this is the thing they want,
    // and it is derived so it cannot disagree with the page.
    kind: `${kitSize(kit)} pieces · ${kitSummary(kit)}`,
    name: kit.name,
    description: kit.tagline,
    path: `/kits/${kit.slug}`,
  })
}
