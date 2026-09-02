import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { JsonLd } from '@/components/json-ld'
import { TOTAL_COUNT } from '@/lib/catalog-stats'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { PAGE_COUNT } from '@/lib/pages/page-index'
import {
  FRAMEWORK_CAVEAT,
  FRAMEWORK_STORIES,
  SUPPORT_LABELS,
} from '@/lib/frameworks'
import { breadcrumbLd } from '@/lib/structured-data'
import { absoluteUrl } from '@/lib/site'

/**
 * /frameworks — the honest per-framework answer, at a URL.
 *
 * WHY THIS PAGE EXISTS
 *
 * Two reasons, and the second is the one that pays.
 *
 * First: the capability was buried. Vue, Svelte and Astro output has
 * shipped for months inside a tab strip inside a detail page, while
 * Flowbite and React Bits put multi-framework in their mastheads and React
 * Bits went as far as shipping Vue Bits and Svelte Bits as separate sites.
 * <FrameworkBand> on the landing page fixes the visibility; this fixes the
 * fact that a band cannot carry the caveat properly.
 *
 * Second: "tailwind blocks for vue", "svelte ui components", "astro
 * components" are searches, and we had no page that answered any of them.
 * A landing band is not indexable as an answer to a framework query; a
 * route with the framework in its heading is.
 *
 * WHY IT LEADS WITH THE LIMIT
 *
 * Because a reader arriving from "svelte ui components" will find out
 * within one click, and finding out from us is worth more than the click
 * we would gain by burying it. What ships for the non-React frameworks at
 * the block rung is rendered markup wrapped as a component file — a real,
 * valid, useful presentational component, and not a port of the React
 * state. `lib/blocks/markup-frameworks.ts` argues this out at length; the
 * page says the same thing in the reader's words.
 */

const TITLE = 'Tailwind components for React, Vue, Svelte and Astro'
const DESCRIPTION =
  'Every effect converts to a real component in your framework. Blocks and pages ship their markup as a file your framework compiles. What each one gets, stated exactly.'

export const metadata: Metadata = {
  title: `${TITLE} — Hoverlab`,
  description: DESCRIPTION,
  keywords: [
    'vue tailwind components',
    'svelte ui components',
    'astro components tailwind',
    'react tailwind blocks',
    'multi framework component library',
  ],
  alternates: { canonical: '/frameworks' },
  openGraph: {
    url: absoluteUrl('/frameworks'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'article',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

/** The rung columns, in ladder order. Effects first, as the catalog is. */
const RUNGS = [
  { key: 'effects' as const, label: 'Effects', count: TOTAL_COUNT },
  { key: 'blocks' as const, label: 'Blocks & pages', count: BLOCK_COUNT + PAGE_COUNT },
]

export default function FrameworksPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <JsonLd data={breadcrumbLd([{ name: 'Frameworks', path: '/frameworks' }])} />
      <SiteHeader />

      <main id="main" className="flex-1">
        <section className="mx-auto w-full max-w-3xl px-4 pb-10 pt-16 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-primary">Not just React</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            {TITLE}
          </h1>
          <p className="mt-5 text-body text-muted-foreground">
            The catalog is written in React and Tailwind, because that is what
            it is built in. It does not stay there. Every effect converts to a
            real component in your framework, and every block and page gives
            you its markup as a file your framework compiles.
          </p>
          {/*
            The limit, above the fold rather than in a footnote.

            A reader arriving from "svelte ui components" finds this out
            within one click of trying it, and finding out from us is worth
            more than the click we would gain by burying it.
          */}
          <p className="mt-4 rounded-lg border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">The limit, first:</span>{' '}
            {FRAMEWORK_CAVEAT}
          </p>
        </section>

        <section
          className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6 lg:px-8"
          aria-labelledby="matrix-heading"
        >
          <h2 id="matrix-heading" className="text-2xl font-bold tracking-tight">
            What each framework gets
          </h2>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <caption className="sr-only">
                Framework support by catalog rung
              </caption>
              <thead>
                <tr className="border-b border-border text-left">
                  <th scope="col" className="py-3 pr-4 font-semibold">
                    Framework
                  </th>
                  {RUNGS.map((rung) => (
                    <th key={rung.key} scope="col" className="py-3 pr-4 font-semibold">
                      {rung.label}
                      <span className="ml-1.5 font-normal text-muted-foreground">
                        {rung.count.toLocaleString('en-US')}
                      </span>
                    </th>
                  ))}
                  <th scope="col" className="py-3 font-semibold">
                    File
                  </th>
                </tr>
              </thead>
              <tbody>
                {FRAMEWORK_STORIES.map((framework) => (
                  <tr key={framework.id} className="border-b border-border/60 align-top">
                    <th scope="row" className="py-4 pr-4 text-left font-medium">
                      {framework.label}
                      {framework.proOnWebsite ? (
                        <span className="mt-1 block text-xs font-normal text-muted-foreground">
                          Pro, in the website&rsquo;s panel
                        </span>
                      ) : null}
                    </th>
                    {RUNGS.map((rung) => (
                      <td key={rung.key} className="py-4 pr-4 text-muted-foreground">
                        {SUPPORT_LABELS[framework[rung.key]]}
                      </td>
                    ))}
                    <td className="py-4 font-mono text-xs text-muted-foreground">
                      .{framework.extension}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="mt-8 space-y-4 text-sm">
            <div>
              <dt className="font-semibold">Converted</dt>
              <dd className="mt-1 text-muted-foreground">
                A real translation, tested. A single-file component with
                scoped styles, or a styled component with its keyframes
                hoisted — the artifact, in that framework.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Markup only</dt>
              <dd className="mt-1 text-muted-foreground">
                The block&rsquo;s rendered markup, wrapped as a component file
                that framework compiles. It is a presentational component, of
                the kind every codebase has dozens of — the layout, the
                classes and the accessible structure, without the React state
                and handlers. The file itself carries the same caveat in a
                comment at the top, because the file is what gets read six
                months later.
              </dd>
            </div>
          </dl>
        </section>

        <section
          className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6 lg:px-8"
          aria-labelledby="free-heading"
        >
          <h2 id="free-heading" className="text-2xl font-bold tracking-tight">
            Where the licence comes into it
          </h2>
          <div className="mt-5 space-y-4 text-body">
            <p>
              HTML, CSS and React are free on the website. Vue, Svelte,
              styled-components and Tailwind output are Pro — in{' '}
              <em>the website&rsquo;s export panel</em>, which is a product
              boundary rather than a lock, and it is worth being exact about
              which.
            </p>
            <p>
              The conversion runs in your browser, and{' '}
              <Link href="/docs/api" className="font-medium text-primary hover:underline">
                the public API
              </Link>{' '}
              and{' '}
              <Link href="/docs/cli" className="font-medium text-primary hover:underline">
                the CLI
              </Link>{' '}
              hand every format to any caller, with no key and no account, on
              purpose. What Pro sells is{' '}
              <Link href="/licence" className="font-medium text-primary hover:underline">
                the licence to ship it
              </Link>
              , not access to it. Astro markup is not gated anywhere.
            </p>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Browse the catalog
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/docs/cli"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-muted"
            >
              Install from the terminal
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-muted"
            >
              See what Pro covers
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
