/**
 * /ui — the index of every intent hub.
 *
 * Two jobs, and the second is the one that matters. The first is to be a
 * browsable directory for a person who does not know what the catalog is
 * called internally. The second is to be the page that makes the other
 * eighty reachable: a crawler that finds any one of them finds this, and
 * from here finds all of them, which is what turns a set of landing pages
 * into a linked section rather than eighty orphans in a sitemap.
 *
 * Counts come from resolving each hub at build time. That is 80 filter runs
 * over ~1,600 artifacts on one prerendered page — `resolveHub` memoizes, so
 * the hub pages themselves reuse the same results.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { Compass, Layers } from 'lucide-react'

import { JsonLd } from '@/components/json-ld'
import { HUBS, HUB_GROUPS } from '@/lib/hubs/catalog'
import { resolveHub } from '@/lib/hubs/resolve'
import { BROWSE_TOTAL } from '@/lib/browse'
import { breadcrumbLd, itemListLd } from '@/lib/structured-data'
import { absoluteUrl } from '@/lib/site'

const TITLE = `${HUBS.length} UI collections — components by what you are building — Hoverlab`
const DESCRIPTION =
  'Browse the catalog the way you would search for it: glassmorphism cards, tailwind loaders, react pricing tables, admin dashboard templates. Each collection is a filtered grid with the notes that go with it.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'ui components',
    'css effects',
    'tailwind components',
    'react ui collections',
    'component gallery',
  ],
  alternates: { canonical: '/ui' },
  openGraph: {
    url: absoluteUrl('/ui'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function UiHubIndexPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd
        data={itemListLd(
          'UI collections',
          '/ui',
          HUBS.map((hub) => ({ name: hub.title, path: `/ui/${hub.slug}` })),
          HUBS.length,
          HUBS.length,
        )}
      />
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'UI' }])} />

      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Compass aria-hidden className="h-3.5 w-3.5" />
            {HUBS.length} collections
          </span>
          <h1 className="type-hub mt-5">Find it by what you are building</h1>
          <p className="mt-4 text-pretty text-body">
            The catalog is organised by what a thing <em>is</em> — effect, primitive, block, page,
            template. This page organises it by what you would type: a glassmorphism card, a
            tailwind loader, a react pricing table, an admin dashboard. Every collection below is a
            live filter over the same {BROWSE_TOTAL.toLocaleString('en-US')} components, with the
            notes and caveats that belong to that particular problem.
          </p>
        </header>

        <div className="mt-14 space-y-16">
          {HUB_GROUPS.map((group) => (
            <section key={group.id} aria-labelledby={`group-${group.id}`}>
              <div className="border-b border-border/60 pb-3">
                <h2 id={`group-${group.id}`} className="text-xl font-bold tracking-tight">
                  {group.title}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {group.hubs.length}
                  </span>
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{group.blurb}</p>
              </div>

              <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.hubs.map((hub) => {
                  const { total } = resolveHub(hub)
                  return (
                    <li key={hub.slug}>
                      <Link
                        href={`/ui/${hub.slug}`}
                        prefetch={false}
                        className="group flex h-full flex-col rounded-xl border border-border/60 bg-card/60 p-4 transition-colors hover:border-primary/40 hover:bg-card"
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-semibold group-hover:text-primary">
                            {hub.title}
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                            <Layers aria-hidden className="h-3 w-3" />
                            {total.toLocaleString('en-US')}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm text-muted-foreground">{hub.tagline}</p>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-16 border-t border-border/60 pt-8 text-center text-sm text-muted-foreground">
          Not here?{' '}
          <Link href="/browse" prefetch={false} className="font-semibold text-primary hover:underline">
            Search the whole catalog
          </Link>{' '}
          — these collections are saved queries over it, not a separate library.
        </p>
      </div>
    </div>
  )
}
