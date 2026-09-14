'use client'

/**
 * Agent — the output the studio exists to produce.
 *
 * ── WHY THIS TAB IS THE POINT AND NOT AN EXTRA ──────────────────────────
 *
 * The other two tabs each replace a tool that already existed. This one
 * replaces nothing, and it is the reason the three were folded together:
 * a token file is the cheapest part of a design system to hand over and the
 * least load-bearing. Tokens stop an agent picking a random grey. They do
 * nothing whatsoever about the copy, and copy is most of what an agent
 * generates — so the sections of this document that come from the Identity
 * fields are the ones that change the output most, and no generator could
 * have produced them.
 *
 * ── TWO ARTIFACTS, AND THEY ARE NOT THE SAME DOCUMENT TWICE ─────────────
 *
 *   The prompt      pasted into a chat. Lasts one conversation, carries
 *                   everything including the eighty-line token block,
 *                   because the agent it is talking to has no repo to read.
 *
 *   AGENTS.md       committed. Governs every future request in that
 *                   project, which is the difference between handing an
 *                   agent the system once and the project having one. It is
 *                   deliberately shorter: a rules file is prepended to
 *                   every request, so the token block is dropped once it
 *                   lives in `globals.css`, and what stays is the part that
 *                   has to be re-read each time — the voice and the
 *                   prohibitions.
 *
 * ── BUILT IN THE BROWSER, NOT ON THE SERVER ─────────────────────────────
 *
 * The same call `copy-for-ai.tsx` made, for the same two reasons: the fixed
 * prose would otherwise ship as several KB of payload on a page that may
 * never open this tab, and the document has to reflect prose the visitor is
 * typing right now, which the server has never seen. `buildStudioDna` is
 * pure and takes the origin as an argument precisely so it can run here.
 */

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Copy, Download, FileText, Terminal } from 'lucide-react'

import { downloadText } from '@/lib/download'
import { buildAgentRules, buildStudioDna } from '@/lib/studio/dna'
import type { StudioState } from '@/lib/studio/state'
import { cn } from '@/lib/utils'

/**
 * A copy button that reports what it did.
 *
 * `navigator.clipboard` rejects on an insecure origin and in a tab that is
 * not focused, and a button that silently does nothing in those cases is
 * worse than one that admits it — the visitor's next move is to retry
 * forever rather than to select the text.
 */
function CopyButton({
  text,
  label,
  primary,
}: {
  text: string
  label: string
  primary?: boolean
}) {
  const [state, setState] = React.useState<'idle' | 'done' | 'failed'>('idle')

  React.useEffect(() => {
    if (state === 'idle') return
    const timer = window.setTimeout(() => setState('idle'), 2200)
    return () => window.clearTimeout(timer)
  }, [state])

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setState('done')
        } catch {
          setState('failed')
        }
      }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        primary
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'border border-border hover:bg-muted',
      )}
    >
      {state === 'done' ? (
        <Check aria-hidden className="h-3.5 w-3.5" />
      ) : (
        <Copy aria-hidden className="h-3.5 w-3.5" />
      )}
      {state === 'done' ? 'Copied' : state === 'failed' ? 'Copy failed — select it' : label}
    </button>
  )
}

/**
 * The document, shown as what it is.
 *
 * A `<pre>` and not a rendered preview. The thing being handed over is
 * Markdown source — an agent reads the `#` and the fences — and a rendered
 * version would hide exactly the characters that do the work. `tabIndex`
 * makes the box keyboard-scrollable, which a scrolling region needs and a
 * `<pre>` does not get for free.
 */
function DocumentBox({ text, lines }: { text: string; lines: number }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/60">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/40 px-3 py-1.5">
        <span className="font-mono text-[11px] text-muted-foreground">markdown</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {lines} lines · {text.length.toLocaleString()} characters
        </span>
      </div>
      {/*
        Wrapped, not scrolled sideways.

        A `<pre>` defaults to `white-space: pre`, so every prose line in the
        document ran off the right edge and the box showed the first sixty
        characters of each paragraph — a preview of a document nobody could
        read. This is Markdown *prose* with a few fenced blocks in it, not
        source code, so the long lines are sentences and wrapping them loses
        nothing. `break-words` catches the one thing a sentence cannot
        break: the `oklch(...)` values and the install commands.

        The vertical scroll stays, capped at `max-h-96`, because the
        document is 159 lines and it is a preview, not the deliverable —
        the deliverable is on the clipboard.
      */}
      <pre
        tabIndex={0}
        className="max-h-96 overflow-y-auto whitespace-pre-wrap break-words bg-background p-3 text-[11px] leading-relaxed"
      >
        <code>{text}</code>
      </pre>
    </div>
  )
}

