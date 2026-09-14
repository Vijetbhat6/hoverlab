/**
 * /roadmap — what is being built, what is not, and the proof for what is done.
 *
 * WHY THIS IS A SEPARATE PAGE FROM /changelog
 *
 * /changelog is git-derived and cannot be inflated, which makes it the right
 * answer to "is this alive" and the wrong answer to "what happens next".
 * A buyer holding a one-time licence from a small team is asking the second
 * question, and until this page existed the site answered it with silence —
 * which a reader scores as "nothing is planned".
 *
 * HOW IT STAYS HONEST
 *
 * Three rules, all enforced somewhere other than in this file: shipped rows
 * must link to the thing itself (`roadmap.test.ts`), nothing carries a date,
 * and the refusals are published with their reasons. See `lib/roadmap.ts`
 * for why each one is there.
 *
 * THE ORDERING IS THE ARGUMENT
 *
 * Building first, shipped fourth. The instinct is to open with the longest
 * block of finished work, and it is the wrong instinct: somebody who opened
 * a roadmap wants to know about the future, and a page that answers with
 * twelve things that are already done reads as deflection. The shipped block
 * is still there, still long, and does its work where a reader arrives at it
 * having already been told the truth about the unfinished things.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowUpRight,
  CircleDashed,
  CircleDot,
  CircleSlash,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { JsonLd } from '@/components/json-ld'
import { breadcrumbLd } from '@/lib/structured-data'
import { absoluteUrl } from '@/lib/site'
import {
  STATUS_META,
  STATUS_ORDER,
  roadmapBy,
  type RoadmapStatus,
} from '@/lib/roadmap'

const TITLE = 'Roadmap — what ships next — Hoverlab'
const DESCRIPTION =
  'What is being built, what is committed to, what is only being considered, and what has been decided against and why. No dates: a small team that publishes dates publishes misses.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['hoverlab roadmap', 'component library roadmap', 'what ships next'],
  alternates: { canonical: '/roadmap' },
  openGraph: {
    url: absoluteUrl('/roadmap'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'article',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

/** One icon per status. Shape carries the meaning, not colour alone. */
const STATUS_ICON: Record<RoadmapStatus, typeof CircleDot> = {
  shipped: CheckCircle2,
  building: CircleDot,
  next: CircleDashed,
  considering: HelpCircle,
  'not-doing': CircleSlash,
}

/**
 * Accent per status.
 *
 * Never the only signal — each row also carries its icon and sits under a
 * named heading, so the page survives being read in greyscale or by someone
 * who cannot separate the emerald from the amber.
 */
const STATUS_TONE: Record<RoadmapStatus, string> = {
  shipped: 'text-emerald-600 dark:text-emerald-400',
  building: 'text-primary',
  next: 'text-muted-foreground',
  considering: 'text-muted-foreground',
  'not-doing': 'text-muted-foreground',
}

export default function RoadmapPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Roadmap' }])} />
      <SiteHeader />

      <main
        id="main-content"
        className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20 pt-12 sm:px-6"
      >
        <header>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Roadmap
          </p>
          <h1 className="type-page mt-2">What ships next</h1>
          <p className="mt-4 text-pretty text-body">
            This catalog is a one-time licence from a small team, so &ldquo;what
            happens after I buy&rdquo; is a fair question and this is the answer to
            it. What is being built, what is queued, what is only being thought
            about, and what has been decided against.
          </p>

          {/*
            The limit, before the list rather than after it — the same shape
            /support uses for its response targets. A reader who stops here
            should already know that nothing below is scheduled.
          */}
          <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="font-semibold text-foreground">
                Nothing here carries a date.
              </strong>{' '}
              Not a quarter, not a month, not &ldquo;soon&rdquo;. The order is the
              commitment. For what has actually landed and when, the{' '}
              <Link
                href="/changelog"
                className="underline underline-offset-4 hover:text-foreground"
              >
                changelog
              </Link>{' '}
              is derived from the repository history and cannot be inflated.
            </p>
          </div>
        </header>

        {STATUS_ORDER.map((status) => {
          const items = roadmapBy(status)
          if (items.length === 0) return null
          const meta = STATUS_META[status]
          const Icon = STATUS_ICON[status]

          return (
            <section key={status} className="mt-12">
              <h2 className="type-section flex items-center gap-2">
                <Icon aria-hidden className={`h-5 w-5 ${STATUS_TONE[status]}`} />
                {meta.label}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{meta.blurb}</p>

              <ul className="mt-5 space-y-3">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-border/60 bg-card/40 p-4"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <h3 className="font-semibold">{item.title}</h3>
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                        >
                          {/*
                            The label differs by status and that is not
                            cosmetic. On a shipped row the link is the proof
                            the rule in lib/roadmap.ts demands, and calling it
                            "See it" says so. On an unshipped row the same
                            link points at the nearest thing that exists
                            today, and labelling that "See it" would claim the
                            unfinished thing is finished.
                          */}
                          {status === 'shipped' ? 'See it' : 'Related'}
                          <ArrowUpRight aria-hidden className="h-3 w-3" />
                        </Link>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{item.detail}</p>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}

        <section className="mt-14 rounded-xl border border-border bg-muted/30 p-5">
          <h2 className="text-base font-semibold">Something missing?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The &ldquo;not doing&rdquo; list is there so you do not have to ask about
            those. For anything else,{' '}
            <Link
              href="/support"
              className="underline underline-offset-4 hover:text-foreground"
            >
              write in
            </Link>
            . A request that arrives with the project it is for attached is worth
            more than ten votes.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
