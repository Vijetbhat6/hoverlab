import type { Metadata } from 'next'

/**
 * Metadata for /tools and everything under it. See ../library/layout.tsx.
 *
 * A plain string rather than a `title.template`: 16 of the 17 tool pages
 * define no metadata of their own and inherit this, which is the point,
 * while /tools/meta already sets its own and keeps it untouched. A template
 * would have suffixed that one twice.
 */
export const metadata: Metadata = {
  title: 'Designer Tools — Palettes, Gradients, Shadows, Contrast — Hoverlab',
  description:
    'A focused toolkit that complements the effects library: generate palettes, compose gradients, layer shadows, check WCAG contrast and convert CSS units. Runs entirely in your browser.',
}

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
