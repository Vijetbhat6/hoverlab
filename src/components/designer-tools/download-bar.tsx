'use client'

/**
 * The "save this as a file" row for a designer tool.
 *
 * Copy has always been the primary verb here and stays that way — most of
 * what these tools make is code, and code goes to a clipboard. But some of
 * what they make is not code: a palette that a designer needs to open in
 * Illustrator, a gradient that has to be handed to someone working in a
 * tool with no CSS in it, a grain tile that belongs in an assets folder. A
 * clipboard cannot carry any of those, and before this existed the answer
 * was a screenshot.
 *
 * Kept deliberately plain — a row of outline buttons under the copy cards,
 * not a dropdown. There are two or three exports per tool, a menu to hide
 * three items is a click spent on nothing, and a format someone cannot see
 * is a format they do not know they can have.
 */

import * as React from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface DownloadAction {
  /** Button text. Name the format — "PNG", ".ase", "SVG". */
  label: string
  /**
   * Performs the download. May be async: rendering a PNG goes through an
   * image decode, which is not instant on a large canvas.
   *
   * Throwing, or resolving false, reports failure to the user. Everything
   * here can genuinely fail — a canvas can refuse `toBlob`, an SVG can fail
   * to parse — and a button that silently does nothing is the worst
   * available outcome for a save.
   */
  run: () => void | boolean | Promise<void | boolean>
  /** Optional hint under the row, for a format that needs one word of context. */
  title?: string
}

export function DownloadBar({
  actions,
  className,
}: {
  actions: DownloadAction[]
  className?: string
}) {
  // Keyed by label rather than index so a tool whose action list changes
  // with its mode cannot leave the spinner on the wrong button.
  const [busy, setBusy] = React.useState<string | null>(null)

  async function invoke(action: DownloadAction) {
    setBusy(action.label)
    try {
      const result = await action.run()
      if (result === false) {
        toast.error(`Could not build the ${action.label} file`)
      }
    } catch {
      toast.error(`Could not build the ${action.label} file`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="text-xs font-medium text-muted-foreground">Download</span>
      {actions.map((action) => (
        <Button
          key={action.label}
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          title={action.title}
          disabled={busy !== null}
          onClick={() => void invoke(action)}
        >
          {busy === action.label ? (
            <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download aria-hidden className="h-3.5 w-3.5" />
          )}
          {action.label}
        </Button>
      ))}
    </div>
  )
}
