/**
 * Account diagnostics against Firebase — replaces the Prisma-era
 * list-users / diagnose-user / delete-user scripts.
 *
 * Reads credentials the same way the app does (see src/lib/firebase/admin.ts),
 * so if this works, the app's server side will too — which makes it the
 * quickest way to tell a credential problem from an application problem.
 *
 * Usage:
 *   node scripts/users.mjs list
 *   node scripts/users.mjs show <email>
 *   node scripts/users.mjs grant <email>      # comp every paid entitlement
 *   node scripts/users.mjs revoke <email>     # take the comp back
 *   node scripts/users.mjs delete <email>     # removes the account and its data
 */

import { readFileSync, existsSync } from 'node:fs'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'

/** Load .env files the way Next.js does; a bare node script gets none of it. */
function loadEnv() {
  const merged = {}
  for (const file of ['.env', '.env.local', '.env.production']) {
    if (!existsSync(file)) continue
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
      if (!match) continue
      let value = match[2].trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      merged[match[1]] = value
    }
  }
  return { ...merged, ...process.env }
}

const env = loadEnv()

function credentials() {
  if (env.FIREBASE_SERVICE_ACCOUNT_FILE) {
    return JSON.parse(readFileSync(env.FIREBASE_SERVICE_ACCOUNT_FILE, 'utf8'))
  }
  if (env.FIREBASE_SERVICE_ACCOUNT) return JSON.parse(env.FIREBASE_SERVICE_ACCOUNT)
  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return {
      project_id: env.FIREBASE_PROJECT_ID,
      client_email: env.FIREBASE_CLIENT_EMAIL,
      private_key: env.FIREBASE_PRIVATE_KEY,
    }
  }
  console.error(
    'No Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_FILE in .env — see .env.example.',
  )
  process.exit(1)
}

const key = credentials()
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: key.project_id ?? key.projectId,
      clientEmail: key.client_email ?? key.clientEmail,
      privateKey: (key.private_key ?? key.privateKey ?? '').replace(/\\n/g, '\n'),
    }),
    projectId: key.project_id ?? key.projectId,
  })
}

const auth = getAuth()
const db = getFirestore()

const [command, argument] = process.argv.slice(2)

/** `--seats=25` style options, for the commands that take them. */
const flags = new Map(
  process.argv
    .slice(4)
    .filter((arg) => arg.startsWith('--'))
    .map((arg) => {
      const [name, value = 'true'] = arg.slice(2).split('=')
      return [name, value]
    }),
)

function numberFlag(name, fallback) {
  const value = Number(flags.get(name))
  return Number.isFinite(value) && value > 0 ? value : fallback
}

/**
 * Ids for everything a comp writes.
 *
 * Derived from the uid, so re-running `grant` updates the same documents
 * instead of stacking up a second workspace, and `revoke` knows exactly
 * which records are the comp's and which the customer paid for. A Polar
 * order or subscription id can never collide with the `grant-` prefix.
 */
function grantIds(uid) {
  return {
    team: `grant-${uid}`,
    credits: `grant-${uid}-credits`,
    purchase: (plan) => `grant-${uid}-${plan}`,
  }
}

/**
 * The two licences a comp stands in for: the one-time Pro licence, and a
 * seat on a live Team workspace. Between them they cover every entitlement
 * `getEntitlements()` derives — see src/lib/billing/entitlements.ts.
 */
const GRANTED_PLANS = ['pro', 'team']

/**
 * Invite code generator, copied from src/lib/billing/invite-code.ts.
 *
 * Duplicated rather than imported because this is a plain node script and
 * that module is TypeScript. The alphabet has to match: a code generated
 * here is read back by `normalizeInviteCode`, which rejects anything
 * outside it.
 */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTVWXYZ23456789'

function generateInviteCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  const body = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
  return `HL-${body.slice(0, 4)}-${body.slice(4, 8)}`
}

function monthsFromNow(months) {
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return Timestamp.fromDate(date)
}

/** Look up the account, or explain why there isn't one to act on. */
async function requireAccount(email, usage) {
  if (!email) {
    console.error(usage)
    process.exit(1)
  }
  const user = await auth.getUserByEmail(email).catch(() => null)
  if (!user) {
    console.log(`No account for ${email}.`)
    return null
  }
  const ref = db.collection('users').doc(user.uid)
  if (!(await ref.get()).exists) {
    console.log(
      `${email} exists in Auth but has no users/${user.uid} profile — sign in on the\n` +
        'site once so it is created, then run this again. Entitlements are read off\n' +
        'that document, so a comp written without it would resolve to free.',
    )
    return null
  }
  return { user, ref }
}

async function profileFor(uid) {
  const snap = await db.collection('users').doc(uid).get()
  return snap.exists ? snap.data() : null
}

async function countSubcollection(uid, name) {
  const snap = await db.collection('users').doc(uid).collection(name).count().get()
  return snap.data().count
}

