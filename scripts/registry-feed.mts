/**
 * registry.directory is a feed now, so treat it like one.
 *
 * ── WHY THIS EXISTS SEPARATELY FROM `submit-registry.mts` ───────────────
 *
 * That script is the front door: one POST, reviewed by a human, and the
 * registry appears in the directory. It is a thing you do once.
 *
 * Since then registry.directory has gone from 76 registries to 292 and
 * grown an activity feed — "just shipped", "this week" — and Shadcnblocks
 * posted 193 components into it in a single week. In a list of 292 a
 * one-off listing is a row nobody scrolls to. The reach is in the feed,
 * and the feed rewards showing up: a wave posted every week is 52 chances
 * to be on the front page against one.
 *
 * So this is the recurring half. It answers two questions and nothing else:
 *
 *   1. Is the domain live enough to submit yet?   `--check`
 *   2. What has shipped since we last said so?    `--wave`
 *
 * ── THE HONEST PART ABOUT POSTING ──────────────────────────────────────
 *
 * registry.directory's submission endpoint is documented; its feed-post
 * endpoint is not, and this script has never successfully called one. So
 * `--post` is off by default and refuses to run without BOTH a token and an
 * explicitly configured endpoint. Everything up to that line — working out
 * the wave, writing the copy, never announcing the same block twice — is
 * the part that is actually hard to do by hand, and it works whether or
 * not the POST ever does. Run it, read the block of text, paste it in.
 *
 * ── NEVER POSTING THE SAME WAVE TWICE ──────────────────────────────────
 *
 * `scripts/registry-feed-state.json` is committed and records the date of
 * the last announcement. The wave is everything the catalog ledger dates
 * after that. That file is the memory; without it a weekly cadence run
 * from two machines announces August twice and nothing in September.
 *
 *   npm run registry:feed                 is the domain ready?
 *   npm run registry:feed -- --wave       what would we post?
 *   npm run registry:feed -- --wave --since=2026-08-20
 *   npm run registry:feed -- --wave --post --yes
 *   npm run registry:feed -- --wave --record   mark posted, no POST
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { lookup } from 'node:dns/promises'

import { BLOCK_CATALOG } from '../src/lib/blocks/catalog.ts'
import { PAGE_CATALOG } from '../src/lib/pages/catalog.ts'
import { TEMPLATE_CATALOG } from '../src/lib/templates/catalog.ts'
import { EFFECT_INDEX } from '../src/lib/effect-index.ts'

/* -- configuration ------------------------------------------------------ */

const args = process.argv.slice(2)
const has = (flag: string) => args.includes(flag)
const value = (flag: string) =>
  args.find((a) => a.startsWith(`${flag}=`))?.slice(flag.length + 1)

const wantWave = has('--wave')
const wantPost = has('--post')
const wantRecord = has('--record')
const confirmed = has('--yes')
const asJson = has('--json')

const HERE = dirname(fileURLToPath(import.meta.url))
const STATE_PATH = resolve(HERE, 'registry-feed-state.json')

/**
 * The catalog's git-derived ledger, read rather than imported: every other
 * script here reads its generated JSON off disk, and a build that has not
 * run `build:recency` should fail loudly here rather than at bundle time.
 */
interface Recency {
  generatedAt: string
  effects: Record<string, string>
  blocks: Record<string, string>
  pages: Record<string, string>
  templates: Record<string, string>
  updated: {
    effects: Record<string, string>
    blocks: Record<string, string>
    pages: Record<string, string>
    templates: Record<string, string>
  }
}

const RECENCY: Recency = JSON.parse(
  readFileSync(resolve(HERE, '..', 'src', 'lib', 'generated-catalog-recency.json'), 'utf8'),
)

/**
 * The domain the feed should point at.
 *
 * Deliberately NOT the Vercel preview host. A feed post is a permanent
 * public link; pointing 292 registries' worth of readers at
 * `hoverlab-xak9.vercel.app` is a link that dies the day the project is
 * renamed, and re-posting to correct it is not a thing a feed lets you do.
 */
const base = (
  value('--url') ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  'https://hoverlab.dev'
).replace(/\/$/, '')

const FEED_URL = process.env.REGISTRY_DIRECTORY_FEED_URL ?? ''
const TOKEN = process.env.REGISTRY_DIRECTORY_TOKEN ?? ''

/* -- state -------------------------------------------------------------- */

