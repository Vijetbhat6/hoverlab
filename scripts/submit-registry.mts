// Submit the registry to registry.directory — the last step of getting on
// the rail, and the one that cannot run from a laptop.
//
// registry.directory audits a submission by fetching your registry.json and
// several items over https and checking they resolve to real installable
// content. That means this script is useless until the site is deployed and
// NEXT_PUBLIC_SITE_URL points at the production domain: a registry.json full
// of http://localhost:3000 URLs fails the audit, and worse, would be listed
// with dead links if it somehow passed.
//
// So it pre-flights the audit before it submits. Everything registry.directory
// is about to check, this checks first — over the real public URL, with no
// local shortcuts — and refuses to POST if any of it fails. A rejected
// submission costs days of a human reviewer's queue; a failed pre-flight
// costs ten seconds.
//
//   npm run submit:registry -- --dry-run     check only, never POSTs
//   npm run submit:registry                  check, then submit
//
// The base URL comes from NEXT_PUBLIC_SITE_URL, or from --url if you want to
// submit a domain the local environment does not know about.
//
// Re-submitting the same registry_url later is how updates work, but that
// needs the bearer token registry.directory issues on first acceptance —
// store it as REGISTRY_DIRECTORY_TOKEN and this script will send it.

const SUBMIT_URL = 'https://registry.directory/api/submit'

/* -- configuration ------------------------------------------------------ */

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const urlArg = args.find((a) => a.startsWith('--url='))?.slice('--url='.length)

const base = (urlArg ?? process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')

/**
 * The submission body.
 *
 * Note what is absent: the optional `pro` object. It exists to declare
 * content that sits behind a paywall, and nothing in this registry does —
 * every block and page is free to install, and Pro sells the commercial
 * licence rather than access. Declaring a paid tier here would describe a
 * product we do not sell.
 */
const submission = {
  name: 'Hoverlab',
  description:
    'Free, installable Tailwind blocks and full page routes, plus a design system you can install in one command. No account, no key.',
  url: base,
  registry_url: `${base}/registry.json`,
  namespace: '@hoverlab',
  featured: [
    'hoverlab',
    'saas-landing-page',
    'hero-split',
    'pricing-tiers',
    'dashboard-overview',
    'agent-thinking-trace',
  ],
}

/* -- pre-flight --------------------------------------------------------- */

const problems: string[] = []

function fail(message: string) {
  problems.push(message)
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

if (!base) {
  fail('No base URL. Set NEXT_PUBLIC_SITE_URL or pass --url=https://your-domain.')
} else if (!base.startsWith('https://')) {
  fail(
    `Base URL is "${base}". registry.directory requires https and fetches it from ` +
      'the public internet — localhost and http will fail the audit.',
  )
}

if (problems.length === 0) {
  console.log(`checking ${submission.registry_url}\n`)

  let index: { name?: string; homepage?: string; items?: Array<{ name: string; type: string }> } = {}

  try {
    index = (await getJson(submission.registry_url)) as typeof index
  } catch (error) {
    fail(`registry.json is not reachable: ${(error as Error).message}`)
  }

  const items = index.items ?? []

  if (items.length === 0) {
    fail('registry.json has an empty items array.')
  } else {
    console.log(`  registry.json      ${items.length} items`)
  }

  // Every URL the audit follows has to be absolute and public. A single
  // localhost string anywhere in the document means the build that produced
  // it did not know its own domain.
  const raw = JSON.stringify(index)
  if (/localhost|127\.0\.0\.1/.test(raw)) {
    fail(
      'registry.json contains localhost URLs. The deployment that served it has no ' +
        'NEXT_PUBLIC_SITE_URL, so every cross-reference in it points nowhere.',
    )
  }

  // The featured names are verified by the reviewer against the index, so a
  // typo here is a rejection days later rather than an error now.
  const names = new Set(items.map((i) => i.name))
  for (const name of submission.featured) {
    if (!names.has(name)) fail(`featured item "${name}" is not in the registry index.`)
  }

  // Sample the same way the audit does: the base item plus a block and a
  // page, checked for actual source rather than a well-formed shell.
  for (const name of ['hoverlab', 'hero-split', 'saas-landing-page']) {
    const itemUrl = `${base}/r/${name}.json`
    try {
      const item = (await getJson(itemUrl)) as {
        type?: string
        files?: Array<{ content?: string }>
        cssVars?: { light?: Record<string, string> }
      }

      if (item.type === 'registry:base') {
        const vars = Object.keys(item.cssVars?.light ?? {}).length
        if (vars === 0) fail(`${name} declares no CSS variables.`)
        else console.log(`  r/${name}.json     ${vars} light tokens`)
        continue
      }

      const bytes = (item.files ?? []).reduce((n, f) => n + (f.content?.length ?? 0), 0)
      if (bytes === 0) fail(`${name} resolves but carries no file content.`)
      else console.log(`  r/${name}.json     ${bytes} bytes of source`)
    } catch (error) {
      fail(`${itemUrl} is not reachable: ${(error as Error).message}`)
    }
  }
}

if (problems.length) {
  console.error(`\npre-flight failed — ${problems.length} problem(s):\n`)
  for (const p of problems) console.error(`  ✗ ${p}`)
  console.error('\nNot submitting.\n')
  process.exit(1)
}

console.log('\npre-flight passed.')

/* -- submit ------------------------------------------------------------- */

if (dryRun) {
  console.log('\n--dry-run, so stopping here. Body that would be sent:\n')
  console.log(JSON.stringify(submission, null, 2))
  process.exit(0)
}

const token = process.env.REGISTRY_DIRECTORY_TOKEN

const res = await fetch(SUBMIT_URL, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify(submission),
})

const body = await res.text()

if (!res.ok) {
  console.error(`\nsubmission failed: ${res.status} ${res.statusText}\n${body}\n`)
  process.exit(1)
}

console.log(`\nsubmitted. ${res.status}\n${body}`)
console.log(
  '\nA human reviews it, typically within days. If they issue a token, store it as ' +
    'REGISTRY_DIRECTORY_TOKEN — updates are a re-submission with the same registry_url.',
)
