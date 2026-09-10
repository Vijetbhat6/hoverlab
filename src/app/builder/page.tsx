import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowDown, ArrowUp, Layers, Plus, X } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PreviewGuard } from '@/components/preview-guard'
import { BlockPicker } from '@/components/builder/block-picker'
import { BuilderExport } from '@/components/builder/builder-export'
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
  moveAt,
  parseComposition,
  removeAt,
} from '@/lib/builder/compose'
import { absoluteUrl } from '@/lib/site'

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
 *   is exactly where a competitor puts an account wall, and `/compare`
 *   claims the only thing we withhold is the licence to ship.
 *
 *   Every edit is a navigation. Reorder and remove are `<Link>`s to the
 *   next composition, so the back button is an undo stack and the whole
 *   thing works with JavaScript off.
 *
 * The cost is a round trip per edit, which is the right trade for a control
 * a reader clicks a handful of times before copying the source.
 *
 * ── WHAT IT DELIBERATELY IS NOT ─────────────────────────────────────────
 *
 * A design tool. There is no dragging, no resizing, no per-block prop
 * editing and no canvas. Blocks are chosen and ordered; everything else is
 * done in your editor, on the file this hands you. Building the other thing
 * means owning a layout engine that disagrees with Tailwind, and the
 * catalog's whole argument is that you leave with real source.
 */

const TITLE = 'Page builder — compose blocks into a page — Hoverlab'
const DESCRIPTION =
  'Pick sections, order them, see the real thing render, and leave with the page source and the one command that installs it. No account, no export limit — the layout is the link.'

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

  const source = composePageSource(ids, {
    shareUrl: absoluteUrl(builderHref(ids)),
  })
  const command = installCommand(ids)
  const deps = composedDeps(ids)
  const byId = new Map(BLOCK_INDEX.map((b) => [b.id, b]))

  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-14 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Builder
          </p>
          <h1 className="type-page mt-3">Compose a page out of real sections.</h1>
          <p className="mt-4 max-w-2xl text-body text-muted-foreground">
            Pick sections from {BLOCK_INDEX.length} blocks and order them. What
            renders below is the actual component, not a picture of it — the
            same one the {PAGE_COUNT} pages in the catalog are built from. When
            it looks right, take the source.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            The layout lives in the address bar, so this page is shareable as a
            link and needs no account. Reordering is a normal navigation, which
            makes the back button an undo.
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

        <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)]">
            {/* -------------------------------------------------------- *
                The outline: what is in the page, and the only controls
                that change it.
             * -------------------------------------------------------- */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="flex items-center justify-between">
                <h2 className="type-section flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" aria-hidden />
                  Outline
                </h2>
                <span className="text-xs text-muted-foreground">
                  {ids.length} / {MAX_SECTIONS}
                </span>
              </div>

              {ids.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                  Nothing in the page yet. Add a section below — a hero is the
                  usual first one.
                </p>
              ) : (
                <ol className="mt-4 space-y-2">
                  {ids.map((id, i) => {
                    const meta = byId.get(id)
                    return (
                      <li
                        key={`${id}-${i}`}
                        className="flex items-start gap-2 rounded-xl border border-border/60 bg-card/50 p-3"
                      >
                        <span className="mt-0.5 w-5 shrink-0 text-xs tabular-nums text-muted-foreground">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/block/${id}`}
                            className="block truncate text-sm font-medium underline-offset-4 hover:underline"
                          >
                            {meta?.name ?? id}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {meta?.category ?? 'Block'}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <OutlineButton
                            href={builderHref(moveAt(ids, i, -1))}
                            disabled={i === 0}
                            label={`Move ${meta?.name ?? id} up`}
                          >
                            <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                          </OutlineButton>
                          <OutlineButton
                            href={builderHref(moveAt(ids, i, 1))}
                            disabled={i === ids.length - 1}
                            label={`Move ${meta?.name ?? id} down`}
                          >
                            <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                          </OutlineButton>
                          <OutlineButton
                            href={builderHref(removeAt(ids, i))}
                            label={`Remove ${meta?.name ?? id}`}
                          >
                            <X className="h-3.5 w-3.5" aria-hidden />
                          </OutlineButton>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}

              {ids.length > 0 && (
                <Link
                  href="/builder"
                  className="mt-3 inline-block text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Start over
                </Link>
              )}
            </div>

            {/* -------------------------------------------------------- *
                The preview. Real components, stacked, each wrapped in the
                same PreviewGuard the detail pages use — a composed page
                holds several blocks that each believe they own the <h1>,
                and demo links that point at routes this site does not have.
             * -------------------------------------------------------- */}
            <div className="min-w-0">
              <h2 className="type-section">Preview</h2>
              {ids.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
                  Your page renders here as you add sections.
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-background">
                  {ids.map((id, i) => (
                    <div
                      key={`${id}-${i}`}
                      className="border-b border-border/40 last:border-b-0"
                    >
                      <PreviewGuard>{getBlockPreview(id)}</PreviewGuard>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- *
            Add a section.
         * -------------------------------------------------------- */}
        <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="type-section flex items-center gap-2">
            <Plus className="h-4 w-4 text-muted-foreground" aria-hidden />
            Add a section
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Every block in the catalog, filtered by what it is. Sections are
            appended to the end of the page; reorder them in the outline.
          </p>
          <BlockPicker current={ids} atCapacity={ids.length >= MAX_SECTIONS} />
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
            shareUrl={absoluteUrl(builderHref(ids))}
          />
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

/**
 * One outline control.
 *
 * A disabled control renders as a `<span>` rather than a greyed `<a>`,
 * because an anchor with no href is not focusable and an anchor that points
 * at the composition it already is would be a navigation to nowhere.
 */
function OutlineButton({
  href,
  disabled = false,
  label,
  children,
}: {
  href: string
  disabled?: boolean
  label: string
  children: React.ReactNode
}) {
  const shape =
    'inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60'

  if (disabled) {
    return (
      <span className={`${shape} text-muted-foreground/40`} aria-hidden>
        {children}
      </span>
    )
  }

  return (
    <Link
      href={href}
      scroll={false}
      className={`${shape} text-muted-foreground transition-colors hover:bg-muted hover:text-foreground`}
    >
      {children}
      <span className="sr-only">{label}</span>
    </Link>
  )
}
