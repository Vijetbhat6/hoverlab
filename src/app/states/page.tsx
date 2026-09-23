/**
 * /states — state coverage for every primitive, and the Figma frames it produced.
 *
 * ── WHAT THIS IS, PRECISELY ──────────────────────────────────────────────
 *
 * The Figma primitives kit traces a control in its default state only. This
 * page reports the other eight — hover, focus, active, disabled, loading,
 * error, empty, long text — measured in a real browser, and links the SVG
 * files a designer can turn into components.
 *
 * "Styled" means the browser's own computed style changed when the state
 * was forced, not that the traced picture looks different: a focus ring
 * drawn with `box-shadow` can be invisible to the tracer and still be a real
 * ring, so the verdict comes from measurement, never from the SVG. A ruling
 * of "not styled" on focus is a WCAG 2.4.7 defect and is listed as one.
 *
 * The frames are variant-READY, not variants: an SVG import cannot create a
 * real Figma component. Converting each frame to a component and running
 * Combine as Variants is a step the designer takes, and the page says so
 * rather than overselling what shipped.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { AlertCircle, CheckCircle2, CircleSlash, Figma, XCircle } from 'lucide-react'

import { JsonLd } from '@/components/json-ld'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { PRIMITIVE_INDEX } from '@/lib/primitives/primitive-index'
import { absoluteUrl } from '@/lib/site'
import { breadcrumbLd } from '@/lib/structured-data'
import {
  NON_DEFAULT_STATES,
  STATE_PROPERTY,
  isVerdict,
  summarize,
  type StateId,
  type Verdict,
} from '@/lib/states/states'

const TITLE = 'Primitive state coverage — Hoverlab'
const DESCRIPTION =
  'Every primitive measured under hover, focus, active, disabled, loading, error, empty and long text, in a real browser. What is actually styled, what is not, and the Figma frames each state produced.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/states' },
  openGraph: { url: absoluteUrl('/states'), title: TITLE, description: DESCRIPTION, type: 'article', siteName: 'Hoverlab' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

interface Manifest {
  generatedAt: string
  primitives: number
  files: Array<{ category: string; slug: string; file: string; primitives: number }>
}

interface Coverage {
  generatedAt: string
  primitives: number
  coverage: Record<string, Partial<Record<StateId, Verdict>>>
  focusDefects: Record<string, string[]>
}

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T
  } catch {
    return null
  }
}

const VERDICT_UI: Record<Verdict, { label: string; Icon: typeof CheckCircle2; className: string }> = {
  styled: { label: 'Styled', Icon: CheckCircle2, className: 'text-emerald-800 dark:text-emerald-300' },
  'not-styled': { label: 'Not styled', Icon: XCircle, className: 'text-red-800 dark:text-red-300' },
  'n/a': { label: 'N/A', Icon: CircleSlash, className: 'text-muted-foreground' },
}

function VerdictCell({ verdict }: { verdict: Verdict | undefined }) {
  const v = verdict && isVerdict(verdict) ? verdict : 'n/a'
  const { label, Icon, className } = VERDICT_UI[v]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${className}`}>
      <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" />
      <span className="sr-only sm:not-sr-only">{label}</span>
    </span>
  )
}

export default function StatesIndexPage() {
  const manifest = readJson<Manifest>(join(process.cwd(), 'public', 'figma', 'states', 'manifest.json'))
  const coverageData = readJson<Coverage>(join(process.cwd(), 'src', 'lib', 'generated-state-coverage.json'))

  const known = new Set(PRIMITIVE_INDEX.map((p) => p.id))
  const coverage = coverageData
    ? Object.fromEntries(Object.entries(coverageData.coverage).filter(([id]) => known.has(id)))
    : {}
  const summary = summarize(coverage)
  const measured = Object.keys(coverage).length
  const defects = coverageData
    ? Object.entries(coverageData.focusDefects).filter(([id]) => known.has(id))
    : []
  const loadingCount = summary.perState.loading?.applicable ?? 0

  return (
    <div className="relative flex min-h-screen flex-col">
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'State coverage' }])} />
      <SiteHeader />

      <main id="main-content" className="mx-auto w-full max-w-4xl flex-1 px-4 pb-20 pt-12 sm:px-6">
        <header>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Primitives · Figma</p>
          <h1 className="type-page mt-2">State coverage, measured in a browser</h1>

          {measured === 0 ? (
            <p className="mt-4 text-pretty text-body">
              The crawler is built but has not been run yet. This page fills in once{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">npx tsx scripts/build-figma-states.mts</code>{' '}
              has written a result.
            </p>
          ) : (
            <p className="mt-4 text-pretty text-body">
              <strong className="font-semibold text-foreground">{measured}</strong> of{' '}
              {PRIMITIVE_INDEX.length} primitives have been measured under hover, focus, active,
              disabled, loading, error, empty and long text. A state is{' '}
              <strong className="font-semibold text-foreground">styled</strong> only when the
              browser&rsquo;s own computed style actually changed — never guessed from a traced
              picture.
            </p>
          )}

          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/40 p-4">
            <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Variant-ready, not variants.</strong>{' '}
              Every frame is named <code className="rounded bg-background px-1 py-0.5 text-xs">{STATE_PROPERTY}=Hover</code>,
              the convention Figma reads a component set from — but an SVG import cannot create a
              real component. Convert each frame to a component, select a primitive&rsquo;s row,
              and run Combine as Variants. Hover, focus and active are forced on every control at
              once; loading only shows where a primitive&rsquo;s own CSS keys on{' '}
              <code className="rounded bg-background px-1 py-0.5 text-xs">aria-busy</code> — that
              is {loadingCount} of {PRIMITIVE_INDEX.length} today. Single-line text can sit
              offset and lucide icons are not traced, the same limits as the plain kit.
            </p>
          </div>
        </header>

        {measured > 0 ? (
          <section className="mt-12" aria-labelledby="summary">
            <h2 id="summary" className="text-lg font-bold tracking-tight">Per state, across {measured} primitives</h2>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-start text-sm">
                <caption className="sr-only">How many primitives are styled, not styled, or not applicable, per state</caption>
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th scope="col" className="py-2 pe-3 text-start font-medium">State</th>
                    <th scope="col" className="py-2 pe-3 text-end font-medium">Styled</th>
                    <th scope="col" className="py-2 pe-3 text-end font-medium">Not styled</th>
                    <th scope="col" className="py-2 text-end font-medium ps-3">N/A</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {NON_DEFAULT_STATES.map((state) => {
                    const tally = summary.perState[state.id]
                    return (
                      <tr key={state.id}>
                        <th scope="row" className="py-2.5 pe-3 text-start align-top font-medium text-foreground">
                          {state.label}
                          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{state.how}</span>
                        </th>
                        <td className="py-2.5 pe-3 text-end align-top tabular-nums text-emerald-800 dark:text-emerald-300">{tally.styled}</td>
                        <td className="py-2.5 pe-3 text-end align-top tabular-nums text-red-800 dark:text-red-300">{tally.notStyled}</td>
                        <td className="py-2.5 text-end align-top tabular-nums text-muted-foreground ps-3">{tally.na}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {defects.length > 0 ? (
          <section className="mt-12" aria-labelledby="focus-defects">
            <h2 id="focus-defects" className="text-lg font-bold tracking-tight">Focus-visible gaps (WCAG 2.4.7)</h2>
            <p className="mt-2 text-sm text-body">
              These controls showed no computed-style change under forced focus: no outline, no
              box-shadow, no border or background change. A keyboard user cannot see where focus
              is.
            </p>
            <ul className="mt-4 divide-y divide-border rounded-xl border border-border/60">
              {defects.map(([id, controls]) => {
                const primitive = PRIMITIVE_INDEX.find((p) => p.id === id)
                return (
                  <li key={id} className="px-4 py-2.5 text-sm">
                    <Link href={`/primitive/${id}`} className="font-medium text-foreground hover:underline">
                      {primitive?.name ?? id}
                    </Link>
                    <span className="ms-2 text-xs text-muted-foreground">{controls.join(', ')}</span>
                  </li>
                )
              })}
            </ul>
          </section>
        ) : null}

        {measured > 0 ? (
          <section className="mt-12" aria-labelledby="table">
            <h2 id="table" className="text-lg font-bold tracking-tight">Every primitive</h2>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-start text-xs">
                <caption className="sr-only">Per-primitive state verdicts</caption>
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th scope="col" className="py-2 pe-3 text-start font-medium">Primitive</th>
                    {NON_DEFAULT_STATES.map((state) => (
                      <th key={state.id} scope="col" className="py-2 pe-3 text-start font-medium">
                        {state.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {PRIMITIVE_INDEX.map((primitive) => {
                    const row = coverage[primitive.id]
                    if (!row) return null
                    return (
                      <tr key={primitive.id}>
                        <th scope="row" className="py-2 pe-3 text-start align-top font-medium text-foreground">
                          <Link href={`/primitive/${primitive.id}`} className="hover:underline">
                            {primitive.name}
                          </Link>
                        </th>
                        {NON_DEFAULT_STATES.map((state) => (
                          <td key={state.id} className="py-2 pe-3 align-top">
                            <VerdictCell verdict={row[state.id]} />
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {manifest && manifest.files.length > 0 ? (
          <section className="mt-12" aria-labelledby="downloads">
            <h2 id="downloads" className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <Figma aria-hidden className="h-4.5 w-4.5 text-primary" />
              Download the frames
            </h2>
            <p className="mt-2 text-sm text-body">
              One file per primitive category. Drag it onto a Figma canvas.
            </p>
            <ul className="mt-4 divide-y divide-border rounded-xl border border-border/60">
              {manifest.files.map((file) => (
                <li key={file.slug} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="font-medium text-foreground">{file.category}</span>
                  <a
                    href={`/figma/states/${file.file}`}
                    download
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {file.file} · {file.primitives} primitives
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">Generated {manifest.generatedAt}.</p>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  )
}
