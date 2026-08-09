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
import { TemplateCard } from '@/components/templates/template-card'
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
  const totalRoutes = TEMPLATE_INDEX.reduce((n, t) => n + t.routes.length, 0)

  return (
    <div className="min-h-screen bg-background text-foreground">
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
            <span>
              {TEMPLATE_COUNT} templates · {totalRoutes} routes
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

        <div className="mt-16 space-y-16">
          {categories.map((category) => (
            <section key={category}>
              <h2 className="mb-6 text-2xl font-bold tracking-tight">{category}</h2>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {templatesInCategory(category).map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            </section>
          ))}
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
