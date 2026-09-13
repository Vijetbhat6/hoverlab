/**
 * Primitive previews — a registry lookup wrapped around the shared shell.
 *
 * The layout, the crop and the missing-preview fallback live in
 * `artifact-preview.tsx`, exactly as they do for blocks and pages. What
 * this file adds is the one thing a primitive needs and a block does not:
 * the thumbnail is NOT rendered at half scale.
 *
 * `ArtifactThumbnail` draws into a double-width box and scales it to 50%,
 * which is right for a 900px section that has to read at 280px — the
 * internal proportions survive and the section does not collapse to its
 * mobile breakpoint. A segmented control at 50% is a segmented control with
 * 6px text. So primitives get a plain crop at natural size, which is also
 * why several of them carry a `thumbHeight`: a KBD chip and a tree view are
 * an order of magnitude apart, and one crop cannot serve both.
 */

import * as React from 'react'

import { ArtifactPreview } from '@/components/artifact-preview'
import { getPrimitivePreview } from '@/lib/primitives/registry'

export function PrimitivePreview({ componentKey }: { componentKey: string }) {
  return (
    <ArtifactPreview preview={getPrimitivePreview(componentKey)} missingKey={componentKey} />
  )
}

export function PrimitiveThumbnail({
  componentKey,
  height,
  className = '',
}: {
  componentKey: string
  /** Crop override. See `Primitive.thumbHeight`. */
  height?: string
  className?: string
}) {
  const preview = getPrimitivePreview(componentKey)

  if (!preview) {
    return (
      <div
        className={`flex ${height ?? 'h-44'} items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 text-xs text-muted-foreground ${className}`}
      >
        No preview for “{componentKey}”
      </div>
    )
  }

  return (
    <div
      /*
       * `content-visibility: auto` for the same reason the block grid has
       * it: the browser skips layout and paint for every crop that is not
       * near the viewport. Safe because the crop has an explicit height, so
       * a skipped card still measures and nothing reflows.
       */
      className={`pointer-events-none relative flex items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-background [content-visibility:auto] ${height ?? 'h-44'} ${className}`}
    >
      {/*
        Decoration for the card's own link and title. A primitive demo is
        full of buttons, inputs and labelled controls; exposing them would
        bury the card's real link in a screen reader's list, and `inert`
        keeps them out of the tab order.
      */}
      <div aria-hidden inert className="w-full">
        {preview}
      </div>
    </div>
  )
}
