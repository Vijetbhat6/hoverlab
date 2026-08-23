import type { Metadata } from 'next'
import { TOTAL_COUNT } from '@/lib/catalog-stats'

/**
 * Metadata for /library.
 *
 * The page itself is a client component, so it cannot export `metadata` —
 * which is why the biggest surface on the site was inheriting the root
 * layout's generic "Hoverlab — CSS Effects, Blocks, Pages and Templates".
 * Every effect detail page beneath it had a real title ("Neon Glow Button —
 * Hoverlab") while the index they all link back to did not, so a browser
 * with a few tabs open showed the same string for the site root, the
 * library, the playground and the tools hub.
 *
 * A layout is the standard way out: it is a server component, it wraps the
 * client page without rendering anything, and the title applies to the
 * whole segment.
 */
export const metadata: Metadata = {
  /*
    Derived, not typed. This read "770+" while the catalog held 835 —
    the one count on the site that was a literal, so it was the one that
    went stale. Every other surface reads TOTAL_COUNT; now so does the
    title of the biggest one.
  */
  title: `Browse ${TOTAL_COUNT}+ CSS Effects — Hoverlab`,
  description:
    'A curated library of distinct pure-CSS effects with live demos and copy-ready code. Buttons, loaders, cards, text, backgrounds, navigation and more — no JavaScript, no frameworks, just CSS.',
  alternates: { canonical: '/library' },
}

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
