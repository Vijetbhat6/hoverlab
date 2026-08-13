/**
 * <TeamGrid> — the about-page team section, without the photo shoot.
 *
 * Initials avatars instead of photos is the load-bearing decision. Photos
 * mean an asset pipeline, a cropping convention, a retina variant, and a
 * broken-image state for the person who joined last week — the grid looks
 * unfinished until everyone has sat for the same photographer. Initials
 * drawn from the design tokens are correct on day one, theme with the
 * page, and never 404. The palette varies by person but stays inside the
 * token system, so both themes hold without a single hex value.
 *
 * Social links are real anchors with accessible names — an icon-only link
 * with no label is a mystery button to a screen reader.
 */

import * as React from 'react'
import { Github, Linkedin, Twitter } from 'lucide-react'

export interface TeamMember {
  name: string
  role: string
  bio: string
  /** Overrides the initials derived from the name. */
  initials?: string
  twitter?: string
  linkedin?: string
  github?: string
}

export interface TeamGridProps {
  heading?: string
  intro?: string
  members?: TeamMember[]
  className?: string
}

/** Token/opacity combos only — no hex, so both themes stay coherent. */
const AVATAR_STYLES = [
  'bg-primary/15 text-primary',
  'bg-secondary text-secondary-foreground',
  'bg-muted text-foreground',
  'bg-primary/10 text-primary',
  'bg-accent text-accent-foreground',
  'bg-muted/60 text-muted-foreground',
]

const DEFAULT_MEMBERS: TeamMember[] = [
  {
    name: 'Priya Raghavan',
    role: 'Co-founder & CEO',
    bio: 'Previously led platform at a payments unicorn; still reviews PRs.',
    twitter: '#', linkedin: '#', github: '#',
  },
  {
    name: 'Marcus Okafor',
    role: 'Co-founder & CTO',
    bio: 'Wrote the first commit in March 2023 and the incident runbook the week after.',
    twitter: '#', github: '#',
  },
  {
    name: 'Elena Sokolova',
    role: 'Head of Design',
    bio: 'Believes every empty state deserves as much care as the dashboard.',
    twitter: '#', linkedin: '#',
  },
  {
    name: 'Tom Whitfield',
    role: 'Staff Engineer',
    bio: 'Owns the sync engine; measures success in p99s, not features.',
    github: '#', linkedin: '#',
  },
  {
    name: 'Aisha Diallo',
    role: 'Product Manager',
    bio: 'Turns forty support tickets a week into a roadmap the team believes in.',
    twitter: '#', linkedin: '#',
  },
  {
    name: 'Daniel Kim',
    role: 'Developer Advocate',
    bio: 'If you found us through a conference talk in 2026, it was probably his.',
    twitter: '#', github: '#', linkedin: '#',
  },
]

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export function TeamGrid({
  heading = 'The people building it',
  intro = 'A small team spread across four time zones, shipping every week since 2023.',
  members = DEFAULT_MEMBERS,
  className = '',
}: TeamGridProps) {
  return (
    <section className={`mx-auto w-full max-w-5xl px-6 py-16 ${className}`}>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{heading}</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">{intro}</p>

      <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member, index) => (
          <li
            key={member.name}
            className="flex flex-col rounded-2xl border border-border/60 bg-card/60 p-5 text-card-foreground"
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  AVATAR_STYLES[index % AVATAR_STYLES.length]
                }`}
              >
                {member.initials ?? initialsOf(member.name)}
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold">{member.name}</h3>
                <p className="truncate text-xs text-muted-foreground">{member.role}</p>
              </div>
            </div>

            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
              {member.bio}
            </p>

            <div className="mt-4 flex gap-1">
              {member.twitter ? (
                <a
                  href={member.twitter}
                  aria-label={`${member.name} on X`}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Twitter aria-hidden className="h-4 w-4" />
                </a>
              ) : null}
              {member.linkedin ? (
                <a
                  href={member.linkedin}
                  aria-label={`${member.name} on LinkedIn`}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Linkedin aria-hidden className="h-4 w-4" />
                </a>
              ) : null}
              {member.github ? (
                <a
                  href={member.github}
                  aria-label={`${member.name} on GitHub`}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Github aria-hidden className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
