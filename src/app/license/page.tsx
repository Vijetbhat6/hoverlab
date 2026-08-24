/**
 * /license — the terms, in public.
 *
 * Indexed and linked from the pricing section on purpose. The commercial
 * licence is the one thing Hoverlab sells that copying the code does not
 * get you, and until this page existed it was a bullet point on a pricing
 * card: sold, never shown. A buyer's legal team cannot approve a bullet
 * point, and a buyer cannot forward one.
 *
 * Written as prose rather than as a clause-numbered agreement. The terms
 * are short enough to read in a minute, and a page that reads like a EULA
 * gets skimmed by exactly the people it needs to convince.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ScrollText } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { LicenseCertificate, TermList } from '@/components/license/license-certificate'
import { LICENSES } from '@/lib/license'
import { absoluteUrl } from '@/lib/site'

const TITLE = 'Licence — what you may ship, and what it costs — Hoverlab'
const DESCRIPTION =
  'Every effect, block, page and template is free to read, copy and modify. The free licence covers personal and non-commercial work; the commercial licence, included with Pro, Studio and Team, covers client work and paid products. Both in full, in plain English.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'ui component licence',
    'commercial use css effects',
    'tailwind components licence',
    'can I use these in client work',
  ],
  alternates: { canonical: '/license' },
  openGraph: {
    url: absoluteUrl('/license'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function LicensePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-12 sm:px-6">
        <header className="mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <ScrollText className="h-3.5 w-3.5 text-primary" aria-hidden />
            Licence
          </span>
          <h1 className="type-page mt-3">What you may ship</h1>
          <div className="mt-4 space-y-3 text-body text-muted-foreground">
            <p>
              Every artifact in this catalog is readable, copyable and free to
              modify. The source is in the page, the{' '}
              <Link href="/docs/api" className="font-medium text-primary hover:underline">
                API
              </Link>{' '}
              is public and takes no credentials, and{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                npx hoverlab add
              </code>{' '}
              works without an account. None of that is going to change.
            </p>
            <p>
              What Pro, Studio and Team sell is not access — it is permission.
              If you are being paid for the work, or shipping it under a company
              name, someone will eventually ask where the code came from and
              whether you were allowed to use it. This page is the answer, and
              your certificate below is the copy you forward.
            </p>
          </div>
        </header>

        {/* The reader's own licence first — most people arrive asking about
            themselves, not about the general case. */}
        <LicenseCertificate className="mb-10" />

        <div className="space-y-8">
          {LICENSES.map((terms) => (
            <section
              key={terms.kind}
              className="rounded-2xl border border-border/60 bg-card/40 p-6"
            >
              <h2 className="text-lg font-semibold tracking-tight">{terms.name}</h2>
              <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                {terms.summary}
              </p>
              <div className="mt-5 space-y-5">
                <TermList heading="Grants" items={terms.grants} tone="grant" />
                <TermList heading="Does not cover" items={terms.restrictions} tone="limit" />
              </div>
            </section>
          ))}
        </div>

        <section className="mt-10 space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-6">
          <h2 className="text-lg font-semibold tracking-tight">Questions this raises</h2>

          <Faq q="If the code is free to copy, why would I buy a licence?">
            Because copying the file does not grant you the right to sell what
            you build with it, and nothing you can do on your own end produces
            that right. If your work is personal, the free licence already
            covers you and you should not buy anything. If a client, an
            employer or an acquirer will ever ask, the commercial licence is
            what you hand them.
          </Faq>

          <Faq q="What happens if I let a Team subscription lapse?">
            Anything you have already shipped stays licensed permanently. The
            grant is irrevocable for delivered work — that is the point of a
            licence rather than a subscription to a folder. What ends is the
            right to use the catalog for new commercial work.
          </Faq>

          <Faq q="Is there a licence key to enter?">
            No. Nothing in the product checks a licence, and the id on your
            certificate unlocks nothing — it identifies your purchase so you
            have something to quote. A key that implied enforcement we do not
            perform would be a worse product and a worse promise.
          </Faq>

          <Faq q="Can I use these in something I sell as a template?">
            Not if the artifacts are substantially what is being sold. Build a
            product that uses them, freely. Repackaging the catalog as a UI kit,
            theme or component library is the one thing neither licence allows.
          </Faq>
        </section>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/#pricing"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            See the plans
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/library"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Browse the catalog
          </Link>
        </div>
      </main>
    </div>
  )
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{q}</h3>
      <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  )
}
