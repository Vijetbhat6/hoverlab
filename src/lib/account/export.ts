/**
 * Assemble "everything we hold about you" into one JSON document.
 *
 * The design goal is that this cannot quietly fall behind the product. Two
 * mechanisms, both deliberate:
 *
 *  - The user's own subtree is read by LISTING its subcollections, not by
 *    naming the ones we currently know about. A feature that starts saving
 *    something under `users/{uid}/…` next month is in the download the day it
 *    ships; a known section gets a tidy key and anything else lands under
 *    `otherUserData`.
 *
 *  - Everything keyed by uid outside that subtree is a named collection, and
 *    `policy.test.ts` fails the build when a collection exists that the
 *    policy table has not classified. `EXPORT_SECTION_FOR` below ties each
 *    exported collection to the section that carries it, and the test seeds
 *    every one and checks the section is not empty.
 *
 * Secrets are removed by `serialize.ts` (a deny-list, at every depth) and,
 * for the two collections that hold the most sensitive material, by explicit
 * allow-lists here. A passkey document can never leak its public key by
 * gaining a field, because only named fields are copied.
 *
 * Other people's data is not included. A workspace shows how many members
 * it has, not who they are.
 */

import type { AccountStore } from './store'
import { NOT_EXPORTED } from './policy'
import { pick, plainDoc, toPlain } from './serialize'
import { loadTeams, webhookEventPaths } from './billing'
import { subscriberDocId } from './deletion'

export const EXPORT_VERSION = 1

/** Which section of the download carries each exported collection. */
export const EXPORT_SECTION_FOR: Record<string, string> = {
  users: 'profile',
  favorites: 'favorites',
  bundle: 'bundle',
  collections: 'collections',
  toolPresets: 'toolPresets',
  creditLedger: 'creditLedger',
  renewals: 'renewals',
  brandPresets: 'brandPresets',
  teams: 'workspaces',
  members: 'workspaces',
  apiKeys: 'apiKey',
  passkeys: 'passkeys',
  quotas: 'usage',
  polarCustomers: 'billing.polarCustomerIds',
  subscribers: 'newsletter',
  newsletterSubscribers: 'newsletter',
  feedback: 'feedback',
  collectionShares: 'shares',
  sharedCollections: 'shares',
  purchases: 'billing.orders',
  webhookEvents: 'billing.events',
}

/** Subcollections with a tidy top-level key; the rest go under otherUserData. */
const KNOWN_SUBCOLLECTIONS = [
  'favorites',
  'bundle',
  'collections',
  'brandPresets',
  'toolPresets',
  'creditLedger',
  'renewals',
] as const

const PASSKEY_FIELDS = ['name', 'createdAt', 'lastUsedAt', 'deviceType', 'backedUp', 'transports']
const USAGE_FIELDS = ['day', 'action', 'count', 'updatedAt']
const SUBSCRIBER_FIELDS = [
  'email',
  'source',
  'status',
  'confirmed',
  'consentedTo',
  'consentedAt',
  'createdAt',
  'updatedAt',
  'unsubscribedAt',
  'confirmationSent',
  'confirmationSentAt',
  'confirmedAt',
]
const FEEDBACK_FIELDS = ['artifactId', 'level', 'kind', 'message', 'email', 'createdAt']
/** No token: it is the link itself. */
const SHARE_FIELDS = ['collectionId', 'createdAt']

type Row = Record<string, unknown>

export interface ExportDocument {
  exportVersion: number
  generatedAt: string
  about: string
  account: Row | null
  profile: Row | null
  favorites: Row[]
  bundle: Row[]
  collections: Row[]
  brandPresets: Row[]
  toolPresets: Row[]
  creditLedger: Row[]
  renewals: Row[]
  otherUserData: Record<string, Row[]>
  apiKey: Row | null
  passkeys: Row[]
  usage: Row[]
  workspaces: Row[]
  billing: {
    orders: Row[]
    polarCustomerIds: string[]
    events: Row[]
  }
  newsletter: Row[]
  feedback: Row[]
  shares: Row[]
  notIncluded: { what: string; why: string }[]
}

function withId(id: string, data: Record<string, unknown>): Row {
  return { id, ...plainDoc(data) }
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null
}

