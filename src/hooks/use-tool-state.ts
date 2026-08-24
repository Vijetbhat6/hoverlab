'use client'

/**
 * One tool's working state, plus the named presets an account keeps.
 *
 * Every tool under /tools had the same fifteen lines of `localStorage`
 * boilerplate — restore in an effect (never in the initializer, or the
 * server and client markup disagree), write on change, swallow the private
 * -mode throw. This is that, factored out, with the part that was missing:
 * the state can also be named and kept on the account, so it survives the
 * browser it was made in.
 *
 * The two layers are deliberately independent.
 *
 *   Working state is local, always, signed in or not. It is the thing you
 *   come back to on this machine when you reopen the tab, and it should
 *   never wait on a network request or disappear because a session expired.
 *
 *   Presets are server-held and need an account. They are the thing you
 *   name because you want it next week, from somewhere else.
 *
 * So a signed-out visitor loses nothing they had before, and a signed-in one
 * gains something that could not have worked locally. That split is the
 * funnel: the ask lands after the work is done and is for the thing local
 * storage genuinely cannot do, rather than in front of a tool that used to
 * be free.
 *
 * `state` is opaque to the server (see `lib/tool-presets.ts`), so adding a
 * tool needs no route change and no migration — only this hook.
 */

import * as React from 'react'
import { useAuth } from '@/components/auth-provider'
import { track } from '@/lib/analytics'
import {
  TOOL_PRESET_LIMITS,
  rejectionReason,
  sortToolPresets,
  type ToolPreset,
} from '@/lib/tool-presets'

/** The `hoverlab:tool:*` convention every tool already used. */
function storageKey(tool: string): string {
  return `hoverlab:tool:${tool.replace(/^\/tools\//, '')}`
}

/**
 * Ids are generated client-side so an optimistic save has something to key
 * on before the round trip. `crypto.randomUUID` where it exists — every
 * browser this app supports has it — with a readable fallback for the
 * insecure-origin case, where it is undefined.
 */
function newPresetId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * The preset half, with no reference to the tool's own state type.
 *
 * Split out so `<ToolPresetsBar>` can take it without being generic. The bar
 * reads nothing but this — it saves whatever the hook is currently holding
 * and never inspects it — so making it generic over each tool's state would
 * be a type parameter that exists only to be discarded, and every call site
 * would have to name a type it already has in hand.
 */
export interface ToolPresetsApi {
  /** Saved presets for this tool, newest-touched first. Empty when signed out. */
  presets: ToolPreset[]
  /** True while the preset list is in flight. */
  loadingPresets: boolean
  /** Whether presets are available at all — i.e. is anyone signed in. */
  canSave: boolean
  /** The last preset error, as a sentence for the user. */
  presetError: string | null

  /** Save the current working state under a name. Overwrites by name. */
  savePreset: (name: string) => Promise<ToolPreset | null>
  /** Load a preset into the working state. */
  applyPreset: (preset: ToolPreset) => void
  /** Forget a preset. */
  deletePreset: (id: string) => Promise<void>
}

export interface UseToolState<T> extends ToolPresetsApi {
  /** Working state. Local, and never gated. */
  state: T
  setState: React.Dispatch<React.SetStateAction<T>>
  /** Reset to the tool's defaults. */
  reset: () => void
  /**
   * True until the first `localStorage` read has run.
   *
   * Tools use it to hold back a "save" affordance for one frame rather than
   * offering to save the defaults over the state that is about to load.
   */
  hydrating: boolean
}

/**
 * `T extends object` rather than `Record<string, unknown>`: a tool's state
 * is an `interface`, and TypeScript will not assign an interface to an
 * index-signature type without one declared. The real constraint — that the
 * state is plain JSON — is not expressible here anyway, and is checked at
 * runtime by `rejectionReason` before anything is written.
 */
