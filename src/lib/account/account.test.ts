import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { AccountStore, AuthRecord, Doc, MailRemoval } from './store'
import { confirmationMatches, normaliseEmail } from './confirm'
import { buildDeletionSteps, executeSteps, subscriberDocId } from './deletion'
import { EXPORT_SECTION_FOR, gatherExport, exportFileName } from './export'
import { EXPORTED_COLLECTIONS } from './policy'
import { plainDoc, toPlain } from './serialize'
import {
  RECURRING_LIVE_STATUSES,
  activeSubscriptions,
  findBlockers,
  loadTeams,
  planTeamAction,
  purchaseTombstone,
  redactedEventPatch,
  refundMarker,
  sortOrders,
  toOrderRow,
  webhookEventPaths,
  workspaceIsLive,
  type TeamView,
} from './billing'
import {
  PORTAL_FAILURES,
  classifyPortalError,
  customerRefs,
  isCustomerMissing,
  portalOffered,
  statusOf,
} from './portal'
import {
  ACCOUNT_LIMITS,
  dayKey,
  decide,
  limitDocPath,
  secondsUntilReset,
} from './limits'

/* ------------------------------------------------------------------ *
 *  An in-memory AccountStore
 * ------------------------------------------------------------------ */

class MemoryStore implements AccountStore {
  docs = new Map<string, Record<string, unknown>>()
  auth = new Map<string, AuthRecord>()
  /** Every mutating call, in order, so tests can assert on sequence. */
  calls: string[] = []
  revoked: string[] = []
  mail: MailRemoval | Error = 'removed'
  /** Fail the next call whose `op` and path match, once. */
  failOnce: { op: string; pathIncludes: string } | null = null

  set(path: string, data: Record<string, unknown>) {
    this.docs.set(path, data)
    return this
  }

  private maybeFail(op: string, path: string) {
    if (this.failOnce && this.failOnce.op === op && path.includes(this.failOnce.pathIncludes)) {
      this.failOnce = null
      throw new Error(`injected failure in ${op}(${path})`)
    }
  }

  private doc(path: string): Doc {
    const segments = path.split('/')
    return { id: segments[segments.length - 1]!, path, data: structuredCloneSafe(this.docs.get(path)!) }
  }

  async getDoc(path: string) {
    return this.docs.has(path) ? this.doc(path) : null
  }

  async list(path: string, where?: Record<string, unknown>) {
    const depth = path.split('/').length
    return [...this.docs.keys()]
      .filter((p) => p.startsWith(`${path}/`) && p.split('/').length === depth + 1)
      .map((p) => this.doc(p))
      .filter((d) => Object.entries(where ?? {}).every(([k, v]) => d.data[k] === v))
  }

  async listSubcollections(path: string) {
    const depth = path.split('/').length
    return [
      ...new Set(
        [...this.docs.keys()]
          .filter((p) => p.startsWith(`${path}/`))
          .map((p) => p.split('/')[depth]!),
      ),
    ]
  }

  async patch(path: string, fields: Record<string, unknown>) {
    this.maybeFail('patch', path)
    const existing = this.docs.get(path)
    if (!existing) return
    this.calls.push(`patch ${path}`)
    for (const [k, v] of Object.entries(fields)) {
      if (v === undefined) delete existing[k]
      else existing[k] = v
    }
  }

  async remove(path: string) {
    this.maybeFail('remove', path)
    this.calls.push(`remove ${path}`)
    this.docs.delete(path)
  }

  async removeWhere(path: string, where: Record<string, unknown>) {
    this.maybeFail('removeWhere', path)
    const matches = await this.list(path, where)
    for (const d of matches) this.docs.delete(d.path)
    if (matches.length) this.calls.push(`removeWhere ${path}`)
    return matches.length
  }

  async removeTree(path: string) {
    this.maybeFail('removeTree', path)
    this.calls.push(`removeTree ${path}`)
    for (const p of [...this.docs.keys()]) {
      if (p === path || p.startsWith(`${path}/`)) this.docs.delete(p)
    }
  }

  async leaveTeam(teamId: string, uid: string) {
    const member = `teams/${teamId}/members/${uid}`
    if (!this.docs.has(member)) return
    this.calls.push(`leaveTeam ${teamId}`)
    this.docs.delete(member)
    const team = this.docs.get(`teams/${teamId}`)
    if (team) {
      const used = typeof team.seatsUsed === 'number' ? team.seatsUsed : 1
      team.seatsUsed = Math.max(1, used - 1)
    }
  }

  async getAuthRecord(uid: string) {
    return this.auth.get(uid) ?? null
  }

  async revokeSessions(uid: string) {
    this.maybeFail('revokeSessions', uid)
    this.calls.push('revokeSessions')
    this.revoked.push(uid)
  }

  async deleteAuthUser(uid: string) {
    this.maybeFail('deleteAuthUser', uid)
    this.calls.push('deleteAuthUser')
    this.auth.delete(uid)
  }

  async removeMailContact() {
    this.calls.push('removeMailContact')
    if (this.mail instanceof Error) throw this.mail
    return this.mail
  }
}

function structuredCloneSafe<T>(value: T): T {
  // Dates survive structuredClone; class instances would not, and there are none.
  return structuredClone(value)
}

const UID = 'u1'
const OTHER = 'u2'
const EMAIL = 'ada@example.com'
const NOW = new Date('2026-09-21T10:00:00.000Z')

