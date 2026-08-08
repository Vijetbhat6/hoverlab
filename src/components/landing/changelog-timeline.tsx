'use client'

/**
 * <ChangelogTimeline> — vertical timeline of recent releases.
 *
 * 5 most recent versions in reverse-chronological order. Each entry:
 * version badge, date, summary, and 2-3 bullet changes. Connected by
 * a vertical line via .fx-timeline-dot ::after.
 *
 * Signals active development + gives return visitors a reason to come
 * back ("oh, they shipped X since I last checked").
 */

import * as React from 'react'
import { GitCommit, ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Reveal } from '@/components/reveal'

interface Release {
  version: string
  date: string
  summary: string
  changes: string[]
  tag?: 'major' | 'minor' | 'patch'
}

const RELEASES: Release[] = [
  {
    version: 'v3.0.0',
    date: 'Aug 8, 2026',
    summary: 'The ladder — blocks, pages, templates and a CLI',
    changes: [
      'Added: blocks, pages and deployable templates above the effects catalog',
      'Added: npx hoverlab add <id> — installs any tier, plus an MCP server',
      'Added: one search and one nav across all four tiers, and a public /api/v1',
    ],
    tag: 'major',
  },
  {
    version: 'v2.5.0',
    date: 'Aug 4, 2026',
    summary: 'India regional pricing, charged in rupees',
    changes: [
      'Added: regional pricing applied automatically, with a $/₹ display toggle',
      'Added: rupee checkout — no cross-border fee from your card issuer',
      'Fixed: two bugs that made checkout unreachable',
    ],
    tag: 'minor',
  },
  {
    version: 'v2.4.0',
    date: 'Jun 28, 2026',
    summary: 'Bento grid landing revamp + 6 new entrance animations',
    changes: [
      'Added: fadeInUp, scaleIn, slideInLeft, slideInRight, blurIn, rotateIn',
      'Improved: bundle export now minifies 12% smaller',
      'Fixed: brand color picker reset button on Safari 17',
    ],
    tag: 'minor',
  },
  {
    version: 'v2.3.1',
    date: 'Jun 14, 2026',
    summary: 'Bug fixes + accessibility polish',
    changes: [
      'Fixed: prefers-reduced-motion now disables all 47 infinite animations',
      'Improved: keyboard navigation on the Surprise Me picker',
      'Fixed: copy button tooltip stuck on touch devices',
    ],
    tag: 'patch',
  },
  {
    version: 'v2.3.0',
    date: 'May 30, 2026',
    summary: 'Bundle export + account sync',
    changes: [
      'Added: bundle drawer with drag-to-reorder',
      'Added: cross-device sync for favorites and bundle',
      'Improved: library filters remember your last selection',
    ],
    tag: 'minor',
  },
]

function tagColor(tag?: Release['tag']) {
  if (tag === 'major') return 'bg-rose-500/15 text-rose-500 hover:bg-rose-500/20'
  if (tag === 'minor') return 'bg-primary/15 text-primary hover:bg-primary/20'
  return 'bg-muted text-muted-foreground hover:bg-muted/80'
}

export function ChangelogTimeline() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <Reveal className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
          <GitCommit className="h-3.5 w-3.5 text-primary" />
          Shipping weekly
        </div>
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          What&apos;s new
        </h2>
        <p className="mt-3 text-muted-foreground">
          We ship a new release every 1–2 weeks. Here&apos;s the recent
          history — full changelog on GitHub.
        </p>
      </Reveal>

      <div className="space-y-8 pl-8">
        {RELEASES.map((r, i) => (
          <Reveal
            key={r.version}
            delay={i * 60}
            className="fx-timeline-item"
          >
            <div className="fx-timeline-dot">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-foreground">
                  {r.version}
                </span>
                <Badge className={tagColor(r.tag)} variant="secondary">
                  {r.tag ?? 'patch'}
                </Badge>
                <span className="text-xs text-muted-foreground">{r.date}</span>
              </div>
              <p className="mb-3 text-sm font-medium text-foreground/90">
                {r.summary}
              </p>
              <ul className="space-y-1.5">
                {r.changes.map((c, j) => {
                  const prefix = c.split(':')[0]
                  const rest = c.substring(prefix.length + 1)
                  const color =
                    prefix === 'Added'
                      ? 'text-emerald-500'
                      : prefix === 'Fixed'
                        ? 'text-amber-500'
                        : 'text-sky-500'
                  return (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className={`shrink-0 font-semibold ${color}`}>
                        {prefix}:
                      </span>
                      <span>{rest}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={300} className="mt-10 text-center">
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2 hover:underline transition-all"
        >
          View full changelog on GitHub
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </Reveal>
    </section>
  )
}
