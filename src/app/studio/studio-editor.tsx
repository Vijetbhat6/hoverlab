'use client'

/**
 * Hoverlab Studio — one editor, and the layout is the argument.
 *
 * ── WHY THE CANVAS IS PINNED AND THE TABS SCROLL ────────────────────────
 *
 * Because every control here changes the canvas, and a control whose
 * result is off the top of the screen is a control you are operating
 * blind. `ToolWorkbench` exists for exactly this and was measured on the
 * running app: by the time you reach the last control on `/tools/tokens`
 * the preview is 0% visible. This is the same two-column shell with the
 * same `sticky`, hand-rolled rather than reused for one reason — the tabs
 * need to be the scrolling column and `ToolWorkbench` takes exactly two
 * children in a fixed order, so the Identity panel above both would have
 * had nowhere to go.
 *
 * ── WHY IDENTITY IS ABOVE THE TABS AND NOT ONE OF THEM ──────────────────
 *
 * Style, Variables and Agent are three views of one system. Identity is
 * the thing they are describing, so it stays on screen while you use them;
 * behind a tab it becomes a form filled in once and never revisited, which
 * is how brand guidelines end up describing a product that has since
 * changed. It collapses, and it starts closed once there is something in
 * it. See `identity-panel.tsx`.
 *
 * ── WHAT `useToolState` IS DOING HERE ───────────────────────────────────
 *
 * Everything the thirty-six tools get for free, and the studio needs all
 * of it: `localStorage` on every change so a brand survives a reload,
 * undo/redo with drag coalescing, named presets on an account, and a
 * shareable link. The studio is not under `/tools` — see `STUDIO_TOOL_ID`
 * — but the hook takes the id as a string and cares about nothing else.
 *
 * The share link is the opaque `#s=` fragment rather than a readable
 * permalink, and deliberately: the readable ones exist to be indexed, and
 * most of this state is free prose. `sanitizeStudio` is therefore load
 * -bearing, not belt and braces — `#s=` is the one restore path with a
 * stranger on the other end, and this is the one tool whose state is
 * rendered straight into a document the visitor is invited to paste into a
 * coding agent. See `coerceStudio`.
 *
 * ── WHY THE THEME IS NOT APPLIED TO THE PAGE ────────────────────────────
 *
 * An editor that repaints its own chrome as you work is an editor you
 * cannot use: the contrast readout, the tab you are on and the warning
 * telling you the accent fails are all drawn in the colours being warned
 * about. So the canvas is scoped (see `tokenVars`) and applying the look
 * site-wide is an explicit button, which is also the honest place for it —
 * the site's own theming is the mechanism that shows the warm/cool
 * neutrals the canvas has to flatten.
 */

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Globe, Layers, Sparkles } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { IdentityPanel } from '@/components/studio/identity-panel'
import { StudioCanvas } from '@/components/studio/studio-canvas'
import { StyleTab } from '@/components/studio/style-tab'
import { VariablesTab } from '@/components/studio/variables-tab'
import { AgentTab } from '@/components/studio/agent-tab'
import { useToolState } from '@/hooks/use-tool-state'
import { useThemeStudio } from '@/hooks/use-theme-studio'
import { track } from '@/lib/analytics'
import {
  STUDIO_DEFAULTS,
  STUDIO_TOOL_ID,
  coerceStudio,
  repairStudio,
  studioSeedFromParams,
  type StudioState,
} from '@/lib/studio/state'

export interface StudioEditorProps {
  /** Absolute site origin, resolved server-side. See `AgentTabProps`. */
  origin: string
}

