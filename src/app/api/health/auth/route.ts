/**
 * GET /api/health/auth
 *
 * Answers "can this deployment actually sign someone in?" without needing an
 * account, a password, or access to the host. 200 when yes, 503 when no.
 *
 * The checks exercise the real code paths rather than asserting that
 * variables are non-empty:
 *
 *  - admin actually initialises the Firebase Admin SDK and asks it for a
 *    signing-capable client, which is where a malformed or missing service
 *    account key throws.
 *  - firestore actually reads a document, so a project with Firestore not
 *    yet enabled, or rules/credentials that deny access, shows up here
 *    rather than as a 500 on someone's first sign-in.
 *
 * Deliberately unauthenticated: it is the first thing you want after a
 * deploy, and requiring a session to diagnose broken sessions is a circle.
 * It reports names and statuses only — never a key, a token, or any part of
 * a credential.
 */

import { NextResponse } from 'next/server'
import { adminAuth, adminDb, isAdminConfigured } from '@/lib/firebase/admin'
import { checkEnv, blockingFailures } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Probe {
  name: string
  status: 'ok' | 'failing' | 'degraded'
  detail: string
}

/**
 * Initialise the Admin SDK and confirm it can act on the project.
 *
 * listUsers(1) is the cheapest call that genuinely exercises the credential:
 * it is signed, sent, and authorised. Merely constructing the client would
 * pass even with a key the project rejects.
 */
async function probeAdmin(): Promise<Probe> {
  if (!isAdminConfigured()) {
    return {
      name: 'admin',
      status: 'failing',
      detail:
        'No Firebase Admin credentials — the server cannot verify sessions. ' +
        'Set FIREBASE_SERVICE_ACCOUNT.',
    }
  }
  try {
    await adminAuth().listUsers(1)
    return {
      name: 'admin',
      status: 'ok',
      detail: 'Admin SDK authenticated against the project.',
    }
  } catch (err) {
    return {
      name: 'admin',
      status: 'failing',
      detail: `Admin SDK rejected: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

/** Read a document, proving Firestore is enabled and reachable. */
async function probeFirestore(): Promise<Probe> {
  if (!isAdminConfigured()) {
    return {
      name: 'firestore',
      status: 'failing',
      detail: 'Not checked — no Admin credentials.',
    }
  }
  try {
    await adminDb().collection('users').limit(1).get()
    return { name: 'firestore', status: 'ok', detail: 'Reachable.' }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      name: 'firestore',
      status: 'failing',
      detail:
        /NOT_FOUND|does not exist/i.test(message)
          ? 'Firestore is not enabled for this project — create the database in the Firebase console.'
          : `Unreachable: ${message}`,
    }
  }
}

/** The browser half: without this the form renders but cannot sign in. */
function probeClientConfig(): Probe {
  const missing = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  ].filter((key) => !process.env[key])

  if (missing.length) {
    return {
      name: 'client-config',
      status: 'failing',
      detail: `Missing ${missing.join(', ')} — the browser has no project to sign in against.`,
    }
  }
  return { name: 'client-config', status: 'ok', detail: 'Set.' }
}

export async function GET() {
  const production = process.env.NODE_ENV === 'production'

  const [admin, firestore] = await Promise.all([probeAdmin(), probeFirestore()])
  const client = probeClientConfig()

  // Config checks run even when the probes pass: NEXT_PUBLIC_SITE_URL being
  // wrong breaks canonical URLs without breaking anything a probe notices.
  const envFailures = blockingFailures(checkEnv(process.env, { production }))
  const config: Probe[] = envFailures
    // Already covered, in more detail, by the live probes above.
    .filter((c) => !/FIREBASE/.test(c.key))
    .map((c) => ({ name: `env:${c.key}`, status: 'failing' as const, detail: c.message }))

  const probes = [admin, firestore, client, ...config]
  const ok = !probes.some((p) => p.status === 'failing')

  return NextResponse.json(
    {
      ok,
      environment: production ? 'production' : 'development',
      checks: probes,
    },
    { status: ok ? 200 : 503 },
  )
}
