import type { Metadata } from 'next'

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

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
