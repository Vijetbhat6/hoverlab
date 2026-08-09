import Link from 'next/link'
import { ArrowLeft, Search, Sparkles, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/site-header'

/**
 * Custom 404 page shown when a user hits an unknown URL
 * (e.g. /effect/some-old-slug that no longer exists).
 *
 * The header is mounted here explicitly. This file used to claim it "uses
 * the standard app shell so the header still renders", which was never
 * true — the root layout has no header, so a mistyped URL produced a page
 * with no navigation on it at all. That is the one page where a visitor is
 * lost by definition, and it was the one page with nothing to climb back
 * up. It offered two links, both to the effects rung.
 */
export default function NotFound() {
  return (
    <>
      <SiteHeader />

      <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-lg shadow-primary/30">
          <Wand2 className="h-8 w-8" />
        </div>

        <p className="font-mono text-sm font-semibold uppercase tracking-wider text-primary">
          404
        </p>
        <h1 className="type-page mt-2">This page vanished.</h1>
        <p className="mt-3 max-w-md text-pretty text-sm text-body sm:text-base">
          The page you&apos;re looking for doesn&apos;t exist — it may have been
          renamed, removed, or the URL is mistyped. Everything else is still
          one click up in the header.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/browse">
              <Search className="h-4 w-4" /> Search the whole catalog
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link href="/library">
              <ArrowLeft className="h-4 w-4" /> Back to the effects library
            </Link>
          </Button>
        </div>

        <div className="mt-12 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          <span>
            Tip: press <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">⌘K</kbd> anywhere to search effects, blocks, pages and templates at once.
          </span>
        </div>
      </div>
    </>
  )
}
