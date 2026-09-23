'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { Check, Flag, ThumbsDown, ThumbsUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { ArtifactLevel } from '@/lib/artifact-types'
import { cn } from '@/lib/utils'
import type { VoteKind } from '@/lib/feedback/validate'

/**
 * "Was this useful?" and "Report a problem", at the foot of every artifact
 * detail page.
 *
 * Mounted once, inside `<ArtifactFacts>`, which every detail page already
 * renders — so effects, primitives, blocks, pages and templates all get it
 * from one edit rather than five.
 *
 * ── NOTHING HAPPENS UNTIL SOMEONE ACTS ─────────────────────────────────
 *
 * Every dynamic route on this site is a function call that costs credits,
 * and the detail pages are statically generated so that a page view costs
 * none. So this component makes NO request on mount, reads no cookies and no
 * search params, and therefore leaves those pages static. A request is made
 * only when somebody presses a thumb or sends a report. The report dialog —
 * radix, a textarea, a form — is not even downloaded until it is opened:
 * it is a dynamic import rendered only while open.
 *
 * ── NO SOCIAL PROOF ────────────────────────────────────────────────────
 *
 * There is no count, no score and no "1,204 people found this useful" here
 * or anywhere. Feedback goes to the owner (`scripts/read-feedback.mts`) and
 * nowhere else; nothing is shown back. Thanking the person for the one
 * thing they just did is the entire response.
 *
 * A thumb sends `kind` and the artifact and nothing more — no text, no
 * email. The server keeps only a salted hash of the client address, to
 * rate-limit and to spot a noisy source.
 */

const ReportDialog = dynamic(
  () => import('./report-dialog').then((m) => m.ReportDialog),
  { ssr: false },
)

type VoteState =
  | { kind: 'idle' }
  | { kind: 'sending'; vote: VoteKind }
  | { kind: 'sent'; vote: VoteKind }
  | { kind: 'error'; message: string }

export function ArtifactFeedback({
  level,
  id,
  name,
  className,
}: {
  level: ArtifactLevel
  id: string
  /** For accessible labels. Falls back to the id. */
  name?: string
  className?: string
}) {
  const label = name ?? id
  const [state, setState] = React.useState<VoteState>({ kind: 'idle' })
  const [reportOpen, setReportOpen] = React.useState(false)
  const [reported, setReported] = React.useState(false)

  async function vote(kind: VoteKind) {
    if (state.kind === 'sending' || state.kind === 'sent') return
    setState({ kind: 'sending', vote: kind })
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, id, kind }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setState({
          kind: 'error',
          message: data.error || 'That did not go through. Please try again.',
        })
        return
      }
      setState({ kind: 'sent', vote: kind })
    } catch {
      setState({
        kind: 'error',
        message: 'We could not reach the server, so nothing was sent.',
      })
    }
  }

  const sent = state.kind === 'sent' ? state.vote : null
  const busy = state.kind === 'sending'

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground',
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span>Was this useful?</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={busy || sent !== null}
          aria-pressed={sent === 'thumbs-up'}
          aria-label={`Yes, ${label} was useful`}
          onClick={() => vote('thumbs-up')}
        >
          <ThumbsUp aria-hidden className={cn('size-4', sent === 'thumbs-up' && 'text-primary')} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={busy || sent !== null}
          aria-pressed={sent === 'thumbs-down'}
          aria-label={`No, ${label} was not useful`}
          onClick={() => vote('thumbs-down')}
        >
          <ThumbsDown aria-hidden className={cn('size-4', sent === 'thumbs-down' && 'text-primary')} />
        </Button>
      </div>

      {reported ? (
        <span className="inline-flex items-center gap-1.5">
          <Check aria-hidden className="size-4 text-emerald-500" />
          Reported. Thank you.
        </span>
      ) : (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto gap-1.5 p-0 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
          onClick={() => setReportOpen(true)}
        >
          <Flag aria-hidden className="size-3.5" />
          Report a problem
        </Button>
      )}

      {/* One polite live region for both outcomes, so the change is announced
          rather than only drawn. */}
      <p role="status" aria-live="polite" className="basis-full text-xs">
        {state.kind === 'sent' ? (
          <span className="inline-flex items-center gap-1.5">
            <Check aria-hidden className="size-3.5 text-emerald-500" />
            Thanks, that is noted.
          </span>
        ) : null}
        {state.kind === 'error' ? (
          <span className="text-destructive">{state.message}</span>
        ) : null}
      </p>

      {reportOpen ? (
        <ReportDialog
          level={level}
          id={id}
          name={label}
          open={reportOpen}
          onOpenChange={setReportOpen}
          onSent={() => setReported(true)}
        />
      ) : null}
    </div>
  )
}
