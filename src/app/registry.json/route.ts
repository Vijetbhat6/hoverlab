import { buildRegistryIndex } from '@/lib/registry/registry'
import { siteUrl } from '@/lib/site'
import { apiJson, apiPreflight, LIST_CACHE } from '@/lib/api/public'

/**
 * GET /registry.json — the shadcn registry discovery document.
 *
 * This URL is the one third parties ask for by name. registry.directory
 * audits it on submission and re-fetches it to index items; the shadcn MCP
 * server reads it to answer "what does this registry have"; a human pastes
 * it into `components.json` to get `@hoverlab/...` working. It has to live
 * at the root, spelled exactly this way, which is why the route segment is
 * literally `registry.json` rather than something tidier under `/api`.
 *
 * Metadata only — no file contents. See `buildRegistryIndex`.
 *
 * `LIST_CACHE` rather than the long detail cache: this document changes
 * every time a block lands, and a registry that advertises a stale item list
 * is the one failure mode an indexer will notice.
 */

export const runtime = 'nodejs'

export async function GET() {
  return apiJson(buildRegistryIndex(siteUrl), { cache: LIST_CACHE })
}

export async function OPTIONS() {
  return apiPreflight()
}
