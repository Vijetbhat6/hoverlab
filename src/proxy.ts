/**
 * Auth proxy (formerly middleware — renamed for Next.js 16).
 *
 *  - Reads the `cssfx:session` cookie. If present + valid, the user is
 *    considered authenticated for routing purposes. (API routes do
 *    their own per-request verification via `getSession()`.)
 *  - Protected routes (/library, /playground, /effect/*, /account):
 *    redirect to /login?redirect=<original> if no valid session.
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
 * The catalog is PUBLIC. Browsing and copying are what the landing page
 * promises anonymous visitors ("no account needed to browse or copy"), and
 * every hub, category and detail page is hand-written content whose whole
 * acquisition value is long-tail search — "css shimmer skeleton loader",
 * "glassmorphism card hover", "react pricing section with toggle". Gating
 * roughly a thousand of those pages behind a login turned the entire
 * organic channel off and made the site contradict its own hero.
 *
 * What is gated instead is where an account actually earns its keep: the
 * account area itself and the playground, plus everything behind /api that
 * writes per-user state (favourites, bundles, sync) — those verify sessions
 * themselves in the route handlers rather than here.
 *
 * The earlier gate's reasoning still stands on its own terms and is worth
 * keeping in view: a sitemap full of URLs that 307 to /login is a quality
 * signal against the domain, and exempting crawlers from a gate humans hit
 * is cloaking. Both are true — which is why the gate came down rather than
 * being kept with a crawler hole punched in it. sitemap.ts and robots.ts
 * are back in step with what an anonymous visitor can actually load.
 */
const PROTECTED_PREFIXES = [
  '/account',
  // The editor. It saves remixes to the signed-in user, so it needs one.
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
