'use client'

/**
 * <CopyForFigma> — the design system onto a Figma canvas, in one click.
 *
 * Writes SVG source to the clipboard as plain text, which is the whole
 * trick: Figma inspects pasted text, recognises SVG and converts it into
 * real layers. `text/plain` rather than a `ClipboardItem` of
 * `image/svg+xml` on purpose — browsers restrict which MIME types script
 * may put on the clipboard, and `image/svg+xml` is not reliably one of
 * them, whereas the plain-text path works everywhere and Figma treats the
 * two identically.
 *
 * The toast is part of the feature, not decoration. A silent success here
 * looks like nothing happened: the payload is invisible, the destination
 * is another application, and the user has to be told the next keystroke.
 *
 * See `lib/export/figma-svg.ts` for what actually travels, and why it is
 * tokens rather than components.
 */

import * as React from 'react'
import { Check, Figma, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useBrandColor } from '@/hooks/use-brand-color'
import { buildFigmaSheet } from '@/lib/export/figma-svg'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'

export function CopyForFigma({
  className,
  variant = 'outline',
  size = 'sm',
  label = 'Copy for Figma',
  brand,
  tool,
}: {
  className?: string
  variant?: React.ComponentProps<typeof Button>['variant']
  size?: React.ComponentProps<typeof Button>['size']
  label?: string
  /**
   * Hue and chroma to build the sheet from, overriding the site brand.
   *
   * The designer tools have a palette of their own that the visitor has
   * been tuning for the last ten minutes and has not applied to the site.
   * Copying the site's brand from inside one of those would hand them a
   * sheet of somebody else's colours — the one outcome that makes the
   * button feel broken.
   */
  brand?: { hue: number; chroma: number } | null
  /** Which tool this fired from, when it is on a tool page. */
  tool?: string
}) {
  const { color: brandColor } = useBrandColor()
  const [state, setState] = React.useState<'idle' | 'working' | 'copied'>('idle')

  async function copy() {
    setState('working')
    try {
      // Lightness stays the site's, for the reason <UseInCatalog> gives at
      // length: a tool's ramp lightness is chosen for the surface it sits
      // on, and importing it here can produce a palette that fails
      // contrast. Hue and chroma carry the identity.
      const source = brand ? { ...brandColor, hue: brand.hue, chroma: brand.chroma } : brandColor
      const sheet = buildFigmaSheet(source, {
        origin: typeof window === 'undefined' ? undefined : window.location.origin,
      })
      await navigator.clipboard.writeText(sheet.svg)
      setState('copied')
      window.setTimeout(() => setState('idle'), 2500)
      track('figma_sheet_copied', { tokens: sheet.tokenCount, ...(tool ? { tool } : {}) })
      toast.success('Copied — now paste into Figma', {
        description: `${sheet.tokenCount} colour tokens per mode, the radius scale and the type, as editable layers. ⌘V / Ctrl+V on any canvas.`,
      })
    } catch {
      setState('idle')
      toast.error('Could not reach the clipboard', {
        description: 'Some browsers block it unless the page has focus. Click the page, then try again.',
      })
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={copy}
      disabled={state === 'working'}
      className={cn('gap-1.5', className)}
    >
      {state === 'working' ? (
        <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
      ) : state === 'copied' ? (
        <Check aria-hidden className="h-4 w-4" />
      ) : (
        <Figma aria-hidden className="h-4 w-4" />
      )}
      {state === 'copied' ? 'Copied — paste in Figma' : label}
    </Button>
  )
}
