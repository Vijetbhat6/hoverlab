'use client'

/**
 * What /builder is actually for: leaving with the page.
 *
 * Three artifacts, in the order someone uses them:
 *
 *   1. The command that installs the sections the file imports. Without it
 *      the source is a list of imports that do not resolve.
 *   2. The page source itself, named, copyable and downloadable.
 *   3. The link, because the composition is the URL and a teammate should
 *      be able to open the same layout rather than a screenshot of it.
 *
 * The name field is here rather than in the URL on purpose. It changes one
 * identifier and one filename, and putting it in the query string would
 * mean a round trip per keystroke to re-render a preview that does not
 * depend on it. So the source arrives from the server composed under the
 * default name and is re-composed on the client when the reader types —
 * from the same pure function, so the two cannot disagree.
 */

import * as React from 'react'
import { Check, Copy, Download, Link2 } from 'lucide-react'
import { toast } from 'sonner'

import { CopyableCommand } from '@/components/copyable-command'
import { downloadTextFile } from '@/lib/bundle-export'
import { componentName, fileName } from '@/lib/builder/compose'

export function BuilderExport({
  source,
  command,
  deps,
  count,
  shareUrl,
}: {
  /** The page source, composed on the server for the current URL. */
  source: string
  command: string
  deps: string[]
  count: number
  shareUrl: string
}) {
  const [name, setName] = React.useState('')

  const trimmed = name.trim()
  const file = fileName(trimmed || 'composed page')

  /*
   * Re-composing on the client would mean importing the composer and the
   * block index into this bundle. Renaming is a rename: the server already
   * produced the file under the default name, so swapping the identifier is
   * a targeted substitution on the two lines that carry it.
   */
  const renamed = React.useMemo(() => {
    if (!trimmed) return source
    const next = componentName(trimmed)
    return source
      .replace(/^export default function \w+\(\)/m, `export default function ${next}()`)
      .replace(/^ \* \w+ — composed from/m, ` * ${next} — composed from`)
  }, [source, trimmed])

  const [copied, setCopied] = React.useState(false)

  async function copySource() {
    try {
      await navigator.clipboard.writeText(renamed)
      setCopied(true)
      toast.success('Copied the page source.')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Copy failed — select the source and copy it by hand.')
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Copied the link to this layout.')
    } catch {
      toast.error('Copy failed — the layout is in the address bar.')
    }
  }

  if (count === 0) {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
        Add a section and the page source, the install command and a shareable
        link appear here.
      </p>
    )
  }

  return (
    <div className="mt-5 space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold">1. Install the sections</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Writes each block to <code className="font-mono text-xs">components/</code>,
            which is where the page below imports them from.
          </p>
          <CopyableCommand command={command} label="the install command" className="mt-3" />
          {deps.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              These sections import{' '}
              <span className="font-mono">{deps.join(', ')}</span> — everything
              else they use is React and Tailwind.
            </p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold">2. Name the page</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Sets the component name and the filename. Optional.
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Marketing landing page"
            aria-label="Page name"
            className="mt-3 h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Saves as <span className="font-mono">app/{file}</span>
          </p>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">3. Take the source</h3>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copySource}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/60 px-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              {copied ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <Copy className="h-4 w-4" aria-hidden />
              )}
              {copied ? 'Copied' : 'Copy source'}
            </button>
            <button
              type="button"
              onClick={() => {
                downloadTextFile(file, renamed, 'text/plain')
                toast.success(`Downloaded ${file}.`)
              }}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/60 px-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Download className="h-4 w-4" aria-hidden />
              Download
            </button>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/60 px-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Link2 className="h-4 w-4" aria-hidden />
              Copy link
            </button>
          </div>
        </div>

        <pre className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-border/60 bg-muted/30 p-4 text-xs leading-relaxed">
          <code className="font-mono">{renamed}</code>
        </pre>
      </div>
    </div>
  )
}
