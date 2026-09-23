import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  COLLECTION_POLICY,
  DELETED_COLLECTIONS,
  EXPORTED_COLLECTIONS,
  IGNORED_COLLECTIONS,
  NOT_EXPORTED,
  RETAINED_COLLECTIONS,
} from './policy'
import { buildDeletionSteps } from './deletion'
import { EXPORT_SECTION_FOR } from './export'
import type { AccountStore } from './store'

/**
 * THE DRIFT GUARD.
 *
 * Deleting an account is only as complete as the list of places data lives,
 * and that list is maintained by memory. So this test does not trust memory:
 * it reads every source file, finds every Firestore collection the app
 * touches, and fails unless each one is written down in `policy.ts` with a
 * reason — as deleted, retained-with-the-person-removed, or ignored because
 * it holds nothing personal.
 *
 * The failure this exists for is quiet. Someone adds `users/{uid}/notes` or
 * a top-level `feedback` collection keyed by uid, the feature works, nobody
 * touches the deletion code, and the account "deletes" leaving it behind.
 * Now the same commit turns this test red and names the collection.
 *
 * Two further checks stop the table from being decoration: the deletion
 * plan's declared coverage must equal what the table says is deleted or
 * retained, and every exported collection must be tied to a section of the
 * download. (`account.test.ts` then seeds each of them and checks the
 * section really is filled.)
 */

const SRC = fileURLToPath(new URL('../../', import.meta.url))

/** Every .ts/.tsx under src/, tests and declaration files excluded. */
function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      out.push(...sourceFiles(full))
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.ts$/.test(entry) && !entry.endsWith('.d.ts')) {
      out.push(full)
    }
  }
  return out
}

interface Found {
  /** Collection name -> files that reference it. */
  names: Map<string, Set<string>>
  /** `.collection(<something not resolvable to a string>)` call sites. */
  dynamic: { file: string; expression: string }[]
}

