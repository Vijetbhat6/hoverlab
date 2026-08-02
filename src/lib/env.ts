/**
 * Environment validation — the single description of what this app needs to
 * run, used by both the build (scripts/check-env.mjs) and the runtime health
 * check (/api/health/auth).
 *
 * Why this file exists: AUTH_SECRET was missing from a deployment, and
 * nothing noticed until someone typed the right password on the live site.
 * The build succeeded, the pages rendered, the login form worked — and then
 * lib/auth.ts threw while minting the session, which reached the browser as
 * an HTML 500 and a banner reading "Sign in failed. Please try again."
 * Every layer had the information needed to say "AUTH_SECRET is not set" and
 * none of them did.
 *
 * A misconfigured deploy should fail at build time, loudly, naming the
 * variable. That is the whole point of this module. Keep it dependency-free
 * and free of non-erasable TypeScript so `node` can import it directly.
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

/** Minimum entropy for a signing key, in characters of hex/base64. */
const MIN_SECRET_LENGTH = 32

export interface CheckOptions {
  /**
   * Apply production rules. In development, missing values are fine —
   * lib/auth.ts falls back to a dev-only secret and mail prints to the
   * console — so failing the build locally would be noise.
   */
  production: boolean
}

export function checkEnv(
  env: Record<string, string | undefined>,
  opts: CheckOptions,
): EnvCheck[] {
  const checks: EnvCheck[] = []
  const has = (k: string) => typeof env[k] === 'string' && env[k]!.trim() !== ''

  // --- AUTH_SECRET ---------------------------------------------------------
  // The failure this whole module exists to prevent. Note the shape of it:
  // the throw happens *after* the password is verified, so a wrong password
  // returns a clean 401 and a correct one returns a 500. It looks like the
  // password is wrong when it is the only thing that was right.
  if (!has('AUTH_SECRET')) {
    checks.push({
      key: 'AUTH_SECRET',
      status: 'missing',
      level: 'required',
      message:
        'Sessions cannot be signed. Sign-in returns HTTP 500 after the ' +
        'password verifies. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    })
  } else if (env.AUTH_SECRET!.trim().length < MIN_SECRET_LENGTH) {
    checks.push({
      key: 'AUTH_SECRET',
      status: 'invalid',
      level: 'required',
      message: `Shorter than ${MIN_SECRET_LENGTH} characters — too weak to sign sessions with.`,
    })
  } else {
    checks.push({
      key: 'AUTH_SECRET',
      status: 'ok',
      level: 'required',
      message: 'Set.',
    })
  }

  // --- DATABASE_URL --------------------------------------------------------
  if (!has('DATABASE_URL')) {
    checks.push({
      key: 'DATABASE_URL',
      status: 'missing',
      level: 'required',
      message: 'No database. Every auth route returns HTTP 500.',
    })
  } else if (!/^postgres(ql)?:\/\//.test(env.DATABASE_URL!.trim())) {
    checks.push({
      key: 'DATABASE_URL',
      status: 'invalid',
      level: 'required',
      message:
        'Not a postgresql:// connection string — prisma/schema.prisma uses the postgresql provider.',
    })
  } else {
    checks.push({
      key: 'DATABASE_URL',
      status: 'ok',
      level: 'required',
      message: 'Set.',
    })
  }

  // --- NEXT_PUBLIC_SITE_URL ------------------------------------------------
  // Silent in a different way: password reset links, canonical tags and the
  // sitemap all resolve against lib/site.ts's localhost fallback, so emailed
  // reset links point at the recipient's own machine.
  if (!has('NEXT_PUBLIC_SITE_URL')) {
    checks.push({
      key: 'NEXT_PUBLIC_SITE_URL',
      status: 'missing',
      level: opts.production ? 'required' : 'recommended',
      message:
        'Password reset links and canonical URLs fall back to http://localhost:3000.',
    })
  } else {
    checks.push({
      key: 'NEXT_PUBLIC_SITE_URL',
      status: 'ok',
      level: 'required',
      message: 'Set.',
    })
  }

  // --- Mail ----------------------------------------------------------------
  // Recommended, not required: the app is fully usable without password
  // reset. But shipping the form while nothing can be delivered is its own
  // silent failure, so it is worth a warning on every build.
  const mailKeys = ['RESEND_API_KEY', 'EMAIL_FROM']
  const missingMail = mailKeys.filter((k) => !has(k))
  if (missingMail.length) {
    checks.push({
      key: missingMail.join(' + '),
      status: 'missing',
      level: 'recommended',
      message: opts.production
        ? 'Password reset emails cannot be delivered. /forgot-password will still report success to avoid leaking which addresses exist.'
        : 'Password reset emails print to this terminal instead of sending.',
    })
  } else {
    checks.push({
      key: 'RESEND_API_KEY + EMAIL_FROM',
      status: 'ok',
      level: 'recommended',
      message: 'Set.',
    })
  }

  return checks
}

/** Required checks that did not pass. Non-empty means: do not ship this. */
export function blockingFailures(checks: EnvCheck[]): EnvCheck[] {
  return checks.filter((c) => c.level === 'required' && c.status !== 'ok')
}
