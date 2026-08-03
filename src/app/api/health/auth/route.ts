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

/**
 * Call Firebase Auth's REST API the same way a sign-in does.
 *
 * Deliberately with credentials that cannot be right: a 400
 * INVALID_LOGIN_CREDENTIALS proves the whole path works — the key is valid,
 * the endpoint is reachable from this server, and email/password sign-in is
 * enabled. Anything else is the real problem, named.
 */
async function probeAuthApi(): Promise<Probe> {
  const key =
    process.env.FIREBASE_API_KEY ?? process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!key) {
    return {
      name: 'auth-api',
      status: 'failing',
      detail: 'No Firebase Web API key — sign-in and sign-up cannot be attempted.',
    }
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'health-check@invalid.invalid',
          password: 'not-a-real-password',
          returnSecureToken: true,
        }),
        cache: 'no-store',
      },
    )
    const data = (await res.json().catch(() => ({}))) as {
      error?: { message?: string }
    }
    const code = data.error?.message ?? ''

    if (/INVALID_LOGIN_CREDENTIALS|EMAIL_NOT_FOUND|INVALID_PASSWORD/.test(code)) {
      return {
        name: 'auth-api',
        status: 'ok',
        detail: 'Firebase Auth is reachable and the API key is valid.',
      }
    }
    if (/OPERATION_NOT_ALLOWED|PASSWORD_LOGIN_DISABLED/.test(code)) {
      return {
        name: 'auth-api',
        status: 'failing',
        detail:
          'Email/Password sign-in is not enabled — turn it on under ' +
          'Authentication → Sign-in method.',
      }
    }
    if (/API key not valid|API_KEY_INVALID|blocked/i.test(code)) {
      return {
        name: 'auth-api',
        status: 'failing',
        detail: `Firebase rejected the API key: ${code}`,
      }
    }
    return {
      name: 'auth-api',
      status: 'failing',
      detail: `Unexpected response from Firebase Auth: ${code || res.status}`,
    }
  } catch (err) {
    return {
      name: 'auth-api',
      status: 'failing',
      detail: `Cannot reach Firebase Auth: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

export async function GET() {
  const production = process.env.NODE_ENV === 'production'

  const [admin, firestore, authApi] = await Promise.all([
    probeAdmin(),
    probeFirestore(),
    probeAuthApi(),
  ])

  // Config checks run even when the probes pass: NEXT_PUBLIC_SITE_URL being
  // wrong breaks canonical URLs without breaking anything a probe notices.
  const envFailures = blockingFailures(checkEnv(process.env, { production }))
  const config: Probe[] = envFailures
    // Already covered, in more detail, by the live probes above.
    .filter((c) => !/FIREBASE/.test(c.key))
    .map((c) => ({ name: `env:${c.key}`, status: 'failing' as const, detail: c.message }))

  const probes = [admin, firestore, authApi, ...config]
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