function scan(): Found {
  const names = new Map<string, Set<string>>()
  const dynamic: Found['dynamic'] = []
  const files = sourceFiles(SRC)

  // Constants that are exported and imported elsewhere
  // (`SUBSCRIBERS_COLLECTION`). Only used when the file has no constant of
  // that name of its own, and only for names defined exactly once.
  const exportedConstants = new Map<string, string | null>()
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const m of text.matchAll(/\bexport\s+const\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(['"`])([^'"`]+)\2/g)) {
      exportedConstants.set(m[1]!, exportedConstants.has(m[1]!) ? null : m[3]!)
    }
  }

  const note = (name: string, file: string) => {
    if (!names.has(name)) names.set(name, new Set())
    names.get(name)!.add(file)
  }

  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    if (!/\.collection(Group)?\(/.test(text)) continue
    const rel = relative(SRC, file).split(sep).join('/')

    // `const COLLECTION = 'newsletterSubscribers'` and the like.
    const constants = new Map<string, string>()
    for (const m of text.matchAll(/\bconst\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(['"`])([^'"`]+)\2/g)) {
      constants.set(m[1]!, m[3]!)
    }

    for (const m of text.matchAll(/\.collection(?:Group)?\(\s*([^)]*?)\s*\)/g)) {
      const arg = m[1]!
      // `.collection()` written in prose, in a comment.
      if (arg === '') continue
      const literal = /^(['"`])([^'"`]+)\1$/.exec(arg)
      if (literal) {
        note(literal[2]!, rel)
        continue
      }
      const resolved = constants.get(arg) ?? exportedConstants.get(arg)
      if (resolved) {
        note(resolved, rel)
        continue
      }
      dynamic.push({ file: rel, expression: arg })
    }
  }
  return { names, dynamic }
}

/**
 * Call sites whose collection name is a variable. Each is allowed only where
 * the name is one of a fixed set that also appears literally in the same
 * module (`sync.ts` takes 'favorites' | 'bundle') or where the module is the
 * generic path-based store this feature is built on. A dynamic call anywhere
 * else could open a collection this scan cannot see.
 */
const DYNAMIC_ALLOWED = new Set(['lib/firebase/sync.ts', 'lib/account/firestore-store.ts'])

const found = scan()

describe('collection policy (the drift guard)', () => {
  test('the scan finds the collections we know exist', () => {
    // Guards the guard: a regex that silently matches nothing would make
    // every other test here pass vacuously.
    for (const known of ['users', 'teams', 'purchases', 'passkeys', 'newsletterSubscribers']) {
      assert.ok(found.names.has(known), `scan did not find "${known}" — has the scan broken?`)
    }
    assert.ok(found.names.size >= 15, `only ${found.names.size} collections found`)
  })

  test('every collection the code touches is classified', () => {
    const unclassified = [...found.names.keys()].filter((name) => !(name in COLLECTION_POLICY))
    assert.deepEqual(
      unclassified,
      [],
      `These Firestore collections are read or written but have no entry in ` +
        `src/lib/account/policy.ts: ${unclassified
          .map((n) => `${n} (${[...found.names.get(n)!].join(', ')})`)
          .join('; ')}. ` +
        `Decide what happens to them when an account is deleted or exported, and ` +
        `add them to COLLECTION_POLICY (and to the deletion steps / export if personal).`,
    )
  })

  test('the table has no stale entries', () => {
    // `legacy` entries are the exception on purpose: the code stopped
    // touching them but rows written earlier are still in production.
    const stale = Object.entries(COLLECTION_POLICY)
      .filter(([name, policy]) => !policy.legacy && !found.names.has(name))
      .map(([name]) => name)
    assert.deepEqual(
      stale,
      [],
      `policy.ts lists collections no source file references any more: ${stale.join(', ')}. ` +
        `If old rows may still exist, mark the entry legacy: true.`,
    )
  })

  test('a legacy entry really is unreferenced (otherwise it is not legacy)', () => {
    const wronglyLegacy = Object.entries(COLLECTION_POLICY)
      .filter(([name, policy]) => policy.legacy && found.names.has(name))
      .map(([name]) => name)
    assert.deepEqual(wronglyLegacy, [], `still in use, so not legacy: ${wronglyLegacy.join(', ')}`)
  })

  test('dynamic collection names only appear where they are accounted for', () => {
    const unexpected = found.dynamic.filter((d) => !DYNAMIC_ALLOWED.has(d.file))
    assert.deepEqual(
      unexpected,
      [],
      `A collection name that is a variable cannot be checked against the policy. ` +
        `Use a string literal, or add the file to DYNAMIC_ALLOWED with a reason: ` +
        unexpected.map((d) => `${d.file}: .collection(${d.expression})`).join('; '),
    )
  })

  test('every entry states where it lives, what happens, and why', () => {
    for (const [name, policy] of Object.entries(COLLECTION_POLICY)) {
      assert.ok(policy.where.length > 0, `${name}: missing "where"`)
      assert.ok(policy.reason.trim().length >= 20, `${name}: reason is too thin to be a reason`)
      assert.ok(
        ['delete', 'pseudonymise', 'ignore'].includes(policy.action),
        `${name}: unknown action "${policy.action}"`,
      )
    }
  })

  test('deleted, retained and ignored are disjoint and together cover the table', () => {
    const all = new Set([...DELETED_COLLECTIONS, ...RETAINED_COLLECTIONS, ...IGNORED_COLLECTIONS])
    assert.equal(
      all.size,
      DELETED_COLLECTIONS.length + RETAINED_COLLECTIONS.length + IGNORED_COLLECTIONS.length,
    )
    assert.deepEqual([...all].sort(), Object.keys(COLLECTION_POLICY).sort())
  })

  test('only purchase records and webhook claims are retained, as /privacy says', () => {
    // A change here is a change to what the privacy policy promises. It should
    // be a deliberate edit to both, not a side effect.
    assert.deepEqual([...RETAINED_COLLECTIONS].sort(), ['purchases', 'webhookEvents'])
  })

  test('the deletion plan covers exactly what the table says is deleted or retained', () => {
    const noStore = new Proxy({}, { get: () => () => Promise.resolve(null) }) as AccountStore
    const steps = buildDeletionSteps(noStore, { uid: 'u', email: 'a@b.co', now: new Date(0) })
    const covered = new Set(steps.flatMap((s) => s.covers))

    const expected = new Set([...DELETED_COLLECTIONS, ...RETAINED_COLLECTIONS])
    const missing = [...expected].filter((name) => !covered.has(name))
    const extra = [...covered].filter((name) => !expected.has(name))
    assert.deepEqual(missing, [], `no deletion step covers: ${missing.join(', ')}`)
    assert.deepEqual(extra, [], `deletion steps claim collections the policy does not delete: ${extra.join(', ')}`)
  })

  test('the sign-in account is deleted last, after sessions are revoked', () => {
    const noStore = new Proxy({}, { get: () => () => Promise.resolve(null) }) as AccountStore
    const ids = buildDeletionSteps(noStore, { uid: 'u', email: 'a@b.co', now: new Date(0) }).map(
      (s) => s.id,
    )
    assert.equal(ids.at(-1), 'auth-account')
    assert.equal(ids.at(-2), 'sessions')
    // The profile is what earlier steps read from; it goes after all of them.
    assert.ok(ids.indexOf('profile') > ids.indexOf('billing-records'))
    assert.ok(ids.indexOf('profile') > ids.indexOf('api-key'))
    assert.ok(ids.indexOf('profile') > ids.indexOf('workspaces'))
    assert.ok(ids.indexOf('profile') > ids.indexOf('mailing-list'))
  })

  test('every exported collection is tied to a section of the download', () => {
    for (const name of EXPORTED_COLLECTIONS) {
      assert.ok(EXPORT_SECTION_FOR[name], `"${name}" is marked exported but no export section carries it`)
    }
    for (const name of Object.keys(EXPORT_SECTION_FOR)) {
      assert.ok(
        EXPORTED_COLLECTIONS.includes(name),
        `"${name}" maps to an export section but policy.ts says it is not exported`,
      )
    }
  })

  test('everything not exported is either ignored or explained in the file', () => {
    const notExported = Object.entries(COLLECTION_POLICY)
      .filter(([, p]) => !p.exported)
      .map(([name]) => name)
    // usage and rateLimits hold nothing tied to a person; webauthnChallenges
    // is a five-minute one-shot. Anything else joining this list deserves a
    // second look.
    assert.deepEqual(notExported.sort(), ['rateLimits', 'usage', 'webauthnChallenges'])
    assert.ok(NOT_EXPORTED.length > 0)
    for (const item of NOT_EXPORTED) {
      assert.ok(item.what && item.why.length >= 20, `NOT_EXPORTED "${item.what}" needs a real reason`)
    }
  })
})
