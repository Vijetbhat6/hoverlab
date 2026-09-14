import type { Metadata } from 'next'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PreviewGuard } from '@/components/preview-guard'
import { BlockPicker } from '@/components/builder/block-picker'
import { BuilderExport } from '@/components/builder/builder-export'
import { BuilderSurface, type BuilderSection } from '@/components/builder/builder-surface'
import { BuilderThemeBar } from '@/components/builder/builder-theme-bar'
import { getBlockPreview } from '@/lib/blocks/registry'
import { BLOCK_INDEX } from '@/lib/blocks/block-index'
import { PAGE_COUNT } from '@/lib/pages/page-index'
import {
  builderHref,
  composedDeps,
  composePageSource,
  COMPOSITION_PARAM,
  installCommand,
  MAX_SECTIONS,
  parseComposition,
  serializeComposition,
  THEME_PARAM,
} from '@/lib/builder/compose'
import {
  compositionTheme,
  compositionThemeSheet,
  themeInstallCommand,
} from '@/lib/builder/theme'
import { absoluteUrl, siteUrl } from '@/lib/site'

/**
 * /builder — assemble blocks into a page, and leave with the source.
 *
 * ── WHY IT EXISTS ───────────────────────────────────────────────────────
 *
 * The gap `/compare` names in its own data. React Bits ships a Landing
 * Builder, Shadcnblocks a page builder, UI8 a Forge; this catalog shipped
 * every rung of the ladder — effects, blocks, pages, templates, kits — and
 * nothing that lets a visitor climb it themselves. The composition already
 * happens here, but only when WE do it: a page in `pages/` is its blocks,
 * imported by name and rendered in order. This is that act, handed over.
 *
 * ── WHY IT IS A SERVER COMPONENT DRIVEN BY THE URL ──────────────────────
 *
 * The obvious build is a client app holding an array in React state. This
 * is the opposite, and three things fall out of it that the obvious build
 * would have to add back one at a time:
 *
 *   The preview is real. Sections render from the same `BLOCK_REGISTRY` the
 *   grid and the detail pages use, server-side, in one pass. Not an iframe,
 *   not a screenshot, not a re-expressed copy of the markup that can drift
 *   from what you paste.
 *
 *   A layout is a link. The whole composition is the query string, so it
 *   pastes into a channel and opens for someone with no account. A builder
 *   is exactly where a competitor puts an account wall — Shadcnblocks locks
 *   its builder to the $399 tier — and `/compare` claims the only thing we
 *   withhold is the licence to ship.
 *
 *   Every edit is a navigation. Reorder and remove are `<Link>`s to the
 *   next composition, so the back button is an undo stack and the whole
 *   thing works with JavaScript off.
 *
 * The cost is a round trip per edit, which is the right trade for a control
 * a reader clicks a handful of times before copying the source.
 *
 * ── WHAT DRAGGING DID AND DID NOT CHANGE ────────────────────────────────
 *
 * The first version of this page had two arrows per row, and `/compare` said
 * so in the row where the competitors win: theirs drag, reorder, restyle and
 * run. All four are here now, and none of them moved the source of truth.
 * A drop is a `moveTo` and a `moveTo` is a URL; the theme is a second query
 * parameter; the runnable project is assembled from the same query string on
 * demand. `BuilderSurface` holds the gestures and the reasoning behind them.
 *
 * The arrows did not go away, because HTML5 drag-and-drop has no keyboard
 * interface at all — they are how the builder is operated without a mouse.
 *
 * ── WHAT IT STILL DELIBERATELY IS NOT ───────────────────────────────────
 *
 * A design tool. There is no canvas, no resizing and no per-block prop
 * editing, and the last one is the real line: blocks in this catalog take no
 * props, because they are files you leave with and change in your editor.
 * A prop panel would be a second, worse editor for the same text, and
 * building the other thing means owning a layout engine that disagrees with
 * Tailwind. What the reader can change here is what a token can change —
 * which, because every block styles itself through tokens and never a
 * literal colour, is the whole palette of all thirty sections at once.
 */

const TITLE = 'Page builder — compose blocks into a page — Hoverlab'
const DESCRIPTION =
  'Drag sections into order, theme the whole page at once, see the real thing render at any width, and leave with the source and the one command that installs it. No account, no export limit — the layout is the link.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl('/builder') },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl('/builder'),
    type: 'website',
  },
}

