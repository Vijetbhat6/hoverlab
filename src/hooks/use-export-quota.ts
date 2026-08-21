'use client'

/**
 * The daily export meter, on the client.
 *
 * Mirrors /api/quota. Two jobs:
 *
 *   `state`   what to render beside an export button ("6 of 10 left today").
 *   `claim()` spend one, before the export runs.
 *
 * `claim()` is the only one that matters for correctness, and it is
 * deliberately the one that talks to the server every time. `state` is
 * display, and a client that edits it gets a nicer number and no more
 * exports.
 *
 * Unlike `useEntitlements`, this DOES fetch for signed-out visitors: the
 * anonymous limit is the one most people meet, and a button that cannot
 * say how many exports are left is a button that surprises them.
 *
 * The state is shared process-wide rather than per instance. The bundle
 * drawer and the template page can both be mounted, and both should show
 * the same remaining count and both should see it drop when either spends.
 */

import * as React from 'react'
import type { QuotaAction } from '@/lib/billing/quota-limits'

export interface ExportQuota {
  used: number
  /** null means unlimited — a paid licence. JSON has no Infinity. */
  limit: number | null
  remaining: number | null
  unlimited: boolean
  resetsAt: string
  signedIn: boolean
  /** What the limit would be with an account, for the upsell copy. */
  signedInLimit?: number
}

export type ClaimResult =
  | { ok: true; quota: ExportQuota }
  /**
   * Refused. `offer` says which of the two ways past the wall to show —
   * 'signin' for an anonymous visitor, 'pro' for someone who already has an
   * account and has spent the day's allowance.
   */
  | { ok: false; quota: ExportQuota; error: string; offer: 'signin' | 'pro' }
  /**
   * The meter itself failed — network down, Firestore unreachable. Callers
   * let the export through: a metering outage must not become an outage of
   * the product, and the downside is a handful of uncounted exports.
   */
  | { ok: true; quota: null; degraded: true }

/* Re-exported rather than redeclared: the action names are a wire
   contract with /api/quota, and two copies of that list drift. */
export type { QuotaAction } from '@/lib/billing/quota-limits'

let cache: ExportQuota | null = null
let inflight: Promise<ExportQuota | null> | null = null
const listeners = new Set<() => void>()

function publish(next: ExportQuota | null) {
  cache = next
  listeners.forEach((notify) => notify())
}

async function load(): Promise<ExportQuota | null> {
  try {
    const res = await fetch('/api/quota', { credentials: 'same-origin' })
    if (!res.ok) return null
    const data = (await res.json()) as ExportQuota
    publish(data)
    return data
  } catch {
    return null
  }
}

/**
 * Spend one export.
 *
 * Exported as a plain function as well as through the hook because the
 * places that need it most are click handlers, and a handler should be able
 * to await the claim without the component re-rendering first.
 */
export async function claimExport(action: QuotaAction): Promise<ClaimResult> {
  let res: Response
  try {
    res = await fetch('/api/quota', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ action }),
    })
  } catch {
    return { ok: true, quota: null, degraded: true }
  }

  let data: (ExportQuota & { error?: string; offer?: 'signin' | 'pro' }) | null = null
  try {
    data = (await res.json()) as ExportQuota & {
      error?: string
      offer?: 'signin' | 'pro'
    }
  } catch {
    return { ok: true, quota: null, degraded: true }
  }

  if (res.status === 429 && data) {
    publish(data)
    return {
      ok: false,
      quota: data,
      error: data.error ?? 'You have used today’s exports.',
      offer: data.offer ?? 'pro',
    }
  }

  if (!res.ok || !data) {
    // A 400 means the client sent something wrong, a 500 means the meter
    // broke. Neither is the user's problem and neither should stop an
    // export they are entitled to.
    return { ok: true, quota: null, degraded: true }
  }

  publish(data)
  return { ok: true, quota: data }
}

export function useExportQuota() {
  const [, forceRender] = React.useReducer((n: number) => n + 1, 0)

  React.useEffect(() => {
    listeners.add(forceRender)
    return () => {
      listeners.delete(forceRender)
    }
  }, [])

  React.useEffect(() => {
    if (cache) return
    if (!inflight) {
      inflight = load().finally(() => {
        inflight = null
      })
    }
  }, [])

  return {
    quota: cache,
    claim: claimExport,
    refresh: () => {
      inflight = load().finally(() => {
        inflight = null
      })
    },
  }
}
