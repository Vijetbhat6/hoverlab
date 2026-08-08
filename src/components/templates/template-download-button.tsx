'use client'

/**
 * Download a template as a zip.
 *
 * A plain anchor to the route handler would be simpler, and would also give
 * the user no feedback for the second or two the archive takes to arrive —
 * on a slow connection that reads as a dead button and gets clicked again.
 * Fetching lets the label report what is happening.
 *
 * The blob URL is revoked after a delay rather than immediately: revoking
 * in the same tick can cancel the download before the browser has started
 * reading from it.
 */

import * as React from 'react'
import { Download, Loader2, CircleAlert } from 'lucide-react'

export function TemplateDownloadButton({
  templateId,
  fileCount,
}: {
  templateId: string
  fileCount: number
}) {
  const [state, setState] = React.useState<'idle' | 'working' | 'error'>('idle')

  async function download() {
    if (state === 'working') return
    setState('working')

    try {
      const response = await fetch(`/api/templates/${templateId}/download`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${templateId}.zip`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)

      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setState('idle')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={download}
        disabled={state === 'working'}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {state === 'working' ? (
          <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
        ) : (
          <Download aria-hidden className="h-4 w-4" />
        )}
        {state === 'working' ? 'Packaging' : 'Download project'}
      </button>

      <span aria-live="polite" className="text-xs text-muted-foreground">
        {state === 'error' ? (
          <span className="inline-flex items-center gap-1.5 text-destructive">
            <CircleAlert aria-hidden className="h-3.5 w-3.5" />
            That did not download. Try again.
          </span>
        ) : (
          `${fileCount} files · .zip · nothing to configure`
        )}
      </span>
    </div>
  )
}