/** One account with something in every collection, plus a bystander. */
function seeded(): MemoryStore {
  const s = new MemoryStore()
  const created = new Date('2026-01-02T03:04:05.000Z')
  const hash = subscriberDocId(EMAIL)

  s.auth.set(UID, {
    uid: UID,
    email: 'Ada@Example.com',
    displayName: 'Ada',
    emailVerified: true,
    createdAt: created.toISOString(),
    lastSignInAt: NOW.toISOString(),
    providers: ['password'],
  })
  s.auth.set(OTHER, {
    uid: OTHER,
    email: 'bob@example.com',
    displayName: 'Bob',
    emailVerified: false,
    createdAt: null,
    lastSignInAt: null,
    providers: ['password'],
  })

  s.set(`users/${UID}`, {
    email: EMAIL,
    name: 'Ada',
    createdAt: created,
    proLicense: true,
    polarCustomerId: 'cus_1',
    credits: { purchased: 500 },
    apiKey: {
      hash: 'API-KEY-HASH-SECRET',
      prefix: 'hl_live_abcd…',
      createdAt: created,
      lastUsedAt: null,
    },
    teamIds: ['t_owned', 't_member'],
    plusStatus: 'canceled',
    plusSubscriptionId: 'sub_plus',
  })
  s.set(`users/${UID}/favorites/a`, { effectId: 'glow', position: 0 })
  s.set(`users/${UID}/bundle/b`, { id: 'card', addedAt: created })
  s.set(`users/${UID}/collections/c`, { id: 'c', name: 'Hero ideas', items: [] })
  s.set(`users/${UID}/brandPresets/bp`, { id: 'bp', name: 'Mint', hue: 160 })
  s.set(`users/${UID}/toolPresets/tp`, { id: 'tp', tool: 'spacing', name: 'Tight' })
  s.set(`users/${UID}/creditLedger/o1`, { credits: 500, packId: 'credits-500', polarOrderId: 'o1' })
  s.set(`users/${UID}/renewals/o2`, { polarOrderId: 'o2', extendedTo: created })
  // A subcollection nobody has taught the exporter about yet.
  s.set(`users/${UID}/notes/n1`, { text: 'remember this' })

  s.set('passkeys/pk1', {
    uid: UID,
    publicKey: 'PASSKEY-PUBLIC-KEY-SECRET',
    counter: 7,
    transports: ['internal'],
    name: 'MacBook',
    deviceType: 'multiDevice',
    backedUp: true,
    createdAt: created,
    lastUsedAt: null,
  })
  s.set('passkeys/pk-other', { uid: OTHER, publicKey: 'x', name: 'Bob key' })
  s.set('webauthnChallenges/ch1', { uid: UID, challenge: 'zzz' })

  s.set('quotas/2026-09-20__eu_u1', { day: '2026-09-20', subject: UID, kind: 'user', action: 'bundle-zip', count: 2 })
  s.set('quotas/2026-09-20__ea_anon', { day: '2026-09-20', subject: 'abc123', kind: 'anonymous', count: 1 })

  s.set('apiKeys/API-KEY-HASH-SECRET', { userId: UID, createdAt: created })

  s.set('purchases/o1', {
    userId: UID,
    plan: 'pro',
    interval: 'one_time',
    amountCents: 7900,
    currency: 'usd',
    polarOrderId: 'o1',
    polarCheckoutId: 'co1',
    packId: null,
    credits: null,
    createdAt: created,
  })
  s.set('purchases/o2', {
    userId: UID,
    plan: 'studio',
    interval: 'one_time',
    amountCents: 19900,
    currency: 'usd',
    polarOrderId: 'o2',
    createdAt: new Date('2026-03-01T00:00:00Z'),
    refundedAt: new Date('2026-03-05T00:00:00Z'),
  })
  s.set('purchases/o9', { userId: OTHER, plan: 'pro', amountCents: 7900, currency: 'usd', createdAt: created })
  s.set('polarCustomers/cus_1', { userId: UID })

  const ev = (type: string, id: string) => `webhookEvents/${encodeURIComponent(`${type}:${id}`)}`
  s.set(ev('order.paid', 'o1'), {
    polarEventId: 'order.paid:o1',
    type: 'order.paid',
    payload: JSON.stringify({ customer: { name: 'Ada Lovelace', email: EMAIL }, amount: 7900 }),
    receivedAt: created,
  })
  s.set(ev('order.paid', 'o9'), {
    polarEventId: 'order.paid:o9',
    type: 'order.paid',
    payload: JSON.stringify({ customer: { name: 'Bob', email: 'bob@example.com' } }),
    receivedAt: created,
  })

  s.set(`subscribers/${hash}`, { email: EMAIL, source: 'landing', unsubscribeToken: 'UNSUB-TOKEN-SECRET', createdAt: created })
  s.set(`newsletterSubscribers/${hash}`, {
    email: EMAIL,
    source: 'landing',
    status: 'subscribed',
    consentedTo: 'Four emails over about a month.',
    unsubscribeToken: 'UNSUB-TOKEN-SECRET-2',
    createdAt: created,
  })

  s.set('feedback/f1', {
    artifactId: 'glow',
    level: 'effect',
    kind: 'problem',
    message: 'The glow flickers in Safari.',
    email: EMAIL,
    ipHash: 'IP-HASH-SECRET',
    createdAt: created,
  })
  s.set('feedback/f2', { artifactId: 'glow', kind: 'problem', message: 'Bob says hi', email: 'bob@example.com' })
  s.set('feedback/f3', { artifactId: 'glow', kind: 'vote', ipHash: 'someone' })

  s.set(`collectionShares/${UID}__c`, {
    uid: UID,
    collectionId: 'c',
    token: 'SHARE-TOKEN-SECRET',
    createdAt: created,
  })
  s.set('sharedCollections/sharehash', { uid: UID, collectionId: 'c', createdAt: created })
  s.set(`collectionShares/${OTHER}__c`, { uid: OTHER, collectionId: 'c', token: 'bobs', createdAt: created })

  // A workspace the user owns alone.
  s.set('teams/t_owned', {
    name: 'Solo studio',
    kind: 'studio',
    ownerId: UID,
    polarOrderId: 'o2',
    subscriptionStatus: 'lifetime',
    seats: 10,
    seatsUsed: 1,
    inviteCode: 'INVITE-CODE-OWNED',
    createdAt: created,
  })
  s.set(`teams/t_owned/members/${UID}`, { userId: UID, role: 'owner', joinedAt: created })
  s.set('teams/t_owned/brandPresets/x', { id: 'x', createdBy: UID })

  // A workspace somebody else owns.
  s.set('teams/t_member', {
    name: 'Bob co',
    kind: 'team',
    ownerId: OTHER,
    polarSubscriptionId: 'sub_bob',
    subscriptionStatus: 'active',
    seats: 5,
    seatsUsed: 2,
    inviteCode: 'INVITE-CODE-MEMBER',
    createdAt: created,
  })
  s.set(`teams/t_member/members/${OTHER}`, { userId: OTHER, role: 'owner', joinedAt: created })
  s.set(`teams/t_member/members/${UID}`, { userId: UID, role: 'member', joinedAt: created })
  s.set('teams/t_member/brandPresets/y', { id: 'y', createdBy: UID })
  s.set('teams/t_member/brandPresets/z', { id: 'z', createdBy: OTHER })

  return s
}

