/**
 * Environment validation — the single description of what this app needs to
 * run, used by both the build (scripts/check-env.mjs) and the runtime health
 * check (/api/health/auth).
 *
 * Why this file exists: a deployment shipped with DATABASE_URL still set to
 * the example value from .env.example, and nothing noticed until someone
 * typed the right password on the live site. The build succeeded, the pages
 * rendered, the login form worked — and then the route threw, which reached
 * the browser as "Sign in failed. Please try again." Every layer had the
 * information needed to say "that is not a real database" and none of them
 * did.
 *
 * The backing store is Firebase now, but the lesson transfers unchanged: a
 * misconfigured deploy should fail at build time, loudly, naming the
 * variable. Keep this dependency-free and free of non-erasable TypeScript so
 * `node` can import it directly.
 */

export type CheckStatus = 'ok' | 'missing' | 'invalid'

export interface EnvCheck {
  key: string
  status: CheckStatus
  /** `required` fails the build; `recommended` warns. */
  level: 'required' | 'recommended'
  /** What breaks, in terms of user-visible behavior. */
  message: string
}

export interface CheckOptions {
  /**
   * Apply production rules. Locally the app can run against a Firebase
   * project or not at all, and failing a development build over it would
   * be noise.
   */
  production: boolean
}

/** Public client config. Not secret — these identify the project. */
const CLIENT_KEYS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
] as const

/**
 * Is a service account credential present in any of its accepted forms?
 * Mirrors the resolution order in lib/firebase/admin.ts.
 */
function adminCredentialPresent(env: Record<string, string | undefined>): boolean {
  const has = (k: string) => typeof env[k] === 'string' && env[k]!.trim() !== ''
  if (has('FIREBASE_SERVICE_ACCOUNT_FILE')) return true
  if (has('FIREBASE_SERVICE_ACCOUNT')) return true
  return (
    has('FIREBASE_PROJECT_ID') &&
    has('FIREBASE_CLIENT_EMAIL') &&
    has('FIREBASE_PRIVATE_KEY')
  )
}

/**
 * Does this look like a service account key rather than something else
 * pasted into the field? A web app config and a service account key are both
 * JSON blobs from the same console, and swapping them is an easy mistake
 * that only shows up as a signing failure at runtime.
 */
function adminCredentialLooksValid(
  env: Record<string, string | undefined>,
): { ok: true } | { ok: false; reason: string } {
  const inline = env.FIREBASE_SERVICE_ACCOUNT
  if (inline && inline.trim()) {
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(inline)
    } catch {
      return {
        ok: false,
        reason:
          'is not valid JSON. Paste the entire service account key file, ' +
          'starting with {"type":"service_account".',
      }
    }
    if (!parsed.private_key || !parsed.client_email) {
      return {
        ok: false,
        reason:
          'has no private_key/client_email — that is a web app config, not a ' +
          'service account key. Generate one under Project settings → ' +
          'Service accounts.',
      }
    }
  }

  const key = env.FIREBASE_PRIVATE_KEY
  if (key && key.trim() && !key.includes('BEGIN PRIVATE KEY')) {
    return {
      ok: false,
      reason: 'does not contain a PEM private key block.',
    }
  }

  return { ok: true }
}

/** Does this URL address the machine it is running on? */
function isLocalHost(url: string): boolean {
  try {
    const host = new URL(url.trim()).hostname.replace(/^\[|\]$/g, '')
    return host === 'localhost' || host === '127.0.0.1' || host === '::1'
  } catch {
    return false
  }
}

export function checkEnv(
  env: Record<string, string | undefined>,
  opts: CheckOptions,
): EnvCheck[] {
  const checks: EnvCheck[] = []
  const has = (k: string) => typeof env[k] === 'string' && env[k]!.trim() !== ''

  // --- Firebase client config ---------------------------------------------
  // Without these the sign-in form renders and then cannot do anything: the
  // client SDK has no project to talk to.
  const missingClient = CLIENT_KEYS.filter((k) => !has(k))
  if (missingClient.length) {
    checks.push({
      key: missingClient.join(', '),
      status: 'missing',
      level: 'required',
      message:
        'The browser has no Firebase project to sign in against — the sign-in ' +
        'form will report that sign-in is not configured. Copy these from ' +
        'Project settings → Your apps → SDK setup and configuration.',
    })
  } else {
    checks.push({
      key: 'NEXT_PUBLIC_FIREBASE_*',
      status: 'ok',
      level: 'required',
      message: 'Set.',
    })
  }

  // --- Firebase Admin credentials ------------------------------------------
  // Without these every server route that touches a session or Firestore
  // throws, which is the failure this module was written for.
  if (!adminCredentialPresent(env)) {
    checks.push({
      key: 'FIREBASE_SERVICE_ACCOUNT',
      status: 'missing',
      level: 'required',
      message:
        'The server cannot verify sessions or read Firestore — every ' +
        'authenticated request fails. Set FIREBASE_SERVICE_ACCOUNT to the ' +
        'service account JSON (or FIREBASE_SERVICE_ACCOUNT_FILE locally).',
    })
  } else {
    const validity = adminCredentialLooksValid(env)
    if (!validity.ok) {
      checks.push({
        key: 'FIREBASE_SERVICE_ACCOUNT',
        status: 'invalid',
        level: 'required',
        message: `The credential ${validity.reason}`,
      })
    } else {
      checks.push({
        key: 'FIREBASE_SERVICE_ACCOUNT',
        status: 'ok',
        level: 'required',
        message: 'Set.',
      })
    }
  }

  // --- NEXT_PUBLIC_SITE_URL ------------------------------------------------
  // Silent in a different way: canonical tags and the sitemap resolve against
  // lib/site.ts's localhost fallback, so every indexed URL points at nothing.
  if (!has('NEXT_PUBLIC_SITE_URL')) {
    checks.push({
      key: 'NEXT_PUBLIC_SITE_URL',
      status: 'missing',
      level: opts.production ? 'required' : 'recommended',
      message: 'Canonical URLs and the sitemap fall back to http://localhost:3000.',
    })
  } else if (opts.production && isLocalHost(env.NEXT_PUBLIC_SITE_URL!)) {
    checks.push({
      key: 'NEXT_PUBLIC_SITE_URL',
      status: 'invalid',
      level: 'required',
      message:
        'Points at localhost, so every canonical URL and sitemap entry on the ' +
        'live site addresses the visitor’s own machine.',
    })
  } else {
    checks.push({
      key: 'NEXT_PUBLIC_SITE_URL',
      status: 'ok',
      level: 'required',
      message: 'Set.',
    })
  }

  return checks
}

/** Required checks that did not pass. Non-empty means: do not ship this. */
export function blockingFailures(checks: EnvCheck[]): EnvCheck[] {
  return checks.filter((c) => c.level === 'required' && c.status !== 'ok')
}
