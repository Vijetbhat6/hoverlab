/**
 * Verify that a running deployment can sign people in, and is fit to launch —
 * before a user finds out that it is not.
 *
 * Needs no account, no password and no access to the host: it asks the
 * health endpoint, then exercises the auth surface with deliberately bogus
 * input and checks that every answer is JSON with the expected status. An
 * HTML body anywhere means a route threw, which is the failure this whole
 * set of checks exists to catch.
 *
 * Usage:
 *   npm run check:deploy -- https://your-deploy.vercel.app
 *   BASE=http://localhost:3007 npm run check:deploy
 *
 * Exits non-zero if the deployment is not fit to serve sign-in, so it can be
 * a post-deploy step in CI.
 */

const BASE = (process.argv[2] ?? process.env.BASE ?? 'http://localhost:3007').replace(
  /\/$/,
  '',
)

/**
 * Vercel's Protection Bypass for Automation secret, if the deployment is
 * behind Deployment Protection. Project → Settings → Deployment Protection →
 * Protection Bypass for Automation. Without it, every request to a protected
 * deployment is answered by Vercel's SSO gate and never reaches the app —
 * the checks below would then be grading the gate, not the site.
 */
const BYPASS = process.argv[3] ?? process.env.VERCEL_AUTOMATION_BYPASS_SECRET

const results = []
const record = (name, pass, detail = '') => {
  results.push({ name, pass, detail })
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

async function request(path, init) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      // Manual: an auth route must never redirect. Following redirects would
      // silently grade whatever the redirect lands on — which is exactly how
      // a protected deployment reports a confident, meaningless 401.
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/json',
        ...(BYPASS
          ? {
              'x-vercel-protection-bypass': BYPASS,
              'x-vercel-set-bypass-cookie': 'true',
            }
          : {}),
        ...(init?.headers ?? {}),
      },
    })
    const body = await res.text()
    let json = null
    try {
      json = body ? JSON.parse(body) : null
    } catch {
      /* left null: the body was not JSON, which is itself the finding */
    }
    return { res, json, body }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

console.log(`checking ${BASE}${BYPASS ? ' (with protection bypass)' : ''}\n`)

// 0. Is anything of ours even answering? A deployment behind Vercel's
//    Deployment Protection redirects every request to an SSO gate, which
//    then answers 401 to everything — including paths that could not
//    legitimately 401. Grading that gate produces confident nonsense, so
//    stop here and say what is actually in the way.
const gate = await request('/api/auth/me')
const gateEvidence = [
  gate.res?.headers.get('location') ?? '',
  gate.res?.headers.get('set-cookie') ?? '',
  gate.body ?? '',
].join(' ')
// Matched loosely on purpose: the gate answers browsers with a 302 to
// vercel.com/sso-api and API-shaped requests with a 401 JSON body, and the
// JSON escapes its slashes (vercel.com\/sso-api), so a URL-shaped pattern
// silently fails to match exactly when it matters.
if (/Protected deployment|vercel_auth_enabled|_vercel_sso_nonce|sso-api/.test(gateEvidence)) {
  console.error(
    'Deployment Protection is enabled — every request is intercepted by\n' +
      "Vercel's SSO gate, so none of these checks can reach the app.\n\n" +
      'Either:\n' +
      '  • Project → Settings → Deployment Protection → Protection Bypass for\n' +
      '    Automation, then re-run:\n' +
      `      npm run check:deploy -- ${BASE} <bypass-secret>\n` +
      '  • or disable protection for this deployment and re-run.\n',
  )
  process.exit(1)
}

// 1. Health. The one call that names the actual problem.
console.log('health:')
const health = await request('/api/health/auth')
if (health.error) {
  record('/api/health/auth reachable', false, health.error)
} else if (!health.json) {
  record(
    '/api/health/auth returns JSON',
    false,
    `HTTP ${health.res.status}, body starts: ${health.body.slice(0, 80)}`,
  )
} else {
  record('deployment reports healthy', health.json.ok === true)
  for (const c of health.json.checks ?? []) {
    if (c.status !== 'ok') {
      console.log(`        ${c.status.toUpperCase()}: ${c.name} — ${c.detail}`)
    }
  }
}

