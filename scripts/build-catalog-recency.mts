/**
 * Build the catalog recency ledger — when each artifact first appeared.
 *
 * The catalog has never carried a date. Nothing in the effect, block, page
 * or template records says when it was added, so the site cannot show a
 * "new this week" badge, a Recently Added rail, or a changelog of what the
 * catalog itself gained — and a catalog that never visibly changes reads as
 * abandoned.
 *
 * The dates are not invented here, and they are not a new field for every
 * generator to remember to set. They are read out of git, which already
 * knows exactly when each artifact arrived:
 *
 *   effects    walk every commit that touched the generated catalog (and
 *              the hand-written one), parse the ids out of each revision,
 *              and record the first commit an id appears in.
 *   blocks     one source file per block, so the commit that ADDED
 *              src/lib/blocks/sources/<id>.tsx is the block's birthday.
 *   pages      the same, under pages/sources.
 *   templates  the same, over the template's own directory.
 *
 * The result is committed as JSON and read at runtime by `lib/recency.ts`.
 * It is NOT part of `prebuild`: hosts commonly check out shallow clones, so
 * a build-time git walk would silently produce an empty ledger on the one
 * machine whose output ships. Run it by hand after a catalog wave:
 *
 *     npm run build:recency
 *
 * Ids already in the ledger keep their recorded date — re-running never
 * rewrites history. Ids git has never seen (added in the working tree, not
 * yet committed) are stamped with today so a fresh wave is not invisible
 * until it is committed.
 */

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { EFFECTS } from '../src/lib/effects.ts'
// The *_CATALOG records, not the assembled BLOCKS/PAGES/TEMPLATES: those
// modules pull in the generated source bundles, which are marked
// `server-only` and refuse to load outside a Server Component. Ids are all
// this script needs, and the records carry them.
import { BLOCK_CATALOG } from '../src/lib/blocks/catalog.ts'
import { PAGE_CATALOG } from '../src/lib/pages/catalog.ts'
import { TEMPLATE_CATALOG } from '../src/lib/templates/catalog.ts'

const ROOT = process.cwd()
const OUT = join(ROOT, 'src/lib/generated-catalog-recency.json')

type Ledger = Record<string, string>

interface RecencyFile {
  /** When this ledger was last rebuilt. */
  generatedAt: string
  effects: Ledger
  blocks: Ledger
  pages: Ledger
  templates: Ledger
  /**
   * When each artifact last *changed*, for the artifacts where that can be
   * determined precisely.
   *
   * WHY THIS EXISTS. Pro sells a twelve-month update window — see
   * `updateWindowMonths` in `lib/billing/plans.ts` — and until this key the
   * catalog could not show that anything had ever been updated. Every date
   * on the site was a first-appearance date, so a buyer asking "is this
   * maintained" saw additions and nothing else, and a fix to a shipped
   * block was invisible to the people who had installed it.
   *
   * DELIBERATELY INCOMPLETE. An id appears here only when its change
   * history can be read exactly: one file per artifact for blocks, pages
   * and templates, and a per-record hash for the generated effects. The
   * hand-written effects in `effects-handcrafted.ts` share one file, so a
   * commit touching it says nothing about which effect changed — those get
   * no entry rather than a date that would be wrong for most of them. The
   * site renders nothing where there is no entry, which is the same rule
   * `addedAt` already follows.
   */
  updated: {
    effects: Ledger
    blocks: Ledger
    pages: Ledger
    templates: Ledger
  }
}

const TODAY = new Date().toISOString().slice(0, 10)

function git(args: string[]): string {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    })
  } catch {
    return ''
  }
}

/** Commits that touched `path`, oldest first, as [sha, YYYY-MM-DD]. */
function commitsFor(path: string): Array<[string, string]> {
  const log = git(['log', '--reverse', '--format=%H %cI', '--', path])
  return log
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [sha, iso] = line.split(' ')
      return [sha, iso.slice(0, 10)] as [string, string]
    })
}

/** The date `path` was first added, or null if git has never seen it. */
function addedDate(path: string): string | null {
  const log = git(['log', '--diff-filter=A', '--format=%cI', '--follow', '--', path])
  const lines = log.split('\n').filter(Boolean)
  // --follow walks backwards through renames; the last line is the original
  // add, which is the date we want rather than the most recent rename.
  return lines.length ? lines[lines.length - 1].slice(0, 10) : null
}

