import { PageSkeleton } from '@/components/ui/page-skeleton'

/**
 * /browse renders on every request — it reads `searchParams` on the server —
 * so a click on a link to it used to change nothing until the function had
 * woken and finished. This is what shows meanwhile.
 *
 * No header of its own: `layout.tsx` re-exports `CatalogLayout`, which keeps
 * the header, theme bar and footer on screen across the navigation. See
 * `ui/page-skeleton.tsx` for why this file exists only on routes that are
 * not prerendered.
 */
export default function Loading() {
  return <PageSkeleton layout="hub" label="Loading the catalog…" />
}
