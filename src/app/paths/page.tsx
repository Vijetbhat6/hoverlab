/**
 * /paths — the guided tracks.
 *
 * The hubs answer "what is there". This answers "I have never built one of
 * these, where do I start", which is the question someone actually arrives
 * with and the one a grid of 76 blocks is bad at.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Compass, Clock, Layers } from 'lucide-react'

import { PATHS } from '@/lib/paths/catalog'
import { absoluteUrl } from '@/lib/site'

const TITLE = `${PATHS.length} guided paths — build something end to end — Hoverlab`
const DESCRIPTION =
  'Ordered routes through the catalog: a landing page in eight blocks, a waitlist in an evening, a complete auth flow, onboarding, settings, a dashboard, billing, a storefront. Each step says why it is where it is.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'landing page tutorial',
    'react dashboard tutorial',
    'build a storefront',
    'tailwind landing page blocks',
  ],
  alternates: { canonical: '/paths' },
  openGraph: {
    url: absoluteUrl('/paths'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function PathsHubPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Compass aria-hidden className="h-3.5 w-3.5" />
            Guided paths
          </span>
          <h1 className="type-hub mt-5">
            Build the whole thing, in order
          </h1>
          <p className="mt-4 text-pretty text-body">
            A catalog tells you what exists. These tell you what to take and in
            what order — and, at every step, why it goes there rather than
            somewhere else. The ordering is the part worth copying.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            {PATHS.length} paths · {PATHS.reduce((n, p) => n + p.steps.length, 0)}{' '}
            steps · beginner paths first
          </p>
        </header>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2">
          {PATHS.map((path) => (
            <li key={path.slug}>
              <Link
                href={`/paths/${path.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card/60 p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                    {path.level}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock aria-hidden className="h-3 w-3" />
                    {path.duration}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Layers aria-hidden className="h-3 w-3" />
                    {path.steps.length} steps
                  </span>
                </div>

                <h2 className="mt-3 text-lg font-bold tracking-tight group-hover:text-primary">
                  {path.title}
                </h2>
                <p className="mt-1.5 flex-1 text-sm text-muted-foreground">
                  {path.tagline}
                </p>

                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  Start
                  <ArrowRight
                    aria-hidden
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