switch (command) {
  case 'list': {
    const { users } = await auth.listUsers(1000)
    if (!users.length) {
      console.log('No accounts yet.')
      break
    }
    console.log(`${users.length} account(s):\n`)
    for (const user of users) {
      const profile = await profileFor(user.uid)
      console.log(
        `  ${user.email ?? '(no email)'}\n` +
          `    uid:      ${user.uid}\n` +
          `    created:  ${user.metadata.creationTime}\n` +
          `    profile:  ${profile ? 'yes' : 'MISSING — session would be rejected'}\n` +
          `    pro:      ${profile?.proLicense === true ? 'yes' : 'no'}`,
      )
    }
    break
  }

  case 'show': {
    if (!argument) {
      console.error('Usage: node scripts/users.mjs show <email>')
      process.exit(1)
    }
    const user = await auth.getUserByEmail(argument).catch(() => null)
    if (!user) {
      console.log(`No account for ${argument}.`)
      break
    }
    const profile = await profileFor(user.uid)
    console.log({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName ?? null,
      disabled: user.disabled,
      created: user.metadata.creationTime,
      lastSignIn: user.metadata.lastSignInTime,
      profile,
      favorites: await countSubcollection(user.uid, 'favorites'),
      bundle: await countSubcollection(user.uid, 'bundle'),
    })
    break
  }

  /*
   * Comp an account — every paid entitlement, granted by hand.
   *
   * It writes what a real purchase writes and nothing else. There is no
   * "staff" or "free pro" flag anywhere in the app and this does not add
   * one: entitlements are DERIVED in src/lib/billing/entitlements.ts, and a
   * bypass flag would be a second definition of who is paid for the webhook
   * to drift from. A comped account therefore exercises the same code paths
   * a customer does, which is the only way testing it proves anything.
   *
   * Two records, because two different things grant access:
   *   proLicense           the one-time Pro licence -> canUseProFeatures
   *   a live Team seat     -> canUseTeamFeatures, and the 500/mo AI allowance
   *
   * Plus a $0 purchase record per plan, so the certificate on /account has an
   * id and an issue date to print, and a credit ledger entry, so the AI
   * endpoints have a balance to spend. Everything is keyed off the uid and
   * written with merge, so running it twice is a no-op rather than a second
   * workspace and a second helping of credits.
   */
  case 'grant': {
    const found = await requireAccount(
      argument,
      'Usage: node scripts/users.mjs grant <email> [--seats=10] [--credits=2500]',
    )
    if (!found) break
    const { user, ref: userRef } = found
    const uid = user.uid
    const ids = grantIds(uid)
    const seats = numberFlag('seats', 10)
    const credits = numberFlag('credits', 2500)
    const now = Timestamp.now()

    // The Pro licence. `updatesUntil` is set explicitly because the
    // certificate prefers it over the date derived from the granting order,
    // and a comp has twelve months of updates like any other licence.
    await userRef.update({
      proLicense: true,
      proLicenseAt: now,
      updatesUntil: monthsFromNow(12),
    })

    // The workspace. Status 'active' with no period end is the one live
    // state that never expires on a clock — see `subscriptionIsLive()`.
    const teamRef = db.collection('teams').doc(ids.team)
    const existing = (await teamRef.get()).data() ?? null
    const batch = db.batch()
    batch.set(
      teamRef,
      {
        name: existing?.name ?? 'Comped workspace',
        kind: 'team',
        ownerId: uid,
        subscriptionStatus: 'active',
        seats,
        // Re-granting must not reset seats already claimed by other people.
        seatsUsed: typeof existing?.seatsUsed === 'number' ? existing.seatsUsed : 1,
        // Nor rotate a code that has already been handed out.
        inviteCode: existing?.inviteCode ?? generateInviteCode(),
        currentPeriodEnd: null,
        grantedBy: 'scripts/users.mjs',
        createdAt: existing?.createdAt ?? now,
      },
      { merge: true },
    )
    batch.set(teamRef.collection('members').doc(uid), {
      userId: uid,
      role: 'owner',
      joinedAt: existing ? (existing.createdAt ?? now) : now,
    })
    batch.update(userRef, { teamIds: FieldValue.arrayUnion(teamRef.id) })
    await batch.commit()

    // Purchase records, so /account can print a licence id and a date. The
    // certificate looks up the order for whichever plan the account holds,
    // and a comped account holds both.
    for (const plan of GRANTED_PLANS) {
      await db
        .collection('purchases')
        .doc(ids.purchase(plan))
        .set(
          {
            userId: uid,
            plan,
            interval: plan === 'team' ? 'month' : 'one_time',
            amountCents: 0,
            currency: 'usd',
            polarOrderId: null,
            polarCheckoutId: null,
            packId: null,
            credits: null,
            // Marks it as never having been paid for, so it is obvious in
            // the console and in any revenue figure read off this collection.
            source: 'manual-grant',
            createdAt: now,
          },
          { merge: true },
        )
    }

    // Credits, through the same ledger the webhook writes: the ledger entry
    // is the idempotency key, so a re-grant tops nobody up twice.
    const ledgerRef = userRef.collection('creditLedger').doc(ids.credits)
    await db.runTransaction(async (tx) => {
      if ((await tx.get(ledgerRef)).exists) return
      tx.set(ledgerRef, {
        credits,
        packId: 'manual-grant',
        polarOrderId: null,
        createdAt: now,
      })
      tx.set(userRef, { credits: { purchased: FieldValue.increment(credits) } }, { merge: true })
    })

    const after = await profileFor(uid)
    const team = (await teamRef.get()).data() ?? {}
    console.log(
      `Comped ${user.email} (${uid}) on ${key.project_id ?? key.projectId}:\n` +
        `  pro licence:    yes, updates until ${after?.updatesUntil?.toDate().toDateString()}\n` +
        `  workspace:      ${teamRef.id} — ${team.seats} seats, invite code ${team.inviteCode}\n` +
        `  AI credits:     ${after?.credits?.purchased ?? 0} purchased + 500/month allowance\n` +
        '\nSign out and back in if the account is open in a browser — the session\n' +
        'is fine, but the client caches /api/billing/entitlements.\n' +
        `Undo with: node scripts/users.mjs revoke ${user.email}`,
    )
    break
  }

  /*
   * Take a comp back, touching only what `grant` wrote.
   *
   * It refuses to clear `proLicense` when the account also has a purchase
   * that was actually paid for, because that field is one bit with two
   * possible causes and clearing it would revoke a customer's licence.
   */
  case 'revoke': {
    const found = await requireAccount(
      argument,
      'Usage: node scripts/users.mjs revoke <email>',
    )
    if (!found) break
    const { user, ref: userRef } = found
    const uid = user.uid
    const ids = grantIds(uid)
    const grantedIds = new Set(GRANTED_PLANS.map((plan) => ids.purchase(plan)))

    const paid = await db
      .collection('purchases')
      .where('userId', '==', uid)
      .get()
      .then((snap) => snap.docs.filter((doc) => !grantedIds.has(doc.id)))
      .catch(() => [])
    const keepsPro = paid.some((doc) => doc.data().plan === 'pro')

    // Credits come back by exactly what the ledger says was granted, so a
    // pack bought since is not clawed back with it.
    const ledgerRef = userRef.collection('creditLedger').doc(ids.credits)
    const ledger = await ledgerRef.get()
    const granted = ledger.exists ? Number(ledger.data().credits) || 0 : 0

    await userRef.update({
      ...(keepsPro ? {} : { proLicense: false, proLicenseAt: null, updatesUntil: null }),
      teamIds: FieldValue.arrayRemove(ids.team),
      ...(granted ? { 'credits.purchased': FieldValue.increment(-granted) } : {}),
    })
    if (ledger.exists) await ledgerRef.delete()

    const teamRef = db.collection('teams').doc(ids.team)
    const members = await teamRef.collection('members').get()
    await Promise.all(members.docs.map((doc) => doc.ref.delete()))
    await teamRef.delete()
    for (const id of grantedIds) await db.collection('purchases').doc(id).delete()

    console.log(
      `Revoked the comp on ${user.email} (${uid}).` +
        (granted ? ` Took back ${granted} credits.` : '') +
        (keepsPro
          ? '\nLeft proLicense set: this account also has a paid purchase on record.'
          : ''),
    )
    break
  }

  case 'delete': {
    if (!argument) {
      console.error('Usage: node scripts/users.mjs delete <email>')
      process.exit(1)
    }
    const user = await auth.getUserByEmail(argument).catch(() => null)
    if (!user) {
      console.log(`No account for ${argument}.`)
      break
    }
    // Subcollections are not removed with their parent document, so they are
    // deleted explicitly — otherwise the data outlives the account.
    for (const name of ['favorites', 'bundle']) {
      const docs = await db.collection('users').doc(user.uid).collection(name).get()
      await Promise.all(docs.docs.map((doc) => doc.ref.delete()))
    }
    await db.collection('users').doc(user.uid).delete()
    await auth.deleteUser(user.uid)
    console.log(`Deleted ${argument} (${user.uid}) and its data.`)
    break
  }

  default:
    console.log(
      'Usage:\n' +
        '  node scripts/users.mjs list\n' +
        '  node scripts/users.mjs show <email>\n' +
        '  node scripts/users.mjs grant <email> [--seats=10] [--credits=2500]\n' +
        '  node scripts/users.mjs revoke <email>\n' +
        '  node scripts/users.mjs delete <email>',
    )
}

process.exit(0)
