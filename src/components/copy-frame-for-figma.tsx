'use client'

/**
 * <CopyFrameForFigma> — this block, as Figma layers.
 *
 * The sibling of `<CopyForFigma>`, and the division between them is worth
 * stating: that one copies the *design system* — palette, radii, fonts —
 * and this one copies a *frame*, the rendered geometry of one artifact.
 * A designer starting a screen wants both, and until now could only have
 * the first.
 *
 * Reads the preview that is already on the page rather than rendering a
 * second copy. That is the only correct source: the geometry of a Tailwind
 * block does not exist until a browser has laid it out, so the thing on
 * screen is the only thing that knows where anything is. It also means the
 * copy reflects the reader's current theme — paste in dark mode and the
 * frame is dark, which is what they were just looking at.
 *
 * Clipboard mechanics and the reason for the toast are the same as
 * `<CopyForFigma>`: `text/plain`, because Figma sniffs pasted text for SVG
 * and `image/svg+xml` is not reliably writable by script, and a toast
 * because a silent success on an invisible payload bound for another
 * application looks exactly like a broken button.
 */

import * as React from 'react'
import { Check, Frame as FrameIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'

export function CopyFrameForFigma({
  targetId,
  name,
  level,
  className,
}: {
  /** DOM id of the element to trace. */
  targetId: string
  /** Artifact name — becomes the artboard's layer name. */
  name: string
  level: 'block' | 'page'
  className?: string
}) {
  const [state, setState] = React.useState<'idle' | 'working' | 'done'>('idle')

  async function copy() {
    if (state === 'working') return
    setState('working')

    try {
      const root = document.getElementById(targetId)
      if (!(root instanceof HTMLElement)) {
        throw new Error('preview not found')
      }

      /*
       * Loaded on click, not at import.
       *
       * The walker is only useful in a browser and only after a click, and
       * it is the largest module either detail page would pull in. Keeping
       * it out of the initial bundle costs one dynamic import on a path
       * that is already going to take a few hundred milliseconds.
       */
      const { frameToSvg } = await import('@/lib/export/figma-frame')
      const svg = frameToSvg(root, name)

      await navigator.clipboard.writeText(svg)

      // Layer count is the honest measure of what arrived, and it is what
      // tells us whether the walk is producing frames worth pasting.
      const layers = (svg.match(/<(rect|text)\s/g) ?? []).length
      track('figma_frame_copied', { artifact_id: targetId, level, layers })

      setState('done')
      setTimeout(() => setState('idle'), 2000)

      toast.success('Frame copied — paste into Figma', {
        description:
          'Press ⌘V / Ctrl+V on a Figma canvas. Layout, colours and type arrive as real layers; hover and motion do not exist in a static frame.',
      })
    } catch {
      setState('idle')
      toast.error('Could not copy the frame', {
        description: 'Your browser blocked clipboard access, or the preview had not rendered yet.',
      })
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn('gap-1.5', className)}
      onClick={copy}
      disabled={state === 'working'}
      title="Copy this block as SVG layers you can paste straight onto a Figma canvas"
    >
      {state === 'working' ? (
        <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
      ) : state === 'done' ? (
        <Check aria-hidden className="h-3.5 w-3.5" />
      ) : (
        <FrameIcon aria-hidden className="h-3.5 w-3.5" />
      )}
      {state === 'done' ? 'Copied' : 'Copy for Figma'}
    </Button>
  )
}
