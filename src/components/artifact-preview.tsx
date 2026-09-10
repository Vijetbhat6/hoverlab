/**
 * The preview shell shared by every tier above `effect`.
 *
 * Blocks and pages both render as real React inside the page rather than in
 * an iframe. That is a deliberate trade: an iframe would isolate styles
 * perfectly, but it also costs a document per card, breaks the shared theme,
 * and would show every artifact in light mode while the site sits in dark.
 * They are built on the same semantic tokens the site is, so rendering them
 * inline shows them under the visitor's actual theme — the honest preview.
 *
 * These take an already-resolved `React.ReactNode` rather than a registry
 * key, so the shell has no idea which tier it is drawing. The per-tier
 * wrappers do the lookup.
 *
 * Server components. Nothing here holds state, so a grid of live previews
 * costs no hydration.
 */

import * as React from 'react'

import { PreviewGuard } from '@/components/preview-guard'

/* ------------------------------------------------------------------ *
 *  Full-size
 * ------------------------------------------------------------------ */

export function ArtifactPreview({
  preview,
  missingKey,
}: {
  preview: React.ReactNode | undefined
  missingKey: string
}) {
  if (!preview) return <MissingPreview componentKey={missingKey} />

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
      {/*
        The full-size preview is live so you can hover and open the thing you
        are about to copy — which also made its demo links live. They point
        at realistic destinations (`/checkout`, `/dashboard`, `/blog/<slug>`)
        that are not routes here, so a click inside the preview left the
        detail page for a 404, and its headline was a second <h1>. The
        thumbnails never had either problem; they are `inert`. See
        `preview-guard.tsx`.
      */}
      <PreviewGuard>{preview}</PreviewGuard>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 *  Thumbnail
 * ------------------------------------------------------------------ */

/**
 * A section is ~900px of layout that has to read at ~280px on a card, and a
 * page is several times that again.
 *
 * Rendering into a double-width box and scaling the whole thing to 50%
 * keeps the internal proportions — a `max-w-7xl` section laid out at card
 * width would collapse to its mobile breakpoint and preview a layout the
 * visitor is not looking for. `pointer-events-none` stops a thumbnail's
 * buttons from stealing the click meant for the card's link.
 *
 * `height` is the crop. Pages get a taller one: at section height a full
 * screen shows nothing but its own header.
 */
export function ArtifactThumbnail({
  preview,
  missingKey,
  height,
  className = '',
}: {
  preview: React.ReactNode | undefined
  missingKey: string
  /** Crop height. `undefined` — not just absent — falls back to the default. */
  height?: string
  className?: string
}) {
  if (!preview) return <MissingPreview componentKey={missingKey} />

  return (
    <div
      /*
        `content-visibility: auto` lets the browser skip layout and paint for
        every crop that is not near the viewport.

        A grid of live previews is cheap to *build* — nothing here hydrates —
        but it is not cheap to *draw*. /pages renders all 67 compositions at
        full fidelity: 20,500 elements and 4MB of HTML, and because each one
        brings its own chrome, 268 `backdrop-blur` surfaces, 82 `blur-3xl`
        glows and 64 infinite animations. Blur is the expensive part: the
        compositor re-derives every blurred backdrop on every frame, whether
        or not that card is on screen. The page moved, but it stopped
        answering the wheel for seconds at a time.

        Measured against a production build at 4x CPU throttle, interleaved
        A/B, four runs a side, medians: 14.5s of main-thread blocking, 16fps
        and 37 long frames without this, against 2.2s, 32fps and 9 with it.
        Dev badly understates the win — unminified React and HMR swamp the
        difference — so measure this one under `next start`, not `next dev`.
        /blocks and /templates are the same shape and get the same win.

        Safe here specifically because the crop already has an explicit
        height, so a skipped card still measures 16 or 20rem and nothing
        reflows — and because the subtree is `aria-hidden` and `inert`
        decoration, so there is no text selection, focus or reading order
        to lose. Only the thumbnail: the full-size `ArtifactPreview` on a
        detail page is the thing the visitor came to look at.
      */
      className={`pointer-events-none relative overflow-hidden rounded-xl border border-border/60 bg-background [content-visibility:auto] ${height ?? 'h-64'} ${className}`}
    >
      <div
        aria-hidden
        inert
        className="w-[200%] origin-top-left scale-50"
        // The thumbnail is decoration for the card's own link and title.
        // Exposing a duplicate copy of every heading and button inside it
        // would bury the real navigation in a screen reader's list.
        //
        // `inert` is the other half of that. `aria-hidden` removes the
        // subtree from the accessibility tree but leaves every button,
        // link and input inside it in the tab order — so a keyboard user
        // on /blocks was tabbing through 690 controls that announced as
        // nothing at all, and /pages and /templates had the same problem
        // at 537 and 223. `pointer-events-none` on the wrapper above
        // already stops the mouse reaching them; this is the same rule
        // for the keyboard.
      >
        {preview}
      </div>

      {/* Fade the hard bottom crop rather than letting text end mid-line. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent"
      />
    </div>
  )
}

/* ------------------------------------------------------------------ *
 *  Fallback
 * ------------------------------------------------------------------ */

/**
 * Only reachable if a catalog entry names a `previewComponent` that is not
 * in its registry. The build script catches a missing *source*, but nothing
 * checks the registry key, so this is the visible failure.
 */
function MissingPreview({ componentKey }: { componentKey: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center">
      <p className="text-sm text-muted-foreground">
        No preview registered for{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          {componentKey}
        </code>
      </p>
    </div>
  )
}
