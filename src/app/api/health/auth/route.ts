/**
 * GET /api/health/auth
 *
 * Answers "can this deployment actually sign someone in?" without needing an
 * account, a password, or access to the host. 200 when yes, 503 when no.
 *
 * The checks exercise the real code paths rather than asserting that
 * variables are non-empty:
 *
 *  - signing actually mints and verifies a token through lib/auth.ts, which
 *    is where a missing AUTH_SECRET throws — the failure that reached users
 *    as "Sign in failed. Please try again."
 *  - schema actually reads the columns added for password reset, so code
 *    deployed against an unmigrated database shows up here instead of as a
 *    500 on /api/auth/me.
 *
 * Deliberately unauthenticated: it is the first thing you want after a
 * deploy, and requiring a session to diagnose broken sessions is a circle.
 * It reports names and statuses only — never a value, a connection string,
 * or any part of a secret.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSessionToken, verifySessionToken } from '@/lib/auth'
import { checkEnv, blockingFailures } from '@/lib/env'
import { isMailConfigured } from '@/lib/mail'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Probe {
  name: string
  status: 'ok' | 'failing' | 'degraded'
  detail: string
}

/** Mint a token and verify it — the exact path /api/auth/login dies on. */
async function probeSigning(): Promise<Probe> {
  try {
    const token = await createSessionToken({
      sub: 'health-check',
      email: 'health@check.invalid',
      name: null,
    })
    const decoded = await verifySessionToken(token)
    if (!decoded || decoded.sub !== 'health-check') {
      return {
        name: 'signing',
        status: 'failing',
        detail: 'Tokens are signed but do not verify. AUTH_SECRET may differ between instances.',
      }
    }
    return { name: 'signing', status: 'ok', detail: 'Sessions can be signed and verified.' }
  } catch (err) {
    return {
      name: 'signing',
      status: 'failing',
      detail: `Cannot sign sessions: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

async function probeDatabase(): Promise<Probe> {
  try {
    await db.$queryRaw`SELECT 1`
    return { name: 'database', status: 'ok', detail: 'Reachable.' }
  } catch (err) {
    return {
      name: 'database',
      status: 'failing',
      detail: `Unreachable: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

/**
 * Read the columns and tables this build expects. Catches the case where
 * code ships ahead of `prisma db push` — sign-in succeeds, then every
 * session lookup 500s.
 */
async function probeSchema(): Promise<Probe> {
  try {
    await db.user.findFirst({ select: { id: true, sessionsValidFrom: true } })
    await db.passwordResetToken.findFirst({ select: { id: true } })
    return { name: 'schema', status: 'ok', detail: 'Database matches this build.' }
  } catch (err) {
    return {
      name: 'schema',
      status: 'failing',
      detail:
        'Database is behind this build — run `prisma db push` (or a migration) against it. ' +
        `Details: ${err instanceof Error ? err.message.split('\n').pop()?.trim() : String(err)}`,
    }
  }
}

export async function GET() {
  const production = process.env.NODE_ENV === 'production'

  const [signing, database, schema] = await Promise.all([
    probeSigning(),
    probeDatabase(),
    probeSchema(),
  ])

  // Config checks run even when the probes pass: NEXT_PUBLIC_SITE_URL being
  // wrong breaks emailed reset links without breaking anything a probe would
  // notice.
  const envChecks = checkEnv(process.env, { production })
  const envFailures = blockingFailures(envChecks)
  const config: Probe[] = envFailures.map((c) => ({
    name: `env:${c.key}`,
    status: 'failing',
    detail: c.message,
  }))

  const mail: Probe = isMailConfigured()
    ? { name: 'mail', status: 'ok', detail: 'Password reset emails can be delivered.' }
    : {
        name: 'mail',
        status: production ? 'failing' : 'degraded',
        detail: production
          ? 'RESEND_API_KEY / EMAIL_FROM are not set — password reset emails are never delivered.'
          : 'Not configured; reset emails print to the server console in development.',
      }

  const probes = [signing, database, schema, mail, ...config]
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