interface FeedState {
  /** ISO date of the last wave announced. Everything after it is unposted. */
  lastAnnounced: string
  /** Every wave posted, newest last — the audit trail for "did we say this". */
  history: Array<{ posted: string; since: string; counts: Record<string, number>; note?: string }>
}

function readState(): FeedState {
  try {
    return JSON.parse(readFileSync(STATE_PATH, 'utf8')) as FeedState
  } catch {
    /*
     * No state file is the first run. The fallback is the ledger's own
     * generation date minus a week rather than the epoch: seeding from
     * zero would compose a "just shipped" post containing all 1,211 items,
     * which is not a wave, it is the listing we already made.
     */
    const seed = new Date(RECENCY.generatedAt)
    seed.setUTCDate(seed.getUTCDate() - 7)
    return { lastAnnounced: seed.toISOString().slice(0, 10), history: [] }
  }
}

function writeState(state: FeedState) {
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`)
}

/* -- is the domain ready ------------------------------------------------ */

interface Readiness {
  host: string
  resolves: boolean
  serves: boolean
  homepageMatches: boolean
  items: number
  detail: string
}

async function readiness(): Promise<Readiness> {
  const host = new URL(base).hostname
  const out: Readiness = {
    host,
    resolves: false,
    serves: false,
    homepageMatches: false,
    items: 0,
    detail: '',
  }

  try {
    await lookup(host)
    out.resolves = true
  } catch (error) {
    out.detail = `DNS: ${(error as NodeJS.ErrnoException).code ?? (error as Error).message}`
    return out
  }

  /*
   * DNS resolving is not the same as the site being there, and it is not
   * the same as the site knowing its own name. A deployment without
   * NEXT_PUBLIC_SITE_URL serves a registry.json whose every cross-reference
   * points at the wrong host — it would pass a naive reachability check and
   * fail registry.directory's audit days later.
   */
  try {
    const res = await fetch(`${base}/registry.json`, { headers: { accept: 'application/json' } })
    if (!res.ok) {
      out.detail = `GET /registry.json → ${res.status} ${res.statusText}`
      return out
    }
    out.serves = true
    const index = (await res.json()) as { homepage?: string; items?: unknown[] }
    out.items = index.items?.length ?? 0
    out.homepageMatches = (index.homepage ?? '').replace(/\/$/, '') === base
    if (!out.homepageMatches) {
      out.detail = `registry.json says homepage "${index.homepage}", not "${base}" — NEXT_PUBLIC_SITE_URL is wrong on that deployment.`
    }
  } catch (error) {
    out.detail = `GET /registry.json failed: ${(error as Error).message}`
  }

  return out
}

/* -- the wave ----------------------------------------------------------- */

type Level = 'block' | 'page' | 'template' | 'effect'

interface WaveItem {
  level: Level
  id: string
  name: string
  date: string
  /** Added in this window, or an existing item that changed in it. */
  change: 'added' | 'updated'
  href: string
  install: string
}

const NAMES: Record<Level, Map<string, string>> = {
  block: new Map(BLOCK_CATALOG.map((b) => [b.id, b.name])),
  page: new Map(PAGE_CATALOG.map((p) => [p.id, p.name])),
  template: new Map(TEMPLATE_CATALOG.map((t) => [t.id, t.name])),
  effect: new Map(EFFECT_INDEX.map((e) => [e.id, e.name])),
}

const HREF: Record<Level, (id: string) => string> = {
  block: (id) => `${base}/block/${id}`,
  page: (id) => `${base}/page/${id}`,
  template: (id) => `${base}/template/${id}`,
  effect: (id) => `${base}/effect/${id}`,
}

const LEDGER: Record<Level, Record<string, string>> = {
  block: RECENCY.blocks,
  page: RECENCY.pages,
  template: RECENCY.templates,
  effect: RECENCY.effects,
}

const UPDATED: Record<Level, Record<string, string>> = {
  block: RECENCY.updated.blocks,
  page: RECENCY.updated.pages,
  template: RECENCY.updated.templates,
  effect: RECENCY.updated.effects,
}

function collect(since: string): WaveItem[] {
  const items: WaveItem[] = []

  for (const level of ['block', 'page', 'template', 'effect'] as Level[]) {
    const added = LEDGER[level]
    for (const [id, date] of Object.entries(added)) {
      if (date <= since) continue
      const name = NAMES[level].get(id)
      // An id in the ledger with no catalog entry is a retired artifact.
      // Announcing it would link to a 404.
      if (!name) continue
      items.push({
        level,
        id,
        name,
        date,
        change: 'added',
        href: HREF[level](id),
        install: `npx shadcn@latest add ${base}/r/${id}.json`,
      })
    }

    /*
     * Updates are a second, quieter list. They matter — "what changed since
     * I copied this" is the thing nobody else in this market can answer —
     * but a feed post that mixes fifteen new blocks with two class-name
     * fixes reads as fifteen new blocks either way. They are counted and
     * summarised, never enumerated item by item.
     */
    for (const [id, date] of Object.entries(UPDATED[level])) {
      if (date <= since) continue
      if (added[id] && added[id] > since) continue // already counted as added
      const name = NAMES[level].get(id)
      if (!name) continue
      items.push({
        level,
        id,
        name,
        date,
        change: 'updated',
        href: HREF[level](id),
        install: `npx shadcn@latest add ${base}/r/${id}.json`,
      })
    }
  }

  return items.sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : b.date.localeCompare(a.date)))
}

const PLURAL: Record<Level, [string, string]> = {
  block: ['block', 'blocks'],
  page: ['page', 'pages'],
  template: ['template', 'templates'],
  effect: ['effect', 'effects'],
}

function phrase(counts: Partial<Record<Level, number>>): string {
  const parts: string[] = []
  for (const level of ['block', 'page', 'template', 'effect'] as Level[]) {
    const n = counts[level] ?? 0
    if (n === 0) continue
    parts.push(`${n} ${PLURAL[level][n === 1 ? 0 : 1]}`)
  }
  if (parts.length === 0) return 'nothing'
  if (parts.length === 1) return parts[0]
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

/**
 * The post itself.
 *
 * Written to be pasteable rather than to be pretty. A feed entry competes
 * with 291 other registries, so it leads with the number, names a handful
 * of the actual items (a list of ids is not a reason to click), and ends
 * with the one command — because the whole claim of being on this rail is
 * that the reader can have the thing in ten seconds.
 */
function compose(since: string, items: WaveItem[]): string {
  const added = items.filter((i) => i.change === 'added')
  const updated = items.filter((i) => i.change === 'updated')

  const addedCounts: Partial<Record<Level, number>> = {}
  for (const item of added) addedCounts[item.level] = (addedCounts[item.level] ?? 0) + 1

  const headlineLevel = (['block', 'page', 'template', 'effect'] as Level[]).find(
    (l) => (addedCounts[l] ?? 0) > 0,
  )

  const lines: string[] = []

  lines.push(`Hoverlab — ${phrase(addedCounts)} since ${since}`)
  lines.push('')

  if (headlineLevel) {
    // Name up to six, preferring the headline level: six specific things a
    // reader recognises beats "17 items" every time.
    const highlights = added
      .filter((i) => i.level === headlineLevel)
      .slice(0, 6)
      .map((i) => i.name)
    lines.push(
      `New this wave: ${highlights.join(', ')}${
        (addedCounts[headlineLevel] ?? 0) > highlights.length
          ? `, and ${(addedCounts[headlineLevel] ?? 0) - highlights.length} more`
          : ''
      }.`,
    )
    lines.push('')
  }

  if (updated.length > 0) {
    lines.push(
      `${updated.length} existing ${updated.length === 1 ? 'item' : 'items'} changed too — ` +
        `\`npx hoverlab outdated\` tells an installed copy which of them moved, and ` +
        `\`hoverlab diff <id>\` shows what.`,
    )
    lines.push('')
  }

  lines.push(`Everything installs with the shadcn CLI, free, no account:`)
  lines.push('')
  if (added[0]) lines.push(`    ${added[0].install}`)
  lines.push('')
  lines.push(`Browse: ${base}   Registry: ${base}/registry.json`)

  return lines.join('\n')
}

