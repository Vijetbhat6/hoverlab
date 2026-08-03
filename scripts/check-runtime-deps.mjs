/**
 * Refuse to build if the server's dependencies cannot be loaded the way a
 * deployed function loads them.
 *
 * This exists because of a failure that shipped twice. firebase-admin reaches
 * jose through jwks-rsa, and jose@6 is ESM-only with no `require` export.
 * Locally everything passed — Node 22.12+ can require() an ES module, so
 * `next dev`, `next build` and even `next start` were all fine. The deployed
 * function could not, and every authenticated request died with
 * ERR_REQUIRE_ESM.
 *
 * Nothing in a normal test catches that, because the difference is not the
 * code, the environment variables, or the build — it is whether the runtime
 * tolerates require() of an ES module. So this check removes that tolerance:
 * `--no-experimental-require-module` makes the local Node behave like the
 * strict runtime, and loading fails here, at build time, instead of on
 * someone's first sign-in.
 *
 * If this fails, the fix is a dependency tree change (an npm `overrides`
 * entry pinning the CommonJS-capable version), not a code change.
 */

import { execFileSync } from 'node:child_process'

/** Modules the server requires at runtime, in the form the bundler emits. */
const REQUIRED = [
  'firebase-admin/app',
  'firebase-admin/auth',
  'firebase-admin/firestore',
]

const failures = []

for (const specifier of REQUIRED) {
  try {
    execFileSync(
      process.execPath,
      ['--no-experimental-require-module', '-e', `require(${JSON.stringify(specifier)})`],
      { stdio: 'pipe' },
    )
    console.log(`  ok       ${specifier}`)
  } catch (err) {
    const output = `${err.stderr ?? ''}${err.stdout ?? ''}`
    const reason =
      output.match(/Error \[ERR_REQUIRE_ESM\][^\n]*/)?.[0] ??
      output.split('\n').find((line) => /Error/.test(line)) ??
      'failed to load'
    failures.push({ specifier, reason: reason.trim() })
    console.error(`  BROKEN   ${specifier} — ${reason.trim()}`)
  }
}

if (!failures.length) {
  console.log('[deps] server modules load under a strict CommonJS runtime.')
  process.exit(0)
}

console.error(
  `\n[deps] Refusing to build: ${failures.length} module(s) cannot be loaded by a\n` +
    '       deployed function. This builds and runs locally and fails in\n' +
    '       production, because Node only tolerates require() of an ES module\n' +
    '       from 22.12 onwards and the serverless runtime may not.\n\n' +
    '       Fix the dependency tree rather than the code — add an npm\n' +
    '       "overrides" entry pinning the offending package to a version that\n' +
    '       still ships CommonJS. package.json already pins jose for exactly\n' +
    '       this reason.',
)
process.exit(1)