/** The date `path` was last touched, or null if git has never seen it. */
function updatedDate(path: string): string | null {
  const iso = git(['log', '-1', '--format=%cI', '--', path]).trim()
  return iso ? iso.slice(0, 10) : null
}

/**
 * Walk one file's history and record the first revision each id appears in.
 *
 * `extract` turns a revision's raw text into ids, so the same walk serves
 * the generated JSON catalog and the hand-written TypeScript one.
 */
function walkIds(
  path: string,
  extract: (source: string) => string[],
  into: Ledger,
): void {
  for (const [sha, date] of commitsFor(path)) {
    const source = git(['show', `${sha}:${path}`])
    if (!source) continue
    for (const id of extract(source)) {
      if (!(id in into)) into[id] = date
    }
  }
}

/**
 * The same walk, but recording when each record's *content* last changed.
 *
 * A commit that touches `generated-effects.json` touches one file holding
 * nine hundred effects, so the file's own last-modified date is worthless
 * per id — it would mark every effect in the catalog as updated on the day
 * any one of them moved. Hashing each record per revision is what makes the
 * claim precise enough to publish.
 *
 * The first revision an id appears in is its addition, not an update, so
 * the first hash seen is recorded without a date and only subsequent
 * changes count.
 */
function walkRecordChanges(path: string, into: Ledger): void {
  const lastHash = new Map<string, string>()

  for (const [sha, date] of commitsFor(path)) {
    const source = git(['show', `${sha}:${path}`])
    if (!source) continue

    let parsed: unknown
    try {
      parsed = JSON.parse(source)
    } catch {
      continue
    }
    if (!Array.isArray(parsed)) continue

    for (const row of parsed) {
      const id = (row as { id?: unknown }).id
      if (typeof id !== 'string') continue

      const hash = createHash('sha1').update(JSON.stringify(row)).digest('hex')
      const previousHash = lastHash.get(id)
      lastHash.set(id, hash)

      // First sighting is the add; only a later change is an update.
      if (previousHash !== undefined && previousHash !== hash) into[id] = date
    }
  }
}

function idsFromJson(source: string): string[] {
  try {
    const parsed: unknown = JSON.parse(source)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((row) => (row as { id?: unknown }).id)
      .filter((id): id is string => typeof id === 'string')
  } catch {
    return []
  }
}