/** A payload string back into JSON, or left as text when it is not. */
function parsePayload(payload: unknown): unknown {
  if (typeof payload !== 'string') return toPlain(payload)
  try {
    return toPlain(JSON.parse(payload))
  } catch {
    return payload
  }
}

/**
 * Read everything held about `uid` and shape it for download.
 *
 * `now` is injected so the document is reproducible in a test.
 */
export async function gatherExport(
  store: AccountStore,
  uid: string,
  now: Date = new Date(),
): Promise<ExportDocument> {
  const [auth, profileDoc] = await Promise.all([
    store.getAuthRecord(uid),
    store.getDoc(`users/${uid}`),
  ])
  const profileData = profileDoc?.data ?? null

  /* ---- The user's own subtree ------------------------------------- */
  const subcollectionNames = profileDoc ? await store.listSubcollections(`users/${uid}`) : []
  const subtree: Record<string, Row[]> = {}
  await Promise.all(
    subcollectionNames.map(async (name) => {
      const docs = await store.list(`users/${uid}/${name}`)
      subtree[name] = docs.map((d) => withId(d.id, d.data))
    }),
  )
  const otherUserData: Record<string, Row[]> = {}
  for (const [name, rows] of Object.entries(subtree)) {
    if (!(KNOWN_SUBCOLLECTIONS as readonly string[]).includes(name)) otherUserData[name] = rows
  }

  /* ---- Keyed by uid, elsewhere ------------------------------------ */
  const [passkeys, quotas, apiKeyIndex, purchases, customers, teams] = await Promise.all([
    store.list('passkeys', { uid }),
    store.list('quotas', { subject: uid, kind: 'user' }),
    store.list('apiKeys', { userId: uid }),
    store.list('purchases', { userId: uid }),
    store.list('polarCustomers', { userId: uid }),
    loadTeams(store, uid, profileData),
  ])

  /* ---- Workspaces -------------------------------------------------- */
  const workspaces: Row[] = await Promise.all(
    teams.map(async (team) => {
      const [membership, authored] = await Promise.all([
        store.getDoc(`teams/${team.id}/members/${uid}`),
        store.list(`teams/${team.id}/brandPresets`, { createdBy: uid }),
      ])
      const owner = text(team.data.ownerId) === uid
      return {
        id: team.id,
        name: text(team.data.name),
        kind: text(team.data.kind) ?? 'team',
        yourRole: owner ? 'owner' : 'member',
        seats: team.data.seats ?? null,
        seatsUsed: team.data.seatsUsed ?? null,
        memberCount: team.memberIds.length,
        subscriptionStatus: text(team.data.subscriptionStatus),
        currentPeriodEnd: toPlain(team.data.currentPeriodEnd) ?? null,
        createdAt: toPlain(team.data.createdAt) ?? null,
        // The subscription and order ids are the owner's own billing
        // references; a member has no business with the owner's.
        ...(owner
          ? {
              polarSubscriptionId: text(team.data.polarSubscriptionId),
              polarOrderId: text(team.data.polarOrderId),
            }
          : {}),
        yourMembership: membership ? plainDoc(membership.data) : null,
        sharedBrandPresetsYouCreated: authored.map((d) => withId(d.id, d.data)),
      }
    }),
  )

  /* ---- Billing ----------------------------------------------------- */
  const orderIds = new Set(purchases.map((p) => p.id))
  const subscriptionIds = new Set<string>()
  for (const team of teams) {
    if (text(team.data.ownerId) !== uid) continue
    const sub = text(team.data.polarSubscriptionId)
    if (sub) subscriptionIds.add(sub)
    const order = text(team.data.polarOrderId)
    if (order) orderIds.add(order)
  }
  const plusSub = text(profileData?.plusSubscriptionId)
  if (plusSub) subscriptionIds.add(plusSub)

  const customerIds = new Set(customers.map((c) => c.id))
  const linkedCustomer = text(profileData?.polarCustomerId)
  if (linkedCustomer) customerIds.add(linkedCustomer)

  const eventPaths = webhookEventPaths({
    orders: [...orderIds],
    subscriptions: [...subscriptionIds],
    checkouts: purchases
      .map((p) => text(p.data.polarCheckoutId))
      .filter((id): id is string => id !== null),
    customers: [...customerIds],
  })
  const eventDocs = await Promise.all(eventPaths.map((path) => store.getDoc(path)))
  const events: Row[] = eventDocs.flatMap((doc) => {
    // A blanked payload is a deletion marker, not something held about them.
    if (!doc || doc.data.payload == null) return []
    return [
      {
        type: text(doc.data.type),
        receivedAt: toPlain(doc.data.receivedAt) ?? null,
        payload: parsePayload(doc.data.payload),
      },
    ]
  })

  /* ---- Mailing list ------------------------------------------------ */
  const addresses = new Set<string>()
  const authEmail = text(auth?.email)
  if (authEmail) addresses.add(authEmail.trim().toLowerCase())
  const profileEmail = text(profileData?.email)
  if (profileEmail) addresses.add(profileEmail.trim().toLowerCase())

  const newsletter: Row[] = []
  const feedback: Row[] = []
  for (const address of addresses) {
    const id = subscriberDocId(address)
    for (const list of ['subscribers', 'newsletterSubscribers']) {
      const doc = await store.getDoc(`${list}/${id}`)
      if (doc) newsletter.push({ list, ...pick(doc.data, SUBSCRIBER_FIELDS) })
    }
    // Only reports the person signed with their email. `ipHash` is not in
    // the allow-list: it is a salted hash of an address, not theirs to be
    // handed and not reversible by us either.
    for (const doc of await store.list('feedback', { email: address })) {
      feedback.push(pick(doc.data, FEEDBACK_FIELDS))
    }
  }

  /* ---- Public share links ------------------------------------------ */
  const [ownerShares, publicShares] = await Promise.all([
    store.list('collectionShares', { uid }),
    store.list('sharedCollections', { uid }),
  ])
  const shares: Row[] = [
    ...ownerShares.map((d) => ({ side: 'owner', ...pick(d.data, SHARE_FIELDS) })),
    ...publicShares.map((d) => ({ side: 'public-lookup', ...pick(d.data, SHARE_FIELDS) })),
  ]

  /* ---- Assemble ---------------------------------------------------- */
  return {
    exportVersion: EXPORT_VERSION,
    generatedAt: now.toISOString(),
    about:
      'Everything Hoverlab holds about this account, generated on request. ' +
      'Times are UTC. "notIncluded" lists what is absent and why.',
    account: auth
      ? {
          id: auth.uid,
          email: auth.email,
          name: auth.displayName,
          emailVerified: auth.emailVerified,
          createdAt: auth.createdAt,
          lastSignInAt: auth.lastSignInAt,
          signInMethods: auth.providers,
        }
      : null,
    profile: profileData ? plainDoc(profileData) : null,
    favorites: subtree.favorites ?? [],
    bundle: subtree.bundle ?? [],
    collections: subtree.collections ?? [],
    brandPresets: subtree.brandPresets ?? [],
    toolPresets: subtree.toolPresets ?? [],
    creditLedger: subtree.creditLedger ?? [],
    renewals: subtree.renewals ?? [],
    otherUserData,
    apiKey: profileData?.apiKey || apiKeyIndex.length
      ? {
          // The profile's copy has its hash stripped by `plainDoc`.
          ...(profileData?.apiKey ? plainDoc(profileData.apiKey as Row) : {}),
          indexedSince: apiKeyIndex[0] ? (toPlain(apiKeyIndex[0].data.createdAt) ?? null) : null,
        }
      : null,
    passkeys: passkeys
      .map((d): Row => ({ id: d.id, ...pick(d.data, PASSKEY_FIELDS) }))
      .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))),
    usage: quotas
      .map((d) => pick(d.data, USAGE_FIELDS))
      .sort((a, b) => String(b.day ?? '').localeCompare(String(a.day ?? ''))),
    workspaces,
    billing: {
      orders: purchases.map((d) => withId(d.id, d.data)),
      polarCustomerIds: [...customerIds],
      events,
    },
    newsletter,
    feedback,
    shares,
    notIncluded: NOT_EXPORTED,
  }
}

/** The download's file name. No account identifier in it. */
export function exportFileName(now: Date = new Date()): string {
  return `hoverlab-data-${now.toISOString().slice(0, 10)}.json`
}
