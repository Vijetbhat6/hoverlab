/**
 * Fail the build when an HTML route does not declare its own canonical URL.
 *
 *   npx tsx scripts/check-canonical.mts
 *
 * WHY THIS EXISTS
 *
 * The home page is a client component with no layout of its own, so the
 * only place its canonical could be set is the root layout — and metadata
 * in the root layout is a *default the whole app inherits*. That is safe
 * exactly as long as every other route overrides it, and silently wrong
 * the moment one does not: a page that forgets its canonical does not ship
 * without one, it ships claiming to be the home page. Google is then told
 * two different URLs are the same document, and the one it keeps is not
 * the one anybody chose.
 *
 * That failure is invisible in every way this repo normally catches
 * things. The page renders, the route resolves, the sitemap lists it, tsc
 * and eslint are happy, and the tag is present in the HTML — it just names
 * the wrong URL. You would have to view source on each of 1,598 URLs and
 * read the href to find it.
 *
 * It is also not hypothetical. When this check was written, /tools and all
 * thirty-six tools under it had no canonical at all, and neither did
 * /login or /signup. The tools are the section with the highest-volume
 * queries the site can answer, and the pages most often reached with a
 * query string appended, because every tool encodes its state in the URL.
 *
 * HOW IT DECIDES
 *
 * Statically, from the files — no server, so it cannot pass against a
 * stale deployment and costs nothing in the prebuild chain. A route is
 * satisfied when the word `canonical` appears in its own `page.tsx` or in
 * a `layout.tsx` at or above it, stopping *below* `src/app/layout.tsx`:
 * the root layout is the inherited default this check exists to police, so
 * counting it would make every route pass.
 *
 * Deliberately a text search rather than a parse. The canonical can arrive
 * from `export const metadata`, from `generateMetadata`, or from a shared
 * helper — `toolMetadata` builds one from each tool's href — and a check
 * that only understood one of those shapes would fail the other two
 * honestly-written cases. The cost of the loose test is that it cannot
 * tell a real canonical from the word appearing in a comment. That is the
 * right trade here: this guards against *forgetting*, and nobody writes
 * the word in a comment on a route they forgot.
 *
 * `robots: { index: false }` satisfies it too, and that is a rule rather
 * than an exception: a page that tells crawlers not to index it has no
 * need to tell them which URL it is, and pairing a canonical with a
 * noindex sends two contradictory signals about the same document. It is
 * how /collections and /preview/[level]/[slug] pass — both of them
 * deliberate, both already commented as such at their own definitions.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const APP = join(ROOT, 'src', 'app')

/** Only page files render a document that can carry a <link rel=canonical>. */
const PAGE_FILES = new Set(['page.tsx', 'page.ts'])

/**
 * Routes that render a document but must not claim a canonical of their own.
 *
 * Keyed by the route path, with the reason, so removing an entry is a
 * decision someone has to justify rather than a line they can delete.
 */
const EXEMPT: Record<string, string> = {
  '/': 'A client component with no layout of its own. Its canonical IS the root layout default this check refuses to count for anyone else.',
}

interface Route {
  /** URL path, route groups removed. */
  path: string
  /** Repo-relative path of the page file, for the error message. */
  file: string
  /** The page file plus every layout above it, nearest first, excluding the root. */
  sources: string[]
}

function collect(dir: string, segments: string[], layouts: string[], out: Route[]): void {
  let entries: ReturnType<typeof readdirSync<{ withFileTypes: true }>>
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }

  /*
   * The root layout is excluded by starting the chain empty at src/app and
   * only appending layouts found in directories below it.
   */
  const here = entries.find((e) => e.isFile() && e.name === 'layout.tsx')
  const chain = here && dir !== APP ? [join(dir, 'layout.tsx'), ...layouts] : layouts

  const page = entries.find((e) => e.isFile() && PAGE_FILES.has(e.name))
  if (page) {
    const file = join(dir, page.name)
    out.push({
      path: '/' + segments.join('/'),
      file: relative(ROOT, file).replace(/\\/g, '/'),
      sources: [file, ...chain],
    })
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const name = entry.name

    // Never routable, and never rendered as a document.
    if (name.startsWith('_') || name.startsWith('@')) continue
    if (name === 'api') continue

    // A route group organises files and contributes nothing to the URL.
    if (name.startsWith('(') && name.endsWith(')')) {
      collect(join(dir, name), segments, chain, out)
      continue
    }

    collect(join(dir, name), [...segments, name], chain, out)
  }
}

const routes: Route[] = []
collect(APP, [], [], routes)

/**
 * A noindex declaration, in the shape the app already writes it:
 * `robots: { index: false, follow: false }`, whitespace-insensitive.
 */
const NOINDEX = /robots\s*:\s*\{[^}]*index\s*:\s*false/

const missing: Route[] = []
for (const route of routes) {
  if (route.path in EXEMPT) continue
  const declared = route.sources.some((file) => {
    let source: string
    try {
      source = readFileSync(file, 'utf8')
    } catch {
      return false
    }
    return source.includes('canonical') || NOINDEX.test(source)
  })
  if (!declared) missing.push(route)
}

const exemptCount = routes.filter((r) => r.path in EXEMPT).length

if (missing.length > 0) {
  console.error(
    `check-canonical: ${missing.length} route(s) declare no canonical URL, so they inherit\n` +
      `the root layout's and each claims to be the home page:\n`,
  )
  for (const route of missing.sort((a, b) => a.path.localeCompare(b.path))) {
    console.error(`  ${route.path}`)
    console.error(`    ${route.file}`)
  }
  console.error(
    `\nAdd \`alternates: { canonical: '<path>' }\` to that route's metadata — in the\n` +
      `page itself, or in a layout.tsx beside it when the page is a client\n` +
      `component and cannot export metadata of its own. If the route is private,\n` +
      `\`robots: { index: false, follow: false }\` is the right answer instead.`,
  )
  process.exit(1)
}

console.log(
  `check-canonical: ${routes.length - exemptCount} routes declare their own canonical` +
    `${exemptCount ? `, ${exemptCount} exempt` : ''}.`,
)