/* -- run ---------------------------------------------------------------- */

const state = readState()
const since = value('--since') ?? state.lastAnnounced
const ready = await readiness()

if (!wantWave) {
  /* --check is the default, because "is the domain up yet" is the question
     this is run to answer on every day but one. */
  if (asJson) {
    console.log(JSON.stringify({ base, ...ready, lastAnnounced: state.lastAnnounced }, null, 2))
    process.exit(ready.resolves && ready.serves && ready.homepageMatches ? 0 : 1)
  }

  console.log(`\n${base}\n`)
  console.log(`  DNS resolves        ${ready.resolves ? 'yes' : 'NO'}`)
  console.log(`  serves registry     ${ready.serves ? `yes — ${ready.items} items` : 'no'}`)
  console.log(`  knows its own URL   ${ready.homepageMatches ? 'yes' : 'no'}`)
  if (ready.detail) console.log(`\n  ${ready.detail}`)

  if (ready.resolves && ready.serves && ready.homepageMatches) {
    console.log(`\nReady. If this registry has never been listed:\n`)
    console.log(`    npm run submit:registry -- --dry-run`)
    console.log(`    npm run submit:registry\n`)
    console.log(`Already listed? Post the wave instead:\n`)
    console.log(`    npm run registry:feed -- --wave\n`)
    process.exit(0)
  }

  console.log(`\nNot ready — nothing to submit yet. Re-run when the domain is live.\n`)
  process.exit(1)
}

