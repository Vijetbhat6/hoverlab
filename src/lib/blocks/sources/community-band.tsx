/**
 * <CommunityBand> — a closing CTA that points at the places people gather.
 *
 * Three link cards plus a headline. Sits at the foot of a landing page,
 * where the job is no longer to convert but to give a visitor who is not
 * ready somewhere to go that is not "back".
 */

import * as React from 'react'
import { Github, MessagesSquare, Twitter, ArrowUpRight } from 'lucide-react'

export interface CommunityLink {
  label: string
  description: string
  href: string
  icon?: React.ReactNode
  /** Shown as a small tag — star counts, member counts. */
  meta?: string
}

export interface CommunityBandProps {
  links?: CommunityLink[]
  heading?: string
  subheading?: string
  className?: string
}

const DEFAULT_LINKS: CommunityLink[] = [
  {
    label: 'GitHub',
    description: 'Read the source, file an issue, send a pull request.',
    href: 'https://github.com',
    icon: <Github className="h-5 w-5" />,
    meta: '4.2k stars',
  },
  {
    label: 'Discord',
    description: 'Ask a question and get an answer the same day.',
    href: 'https://discord.com',
    icon: <MessagesSquare className="h-5 w-5" />,
    meta: '3.1k members',
  },
  {
    label: 'X',
    description: 'Release notes, new sections, and work in progress.',
    href: 'https://x.com',
    icon: <Twitter className="h-5 w-5" />,
    meta: '@handle',
  },
]

export function CommunityBand({
  links = DEFAULT_LINKS,
  heading = 'Come build with us',
  subheading = 'Most of what ships started as someone asking for it.',
  className = '',
}: CommunityBandProps) {
  return (
    <section className={`mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}>
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {heading}
        </h2>
        {subheading ? <p className="mt-3 text-muted-foreground">{subheading}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer noopener"
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground/80 transition-colors group-hover:bg-primary/15 group-hover:text-primary">
                {link.icon}
              </span>
              <span className="font-semibold tracking-tight">{link.label}</span>
              <ArrowUpRight
                aria-hidden
                className="ms-auto h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
              />
            </div>

            <p className="mt-3 text-sm text-muted-foreground">{link.description}</p>

            {link.meta ? (
              <span className="mt-4 self-start rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {link.meta}
              </span>
            ) : null}
          </a>
        ))}
      </div>
    </section>
  )
}