export interface AgentTabProps {
  state: StudioState
  /**
   * Absolute site origin, resolved on the server.
   *
   * Required rather than defaulted — see `StudioDnaOptions`. `lib/site.ts`
   * reads server-only runtime variables, so the value has to come down as a
   * prop; a client-side guess would be the mistake `lib/dna.ts` has a
   * docblock about.
   */
  origin: string
  /** Switches to the Identity panel — the fix for a thin document. */
  onFocusIdentity?: () => void
}

export function AgentTab({ state, origin, onFocusIdentity }: AgentTabProps) {
  const dna = buildStudioDna(state, { origin })
  const rules = buildAgentRules(state, { origin })
  const [format, setFormat] = React.useState<'prompt' | 'rules'>('prompt')

  const active = format === 'prompt' ? dna.markdown : rules.content
  const activeFilename = format === 'prompt' ? dna.filename : rules.filename

  return (
    <div className="space-y-6">
      {/*
        The coverage nudge, and it is a nudge rather than a gate. A document
        built from an empty identity is valid and useful — it is the token
        half, which is what the two folded-in tools produced on their own.
        Refusing to build it would make the studio worse than the tools it
        replaced, so this says what is missing and offers the way back.
      */}
      {dna.coverage.filled < dna.coverage.total ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-semibold">
            {dna.coverage.empty
              ? 'This is currently a token file with a heading on it.'
              : `${dna.coverage.filled} of ${dna.coverage.total} identity fields are filled.`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {dna.coverage.empty
              ? 'The colours below stop an agent inventing a palette. They do nothing about the copy, and copy is most of what it will write — that is what the Identity fields are for.'
              : `Still empty: ${dna.coverage.missing.join(', ')}. Each one is a section this document does not have.`}
          </p>
          {onFocusIdentity ? (
            <button
              type="button"
              onClick={onFocusIdentity}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Fill in the identity
              <ArrowRight aria-hidden className="h-3 w-3" />
            </button>
          ) : null}
        </div>
      ) : null}

      {/* ---- Which artifact -------------------------------------- */}
      <div>
        <div
          role="radiogroup"
          aria-label="Which artifact to produce"
          className="flex flex-wrap gap-2"
        >
          {(
            [
              {
                id: 'prompt' as const,
                icon: Terminal,
                label: 'Paste into a chat',
                note: 'Everything, token block included. Lasts one conversation.',
              },
              {
                id: 'rules' as const,
                icon: FileText,
                label: 'Commit as AGENTS.md',
                note: 'Shorter, and governs every future request in the repo.',
              },
            ] satisfies Array<{
              id: 'prompt' | 'rules'
              icon: typeof Terminal
              label: string
              note: string
            }>
          ).map((option) => {
            const on = format === option.id
            const Icon = option.icon
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setFormat(option.id)}
                className={cn(
                  'flex-1 basis-64 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  on ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted',
                )}
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <Icon aria-hidden className={cn('h-4 w-4', on && 'text-primary')} />
                  {option.label}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {option.note}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <CopyButton text={active} label="Copy the document" primary />
          <button
            type="button"
            onClick={() => downloadText(active, activeFilename, 'text/markdown')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Download aria-hidden className="h-3.5 w-3.5" />
            {activeFilename}
          </button>
          {format === 'rules' ? (
            <span className="text-[11px] text-muted-foreground">
              Cursor reads it at{' '}
              <code className="font-mono">.cursor/rules/design.mdc</code>; the
              frontmatter is inert everywhere else.
            </span>
          ) : null}
        </div>
      </div>

      <DocumentBox text={active} lines={active.split('\n').length} />

      {/* ---- The data channel ------------------------------------ */}
      <section>
        <h2 className="text-sm font-semibold">Or read it as data</h2>
        <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
          The same system as JSON, for a script or an MCP tool that would rather not
          parse prose — the identity, the four axes, both CSS spellings, the rules and
          the prohibitions.
        </p>
        <div className="mt-2">
          <CopyButton text={`${JSON.stringify(dna.json, null, 2)}\n`} label="Copy JSON" />
        </div>
      </section>

      {/* ---- The exit -------------------------------------------- */}
      <section className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-4">
        <h2 className="text-sm font-semibold">Then stop generating what already exists</h2>
        <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
          This document teaches an agent the system. The components are already built
          against it, free, and land in the project as source you own rather than as a
          dependency — which is a better outcome than a generated approximation of a
          pricing table.
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg bg-muted/60 p-3">
          <pre className="text-[11px] leading-relaxed">
            <code>{dna.json.install.join('\n')}</code>
          </pre>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium">
          <Link href="/blocks" className="inline-flex items-center gap-1 underline underline-offset-4">
            Browse the blocks
            <ArrowRight aria-hidden className="h-3 w-3" />
          </Link>
          <Link href="/mcp" className="inline-flex items-center gap-1 underline underline-offset-4">
            Give your editor the catalog
            <ArrowRight aria-hidden className="h-3 w-3" />
          </Link>
        </div>
      </section>
    </div>
  )
}
