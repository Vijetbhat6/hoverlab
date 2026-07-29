'use client'

/**
 * Registers the service worker on the client.
 *
 * Mounted once at the root. We wait for `window.load` so the SW registration
 * doesn't compete with the initial page render for bandwidth.
 *
 * In development we skip registration (Next.js's HMR + Turbopack doesn't
 * play well with cached assets).
 */

import * as React from 'react'

export function ServiceWorkerRegister() {
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return

    function register() {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => {
          // Don't crash — SW is a progressive enhancement.
          console.warn('[SW] registration failed:', err.message)
        })
    }

    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register, { once: true })
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}
