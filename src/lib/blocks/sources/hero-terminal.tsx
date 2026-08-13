/**
 * <HeroTerminal> — a developer hero whose call to action is an install line.
 *
 * For anything a developer adopts by typing rather than by signing up: a
 * CLI, an SDK, a framework. The primary button is still there, but the
 * install command is the thing most visitors actually came for, so it gets
 * the visual weight and a copy button that works.
 *
 * The terminal is `aria-hidden` where it is decorative — the scrollback
 * lines are a drawing of a session, not a session — but the command itself
 * is not. It sits in a real `<code>` with a real button beside it, because
 * "copy the install line" is the one interaction on this page that has to
 * work with a keyboard and a screen reader.
 *
 * `navigator.clipboard` is feature-detected rather than assumed: it is
 * undefined on insecure origins, and an unguarded call throws where a
 * visitor can see it.
 */

'use client'

import * as React from 'react'
import { ArrowRight, Check, Copy, Terminal } from 'lucide-react'

export interface HeroTerminalProps {
  eyebrow?: string
  heading?: string
  subheading?: string
  /** The install line. Shown verbatim and copied verbatim. */
  command?: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
  /** Fake scrollback under the command — purely decorative. */
  output?: string[]
  className?: string
}

const DEFAULT_OUTPUT = [
  'resolving dependencies…',
  'added 3 packages in 1.2s',
  'created hoverlab.config.ts',
  'ready — run `npm run dev`',
]

export function HeroTerminal({
  eyebrow = 'v2.4 — zero-config',
  heading = 'One command. Every component.',
  subheading =
    'Install the CLI and pull any section straight into your project, typed and themed against your own tokens.',
  command = 'npx hoverlab@latest init',
  primaryLabel = 'Read the docs',
  primaryHref = '#',
  secondaryLabel = 'Browse components',
  secondaryHref = '#',
  output = DEFAULT_OUTPUT,
  className = '',
}: HeroTerminalProps) {
  const [copied, setCopied] = React.useState(false)

  // Reset the confirmation, and clear the timer if the block unmounts first.
  React.useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(id)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard?.writeText(command)
      setCopied(true)
    } catch {
      // Clipboard denied or unavailable — the command is still selectable.
    }
  }

  return (
    <section className={`relative overflow-hidden ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
        {eyebrow ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur">
            <Terminal aria-hidden className="h-3.5 w-3.5" />
            {eyebrow}
          </span>
        ) : null}

        <h1 className="mt-6 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          {heading}
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          {subheading}
        </p>

        {/* -- Terminal ------------------------------------------------- */}
        <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-2xl border border-border/60 bg-card/80 text-left shadow-2xl shadow-black/20 backdrop-blur">
          <div aria-hidden className="flex items-center gap-1.5 border-b border-border/60 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
            <span className="ml-2 font-mono text-[11px] text-muted-foreground">bash</span>
          </div>

          <div className="space-y-1 bg-background/70 p-4 font-mono text-sm">
            <div className="flex items-center gap-3">
              <code className="flex-1 truncate">
                <span aria-hidden className="mr-2 select-none text-primary">
                  $
                </span>
                {command}
              </code>
              <button
                type="button"
                onClick={copy}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {copied ? (
                  <Check aria-hidden className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy aria-hidden className="h-3.5 w-3.5" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div aria-hidden className="space-y-1 pt-2 text-xs text-muted-foreground">
              {output.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={primaryHref}
            className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {primaryLabel}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </a>
          <a
            href={secondaryHref}
            className="inline-flex h-12 items-center justify-center rounded-xl border border-border/60 bg-card/60 px-6 text-sm font-semibold backdrop-blur transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {secondaryLabel}
          </a>
        </div>
      </div>
    </section>
  )
}
