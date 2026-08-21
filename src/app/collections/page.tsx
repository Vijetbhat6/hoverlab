/**
 * /collections — private, named lists of anything in the catalog.
 *
 * `noindex`, and gated in proxy.ts alongside /account: there is nothing here
 * for a crawler and nothing here for a signed-out visitor. The pitch for the
 * feature lives on the pricing section and inside the "Save to…" popover,
 * which every visitor can open — this page is the tool, not the shop window.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { FolderOpen } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { CollectionsPanel } from '@/components/collections/collections-panel'

export const metadata: Metadata = {
  title: 'Collections — Hoverlab',
  description: 'Your private collections of effects, blocks, pages and templates.',
  robots: { index: false, follow: false },
}

export default function CollectionsPage() {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -top-20 right-1/4 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl" />
      </div>

      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 pb-16 pt-12 sm:px-6">
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <FolderOpen className="h-3.5 w-3.5 text-primary" aria-hidden />
            Pro
          </div>
          <h1 className="type-page">Collections</h1>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            Private lists that hold any rung of the ladder at once — an effect,
            the block it lives in and the template you shipped it from, filed
            together. Stored on your account, not this browser, so they survive
            a new machine. See what else Pro includes on the{' '}
            <Link href="/license" className="font-medium text-primary hover:underline">
              licence page
            </Link>
            .
          </p>
        </header>

        <CollectionsPanel />
      </main>
    </div>
  )
}
