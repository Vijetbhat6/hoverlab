'use client'

/**
 * <CommunityBand> — where to find the project, when there is somewhere to
 * point at.
 *
 * Two things were wrong with the previous version and both were the same
 * mistake: it wrote cheques the project could not cash.
 *
 * The three cards carried "4.2k stars", "890 members" and "2.1k followers",
 * and the CTA under them added "412 forks". None of those numbers came from
 * anywhere — they were typed. So was the "As featured on Product Hunt ·
 * Hacker News · dev.to · CSS-Tricks · Smashing" row. This is the same
 * invented social proof someone was right to delete from the testimonials
 * section, and it is more checkable than testimonials were: the star count
 * is one click from being disproved. Counts are gone. If they come back,
 * they come back from GitHub's API at build time, not from this file.
 *
 * The links themselves went to github.com, discord.com and twitter.com —
 * platform front pages, not this project — because the environment
 * variables behind them are unset. A section headed "Join the community"
 * whose every link leads nowhere is worse than no section, so the band now
 * renders only the channels that have a real URL, and nothing at all when
 * none do. Set NEXT_PUBLIC_GITHUB_URL / _DISCORD_URL / _TWITTER_URL and each
 * card appears on its own.
 */

import * as React from 'react'
import { Github, MessageCircle, Twitter, Star, ArrowUpRight } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { SOCIAL, isPlaceholder, type SocialLink } from '@/lib/social'

interface Channel {
  icon: React.ReactNode
  name: string
  /** What someone gets by following this link — not how many others did. */
  blurb: string
  link: SocialLink
  accent: string
}

const CHANNELS: Channel[] = [
  {
    icon: <Github className="h-5 w-5" />,
    name: 'GitHub',
    blurb: 'Source, issues and releases',
    link: SOCIAL.github,
    accent: 'text-foreground',
  },
  {
    icon: <MessageCircle className="h-5 w-5" />,
    name: 'Discord',
    blurb: 'Ask, show what you built',
    link: SOCIAL.discord,
    accent: 'text-indigo-500',
  },
  {
    icon: <Twitter className="h-5 w-5" />,
    name: 'X (Twitter)',
    blurb: 'New effects as they land',
    link: SOCIAL.twitter,
    accent: 'text-sky-500',
  },
]

export function CommunityBand() {
  const channels = CHANNELS.filter((c) => !isPlaceholder(c.link))

  // Nothing to join yet. Render nothing rather than an empty heading.
  if (channels.length === 0) return null

  const github = channels.find((c) => c.name === 'GitHub')

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

        <div
          className={`grid grid-cols-1 gap-4 ${
            channels.length === 1
              ? 'sm:max-w-sm sm:mx-auto'
              : channels.length === 2
                ? 'sm:grid-cols-2'
                : 'sm:grid-cols-3'
          }`}
        >
          {channels.map((c, i) => (
            <Reveal key={c.name} delay={i * 80}>
              <a
                href={c.link.href}
                target="_blank"
                rel="noreferrer noopener"
                className="fx-bento-tile group flex h-full items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted ${c.accent}`}
                  >
                    {c.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{c.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {c.link.handle}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{c.blurb}</div>
                </div>
              </a>
            </Reveal>
          ))}
        </div>

        {/* Star CTA — only when there is a repository to star. */}
        {github ? (
          <Reveal delay={320} className="mt-8 flex justify-center">
            <a
              href={github.link.href}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-5 py-2.5 text-sm font-semibold transition-all hover:border-primary/40 hover:gap-3"
            >
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              Star us on GitHub
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          </Reveal>
        ) : null}
      </div>
    </section>
  )
}
