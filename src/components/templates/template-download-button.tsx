'use client'

/**
 * Download a template as a zip.
 *
 * A plain anchor to the route handler would be simpler, and would also give
 * the user no feedback for the second or two the archive takes to arrive —
 * on a slow connection that reads as a dead button and gets clicked again.
 * Fetching lets the label report what is happening, and — since six of the
 * seven templates became Pro — lets a 402 or a 429 become an offer rather
 * than a failed download.
 *
 * The three outcomes are told apart deliberately:
 *
 *   200  the archive. Same as it always was.
 *   402  not licensed. The most important response here, because the person
 *        reading it is deciding whether to buy: it names the price of the
 *        thing, links the free template so they can try the shape of it,
 *        and does not pretend an error occurred.
 *   429  licensed for it, but out of daily downloads — only reachable on
 *        the free template, since a licence removes the meter.
 *
 * The blob URL is revoked after a delay rather than immediately: revoking
 * in the same tick can cancel the download before the browser has started
 * reading from it.
 */

import * as React from 'react'
import Link from 'next/link'
import { Download, Loader2, CircleAlert, Lock } from 'lucide-react'
import { track } from '@/lib/analytics'

type State =
  | { kind: 'idle' }
  | { kind: 'working' }
  | { kind: 'error' }
  | { kind: 'locked'; message: string }
  | { kind: 'metered'; message: string }

export function TemplateDownloadButton({
  templateId,
  fileCount,
  /**
   * Whether this template needs a licence. Passed from the server component
   * that already knows, rather than discovered by firing a request: the
   * button should say "Download — Pro" before it is pressed, not after.
   */
  tier = 'free',
}: {
  templateId: string
  fileCount: number
  tier?: 'free' | 'pro'
}) {
  const [state, setState] = React.useState<State>({ kind: 'idle' })

  async function download() {
    if (state.kind === 'working') return
    setState({ kind: 'working' })

    try {
      const response = await fetch(`/api/templates/${templateId}/download`, {
        credentials: 'same-origin',
      })

      if (response.status === 402 || response.status === 429) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string
        }
        const kind = response.status === 402 ? 'locked' : 'metered'
        track('paywall_hit', {
          feature: `template_download:${templateId}`,
          plan_required: kind === 'locked' ? 'pro' : 'free',
        })
        setState({
          kind,
          message:
            body.error ??
            (kind === 'locked'
              ? 'This template is part of Pro.'
              : 'You have used today’s downloads.'),
        })
        return
      }

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
      setState({ kind: 'idle' })
    } catch {
      setState({ kind: 'error' })
    }
  }

  const locked = state.kind === 'locked'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={download}
          disabled={state.kind === 'working'}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {state.kind === 'working' ? (
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
          ) : tier === 'pro' ? (
            <Lock aria-hidden className="h-4 w-4" />
          ) : (
            <Download aria-hidden className="h-4 w-4" />
          )}
          {state.kind === 'working' ? 'Packaging' : 'Download project'}
        </button>

        <span aria-live="polite" className="text-xs text-muted-foreground">
          {state.kind === 'error' ? (
            <span className="inline-flex items-center gap-1.5 text-destructive">
              <CircleAlert aria-hidden className="h-3.5 w-3.5" />
              That did not download. Try again.
            </span>
          ) : (
            `${fileCount} files · .zip · nothing to configure${tier === 'pro' ? ' · Pro' : ''}`
          )}
        </span>
      </div>

      {/*
        The offer, in place, rather than a toast that disappears. Someone
        who just pressed a button they cannot use is the most engaged
        reader this page gets, and the answer should still be on screen a
        minute later while they think about it.
      */}
      {locked || state.kind === 'metered' ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
          <p className="font-medium text-foreground">{state.message}</p>
          <p className="mt-1 text-muted-foreground">
            {locked ? (
              <>
                Pro is a one-time licence covering every template, plus
                commercial rights to everything in the catalog. Already bought
                it?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
                .
              </>
            ) : (
              <>The meter resets at midnight UTC. Pro removes it for good.</>
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              See Pro
            </Link>
            {locked ? (
              // The free template, offered at the exact moment someone
              // wants to know what a template is actually like. A paywall
              // with no sample behind it converts worse than one with a
              // good sample.
              <Link
                href="/template/marketing-site"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium hover:bg-muted/60"
              >
                Try the free one first
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
