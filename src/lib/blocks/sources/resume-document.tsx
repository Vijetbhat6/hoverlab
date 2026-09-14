/**
 * <ResumeDocument> — a CV that is a document, and prints like one.
 *
 * Personal sites solve this badly in one of two ways. Either the CV is a
 * PDF behind a download link, which means it is a second artefact that goes
 * stale the first time a job title changes; or it is a "timeline" of
 * alternating cards with icons and connector lines, which looks like a
 * product page and prints as four pages of whitespace.
 *
 * This is the third option: one column, real headings, dates on the end
 * edge, and a `print:` layer that turns it into something a hiring manager
 * can put on paper without opening a dialog. That print layer is the whole
 * point of the block — everything else here is ordinary markup.
 *
 * WHAT THE PRINT LAYER ACTUALLY DOES, and why each part is needed:
 *
 * - `print:text-black print:bg-white` — a dark-mode CV prints as a solid
 *   black rectangle on most drivers, or as nothing at all on the ones that
 *   drop backgrounds. Colour is forced rather than inherited.
 * - `print:break-inside-avoid` on every role — the default is to split a
 *   job across the page break, which puts three bullets about a job on page
 *   two under no heading.
 * - `print:hidden` on the actions — a "Download PDF" button printed onto
 *   the PDF is the joke every CV template makes.
 * - Link URLs are already visible as text, so there is no `after:content`
 *   trick expanding hrefs in print. A CV that reads "aisling.dev" on screen
 *   and "aisling.dev (https://aisling.dev)" on paper is worse on paper.
 *
 * DATES ARE STRINGS, and the current role's end is the word "Present"
 * rather than an open range or a computed `new Date()`. Computing it would
 * be a hydration mismatch and, worse, a CV that silently changed after the
 * person left the job.
 *
 * BULLETS NAME AN OUTCOME AND A CONSTRAINT. The demo data is written that
 * way on purpose, because it is the single thing that separates a CV that
 * gets read from one that does not, and a template whose placeholder text
 * is "Responsible for various tasks" teaches the wrong shape.
 */

import * as React from 'react'
import { Mail, Globe, Github, Linkedin, MapPin, Printer } from 'lucide-react'

function instanceId(...parts: (string | undefined)[]): string {
  const text = parts.filter(Boolean).join('|')
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = (Math.imul(hash, 31) + text.charCodeAt(i)) | 0
  return (hash >>> 0).toString(36).slice(0, 6)
}

export interface ResumeRole {
  title: string
  organisation: string
  /** "Mar 2023 — Present". One string, formatted by you. See the header. */
  period: string
  location?: string
  /** One line of context before the bullets: what the company is, team size. */
  summary?: string
  /** Outcome and constraint, not responsibilities. */
  bullets?: string[]
}

export interface ResumeSection {
  /** "Education", "Writing", "Open source", "Speaking". */
  heading: string
  entries: Array<{ label: string; detail?: string; period?: string }>
}

export interface ResumeLink {
  label: string
  href: string
  /** Which glyph to draw. Unknown values fall back to the globe. */
  icon?: 'mail' | 'web' | 'github' | 'linkedin' | 'location'
}

export interface ResumeDocumentProps {
  name?: string
  /** The role you are applying for, not the one you have. */
  headline?: string
  /** Three sentences at most. Anything longer is not read. */
  summary?: string
  links?: ResumeLink[]
  roles?: ResumeRole[]
  /** Skills as plain words. No five-star ratings — nobody believes them. */
  skills?: string[]
  sections?: ResumeSection[]
  /** Hidden in print. Wire it to `window.print()` in your own project. */
  printLabel?: string
  className?: string
}

const ICONS = {
  mail: Mail,
  web: Globe,
  github: Github,
  linkedin: Linkedin,
  location: MapPin,
} as const

const DEFAULT_LINKS: ResumeLink[] = [
  { label: 'aisling@moreau.dev', href: 'mailto:aisling@moreau.dev', icon: 'mail' },
  { label: 'moreau.dev', href: '#', icon: 'web' },
  { label: 'github.com/amoreau', href: '#', icon: 'github' },
  { label: 'Lisbon, Portugal (UTC+1)', href: '', icon: 'location' },
]

const DEFAULT_ROLES: ResumeRole[] = [
  {
    title: 'Principal Engineer, Platform',
    organisation: 'Northwind',
    period: 'Mar 2023 — Present',
    location: 'Remote',
    summary: 'Series B logistics platform, 40 engineers, one Rails monolith and four Go services.',
    bullets: [
      'Cut p95 checkout latency from 2.4s to 610ms by deleting a caching layer rather than adding one — the invalidation cost more than the reads saved.',
      'Led the migration off a managed search product onto Postgres full-text, against a hard contract-expiry date. Saved $310k a year with no change to result quality anyone could measure.',
      'Wrote the on-call handbook and cut pages per engineer per week from 11 to 2, mostly by deleting alerts nobody had ever acted on.',
    ],
  },
  {
    title: 'Senior Software Engineer',
    organisation: 'Contoso Health',
    period: 'Jun 2019 — Feb 2023',
    location: 'Dublin',
    summary: 'Patient records for 60 clinics. Regulated, audited, and slow to change by design.',
    bullets: [
      'Rebuilt the appointment booking flow to meet WCAG 2.1 AA before the deadline the procurement contract set. It passed audit first time, which nothing else that year did.',
      'Introduced contract tests between the scheduling service and three consumers, ending a class of release that broke a downstream team every quarter.',
    ],
  },
  {
    title: 'Software Engineer',
    organisation: 'Umbra Labs',
    period: 'Sep 2016 — May 2019',
    location: 'Dublin',
    bullets: [
      'Second engineer. Built the billing integration that the company ran on unchanged for six years.',
    ],
  },
]