export function useToolState<T extends object>(
  tool: string,
  defaults: T,
): UseToolState<T> {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [state, setState] = React.useState<T>(defaults)
  const [hydrating, setHydrating] = React.useState(true)
  const [presets, setPresets] = React.useState<ToolPreset[]>([])
  const [loadingPresets, setLoadingPresets] = React.useState(false)
  const [presetError, setPresetError] = React.useState<string | null>(null)

  const key = storageKey(tool)

  /*
    Restore after mount, never during render. Reading localStorage in the
    useState initializer would make the server-rendered markup and the first
    client render disagree, which React resolves by throwing the server
    markup away — on the highest-traffic pages on the site.

    Merged over `defaults` rather than used as-is, so a tool that grows a
    field does not restore `undefined` into it for every returning visitor.
  */
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) setState({ ...defaults, ...(JSON.parse(raw) as Partial<T>) })
    } catch {
      /* private mode, or a blob from an older version of this tool */
    }
    setHydrating(false)
    // `defaults` is a literal at every call site and would re-run this on
    // every render if it were a dependency. The key is the real input.
  }, [key])

  React.useEffect(() => {
    if (hydrating) return
    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch {
      /* quota, or private mode — the working state is a convenience */
    }
  }, [key, state, hydrating])

  /*
    Presets follow the session. Signed out clears the list rather than
    leaving the last account's presets on screen for whoever signs in next.
  */
  React.useEffect(() => {
    if (!userId) {
      setPresets([])
      setPresetError(null)
      return
    }

    let cancelled = false
    setLoadingPresets(true)
    void (async () => {
      try {
        const res = await fetch(
          `/api/sync/tool-presets?tool=${encodeURIComponent(tool)}`,
          { cache: 'no-store' },
        )
        if (!res.ok) throw new Error(String(res.status))
        const data = (await res.json()) as { presets?: ToolPreset[] }
        if (!cancelled) setPresets(sortToolPresets(data.presets ?? []))
      } catch {
        // Silent. Nothing the visitor did failed — they have not asked for
        // a preset yet, and an error toast on page load for a feature they
        // have not touched is noise. The next save reports for real.
        if (!cancelled) setPresets([])
      } finally {
        if (!cancelled) setLoadingPresets(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId, tool])

  const savePreset = React.useCallback(
    async (name: string): Promise<ToolPreset | null> => {
      setPresetError(null)
      const trimmed = name.trim().slice(0, TOOL_PRESET_LIMITS.nameLength)
      if (!trimmed) {
        setPresetError('Give the preset a name.')
        return null
      }
      if (!userId) {
        setPresetError('Sign in to keep presets across devices.')
        return null
      }

      // Same name overwrites, rather than accumulating "Brand", "Brand (2)".
      // Re-saving is how someone iterates, and the alternative fills the
      // per-tool cap with versions of one idea.
      const existing = presets.find(
        (p) => p.name.toLowerCase() === trimmed.toLowerCase(),
      )
      const now = new Date().toISOString()
      const preset: ToolPreset = {
        id: existing?.id ?? newPresetId(),
        tool,
        name: trimmed,
        state: state as unknown as Record<string, unknown>,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }

      // Checked here as well as on the server so the common rejections —
      // an empty name, a state too large — are answered without a round
      // trip. The server still checks; this is not the guard, it is the
      // fast path to the same sentence.
      const reason = rejectionReason(preset)
      if (reason) {
        setPresetError(reason)
        return null
      }

      try {
        const res = await fetch('/api/sync/tool-presets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preset }),
        })
        const data = (await res.json().catch(() => ({}))) as {
          preset?: ToolPreset
          error?: string
        }
        if (!res.ok || !data.preset) {
          setPresetError(data.error ?? 'That did not save. Try again in a moment.')
          return null
        }
        setPresets((list) =>
          sortToolPresets([
            data.preset as ToolPreset,
            ...list.filter((p) => p.id !== data.preset!.id),
          ]),
        )
        // The event that says whether an account is worth having here. Fired
        // on the success path only — a save that 409'd on a cap is not a
        // saved preset, and counting it would make the cap look popular.
        track('tool_preset_saved', { tool })
        return data.preset
      } catch {
        setPresetError('We could not reach the server, so nothing was saved.')
        return null
      }
    },
    [userId, presets, state, tool],
  )

  const applyPreset = React.useCallback(
    (preset: ToolPreset) => {
      // Merged over defaults for the same reason the localStorage restore
      // is: a preset saved before the tool grew a control must not restore
      // that control to undefined.
      setState({ ...defaults, ...(preset.state as Partial<T>) })
      setPresetError(null)
    },
    // `defaults` is a literal at every call site, so depending on it would
    // rebuild this callback on every render.
    [],
  )

  const deletePreset = React.useCallback(async (id: string) => {
    setPresetError(null)
    // Optimistic: the row goes immediately and comes back on failure. A
    // delete that waits on a round trip feels broken at this size.
    const before = presets
    setPresets((list) => list.filter((p) => p.id !== id))
    try {
      const res = await fetch(`/api/sync/tool-presets?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error(String(res.status))
    } catch {
      setPresets(before)
      setPresetError('That did not delete. Try again in a moment.')
    }
  }, [presets])

  const reset = React.useCallback(() => {
    setState(defaults)
    // Same reason as `applyPreset` above.
  }, [])

  return {
    state,
    setState,
    reset,
    hydrating,
    presets,
    loadingPresets,
    canSave: Boolean(userId),
    presetError,
    savePreset,
    applyPreset,
    deletePreset,
  }
}
