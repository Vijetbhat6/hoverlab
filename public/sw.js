/**
 * Hoverlab service worker.
 *
 * Strategy:
 *  - App shell (HTML, JS, CSS, fonts) → stale-while-revalidate. The library
 *    is mostly static; users get instant loads from cache + background
 *    updates.
 *  - Effect data (generated-effects.json) → cache-first with revalidation.
 *    It's 1.6k effects and rarely changes.
 *  - Images / icons → cache-first.
 *  - API routes (/api/*) → network-only (always need fresh data).
 *  - Cross-origin requests → bypass (let the network handle them).
 *
 * Lifecycle:
 *  - On install: precache the app shell (just the start URL + manifest +
 *    icons). We don't precache all effect pages because there are 1,680 of
 *    them — the SW can lazily cache them on first visit.
 *  - On activate: clean up old cache versions.
 *  - On fetch: route by request destination.
 *
 * Updates:
 *  - When this file changes, the browser registers a new SW in the
 *    "waiting" state. We call `self.skipWaiting()` so it activates
 *    immediately, and `clients.claim()` so it controls the current page.
 *  - The page can listen for `controllerchange` and prompt the user to
 *    reload (we don't do this yet — keeping the UX simple).
 */

/*
  Bumped whenever PRECACHE_URLS changes.

  The install handler only runs for a NEW service worker, and a worker is
  new when this file's bytes change — but the caches it writes into are
  keyed by this string. Leaving it alone while adding precache entries
  means existing visitors keep their old cache and never receive the new
  ones; changing it makes `activate` drop the previous version and
  repopulate. v1 → v2: the designer tools joined the precache list.
*/
const VERSION = 'hoverlab-v2'
const SHELL_CACHE = `${VERSION}-shell`
const DATA_CACHE = `${VERSION}-data`
const IMG_CACHE = `${VERSION}-img`

/*
  URLs to precache on install.

  Short on purpose for the catalog — there are 1,680 effect pages and the
  rest of the shell (JS chunks, fonts) caches on first navigation.

  The tools hub is here for a different reason than the library is. The
  /tools pages are the one part of this site that genuinely works with no
  network at all: every one of them computes in the browser, loads no data
  and makes no request, which is a claim the hub prints on itself. Until
  this list included them that claim was only true for a tool you had
  already opened — going offline and reaching for the contrast checker got
  the offline page. Precaching the hub means the entry point survives, and
  `TOOL_PATHS` below means the tools people actually reach for do too.

  Not all thirty-six. Each one is a separate route with its own JS chunk,
  and precaching every chunk on install would spend several megabytes of
  someone's connection on tools they may never open — for a feature they
  did not ask for. These eight are the ones the hub's own ordering and the
  search terms behind it say are reached for most; the rest still cache
  themselves on first visit, as they always did.
*/
const TOOL_PATHS = [
  '/tools',
  '/tools/contrast',
  '/tools/palette',
  '/tools/gradient',
  '/tools/shadow',
  '/tools/tokens',
  '/tools/grid',
  '/tools/flexbox',
]

const PRECACHE_URLS = [
  '/library',
  ...TOOL_PATHS,
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon-32.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE)
      // Use addAll with { cache: 'reload' } to bypass the HTTP cache when
      // fetching the shell (so updates land faster).
      try {
        await cache.addAll(PRECACHE_URLS)
      } catch (e) {
        // If any precache request fails (e.g. offline during install), don't
        // abort the whole install — the SW can still cache lazily.
        console.warn('[SW] precache partial failure:', e.message)
      }
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old cache versions.
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION))
          .map((k) => caches.delete(k)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request

  // Only handle GET. POST/PUT/DELETE always go to network.
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // Don't intercept cross-origin requests (analytics, fonts from CDNs, etc.)
  // — let the browser handle them.
  if (url.origin !== self.location.origin) return

  // API routes → network-only. They need fresh data (auth, favorites, etc.)
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Effect data JSON → cache-first with revalidation.
  if (url.pathname.endsWith('/generated-effects.json') || url.pathname.includes('generated-effects')) {
    event.respondWith(staleWhileRevalidate(req, DATA_CACHE))
    return
  }

  // Images → cache-first.
  if (req.destination === 'image' || /\.(?:png|jpg|jpeg|gif|svg|webp|avif)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(req, IMG_CACHE))
    return
  }

  // Navigation requests (HTML pages) → network-first with offline fallback.
  // This ensures users get fresh content when online, but can still browse
  // cached pages when offline.
  if (req.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(req))
    return
  }

  // Static assets (JS, CSS, fonts) → stale-while-revalidate.
  if (
    req.destination === 'script' ||
    req.destination === 'style' ||
    req.destination === 'font' ||
    req.destination === 'manifest'
  ) {
    event.respondWith(staleWhileRevalidate(req, SHELL_CACHE))
    return
  }

  // Default: try network, fall back to cache.
  event.respondWith(
    fetch(req).catch(() => caches.match(req).then((r) => r || Response.error())),
  )
})

/* ----- Cache strategies ----- */

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(req)
  if (cached) return cached
  try {
    const res = await fetch(req)
    if (res.ok) cache.put(req, res.clone())
    return res
  } catch (e) {
    return Response.error()
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(req)
  const network = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(req, res.clone())
      return res
    })
    .catch(() => cached)
  return cached || network
}

async function networkFirstWithFallback(req) {
  const cache = await caches.open(SHELL_CACHE)
  try {
    const res = await fetch(req)
    if (res && res.ok) cache.put(req, res.clone())
    return res
  } catch (e) {
    // Try the exact URL first, then fall back to the nearest shell.
    const cached = await cache.match(req)
    if (cached) return cached
    /*
      A tool falls back to the tools hub, not to the library. Both are
      precached, and handing someone who asked for /tools/shadow a page of
      CSS effects is a worse answer than handing them the index of the
      section they were in — from which every other tool they have opened
      before is one cached click away.
    */
    const isTool = new URL(req.url).pathname.startsWith('/tools')
    const shell = await cache.match(isTool ? '/tools' : '/library')
    if (shell) return shell
    return new Response(
      `<!doctype html><meta charset="utf-8"><title>Offline — Hoverlab</title>
       <style>body{font-family:system-ui,sans-serif;background:#0b1020;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:2rem}</style>
       <h1>You're offline</h1>
       <p>Connect to the internet to continue browsing Hoverlab. Pages you've visited before are still available from cache.</p>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 },
    )
  }
}
