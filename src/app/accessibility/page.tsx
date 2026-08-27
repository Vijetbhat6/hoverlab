/**
 * /accessibility — the audit, published as evidence.
 *
 * WHY THIS PAGE IS NOT AN ACCESSIBILITY STATEMENT
 *
 * It would be easy to make it one, and that is the trap. Under the
 * European Accessibility Act an accessibility statement is a legal
 * instrument, and none of what follows is strong enough to support one: a
 * static pass over source text cannot see contrast, focus order or reflow.
 * So this page reports what was checked, reports what was not, and makes
 * no claim of conformance — and it says so in the first paragraph rather
 * than in a footnote.
 *
 * The conformance section renders only when
 * `CONFORMANCE_CLAIM_APPROVED` is true, which happens in one place
 * (`scripts/audit-a11y.mts`) and only alongside legal sign-off. Until
 * then this page is strictly more honest than most vendors' — which is
 * the actual competitive point, because no competitor in the category
 * publishes per-artifact evidence at all.
 *
 * WHY PUBLISH IT AT ALL
 *
 * A buyer bound by the EAA has to ask their vendors this question and
 * mostly receives a paragraph of assurance. Handing them a per-artifact
 * result, the list of what the method cannot see, and the command to
 * reproduce it is worth more than a badge, and it costs nothing that is
 * not already true.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Eye, FileSearch, Terminal } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { JsonLd } from '@/components/json-ld'
import { breadcrumbLd } from '@/lib/structured-data'
import { absoluteUrl } from '@/lib/site'
import {
  AUDIT_RULES,
  CONFORMANCE_CLAIM_APPROVED,
  CRITERIA_COVERED,
  UNCHECKED_CRITERIA,
  artifactsWithFindings,
  evidenceSummary,
} from '@/lib/a11y-evidence'

const TITLE = 'Accessibility evidence — every block, audited — Hoverlab'
const DESCRIPTION =
  'Per-artifact WCAG results for every block and page in the catalog: which success criteria are checked, what the checks found, and — stated plainly — the six criteria a static audit cannot decide. Evidence, not a conformance claim.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'accessible react components',
    'wcag 2.1 aa components',
    'european accessibility act components',
    'accessibility audit ui library',
  ],
  alternates: { canonical: '/accessibility' },
  openGraph: {
    url: absoluteUrl('/accessibility'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'article',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function AccessibilityPage() {
  const summary = evidenceSummary()
  const withFindings = artifactsWithFindings()

  return (
    <div className="relative flex min-h-screen flex-col">
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Accessibility evidence' },
        ])}
      />
      <SiteHeader />

      <main
        id="main-content"
        className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20 pt-12 sm:px-6"
      >
        <header>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Accessibility
          </p>
          <h1 className="type-page mt-2">Every block, audited — and what the audit cannot see</h1>
          <p className="mt-4 text-pretty text-body">
            Every one of the {summary.artifacts.toLocaleString('en-US')} artifacts in
            this catalog — {summary.blocks} blocks and {summary.pages} pages — is
            checked against {summary.rules} rules covering {summary.criteria} WCAG
            2.1 success criteria on every build. The current result is{' '}
            <strong className="font-semibold text-foreground">
              {summary.violations} violations
            </strong>{' '}
            and {summary.advisories}{' '}
            {summary.advisories === 1 ? 'advisory' : 'advisories'}.
          </p>

          {/*
            The disclaimer is the first thing, not the last. A reader who
            stops after the numbers above should already know what they do
            and do not mean.
          */}
          {!CONFORMANCE_CLAIM_APPROVED ? (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/40 p-4">
              <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                <strong className="font-semibold text-foreground">
                  This is evidence, not a conformance statement.
                </strong>{' '}
                We do not claim these components conform to WCAG 2.1 AA, and you
                should not represent to your own customers that they do on the
                strength of this page. A static audit reads source text; it cannot
                see rendered colour, focus order or reflow, and{' '}
                {summary.unchecked} criteria are therefore not evaluated at all.
                They are listed below rather than omitted.
              </p>
            </div>
          ) : null}
        </header>

        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <FileSearch aria-hidden className="h-4.5 w-4.5 text-primary" />
            What is checked
          </h2>
          <p className="mt-2 text-sm text-body">
            Each rule below runs against the exact source a visitor copies — not
            against a rendered page — because the source is the artifact. Failing
            any of them fails the build, so a violation cannot ship and then be
            noticed later.
          </p>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                WCAG success criteria checked on every build, with the severity of
                a failure
              </caption>
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pr-3 font-medium">Criterion</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Level</th>
                  <th scope="col" className="py-2 pr-3 font-medium">What it catches</th>
                  <th scope="col" className="py-2 font-medium">On failure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {AUDIT_RULES.map((rule) => (
                  <tr key={rule.id}>
                    <td className="py-2.5 pr-3 align-top font-mono text-xs tabular-nums text-foreground">
                      {rule.sc}
                    </td>
                    <td className="py-2.5 pr-3 align-top text-xs text-muted-foreground">
                      {rule.level}
                    </td>
                    <td className="py-2.5 pr-3 align-top text-foreground">{rule.name}</td>
                    <td className="py-2.5 align-top text-xs text-muted-foreground">
                      {rule.severity === 'violation' ? 'Build fails' : 'Reported, does not fail'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Covering {CRITERIA_COVERED.join(', ')}.
          </p>
        </section>

        {/*
          The half that matters more. Placed before the results, so nobody
          reads "0 violations" without first knowing its scope.
        */}
        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <Eye aria-hidden className="h-4.5 w-4.5 text-primary" />
            What is <em>not</em> checked
          </h2>
          <p className="mt-2 text-sm text-body">
            These {summary.unchecked} criteria cannot be decided from source text.
            Nothing below is a known failure — it is a known blind spot, which is
            a different and more useful thing to be told.
          </p>

          <ul className="mt-5 space-y-3">
            {UNCHECKED_CRITERIA.map((criterion) => (
              <li
                key={criterion.sc}
                className="rounded-xl border border-border/60 bg-card/40 p-4"
              >
                <h3 className="text-sm font-semibold text-foreground">
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {criterion.sc}
                  </span>{' '}
                  {criterion.name}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {criterion.why}
                </p>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Contrast is the one worth dwelling on. Every artifact here is styled
            through CSS variables, and the palette that decides whether text
            passes 4.5:1 is the one <em>your</em> project supplies. We check our
            own default palette; we cannot check yours. The{' '}
            <Link
              href="/tools/contrast"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              contrast checker
            </Link>{' '}
            is free and takes about ten seconds per pair.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
            {withFindings.length === 0 ? (
              <CheckCircle2 aria-hidden className="h-4.5 w-4.5 text-primary" />
            ) : (
              <AlertCircle aria-hidden className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
            )}
            Current findings
          </h2>

          {withFindings.length === 0 ? (
            <p className="mt-2 text-sm text-body">
              None. All {summary.artifacts.toLocaleString('en-US')} artifacts pass
              every rule above, on the build that produced this page. That is a
              statement about {summary.criteria} criteria, not about WCAG 2.1 AA
              as a whole.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {withFindings.map((artifact) => (
                <li
                  key={artifact.id}
                  className="rounded-xl border border-border/60 bg-card/40 p-4"
                >
                  <h3 className="font-mono text-sm font-semibold text-foreground">
                    {artifact.id}
                  </h3>
                  <ul className="mt-1.5 space-y-1">
                    {artifact.findings.map((finding, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        <span className="font-mono text-xs">{finding.sc}</span>{' '}
                        {finding.detail ?? finding.rule}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <Terminal aria-hidden className="h-4.5 w-4.5 text-primary" />
            Reproduce it
          </h2>
          <p className="mt-2 text-sm text-body">
            The audit is a script in the repository, not a service. Clone and run
            it and you get this page&apos;s numbers, or you get different ones and
            we are wrong — which is the point of publishing the method rather than
            a badge.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-[#0b1020] p-4 text-[13px] leading-relaxed text-slate-100">
            <code>npm run audit:a11y</code>
          </pre>
        </section>

        <section className="mt-12 rounded-2xl border border-border/60 bg-card/60 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            If you are bound by the EAA
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-body">
            The European Accessibility Act has been enforceable since June 2025 and
            reaches non-EU sellers who trade into the EU. It obliges you, not your
            component library — no vendor can discharge it for you, and any who say
            otherwise are selling a badge. What a library can honestly offer is
            evidence you can put in front of an auditor, which is what this page is.
            The remaining {summary.unchecked} criteria are yours to test in the
            product you assemble, because that is the only place they exist.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
