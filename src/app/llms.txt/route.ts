import { buildLlmsTxt } from '@/lib/llms-txt'
import { LIST_CACHE } from '@/lib/api/public'

/**
 * GET /llms.txt — the llmstxt.org discovery document.
 *
 * Dispatch only. The document itself is built in `lib/llms-txt.ts`, which
 * is where the reasoning behind its contents lives.
 *
 * The split is not tidiness: a `route.ts` may only export HTTP methods and
 * a short list of config fields, so a builder exported from here would not
 * compile. Keeping it in lib is what lets `check:llms` import the exact
 * string this route serves rather than re-deriving an approximation of it.
 *
 * The route segment is literally `llms.txt`, dot included, for the same
 * reason `registry.json` is — the convention names an exact URL at the
 * site root, and a client that has not been told otherwise asks for that
 * spelling or nothing.
 */

export const runtime = 'nodejs'

export function GET(): Response {
  return new Response(buildLlmsTxt(), {
    headers: {
      // text/plain, not text/markdown: the convention is that a browser
      // and a curl both render it inline rather than offering a download.
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': LIST_CACHE,
      // Same reasoning as /registry.json — this is a document third-party
      // agents fetch cross-origin from a browser context.
      'Access-Control-Allow-Origin': '*',
    },
  })
}
