import { PageSkeleton } from '@/components/ui/page-skeleton'

/**
 * /builder renders the real preview of every section in the URL on the
 * server, which is the slow part of the whole site — and it reads
 * `searchParams`, so it does that on every request.
 *
 * The page mounts its own <SiteHeader>, so this does too: the same header,
 * in the same place, rather than a bar that becomes one.
 */
export default function Loading() {
  return <PageSkeleton layout="builder" withHeader label="Loading the builder…" />
}