function idsFromTs(source: string): string[] {
  return [...source.matchAll(/\bid:\s*['"]([a-z0-9][a-z0-9-]*)['"]/g)].map((m) => m[1])
}

/* ------------------------------------------------------------------ *
 *  Load the previous ledger, so recorded dates survive a rebuild.
 * ------------------------------------------------------------------ */

const previous: RecencyFile = existsSync(OUT)
  ? (JSON.parse(readFileSync(OUT, 'utf8')) as RecencyFile)
  : {
      generatedAt: TODAY,
      effects: {},
      blocks: {},
      pages: {},
      templates: {},
      updated: { effects: {}, blocks: {}, pages: {}, templates: {} },
    }

const effects: Ledger = { ...previous.effects }
const blocks: Ledger = { ...previous.blocks }
const pages: Ledger = { ...previous.pages }
const templates: Ledger = { ...previous.templates }

/*
 * The update ledgers are rebuilt rather than carried forward.
 *
 * `added` is seeded from the previous file because a first-appearance date
 * is a fact that cannot change and a shallow clone might not be able to see
 * it. An update date is the opposite: it moves every time the artifact
 * moves, so a stale carried-over value would be a claim that the artifact
 * has not been touched since — exactly the wrong thing to be confidently
 * wrong about.
 */
const updatedEffects: Ledger = {}
const updatedBlocks: Ledger = {}
const updatedPages: Ledger = {}
const updatedTemplates: Ledger = {}

/* ------------------------------------------------------------------ *
 *  Effects — from the two files that define them.
 * ------------------------------------------------------------------ */

walkIds('src/lib/generated-effects.json', idsFromJson, effects)
walkIds('src/lib/effects-handcrafted.ts', idsFromTs, effects)

// Per-record hashing, for the generated half only — see walkRecordChanges
// and the `updated` docs on RecencyFile for why the handcrafted file is
// deliberately left out.
walkRecordChanges('src/lib/generated-effects.json', updatedEffects)

/* ------------------------------------------------------------------ *
 *  Blocks, pages, templates — one file (or directory) per artifact.
 * ------------------------------------------------------------------ */

for (const block of BLOCK_CATALOG) {
  if (blocks[block.id]) continue
  const date = addedDate(`src/lib/blocks/sources/${block.id}.tsx`)
  blocks[block.id] = date ?? TODAY
}

for (const block of BLOCK_CATALOG) {
  const touched = updatedDate(`src/lib/blocks/sources/${block.id}.tsx`)
  if (touched && touched !== blocks[block.id]) updatedBlocks[block.id] = touched
}

for (const page of PAGE_CATALOG) {
  if (pages[page.id]) continue
  const date = addedDate(`src/lib/pages/sources/${page.id}.tsx`)
  pages[page.id] = date ?? TODAY
}

for (const page of PAGE_CATALOG) {
  const touched = updatedDate(`src/lib/pages/sources/${page.id}.tsx`)
  if (touched && touched !== pages[page.id]) updatedPages[page.id] = touched
}

for (const template of TEMPLATE_CATALOG) {
  if (templates[template.id]) continue
  const date = addedDate(`src/lib/templates/files/${template.id}`)
  templates[template.id] = date ?? TODAY
}

for (const template of TEMPLATE_CATALOG) {
  const touched = updatedDate(`src/lib/templates/files/${template.id}`)
  if (touched && touched !== templates[template.id]) updatedTemplates[template.id] = touched
}

/* ------------------------------------------------------------------ *
 *  Anything the catalog holds that the walk never saw — a wave sitting
 *  in the working tree — is stamped today rather than left dateless.
 * ------------------------------------------------------------------ */

let stamped = 0
for (const effect of EFFECTS) {
  if (!effects[effect.id]) {
    effects[effect.id] = TODAY
    stamped++
  }
}

/*
 * Prune ids the catalog no longer holds.
 *
 * The effects walk sees every id that has ever existed, and the catalog has
 * been trimmed hard since — the one-per-design pass alone retired several
 * thousand. Keeping their dates would inflate this file by an order of
 * magnitude and ship a lookup table of URLs that 404.
 */
const out: RecencyFile = {
  generatedAt: TODAY,
  effects: prune(effects, EFFECTS.map((e) => e.id)),
  blocks: prune(blocks, BLOCK_CATALOG.map((b) => b.id)),
  pages: prune(pages, PAGE_CATALOG.map((p) => p.id)),
  templates: prune(templates, TEMPLATE_CATALOG.map((t) => t.id)),
  updated: {
    effects: prune(updatedEffects, EFFECTS.map((e) => e.id)),
    blocks: prune(updatedBlocks, BLOCK_CATALOG.map((b) => b.id)),
    pages: prune(updatedPages, PAGE_CATALOG.map((p) => p.id)),
    templates: prune(updatedTemplates, TEMPLATE_CATALOG.map((t) => t.id)),
  },
}

writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`, 'utf8')

const dates = new Set(Object.values(out.effects))
console.log(
  `recency ledger → ${Object.keys(out.effects).length} effects, ` +
    `${Object.keys(out.blocks).length} blocks, ${Object.keys(out.pages).length} pages, ` +
    `${Object.keys(out.templates).length} templates`,
)
console.log(`  ${dates.size} distinct effect dates; ${stamped} stamped today (uncommitted)`)
console.log(
  `  updated: ${Object.keys(out.updated.effects).length} effects, ` +
    `${Object.keys(out.updated.blocks).length} blocks, ` +
    `${Object.keys(out.updated.pages).length} pages, ` +
    `${Object.keys(out.updated.templates).length} templates`,
)

/** Drop every entry whose id is not in the live catalog. */
function prune(ledger: Ledger, live: string[]): Ledger {
  const keep = new Set(live)
  return sorted(
    Object.fromEntries(Object.entries(ledger).filter(([id]) => keep.has(id))),
  )
}

/** Stable key order, so a rebuild produces a reviewable diff. */
function sorted(ledger: Ledger): Ledger {
  return Object.fromEntries(Object.entries(ledger).sort(([a], [b]) => a.localeCompare(b)))
}
