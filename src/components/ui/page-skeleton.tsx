import * as React from 'react'

import { SiteHeader } from '@/components/site-header'
import { BrandColorPicker } from '@/components/brand-color-picker'
import { cn } from '@/lib/utils'

/**
 * <PageSkeleton> — the shape of a page, for the moment before it exists.
 *
 * WHERE THIS IS USED, AND WHERE IT IS NOT
 *
 * A `loading.tsx` wraps its segment's page in a <Suspense> boundary, and the
 * boundary's fallback is what a visitor sees until the server has finished
 * rendering. On a page that was prerendered at build time there is no such
 * moment: the HTML already contains the finished page, so the fallback is
 * never displayed and the file is dead weight that only looks like a
 * feature. So `loading.tsx` exists only on the routes that the last
 * `next build` did NOT prerender — the ones that read `searchParams` on the
 * server and therefore render on every request, as a paid function call:
 *
 *   /browse, /builder, /assets/[family]
 *   /tools/{contrast, gradient, palette, shadow, tokens, typography}
 *
 * On those, a click on a link used to change nothing at all for as long as
 * the function took to wake and render — the old page just sat there, which
 * reads as a dead link. With a fallback, the route changes on the click.
 *
 * It is deliberately NOT on /preview/[level]/[slug] (chromeless; it is the
 * document loaded inside an iframe, and a skeleton there would flash inside
 * every preview tile), on /preview/builder for the same reason, or on
 * /account, /collections, /playground, /library and /studio, which are
 * prerendered and draw their own loading states on the client.
 *
 * WHAT IT PROMISES
 *
 *   - It has no data. Nothing is fetched and nothing is read from the
 *     request, so it can be rendered by a route that has not resolved its
 *     params — and it is a plain Server Component, free of client JS of its
 *     own (the header it may mount is the one the real page mounts anyway).
 *   - It does not shift the page. Every layout below uses the container,
 *     padding and header structure of the page it stands in for, so the
 *     real content replaces bars of roughly the same height inside the same
 *     box. Where the real page mounts <SiteHeader> itself, `withHeader`
 *     mounts the identical component in the identical place — one header,
 *     swapped for itself, rather than a bar swapped for a header.
 *   - It honours reduced motion. The pulse is `motion-safe:` only, so a
 *     visitor who asks for less motion gets still, quiet blocks — and the
 *     provider's manual toggle, which zeroes animation durations globally,
 *     covers the case where the OS setting is not the one being used.
 *   - It is announced once. The root is `aria-busy` and holds a
 *     `role="status"` line reading "Loading…", visually hidden; every
 *     decorative bar is `aria-hidden`, so a screen reader hears one word
 *     rather than forty empty boxes. The root is `relative` because the
 *     hidden line is absolutely positioned, and one that is not contained
 *     escapes to the viewport (the trap `check:overflow` exists for).
 *
 * It is not a substitute for a page's own empty or loading state: a client
 * component that fetches after mount still needs its own. This is for the
 * gap BEFORE the page exists, not the one inside it.
 */

/* ------------------------------------------------------------------ *
 *  Bone — one grey block
 * ------------------------------------------------------------------ */

/**
 * A single placeholder block.
 *
 * Not the shared `<Skeleton>` from `ui/skeleton.tsx`, which pulses
 * unconditionally: this one only animates for visitors who have not asked
 * for reduced motion. `bg-muted` rather than `bg-accent` so the block reads
 * as a placeholder on both the page background and on a card.
 */
function Bone({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('rounded-md bg-muted motion-safe:animate-pulse', className)}
    />
  )
}

/* ------------------------------------------------------------------ *
 *  Layouts
 * ------------------------------------------------------------------ */

/** A row of card placeholders, sized like the catalog's own tiles. */
function CardGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-border/60 bg-card/60"
        >
          <Bone className="h-40 rounded-none" />
          <div className="space-y-2 border-t border-border/60 px-3 py-2.5">
            <Bone className="h-4 w-2/3" />
            <Bone className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * A catalog hub — /browse and /assets/[family].
 *
 * Mirrors `max-w-7xl px-4 py-12`, the centred badge / heading / paragraph
 * block and the search field that sit at the top of /browse. Those sit
 * inside `<CatalogLayout>`'s <main>, so this renders content only: the
 * layout above it (header, theme bar, footer) is already on screen and
 * stays there.
 */
function HubLayout() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div aria-hidden className="mx-auto flex max-w-3xl flex-col items-center">
          <Bone className="h-7 w-28 rounded-full" />
          <Bone className="mt-5 h-9 w-3/4 max-w-md sm:h-10" />
          <Bone className="mt-4 h-4 w-full" />
          <Bone className="mt-2 h-4 w-2/3" />
        </div>
        <Bone className="mx-auto mt-8 h-11 max-w-xl rounded-xl" />
        <div aria-hidden className="mt-6 flex flex-wrap justify-center gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Bone key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <CardGrid className="mt-10" count={6} />
      </div>
    </div>
  )
}

/**
 * A designer tool — the shell `<ToolLayout>` draws.
 *
 * Back link, the 44px icon badge, a heading and a tagline, then the working
 * area as two panes. The panes are a shape, not a promise: the six tools
 * that use this differ inside them, and pretending otherwise would make the
 * skeleton a layout of its own to keep in step. They are `min-h` so the
 * page does not collapse to the header before the tool arrives.
 */
function ToolLayoutSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div aria-hidden className="mb-8">
        <Bone className="-ms-2 mb-4 h-8 w-40" />
        <div className="flex items-start gap-3">
          <Bone className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <Bone className="h-8 w-56 max-w-full sm:h-9" />
            <Bone className="mt-2.5 h-4 w-full max-w-2xl" />
          </div>
        </div>
      </div>
      <div aria-hidden className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="min-h-[24rem] space-y-4 rounded-xl border border-border/60 bg-card/60 p-5">
          <Bone className="h-4 w-1/3" />
          <Bone className="h-10 w-full" />
          <Bone className="h-4 w-1/4" />
          <Bone className="h-10 w-full" />
          <Bone className="h-4 w-2/5" />
          <Bone className="h-24 w-full" />
        </div>
        <div className="min-h-[24rem] rounded-xl border border-border/60 bg-card/60 p-5">
          <Bone className="h-full min-h-[22rem] w-full" />
        </div>
      </div>
    </div>
  )
}

/**
 * The page builder — a left-aligned intro, a toolbar, and stacked sections.
 *
 * `/builder` renders every chosen block's real preview on the server, which
 * is the slow part and the reason it is on this list; the skeleton's
 * stacked blocks stand in for those previews.
 */
function BuilderLayoutSkeleton() {
  return (
    <div className="flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-14 sm:px-6 lg:px-8">
        <div aria-hidden>
          <Bone className="h-3 w-16" />
          <Bone className="mt-3 h-9 w-full max-w-xl sm:h-10" />
          <Bone className="mt-4 h-4 w-full max-w-2xl" />
          <Bone className="mt-2 h-4 w-3/4 max-w-2xl" />
        </div>
      </div>
      <div
        aria-hidden
        className="mx-auto w-full max-w-6xl space-y-4 px-4 pb-16 sm:px-6 lg:px-8"
      >
        <Bone className="h-12 w-full rounded-xl" />
        <Bone className="h-56 w-full rounded-xl" />
        <Bone className="h-44 w-full rounded-xl" />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 *  <PageSkeleton>
 * ------------------------------------------------------------------ */

export type PageSkeletonLayout = 'hub' | 'tool' | 'builder'

export interface PageSkeletonProps {
  /** Which real page this stands in for. */
  layout: PageSkeletonLayout
  /**
   * Mount <SiteHeader> above the skeleton.
   *
   * True for pages that render their own header (/builder, every tool), so
   * the fallback shows the same header in the same place. False for pages
   * under `<CatalogLayout>`, whose layout keeps the header on screen
   * across the navigation and would otherwise draw it twice.
   */
  withHeader?: boolean
  /**
   * Tools put the brand-colour picker in the header's action slot. The same
   * control is drawn here so the header does not change shape when the real
   * page replaces the fallback.
   */
  brandPicker?: boolean
  /** What the screen reader says. Defaults to "Loading…". */
  label?: string
  className?: string
}

export function PageSkeleton({
  layout,
  withHeader = false,
  brandPicker = false,
  label = 'Loading…',
  className,
}: PageSkeletonProps) {
  /*
   * The frame is the real page's frame, not a generic one: a full-height
   * flex column when the page is one (so a footer would sit at the bottom),
   * and a bare wrapper when the layout above supplies <main>.
   *
   * <main id="main-content"> only where the page owns its landmark. The
   * skip link in <SiteHeader> points at that id, and it has to keep landing
   * somewhere during the wait rather than becoming a dead anchor.
   */
  const ownsLandmark = withHeader
  const Content =
    layout === 'hub' ? (
      <HubLayout />
    ) : layout === 'tool' ? (
      <ToolLayoutSkeleton />
    ) : (
      <BuilderLayoutSkeleton />
    )

  const status = (
    <p role="status" className="sr-only">
      {label}
    </p>
  )

  if (!ownsLandmark) {
    return (
      <div aria-busy="true" className={cn('relative bg-background text-foreground', className)}>
        {status}
        {Content}
      </div>
    )
  }

  return (
    <div
      aria-busy="true"
      className={cn('relative flex min-h-screen flex-col bg-background text-foreground', className)}
    >
      <SiteHeader actions={brandPicker ? <BrandColorPicker /> : undefined} />
      <main id="main-content" className="flex flex-1 flex-col">
        {status}
        {Content}
      </main>
    </div>
  )
}

/**
 * The fallback for a designer tool.
 *
 * Six tool routes read `searchParams` on the server — their readable
 * `?query` permalinks are what make them worth indexing — and so render per
 * request. Each has a one-line `loading.tsx` that re-exports this, the same
 * pattern the catalog routes use for `CatalogLayout`. It is not one
 * `tools/loading.tsx`: that would also wrap the thirty-odd tools that are
 * prerendered and never show a fallback, which is the file-that-ticks-a-box
 * this component's header rules out.
 *
 * Header and brand picker included because `<ToolLayout>` mounts both
 * itself.
 */
export function ToolPageSkeleton() {
  return <PageSkeleton layout="tool" withHeader brandPicker label="Loading the tool…" />
}
