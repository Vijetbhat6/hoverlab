import type { Metadata } from 'next'

import { ToolFunnelBand } from '@/components/designer-tools/tool-funnel-band'

/**
 * Metadata for the /tools hub itself. See ../library/layout.tsx.
 *
 * Each tool route carries its own metadata via a per-directory layout.tsx
 * (the pages are client components and cannot export it), with the title
 * and description drawn from `@/lib/designer-tools`. What is set here is
 * only what the hub page shows.
 */
export const metadata: Metadata = {
  title: 'Designer Tools — Tokens, Palettes, Gradients, Contrast & More — Hoverlab',
  description:
    'Twenty free designer tools that run entirely in your browser: design tokens, palettes, color conversion, gradients, shadows, clip-paths, noise textures, type and spacing scales, WCAG contrast checks, favicons, OG tags and email templates.',
}

/**
 * Every tool route gets a way into the catalog, by existing.
 *
 * The funnel is mounted here rather than on 37 pages because 37 edits is
 * 37 chances to miss one, and the 38th tool is the one that would ship
 * without it — which is how this surface, the largest acquisition surface
 * the site has, ended up sending its traffic nowhere at all.
 *
 * <ToolFunnelBand> renders nothing on /tools itself and nothing for a tool
 * with no honest next step. See `lib/tool-funnel.ts`.
 */
export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <ToolFunnelBand />
    </>
  )
}
