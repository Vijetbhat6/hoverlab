/**
 * /kits/[slug] — one curated set, in full.
 *
 * The product page for a kit. Everything on it is server-rendered except
 * the bundle button, because everything on it is a list of real catalog
 * entries and their names, and the crawler that lands here from "react
 * storefront ui kit" should read the whole inventory rather than a shell.
 *
 * The install command is deliberately the plain `npx hoverlab add` with
 * the ids spelled out rather than a `kit:` shorthand. The shorthand would
 * be nicer to type and would also be a version of this catalog living
 * inside a separately-published CLI — the ids here would have to reach a
 * package that ships on its own schedule, and a `kit:` that resolved to
 * last month's contents is worse than a long line. The long line is
 * copy-pasted, not typed, and it works against the CLI that is published
 * today.
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, Boxes, Package, ShieldCheck, Terminal } from 'lucide-react'

import { JsonLd } from '@/components/json-ld'
import { AddKitToBundle } from '@/components/kits/add-kit-to-bundle'
import { CopyableCommand } from '@/components/copyable-command'
import { KITS, getKit } from '@/lib/kits/catalog'
import { kitGroups, kitItems, kitSize, kitSummary } from '@/lib/kits/resolve'
import { PLANS, formatPrice } from '@/lib/billing/plans'
import { breadcrumbLd, itemListLd } from '@/lib/structured-data'
import { absoluteUrl } from '@/lib/site'

export function generateStaticParams() {
  return KITS.map((kit) => ({ slug: kit.slug }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const kit = getKit(slug)
  if (!kit) return { title: 'Kit not found — Hoverlab' }

  const title = `${kit.name} — ${kitSize(kit)} pieces — Hoverlab`

  return {
    title,
    description: kit.description,
    keywords: [kit.name.toLowerCase(), 'ui kit', 'react components', 'tailwind blocks'],
    alternates: { canonical: `/kits/${kit.slug}` },
    openGraph: {
      url: absoluteUrl(`/kits/${kit.slug}`),
      title,
      description: kit.description,
      type: 'website',
      siteName: 'Hoverlab',
    },
    twitter: { card: 'summary_large_image', title, description: kit.description },
  }
}

export default async function KitPage({ params }: PageProps) {
  const { slug } = await params
  const kit = getKit(slug)
  if (!kit) notFound()

  const groups = kitGroups(kit)
  const items = kitItems(kit)
  const command = `npx hoverlab add ${items.map((i) => i.id).join(' ')}`

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/*
        A CollectionPage rather than a SoftwareSourceCode: a kit is not
        itself source, it is a named selection of things that are. The
        itemListLd cap is generous enough here that every piece is listed —
        these lists are tens of items, not hundreds.
      */}
      <JsonLd
        data={itemListLd(
          kit.name,
          `/kits/${kit.slug}`,
          items.map((item) => ({ name: item.name, path: item.href })),
          items.length,
          items.length,
        )}
      />
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Kits', path: '/kits' },
          { name: kit.name },
        ])}
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/kits"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          All kits
        </Link>

        <header className="mt-6 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Boxes aria-hidden className="h-3.5 w-3.5" />
            Kit
          </span>
          <h1 className="type-hub mt-5">{kit.name}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{kit.tagline}</p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {kit.description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <Package aria-hidden className="h-4 w-4 text-primary" />
              {kitSize(kit)} pieces
            </span>
            <span>{kitSummary(kit)}</span>
          </div>
        </header>

        {/* ---- Take it ------------------------------------------------ */}
        <section
          aria-label="Install this kit"
          className="mt-8 rounded-xl border border-border/60 bg-card/50 p-5"
        >
          {/*
            Stacked rather than side-by-side. The button carries a line of
            its own explaining the free cap, which makes the island as wide
            as the column — a two-column arrangement wrapped into this same
            order anyway, and an accidental stack is worse than an intended
            one.
          */}
          <div>
            <h2 className="text-sm font-semibold">Take the whole kit</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Add every piece to your bundle and export it as one archive, or run
              the command below to write all {items.length} into your project.
            </p>
            <div className="mt-4">
              <AddKitToBundle kitSlug={kit.slug} kitName={kit.name} items={items} />
            </div>
          </div>

          <div className="mt-4">
            <CopyableCommand command={command} label="the install command" />
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Terminal aria-hidden className="h-3.5 w-3.5" />
              Every id spelled out, so it resolves against the CLI you already
              have rather than a shorthand that has to know this list.
            </p>
          </div>

          <p className="mt-4 flex items-start gap-1.5 border-t border-border/60 pt-4 text-sm text-muted-foreground">
            <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              Free to read, copy and install for personal and non-commercial
              work. Shipping it in client work or a paid product needs{' '}
              <Link href="/pricing" className="font-medium text-primary hover:underline">
                Pro ({formatPrice(PLANS.pro.priceCents)} once)
              </Link>
              . The{' '}
              <Link
                href="/licence"
                className="underline underline-offset-2 hover:text-foreground"
              >
                licence
              </Link>{' '}
              is the same for a kit as for any single piece in it — bundling
              things together does not change what you may do with them.
            </span>
          </p>
        </section>

        {/* ---- What is in it ------------------------------------------ */}
        {groups.map((group) => (
          <section key={group.level} className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
              <span className="ml-2 font-normal normal-case tracking-normal">
                {group.items.length}
              </span>
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {group.items.map((item) => (
                <li key={`${item.level}-${item.id}`}>
                  <Link
                    href={item.href}
                    prefetch={false}
                    className="group flex h-full flex-col rounded-xl border border-border/60 bg-card/50 p-4 transition-colors hover:border-primary/40 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold group-hover:text-primary">
                        {item.name}
                      </span>
                      <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {item.category}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {item.description}
                    </p>
                    <code className="mt-2 font-mono text-[10px] text-muted-foreground/70">
                      {item.id}
                    </code>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="mt-12 border-t border-border/60 pt-6 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{kit.audience}</span> If
          you would rather be walked through the order than handed the list, the{' '}
          <Link href="/paths" className="font-medium text-primary hover:underline">
            guided paths
          </Link>{' '}
          cover the same ground one step at a time.
        </p>
      </div>
    </div>
  )
}
