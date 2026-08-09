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
 * The catalog is gated: browsing it is an account feature, not a public
 * one. Every hub, category, detail page and the playground bounces an
 * anonymous visitor to /login?redirect=<original>, so they land back where
 * they were aiming once they sign in.
 *
 * This is a deliberate reversal of the earlier decision to open the
 * catalog for search traffic, and it costs exactly what that decision
 * bought: crawlers get a 307 on all ~4,300 artifact pages, so the
 * long-tail surface ("css shimmer skeleton loader", "glassmorphism card
 * hover") stops being indexable. There is no crawler exemption on
 * purpose — serving crawlers a page that humans are redirected away from
 * is cloaking, and Google can deindex a site for it. sitemap.ts and
 * robots.ts were trimmed to match rather than advertise URLs that all
 * redirect.
 *
 * What stays public: the marketing landing page, /login and /signup, the
 * docs (they sell the CLI to people who don't have accounts yet) and the
 * standalone /tools utilities, which are not catalog content.
 *
 * Two content paths remain reachable without a session and are NOT closed
 * by this file: /api/v1/* (the CLI and MCP server's only transport — it
 * has no key scheme to authenticate against yet) and /embed/<id> (a
 * cross-site <iframe> never sends a SameSite=Lax cookie, so gating it
 * would break every existing embed rather than gate it).
 */
const PROTECTED_PREFIXES = [
  '/account',
  // Catalog hubs and the unified browse surface.
  '/library',
  '/browse',
  '/category',
  '/blocks',
  '/pages',
  '/templates',
  '/paths',
  // Per-artifact detail pages. Singular and plural are distinct routes;
  // the match below is exact-or-with-slash, so '/page' never swallows
  // '/pages'.
  '/effect',
  '/block',
  '/page',
  '/template',
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
