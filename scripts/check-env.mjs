/**
 * Refuse to build a deployment that cannot sign anyone in.
 *
 * Runs as part of `prebuild`, so `next build` — and therefore every Vercel
 * deploy — stops here rather than shipping a site whose login route throws
 * on the first correct password. The rules live in src/lib/env.ts, shared
 * with /api/health/auth so the build and the running app can never disagree
 * about what "configured" means.
 *
 * In development nothing is enforced: lib/auth.ts falls back to a dev-only
 * secret and mail prints to the console, both deliberately. Production is
 * decided by NODE_ENV / VERCEL_ENV, which Vercel sets during builds.
 *
 * Run it by hand any time:  node scripts/check-env.mjs
 */

import { readFileSync, existsSync } from 'node:fs'
import { checkEnv, blockingFailures } from '../src/lib/env.ts'

/**
 * Load .env files the way Next.js does at runtime.
 *
 * A bare node script gets none of this for free, and without it a local
 * `npm run build` would fail on variables that are sitting in .env right
 * there. Real environment variables always win — that is how Vercel injects
 * project settings.
 */
function loadEnvFiles() {
  const merged = {}
  for (const file of ['.env', '.env.local', '.env.production']) {
    if (!existsSync(file)) continue
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
      if (!match) continue
      let value = match[2].trim()
      // Strip one layer of matching quotes, as dotenv does.
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

const env = loadEnvFiles()
const production =
  env.NODE_ENV === 'production' || Boolean(env.VERCEL_ENV || env.VERCEL)

const checks = checkEnv(env, { production })
const failures = blockingFailures(checks)
const warnings = checks.filter(
  (c) => c.level === 'recommended' && c.status !== 'ok',
)

const label = production ? 'production' : 'development'
console.log(`[env] checking ${label} configuration…`)

for (const c of checks) {
  if (c.status === 'ok') console.log(`  ok       ${c.key}`)
}
for (const c of warnings) {
  console.warn(`  warn     ${c.key} — ${c.message}`)
}
for (const c of failures) {
  console.error(`  MISSING  ${c.key} — ${c.message}`)
}

if (!failures.length) {
  console.log(
    warnings.length
      ? `[env] ok, with ${warnings.length} warning(s).`
      : '[env] ok.',
  )
  process.exit(0)
}

if (!production) {
  // Never block local work on production-only requirements.
  console.warn(
    `[env] ${failures.length} variable(s) would fail a production build. ` +
      'Not blocking a development build.',
  )
  process.exit(0)
}

console.error(
  `\n[env] Refusing to build: ${failures.length} required variable(s) missing or invalid.\n` +
    '      Set them in the deployment environment (on Vercel: Project → Settings →\n' +
    '      Environment Variables, Production scope) and redeploy. Building without\n' +
    '      them produces a site where sign-in fails with an unexplained HTTP 500.\n' +
    '      See .env.example for what each one does.',
)
process.exit(1)
