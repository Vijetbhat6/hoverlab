/**
 * Page previews.
 *
 * Same shell as blocks, with a taller thumbnail crop: at the block tier's
 * `h-64` a full screen previews as nothing but its own header, which is the
 * one part every page has in common and therefore the least useful thing to
 * show.
 */

import * as React from 'react'
import { ArtifactPreview, ArtifactThumbnail } from '@/components/artifact-preview'
import { getPagePreview } from '@/lib/pages/registry'

export function PagePreview({ componentKey }: { componentKey: string }) {
  return (
    <ArtifactPreview preview={getPagePreview(componentKey)} missingKey={componentKey} />
  )
}

export function PageThumbnail({
  componentKey,
  className = '',
}: {
  componentKey: string
  className?: string
}) {
  return (
    <ArtifactThumbnail
      preview={getPagePreview(componentKey)}
      missingKey={componentKey}
      height="h-80"
      className={className}
    />
  )
}