// 2. Sign-in with credentials that cannot be right. A 401 proves
//    the route ran, reached Firebase, and answered in JSON; a 5xx or an HTML
//    body is the signature of a misconfigured deployment.
console.log('\nsign-in path:')
const session = await request('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    email: 'nobody-health-check@example.invalid',
    password: 'not-a-real-password',
  }),
})
if (session.error) {
  record('POST /api/auth/login responds', false, session.error)
} else {
  record(
    'rejects bad credentials with 401',
    session.res.status === 401,
    `got HTTP ${session.res.status}`,
  )
  record(
    'answers in JSON, not an HTML error page',
    session.json !== null,
    session.json ? '' : `body starts: ${session.body.slice(0, 80)}`,
  )
  record(
    'the rejection explains itself',
    typeof session.json?.error === 'string' && session.json.error.length > 0,
    session.json?.error ?? '(no error field — the client would show a generic fallback)',
  )
}

// 3. Session lookup. 200 with a null user is the correct anonymous answer;
//    a 500 here means the server cannot reach Firebase at all.
console.log('\nsession lookup:')
const me = await request('/api/auth/me')
if (me.error) {
  record('GET /api/auth/me responds', false, me.error)
} else {
  record('anonymous session resolves', me.res.status === 200, `got HTTP ${me.res.status}`)
  record('returns a null user, not an error page', me.json !== null && 'user' in (me.json ?? {}))
}

// 4. Launch requirements. Not about signing in — about whether this
//    deployment is fit to take money and be crawled. Each of these was a
//    verified launch blocker, and each is a single GET away from being
//    provable rather than remembered.
console.log('\nlaunch requirements:')

for (const [path, why] of [
  ['/terms', 'Terms of Service'],
  ['/privacy', 'Privacy Policy'],
  ['/refunds', 'Refund Policy'],
  ['/licence', 'Licence — what Pro actually sells'],
]) {
  const page = await request(path)
  record(
    `${path} exists (${why})`,
    page.res?.status === 200,
    page.error ?? `got HTTP ${page.res?.status}`,
  )
}

// The operator's legal details live in src/lib/legal.ts and ship as
// detectable placeholders. A policy page naming "TO BE SET" is not a policy,
// and Polar will reject it — so find out here rather than from the reviewer.
const terms = await request('/terms')
record(
  'legal pages name a real operator',
  typeof terms.body === 'string' && !terms.body.includes('TO BE SET'),
  'set OPERATOR_LEGAL_NAME, OPERATOR_ADDRESS, OPERATOR_JURISDICTION and ' +
    'OPERATOR_CONTACT_EMAIL in the deployment environment, then redeploy — ' +
    'they are read at build time, so a running site will not pick them up',
)

// The catalog is meant to be public (see proxy.ts). A redirect here means
// the gate is back, in which case sitemap.ts and robots.ts are lying.
const library = await request('/library')
record(
  'catalog is reachable without a session',
  library.res?.status === 200,
  library.res?.status === 307 || library.res?.status === 302
    ? 'redirects to login — the auth gate is back, and the sitemap now advertises URLs that redirect'
    : `got HTTP ${library.res?.status}`,
)

// The newsletter route exists and validates. Deliberately posts something
// invalid: a 400 proves the handler ran without adding a real address to
// the list as a side effect of a health check.
const news = await request('/api/newsletter', {
  method: 'POST',
  body: JSON.stringify({ email: 'not-an-email' }),
})
record(
  'newsletter signups reach a real handler',
  news.res?.status === 400,
  news.res?.status === 503
    ? 'route is there but Firebase Admin is not configured — signups would be refused'
    : `expected 400 for a malformed address, got HTTP ${news.res?.status}`,
)

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) {
  console.error(
    '\nThis deployment is not ready. The health output above names the cause:\n' +
      'for the sign-in checks it is usually missing or malformed Firebase\n' +
      'credentials, and for the launch checks it is usually a page or an\n' +
      'operator detail that has not been filled in yet.',
  )
}
process.exit(failed.length ? 1 : 0)
