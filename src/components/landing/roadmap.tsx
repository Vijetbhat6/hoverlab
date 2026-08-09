'use client'

/**
 * <Roadmap> — Now / Next / Later columns showing what we're building.
 *
 * 3 columns, each with 3-4 cards. Communicates product direction and
 * invites users to upvote/feedback. Cards lift on hover (.fx-roadmap-card).
 *
 * Now = currently in progress
 * Next = next quarter, scoped but not started
 * Later = on the wishlist, no timeline
 *
 * This is a public-facing placeholder — replace with real GitHub
 * Issues or a feedback tool (Canny, Linear) when ready.
 */

import * as React from 'react'
import { Zap, Clock, Sparkles, ArrowUpRight } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { SOCIAL } from '@/lib/social'

interface RoadmapItem {
  title: string
  description: string
  tag?: string
}

interface Column {
  label: string
  icon: React.ReactNode
  accent: string
  items: RoadmapItem[]
}

const COLUMNS: Column[] = [
  {
    label: 'Now',
    icon: <Zap className="h-4 w-4" />,
    accent: 'text-emerald-500',
    items: [
      {
        title: 'Filling out the ladder',
        description: 'More blocks, pages and templates every week — the upper rungs are the newest part of the catalog.',
        tag: 'In progress',
      },
      {
        title: 'Effect generator v2',
        description: 'Generate variations of any effect with one click — different colors, timings, easings.',
        tag: 'In progress',
      },
      {
        title: 'AI search improvements',
        description: 'Natural-language search ("button that glows red on hover") getting faster and more accurate.',
      },
    ],
  },
  {
    label: 'Next',
    icon: <Clock className="h-4 w-4" />,
    accent: 'text-amber-500',
    items: [
      {
        title: 'Team workspaces',
        description: 'Shared brand tokens and collections across every seat, with per-workspace theming.',
        tag: 'Q4 2026',
      },
      {
        title: 'Community effects',
        description: 'Submit your own effects for review. Curated, MIT-licensed, credited to you.',
      },
      {
        title: 'Figma plugin',
        description: 'Browse and insert Hoverlab effects directly in Figma without leaving the canvas.',
      },
      {
        title: 'Tailwind plugin',
        description: 'Use Hoverlab effects as Tailwind utility classes (e.g. .hover-glow, .animate-shimmer).',
      },
    ],
  },
  {
    label: 'Later',
    icon: <Sparkles className="h-4 w-4" />,
    accent: 'text-sky-500',
    items: [
      {
        title: 'Interactive tutorials',
        description: 'Step-by-step guides teaching the CSS concepts behind each effect.',
      },
      {
        title: 'Effect remixer',
        description: 'Visually combine two effects (e.g. glow + pulse) and tune the blend.',
      },
      {
        title: 'Mobile app',
        description: 'Browse and favorite effects on the go — syncs with your web account.',
      },
    ],
  },
]

export function Roadmap() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <Reveal className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Where we&apos;re heading
        </h2>
        <p className="mt-3 text-muted-foreground">
          We ship in public. Here&apos;s what&apos;s in flight, what&apos;s
          next, and what&apos;s on the wishlist. Feedback welcome on GitHub.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {COLUMNS.map((col, i) => (
          <Reveal
            key={col.label}
            delay={i * 100}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center gap-2 px-1">
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg bg-muted ${col.accent}`}>
                {col.icon}
              </span>
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/80">
                {col.label}
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              {col.items.map((item, j) => (
                <div
                  key={j}
                  className="fx-roadmap-card rounded-xl border border-border/60 bg-card/80 p-4 backdrop-blur"
                >
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold tracking-tight">
                      {item.title}
                    </h4>
                    {item.tag && (
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={400} className="mt-10 text-center">
        <a
          href={SOCIAL.github.href}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2 hover:underline transition-all"
        >
          Suggest a feature on GitHub
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </Reveal>
    </section>
  )
}
