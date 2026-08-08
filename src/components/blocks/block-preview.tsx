/**
 * Block previews — a registry lookup wrapped around the shared shell.
 *
 * The layout, the crop and the missing-preview fallback all live in
 * `artifact-preview.tsx`, because pages need exactly the same treatment and
 * two copies would drift the moment one tier's crop was tuned.
 */

import * as React from 'react'
import { ArtifactPreview, ArtifactThumbnail } from '@/components/artifact-preview'
import { getBlockPreview } from '@/lib/blocks/registry'

export function BlockPreview({ componentKey }: { componentKey: string }) {
  return (
    <ArtifactPreview preview={getBlockPreview(componentKey)} missingKey={componentKey} />
  )
}

export function BlockThumbnail({
  componentKey,
  className = '',
}: {
  componentKey: string
  className?: string
}) {
  return (
    <ArtifactThumbnail
      preview={getBlockPreview(componentKey)}
      missingKey={componentKey}
      className={className}
    />
  )
}
