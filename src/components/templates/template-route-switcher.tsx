'use client'

/**
 * Preview a whole project by switching between its routes.
 *
 * A template cannot render as one element — it is several screens — so the
 * honest preview is the real address bar experience: pick a route, see that
 * screen. Every screen is the live page component, not a screenshot.
 *
 * The previews arrive as already-rendered `ReactNode`s in props. Server
 * components can be passed into a client component that way, which is what
 * lets this file own the tab state while the pages themselves stay off the
 * client graph — the alternative, importing the page registry here, would
 * pull all eight screens into the browser bundle to show one.
 *
 * All routes stay mounted and inactive ones are hidden with `hidden` rather
 * than unmounted. Switching back to a screen you have already visited keeps
 * its state — the sort you set on the customer table survives a trip to
 * Settings — which is what an actual app does.
 *
 * ── THE PHONE BUTTON IS A REAL VIEWPORT ─────────────────────────────────
 *
 * It used to be `max-w-sm` on the wrapper, and that was not a mobile
 * preview — it was the desktop layout squeezed into a narrow column.
 * Tailwind's breakpoints are viewport media queries, so `sm:` and `md:`
 * never changed and the thing being shown was a layout no phone would ever
 * render. `responsive-preview.tsx` has the long version of this argument;
 * the short version is that the control was lying.
 *
 * Every screen in a template is a catalog page, so each one already has a
 * `/preview/page/<id>` route standing — the same one the block and page
 * detail pages frame. Narrow mode points an iframe at it and gets a real
 * 390px viewport for free. Full width still renders the inline server
 * markup, for exactly the reasons that file gives: it is what a crawler
 * reads and what the screenshot script captures.
 */

import * as React from 'react'

import { PreviewGuard } from '@/components/preview-guard'
import { Monitor, Smartphone } from 'lucide-react'

export interface PreviewRoute {
  path: string
  label: string
  preview: React.ReactNode
  /**
   * The catalog page id backing this screen, which is what makes a real
   * mobile viewport possible. Optional: a route without one keeps the
   * inline preview at every width rather than framing a URL that 404s.
   */
  pageId?: string
}

/** iPhone 14/15 logical width — the narrowest mainstream phone worth testing. */
const PHONE_WIDTH = 390

export function TemplateRouteSwitcher({ routes }: { routes: PreviewRoute[] }) {
  const [active, setActive] = React.useState(0)
  const [narrow, setNarrow] = React.useState(false)

  if (routes.length === 0) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/40">
      {/* Browser chrome */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-muted/30 px-3 py-2">
        <div aria-hidden className="flex gap-1.5 pr-2">
          <span className="h-3 w-3 rounded-full bg-red-500/60" />
          <span className="h-3 w-3 rounded-full bg-amber-500/60" />
          <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
        </div>

        <div role="tablist" aria-label="Routes" className="flex flex-wrap gap-1">
          {routes.map((route, i) => (
            <button
              key={route.path}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                i === active
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {route.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <code className="hidden rounded-md bg-background px-2 py-1 font-mono text-xs text-muted-foreground sm:block">
            {routes[active].path}
          </code>

          {/* Width toggle — the fastest way to check a template's mobile
              layout without opening devtools. Hidden for a screen with no
              page id behind it, because there would be no real viewport to
              switch to and a squeezed column is what this used to get
              wrong. */}
          <button
            type="button"
            onClick={() => setNarrow((v) => !v)}
            aria-pressed={narrow}
            aria-label={narrow ? 'Preview at full width' : 'Preview at phone width'}
            hidden={!routes[active]!.pageId}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {narrow ? (
              <Monitor aria-hidden className="h-4 w-4" />
            ) : (
              <Smartphone aria-hidden className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div className="max-h-[36rem] overflow-y-auto bg-background">
        {narrow && routes[active]!.pageId ? (
          /*
            A real 390px viewport, so the template's own `sm:` and `md:`
            rules resolve the way they would on a phone. Keyed on the page
            id so switching routes while narrow loads the new screen rather
            than reusing the previous frame's document.
          */
          <div className="flex justify-center bg-muted/30 py-4">
            <iframe
              key={routes[active]!.pageId}
              src={`/preview/page/${routes[active]!.pageId}`}
              title={`${routes[active]!.label} at ${PHONE_WIDTH} pixels wide`}
              loading="lazy"
              style={{ width: PHONE_WIDTH }}
              className="h-[34rem] rounded-xl border border-border/60 bg-background shadow-sm"
            />
          </div>
        ) : (
          <div className="mx-auto max-w-none">
            {/*
              Same guard the block and page detail previews use: these are
              whole screens, so each one brings its own <h1> and its own
              navigation. Unguarded, the active route's headline outranked
              "SaaS Starter" as the page's heading and its nav links led out
              of the template and into 404s. See `preview-guard.tsx`.
            */}
            {routes.map((route, i) => (
              <div key={route.path} hidden={i !== active}>
                <PreviewGuard>{route.preview}</PreviewGuard>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
