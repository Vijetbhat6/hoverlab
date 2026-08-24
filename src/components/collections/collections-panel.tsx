'use client'

/**
 * /collections — create, rename, empty and delete private collections.
 *
 * One flat page rather than a list route plus a detail route. A collection
 * is a name and a short list of links; giving it its own URL would add a
 * navigation step to reach twelve rows, and the thing people actually do
 * here — glance at what is in each one — is what a page of open sections
 * already shows.
 *
 * Everything is optimistic. The hook writes locally, re-renders, and pushes
 * on a debounce; a failed push retries on the next change rather than
 * rolling the UI back under the user's cursor.
 */

import * as React from 'react'
import Link from 'next/link'
import {
  FolderOpen,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCollections } from '@/hooks/use-collections'
import { COLLECTION_LIMITS, type Collection } from '@/lib/collections'
import { artifactHref, LEVEL_LABEL, levelOf } from '@/lib/artifact-types'
import { cn } from '@/lib/utils'

export function CollectionsPanel() {
  const {
    collections,
    loading,
    locked,
    signedOut,
    canCreate,
    create,
    rename,
    remove,
    removeFrom,
  } = useCollections()

  const [draft, setDraft] = React.useState('')

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your collections…
      </div>
    )
  }

  if (signedOut || locked) {
    return <LockedState signedOut={signedOut} />
  }

  function onCreate(event: React.FormEvent) {
    event.preventDefault()
    const collection = create(draft)
    if (!collection) {
      toast.error(
        draft.trim()
          ? `You can have up to ${COLLECTION_LIMITS.perAccount} collections.`
          : 'Give the collection a name first.',
      )
      return
    }
    setDraft('')
    toast.success(`Created ${collection.name}`)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onCreate} className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Name a collection — “Client · Northwind”, “Dark dashboard kit”…"
          maxLength={COLLECTION_LIMITS.nameLength}
          aria-label="New collection name"
        />
        <Button type="submit" disabled={!draft.trim() || !canCreate} className="shrink-0 gap-1.5">
          <Plus className="h-4 w-4" />
          Create
        </Button>
      </form>

      {collections.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Nothing collected yet</CardTitle>
            <CardDescription>
              Open any effect, block, page or template and use{' '}
              <span className="font-medium text-foreground">Save to…</span> to
              put it in a collection. They stay private to your account and
              follow you between machines.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/library">Browse the catalog</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {collections.map((collection) => (
            <li key={collection.id}>
              <CollectionCard
                collection={collection}
                onRename={rename}
                onDelete={remove}
                onRemoveItem={removeFrom}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CollectionCard({
  collection,
  onRename,
  onDelete,
  onRemoveItem,
}: {
  collection: Collection
  onRename: (id: string, name: string, description?: string) => void
  onDelete: (id: string) => void
  onRemoveItem: (collectionId: string, artifactId: string) => void
}) {
  const [editing, setEditing] = React.useState(false)
  const [name, setName] = React.useState(collection.name)

  /*
   * Delete asks once, inline, rather than opening a dialog.
   *
   * A collection is a list of links — deleting one loses the curation, not
   * the artifacts, and they are all still in the catalog. A modal would be
   * heavier than the mistake it prevents; a second click is enough.
   */
  const [confirming, setConfirming] = React.useState(false)
  React.useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), 4000)
    return () => clearTimeout(timer)
  }, [confirming])

  function commitRename(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setName(collection.name)
      setEditing(false)
      return
    }
    onRename(collection.id, trimmed, collection.description)
    setEditing(false)
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          {editing ? (
            <form onSubmit={commitRename} className="flex flex-1 gap-2">
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={commitRename}
                maxLength={COLLECTION_LIMITS.nameLength}
                aria-label={`Rename ${collection.name}`}
                className="h-8"
              />
              <Button type="submit" size="sm" variant="secondary" className="h-8">
                Save
              </Button>
            </form>
          ) : (
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-lg">{collection.name}</CardTitle>
              <CardDescription>
                {collection.items.length}{' '}
                {collection.items.length === 1 ? 'item' : 'items'}
                {collection.description ? ` · ${collection.description}` : ''}
              </CardDescription>
            </div>
          )}

          <div className="flex shrink-0 items-center gap-1">
            {!editing ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setName(collection.name)
                  setEditing(true)
                }}
                aria-label={`Rename ${collection.name}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            ) : null}
            <Button
              variant={confirming ? 'destructive' : 'ghost'}
              size={confirming ? 'sm' : 'icon'}
              className={cn('h-8', confirming ? 'px-2 text-xs' : 'w-8')}
              onClick={() => {
                if (!confirming) {
                  setConfirming(true)
                  return
                }
                onDelete(collection.id)
                toast.success(`Deleted ${collection.name}`)
              }}
              aria-label={
                confirming
                  ? `Confirm deleting ${collection.name}`
                  : `Delete ${collection.name}`
              }
            >
              {confirming ? 'Really delete?' : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {collection.items.length > 0 ? (
        <CardContent>
          <ul className="flex flex-wrap gap-2">
            {collection.items.map((item) => {
              const level = levelOf(item)
              return (
                <li
                  key={item.id}
                  className="group flex items-center gap-1 rounded-full border border-border/60 bg-background/60 py-1 pl-3 pr-1 text-xs transition-colors hover:border-primary/40"
                >
                  <Link href={artifactHref({ id: item.id, level })} className="truncate">
                    <span className="font-medium">{item.name}</span>
                    <span className="ml-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {LEVEL_LABEL[level].one}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(collection.id, item.id)}
                    aria-label={`Remove ${item.name} from ${collection.name}`}
                    className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              )
            })}
          </ul>
        </CardContent>
      ) : (
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Empty. Use <span className="font-medium text-foreground">Save to…</span>{' '}
            on any detail page to fill it.
          </p>
        </CardContent>
      )}
    </Card>
  )
}

/** Signed out, or signed in without Pro. Two different asks — see below. */
function LockedState({ signedOut }: { signedOut: boolean }) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          {signedOut ? (
            <FolderOpen className="h-5 w-5 text-primary" />
          ) : (
            <Lock className="h-5 w-5 text-primary" />
          )}
        </div>
        <CardTitle>
          {signedOut ? 'Sign in to use collections' : 'Collections are part of Pro'}
        </CardTitle>
        <CardDescription className="max-w-prose">
          {signedOut
            ? 'Collections are stored on your account rather than in this browser, so they survive a new laptop and a cleared cache. Sign in — if you already own Pro, they will be waiting.'
            : 'Private, named lists of anything in the catalog — effects, blocks, pages and templates together. They live on your account and sync across every machine you sign in on. Pro is a one-time purchase and includes them forever.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {signedOut ? (
          <>
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/signup">Create an account</Link>
            </Button>
          </>
        ) : (
          <>
            <Button asChild>
              <Link href="/#pricing">See what Pro includes</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/license">Read the licence</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