/* --wave ---------------------------------------------------------------- */

const items = collect(since)
const added = items.filter((i) => i.change === 'added')
const counts: Record<string, number> = {}
for (const item of items) {
  const key = `${item.change}:${item.level}`
  counts[key] = (counts[key] ?? 0) + 1
}

if (asJson) {
  console.log(JSON.stringify({ since, base, counts, items }, null, 2))
  process.exit(0)
}

if (items.length === 0) {
  console.log(`\nNothing has landed since ${since}. No wave to post.\n`)
  console.log(`Run the catalog ledger first if that looks wrong:\n`)
  console.log(`    npm run build:recency\n`)
  process.exit(0)
}

console.log(`\nWave since ${since} — ${added.length} added, ${items.length - added.length} updated\n`)
console.log('─'.repeat(72))
console.log(compose(since, items))
console.log('─'.repeat(72))
console.log()

for (const [key, n] of Object.entries(counts).sort()) console.log(`  ${key.padEnd(20)} ${n}`)
console.log()

/* -- post / record ------------------------------------------------------ */

function record(note?: string) {
  const today = new Date().toISOString().slice(0, 10)
  state.history.push({ posted: today, since, counts, ...(note ? { note } : {}) })
  state.lastAnnounced = today
  writeState(state)
  console.log(`Recorded. The next wave starts from ${today}.`)
  console.log(`Commit scripts/registry-feed-state.json so the next run agrees.\n`)
}

if (wantRecord && !wantPost) {
  record('posted by hand')
  process.exit(0)
}

if (!wantPost) {
  console.log(`Paste that into registry.directory, then run:\n`)
  console.log(`    npm run registry:feed -- --wave --record\n`)
  console.log(`so the next wave starts from today rather than repeating this one.\n`)
  process.exit(0)
}

/*
 * The POST path. Guarded hard on purpose: an unverified endpoint plus a
 * bearer token plus a body is three ways to be wrong in public, and the
 * failure mode of guessing is a malformed post under our own name.
 */
if (!FEED_URL) {
  console.error(
    `--post needs REGISTRY_DIRECTORY_FEED_URL. registry.directory's feed endpoint is\n` +
      `not documented and this script has never called one — set it only once you have\n` +
      `confirmed the URL and shape with them. Until then post by hand and use --record.\n`,
  )
  process.exit(1)
}

if (!TOKEN) {
  console.error(`--post needs REGISTRY_DIRECTORY_TOKEN, issued when the listing was accepted.\n`)
  process.exit(1)
}

if (!confirmed) {
  console.error(`--post is public and irreversible. Re-run with --yes to send it.\n`)
  process.exit(1)
}

const res = await fetch(FEED_URL, {
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
  body: JSON.stringify({
    registry_url: `${base}/registry.json`,
    title: `${phrase(
      added.reduce<Partial<Record<Level, number>>>((acc, i) => {
        acc[i.level] = (acc[i.level] ?? 0) + 1
        return acc
      }, {}),
    )} added`,
    body: compose(since, items),
    items: added.slice(0, 25).map((i) => ({ name: i.id, url: `${base}/r/${i.id}.json` })),
  }),
})

const body = await res.text()

if (!res.ok) {
  console.error(`\npost failed: ${res.status} ${res.statusText}\n${body}\n`)
  process.exit(1)
}

console.log(`\nposted. ${res.status}\n${body}\n`)
record()
