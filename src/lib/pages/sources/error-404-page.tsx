/**
 * A 404 screen.
 *
 * Drop this at `app/not-found.tsx` in a Next.js project and it becomes the
 * app's 404 for every unmatched route.
 *
 * Deliberately keeps the site's own header and footer. A 404 that strips
 * the chrome tells the visitor they have left the site, when in fact they
 * are still on it and one click from what they wanted — the navigation is
 * the most useful thing on the page.
 */

import * as React from 'react'
import { NotFound404 } from '@/lib/blocks/sources/not-found-404'

export default function Error404Page() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Keep the chrome — the nav is the point. */}
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground"
            >
              A
            </span>
            Acme Inc
          </a>

          <nav aria-label="Main" className="flex items-center gap-5 text-sm">
            <a href="/docs" className="text-muted-foreground transition-colors hover:text-foreground">
              Docs
            </a>
            <a href="/pricing" className="text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </a>
            <a
              href="/signup"
              className="rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get started
            </a>
          </nav>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center">
        <NotFound404 />
      </div>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 text-xs text-muted-foreground">
          <span>© 2026 Acme Inc</span>
          <span>All systems operational</span>
        </div>
      </footer>
    </div>
  )
}