export function StudioEditor({ origin }: StudioEditorProps) {
  /*
    Two guards, and they are not redundant. `sanitizeShared` may reject a
    shared `#s=` link outright — the visitor still has their own session
    under it. `coerce` may not: it runs on `localStorage` and on a saved
    preset, where under it there is nothing but defaults, so a malformed
    field gets repaired rather than costing somebody their brand. See the
    note on the option; this state is the first nested one in the codebase
    and the hook's shallow merge cannot repair it alone.
  */
  const tool = useToolState<StudioState>(STUDIO_TOOL_ID, STUDIO_DEFAULTS, {
    sanitizeShared: coerceStudio,
    coerce: repairStudio,
  })
  const { state, setState } = tool
  const site = useThemeStudio()
  const [tab, setTab] = React.useState('style')
  const identityRef = React.useRef<HTMLDivElement>(null)

  /*
    Seed from the folded-in tools' own query parameters — `?hue=&chroma=`
    from the token generator, `?base=&scheme=` from the palette one — so
    arriving from either lands on the decisions already made rather than on
    a blank canvas.

    `window.location` rather than `useSearchParams`, which would force a
    Suspense boundary around the whole editor for some optional params, and
    the same call `/tools/tokens` already makes for its `?base=` handoff.

    Waits on `hydrating` so the `localStorage` restore cannot land after
    this and overwrite it, then clears the query so the visitor's own
    subsequent edits survive a reload. Only the theme and palette halves
    are taken: a URL cannot carry an identity, and replacing a stored one
    with defaults because a link mentioned a hue would be destroying the
    part that was expensive to write.
  */
  React.useEffect(() => {
    if (tool.hydrating) return
    const seed = studioSeedFromParams(new URLSearchParams(window.location.search))
    if (!seed) return
    setState((s) => ({ ...s, theme: seed.theme, paletteBase: seed.paletteBase, paletteScheme: seed.paletteScheme }))
    window.history.replaceState(null, '', window.location.pathname)
  }, [tool.hydrating, setState])

  const resetLook = () =>
    setState((s) => ({
      ...s,
      theme: STUDIO_DEFAULTS.theme,
      paletteBase: STUDIO_DEFAULTS.paletteBase,
      paletteScheme: STUDIO_DEFAULTS.paletteScheme,
    }))

  function focusIdentity() {
    setTab('style')
    identityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /*
    Push the look onto the site's own live theming. This is the one place
    the warm/cool neutral pair is actually visible — the canvas derives the
    shadcn ladder, which flattens it — and it is also the strongest exit
    from the editor: 291 blocks in your colours is a more convincing answer
    to "would this suit my product" than a card in a preview pane.
  */
  function applyToSite() {
    site.set(state.theme)
    track('studio_apply_site', { font: state.theme.fontId })
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />

      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8"
      >
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-lg shadow-primary/30">
            <Layers className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="type-page">Hoverlab Studio</h1>
            <p className="text-body mt-1.5 max-w-2xl text-pretty text-sm sm:text-base">
              One editor for a whole design system — the colours, the type and the
              corners, and the half a token file cannot carry: who it is for, how it
              sounds, and what it must never do. It leaves as a document your agent
              can read.
            </p>
          </div>
        </div>

        <div ref={identityRef} className="mb-6 scroll-mt-4">
          <IdentityPanel
            identity={state.identity}
            onChange={(update) => setState((s) => ({ ...s, identity: update(s.identity) }))}
            hydrating={tool.hydrating}
          />
        </div>

        {/*
          36rem for the canvas, not the 380px a tool's control column takes.
          Two panes side by side is the whole argument of the canvas, and at
          26rem each pane was 12rem wide — "api-gateway" wrapped onto three
          lines and the button row stacked, so the preview was showing a
          layout failure of its own making rather than the theme.

          `minmax(0,...)` on both tracks, and the left one carries `min-w-0`
          as well: a grid item's `min-width` is `auto`, which refuses to
          shrink below its content, and a `<pre>` holding an 80-line token
          block has no wrap points. Without both, the CSS on the Variables
          tab grows the first column and pushes the canvas off-screen — the
          trap `adding a designer tool` already records once.
        */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,36rem)]">
          {/* ---- The tabs: the scrolling column ------------------- */}
          <div className="min-w-0">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="style">Style</TabsTrigger>
                <TabsTrigger value="variables">Variables</TabsTrigger>
                <TabsTrigger value="agent">Agent</TabsTrigger>
              </TabsList>

              <TabsContent value="style" className="mt-4">
                <StyleTab state={state} onChange={setState} onResetLook={resetLook} />
              </TabsContent>

              <TabsContent value="variables" className="mt-4">
                <VariablesTab state={state} />
              </TabsContent>

              <TabsContent value="agent" className="mt-4">
                <AgentTab state={state} origin={origin} onFocusIdentity={focusIdentity} />
              </TabsContent>
            </Tabs>

            {/* After the work, never in front of it. Asking for an account
                before the system exists is a toll booth; asking once there
                is a brand worth keeping is an offer. */}
            <ToolPresetsBar tool={tool} noun="design system" className="mt-6" />
          </div>

          {/* ---- The canvas: pinned --------------------------------
              `self-start` is the part that matters — a grid item stretches
              to its row by default, and a stretched item is already as
              tall as the row, so `sticky` has no travel and silently does
              nothing. The same trap `ToolWorkbench` documents.
          */}
          <div className="xl:sticky xl:top-4 xl:self-start">
            <StudioCanvas state={state} />

            <div className="mt-4 rounded-xl border border-border/60 bg-card/60 p-4">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                <Globe aria-hidden className="h-4 w-4 text-primary" />
                See it on the real catalog
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Applies the four axes to this whole site. Every block, page and
                template preview is live React against the document&rsquo;s tokens, so
                all of them redraw — nothing on those pages is a screenshot. It is
                also the only place the warm and cool neutrals show, since the canvas
                above has to flatten them.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={applyToSite}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Sparkles aria-hidden className="h-3.5 w-3.5" />
                  Apply to the site
                </button>
                <Link
                  href="/blocks"
                  className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-4"
                >
                  Then browse the blocks
                  <ArrowRight aria-hidden className="h-3 w-3" />
                </Link>
                {site.isCustom ? (
                  <button
                    type="button"
                    onClick={site.reset}
                    className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Put the site back
                  </button>
                ) : null}
              </div>
              <p aria-live="polite" className="mt-2 text-[11px] text-muted-foreground">
                {site.ready && site.isCustom
                  ? 'The site is wearing your theme. Kept in this browser; nothing is sent anywhere.'
                  : 'Kept in this browser. Nothing is sent anywhere, signed in or not.'}
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
