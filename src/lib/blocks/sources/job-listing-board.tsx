/**
 * <JobListingBoard> — openings grouped by department, not one long list.
 *
 * A flat ranked list of twelve roles makes every candidate read all
 * twelve. Grouping by department works because candidates self-select by
 * craft first — a designer scans straight past Engineering to the Design
 * header and reads three rows instead of twelve. The count in each group
 * header does the same job at a glance ("Engineering (4)") before a
 * single row is read.
 *
 * Each row is one whole <a>, not a title-link inside a div — the entire
 * row is the target, which is what every candidate's thumb assumes. The
 * closing mailto line matters too: the best applicant is often the one
 * your listed roles didn't predict, and a board with no speculative
 * route silently turns them away.
 */

import * as React from 'react'
import { ChevronRight, MapPin } from 'lucide-react'

export interface JobOpening {
  title: string
  location: string
  remote?: boolean
  type: string
  salary: string
  href?: string
}

export interface JobDepartment {
  name: string
  openings: JobOpening[]
}

export interface JobListingBoardProps {
  heading?: string
  intro?: string
  departments?: JobDepartment[]
  speculativeEmail?: string
  className?: string
}

const DEFAULT_DEPARTMENTS: JobDepartment[] = [
  {
    name: 'Engineering',
    openings: [
      {
        title: 'Senior Frontend Engineer',
        location: 'Berlin',
        remote: true,
        type: 'Full-time',
        salary: '€95k–€120k',
        href: '#',
      },
      {
        title: 'Infrastructure Engineer, Sync',
        location: 'Amsterdam',
        remote: true,
        type: 'Full-time',
        salary: '€100k–€130k',
        href: '#',
      },
      {
        title: 'Engineering Intern (Winter 2026)',
        location: 'Berlin',
        type: 'Internship, 6 months',
        salary: '€2.8k/month',
        href: '#',
      },
    ],
  },
  {
    name: 'Design',
    openings: [
      {
        title: 'Product Designer, Growth',
        location: 'London',
        remote: true,
        type: 'Full-time',
        salary: '£75k–£95k',
        href: '#',
      },
      {
        title: 'Brand Designer',
        location: 'London',
        type: 'Full-time',
        salary: '£60k–£78k',
        href: '#',
      },
    ],
  },
  {
    name: 'Go-to-market',
    openings: [
      {
        title: 'Developer Marketing Lead',
        location: 'New York',
        remote: true,
        type: 'Full-time',
        salary: '$130k–$160k',
        href: '#',
      },
      {
        title: 'Solutions Engineer, EMEA',
        location: 'Dublin',
        remote: true,
        type: 'Full-time',
        salary: '€85k–€105k',
        href: '#',
      },
    ],
  },
]

export function JobListingBoard({
  heading = 'Open roles',
  intro = 'We’re hiring across three teams. Every role lists the real salary range — no “competitive”.',
  departments = DEFAULT_DEPARTMENTS,
  speculativeEmail = 'jobs@hoverlab.dev',
  className = '',
}: JobListingBoardProps) {
  return (
    <section className={`mx-auto w-full max-w-3xl px-6 py-16 ${className}`}>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{heading}</h2>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">{intro}</p>

      <div className="mt-10 space-y-10">
        {departments.map((department) => (
          <div key={department.name}>
            <h3 className="flex items-baseline gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {department.name}
              <span className="text-xs font-medium normal-case tracking-normal text-muted-foreground/70">
                {department.openings.length}{' '}
                {department.openings.length === 1 ? 'opening' : 'openings'}
              </span>
            </h3>

            <ul className="mt-3 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card/60">
              {department.openings.map((job) => (
                <li key={job.title}>
                  <a
                    href={job.href ?? '#'}
                    className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-card-foreground">{job.title}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin aria-hidden className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                        {job.remote ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                            Remote OK
                          </span>
                        ) : null}
                        <span>{job.type}</span>
                        <span className="tabular-nums">{job.salary}</span>
                      </p>
                    </div>
                    <ChevronRight
                      aria-hidden
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        Nothing that fits? We read every speculative application —{' '}
        <a
          href={`mailto:${speculativeEmail}`}
          className="font-semibold text-primary underline-offset-4 transition-colors hover:underline"
        >
          {speculativeEmail}
        </a>
        .
      </p>
    </section>
  )
}
