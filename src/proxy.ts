/**
 * Auth proxy (formerly middleware — renamed for Next.js 16).
 *
 *  - Reads the `cssfx:session` cookie. If present + valid, the user is
 *    considered authenticated for routing purposes. (API routes do
 *    their own per-request verification via `getSession()`.)
 *  - Protected routes (/account, /playground): redirect to
 *    /login?redirect=<original> if no valid session.
 *  - Auth routes (/, /login, /signup): redirect to /library if the
 *    user is already authenticated — avoids showing the marketing /
 *    login page to logged-in users.
 *
 * In Next.js 16 the `middleware.ts` file convention was renamed to
 * `proxy.ts` and the exported function must be named `proxy` (or be a
 * default export). The `config.matcher` export is still supported.
 */

import { NextResponse, type NextRequest } from 'next/server'

/**
 * Paths that REQUIRE auth. Proxy redirects to /login if no valid session
 * cookie is present.
 *
 * The gate sits at the point of work, not at the point of looking. Anyone
 * — signed in or not — can browse every hub, category and artifact detail
 * page, read the source and copy it. An account is what you need to keep
 * things: the editor and everything under /account.
 *
 * This reverses the gate-the-catalog experiment, and it reverses it for
 * the reason that experiment documented but accepted: the catalog's whole
 * value in search is long-tail ("css shimmer skeleton loader",
 * "glassmorphism card hover"), and a 307 to /login on all ~1,000 artifact
 * pages traded that entire surface for an email capture on content
 * lib/billing/plans.ts already gives away — every artifact is readable and
 * copyable for free, and /api/v1 is public and unauthenticated by design.
 * The gate protected nothing that was being sold.
 *
 * There is still no crawler exemption anywhere in this codebase, and there
 * should never be one: serving crawlers a page humans are redirected away
 * from is cloaking. The point of opening the catalog is that the exemption
 * is no longer something anyone would want — crawler and human now get the
 * same page. sitemap.ts and robots.ts are restored to match.
 *
 * What remains gated:
 *  - /account — someone else's data by definition.
 *  - /playground — the editor. It is where saved state (bundles, brand
 *    presets, remixes) is produced rather than consumed, so it is the
 *    honest place to ask for an account. It is also absent from
 *    sitemap.ts: a signed-out crawler still gets a 307 here, and
 *    advertising a URL that redirects is the thing this file just stopped
 *    doing everywhere else.
 *
 * Two content paths stay reachable without a session and are NOT governed
 * by this file: /api/v1/* (the CLI and MCP server's only transport — it
 * has no key scheme to authenticate against yet) and /embed/<id> (a
 * cross-site <iframe> never sends a SameSite=Lax cookie, so gating it
 * would break every existing embed rather than gate it).
 */
const PROTECTED_PREFIXES = [
  '/account',
  // The editor.
  '/playground',
]

// Paths that should bounce logged-in users away to /library.
// (Auth pages don't make sense once you're already signed in.)
const AUTH_PATHS = new Set(['/', '/login', '/signup'])

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  // Skip everything else (API routes, _next/static, etc.) — let Next.js
  // handle them. The matcher below already filters most of these out,
  // but this is a defensive guard.
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Skip Open Graph / Twitter image routes — these MUST be public so
  // that social media crawlers (Slack, Twitter, Facebook, LinkedIn)
  // can fetch them without a session cookie. Crawlers don't authenticate,
  // so without this exception the OG image would 307-redirect to /login
  // and the share card would be blank.
  if (
    pathname.endsWith('/opengraph-image') ||
    pathname.endsWith('/twitter-image')
  ) {
    return NextResponse.next()
  }

  // Presence only, deliberately.
  //
  // This runs on the Edge runtime and the Firebase Admin SDK requires
  // Node.js, so the cookie cannot be verified here — only observed. That is
  // acceptable because nothing security-relevant is decided in this file:
  // it chooses which page to route to, and every route that returns account
  // data verifies the session properly via lib/session.ts on the server.
  //
  // The cost is that a stale cookie makes someone look signed in for routing
  // purposes. /api/auth/me expires exactly those cookies the moment it sees
  // one, so the state corrects itself on the next navigation rather than
  // trapping anyone on a redirect loop between /login and /library.
  const isAuthenticated = Boolean(req.cookies.get('cssfx:session')?.value)

  // 1. Protected route + not authenticated → /login?redirect=<original>
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  )
  if (isProtected && !isAuthenticated) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.search = `?redirect=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(loginUrl)
  }

  // 2. Auth route + already authenticated → /library
  if (AUTH_PATHS.has(pathname) && isAuthenticated) {
    const libUrl = req.nextUrl.clone()
    libUrl.pathname = '/library'
    libUrl.search = ''
    return NextResponse.redirect(libUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Run proxy on everything EXCEPT:
  //  - API routes (they handle their own auth)
  //  - Next internals (_next/static, _next/image, favicon, etc.)
  //  - static file extensions
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|logo.svg).*)',
  ],
}
