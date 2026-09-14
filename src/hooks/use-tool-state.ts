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
 *
 * There is a third layer, and it is the one that travels between people
 * rather than between machines: a shared link. It is read here, in the same
 * restore that reads `localStorage`, because the precedence between the two
 * has to be decided in one place. A link someone was just handed wins over
 * whatever this browser happened to have — they clicked it to see a
 * specific thing, and showing them their own last session instead is the
 * one outcome that makes the link useless. Five tools used to do this
 * themselves, each with its own field-by-field merge that had to be updated
 * whenever the tool grew a control; none of them do now.
 *
 * That third layer now has two spellings, and the order between them is the
 * only genuinely new decision in this file:
 *
 *   `options.initial` is a readable permalink — `?fg=ffffff&bg=3b82f6` —
 *   that the SERVER already parsed, because it also had to build the page's
 *   <title> out of it. It arrives as a prop rather than being read from the
 *   URL here, which is what lets it seed `useState` directly: the server
 *   rendered with that exact state, so using it as the initial value is the
 *   one restore path with no flash of defaults and no hydration mismatch.
 *
 *   `#s=` is the old opaque fragment. Still read, still second, and still
 *   the only option for a tool whose state is not expressible as readable
 *   parameters. Links already pasted into other people's channels have to
 *   keep working.
 *
 * When a tool passes `options.permalink`, this hook also keeps the address
 * bar in sync with the working state, and `shareUrl()` hands out the
 * readable form instead of the fragment. See the two blocks near the bottom
 * of the file for why that sync is a `replaceState` and not a navigation.
 */

import * as React from 'react'
import { useAuth } from '@/components/auth-provider'
import { track } from '@/lib/analytics'
import { readSharedState, shareUrlFor } from '@/components/designer-tools/share-link'
import { toolHref, type ToolPermalink } from '@/lib/tools/permalink'
import {
  TOOL_PRESET_LIMITS,
  rejectionReason,
  shapeMatched,
  sortToolPresets,
  type ToolPreset,
} from '@/lib/tool-presets'

/**
 * The `hoverlab:tool:*` convention every tool already used.
 *
 * The leading slash is stripped separately from the `tools/` prefix so that
 * `/studio` — the one caller that is not under `/tools` — keys as
 * `hoverlab:tool:studio` rather than `hoverlab:tool:/studio`. Every
 * existing key is unchanged: `/tools/tokens` loses the slash, then the
 * prefix, and is still `tokens`.
 */
