/**
 * Firebase Admin SDK — server side only.
 *
 * Server-only because it holds a service account private key, which grants
 * full access to the project. Importing this from a Client Component would
 * ship that key to browsers; every import site is a Route Handler or Server
 * Component for that reason.
 *
 * Credentials are read in this order:
 *
 *  1. FIREBASE_SERVICE_ACCOUNT_FILE — path to the JSON key file. Intended
 *     for local development: keep the file out of git and the key never has
 *     to be pasted anywhere.
 *  2. FIREBASE_SERVICE_ACCOUNT — the same JSON as a single string. This is
 *     the shape for hosting providers, where secrets are environment
 *     variables rather than files.
 *  3. FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY —
 *     the three fields separately, for setups that dislike JSON blobs in
 *     environment variables.
 *
 * The Admin SDK requires the Node.js runtime. It cannot run on the Edge
 * runtime, which is why proxy.ts does not verify sessions itself.
 */

import { readFileSync } from 'node:fs'
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

interface ServiceAccountCredentials {
  projectId: string
  clientEmail: string
  privateKey: string
}

/**
 * Private keys arrive with literal backslash-n sequences when they travel
 * through environment variables. Left unconverted, signing fails with an
 * opaque OpenSSL error that says nothing about the cause.
 */
function normalizePrivateKey(key: string): string {
  return key.includes('\\n') ? key.replace(/\\n/g, '\n') : key
}

function fromJson(json: string, source: string): ServiceAccountCredentials {
  let parsed: Record<string, string>
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error(
      `${source} is not valid JSON. It should be the entire service account ` +
        'key file, starting with {"type":"service_account".',
    )
  }
  const projectId = parsed.project_id ?? parsed.projectId
  const clientEmail = parsed.client_email ?? parsed.clientEmail
  const privateKey = parsed.private_key ?? parsed.privateKey
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      `${source} is missing project_id, client_email or private_key — it does ` +
        'not look like a service account key.',
    )
  }
  return { projectId, clientEmail, privateKey: normalizePrivateKey(privateKey) }
}

function resolveCredentials(): ServiceAccountCredentials {
  const file = process.env.FIREBASE_SERVICE_ACCOUNT_FILE
  if (file) {
    let contents: string
    try {
      contents = readFileSync(file, 'utf8')
    } catch {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_FILE points at ${file}, which cannot be read.`,
      )
    }
    return fromJson(contents, `The file at FIREBASE_SERVICE_ACCOUNT_FILE (${file})`)
  }

  const inline = process.env.FIREBASE_SERVICE_ACCOUNT
  if (inline) return fromJson(inline, 'FIREBASE_SERVICE_ACCOUNT')

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey: normalizePrivateKey(privateKey) }
  }

  throw new Error(
    'Firebase Admin credentials are not configured. Set ' +
      'FIREBASE_SERVICE_ACCOUNT_FILE (local) or FIREBASE_SERVICE_ACCOUNT ' +
      '(hosting) — see .env.example.',
  )
}

/** Initialised once per process; Firebase throws on a duplicate app name. */
function adminApp(): App {
  const existing = getApps()
  if (existing.length) return existing[0]!
  const credentials = resolveCredentials()
  return initializeApp({
    credential: cert(credentials),
    projectId: credentials.projectId,
  })
}

export function adminAuth(): Auth {
  return getAuth(adminApp())
}

export function adminDb(): Firestore {
  return getFirestore(adminApp())
}

/** True when credentials are present and parseable — used by the health check. */
export function isAdminConfigured(): boolean {
  try {
    resolveCredentials()
    return true
  } catch {
    return false
  }
}
