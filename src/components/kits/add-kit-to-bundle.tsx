'use client'

/**
 * <AddKitToBundle> — the whole kit, into the bundle, in one press.
 *
 * The one interactive thing on a kit page, and the reason a kit is a
 * product rather than a list of links. Everything else on that page is
 * static server-rendered HTML.
 *
 * ── Why it says what it says about the cap ──
 *
 * The free bundle holds ten entries and every kit is larger than that
 * (LIMITS.bundleSize in billing/entitlements.ts). That collision is the
 * honest shape of the feature, not a trick, and it gets stated *before*
 * the press rather than discovered as a failure after it: the button knows
 * how many pieces it is about to add, and the line under it says what
 * happens on a free account. Someone who then presses it and hits the cap
 * has not been surprised.
 *
 * The press itself is never blocked here. Enforcement belongs to the
 * bundle store and the export path, which is where it can actually be
 * enforced — a button that disables itself on a guess would be wrong the
 * moment the reader signs in, and this component deliberately does not
 * read entitlements to avoid making that guess.
 *
 * ── Idempotence ──
 *
 * `add` replaces an existing entry rather than duplicating it, so pressing
 * twice is the same as pressing once. The toast still reports what changed,
 * counted before the writes rather than after, so a second press reads
 * "already in your bundle" instead of claiming to have added nothing.
 */

import * as React from 'react'
import Link from 'next/link'
import { Check, Package } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useBundle } from '@/hooks/use-bundle'
import { track } from '@/lib/analytics'
import type { KitItem } from '@/lib/kits/resolve'

export function AddKitToBundle({
  kitSlug,
  kitName,
  items,
}: {
  kitSlug: string
  kitName: string
  /** Every piece of the kit, already resolved on the server. */
  items: KitItem[]
}) {
  const { add, has } = useBundle()
  const [done, setDone] = React.useState(false)

  function addAll() {
    // Counted first: `has` is about to stop being true for everything we
    // add, so a count taken afterwards would always say zero were new.
    const fresh = items.filter((item) => !has(item.id))

    for (const item of items) {
      add({ id: item.id, name: item.name, category: item.category, level: item.level })
    }

    track('kit_added_to_bundle', {
      kit: kitSlug,
      items: items.length,
      added: fresh.length,
    })

    setDone(true)
    setTimeout(() => setDone(false), 2500)

    if (fresh.length === 0) {
      toast.success(`${kitName} is already in your bundle`, {
        description: 'Open the bundle from the header to export it.',
      })
      return
    }

    toast.success(
      `Added ${fresh.length} ${fresh.length === 1 ? 'piece' : 'pieces'} to your bundle`,
      {
        description:
          fresh.length === items.length
            ? 'Open the bundle from the header to export the whole kit.'
            : `The other ${items.length - fresh.length} were already there.`,
      },
    )
  }

  return (
    <div>
      <Button type="button" size="lg" className="gap-2" onClick={addAll}>
        {done ? (
          <Check aria-hidden className="h-4 w-4" />
        ) : (
          <Package aria-hidden className="h-4 w-4" />
        )}
        {done ? 'Added to bundle' : `Add all ${items.length} pieces`}
      </Button>
      {/* Stated before the press, not discovered after it. See the note at
          the top of this file. */}
      <p className="mt-2 text-xs text-muted-foreground">
        The free bundle holds ten pieces.{' '}
        <Link href="/pricing" className="font-medium text-primary hover:underline">
          Pro
        </Link>{' '}
        removes the cap — every piece stays free to read and copy either way.
      </p>
    </div>
  )
}
