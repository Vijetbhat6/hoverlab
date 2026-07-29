'use client'

/**
 * <CodePreviewWindow> — mac-style IDE window showing the copy workflow.
 *
 * Visual only (not interactive). Window chrome with traffic-light dots,
 * filename tab, line numbers, syntax-highlighted CSS, and a "Copied!"
 * toast in the corner. Lines fade in sequentially via .fx-code-line
 * (only animates once on mount; reduced-motion users see them immediately).
 *
 * Sits as a 2-column layout on desktop: window on the left, marketing
 * copy on the right. Stacks on mobile.
 */

import * as React from 'react'
import { Check, Clipboard } from 'lucide-react'
import { Reveal } from '@/components/reveal'

interface CodeLine {
  num: number
  tokens: Array<{ text: string; cls?: string }>
}

const LINES: CodeLine[] = [
  {
    num: 1,
    tokens: [{ text: '<button ', cls: 'text-primary' }, { text: 'class', cls: 'text-amber-500' }, { text: '=', cls: 'text-muted-foreground' }, { text: '"fx-glow"', cls: 'text-emerald-500' }, { text: '>', cls: 'text-primary' }],
  },
  {
    num: 2,
    tokens: [{ text: '  Hover me', cls: 'text-foreground' }],
  },
  {
    num: 3,
    tokens: [{ text: '</button>', cls: 'text-primary' }],
  },
  {
    num: 4,
    tokens: [{ text: '' }],
  },
  {
    num: 5,
    tokens: [{ text: '.fx-glow', cls: 'text-sky-500' }, { text: ' {', cls: 'text-foreground' }],
  },
  {
    num: 6,
    tokens: [{ text: '  padding', cls: 'text-amber-500' }, { text: ': ', cls: 'text-muted-foreground' }, { text: '0.75rem 1.5rem', cls: 'text-emerald-500' }, { text: ';', cls: 'text-muted-foreground' }],
  },
  {
    num: 7,
    tokens: [{ text: '  border-radius', cls: 'text-amber-500' }, { text: ': ', cls: 'text-muted-foreground' }, { text: '0.5rem', cls: 'text-emerald-500' }, { text: ';', cls: 'text-muted-foreground' }],
  },
  {
    num: 8,
    tokens: [{ text: '  background', cls: 'text-amber-500' }, { text: ': ', cls: 'text-muted-foreground' }, { text: 'var(--brand)', cls: 'text-emerald-500' }, { text: ';', cls: 'text-muted-foreground' }],
  },
  {
    num: 9,
    tokens: [{ text: '  transition', cls: 'text-amber-500' }, { text: ': ', cls: 'text-muted-foreground' }, { text: 'box-shadow .3s', cls: 'text-emerald-500' }, { text: ';', cls: 'text-muted-foreground' }],
  },
  {
    num: 10,
    tokens: [{ text: '}', cls: 'text-foreground' }],
  },
  {
    num: 11,
    tokens: [{ text: '' }],
  },
  {
    num: 12,
    tokens: [{ text: '.fx-glow', cls: 'text-sky-500' }, { text: ':hover', cls: 'text-primary' }, { text: ' {', cls: 'text-foreground' }],
  },
  {
    num: 13,
    tokens: [{ text: '  box-shadow', cls: 'text-amber-500' }, { text: ': ', cls: 'text-muted-foreground' }, { text: '0 0 24px var(--brand)', cls: 'text-emerald-500' }, { text: ';', cls: 'text-muted-foreground' }],
  },
  {
    num: 14,
    tokens: [{ text: '}', cls: 'text-foreground' }],
  },
]

export function CodePreviewWindow() {
  return (
    <section className="border-y border-border/40 bg-background/60 py-16 backdrop-blur sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        {/* Left: window */}
        <Reveal>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-[#0d1117] shadow-2xl shadow-primary/10">
            {/* Title bar */}
            <div className="flex items-center gap-2 border-b border-white/5 bg-[#161b22] px-4 py-2.5">
              <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
              <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
              <span className="ml-3 font-mono text-xs text-white/60">
                glow-button.html
              </span>
              <span className="ml-auto flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                <Check className="h-3 w-3" /> Copied
              </span>
            </div>
            {/* Code body */}
            <div className="overflow-x-auto p-4 font-mono text-xs leading-relaxed sm:text-[13px]">
              {LINES.map((line, i) => (
                <div
                  key={i}
                  className="fx-code-line flex gap-4"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className="w-6 select-none text-right text-white/30">
                    {line.num}
                  </span>
                  <span className="whitespace-pre">
                    {line.tokens.map((tok, j) => (
                      <span key={j} className={tok.cls}>
                        {tok.text}
                      </span>
                    ))}
                    {line.tokens.length === 1 && line.tokens[0].text === '' && (
                      <span>&nbsp;</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Right: marketing copy */}
        <Reveal delay={120}>
          <div>
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
              <Clipboard className="h-3.5 w-3.5 text-primary" />
              From browser to production
            </div>
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Five seconds from preview to paste
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground sm:text-lg">
              Hover any effect, click <span className="font-semibold text-foreground">Copy</span>,
              and paste straight into your editor. The HTML and CSS arrive
              together, formatted and ready to ship. No build step, no
              package install, no dependency to track.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'HTML + CSS copied together in one click',
                'Brand-aware via CSS custom properties',
                'Works in any codebase — React, Vue, plain HTML',
                'No runtime cost — pure CSS, zero JavaScript',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
