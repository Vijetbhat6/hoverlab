/**
 * /c/<token> — a collection its owner has chosen to share.
 *
 * Read-only, public, and no account: anyone holding the link sees the
 * collection's name and the artifacts in it, drawn with the same tiles as
 * /browse and the hubs. Creating the link is Pro (`api/sync/collections/
 * share`); VIEWING one is not, because a link that asks the recipient to
 * sign in is not a link you can hand to a client.
 *
 * WHAT IS ON THIS PAGE, AND WHAT IS NOT
 *
 * The name, and each artifact by level and id. The artifact's name, category
 * and preview come from the PUBLIC CATALOG, not from the owner's document —
 * a label typed into a private collection cannot appear here. Never the
 * owner's name, email or account id; they are not read on this path at all
 * (`lib/collection-share.ts` builds the view from a whitelist, and its test
 * feeds it a hostile input to prove it). The collection's private
 * description is left out too.
 *
 * 404 FOR EVERYTHING ELSE
 *
 * A malformed token, an unknown one, a revoked one and a share whose
 * collection has been deleted all `notFound()`. Revocation is immediate: the
 * page is `force-dynamic` and reads the store on every request, so the next
 * view after "Stop sharing" is a 404. That is also why this is a function
 * call per view rather than a static page — it cannot be both revocable and
 * cached. A malformed token is rejected before any read.
 *
 * NOT INDEXED, NOT LISTED
 *
 * `noindex, nofollow` in metadata, disallowed in robots.ts (the same pair
 * /collections uses), and absent from sitemap.ts, which lists only what it
 * is told to. `referrer: no-referrer` keeps the URL — which is the secret —
 * out of the Referer header of anything this page links to.
 */

import * as React from 'react'
import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FolderOpen } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { ArtifactResultGrid, effectCssFor } from '@/components/artifact-result-grid'
import { BROWSE_INDEX, type BrowseHit } from '@/lib/browse'
import { ARTIFACT_LEVELS, LEVEL_LABEL, type ArtifactLevel } from '@/lib/artifact-types'
import { loadPublicShare } from '@/lib/firebase/collection-shares'
import { isAdminConfigured } from '@/lib/firebase/admin'
import { looksLikeShareToken } from '@/lib/collection-share'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface Props {
  params: Promise<{ token: string }>
}

/**
 * One read per request, shared between `generateMetadata` and the page.
 * React's `cache` de-duplicates within a single render, so a title costs no
 * second Firestore round trip.
 */
const load = cache(async (token: string) => {
  if (!looksLikeShareToken(token) || !isAdminConfigured()) return null
  try {
    return await loadPublicShare(token)
  } catch (err) {
    console.error('[c/token] could not load a shared collection:', err)
    return null
  }
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const share = await load(token)
  return {
    title: share ? `${share.name} — a Hoverlab collection` : 'Collection not found',
    // Deliberately no description and no Open Graph card: a shared link
    // pasted into a chat should not broadcast a private list's contents.
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
  }
}

const BY_KEY = new Map<string, BrowseHit>(
  BROWSE_INDEX.map((hit) => [`${hit.level}:${hit.id}`, hit]),
)

export default async function SharedCollectionPage({ params }: Props) {
  const { token } = await params
  const share = await load(token)
  if (!share) notFound()

  // Resolved against the public catalog. An artifact that has since left the
  // catalog is dropped rather than shown as a dead tile.
  const hits = share.items.flatMap((item) => {
    const hit = BY_KEY.get(`${item.level}:${item.id}`)
    return hit ? [hit] : []
  })

  const byLevel = ARTIFACT_LEVELS.map((level) => ({
    level,
    items: hits.filter((hit) => hit.level === level),
  })).filter((group): group is { level: ArtifactLevel; items: BrowseHit[] } => group.items.length > 0)

  // One <style> for every effect preview, plus its hover rules — the same
  // shared helper /browse and /ui use.
  const effectCss = effectCssFor(hits)

  return (
    <div className="relative min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <header className="mb-10 max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <FolderOpen className="h-3.5 w-3.5 text-primary" aria-hidden />
            Shared collection
          </div>
          <h1 className="type-page text-balance">{share.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {hits.length} {hits.length === 1 ? 'item' : 'items'} from the Hoverlab catalog,
            shared read-only by whoever made this list. Everything here is free to open
            and copy; the{' '}
            <Link href="/licence" className="font-medium text-primary underline underline-offset-2">
              licence
            </Link>{' '}
            says when shipping it needs Pro.
          </p>
        </header>

        {effectCss ? <style dangerouslySetInnerHTML={{ __html: effectCss }} /> : null}

        {byLevel.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 p-8 text-sm text-muted-foreground">
            Nothing in this collection is left in the catalog.
          </p>
        ) : (
          <div className="space-y-12">
            {byLevel.map(({ level, items }) => (
              <section key={level} aria-labelledby={`shared-${level}`}>
                <h2 id={`shared-${level}`} className="mb-4 text-lg font-semibold">
                  {LEVEL_LABEL[level].many}{' '}
                  <span className="text-sm font-normal text-muted-foreground">
                    {items.length}
                  </span>
                </h2>
                <ArtifactResultGrid level={level} items={items} />
              </section>
            ))}
          </div>
        )}

        <p className="mt-14 text-sm text-muted-foreground">
          <Link href="/library" className="font-medium text-primary underline underline-offset-2">
            Browse the whole catalog
          </Link>
          , free, no account.
        </p>
      </main>
    </div>
  )
}