export default async function BuilderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const { ids, dropped, truncated } = parseComposition(params[COMPOSITION_PARAM])
  const theme = compositionTheme(params[THEME_PARAM])

  const shareUrl = absoluteUrl(builderHref(ids, theme.param))
  const themeCommand = themeInstallCommand(theme.param, siteUrl)

  const source = composePageSource(ids, {
    shareUrl,
    themeCommand: themeCommand ?? undefined,
  })
  const command = installCommand(ids)
  const deps = composedDeps(ids)

  const byId = new Map(BLOCK_INDEX.map((b) => [b.id, b]))

  /*
   * The two arrays `BuilderSurface` aligns by position, built together here
   * so they cannot come apart. `items` is plain data that crosses the RSC
   * boundary; `sections` is the rendered previews, which cross it as
   * serialized element trees.
   *
   * `PreviewGuard` on each, the same wrapper the detail pages use: a
   * composed page holds several blocks that each believe they own the <h1>,
   * and demo links that point at routes this site does not have.
   */
  const items: BuilderSection[] = ids.map((id) => {
    const meta = byId.get(id)
    return { id, name: meta?.name ?? id, category: meta?.category ?? 'Block' }
  })

  const sections = ids.map((id, i) => (
    <PreviewGuard key={`${id}-${i}`}>{getBlockPreview(id)}</PreviewGuard>
  ))

  const sandboxEndpoint = `/api/sandbox/builder?${COMPOSITION_PARAM}=${serializeComposition(
    ids,
  )}${theme.param ? `&${THEME_PARAM}=${encodeURIComponent(theme.param)}` : ''}`

  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-4 pb-8 pt-14 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Builder
          </p>
          <h1 className="type-page mt-3">Compose a page out of real sections.</h1>
          <p className="mt-4 max-w-2xl text-body text-muted-foreground">
            Pick sections from {BLOCK_INDEX.length} blocks, drag them into
            order, and theme the lot in one go. What renders below is the actual
            component, not a picture of it — the same one the {PAGE_COUNT} pages
            in the catalog are built from. When it looks right, run it or take
            the source.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            The layout and the theme both live in the address bar, so this page
            is shareable as a link and needs no account. Every edit is a normal
            navigation, which makes the back button an undo.
          </p>
        </section>

        {/* ------------------------------------------------------------ *
            Notices. Both describe something that already happened to the
            reader's input, so they sit above the outline rather than in a
            toast that a shared link would never fire.
         * ------------------------------------------------------------ */}
        {(dropped.length > 0 || truncated) && (
          <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
              {dropped.length > 0 && (
                <p>
                  <span className="font-medium">
                    {dropped.length} section{dropped.length === 1 ? '' : 's'} in
                    this link could not be placed:
                  </span>{' '}
                  <span className="font-mono text-xs">{dropped.join(', ')}</span>.
                  A block was probably renamed after the link was made. The rest
                  of the layout is intact.
                </p>
              )}
              {truncated && (
                <p className={dropped.length > 0 ? 'mt-2' : undefined}>
                  A composition holds at most {MAX_SECTIONS} sections; the extras
                  in this link were dropped.
                </p>
              )}
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------ *
            The theme. Above the canvas rather than beside the export,
            because it changes what the reader is looking at — a control
            whose effect is visible below it belongs above it.
         * ------------------------------------------------------------ */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-2 sm:px-6 lg:px-8">
          <BuilderThemeBar ids={ids} theme={theme.state} malformed={theme.malformed} />
        </section>

        {/* ------------------------------------------------------------ *
            The outline, the canvas, and the gestures over both.
         * ------------------------------------------------------------ */}
        <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {/* The theme's token overrides, scoped to the canvas wrapper.
              Rendered here rather than inside the client surface so it is
              in the first byte of HTML: injecting it after hydration
              would paint the composition twice, once in the wrong palette. */}
          {theme.css ? <style>{theme.css}</style> : null}

          <BuilderSurface items={items} theme={theme.param} sections={sections} />
        </section>

        {/* -------------------------------------------------------- *
            Add a section.
         * -------------------------------------------------------- */}
        <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="type-section">Add a section</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Every block in the catalog, filtered by what it is. Click to append
            to the end of the page, or drag one into the outline to place it.
          </p>
          <BlockPicker
            current={ids}
            atCapacity={ids.length >= MAX_SECTIONS}
            theme={theme.param}
          />
        </section>

        {/* -------------------------------------------------------- *
            The point of the page.
         * -------------------------------------------------------- */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
          <h2 className="type-section">Take it with you</h2>
          <BuilderExport
            source={source}
            command={command}
            deps={deps}
            count={ids.length}
            shareUrl={shareUrl}
            themeCommand={themeCommand}
            themeSheet={theme.state ? compositionThemeSheet(theme.state) : null}
            sandboxEndpoint={sandboxEndpoint}
          />
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
