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
      {preview}
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
  height = 'h-64',
  className = '',
}: {
  preview: React.ReactNode | undefined
  missingKey: string
  height?: string
  className?: string
}) {
  if (!preview) return <MissingPreview componentKey={missingKey} />

  return (
    <div
      className={`pointer-events-none relative overflow-hidden rounded-xl border border-border/60 bg-background ${height} ${className}`}
    >
      <div
        aria-hidden
        className="w-[200%] origin-top-left scale-50"
        // The thumbnail is decoration for the card's own link and title.
        // Exposing a duplicate copy of every heading and button inside it
        // would bury the real navigation in a screen reader's list.
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
