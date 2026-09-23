/**
 * /stress — the stress-test matrix, as published evidence.
 *
 * ── THE HEADLINE IS A COUNT, NOT A CLAIM ────────────────────────────────
 *
 * The sentence this page exists to earn is "every block is verified under
 * six stresses". It is not written anywhere on the page unless it is true:
 * the headline is computed, and it becomes that sentence only when every
 * artifact has been measured, none of the results is stale and none fails.
 * Until then it says how many pass, which is a stronger position than a
 * claim that a reader can disprove by opening the third block.
 *
 * The same rule keeps this page next to /accessibility rather than in
 * front of it: that page is evidence about what source text can show, this
 * one is evidence about what a browser measured, and neither pretends to be
 * a conformance statement.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertCircle, FlaskConical, Terminal } from 'lucide-react'

import { JsonLd } from '@/components/json-ld'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { BLOCKS } from '@/lib/blocks/blocks'
import { PAGES } from '@/lib/pages/pages'
import { PRIMITIVES } from '@/lib/primitives/primitives'
import { breadcrumbLd } from '@/lib/structured-data'
import { absoluteUrl } from '@/lib/site'
import {
  STRESSES,
  STRESS_BY_ID,
  STRESS_FAMILIES,
  artifactKey,
  type StressLevel,
} from '@/lib/stress/conditions'
import { hashFiles } from '@/lib/stress/hash-files'
import { STRESS_REPORT, familiesPassed, summarize } from '@/lib/stress/report'

const TITLE = 'Stress-test matrix — every block, measured — Hoverlab'
const DESCRIPTION =
  'Every primitive, block and page rendered in a real browser with German-length text, Japanese text, 200% text size, 400% zoom, forced colors, reduced motion, right-to-left, dark theme and extreme data. Per-artifact verdicts, side-by-side frames, and what the method cannot see.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/stress' },
  openGraph: { url: absoluteUrl('/stress'), title: TITLE, description: DESCRIPTION, type: 'article', siteName: 'Hoverlab' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

interface Entry {
  key: string
  level: StressLevel
  id: string
  name: string
  hash: string
}

function entries(): Entry[] {
  const list: Array<[StressLevel, ReadonlyArray<{ id: string; name: string; files: unknown }>]> = [
    ['primitive', PRIMITIVES],
    ['block', BLOCKS],
    ['page', PAGES],
  ]
  return list.flatMap(([level, items]) =>
    items.map((item) => ({
      key: artifactKey(level, item.id),
      level,
      id: item.id,
      name: item.name,
      hash: hashFiles(item.files),
    })),
  )
}

export default function StressIndexPage() {
  const all = entries()
  const known = new Map(all.map((entry) => [entry.key, entry]))

  const fresh = Object.entries(STRESS_REPORT.results).filter(([key, result]) => known.get(key)?.hash === result.h)
  const freshResults = Object.fromEntries(fresh)
  const summary = summarize(freshResults)
  const stale = Object.keys(STRESS_REPORT.results).length - fresh.length
  const unmeasured = all.length - fresh.length

  const complete = summary.measured === all.length && summary.cleanAll === all.length && stale === 0
  const familyCount = STRESS_FAMILIES.length

  const worst = fresh
    .map(([key, result]) => ({
      entry: known.get(key)!,
      failed: Object.values(result.s).filter((v) => v === 0).length,
      passed: familiesPassed(result),
    }))
    .filter((row) => row.failed > 0)
    .sort((a, b) => b.failed - a.failed || a.entry.name.localeCompare(b.entry.name))
    .slice(0, 24)

  return (
    <div className="relative flex min-h-screen flex-col">
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Stress-test matrix' }])} />
      <SiteHeader />

      <main id="main-content" className="mx-auto w-full max-w-4xl flex-1 px-4 pb-20 pt-12 sm:px-6">
        <header>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Stress test</p>
          <h1 className="type-page mt-2">
            {complete
              ? `Every artifact, verified under ${familyCount} stresses`
              : 'Every artifact, under real-world stress'}
          </h1>

          {summary.measured === 0 ? (
            <p className="mt-4 text-pretty text-body">
              The matrix is built and the harness is wired to it, but no results have been recorded
              yet. This page fills in when <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run stress -- --write</code>{' '}
              has run.
            </p>
          ) : (
            <p className="mt-4 text-pretty text-body">
              Of the{' '}
              <strong className="font-semibold text-foreground">
                {summary.measured.toLocaleString('en-US')} primitives, blocks and pages measured so far
              </strong>
              , {summary.cleanAll.toLocaleString('en-US')} pass all {familyCount} stress families and{' '}
              {(summary.measured - summary.cleanAll).toLocaleString('en-US')} fail at least one.
              {stale > 0 ? ` ${stale} more are out of date because their source changed since they were measured.` : ''}
              {unmeasured - stale > 0
                ? ` ${(unmeasured - stale).toLocaleString('en-US')} of the ${all.length.toLocaleString('en-US')} in the catalog have not been run yet, so nothing here says anything about them.`
                : ''}{' '}
              Every failure below is a real layout in a real browser, with a frame you can open.
            </p>
          )}

          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/40 p-4">
            <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">This is a measurement, not a guarantee.</strong>{' '}
              A pass means the harness found no defect it knows how to detect. It does not replace
              testing with real translations, real assistive technology and your own data, and the
              list of what it cannot see is at the bottom of this page.
            </p>
          </div>
        </header>

        <section className="mt-12" aria-labelledby="families">
          <h2 id="families" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <FlaskConical aria-hidden className="h-4.5 w-4.5 text-primary" />
            Six families, eleven conditions
          </h2>
          <p className="mt-2 text-sm text-body">
            A family passes only when every condition in it passes and at least one actually had
            something to act on. A block with no numbers cannot fail the huge-number test, and it
            is counted as not applicable rather than as a pass.
          </p>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-start text-sm">
              <caption className="sr-only">Pass and fail counts per stress family, over measured artifacts</caption>
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pe-3 text-start font-medium">Family</th>
                  <th scope="col" className="py-2 pe-3 text-end font-medium">Pass</th>
                  <th scope="col" className="py-2 pe-3 text-end font-medium">Fail</th>
                  <th scope="col" className="py-2 text-start font-medium ps-3">Conditions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {STRESS_FAMILIES.map((family) => {
                  const row = summary.byFamily.find((r) => r.family === family.id)!
                  return (
                    <tr key={family.id}>
                      <th scope="row" className="py-2.5 pe-3 text-start align-top font-medium text-foreground">
                        {family.label}
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{family.why}</span>
                      </th>
                      <td className="py-2.5 pe-3 text-end align-top tabular-nums">{row.pass}</td>
                      <td className="py-2.5 pe-3 text-end align-top tabular-nums">{row.fail}</td>
                      <td className="py-2.5 ps-3 align-top text-xs text-muted-foreground">
                        {STRESSES.filter((s) => s.family === family.id).map((s) => s.label).join(' · ')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12" aria-labelledby="conditions">
          <h2 id="conditions" className="text-lg font-bold tracking-tight">What each condition does</h2>
          <dl className="mt-4 space-y-4">
            {STRESSES.map((stress) => {
              const failing = summary.byStress.find((r) => r.stress === stress.id)?.fail ?? 0
              return (
                <div key={stress.id} className="rounded-xl border border-border/60 bg-card/40 p-4">
                  <dt className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold">{stress.label}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {failing} failing{stress.wcag ? ` · WCAG ${stress.wcag}` : ''}
                    </span>
                  </dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{stress.summary}</dd>
                </div>
              )
            })}
          </dl>
        </section>

        {worst.length > 0 ? (
          <section className="mt-12" aria-labelledby="worst">
            <h2 id="worst" className="text-lg font-bold tracking-tight">Where it breaks most</h2>
            <p className="mt-2 text-sm text-body">
              Open any of these to see the baseline and the stressed version side by side.
            </p>
            <ul className="mt-4 divide-y divide-border rounded-xl border border-border/60">
              {worst.map(({ entry, failed }) => (
                <li key={entry.key}>
                  <Link
                    href={`/stress/${entry.level}/${entry.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-muted/40"
                  >
                    <span>
                      <span className="font-medium text-foreground">{entry.name}</span>
                      <span className="ms-2 text-xs text-muted-foreground">{entry.level}</span>
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {failed} of {STRESSES.length} failing
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-12" aria-labelledby="blind">
          <h2 id="blind" className="text-lg font-bold tracking-tight">What this cannot see</h2>
          <ul className="mt-4 list-disc space-y-2 ps-5 text-sm text-body">
            <li>Real translations. German-length text is an allowance, not German; word order, hyphenation and kerning are untested.</li>
            <li>Screen readers, switch access and voice control. Axe finds structural problems only.</li>
            <li>Canvas and WebGL content, and any animation driven from JavaScript rather than CSS.</li>
            <li>Empty data is checked for accessible names only; whether an empty card is a good design is a human judgement.</li>
            <li>Changes outside an artifact&rsquo;s own source, such as a design token, until the harness is re-run.</li>
          </ul>
        </section>

        <section className="mt-12" aria-labelledby="reproduce">
          <h2 id="reproduce" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <Terminal aria-hidden className="h-4.5 w-4.5 text-primary" />
            Reproduce it
          </h2>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-border/60 bg-muted/40 p-4 text-xs" tabIndex={0}>
{`npm run dev
npm run stress -- --level block --only ${STRESS_BY_ID.expand ? 'hero-split' : ''} --verbose
npm run stress -- --write`}
          </pre>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
