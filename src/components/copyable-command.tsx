'use client'

/**
 * <CopyableCommand> — a shell command, in a block, with a copy button.
 *
 * The inline sibling of `<StickyInstallBar>`. That one is a floating pill
 * that follows the reader down an artifact page and truncates its command
 * to fit; this one sits in the document, wraps rather than truncates, and
 * is meant for commands too long to read in a pill — a kit's install line
 * names every id in the kit.
 *
 * Wrapping, not truncating, and not a horizontal scroller either: a
 * command someone is about to paste into a shell should be visible in
 * full, because the thing they check before pasting is that it does not
 * contain something unexpected. `break-all` on a line of hyphenated ids
 * breaks in ugly places; `break-words` keeps ids whole and breaks at the
 * spaces between them, which is where the reader's eye already stops.
 *
 * No `reportUsage` call. The sticky bar reports one, because it is bound
 * to a single artifact and copying its command is that artifact's usage.
 * A kit command names twenty-odd ids, and crediting a copy to each of them
 * would inflate the counters that drive /api/v1/trending with one press —
 * the kit's own analytics event is where that press is recorded.
 */

import * as React from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'

export function CopyableCommand({
  command,
  label = 'the command',
  className,
}: {
  command: string
  /** Named in the toast and the screen-reader text: "Copied the command". */
  label?: string
  className?: string
}) {
  const [copied, setCopied] = React.useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      toast.success(`Copied ${label}.`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Copy failed — select the command and copy it by hand.')
    }
  }

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border border-border/60 bg-muted/40 p-3',
        className,
      )}
    >
      <code className="min-w-0 flex-1 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-foreground">
        {command}
      </code>
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border/60 bg-background px-2 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {copied ? (
          <Check aria-hidden className="h-3.5 w-3.5" />
        ) : (
          <Copy aria-hidden className="h-3.5 w-3.5" />
        )}
        {copied ? 'Copied' : 'Copy'}
        <span className="sr-only"> {label}</span>
      </button>
    </div>
  )
}
