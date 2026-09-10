/**
 * Fail the build when /llms.txt links at a route that does not exist.
 *
 *   npx tsx scripts/check-llms-links.mts
 *
 * WHY THIS EXISTS
 *
 * /llms.txt is a map handed to agents that will not double-check it. Every
 * other link surface on this site is either rendered from a catalog (so a
 * dead entry is impossible) or read by a human who can see a 404 and go
 * back. This file is hand-authored prose read by a machine that will
 * report our own broken URL as a fact about us, and it is fetched once and
 * cached, so a bad link is not corrected by the next page view.
 *
 * The specific trap it was written for: `/legal/licence`. The licence page
 * lives at `src/app/(legal)/licence/page.tsx`, and `(legal)` is a route
 * group — parentheses organise files without appearing in the URL. The
 * real path is `/licence`. That link looked right in the source, matched
 * the directory on disk, and 404'd. Nothing else in the repo would have
 * caught it, because nothing else resolves app-router paths.
 *
 * The check imports the same `buildLlmsTxt` the route serves rather than
 * fetching the URL, so it needs no running server and cannot pass against
 * a stale deployment.
 *
 * External links are skipped deliberately — this guards our own routing,
 * not third-party uptime, and a check that fails because someone else's
 * site is down is a check people learn to ignore.
 */

import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildLlmsTxt } from '../src/lib/llms-txt.ts'
import { siteUrl } from '../src/lib/site.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const APP = join(HERE, '..', 'src', 'app')

/** Files that make a directory a routable URL. */
const LEAVES = new Set(['page.tsx', 'page.ts', 'route.ts', 'route.tsx'])

/**
 * Next's metadata file conventions, which serve a URL that is not their
 * filename. `sitemap.ts` answers /sitemap.xml and `robots.ts` answers
 * /robots.txt — neither is a `route.ts`, so without this table the checker
 * calls two of the most important URLs on the site broken.
 */
const METADATA_FILES: Record<string, string> = {
  'sitemap.ts': 'sitemap.xml',
  'sitemap.tsx': 'sitemap.xml',
  'robots.ts': 'robots.txt',
  'robots.tsx': 'robots.txt',
  'manifest.ts': 'manifest.webmanifest',
  'manifest.tsx': 'manifest.webmanifest',
  'opengraph-image.tsx': 'opengraph-image',
  'twitter-image.tsx': 'twitter-image',
  'icon.tsx': 'icon',
  'apple-icon.tsx': 'apple-icon',
}

/**
 * Every URL pattern the app directory serves, as segment arrays.
 *
 * A segment is either a literal ('docs', 'registry.json'), or the marker
 * '*' for a dynamic segment, or '**' for a catch-all. Route groups and
 * private folders never become segments at all.
 */
function collectRoutes(dir: string, segments: string[], out: string[][]): void {
  let entries: ReturnType<typeof readdirSync<{ withFileTypes: true }>>
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }

  if (entries.some((e) => e.isFile() && LEAVES.has(e.name))) {
    out.push([...segments])
  }

  for (const entry of entries) {
    if (!entry.isFile()) continue
    const served = METADATA_FILES[entry.name]
    if (served) out.push([...segments, served])
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const name = entry.name

    // `_private` folders are never routable; `@slot` are parallel routes,
    // which render into a layout rather than adding a path segment.
    if (name.startsWith('_') || name.startsWith('@')) continue

    // Route groups: `(marketing)` organises files and contributes nothing
    // to the URL. This is the case the check exists for.
    if (name.startsWith('(') && name.endsWith(')')) {
      collectRoutes(join(dir, name), segments, out)
      continue
    }

    if (name.startsWith('[') && name.endsWith(']')) {
      const inner = name.slice(1, -1)
      const marker = inner.startsWith('...') || inner.startsWith('[...') ? '**' : '*'
      collectRoutes(join(dir, name), [...segments, marker], out)
      continue
    }

    collectRoutes(join(dir, name), [...segments, name], out)
  }
}

/** Does one collected pattern serve this path's segments? */
function matches(pattern: string[], path: string[]): boolean {
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '**') return path.length >= i
    if (i >= path.length) return false
    if (pattern[i] === '*') continue
    if (pattern[i] !== path[i]) return false
  }
  return pattern.length === path.length
}

/* -- run ---------------------------------------------------------------- */

const routes: string[][] = []
collectRoutes(APP, [], routes)

const origin = siteUrl.replace(/\/$/, '')
const document = buildLlmsTxt()

/** Every markdown link target in the document, in order. */
const links = [...document.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1])

if (links.length === 0) {
  console.error('check:llms — no links found in /llms.txt. That cannot be right.')
  process.exit(1)
}

const broken: string[] = []
let checked = 0

for (const href of links) {
  if (!href.startsWith(origin)) continue // external, deliberately not our problem

  const url = new URL(href)
  const segments = url.pathname.split('/').filter(Boolean)

  checked++
  if (!routes.some((pattern) => matches(pattern, segments))) {
    broken.push(url.pathname)
  }
}

if (broken.length > 0) {
  console.error(`check:llms — ${broken.length} link(s) in /llms.txt point at no route:\n`)
  for (const path of [...new Set(broken)]) console.error(`  ${path}`)
  console.error(
    '\nCheck for a route group: a folder in parentheses, like (legal), organises\n' +
      'files without appearing in the URL, so src/app/(legal)/licence is /licence.',
  )
  process.exit(1)
}

console.log(`check:llms — ${checked} internal link(s) in /llms.txt all resolve.`)
