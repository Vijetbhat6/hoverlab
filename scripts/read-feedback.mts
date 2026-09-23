/**
 * Print recent feedback, newest first.
 *
 *   npx tsx scripts/read-feedback.mts                 # the latest 25
 *   npx tsx scripts/read-feedback.mts --limit 100
 *   npx tsx scripts/read-feedback.mts --reports       # problem reports only, no thumbs
 *   npx tsx scripts/read-feedback.mts --artifact hero-split
 *   npx tsx scripts/read-feedback.mts --json          # machine-readable
 *
 * WHY A SCRIPT AND NOT AN ADMIN PAGE
 *
 * Feedback arrives at a rate a person can read in a terminal, from
 * `/api/feedback` into Firestore `feedback`. An admin UI would be a route
 * behind auth, a role check, a page to keep working — and a public surface
 * that touches personal data (reporters may leave an email). Reading a few
 * documents on the owner's machine, with the owner's credentials, needs none
 * of that. Nothing here is displayed anywhere on the site, by design.
 *
 * It only reads. Needs the same Firebase Admin credentials as the other
 * scripts here (FIREBASE_SERVICE_ACCOUNT_FILE, or the JSON/three-field
 * variants) and refuses loudly, rather than printing nothing, without them.
 *
 * The email, when present, is printed: this is the owner reading their own
 * inbox of reports, and a reply is the reason it was given. `ipHash` is
 * printed short — it is a salted hash, useful only to notice one noisy
 * source, and is not an address.
 */

import { adminDb, isAdminConfigured } from '../src/lib/firebase/admin.ts'

const argv = process.argv.slice(2)

function flag(name: string): string | null {
  const index = argv.indexOf(name)
  if (index === -1) return null
  const value = argv[index + 1]
  if (!value || value.startsWith('--')) {
    console.error(`${name} needs a value.`)
    process.exit(2)
  }
  return value
}

const LIMIT = Math.min(Math.max(Number(flag('--limit') ?? 25) || 25, 1), 500)
const ARTIFACT = flag('--artifact')
const ONLY_REPORTS = argv.includes('--reports')
const AS_JSON = argv.includes('--json')

const LABEL: Record<string, string> = {
  'thumbs-up': 'useful',
  'thumbs-down': 'not useful',
  'broken-preview': 'broken preview',
  'wrong-code': 'wrong code',
  accessibility: 'accessibility',
  other: 'other',
}

interface Row {
  id: string
  when: string
  level: string
  artifactId: string
  kind: string
  message: string
  email: string | null
  ipHash: string | null
}

/** Firestore Timestamp -> ISO, without importing the SDK's class. */
function iso(value: unknown): string {
  const v = value as { toDate?: () => Date } | null
  return v && typeof v.toDate === 'function' ? v.toDate().toISOString() : ''
}

async function main(): Promise<void> {
  if (!isAdminConfigured()) {
    console.error(
      'Firebase Admin credentials are not configured, so the feedback collection cannot be read.\n' +
        'Set FIREBASE_SERVICE_ACCOUNT_FILE (or FIREBASE_SERVICE_ACCOUNT) and try again.',
    )
    process.exit(1)
  }

  // Ordered on the server, filtered here. A `where` on artifactId or kind
  // alongside `orderBy('createdAt')` would need a composite index that does
  // not exist, and the collection is small enough to over-read and filter.
  const over = ARTIFACT || ONLY_REPORTS ? Math.min(LIMIT * 10, 2000) : LIMIT
  const snap = await adminDb()
    .collection('feedback')
    .orderBy('createdAt', 'desc')
    .limit(over)
    .get()

  const rows: Row[] = []
  for (const doc of snap.docs) {
    const data = doc.data()
    const kind = String(data.kind ?? '')
    if (ONLY_REPORTS && kind.startsWith('thumbs-')) continue
    if (ARTIFACT && data.artifactId !== ARTIFACT) continue
    rows.push({
      id: doc.id,
      when: iso(data.createdAt),
      level: String(data.level ?? ''),
      artifactId: String(data.artifactId ?? ''),
      kind,
      message: String(data.message ?? ''),
      email: typeof data.email === 'string' ? data.email : null,
      ipHash: typeof data.ipHash === 'string' ? data.ipHash : null,
    })
    if (rows.length >= LIMIT) break
  }

  if (AS_JSON) {
    console.log(JSON.stringify(rows, null, 2))
    return
  }

  if (rows.length === 0) {
    console.log('No feedback matches.')
    return
  }

  for (const row of rows) {
    const who = row.email ? `  reply-to ${row.email}` : ''
    console.log(
      `${row.when.slice(0, 16).replace('T', ' ')}  ${row.level}/${row.artifactId}  ` +
        `[${LABEL[row.kind] ?? row.kind}]${who}`,
    )
    if (row.message) {
      for (const line of row.message.split('\n')) console.log(`    ${line}`)
    }
  }

  const reports = rows.filter((r) => !r.kind.startsWith('thumbs-')).length
  console.log(`\n${rows.length} shown (${reports} report(s), ${rows.length - reports} thumb(s)).`)
}

main().catch((err) => {
  console.error('[read-feedback] failed:', err)
  process.exit(1)
})
