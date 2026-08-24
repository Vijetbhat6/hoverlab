'use client'

/**
 * The account's saved brand presets.
 *
 * Same shape as `use-collections` and for the same reasons: server-only (no
 * localStorage mode, because the store IS the entitlement), shared
 * process-wide (the picker mounts in the header on several routes), and
 * gated on a successful read before it will push anything.
 *
 * The two are deliberately not merged into one generic sync hook. They
 * differ in the only place that matters — what a mutation is — and folding
 * them together would mean a hook parameterised by four callbacks to save
 * about thirty lines.
 */

import * as React from 'react'
import { useAuth } from '@/components/auth-provider'
import { useEntitlements } from '@/hooks/use-entitlements'
import {
  BRAND_LIBRARY_LIMITS,
  newBrandId,
  sortSavedBrands,
  type SavedBrand,
} from '@/lib/brand-library'
import type { BrandColor } from '@/lib/brand-presets'

let brands: SavedBrand[] = []
let loadedFor: string | null = null
let inflight: Promise<void> | null = null
let locked = false
let loading = false
let pushTimer: ReturnType<typeof setTimeout> | null = null
let lastPushed: string | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((notify) => notify())
}

function reset() {
  brands = []
  loadedFor = null
  inflight = null
  locked = false
  loading = false
  lastPushed = null
  if (pushTimer) {
    clearTimeout(pushTimer)
    pushTimer = null
  }
}

async function load(userId: string): Promise<void> {
  if (loadedFor === userId) return
  if (inflight) return inflight

  loading = true
  emit()

  inflight = fetch('/api/sync/brand-presets', {
    cache: 'no-store',
    credentials: 'same-origin',
  })
    .then(async (res) => {
      if (res.status === 402) {
        locked = true
        brands = []
        loadedFor = userId
        return
      }
      if (!res.ok) throw new Error(`brand-presets: HTTP ${res.status}`)
      const body = (await res.json()) as { brands?: SavedBrand[] }
      locked = false
      brands = sortSavedBrands(body.brands ?? [])
      loadedFor = userId
    })
    .catch(() => {
      // Leave `loadedFor` unset so the next mount retries. A failed read must
      // never be mistaken for an empty library — the next push would then
      // delete everything the account had saved.
    })
    .finally(() => {
      inflight = null
      loading = false
      emit()
    })

  return inflight
}

function schedulePush() {
  if (!loadedFor || locked) return

  const body = JSON.stringify({ brands })
  if (body === lastPushed) return

  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushTimer = null
    lastPushed = body
    fetch('/api/sync/brand-presets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`brand-presets: HTTP ${res.status}`)
      })
      .catch(() => {
        lastPushed = null
      })
  }, 500)
}

function commit(next: SavedBrand[]) {
  brands = sortSavedBrands(next)
  emit()
  schedulePush()
}

export interface UseBrandLibrary {
  brands: SavedBrand[]
  loading: boolean
  /** Signed in without a Pro licence — render an upgrade prompt. */
  locked: boolean
  /** Signed out — saved presets are an account feature. */
  signedOut: boolean
  canSave: boolean
  /** Save a colour under a name. Returns null when the name is empty or full. */
  save: (name: string, color: BrandColor) => SavedBrand | null
  remove: (id: string) => void
}

export function useBrandLibrary(): UseBrandLibrary {
  const { user, loading: authLoading } = useAuth()
  const { entitlements } = useEntitlements()
  const userId = user?.id ?? null

  const [, forceRender] = React.useReducer((n: number) => n + 1, 0)

  React.useEffect(() => {
    listeners.add(forceRender)
    return () => {
      listeners.delete(forceRender)
    }
  }, [])

  React.useEffect(() => {
    if (authLoading) return
    if (!userId) {
      reset()
      forceRender()
      return
    }
    if (loadedFor && loadedFor !== userId) reset()
    void load(userId)
  }, [userId, authLoading])

  /*
   * Re-read after an upgrade.
   *
   * The read is cached on `loadedFor`, so an account that was refused with a
   * 402 stays refused for the life of the tab. That is exactly the tab
   * someone comes back to from Polar's redirect having just bought Pro — the
   * checkout flow refreshes entitlements, and without this the feature they
   * paid for a moment ago still shows them a paywall until a hard reload.
   *
   * Only in the locked -> unlocked direction. A lapsed licence should not
   * yank a half-finished edit out from under someone; the next push fails,
   * and the next load settles it.
   */
  const proNow = entitlements?.canUseProFeatures ?? false
  React.useEffect(() => {
    if (!userId || !proNow || !locked) return
    reset()
    void load(userId)
  }, [userId, proNow])

  const isLocked = loadedFor
    ? locked
    : entitlements
      ? !entitlements.canUseProFeatures
      : false

  const save = React.useCallback((name: string, color: BrandColor) => {
    const trimmed = name.trim().slice(0, BRAND_LIBRARY_LIMITS.nameLength)
    if (!trimmed) return null
    if (brands.length >= BRAND_LIBRARY_LIMITS.perAccount) return null

    const brand: SavedBrand = {
      ...color,
      id: newBrandId(),
      name: trimmed,
      createdAt: new Date().toISOString(),
    }
    commit([brand, ...brands])
    return brand
  }, [])

  const remove = React.useCallback((id: string) => {
    commit(brands.filter((b) => b.id !== id))
  }, [])

  return {
    brands,
    loading: loading || authLoading,
    locked: isLocked,
    signedOut: !authLoading && !userId,
    canSave: !isLocked && brands.length < BRAND_LIBRARY_LIMITS.perAccount,
    save,
    remove,
  }
}
