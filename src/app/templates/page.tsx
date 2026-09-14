/**
 * /templates — the top of the ladder.
 *
 * Effects, blocks and pages all leave the visitor with assembly work. A
 * template does not: it is a project that runs. This is the page for the
 * person who wants to start from something rather than build up to it.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Rocket, LayoutTemplate, Blocks } from 'lucide-react'
import { NewThisWeek } from '@/components/new-this-week'
import { TemplateCard } from '@/components/templates/template-card'
import { SortableArtifactGrid } from '@/components/sortable-artifact-grid'
import { addedAt } from '@/lib/recency'
import { TierDefinition } from '@/components/tier-definition'
import {
  TEMPLATE_COUNT,
  TEMPLATE_INDEX,
  populatedTemplateCategories,
  templatesInCategory,
} from '@/lib/templates/template-index'
import { PAGE_COUNT } from '@/lib/pages/page-index'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { absoluteUrl } from '@/lib/site'
import { JsonLd } from '@/components/json-ld'
import { breadcrumbLd, itemListLd } from '@/lib/structured-data'

const TITLE = `${TEMPLATE_COUNT} Next.js Starter Templates — Hoverlab`
const DESCRIPTION =
  'Complete projects that run: SaaS starter, admin panel and marketing site. Routing, theme tokens and every screen included — one runtime dependency.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'nextjs template',
    'saas starter',
    'admin panel template',
    'react starter kit',
    'tailwind template',
    'marketing site template',
  ],
  alternates: { canonical: '/templates' },
  openGraph: {
    url: absoluteUrl('/templates'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function TemplatesHubPage() {
  const categories = populatedTemplateCategories()
  /* Flat, in category order, so a sort has one list to rank. */
  const allTemplates = categories.flatMap((category) => templatesInCategory(category))

  /*
    PAGE DEPTH, the way Preline publishes it ("22 templates, 207 pages").

    It is a different number from PAGE_COUNT and both belong on this page.
    PAGE_COUNT is how many distinct screens the catalog holds; this is how
    many screens you get *across the templates*, counting a screen once per
    template that ships it. A reader deciding between libraries is asking
    the second question — "if I buy this, how many built screens land in my
    project" — and the first number understates it badly, because the
    templates deliberately share screens.

    Summed from `composedOf` rather than `routes` so a template that points
    two routes at one page (a listing and its detail sharing a shell) does
    not count that page twice within its own row.
  */
  const totalTemplatePages = TEMPLATE_INDEX.reduce((n, t) => n + t.composedOf.length, 0)

  /*
    See /blocks. Templates are few enough to list individually, which is
    the one tier where that is true and also the tier where it matters
    most: "nextjs saas starter" is a query with a buyer behind it.
  */
  const listLd = itemListLd(
    'Templates',
    '/templates',
    TEMPLATE_INDEX.map((template) => ({
      name: template.name,
      path: `/template/${template.id}`,
    })),
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={listLd} />
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Templates' }])} />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <TierDefinition tier="template" />

        <header className="mx-auto mt-10 max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Rocket aria-hidden className="h-3.5 w-3.5" />
            Templates
          </span>

          <h1 className="type-hub mt-5">
            Projects that already run
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-pretty text-body">
            Not a folder of components — a project. Routing, root layout,
            theme tokens and every screen, arranged so{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
              npm run dev
            </code>{' '}
            gives you something to look at. One runtime dependency.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            {/*
                "32 templates, 181 pages" — the depth claim, the way Preline
                makes it.

                `totalRoutes` is deliberately NOT printed beside it. Today
                every template maps one route to one page, so the two
                numbers are identical and rendering both reads as a mistake
                rather than as two facts. The routes figure is still on each
                card, where it is per-template and means something.
            */}
            <span>
              <strong className="font-semibold text-foreground">
                {TEMPLATE_COUNT} templates
              </strong>
              , {totalTemplatePages} pages
            </span>
            <span aria-hidden>·</span>
            <Link
              href="/pages"
              className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
            >
              <LayoutTemplate aria-hidden className="h-4 w-4" />
              {PAGE_COUNT} pages
            </Link>
            <span aria-hidden>·</span>
            <Link
              href="/blocks"
              className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
            >
              <Blocks aria-hidden className="h-4 w-4" />
              {BLOCK_COUNT} blocks
              <ArrowRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        {/* What changed since last time — see the component for the two
            states and why both print dates. */}
        <NewThisWeek level="template" />

        {/* The cards are rendered here and reordered in the browser — see
            `SortableArtifactGrid` for why that is not a client grid. */}
        <div className="mt-16">
          <SortableArtifactGrid
            noun="templates"
            className="grid grid-cols-1 gap-6 lg:grid-cols-2"
            items={allTemplates.map((template) => ({
              id: template.id,
              added: addedAt('template', template.id),
              node: <TemplateCard key={template.id} template={template} />,
            }))}
            groups={categories.map((category) => ({
              key: category,
              ids: templatesInCategory(category).map((t) => t.id),
              heading: (
                <h2 key={category} className="mb-6 text-2xl font-bold tracking-tight">
                  {category}
                </h2>
              ),
            }))}
          />
        </div>

        <section className="mt-20 rounded-2xl border border-border/60 bg-card/40 p-8 text-center">
          <h2 className="text-lg font-bold tracking-tight">
            That is the whole ladder
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            A template is pages, a page is blocks, a block is markup you can
            read. Start at whichever rung matches how much you want to build
            yourself — and drill down from any of them.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
            {[
              { href: '/library', label: 'Effects' },
              { href: '/blocks', label: 'Blocks' },
              { href: '/pages', label: 'Pages' },
            ].map((rung) => (
              <Link
                key={rung.href}
                href={rung.href}
                className="rounded-full border border-border/60 bg-background px-3.5 py-1.5 font-medium transition-all hover:-translate-y-0.5 hover:border-primary/40"
              >
                {rung.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
