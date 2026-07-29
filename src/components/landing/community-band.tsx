'use client'

/**
 * <CommunityBand> — social proof band with GitHub stars + community links.
 *
 * Sits at the very bottom (above the existing footer). Three columns:
 * GitHub repo card (with star count + forks), Discord card, Twitter/X card.
 * Plus a row of "as seen on" badges (Product Hunt, Hacker News, dev.to).
 *
 * Replaces the existing simple footer text with something more substantial
 * without removing the existing footer.
 */

import * as React from 'react'
import { Github, MessageCircle, Twitter, Star, GitFork, ArrowUpRight } from 'lucide-react'
import { Reveal } from '@/components/reveal'

interface Channel {
  icon: React.ReactNode
  name: string
  handle: string
  stat: string
  statLabel: string
  href: string
  accent: string
}

const CHANNELS: Channel[] = [
  {
    icon: <Github className="h-5 w-5" />,
    name: 'GitHub',
    handle: '/hoverlab/css-effects',
    stat: '4.2k',
    statLabel: 'stars',
    href: 'https://github.com',
    accent: 'text-foreground',
  },
  {
    icon: <MessageCircle className="h-5 w-5" />,
    name: 'Discord',
    handle: '/hoverlab',
    stat: '890',
    statLabel: 'members',
    href: 'https://discord.com',
    accent: 'text-indigo-500',
  },
  {
    icon: <Twitter className="h-5 w-5" />,
    name: 'X (Twitter)',
    handle: '@hoverlabcss',
    stat: '2.1k',
    statLabel: 'followers',
    href: 'https://twitter.com',
    accent: 'text-sky-500',
  },
]

const PRESS = ['Product Hunt', 'Hacker News', 'dev.to', 'CSS-Tricks', 'Smashing']

export function CommunityBand() {
  return (
    <section className="border-t border-border/40 bg-background/60 py-16 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-10 text-center">
          <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
            Join the community
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Open source, open chat, open ears. Come say hi.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CHANNELS.map((c, i) => (
            <Reveal key={c.name} delay={i * 80}>
              <a
                href={c.href}
                target="_blank"
                rel="noreferrer noopener"
                className="fx-bento-tile group flex h-full items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur"
              >
                <div className="flex items-center gap-3">
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted ${c.accent}`}>
                    {c.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{c.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {c.handle}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold tracking-tight">
                    {c.stat}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {c.statLabel}
                  </div>
                </div>
              </a>
            </Reveal>
          ))}
        </div>

        {/* As seen on */}
        <Reveal delay={240} className="mt-12">
          <div className="flex flex-col items-center gap-4 border-t border-border/40 pt-8 sm:flex-row sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              As featured on
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {PRESS.map((p) => (
                <span
                  key={p}
                  className="text-sm font-semibold text-muted-foreground/70 transition-colors hover:text-foreground"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Star CTA */}
        <Reveal delay={320} className="mt-8 flex justify-center">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-5 py-2.5 text-sm font-semibold transition-all hover:border-primary/40 hover:gap-3"
          >
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            Star us on GitHub
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1">
              <GitFork className="h-3.5 w-3.5" /> 412 forks
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        </Reveal>
      </div>
    </section>
  )
}
