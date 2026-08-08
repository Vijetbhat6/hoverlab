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
 */

import * as React from 'react'
import { Monitor, Smartphone } from 'lucide-react'

export interface PreviewRoute {
  path: string
  label: string
  preview: React.ReactNode
}

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
              layout without opening devtools. */}
          <button
            type="button"
            onClick={() => setNarrow((v) => !v)}
            aria-pressed={narrow}
            aria-label={narrow ? 'Preview at full width' : 'Preview at phone width'}
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
        <div
          className={`mx-auto transition-all ${
            narrow ? 'max-w-sm border-x border-border/60' : 'max-w-none'
          }`}
        >
          {routes.map((route, i) => (
            <div key={route.path} hidden={i !== active}>
              {route.preview}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
