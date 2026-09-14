'use client'

/**
 * The one client island in an otherwise static rail.
 *
 * `<VariationsRail>` is a server component on purpose: its whole point is
 * that the seven variations under an effect are in the HTML a crawler and a
 * reader with JavaScript off both receive. Copying to a clipboard is the one
 * thing that cannot be done in markup, so it is the one thing that ships as
 * a component boundary, and it carries the snippet rather than the effect —
 * no catalog import, no customize engine, nothing that would pull the rest
 * of the rail across the boundary with it.
 *
 * It copies HTML *and* CSS together. A variation is a pair: the markup is
 * the effect's, unchanged, and the value is entirely in the stylesheet, so
 * handing over the CSS alone produces a paste that renders nothing and reads
 * as a broken snippet rather than a missing half.
 */

import * as React from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

export function VariationCopy({
  name,
  html,
  css,
}: {
  /** The variation's name, for the toast — "Copied Ember", not "Copied". */
  name: string
  html: string
  css: string
}) {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(t)
  }, [copied])

  function handleCopy() {
    const snippet = ['<!-- HTML -->', html.trim(), '', '/* CSS */', css.trim()].join('\n')
    void navigator.clipboard
      .writeText(snippet)
      .then(() => {
        setCopied(true)
        toast.success(`Copied ${name}`, { description: 'HTML + CSS ready to paste.' })
        // The copy-history dropdown listens for this; a variation copied from
        // the rail belongs in the same list as one copied from the panel.
        window.dispatchEvent(new CustomEvent('hoverlab:copy-history-changed'))
      })
      .catch(() => {
        toast.error('Clipboard blocked', {
          description: 'Your browser denied clipboard access.',
        })
      })
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleCopy}
      className="h-7 flex-1 gap-1.5 text-xs"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" /> Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" /> Copy
        </>
      )}
    </Button>
  )
}