function storageKey(tool: string): string {
  return `hoverlab:tool:${tool.replace(/^\//, '').replace(/^tools\//, '')}`
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
 * Undo history for one tool, as two stacks around the present.
 *
 * The state itself is not in here — `state` is the present, and these are
 * the shoulders on either side of it. Keeping the present in the stack too
 * is the version of this that is always off by one.
 */
interface History<T> {
  past: T[]
  future: T[]
}

const EMPTY_HISTORY: History<never> = { past: [], future: [] }

/**
 * How many steps back a tool remembers.
 *
 * Bounded because this is all in memory next to a live preview, and a tool
 * whose state holds eight shadow layers is not free to keep a thousand
 * copies of. Fifty is well past the point where someone reaches for the
 * button instead — beyond about a dozen presses people re-tune rather than
 * keep undoing.
 */
const HISTORY_LIMIT = 50

/**
 * How long a run of changes counts as one undoable step, in milliseconds.
 *
 * This is the whole reason undo is usable on these tools. Every control
 * here is a slider, and a slider drag fires a change per frame: without
 * coalescing, one press of ⌘Z moves the blur radius by one pixel and the
 * feature is worse than not having it. 400ms is longer than the gap between
 * two frames of a drag and shorter than the gap between two decisions.
 */
const HISTORY_COALESCE_MS = 400

/**
 * The half of the hook that carries no reference to the tool's own state
 * type — presets, the share link, and undo.
 *
 * Split out so `<ToolPresetsBar>` can take it without being generic. The bar
 * reads nothing but this — it saves whatever the hook is currently holding
 * and never inspects it — so making it generic over each tool's state would
 * be a type parameter that exists only to be discarded, and every call site
 * would have to name a type it already has in hand.
 *
 * `shareUrl` belongs here for exactly that reason: it is a getter that
 * closes over the state and hands back a string, so the bar can offer
 * "copy link" beside "save" without either of them naming `T`. That is what
 * makes the feature universal — the bar is already mounted by every tool,
 * so nothing had to be wired tool by tool.
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

  /**
   * A link to this tool carrying the current working state, or null when
   * that state is too large to survive being pasted somewhere. Built at
   * call time — see `shareUrlFor`.
   */
  shareUrl: () => string | null

  /** Step back one change. A no-op with nothing to go back to. */
  undo: () => void
  /** Step forward again, until the next edit clears the way forward. */
  redo: () => void
  canUndo: boolean
  canRedo: boolean
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

export interface ToolStateOptions<T extends object> {
  /**
   * State the server already read out of a readable permalink.
   *
   * Passed rather than read from `window` because the server needed it
   * first — the page's <title> is built from it — and because a value that
   * both sides have makes this the only restore path that can seed
   * `useState` directly instead of landing in an effect a frame later.
   *
   * `undefined` means "no permalink on this request", which is different
   * from "a permalink that spells out the defaults": the second must still
   * outrank this browser's stored state. `parseToolState` draws that line
   * with its `fromLink` flag, and the caller passes `undefined` accordingly.
   */
  initial?: T

  /**
   * This tool's permalink spec.
   *
   * Its presence is what switches `shareUrl()` from the `#s=` fragment to
   * the readable query string, and what turns on the address-bar sync.
   */
  permalink?: ToolPermalink<T>

  /**
   * Optional last word on a state arriving from a shared `#s=` link, applied
   * after `shapeMatched` has already guaranteed the shape.
   *
   * For the handful of tools whose state has values the shape guard cannot
   * check — a `mode` that is one of two strings, a colour that has to parse
   * as hex, an id that has to name a preset that still exists. Return the
   * state to use; return null to ignore the link entirely.
   *
   * Most tools do not pass this, and should not: the shape guard is the
   * floor, and inventing a validator for a tool whose state is four numbers
   * is a second place for the defaults to be written down. A tool with a
   * `permalink` spec needs it even less — every field there is validated by
   * its own codec on the way in.
   */
  sanitizeShared?: (shared: T) => T | null

  /**
   * Repair a restored state before it is used, on every restore path.
   *
   * ── WHY A SECOND GUARD, AND WHY IT IS NOT `sanitizeShared` ──────────
   *
   * `sanitizeShared` guards one path and may reject: a link that says
   * something impossible should be ignored, because the visitor still has
   * their own session underneath it. This guards the other two —
   * `localStorage` and a saved preset — and may NOT reject, because
   * underneath those there is nothing but defaults, and throwing away
   * somebody's saved brand because one field is malformed is worse than
   * repairing it. So the signatures differ on purpose: `T | null` there,
   * `T` here.
   *
   * ── WHY IT WAS NEEDED ─────────────────────────────────────────
   *
   * Both of those paths merge with `{ ...defaults, ...stored }`, which is
   * SHALLOW, and that was enough for as long as every tool's state was a
   * handful of numbers at the top level: a missing key is filled in by the
   * spread and a present one is a number.
   *
   * `/studio` is the first state with nested objects in it, and a shallow
   * merge cannot repair those — a stored `{ theme: { accent: { hue: 200 } } }`
   * replaces the whole `theme` branch, so `accent.chroma` is `undefined`,
   * and the first `accent.chroma.toFixed(3)` on the way to a slider label
   * throws. Verified before the fix: that exact blob produced an accent of
   * `#NaNNaNNaN` and then a TypeError, which in a tool with no error
   * boundary is a white screen and a lost brand.
   *
   * Tools whose state is flat do not need this and should not pass it.
   */
  coerce?: (restored: T) => T
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
  options: ToolStateOptions<T> = {},
): UseToolState<T> {
  const { initial, permalink, sanitizeShared, coerce } = options
  const { user } = useAuth()
  const userId = user?.id ?? null

  /*
    `initial` seeds the state rather than being applied in the effect below,
    and it is the one value that may: it came from the server, which
    rendered this page with it, so using it here is what the server already
    committed to. Every other source has to wait for mount — reading
    `localStorage` or `window.location.hash` during render would make the
    server markup and the first client render disagree, which React resolves
    by throwing the server markup away.
  */
  const [state, setState] = React.useState<T>(initial ?? defaults)
  const [hydrating, setHydrating] = React.useState(initial === undefined)
  const [presets, setPresets] = React.useState<ToolPreset[]>([])
  const [loadingPresets, setLoadingPresets] = React.useState(false)
  const [presetError, setPresetError] = React.useState<string | null>(null)
  const [history, setHistory] = React.useState<History<T>>(EMPTY_HISTORY)

  const key = storageKey(tool)

  /*
    `coerce` held in a ref so `applyPreset` can use it without taking it as
    a dependency. Callers pass an inline arrow, so a real dependency would
    rebuild that callback every render.
  */
  const coerceRef = React.useRef(coerce)
  coerceRef.current = coerce

  /*
    Restore after mount, never during render. Reading localStorage in the
    useState initializer would make the server-rendered markup and the first
    client render disagree, which React resolves by throwing the server
    markup away — on the highest-traffic pages on the site.

    Merged over `defaults` rather than used as-is, so a tool that grows a
    field does not restore `undefined` into it for every returning visitor.
  */
  React.useEffect(() => {
    /*
      A readable permalink has already won before this effect runs — it
      seeded the state above — so there is nothing left to restore and
      reading `localStorage` here would undo it. The hash is still cleared
      on the way past, for the case where somebody has pasted a link
      carrying both spellings: leaving a dead `#s=` on the address bar next
      to the query that overruled it is confusing to no purpose.
    */
    if (initial !== undefined) {
      readSharedState<unknown>()
      return
    }

    /*
      A shared link wins over this browser's stored state, and is read
      first so a malformed hash still falls through to the stored value
      rather than to bare defaults. `readSharedState` strips the hash as it
      reads, so the visitor's own subsequent edits survive their reloads.

      Both are merged over `defaults` for the same reason: a link or a blob
      made before this tool grew a control must not restore that control to
      `undefined`. The merge is shallow, which is all a tool's state has
      ever needed and all the preset layer promises either.
    */
    const shared = readSharedState<unknown>()
    if (shared !== null) {
      const matched = shapeMatched(defaults, shared) as T | undefined
      /*
        Written out rather than `sanitizeShared?.(matched) ?? matched`,
        which reads the same and is not: `??` would turn a sanitizer's
        deliberate `null` — "ignore this link" — back into the state it
        just rejected.
      */
      let safe: T | null = null
      if (matched !== undefined) {
        safe = sanitizeShared ? sanitizeShared(matched) : matched
      }
      if (safe) {
        setState(safe)
        setHydrating(false)
        return
      }
      // A link that survived neither guard falls through to the stored
      // state rather than to defaults. The hash is already stripped, so a
      // reload will not re-apply it; showing the visitor their own last
      // session is the least surprising thing left.
    }
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) {
        const merged = { ...defaults, ...(JSON.parse(raw) as Partial<T>) }
        setState(coerce ? coerce(merged) : merged)
      }
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
      const merged = { ...defaults, ...(preset.state as Partial<T>) }
      setState(coerceRef.current ? coerceRef.current(merged) : merged)
      setPresetError(null)
    },
    // `defaults` is a literal at every call site, so depending on it would
    // rebuild this callback on every render. `coerce` is read through a ref
    // for the same reason — callers pass a literal or an inline arrow, and
    // depending on it directly would make this callback a new function
    // every render, which is the one thing its `[]` exists to avoid.
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

  /*
    The link the copy button hands out.

    A tool with a permalink spec gets the readable query string; everything
    else still gets the `#s=` fragment, which is what `shareUrlFor` builds.
    The fallback is not deprecation-in-waiting — the code screenshotter
    holds a pasted document, and there is no readable parameter form for
    that — but for the six tools that have a spec, this is the whole point
    of the exercise: what lands on the clipboard is a URL the recipient can
    read before they click it.

    Still a getter rather than a value, for the reason it always was: built
    at click time, so a slider drag does not re-encode the state on every
    frame for a string almost nobody asks for.
  */
  const shareUrl = React.useCallback(() => {
    if (permalink && typeof window !== 'undefined') {
      return `${window.location.origin}${toolHref(permalink, state)}`
    }
    return shareUrlFor(state)
  }, [permalink, state])

  /*
    THE ADDRESS BAR

    Kept in step with the working state, so the URL a visitor is looking at
    is always the permalink for what they are looking at. That is the
    property `/builder` has and the tools did not: you can copy the address
    bar, or bookmark it, or send someone a screenshot with the URL in it,
    without first finding a button.

    `history.replaceState` rather than a router navigation, and the choice
    is not incidental:

      A navigation would re-run the server component on every slider frame.
      `/builder` can afford a round trip per edit because an edit there is a
      click; here an edit is a drag, at one event per frame.

      `replaceState` writes no history entry, which keeps the back button
      meaning "the page before this one". `pushState` would bury it under
      several hundred gradient stops — and undo is already ⌘Z, wired below.

    Next supports this for shallow URL updates, and because nothing in the
    page reads `useSearchParams`, the write is invisible to React: no
    re-render, no refetch, no effect anywhere else in the tree.

    Debounced, because a drag would otherwise call it sixty times a second —
    Safari throttles history writes and starts throwing once a page exceeds
    roughly a hundred of them in thirty seconds, which would turn a long
    drag into a console full of SecurityErrors.
  */
  React.useEffect(() => {
    if (!permalink || hydrating || typeof window === 'undefined') return
    const timer = window.setTimeout(() => {
      const href = toolHref(permalink, state)
      // Compared before writing so the common case — a tool sitting at its
      // defaults while somebody reads the page — writes nothing at all.
      if (href === window.location.pathname + window.location.search) return
      try {
        window.history.replaceState(window.history.state, '', href)
      } catch {
        /* a browser rate-limiting history writes; the copy button still works */
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [permalink, state, hydrating])

  /*
    UNDO

    Recorded by watching `state` rather than by wrapping `setState`, which
    was the first shape and the wrong one: React state updaters have to be
    pure, and pushing onto a second piece of state from inside one runs
    twice under StrictMode and records every change in duplicate. An effect
    that compares against the previous value is both pure and immune to
    that — the second invocation sees `prev === state` and does nothing.

    It also means undo covers every route into the state for free. A preset
    applied off the account, a shared link, and a slider drag are all just
    `state` changing, so all three are undoable without any of them knowing
    this exists.
  */
  const prevStateRef = React.useRef<T>(state)
  const lastPushRef = React.useRef(0)
  /** Set while undo/redo is driving `state`, so the trip is not re-recorded. */
  const travellingRef = React.useRef(false)

  React.useEffect(() => {
    const prev = prevStateRef.current
    prevStateRef.current = state

    // The restore is not an edit. Recording it would put "the defaults" one
    // undo behind every returning visitor's own saved state.
    if (hydrating) return
    if (travellingRef.current) {
      travellingRef.current = false
      return
    }
    if (Object.is(prev, state)) return

    const now = Date.now()
    const coalesce = now - lastPushRef.current < HISTORY_COALESCE_MS
    lastPushRef.current = now

    setHistory((h) => ({
      // Coalescing keeps the OLDER entry — the state as it was before the
      // drag started. Replacing it with each frame's predecessor would
      // leave a stack full of the same drag, one pixel apart.
      past: coalesce && h.past.length > 0 ? h.past : [...h.past, prev].slice(-HISTORY_LIMIT),
      // Any new edit abandons the redo branch, which is what makes this a
      // history and not a tree.
      future: [],
    }))
  }, [state, hydrating])

  /*
    Both read `history` and `state` from the closure rather than from an
    updater argument. Driving `setState` from inside a `setHistory` updater
    would be the same impurity the recording effect above exists to avoid —
    and these run from a click, where the latest render's values are
    exactly what the user is looking at.
  */
  const undo = React.useCallback(() => {
    if (history.past.length === 0) return
    travellingRef.current = true
    setState(history.past[history.past.length - 1]!)
    setHistory({
      past: history.past.slice(0, -1),
      future: [state, ...history.future].slice(0, HISTORY_LIMIT),
    })
  }, [history, state])

  const redo = React.useCallback(() => {
    if (history.future.length === 0) return
    travellingRef.current = true
    setState(history.future[0]!)
    setHistory({
      past: [...history.past, state].slice(-HISTORY_LIMIT),
      future: history.future.slice(1),
    })
  }, [history, state])

  /*
    ⌘Z / Ctrl+Z, bound on the window rather than on a container, because
    the controls these tools scatter across two columns and a preview have
    no single element that reliably holds focus.

    Skipped when the event came from a text field: those have their own
    undo stack, and hijacking ⌘Z inside a hex input to revert a slider
    somewhere else is the kind of thing that makes people stop trusting the
    shortcut. `preventDefault` only fires on the paths we actually handle.
  */
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!e.metaKey && !e.ctrlKey) return
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return
      }
      const k = e.key.toLowerCase()
      // Ctrl+Y is the Windows spelling of redo, and costs one clause.
      if (k === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (k === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo])

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
    shareUrl,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  }
}
