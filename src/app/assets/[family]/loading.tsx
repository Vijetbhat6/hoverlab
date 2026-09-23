import { PageSkeleton } from '@/components/ui/page-skeleton'

/**
 * /assets/[family] reads `searchParams` on the server, so it renders per
 * request even though `dynamicParams = false` keeps the set of families
 * closed. The closed set is also why this fallback cannot mask a 404: a
 * family that does not exist never reaches the render at all, so the
 * `notFound()` in the page is not something a streamed response has to
 * return late.
 *
 * No header of its own — `assets/layout.tsx` is `CatalogLayout`.
 */
export default function Loading() {
  return <PageSkeleton layout="hub" label="Loading assets…" />
}
