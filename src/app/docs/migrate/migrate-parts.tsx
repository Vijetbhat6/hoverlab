import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'

import { C } from '@/components/docs/docs-parts'
import { JsonLd } from '@/components/json-ld'
import { breadcrumbLd } from '@/lib/structured-data'
import { absoluteUrl } from '@/lib/site'
import {
  MIGRATE_INDEX,
  MIGRATION_GUIDES,
  guidePath,
  type MigrationGuide,
} from '@/lib/migration/guides'

/**
 * The few things every migration page repeats. Not a route — the file has
 * no `page`, so Next ignores it — and kept beside the pages rather than in
 * `components/docs`, which belongs to every docs page and is not the place
 * to grow a section-specific helper.
 */

/**
 * A CLI flag, in prose.
 *
 * The same look as <C>, and a separate component for a reason that has
 * nothing to do with style: `migration.test.ts` scans these files for `<F>`
 * and checks each flag against the CLI's source. A flag in <C> could equally
 * be a CSS variable (`--primary`), so it cannot be told from one; a flag in
 * <F> has said what it is.
 */
export function F({ children }: { children: string }) {
  return <C>{children}</C>
}

/**
 * Text with `code` spans, for strings that live in data files and use
 * backticks the way markdown does. `lib/compare.ts` writes the update
 * ledger that way, and rendering it here rather than retyping it is what
 * keeps the guide, /pricing and /compare saying the same sentence.
 */
export function WithCode({ text }: { text: string }) {
  return (
    <>
      {text.split('`').map((part, i) =>
        i % 2 === 1 ? <C key={i}>{part}</C> : <span key={i}>{part}</span>,
      )}
    </>
  )
}

/** Metadata for a page in this section, in the shape the sibling docs pages use. */
export function migrateMetadata(input: {
  title: string
  description: string
  /** The page's own canonical path. Named for what it is so `check:canonical`, which greps each page.tsx for the word, finds it at the call site. */
  canonical: string
  keywords?: string[]
}): Metadata {
  const title = `${input.title} — Hoverlab Docs`
  return {
    title,
    description: input.description,
    ...(input.keywords ? { keywords: input.keywords } : {}),
    alternates: { canonical: input.canonical },
    openGraph: {
      url: absoluteUrl(input.canonical),
      title,
      description: input.description,
      type: 'article',
      siteName: 'Hoverlab',
    },
    twitter: { card: 'summary_large_image', title, description: input.description },
  }
}

/**
 * Home › Docs › Migrate › (guide), as JSON-LD.
 *
 * Absolute URLs come from `breadcrumbLd`. The last crumb carries no path:
 * it is the page itself, which is how Google wants a trailing crumb.
 */
export function MigrateBreadcrumbs({ guide }: { guide?: MigrationGuide }) {
  return (
    <JsonLd
      data={breadcrumbLd([
        { name: 'Home', path: '/' },
        { name: 'Docs', path: '/docs' },
        guide ? { name: 'Migrate', path: MIGRATE_INDEX.path } : { name: 'Migrate' },
        ...(guide ? [{ name: guide.title }] : []),
      ])}
    />
  )
}

/**
 * The other guides, at the foot of one.
 *
 * Underlined at rest: these links sit inside a sentence-sized block of text,
 * where colour alone cannot be the only mark (WCAG 1.4.1).
 */
export function OtherGuides({ current }: { current: MigrationGuide['slug'] }) {
  const others = MIGRATION_GUIDES.filter((guide) => guide.slug !== current)
  return (
    <nav aria-label="Other migration guides" className="mt-16 border-t border-border/60 pt-6">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Also in this section
      </p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {others.map((guide) => (
          <li key={guide.slug}>
            <Link
              href={guidePath(guide.slug)}
              className="group flex h-full items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-4 transition-colors hover:border-border hover:bg-card"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{guide.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{guide.short}</span>
              </span>
              <ArrowRight
                aria-hidden
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