const DEFAULT_SECTIONS: ResumeSection[] = [
  {
    heading: 'Education',
    entries: [
      {
        label: 'BA (Mod) Computer Science',
        detail: 'Trinity College Dublin — First Class Honours',
        period: '2012 — 2016',
      },
    ],
  },
  {
    heading: 'Selected writing and talks',
    entries: [
      { label: '“The cache we deleted”', detail: 'SRECon EMEA, main track', period: '2025' },
      { label: '“Accessibility as a procurement requirement”', detail: 'Write the Docs', period: '2024' },
    ],
  },
]

const DEFAULT_SKILLS = [
  'TypeScript',
  'Go',
  'Postgres',
  'React',
  'Next.js',
  'Terraform',
  'OpenTelemetry',
  'WCAG 2.2 AA',
  'Incident command',
]

export function ResumeDocument({
  name = 'Aisling Moreau',
  headline = 'Principal engineer — platform, performance and the unglamorous parts',
  summary = 'Ten years building systems that other engineers depend on, mostly by removing things. I am at my best on a team that has outgrown its first architecture and has to keep shipping while it changes. Looking for a principal or staff role where the hard problem is technical rather than political.',
  links = DEFAULT_LINKS,
  roles = DEFAULT_ROLES,
  skills = DEFAULT_SKILLS,
  sections = DEFAULT_SECTIONS,
  printLabel = 'Print or save as PDF',
  className = '',
}: ResumeDocumentProps) {
  const headingId = `resume-heading-${instanceId(name, headline)}`

  return (
    <article
      aria-labelledby={headingId}
      className={`mx-auto w-full max-w-3xl px-6 py-14 print:max-w-none print:px-0 print:py-0 print:text-black ${className}`}
    >
      {/* ── Masthead ───────────────────────────────────────────────── */}
      <header className="border-b border-border pb-6 print:border-black/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1
              id={headingId}
              className="text-3xl font-bold tracking-tight sm:text-4xl print:text-2xl"
            >
              {name}
            </h1>
            <p className="mt-1.5 text-pretty text-base text-muted-foreground print:text-black/70">
              {headline}
            </p>
          </div>

          {printLabel ? (
            <p className="print:hidden">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Printer aria-hidden className="h-3.5 w-3.5" />
                {printLabel}
              </span>
            </p>
          ) : null}
        </div>

        {links.length ? (
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {links.map((link) => {
              const Icon = ICONS[link.icon ?? 'web'] ?? Globe
              const body = (
                <>
                  <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" />
                  {link.label}
                </>
              )
              return (
                <li key={link.label}>
                  {link.href ? (
                    <a
                      href={link.href}
                      className="inline-flex items-center gap-1.5 text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline print:text-black/70 print:no-underline"
                    >
                      {body}
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground print:text-black/70">
                      {body}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        ) : null}
      </header>

      {summary ? (
        <p className="mt-6 max-w-prose text-pretty text-sm leading-relaxed text-muted-foreground print:text-black/80">
          {summary}
        </p>
      ) : null}

      {/* ── Experience ─────────────────────────────────────────────── */}
      <section className="mt-10" aria-label="Experience">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground print:text-black/60">
          Experience
        </h2>

        <ol className="mt-5 space-y-7">
          {roles.map((role) => (
            <li key={`${role.organisation}-${role.period}`} className="print:break-inside-avoid">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-base font-semibold text-foreground print:text-black">
                  {role.title}
                  <span className="font-normal text-muted-foreground print:text-black/70">
                    {' · '}
                    {role.organisation}
                  </span>
                </h3>
                <p className="shrink-0 text-xs tabular-nums text-muted-foreground print:text-black/60">
                  {role.period}
                  {role.location ? ` · ${role.location}` : null}
                </p>
              </div>

              {role.summary ? (
                <p className="mt-1.5 text-sm text-muted-foreground print:text-black/70">
                  {role.summary}
                </p>
              ) : null}

              {role.bullets?.length ? (
                <ul className="mt-2.5 space-y-1.5 ps-5 text-sm leading-relaxed text-muted-foreground marker:text-muted-foreground/50 print:text-black/80 [&>li]:list-disc">
                  {role.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      {/* ── Skills ─────────────────────────────────────────────────── */}
      {skills.length ? (
        <section className="mt-10 print:break-inside-avoid" aria-label="Skills">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground print:text-black/60">
            Skills
          </h2>
          {/* Words in a row, not chips in a cloud and certainly not bars.
              A proficiency bar is a number the reader cannot check and the
              writer cannot justify. */}
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground print:text-black/80">
            {skills.join(' · ')}
          </p>
        </section>
      ) : null}

      {/* ── Everything else ────────────────────────────────────────── */}
      {sections.map((section) => (
        <section
          key={section.heading}
          className="mt-10 print:break-inside-avoid"
          aria-label={section.heading}
        >
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground print:text-black/60">
            {section.heading}
          </h2>
          <ul className="mt-4 space-y-3">
            {section.entries.map((entry) => (
              <li
                key={entry.label}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5"
              >
                <span className="text-sm font-medium text-foreground print:text-black">
                  {entry.label}
                  {entry.detail ? (
                    <span className="font-normal text-muted-foreground print:text-black/70">
                      {' — '}
                      {entry.detail}
                    </span>
                  ) : null}
                </span>
                {entry.period ? (
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground print:text-black/60">
                    {entry.period}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  )
}
