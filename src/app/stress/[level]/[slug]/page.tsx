/**
 * /stress/block/hero-split — one artifact under every stress, side by side.
 *
 * ── WHAT IS SHOWN, AND WHAT IS NOT ──────────────────────────────────────
 *
 * Nine of the eleven conditions can be reproduced in a page, so those rows
 * carry two live frames: the untouched baseline and the stressed version,
 * both at their real viewport width. Forced colors and reduced motion are
 * media features that only a browser's own settings can switch on, so those
 * rows show the harness's verdict and findings and say why there is no
 * frame, rather than faking one with a filter.
 *
 * ── STALE RESULTS ARE LABELLED, NOT HIDDEN ──────────────────────────────
 *
 * A result is stamped with a hash of the source it measured. If the source
 * has changed since, the verdicts describe a different artifact, and the
 * page says so at the top instead of showing an old "Pass" as current.
 *
 * Not indexed: this is 470 near-identical frames-and-chips pages, and the
 * index at /stress is the thing worth ranking.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, TriangleAlert } from 'lucide-react'

import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { OutcomeChip } from '@/components/stress/outcome-chip'
import { ScaledFrame } from '@/components/stress/scaled-frame'
import { BLOCKS, getBlock } from '@/lib/blocks/blocks'
import { PAGES, getPage } from '@/lib/pages/pages'
import { PRIMITIVES, getPrimitive } from '@/lib/primitives/primitives'
import {
  BASELINE_VIEWPORT,
  FAMILY_BY_ID,
  STRESSES,
  STRESS_FAMILIES,
  framePath,
  isStressLevel,
  type StressLevel,
} from '@/lib/stress/conditions'
import { hashFiles } from '@/lib/stress/hash-files'
import { familiesPassed, resultFor } from '@/lib/stress/report'

export const dynamicParams = false

export function generateStaticParams() {
  return [
    ...PRIMITIVES.map((a) => ({ level: 'primitive', slug: a.id })),
    ...BLOCKS.map((a) => ({ level: 'block', slug: a.id })),
    ...PAGES.map((a) => ({ level: 'page', slug: a.id })),
  ]
}

interface PageProps {
  params: Promise<{ level: string; slug: string }>
}

function lookup(level: StressLevel, slug: string) {
  return level === 'primitive' ? getPrimitive(slug) : level === 'block' ? getBlock(slug) : getPage(slug)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { level, slug } = await params
  if (!isStressLevel(level)) return {}
  const artifact = lookup(level, slug)
  if (!artifact) return {}
  return {
    title: `${artifact.name} under stress — Hoverlab`,
    description: `${artifact.name} rendered with German-length text, Japanese text, 200% text size, 400% zoom, forced colors, reduced motion, right-to-left, dark theme and extreme data.`,
    robots: { index: false, follow: true },
  }
}

export default async function StressMatrixPage({ params }: PageProps) {
  const { level: rawLevel, slug } = await params
  if (!isStressLevel(rawLevel)) notFound()
  const level = rawLevel
  const artifact = lookup(level, slug)
  if (!artifact) notFound()

  const result = resultFor(level, slug)
  const stale = !!result && result.h !== hashFiles(artifact.files)
  const passed = familiesPassed(result)

  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-10 sm:px-6">
        <Link
          href={`/${level}/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="h-4 w-4 rtl:rotate-180" />
          {artifact.name}
        </Link>

        <header className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Stress test · {level}
          </p>
          <h1 className="type-page mt-2">{artifact.name} under stress</h1>
          <p className="mt-3 max-w-2xl text-pretty text-body">
            {result
              ? `Passes ${passed} of ${STRESS_FAMILIES.length} stress families. Each row below compares the untouched component with the same component under one real-world condition.`
              : 'This artifact has not been measured yet. The frames below are live, so you can see each condition; the verdicts appear once the harness has run.'}
          </p>
          {result ? (
            <p className="mt-2 text-xs text-muted-foreground">Measured {result.at}.</p>
          ) : null}

          {stale ? (
            <div
              role="note"
              className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-600/30 bg-amber-600/10 p-4"
            >
              <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-amber-800 dark:text-amber-300" />
              <p className="text-sm leading-relaxed">
                <strong className="font-semibold">These results are out of date.</strong> The
                source of this {level} changed after it was measured, so the verdicts describe
                an earlier version. Re-run{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  npm run stress -- --level {level} --only {slug} --write
                </code>
                .
              </p>
            </div>
          ) : null}
        </header>

        <div className="mt-10 space-y-12">
          {STRESS_FAMILIES.map((family) => (
            <section key={family.id} aria-labelledby={`family-${family.id}`}>
              <h2 id={`family-${family.id}`} className="text-lg font-bold tracking-tight">
                {family.label}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{family.why}</p>

              <div className="mt-5 space-y-8">
                {STRESSES.filter((stress) => stress.family === family.id).map((stress) => {
                  const outcome = result?.s[stress.id]
                  const findings = result?.f?.[stress.id] ?? []
                  const baseline = stress.baseline ? BASELINE_VIEWPORT[stress.baseline] : stress.viewport

                  return (
                    <article key={stress.id} className="rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-base font-semibold">{stress.label}</h3>
                        <OutcomeChip outcome={outcome} />
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {stress.summary}
                        {stress.wcag ? <> WCAG {stress.wcag}.</> : null}
                      </p>

                      {findings.length > 0 ? (
                        <ul className="mt-3 space-y-1.5">
                          {findings.map((finding, index) => (
                            <li key={index} className="text-sm leading-relaxed text-foreground">
                              {finding}
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      {stress.live ? (
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <figure>
                            <figcaption className="mb-1.5 text-xs font-medium text-muted-foreground">
                              Baseline, {baseline.width}px wide
                            </figcaption>
                            <ScaledFrame
                              src={framePath(level, slug, stress.baseline ?? 'base-320')}
                              width={baseline.width}
                              height={baseline.height}
                              title={`${artifact.name}, baseline at ${baseline.width}px`}
                            />
                          </figure>
                          <figure>
                            <figcaption className="mb-1.5 text-xs font-medium text-muted-foreground">
                              {stress.label}
                            </figcaption>
                            <ScaledFrame
                              src={framePath(level, slug, stress.id)}
                              width={stress.viewport.width}
                              height={stress.viewport.height}
                              title={`${artifact.name} under ${stress.label}`}
                            />
                          </figure>
                        </div>
                      ) : (
                        <p className="mt-4 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                          No live frame: {FAMILY_BY_ID[stress.family].label.toLowerCase()} is a browser
                          setting a web page cannot switch on for itself. The verdict comes from the
                          test harness, which turns it on for real.
                        </p>
                      )}
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
