/**
 * This tool reads `searchParams` on the server (its `?query` permalinks), so
 * it renders per request. The fallback is the shared tool skeleton — see
 * `ui/page-skeleton.tsx` for why only the routes that are not prerendered
 * get one.
 */
export { ToolPageSkeleton as default } from '@/components/ui/page-skeleton'
