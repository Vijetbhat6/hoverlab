'use client'

/**
 * "Save to collection" — the control that puts an artifact into one.
 *
 * Renders on every detail page, at every rung of the ladder, for everyone.
 * Signed-out and free visitors see it and can open it; what they get inside
 * is the reason to upgrade rather than a disabled button. A Pro feature the
 * free tier cannot see is a Pro feature nobody buys, and hiding it would
 * also mean the only place collections are mentioned is the pricing page.
 *
 * The popover is the whole interaction: pick existing collections with
 * checkboxes, or type a name and create one with this artifact already in
 * it. There is no separate "manage" step here — that lives on /collections.
 */

import * as React from 'react'
import Link from 'next/link'
import { Check, FolderPlus, Loader2, Lock, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useCollections, type AddableArtifact } from '@/hooks/use-collections'
import { track } from '@/lib/analytics'
import { COLLECTION_LIMITS } from '@/lib/collections'
import { cn } from '@/lib/utils'

export function AddToCollectionButton({
  artifact,
  className,
}: {
  artifact: AddableArtifact
  className?: string
}) {
  const {
    collections,
    loading,
    locked,
    signedOut,
    canCreate,
    create,
    addTo,
    removeFrom,
  } = useCollections()

  const [open, setOpen] = React.useState(false)
  const [draftName, setDraftName] = React.useState('')

  // Recomputed on every render rather than memoized: the list is at most
  // COLLECTION_LIMITS.perAccount long and this runs only while a popover is
  // open, so a memo would cost more to maintain than it saves.
  const memberOf = new Set(
    collections.filter((c) => c.items.some((i) => i.id === artifact.id)).map((c) => c.id),
  )

  const count = memberOf.size

  function toggle(collectionId: string, collectionName: string) {
    if (memberOf.has(collectionId)) {
      removeFrom(collectionId, artifact.id)
      toast.success(`Removed from ${collectionName}`)
      return
    }
    addTo(collectionId, artifact)
    toast.success(`Saved to ${collectionName}`)
  }

  function createWithArtifact(event: React.FormEvent) {
    event.preventDefault()
    const name = draftName.trim()
    if (!name) return

    const collection = create(name)
    if (!collection) {
      toast.error(`You can have up to ${COLLECTION_LIMITS.perAccount} collections.`)
      return
    }
    addTo(collection.id, artifact)
    setDraftName('')
    toast.success(`Created ${collection.name} and saved this to it`)
  }

  function onOpenChange(next: boolean) {
    setOpen(next)
    // Fired on open rather than on the upgrade click, so the funnel counts
    // people who *wanted* the feature, not only the ones who converted.
    if (next && (locked || signedOut)) {
      track('paywall_hit', { feature: 'collections', plan_required: 'pro' })
    }
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {/* Styled as a bare button rather than <Button>, to match the
            favorite / bundle / compare controls it sits beside on every
            detail page. Those are hand-styled for the same row; a shadcn
            Button here would be a half-pixel taller and a shade different. */}
        <button
          type="button"
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            count > 0
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground',
            className,
          )}
          aria-label={
            count > 0
              ? `In ${count} collection${count === 1 ? '' : 's'} — change`
              : 'Save to a collection'
          }
        >
          <FolderPlus aria-hidden className="h-4 w-4" />
          {count > 0 ? `In ${count}` : 'Collect'}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 p-0">
        <div className="border-b border-border/60 px-3 py-2.5">
          <div className="text-sm font-semibold">Save to collection</div>
          <p className="text-xs text-muted-foreground">
            Private lists of anything in the catalog.
          </p>
        </div>

        {signedOut || locked ? (
          <UpgradePrompt signedOut={signedOut} />
        ) : loading ? (
          <div className="flex items-center gap-2 px-3 py-6 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading your collections…
          </div>
        ) : (
          <>
            {collections.length > 0 ? (
              <ul className="max-h-56 overflow-y-auto py-1 [scrollbar-width:thin]">
                {collections.map((collection) => {
                  const member = memberOf.has(collection.id)
                  const full =
                    !member && collection.items.length >= COLLECTION_LIMITS.itemsPerCollection
                  return (
                    <li key={collection.id}>
                      <button
                        type="button"
                        onClick={() => !full && toggle(collection.id, collection.name)}
                        disabled={full}
                        aria-pressed={member}
                        className={cn(
                          'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors',
                          full
                            ? 'cursor-not-allowed text-muted-foreground/60'
                            : 'hover:bg-muted',
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                            member
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border',
                          )}
                        >
                          {member ? <Check className="h-3 w-3" /> : null}
                        </span>
                        <span className="flex-1 truncate">{collection.name}</span>
                        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                          {full ? 'full' : collection.items.length}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="px-3 py-4 text-xs text-muted-foreground">
                No collections yet. Name one below and this goes straight into it.
              </p>
            )}

            <form
              onSubmit={createWithArtifact}
              className="flex items-center gap-1.5 border-t border-border/60 p-2"
            >
              <Input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="New collection…"
                maxLength={COLLECTION_LIMITS.nameLength}
                aria-label="New collection name"
                className="h-8 text-sm"
              />
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                className="h-8 shrink-0 px-2"
                disabled={!draftName.trim() || !canCreate}
                aria-label="Create collection and save this to it"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </form>

            <div className="border-t border-border/60 px-3 py-2">
              <Link
                href="/collections"
                className="text-xs font-medium text-primary hover:underline"
              >
                Manage collections →
              </Link>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

/**
 * What a signed-out or free visitor sees inside the popover.
 *
 * Two different sentences, because they are two different asks. A signed-out
 * visitor may already own Pro and simply not be signed in; telling them to
 * buy would be wrong.
 */
function UpgradePrompt({ signedOut }: { signedOut: boolean }) {
  return (
    <div className="space-y-3 p-3">
      <div className="flex items-start gap-2">
        <Lock aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {signedOut
            ? 'Collections live on your account, so they follow you between machines. Sign in to use them.'
            : 'Collections are part of Pro — private, named lists of effects, blocks, pages and templates, synced to your account.'}
        </p>
      </div>
      {signedOut ? (
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" variant="outline" className="flex-1" asChild>
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      ) : (
        <Button size="sm" className="w-full" asChild>
          <Link href="/pricing">See Pro</Link>
        </Button>
      )}
    </div>
  )
}
