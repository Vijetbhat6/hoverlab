import type { Metadata } from 'next'

/** Metadata for /playground. See the note in ../library/layout.tsx. */
export const metadata: Metadata = {
  title: 'CSS Playground — Tune Any Effect Live — Hoverlab',
  description:
    'Paste your own HTML and CSS, then drag hue, saturation, size and speed sliders to transform it in real time. Everything runs in your browser — your code never leaves the page.',
  alternates: { canonical: '/playground' },
}

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
