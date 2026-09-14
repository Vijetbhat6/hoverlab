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
 * Three corrections landed here on 2026-09-14, after reading the published
 * contract at https://registry.directory/how-to-submit.md rather than
 * trusting what this file assumed:
 *
 * 1. `namespace` is gone. It is only legal if the handle is actually listed
 *    in the official shadcn registry index, and it is "verified during
 *    review" — a bad claim is a 422 that rejects the whole POST. All 344
 *    entries of https://ui.shadcn.com/r/registries.json were checked and
 *    `@hoverlab` is not among them, so sending it could only fail. Register
 *    the handle there first, then add it back.
 *
 * 2. `featured` is capped at 6 by the spec. This used to send 7, which is a
 *    400. `dashboard-overview` was the cut — the most commodity of the set.
 *
 * 3. `pro` is now sent. This file used to argue that the object "exists to
 *    declare content that sits behind a paywall", and omitted it on the
 *    grounds that nothing here is gated. That premise was simply wrong: on a
 *    rendered vendor page the five booleans read "Pro blocks & components
 *    offered / Figma kit not offered / Team license not offered". It is a
 *    capability matrix, not a paywall declaration, and omitting it forfeits
 *    the comparison entirely rather than answering it honestly.
 */
const submission = {
  name: 'Hoverlab',
  description:
    'Free, installable Tailwind blocks and full page routes, plus a design system you can install in one command. No account, no key.',
  url: base,
  registry_url: `${base}/registry.json`,
  github_url: 'https://github.com/Vijetbhat6/hoverlab',
  github_profile: 'https://github.com/Vijetbhat6.png',
  featured: [
    // First in the list is the one the landing page puts in the install
    // command, so it leads with the design system rather than a component.
    'hoverlab',
    'saas-landing-page',
    'hero-split',
    // The agent blocks are the half of the catalog no competitor ships.
    'agent-thinking-trace',
    'pricing-tiers',
    // One effect, so a reviewer clicking through sees the half of the
    // catalog that installs as CSS rather than as a component.
    'btn-gradient',
  ],
  /**
   * Every boolean is audited against the live site, so each one below was
   * checked against a URL before it was written — `false` renders as an
   * explicit ✗ and is data, not a gap to paper over.
   *
   * pro_blocks   285 blocks and 107 pages, and a Pro tier that licenses them.
   * templates    /templates, and "All 21 templates" is a Pro line on /pricing.
   * figma_kit    /figma lists 36 downloadable SVG frame files (verified 200).
   *              Note this is a kit of *frames* — named editable layers, no
   *              variants, no auto-layout. The flag asks whether a Figma kit
   *              is offered, which it is; /compare still concedes the richer
   *              "Design files" row to Untitled UI, and should keep doing so.
   * mcp_agent    /docs/mcp, the MCP server in packages/cli, and the skills.
   * team_license /pricing sells Studio at $299 for ten seats and Team at
   *              $12/seat/month — a real per-seat licence, not a promise.
   */
  pro: {
    pro_blocks: true,
    templates: true,
    figma_kit: true,
    mcp_agent: true,
    team_license: true,
  },
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

// Shape checks first — these need no network, and every one of them is a
// limit the published contract enforces with a 4xx. They exist because this
// file shipped a 7-item `featured` and an unverifiable `namespace` for months
// without either being caught: a pre-flight that only checks the registry is
// still happy to POST a body the endpoint will refuse.
if (submission.name.length > 100) fail(`name is ${submission.name.length} chars; the limit is 100.`)

if (submission.description.length > 300) {
  fail(`description is ${submission.description.length} chars; the limit is 300.`)
}

if (submission.featured.length < 1 || submission.featured.length > 6) {
  fail(`featured has ${submission.featured.length} items; the spec allows 1-6.`)
}

if (new Set(submission.featured).size !== submission.featured.length) {
  fail('featured contains a duplicate name.')
}

const bodyBytes = Buffer.byteLength(JSON.stringify(submission))
if (bodyBytes > 10_000) fail(`body is ${bodyBytes} bytes; the limit is 10 KB.`)

// A namespace is only legal if it is really in the official shadcn index, and
// the endpoint returns 422 when it is not. Verify rather than hope.
const namespace = (submission as { namespace?: string }).namespace
if (namespace) {
  try {
    const index = (await getJson('https://ui.shadcn.com/r/registries.json')) as
      | Array<{ name?: string; homepage?: string }>
      | { registries?: Array<{ name?: string; homepage?: string }> }
    const entries = Array.isArray(index) ? index : (index.registries ?? [])
    const match = entries.find((e) => e.name === namespace)
    if (!match) {
      fail(
        `namespace "${namespace}" is not in the official shadcn registry index, so the ` +
          'submission would be rejected with 422. Register the handle there, or drop the field.',
      )
    } else if (match.homepage && base && new URL(match.homepage).host !== new URL(base).host) {
      fail(
        `namespace "${namespace}" is registered to ${match.homepage}, not ${base}. ` +
          'A handle pointing at another domain fails verification with 422.',
      )
    }
  } catch (error) {
    fail(`could not verify the namespace claim: ${(error as Error).message}`)
  }
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

  // Sample the same way the audit does, and cover every item shape we
  // publish: the base, a block, a page and an effect. The effect matters
  // because it is the one that carries no files at all — a check written
  // only against `files[].content` would report the whole effect half of
  // the registry as empty.
  for (const name of ['hoverlab', 'hero-split', 'saas-landing-page', 'btn-gradient']) {
    const itemUrl = `${base}/r/${name}.json`
    try {
      const item = (await getJson(itemUrl)) as {
        type?: string
        files?: Array<{ content?: string }>
        cssVars?: { light?: Record<string, string> }
        css?: Record<string, unknown>
      }

      if (item.type === 'registry:base') {
        const vars = Object.keys(item.cssVars?.light ?? {}).length
        if (vars === 0) fail(`${name} declares no CSS variables.`)
        else console.log(`  r/${name}.json     ${vars} light tokens`)
        continue
      }

      if (item.type === 'registry:item') {
        const rules = Object.keys(item.css ?? {}).length
        if (rules === 0) fail(`${name} is an effect that resolves but carries no CSS rules.`)
        else console.log(`  r/${name}.json     ${rules} CSS rules`)
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

// The submission_token is returned exactly once and is the only credential
// that can amend a pending submission. Losing it is not fatal — the pending
// version still gets reviewed — but it is unrecoverable, so persist it before
// anything else can scroll it away. .env.local is gitignored by `.env*`, and
// is where this script already reads the token back from.
let issued: string | undefined
try {
  issued = (JSON.parse(body) as { submission_token?: string }).submission_token
} catch {
  // A non-JSON 2xx is not an error worth failing the run over.
}

if (issued) {
  const fs = await import('node:fs')
  const line = `REGISTRY_DIRECTORY_TOKEN=${issued}\n`
  const existing = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : ''

  if (existing.includes('REGISTRY_DIRECTORY_TOKEN=')) {
    fs.writeFileSync(
      '.env.local',
      existing.replace(/REGISTRY_DIRECTORY_TOKEN=.*\n?/, line),
    )
  } else {
    fs.writeFileSync('.env.local', existing + (existing.endsWith('\n') || !existing ? '' : '\n') + line)
  }

  console.log('\nsubmission_token saved to .env.local (gitignored). It is shown only once.')
}

console.log(
  '\nA human reviews it, typically within days. Updates are a re-submission with the ' +
    'same registry_url and that token as an Authorization: Bearer header.',
)
