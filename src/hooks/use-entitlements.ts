'use client'

/**
 * What the signed-in user is entitled to, read on the client.
 *
 * Mirrors GET /api/billing/entitlements. Display only — every gated action
 * is re-checked server-side, so tampering with this state buys a nicer
 * button and nothing else.
 *
 * Two things here are deliberate:
 *
 *   Signed-out users never fetch. The route answers free entitlements
 *   without touching Firestore, but this hook is called from the header on
 *   every page, and a request per anonymous page view buys nothing. `null`
 *   entitlements means "no account", which callers already treat as free.
 *
 *   Results are shared process-wide, not per component instance. The route
 *   is force-dynamic and reads Firestore, and both the header menu and the
 *   account page ask for the same answer on the same page load. The cache
 *   below collapses that to one request, and the listener set means a
 *   refresh after checkout updates every mounted consumer — the header
 *   badge included — without prop drilling or a provider.
 */

import * as React from 'react'
import { useAuth } from '@/components/auth-provider'
import type { PlanId } from '@/lib/billing/plans'

export interface ClientEntitlements {
  plan: PlanId
  hasPro: boolean
  /** Seat on a one-time Studio license. Grants Pro, not the shared workspace. */
  hasStudio: boolean
  /** Active Pro+ subscription — an AI credit allowance, not a catalog licence. */
  hasPlus: boolean
  hasTeam: boolean
  teamId: string | null
  canUseProFeatures: boolean
  canUseTeamFeatures: boolean
  /**
   * Bundle cap, or null for unlimited. JSON has no Infinity, so the paid
   * tier's POSITIVE_INFINITY serializes to null — treat null as "no cap"
   * rather than as a missing value.
   */
  bundleLimit: number | null
}

/* ============================================================
   Shared cache
   ============================================================ */

let cache: { userId: string; value: ClientEntitlements } | null = null
let inflight: { userId: string; promise: Promise<ClientEntitlements> } | null = null
const listeners = new Set<() => void>()

function publish(userId: string, value: ClientEntitlements) {
  cache = { userId, value }
  listeners.forEach((notify) => notify())
}

/**
 * Fetch entitlements, rejecting on failure.
 *
 * Rejecting rather than falling back to free matters: callers that sell
 * something have to be able to tell "this account has nothing" from "we
 * could not find out". Treating the second as the first offers a Pro
 * license to someone who already owns one, and a one-time license bought
 * twice is a refund request, not a bug report.
 */
async function load(
  userId: string,
  force: boolean,
): Promise<ClientEntitlements> {
  if (!force && cache?.userId === userId) return cache.value
  if (!force && inflight?.userId === userId) return inflight.promise

  const promise = fetch('/api/billing/entitlements', {
    cache: 'no-store',
    credentials: 'same-origin',
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`entitlements: HTTP ${res.status}`)
      const value = (await res.json()) as ClientEntitlements
      publish(userId, value)
      return value
    })
    .finally(() => {
      if (inflight?.promise === promise) inflight = null
    })

  inflight = { userId, promise }
  return promise
}

/** Drop cached entitlements — called on sign-out so the next user starts clean. */
function clearCache() {
  cache = null
  inflight = null
}

/* ============================================================
   Hook
   ============================================================ */

export interface UseEntitlements {
  /** null while loading, on failure, and for signed-out visitors. */
  entitlements: ClientEntitlements | null
  loading: boolean
  /**
   * True when the last read failed. Distinct from free entitlements —
   * anything that sells must not treat "unknown" as "owns nothing".
   */
  error: boolean
  /** Re-read from the server, bypassing the cache. Resolves null on failure. */
  refresh: () => Promise<ClientEntitlements | null>
}

export function useEntitlements(): UseEntitlements {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? null

  const [entitlements, setEntitlements] = React.useState<ClientEntitlements | null>(
    () => (userId && cache?.userId === userId ? cache.value : null),
  )
  const [loading, setLoading] = React.useState(!!userId && cache?.userId !== userId)
  const [error, setError] = React.useState(false)

  // Re-render this instance whenever any instance refreshes.
  React.useEffect(() => {
    const notify = () => {
      setEntitlements(cache?.userId === userId ? cache.value : null)
    }
    listeners.add(notify)
    return () => {
      listeners.delete(notify)
    }
  }, [userId])

  React.useEffect(() => {
    if (authLoading) return

    if (!userId) {
      clearCache()
      setEntitlements(null)
      setError(false)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    load(userId, false)
      .then((value) => {
        if (cancelled) return
        setEntitlements(value)
        setError(false)
      })
      .catch(() => {
        if (cancelled) return
        setEntitlements(null)
        setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId, authLoading])

  const refresh = React.useCallback(async () => {
    if (!userId) return null
    try {
      const value = await load(userId, true)
      setError(false)
      return value
    } catch {
      setError(true)
      return null
    }
  }, [userId])

  return { entitlements, loading: loading || authLoading, error, refresh }
}
