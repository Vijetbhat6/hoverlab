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
import { verifySessionToken } from '@/lib/auth'

/**
 * Paths that REQUIRE auth. Proxy redirects to /login if no valid session
 * cookie is present.
 *
 * The catalog is deliberately NOT in this list. /library, /effect/* and
 * /playground used to be gated, which meant every crawler hit on all
 * 1,600+ effect pages got a 307 to /login — the pages could never be
 * indexed, and the entire long-tail search surface ("css shimmer skeleton
 * loader", "glassmorphism card hover") was unreachable. That's the traffic
 * uiverse and Animista live on, and it was walled off.
 *
 * Browsing, previewing, and copying are public. The account-bound
 * features — synced favorites, synced bundles, billing — still require a
 * session, enforced per-request in the /api/sync/* and /api/account
 * routes rather than at the page level.
 */
const PROTECTED_PREFIXES = ['/account']

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

  const token = req.cookies.get('cssfx:session')?.value
  let isAuthenticated = false
  if (token) {
    const session = await verifySessionToken(token)
    isAuthenticated = !!session
  }

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
