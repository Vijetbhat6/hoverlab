'use client'

/**
 * <CopyForAi> — the artifact, its props, its tokens and its install
 * command, on the clipboard as one prompt.
 *
 * ── WHY IT BUILDS THE STRING IN THE BROWSER ─────────────────────────────
 *
 * The obvious shape is for the server to assemble the prompt and hand down
 * a string. It is the wrong one twice over.
 *
 * The prompt is roughly 3 KB of fixed prose — the token block, the rules,
 * the install instructions — and shipping that per artifact means paying
 * for it on every detail page in the catalog. Built here, it is in the JS
 * bundle once and cached across the whole site, and only the artifact's own
 * facts travel in the payload.
 *
 * The second reason is the effect tier, where there is no server copy to
 * hand down. An effect page's CSS carries whatever the visitor has just
 * done with the sliders, and the prompt has to carry the same — a handoff
 * that quietly reverts to the stock hue is worse than no handoff, because
 * the reader will not notice until the agent has already built with it.
 * Building on demand is what lets the same component serve both.
 *
 * ── WHY THE PROMPT IS VISIBLE ───────────────────────────────────────────
 *
 * A button that copies something you cannot read is a button most people
 * press once. The `<details>` is closed by default so it costs nothing, and
 * the character count sits next to it because the one question a reader of
 * a prompt actually has is whether it will fit.
 */

import * as React from 'react'
import { Bot, ChevronDown, Copy, Check, Download } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { buildAiHandoff, type HandoffSubject } from '@/lib/ai-handoff'
import { downloadText, fileSlug } from '@/lib/download'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'

export interface CopyForAiProps {
  subject: HandoffSubject
  /**
   * `section` draws its own heading and card, for the detail pages that lay
   * their content out as a run of sections. `bare` omits both, for the
   * effect page, where this is the body of a tab that already has a label.
   */
  variant?: 'section' | 'bare'
  className?: string
}

export function CopyForAi({ subject, variant = 'section', className }: CopyForAiProps) {
  const [copied, setCopied] = React.useState(false)

  /*
    Origin at call time, not render time.

    `lib/site.ts` is the canonical origin but reads server-side runtime
    variables, and these pages are statically rendered — baking it in would
    stamp the prompt with whatever the build host believed. Reading the
    location when the button is pressed is always right, and there is no
    hydration frame to get wrong because nothing renders from it.
  */
  const build = React.useCallback(
    () =>
      buildAiHandoff(subject, {
        origin: typeof window === 'undefined' ? 'https://hoverlab.dev' : window.location.origin,
      }),
    [subject],
  )

  /*
    The preview is derived on render, not cached in state.

    It was cached and refreshed only when the disclosure opened, which meant
    the text on screen could disagree with what the button copies the moment
    `subject` changed underneath it. Today it cannot: the only rung whose
    subject changes in place is the effect tier, and its sliders live in a
    sibling tab that unmounts this one on the way past, so the cache was
    always rebuilt before anyone saw it.

    It is derived anyway, because the cache was buying nothing and guarding
    a real invariant badly. The disclosure is the documented fallback when
    the clipboard is refused — the text someone selects by hand — so it must
    equal what Copy produces, and that should not depend on a Radix default
    staying the way it is. `forceMount` on one TabsContent, or sliders moved
    next to the prompt, and the stale copy becomes reachable.

    The builder costs 0.026ms — 0.2% of a 60fps frame, measured on the
    largest block in the catalog, and only while the disclosure is open.
    That is not a price worth holding state for.
  */
  const [open, setOpen] = React.useState(false)
  const preview = open ? build() : null

  async function copy() {
    const text = build()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
      toast.success('Prompt copied — paste it into Claude, Cursor or v0')
      track('artifact_copy_for_ai', {
        id: subject.id,
        level: subject.level,
        ...(subject.customized ? { customized: true } : {}),
      })
    } catch {
      // The clipboard is refused in more places than people expect — an
      // insecure origin, a locked-down browser. The disclosure below is the
      // fallback, so say where it is rather than just reporting failure.
      toast.error('Copy failed — open "See the prompt" below and select it')
    }
  }

  function save() {
    downloadText(build(), `${fileSlug(subject.name, subject.id)}-prompt.md`, 'text/markdown')
  }

  const body = (
    <>
      <p className={cn('text-sm text-muted-foreground', variant === 'section' && 'max-w-2xl')}>
        The component, its props, the design tokens it expects and the command
        that installs it — as one prompt. Paste it into Claude, Cursor, v0 or
        ChatGPT and what they build around it will match the rest of the
        catalog instead of inventing its own system.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={() => void copy()}>
          {copied ? (
            <Check aria-hidden className="h-4 w-4" />
          ) : (
            <Copy aria-hidden className="h-4 w-4" />
          )}
          {copied ? 'Copied' : 'Copy for AI'}
        </Button>

        <Button type="button" size="sm" variant="outline" onClick={save}>
          <Download aria-hidden className="h-4 w-4" />
          Save as .md
        </Button>
      </div>

      {/*
        A native <details> rather than the Collapsible primitive: it is one
        element, it is open-able before hydration, and browser find-in-page
        reaches inside it. Nothing here needs an animation.
      */}
      <details
        className="group mt-4 rounded-lg border border-border/60 bg-muted/20"
        onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ChevronDown
            aria-hidden
            className="h-3.5 w-3.5 transition-transform group-open:rotate-180 motion-reduce:transition-none"
          />
          See the prompt
          {preview ? (
            <span className="ms-auto font-mono tabular-nums">
              {preview.length.toLocaleString('en-US')} characters
            </span>
          ) : null}
        </summary>
        <pre
          tabIndex={0}
          role="region"
          aria-label="The prompt, in full"
          className="max-h-80 overflow-auto border-t border-border/60 p-3 font-mono text-xs leading-relaxed text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          {preview}
        </pre>
      </details>
    </>
  )

  if (variant === 'bare') return <div className={className}>{body}</div>

  return (
    <section className={cn('mt-12', className)} aria-labelledby="copy-for-ai">
      <h2
        id="copy-for-ai"
        className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground"
      >
        <Bot aria-hidden className="h-4 w-4" />
        For AI
      </h2>
      {body}
    </section>
  )
}
