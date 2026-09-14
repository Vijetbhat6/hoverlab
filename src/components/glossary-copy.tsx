'use client'

/**
 * <GlossaryCopy> — the copy button under a glossary definition.
 *
 * The reason this component exists rather than `<CopyableCommand>` or
 * `<CodeBlock>`: both of those render the code, and the glossary has sixty
 * entries on one page. Printing sixty stylesheets inline would bury the
 * definitions under the illustrations and add far more bytes to the document
 * than the prose it exists for. So this is the affordance without the
 * payload — one button, and the full source is a click away on the artifact's
 * own page, which the entry already links to.
 *
 * It reports a copy, the same as `<StickyInstallBar>` does: an entry names
 * exactly one artifact, so a press here is that artifact's usage and belongs
 * in the counters behind `/api/v1/trending`. That is the difference from a
 * kit's command, which names twenty ids and deliberately reports none.
 */

import * as React from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'

import { reportUsage } from '@/lib/report-usage'
import { cn } from '@/lib/utils'

export function GlossaryCopy({
  code,
  label,
  noun,
  artifactId,
  className,
}: {
  code: string
  /** Button text. Says what lands on the clipboard — CSS or a command. */
  label: string
  /** Named in the toast and the live region: "Copied the CSS". */
  noun: string
  /** Credited with the copy. */
  artifactId: string
  className?: string
}) {
  const [copied, setCopied] = React.useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      reportUsage(artifactId, 'copy')
      toast.success(`Copied ${noun}.`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Copy failed — open the artifact and copy it from there.')
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        // `relative` so the sr-only live region below is positioned against
        // this button. An absolutely positioned sr-only span with no
        // positioned ancestor resolves against the page and can widen a
        // scroll container several levels up — the bug written up at the
        // `relative` on `blocks/sources/comparison-table.tsx`.
        'relative inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {copied ? (
        <Check aria-hidden className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy aria-hidden className="h-3.5 w-3.5" />
      )}
      {/*
        The visible label is the same either way — a button whose text changes
        to "Copied" moves the entry's layout on every press, sixty times down
        a page. The state change is the icon, and the announcement below.
      */}
      {label}
      <span className="sr-only" role="status">
        {copied ? `Copied ${noun}.` : ''}
      </span>
    </button>
  )
}
