import Link from 'next/link'
import { ArrowLeft, Search, Sparkles, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Custom 404 page shown when a user hits an unknown URL
 * (e.g. /effect/some-old-slug that no longer exists).
 *
 * Uses the standard app shell so the header / theme still render.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-lg shadow-primary/30">
        <Wand2 className="h-8 w-8" />
      </div>

      <p className="font-mono text-sm font-semibold uppercase tracking-wider text-primary">
        404
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        This effect vanished.
      </h1>
      <p className="mt-3 max-w-md text-pretty text-sm text-muted-foreground sm:text-base">
        The page you're looking for doesn't exist — it may have been renamed,
        removed, or the URL is mistyped. The library still has plenty more
        to explore.
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/library">
            <ArrowLeft className="h-4 w-4" /> Back to library
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <Link href="/library?filter=Featured">
            <Sparkles className="h-4 w-4" /> Browse featured
          </Link>
        </Button>
      </div>

      <div className="mt-12 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Search className="h-3.5 w-3.5" />
        <span>Tip: use the search bar on the home page to find effects by name, category, or tag.</span>
      </div>
    </div>
  )
}
