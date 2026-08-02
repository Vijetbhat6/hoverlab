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
 *   node scripts/users.mjs delete <email>     # removes the account and its data
 */

import { readFileSync, existsSync } from 'node:fs'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

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
        '  node scripts/users.mjs delete <email>',
    )
}

process.exit(0)
