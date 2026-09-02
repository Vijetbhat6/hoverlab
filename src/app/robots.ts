import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site'

/**
 * robots.txt, generated so it can reference the sitemap at the correct
 * absolute origin per environment.
 *
 * The catalog is open (see PROTECTED_PREFIXES in proxy.ts), so every hub,
 * category and detail page is crawlable and every one of them is listed in
 * sitemap.ts. This file only names the paths that cannot rank.
 *
 * What stays disallowed, and why:
 *
 *   /api/                JSON, not documents.
 *   /account, /login,    User-specific or empty. Nothing to index, and an
 *   /signup, /forgot-,   indexed login page competes with the page the
 *   /reset-password      visitor actually wanted.
 *   /playground          Needs a session; a crawler gets a redirect.
 *   /embed/              Same markup and CSS as the effect pages with none
 *                        of the surrounding copy, so indexing them would
 *                        compete with the page that should rank. They are
 *                        meant to load inside someone else's <iframe>.
 *
 * What is deliberately NOT disallowed, despite being JSON:
 *
 *   /registry.json       The shadcn registry, and the one URL third parties
 *   /r/*                 fetch by name. registry.directory audits it on
 *                        submission and re-fetches to index items, and the
 *                        shadcn CLI resolves every registry dependency by
 *                        URL. A robots-respecting fetcher on either side
 *                        would simply stop working. The "JSON, not
 *                        documents" rule above exists to protect ranking;
 *                        here it would break distribution, which is the
 *                        whole point of the endpoint. If /r/ ever dilutes
 *                        anything, the fix is a noindex header on those
 *                        responses, not a robots rule.
 *
 * There is no Googlebot exemption anywhere in this codebase, and there is
 * no longer anything to exempt it from: crawlers and humans now get the
 * same pages, which is the only version of this that is not cloaking.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/account',
          '/login',
          '/signup',
          '/forgot-password',
          '/reset-password',
          '/embed/',
          // Keep in sync with PROTECTED_PREFIXES in proxy.ts.
          '/playground',
          /*
            /collections was in that list and missing from this one. It
            carries `robots: { index: false }` in its own metadata, so it
            was never going to rank — but a crawler still had to request it
            to find that out, and every one of those requests is a redirect
            to /login for a page with nothing on it. Listed here it is not
            fetched at all, and the two lists say the same thing again.
          */
          '/collections',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/').replace(/\/$/, ''),
  }
}