function get(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => (acc as Record<string, unknown> | undefined)?.[key], obj)
}

function isEmpty(value: unknown): boolean {
  if (value == null) return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/* ------------------------------------------------------------------ *
 *  Confirmation
 * ------------------------------------------------------------------ */

describe('confirmationMatches', () => {
  test('is case-insensitive and ignores surrounding whitespace', () => {
    assert.ok(confirmationMatches('ADA@example.COM', 'ada@example.com'))
    assert.ok(confirmationMatches('  ada@example.com \n', 'Ada@Example.com'))
  })

  test('rejects a different address, a prefix and an empty string', () => {
    assert.ok(!confirmationMatches('ada@example.org', 'ada@example.com'))
    assert.ok(!confirmationMatches('ada@example.co', 'ada@example.com'))
    assert.ok(!confirmationMatches('', 'ada@example.com'))
  })

  test('cannot be satisfied when the account has no email', () => {
    assert.ok(!confirmationMatches('', ''))
    assert.ok(!confirmationMatches('anything', ''))
    assert.ok(!confirmationMatches('anything', null))
    assert.ok(!confirmationMatches('anything', undefined))
  })

  test('rejects non-string input rather than coercing it', () => {
    assert.ok(!confirmationMatches(null, 'ada@example.com'))
    assert.ok(!confirmationMatches(['ada@example.com'], 'ada@example.com'))
    assert.ok(!confirmationMatches({ toString: () => 'ada@example.com' }, 'ada@example.com'))
  })

  test('normalises Unicode so a pasted look-alike form still matches', () => {
    // Fullwidth "a" folds to "a" under NFKC.
    assert.equal(normaliseEmail('ａda@example.com'), 'ada@example.com')
  })
})

/* ------------------------------------------------------------------ *
 *  Mailing-list ids
 * ------------------------------------------------------------------ */

describe('subscriberDocId', () => {
  test('is the SHA-256 of the trimmed, lowercased address', () => {
    assert.equal(
      subscriberDocId(' Ada@Example.com '),
      'b5fc85e55755f9e0d030a10ab4429b6b2944855f9a0d60077fe832becbc41d72',
    )
  })

  test('agrees with the real mailing-list module, id for id', async () => {
    // The real thing, not a copy of its algorithm. If the signup path ever
    // changes how it derives a document id, deletion would silently stop
    // finding list entries; this is where that becomes a red test instead.
    const real = await import('../firebase/subscribers')
    for (const address of ['ada@example.com', ' Ada@Example.COM ', 'a+tag@sub.example.co.uk']) {
      const normalised = real.normalizeEmail(address)!
      assert.equal(subscriberDocId(address), real.subscriberId(normalised), address)
    }
    assert.equal(real.SUBSCRIBERS_COLLECTION, 'newsletterSubscribers')
  })
})

/* ------------------------------------------------------------------ *
 *  Serialisation
 * ------------------------------------------------------------------ */

describe('toPlain', () => {
  test('turns Dates and Timestamp-likes into ISO strings', () => {
    const stamp = { toDate: () => new Date('2026-01-01T00:00:00.000Z') }
    assert.deepEqual(toPlain({ a: stamp, b: [stamp], c: new Date('2026-02-02T00:00:00Z') }), {
      a: '2026-01-01T00:00:00.000Z',
      b: ['2026-01-01T00:00:00.000Z'],
      c: '2026-02-02T00:00:00.000Z',
    })
  })

  test('removes credential-shaped keys at every depth', () => {
    const out = toPlain({
      apiKey: { hash: 'h', prefix: 'hl_live_x' },
      list: [{ publicKey: 'k', name: 'n' }],
      inviteCode: 'c',
      unsubscribeToken: 't',
      keep: 1,
    })
    assert.deepEqual(out, { apiKey: { prefix: 'hl_live_x' }, list: [{ name: 'n' }], keep: 1 })
  })

  test('drops what it cannot vouch for: bytes, functions, undefined, NaN becomes null', () => {
    const out = plainDoc({
      bytes: Buffer.from('secret'),
      fn: () => 1,
      gone: undefined,
      nan: Number.NaN,
      ok: 'yes',
    })
    assert.deepEqual(out, { nan: null, ok: 'yes' })
  })
})

/* ------------------------------------------------------------------ *
 *  Export
 * ------------------------------------------------------------------ */

describe('gatherExport', () => {
  test('fills the section for every collection the policy says is exported', async () => {
    const doc = await gatherExport(seeded(), UID, NOW)
    for (const name of EXPORTED_COLLECTIONS) {
      const section = EXPORT_SECTION_FOR[name]!
      assert.ok(!isEmpty(get(doc, section)), `"${name}" is exported but "${section}" came back empty`)
    }
  })

  test('contains no secret anywhere in the serialised output', async () => {
    const text = JSON.stringify(await gatherExport(seeded(), UID, NOW))
    for (const secret of [
      'API-KEY-HASH-SECRET',
      'PASSKEY-PUBLIC-KEY-SECRET',
      'UNSUB-TOKEN-SECRET',
      'INVITE-CODE-OWNED',
      'INVITE-CODE-MEMBER',
      'IP-HASH-SECRET',
      'SHARE-TOKEN-SECRET',
    ]) {
      assert.ok(!text.includes(secret), `the export leaked ${secret}`)
    }
  })

  test('describes an API key by prefix and dates only', async () => {
    const doc = await gatherExport(seeded(), UID, NOW)
    assert.equal((doc.apiKey as Record<string, unknown>).prefix, 'hl_live_abcd…')
    assert.ok(!('hash' in (doc.apiKey as object)))
  })

  test('describes a passkey by name and dates, never key material', async () => {
    const doc = await gatherExport(seeded(), UID, NOW)
    assert.equal(doc.passkeys.length, 1)
    const row = doc.passkeys[0]!
    assert.equal(row.name, 'MacBook')
    assert.equal(row.deviceType, 'multiDevice')
    assert.ok(!('publicKey' in row) && !('counter' in row))
  })

  test('writes timestamps as ISO strings', async () => {
    const doc = await gatherExport(seeded(), UID, NOW)
    assert.equal((doc.profile as Record<string, unknown>).createdAt, '2026-01-02T03:04:05.000Z')
    assert.equal(doc.generatedAt, NOW.toISOString())
  })

  test('includes unknown user subcollections instead of skipping them', async () => {
    const doc = await gatherExport(seeded(), UID, NOW)
    assert.deepEqual(doc.otherUserData.notes, [{ id: 'n1', text: 'remember this' }])
  })

  test('includes only the caller\'s own data', async () => {
    const text = JSON.stringify(await gatherExport(seeded(), UID, NOW))
    assert.ok(!text.includes(OTHER), 'another account id appeared in the export')
    assert.ok(!text.includes('bob@example.com'))
    assert.ok(!text.includes('Bob says hi'), "another person's feedback appeared")
    assert.ok(!text.includes('Bob key'), "another person's passkey appeared")
  })

  test('shows a workspace with a member count, not other members', async () => {
    const doc = await gatherExport(seeded(), UID, NOW)
    const member = doc.workspaces.find((w) => w.id === 't_member')!
    assert.equal(member.yourRole, 'member')
    assert.equal(member.memberCount, 2)
    assert.deepEqual(
      (member.sharedBrandPresetsYouCreated as { id: string }[]).map((p) => p.id),
      ['y'],
    )
    assert.ok(!('polarSubscriptionId' in member), "a member is not shown the owner's billing ids")
    const owned = doc.workspaces.find((w) => w.id === 't_owned')!
    assert.equal(owned.yourRole, 'owner')
    assert.equal(owned.polarOrderId, 'o2')
  })

  test('carries the parsed billing payload for the account\'s own orders only', async () => {
    const doc = await gatherExport(seeded(), UID, NOW)
    assert.equal(doc.billing.events.length, 1)
    assert.deepEqual((doc.billing.events[0]!.payload as { customer: { name: string } }).customer.name, 'Ada Lovelace')
    assert.deepEqual(doc.billing.orders.map((o) => o.id).sort(), ['o1', 'o2'])
  })

  test('says what it leaves out', async () => {
    const doc = await gatherExport(seeded(), UID, NOW)
    assert.ok(doc.notIncluded.some((n) => /password/i.test(n.what)))
  })

  test('produces something for an account with no profile document', async () => {
    const s = new MemoryStore()
    s.auth.set('ghost', {
      uid: 'ghost',
      email: 'g@x.co',
      displayName: null,
      emailVerified: false,
      createdAt: null,
      lastSignInAt: null,
      providers: [],
    })
    const doc = await gatherExport(s, 'ghost', NOW)
    assert.equal(doc.profile, null)
    assert.deepEqual(doc.favorites, [])
  })

  test('names the file by date and nothing else', () => {
    assert.equal(exportFileName(NOW), 'hoverlab-data-2026-09-21.json')
  })
})

/* ------------------------------------------------------------------ *
 *  Deletion
 * ------------------------------------------------------------------ */

function plan(store: MemoryStore) {
  return buildDeletionSteps(store, { uid: UID, email: 'Ada@Example.com', now: NOW })
}

describe('deletion', () => {
  test('removes everything keyed by the account, and nothing that is not theirs', async () => {
    const s = seeded()
    const result = await executeSteps(plan(s))
    assert.equal(result.ok, true, JSON.stringify(result.steps.filter((x) => x.status !== 'done')))
    assert.ok(result.steps.every((step) => step.status === 'done'))

    // No remaining document lives under, or points at, the deleted uid.
    for (const [path, data] of s.docs) {
      assert.ok(!path.split('/').includes(UID), `${path} survived under the uid`)
      for (const [key, value] of Object.entries(data)) {
        assert.notEqual(value, UID, `${path}.${key} still points at the deleted account`)
      }
    }

    assert.ok(![...s.docs.keys()].some((p) => p.includes(`${UID}__`)), 'a share row survived')

    // Feedback tied to the address goes; anonymous feedback and other
    // people's stay.
    assert.ok(!s.docs.has('feedback/f1'))
    assert.ok(s.docs.has('feedback/f2'))
    assert.ok(s.docs.has('feedback/f3'))
    assert.ok(s.docs.has(`collectionShares/${OTHER}__c`))

    // The bystander is untouched.
    assert.ok(s.docs.has('passkeys/pk-other'))
    assert.ok(s.docs.has('purchases/o9'))
    assert.equal(s.docs.get('purchases/o9')!.userId, OTHER)
    assert.ok(s.docs.has('quotas/2026-09-20__ea_anon'))
    assert.ok(s.auth.has(OTHER))
  })

  test('deletes the sign-in account last, after sessions are revoked', async () => {
    const s = seeded()
    await executeSteps(plan(s))
    assert.equal(s.calls.at(-1), 'deleteAuthUser')
    assert.equal(s.calls.at(-2), 'revokeSessions')
    assert.ok(s.calls.indexOf('removeTree users/u1') < s.calls.indexOf('revokeSessions'))
    assert.ok(!s.auth.has(UID))
  })

  test('keeps purchase records, without the person, and keeps what tax needs', async () => {
    const s = seeded()
    await executeSteps(plan(s))
    const kept = s.docs.get('purchases/o1')!
    assert.equal(kept.userId, null)
    assert.equal(kept.plan, 'pro')
    assert.equal(kept.amountCents, 7900)
    assert.equal(kept.currency, 'usd')
    assert.equal(kept.polarOrderId, 'o1')
    assert.ok(kept.createdAt instanceof Date)
    assert.equal(kept.retainedFor, 'tax-records')
    assert.ok(kept.accountDeletedAt)
    // The refund status of a kept record must survive.
    assert.ok(s.docs.get('purchases/o2')!.refundedAt)
    for (const key of ['name', 'email', 'customerEmail', 'billingAddress']) {
      assert.ok(!(key in kept))
    }
  })

  test('blanks the stored Polar payload but keeps the idempotency claim', async () => {
    const s = seeded()
    await executeSteps(plan(s))
    const claim = s.docs.get(`webhookEvents/${encodeURIComponent('order.paid:o1')}`)!
    assert.equal(claim.payload, null)
    assert.equal(claim.polarEventId, 'order.paid:o1')
    assert.equal(claim.type, 'order.paid')
    assert.ok(!JSON.stringify(claim).includes('Ada'))
    // Somebody else's claim keeps its payload.
    const other = s.docs.get(`webhookEvents/${encodeURIComponent('order.paid:o9')}`)!
    assert.ok(typeof other.payload === 'string' && other.payload.includes('Bob'))
  })

  test('removes the mailing-list entries whatever case the address was stored in', async () => {
    const s = seeded()
    await executeSteps(plan(s))
    const id = subscriberDocId(EMAIL)
    assert.ok(!s.docs.has(`subscribers/${id}`))
    assert.ok(!s.docs.has(`newsletterSubscribers/${id}`))
  })

  test('revokes the licence key index as well as the profile copy', async () => {
    const s = seeded()
    await executeSteps(plan(s))
    assert.ok(!s.docs.has('apiKeys/API-KEY-HASH-SECRET'))
  })

  test('closes a workspace owned alone, and leaves one it only belongs to', async () => {
    const s = seeded()
    await executeSteps(plan(s))
    assert.ok(![...s.docs.keys()].some((p) => p.startsWith('teams/t_owned')))
    const team = s.docs.get('teams/t_member')!
    assert.equal(team.seatsUsed, 1, 'the seat was given back')
    assert.ok(!s.docs.has(`teams/t_member/members/${UID}`))
    assert.equal(s.docs.get('teams/t_member/brandPresets/y')!.createdBy, null)
    assert.equal(s.docs.get('teams/t_member/brandPresets/z')!.createdBy, OTHER)
  })

  test('is idempotent: running the whole plan again on a finished account succeeds', async () => {
    const s = seeded()
    const first = await executeSteps(plan(s))
    assert.equal(first.ok, true)
    const snapshot = JSON.stringify([...s.docs.entries()])

    const second = await executeSteps(plan(s))
    assert.equal(second.ok, true)
    assert.equal(JSON.stringify([...s.docs.entries()]), snapshot, 'a second run changed data')
    assert.equal(s.docs.get('teams/t_member')!.seatsUsed, 1, 'a second run gave a second seat back')
  })

  test('a failure stops the run, skips the rest, and never touches the sign-in account', async () => {
    const s = seeded()
    s.failOnce = { op: 'removeTree', pathIncludes: 'users/u1' }
    const result = await executeSteps(plan(s))

    assert.equal(result.ok, false)
    const byId = Object.fromEntries(result.steps.map((step) => [step.id, step]))
    assert.equal(byId['profile']!.status, 'failed')
    assert.match(byId['profile']!.error!, /injected failure/)
    assert.equal(byId['sessions']!.status, 'skipped')
    assert.equal(byId['auth-account']!.status, 'skipped')
    assert.equal(byId['billing-records']!.status, 'done')
    // The whole plan is accounted for, in order.
    assert.equal(result.steps.length, plan(s).length)

    assert.ok(s.auth.has(UID), 'the account must still exist so the person can retry')
    assert.ok(s.docs.has(`users/${UID}`))
    assert.ok(!s.calls.includes('deleteAuthUser'))
  })

  test('is resumable: asking again after a failure finishes the job', async () => {
    const s = seeded()
    s.failOnce = { op: 'removeTree', pathIncludes: 'users/u1' }
    assert.equal((await executeSteps(plan(s))).ok, false)

    const retry = await executeSteps(plan(s))
    assert.equal(retry.ok, true)
    assert.ok(!s.auth.has(UID))
    assert.ok(!s.docs.has(`users/${UID}`))
    assert.equal(s.docs.get('purchases/o1')!.userId, null)
  })

  test('is resumable from a failure in the middle of the billing step', async () => {
    const s = seeded()
    // Fail while blanking the second-to-last kind of write: the purchase patch.
    s.failOnce = { op: 'patch', pathIncludes: 'purchases/o2' }
    const failed = await executeSteps(plan(s))
    assert.equal(failed.ok, false)
    assert.equal(failed.steps[0]!.status, 'failed')
    assert.equal(s.docs.get('purchases/o2')!.userId, UID, 'not yet detached, so the retry finds it')

    const retry = await executeSteps(plan(s))
    assert.equal(retry.ok, true)
    assert.equal(s.docs.get('purchases/o2')!.userId, null)
    assert.equal(s.docs.get(`webhookEvents/${encodeURIComponent('order.paid:o1')}`)!.payload, null)
  })

  test('a mailing-provider failure is reported but does not trap the person in the account', async () => {
    const s = seeded()
    s.mail = new Error('Resend answered 401 when asked to remove the contact.')
    const result = await executeSteps(plan(s))
    assert.equal(result.ok, true)
    assert.equal(result.steps.find((x) => x.id === 'mail-provider')!.status, 'warning')
    assert.equal(result.manualFollowUp.length, 1)
    assert.match(result.manualFollowUp[0]!, /401/)
    assert.ok(!s.auth.has(UID))
  })

  test('an owner with other members in a lapsed workspace hands it on ownerless', async () => {
    const s = seeded()
    s.set('teams/t_lapsed', {
      name: 'Old team',
      kind: 'team',
      ownerId: UID,
      subscriptionStatus: 'revoked',
      seatsUsed: 2,
      inviteCode: 'LAPSED',
    })
    s.set(`teams/t_lapsed/members/${UID}`, { userId: UID, role: 'owner' })
    s.set(`teams/t_lapsed/members/${OTHER}`, { userId: OTHER, role: 'member' })
    const result = await executeSteps(plan(s))
    assert.equal(result.ok, true)
    const team = s.docs.get('teams/t_lapsed')!
    assert.equal(team.ownerId, null)
    assert.ok(!('inviteCode' in team))
    assert.ok(s.docs.has(`teams/t_lapsed/members/${OTHER}`))
    assert.ok(!s.docs.has(`teams/t_lapsed/members/${UID}`))
  })
})

/* ------------------------------------------------------------------ *
 *  Blockers
 * ------------------------------------------------------------------ */

function team(id: string, data: Record<string, unknown>, memberIds: string[] = [UID]): TeamView {
  return { id, data, memberIds }
}

describe('findBlockers', () => {
  const owned = (extra: Record<string, unknown>) => ({ ownerId: UID, name: 'Acme', ...extra })

  test('an active recurring Team subscription blocks, and points at billing', () => {
    const blockers = findBlockers({
      uid: UID,
      profile: {},
      teams: [team('t', owned({ polarSubscriptionId: 'sub_1', subscriptionStatus: 'active' }))],
    })
    assert.equal(blockers.length, 1)
    assert.equal(blockers[0]!.code, 'team-subscription')
    assert.match(blockers[0]!.message, /Acme/)
    assert.match(blockers[0]!.message, /billing/i)
  })

  test('past-due still blocks: money is still being chased', () => {
    const blockers = findBlockers({
      uid: UID,
      profile: {},
      teams: [team('t', owned({ polarSubscriptionId: 'sub_1', subscriptionStatus: 'past_due' }))],
    })
    assert.equal(blockers[0]!.code, 'team-subscription')
  })

  test('a cancelled subscription does not block: nothing more will be charged', () => {
    assert.deepEqual(
      findBlockers({
        uid: UID,
        profile: {},
        teams: [team('t', owned({ polarSubscriptionId: 'sub_1', subscriptionStatus: 'canceled' }))],
      }),
      [],
    )
    assert.ok(!RECURRING_LIVE_STATUSES.has('canceled'))
    assert.ok(!RECURRING_LIVE_STATUSES.has('revoked'))
  })

  test('a one-time workspace never counts as recurring', () => {
    assert.deepEqual(
      findBlockers({
        uid: UID,
        profile: {},
        teams: [team('t', owned({ polarOrderId: 'o', subscriptionStatus: 'lifetime' }))],
      }),
      [],
    )
  })

  test('a subscription the person only belongs to is the owner\'s to cancel', () => {
    assert.deepEqual(
      findBlockers({
        uid: UID,
        profile: {},
        teams: [
          team('t', { ownerId: OTHER, polarSubscriptionId: 'sub_1', subscriptionStatus: 'active' }, [OTHER, UID]),
        ],
      }),
      [],
    )
  })

  test('an active Pro+ subscription blocks; a cancelled one does not', () => {
    const live = findBlockers({
      uid: UID,
      profile: { plusStatus: 'active', plusSubscriptionId: 'sub_p' },
      teams: [],
    })
    assert.equal(live[0]!.code, 'plus-subscription')
    assert.deepEqual(
      findBlockers({ uid: UID, profile: { plusStatus: 'canceled', plusSubscriptionId: 'sub_p' }, teams: [] }),
      [],
    )
  })

  test('a live workspace with other people in it blocks; a lone one does not', () => {
    const shared = findBlockers({
      uid: UID,
      profile: {},
      teams: [team('t', owned({ subscriptionStatus: 'lifetime' }), [UID, OTHER, 'u3'])],
    })
    assert.equal(shared[0]!.code, 'workspace-has-members')
    assert.equal((shared[0] as { members: number }).members, 2)

    assert.deepEqual(
      findBlockers({ uid: UID, profile: {}, teams: [team('t', owned({ subscriptionStatus: 'lifetime' }))] }),
      [],
    )
  })

  test('an expired term with other members does not block', () => {
    assert.deepEqual(
      findBlockers({
        uid: UID,
        profile: {},
        teams: [
          team('t', owned({ subscriptionStatus: 'term', currentPeriodEnd: new Date('2020-01-01') }), [UID, OTHER]),
        ],
      }),
      [],
    )
  })

  test('workspaceIsLive follows the same rules as the entitlement check', () => {
    const future = new Date(Date.now() + 86_400_000)
    const past = new Date(Date.now() - 86_400_000)
    assert.ok(workspaceIsLive({ subscriptionStatus: 'active' }))
    assert.ok(workspaceIsLive({ subscriptionStatus: 'lifetime' }))
    assert.ok(workspaceIsLive({ subscriptionStatus: 'term', currentPeriodEnd: future }))
    assert.ok(!workspaceIsLive({ subscriptionStatus: 'term', currentPeriodEnd: past }))
    assert.ok(workspaceIsLive({ subscriptionStatus: 'canceled', currentPeriodEnd: future }))
    assert.ok(!workspaceIsLive({ subscriptionStatus: 'revoked' }))
    assert.ok(!workspaceIsLive({}))
  })

  test('blocks on the seeded store when the owned workspace becomes a live subscription', async () => {
    const s = seeded()
    s.docs.get('teams/t_owned')!.polarSubscriptionId = 'sub_x'
    s.docs.get('teams/t_owned')!.subscriptionStatus = 'active'
    const profile = (await s.getDoc(`users/${UID}`))!.data
    const teams = await loadTeams(s, UID, profile)
    assert.equal(findBlockers({ uid: UID, profile, teams })[0]!.code, 'team-subscription')
    assert.equal(activeSubscriptions({ uid: UID, profile, teams })[0]!.kind, 'team')
  })
})

describe('planTeamAction', () => {
  test('member leaves, lone owner deletes, owner of a shared workspace orphans', () => {
    assert.equal(planTeamAction(UID, team('t', { ownerId: OTHER }, [OTHER, UID])), 'leave')
    assert.equal(planTeamAction(UID, team('t', { ownerId: UID }, [UID])), 'delete')
    assert.equal(planTeamAction(UID, team('t', { ownerId: UID }, [UID, OTHER])), 'orphan')
  })
})

/* ------------------------------------------------------------------ *
 *  Purchases and receipts
 * ------------------------------------------------------------------ */

describe('purchases', () => {
  test('toOrderRow names plans, packs and refunds', () => {
    const paid = toOrderRow({
      id: 'o1',
      data: { plan: 'pro', amountCents: 7900, currency: 'USD', createdAt: new Date('2026-05-01T00:00:00Z') },
    })
    assert.equal(paid.label, 'Pro')
    assert.equal(paid.status, 'paid')
    assert.equal(paid.currency, 'usd')
    assert.equal(paid.date, '2026-05-01T00:00:00.000Z')

    const pack = toOrderRow({
      id: 'o2',
      data: { plan: 'pro', packId: 'credits-500', credits: 500, amountCents: 900, currency: 'usd' },
    })
    assert.equal(pack.label, '500 AI credits')

    const refunded = toOrderRow({
      id: 'o3',
      data: { plan: 'studio', amountCents: 19900, refundedAt: new Date('2026-06-01T00:00:00Z') },
    })
    assert.equal(refunded.status, 'refunded')
    assert.equal(refunded.refundedAt, '2026-06-01T00:00:00.000Z')
  })

  test('toOrderRow survives a malformed document', () => {
    const row = toOrderRow({ id: 'x', data: { plan: 42, amountCents: 'lots', createdAt: 'yesterday' } })
    assert.equal(row.plan, 'pro')
    assert.equal(row.amountCents, 0)
    assert.equal(row.date, null)
  })

  test('sortOrders is newest first with undated rows last', () => {
    const rows = [
      toOrderRow({ id: 'a', data: { createdAt: new Date('2026-01-01') } }),
      toOrderRow({ id: 'b', data: {} }),
      toOrderRow({ id: 'c', data: { createdAt: new Date('2026-03-01') } }),
    ]
    assert.deepEqual(sortOrders(rows).map((r) => r.id), ['c', 'a', 'b'])
  })

  test('refundMarker marks once and is null on a redelivery', () => {
    const stamp = { at: 1 }
    assert.deepEqual(refundMarker({ plan: 'pro' }, stamp), { refundedAt: stamp })
    assert.equal(refundMarker({ plan: 'pro', refundedAt: new Date() }, stamp), null)
  })

  test('purchaseTombstone detaches the owner and deletes personal fields by name', () => {
    const patch = purchaseTombstone('NOW')
    assert.equal(patch.userId, null)
    assert.equal(patch.accountDeletedAt, 'NOW')
    assert.equal(patch.retainedFor, 'tax-records')
    for (const key of ['name', 'email', 'customerName', 'customerEmail', 'billingName', 'billingAddress']) {
      assert.ok(key in patch && patch[key] === undefined, `${key} should be marked for deletion`)
    }
    // Nothing tax needs is in the patch.
    for (const kept of ['plan', 'amountCents', 'currency', 'createdAt', 'polarOrderId']) {
      assert.ok(!(kept in patch))
    }
  })

  test('webhookEventPaths matches the ids the webhook writes', () => {
    const paths = webhookEventPaths({ orders: ['o1'], subscriptions: ['s1'], checkouts: ['c1'], customers: ['k1'] })
    // The webhook does encodeURIComponent(`${event.type}:${event.data.id}`).
    assert.ok(paths.includes(`webhookEvents/${encodeURIComponent('order.paid:o1')}`))
    assert.ok(paths.includes(`webhookEvents/${encodeURIComponent('order.refunded:o1')}`))
    assert.ok(paths.includes(`webhookEvents/${encodeURIComponent('subscription.canceled:s1')}`))
    assert.ok(paths.includes(`webhookEvents/${encodeURIComponent('checkout.updated:c1')}`))
    assert.ok(paths.includes(`webhookEvents/${encodeURIComponent('customer.created:k1')}`))
    assert.equal(new Set(paths).size, paths.length)
    assert.deepEqual(webhookEventPaths({ orders: [''], subscriptions: [], checkouts: [], customers: [] }), [])
  })

  test('redactedEventPatch blanks the payload and keeps nothing personal', () => {
    const patch = redactedEventPatch('NOW')
    assert.equal(patch.payload, null)
    assert.deepEqual(Object.keys(patch).sort(), ['payload', 'redactedAt', 'redactedBecause'])
  })

  test('the webhook uses refundMarker, before its userId early-return', () => {
    const source = readFileSync(
      fileURLToPath(new URL('../../app/api/billing/webhook/route.ts', import.meta.url)),
      'utf8',
    )
    const refunded = source.slice(source.indexOf('async function handleOrderRefunded'))
    const mark = refunded.indexOf('refundMarker(')
    const early = refunded.indexOf('if (!userId) return')
    assert.ok(mark > 0 && early > 0, 'expected both to be present in handleOrderRefunded')
    assert.ok(mark < early, 'a detached purchase must still be marked refunded')
  })
})

/* ------------------------------------------------------------------ *
 *  Billing portal
 * ------------------------------------------------------------------ */

describe('portal', () => {
  const err = (statusCode: number) => Object.assign(new Error('polar'), { statusCode })

  test('401 and 403 (the token lacks the scope) read as "not available yet"', () => {
    for (const code of [401, 403]) {
      const f = classifyPortalError(err(code))
      assert.equal(f.code, 'portal_unavailable')
      assert.equal(f.status, 503)
      assert.match(f.error, /isn't available yet/)
      assert.match(f.error, /email support/i)
    }
  })

  test('404 and 422 read as a customer-linking problem', () => {
    assert.equal(classifyPortalError(err(404)).code, 'no_customer')
    assert.equal(classifyPortalError(err(422)).code, 'no_customer')
    assert.ok(isCustomerMissing(err(404)) && isCustomerMissing(err(422)))
    assert.ok(!isCustomerMissing(err(403)))
  })

  test('429 is a rate limit, 5xx and network errors are upstream', () => {
    assert.equal(classifyPortalError(err(429)).code, 'rate_limited')
    assert.equal(classifyPortalError(err(503)).code, 'upstream')
    assert.equal(classifyPortalError(new Error('fetch failed')).code, 'upstream')
    assert.equal(classifyPortalError(null).code, 'upstream')
  })

  test('every failure carries a message and a sane status', () => {
    for (const f of Object.values(PORTAL_FAILURES)) {
      assert.ok(f.error.length > 20)
      assert.ok(f.status >= 400 && f.status < 600)
    }
  })

  test('statusOf reads statusCode, then status, and nothing else', () => {
    assert.equal(statusOf({ statusCode: 403 }), 403)
    assert.equal(statusOf({ status: 429 }), 429)
    assert.equal(statusOf('403'), null)
    assert.equal(statusOf(undefined), null)
  })

  test('the linked Polar id is tried first, the uid second', () => {
    assert.deepEqual(customerRefs('u1', 'cus_1'), [{ customerId: 'cus_1' }, { externalCustomerId: 'u1' }])
    assert.deepEqual(customerRefs('u1', null), [{ externalCustomerId: 'u1' }])
  })

  test('the button is offered only when billing is configured and something was bought', () => {
    assert.deepEqual(portalOffered({ billingConfigured: true, orderCount: 2 }), { available: true, reason: null })
    assert.deepEqual(portalOffered({ billingConfigured: false, orderCount: 2 }), {
      available: false,
      reason: 'not_configured',
    })
    assert.deepEqual(portalOffered({ billingConfigured: true, orderCount: 0 }), {
      available: false,
      reason: 'no_purchase',
    })
  })
})

/* ------------------------------------------------------------------ *
 *  Rate limits
 * ------------------------------------------------------------------ */

describe('limits', () => {
  test('allows up to the ceiling and refuses after', () => {
    const cap = ACCOUNT_LIMITS.export
    assert.deepEqual(decide('export', 0), { ok: true, used: 1, limit: cap })
    assert.equal(decide('export', cap - 1).ok, true)
    assert.equal(decide('export', cap).ok, false)
  })

  test('deletion allows retries: its ceiling is not the export one', () => {
    assert.ok(ACCOUNT_LIMITS.delete > ACCOUNT_LIMITS.export)
  })

  test('the counter document cannot collide with a meter or another account', () => {
    const a = limitDocPath('u1', 'export', '2026-09-21')
    assert.equal(a, 'quotas/2026-09-21__acct-export_u1')
    assert.notEqual(a, limitDocPath('u2', 'export', '2026-09-21'))
    assert.notEqual(a, limitDocPath('u1', 'delete', '2026-09-21'))
    // Meter documents look like `day__eu_uid`: one letter, u|a, underscore.
    assert.ok(!/__[a-z][ua]_/.test(a.split('/')[1]!))
  })

  test('the reset is the next UTC midnight and never zero', () => {
    assert.equal(dayKey(new Date('2026-09-21T23:59:59Z')), '2026-09-21')
    assert.equal(secondsUntilReset(new Date('2026-09-21T23:59:00Z')), 60)
    assert.equal(secondsUntilReset(new Date('2026-09-21T00:00:00Z')), 86_400)
  })
})
