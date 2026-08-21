'use client'

/**
 * The workspace's shared brand presets.
 *
 * Deliberately a separate hook from `use-brand-library` rather than the
 * same one pointed at a second URL. They differ in the three things a
 * caller has to reason about — who may read, who may write, and what an
 * empty result means — and a hook parameterised by all three is a hook
 * whose call sites have to re-state the feature every time.
 *
 * The important asymmetry: a personal library is locked without a Pro
 * licence, and this one is locked without a live Team subscription. A
 * Studio holder has a workspace and seats and is still locked out here,
 * because Studio sells the licence and Team sells the shared workspace.
 * See `lib/billing/require-team.ts`.
 *
 * State is shared process-wide, like its sibling: the brand picker can be
 * mounted in the header and on /account at once, and both should see the
 * same shared list and the same edits.
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

/** A shared preset also carries who added it. */
export interface SharedBrand extends SavedBrand {
  createdBy: string | null
}

let brands: SharedBrand[] = []
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

async function load(teamId: string): Promise<void> {
  if (loadedFor === teamId) return
  if (inflight) return inflight

  loading = true
  emit()

  inflight = fetch('/api/team/brand-presets', {
    cache: 'no-store',
    credentials: 'same-origin',
  })
    .then(async (res) => {
      if (res.status === 402 || res.status === 401) {
        locked = true
        brands = []
        loadedFor = teamId
        return
      }
      if (!res.ok) throw new Error(`team brand-presets: HTTP ${res.status}`)
      const body = (await res.json()) as { brands?: SharedBrand[] }
      locked = false
      brands = sortSavedBrands(body.brands ?? []) as SharedBrand[]
      loadedFor = teamId
    })
    .catch(() => {
      // `loadedFor` stays unset so the next mount retries. A failed read must
      // never be mistaken for an empty library — the next push would then
      // delete every colour the team had agreed on, for everyone.
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
    fetch('/api/team/brand-presets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`team brand-presets: HTTP ${res.status}`)
      })
      .catch(() => {
        lastPushed = null
      })
  }, 500)
}

function commit(next: SharedBrand[]) {
  brands = sortSavedBrands(next) as SharedBrand[]
  emit()
  schedulePush()
}

export interface UseTeamBrandLibrary {
  brands: SharedBrand[]
  loading: boolean
  /** No live Team subscription — this includes Studio and Pro holders. */
  locked: boolean
  /** Signed out entirely. */
  signedOut: boolean
  canSave: boolean
  save: (name: string, color: BrandColor) => SharedBrand | null
  remove: (id: string) => void
}

export function useTeamBrandLibrary(): UseTeamBrandLibrary {
  const { user, loading: authLoading } = useAuth()
  const { entitlements } = useEntitlements()
  const teamId = entitlements?.teamId ?? null
  const hasTeam = entitlements?.canUseTeamFeatures ?? false

  const [, forceRender] = React.useReducer((n: number) => n + 1, 0)

  React.useEffect(() => {
    listeners.add(forceRender)
    return () => {
      listeners.delete(forceRender)
    }
  }, [])

  React.useEffect(() => {
    if (authLoading) return
    if (!user || !hasTeam || !teamId) {
      reset()
      forceRender()
      return
    }
    if (loadedFor && loadedFor !== teamId) reset()
    void load(teamId)
  }, [user, teamId, hasTeam, authLoading])

  const save = React.useCallback((name: string, color: BrandColor) => {
    const trimmed = name.trim().slice(0, BRAND_LIBRARY_LIMITS.nameLength)
    if (!trimmed) return null
    if (brands.length >= BRAND_LIBRARY_LIMITS.perAccount) return null

    const brand: SharedBrand = {
      ...color,
      id: newBrandId(),
      name: trimmed,
      createdAt: new Date().toISOString(),
      // Filled in by the server, which knows who is asking. Sending a
      // client-supplied author would be letting the browser decide whose
      // name goes on a shared record.
      createdBy: null,
    }
    commit([brand, ...brands])
    return brand
  }, [])

  const remove = React.useCallback((id: string) => {
    commit(brands.filter((b) => b.id !== id))
  }, [])

  return {
    brands,
    loading,
    locked: !hasTeam,
    signedOut: !user && !authLoading,
    canSave: hasTeam && !locked,
    save,
    remove,
  }
}
