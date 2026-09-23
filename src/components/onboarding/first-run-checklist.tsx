'use client'

/**
 * <FirstRunChecklist> — what to do next, on /account, for a new account.
 *
 * The logic is in `lib/onboarding/checklist.ts`, and the reasoning is at the
 * top of that file: every step is derived from state the page already holds,
 * nothing is fetched here, and a step whose input is unknown is left out
 * rather than shown as pending. This file is only the part that touches the
 * browser — three localStorage reads, one write, and a card.
 *
 * ── HOW THE LEAD MOUNTS IT ──────────────────────────────────────────────
 *
 *   <FirstRunChecklist
 *     userId={user.uid}                      // scopes the dismissal
 *     favoriteCount={favCount}               // already on the page
 *     bundleCount={bundleCount}              // already on the page
 *     hasPro={entitlements?.canUseProFeatures ?? false}
 *     // Optional. Each one adds steps; leave one out and its steps simply
 *     // do not appear. Pass them only if the owning card already loaded
 *     // them — never fetch to fill them in.
 *     passkeyCount={passkeys?.length}        // <PasskeysCard> list
 *     licenseKey={record && { issued: true, used: record.lastUsedAt !== null }}
 *     collectionCount={collections?.length}  // only if already in memory
 *   />
 *
 * Place it directly under the header block and above the plan card: it is
 * the one thing on the page addressed to somebody who has not bought
 * anything, and it removes itself when it has done its job.
 *
 * `#passkeys` and `#licence-key` are the anchors two of the steps link to.
 * They need an `id` on the wrapper around <PasskeysCard> and <LicenseKeyCard>
 * to land on the card; without them the links still work and scroll nowhere.
 *
 * ── WHY THE FIRST PAINT IS NOTHING ──────────────────────────────────────
 *
 * Four of the inputs come from localStorage, which the server cannot read,
 * so the first render draws nothing and the card arrives after mount. The
 * alternative — rendering "0 of 5" and then correcting it — puts a wrong
 * claim on screen for every returning user on every visit.
 *
 * ── DISMISSAL ───────────────────────────────────────────────────────────
 *
 * Stored per user in localStorage (see `dismissalKey`), every access wrapped
 * because storage can be absent, full or refused. Dismissed with steps left,
 * the card collapses to one line that says how many remain and offers "Show
 * checklist" — the way back. `whenDismissed="nothing"` draws literally
 * nothing instead, for a page that mounts <FirstRunChecklistReopen> somewhere
 * else (a settings section, say) and does not want the line in the flow.
 */

import * as React from 'react'
import Link from 'next/link'
import { Check, Circle, X } from 'lucide-react'

import { useBrandColor } from '@/hooks/use-brand-color'
import { useCopyHistory } from '@/hooks/use-copy-history'
import {
  checklistView,
  computeChecklist,
  dismissalKey,
  readDismissed,
  readPlaygroundOpened,
  writeDismissed,
  PLAYGROUND_STORAGE_KEY,
  type ChecklistResult,
  type ChecklistState,
  type ChecklistStorage,
} from '@/lib/onboarding/checklist'
import { cn } from '@/lib/utils'

/*
 * No re-exports of `computeChecklist` and friends from here. This file is a
 * client module, and a value exported from one arrives in a Server Component
 * as a client reference — a function that throws when called. The pure API
 * is in `lib/onboarding/checklist.ts` and re-exported, un-marked, from
 * `components/onboarding/index.ts`.
 */

/* ------------------------------------------------------------------ *
 *  Browser state
 * ------------------------------------------------------------------ */

/** Same-tab signal that the dismissal changed. See `useBrowserFlags`. */
const CHANGED_EVENT = 'hoverlab:first-run-checklist-changed'

/** `window.localStorage`, or null where reading the property itself throws. */
function browserStorage(): ChecklistStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

/**
 * Dismissal and playground state, read after mount and re-read when another
 * tab changes them or this one reopens the list.
 *
 * `null` until mounted: the render before that is the server's, and the
 * server has no storage.
 */
function useBrowserFlags(userId: string) {
  const [flags, setFlags] = React.useState<{
    dismissed: boolean
    playgroundOpened: boolean
  } | null>(null)

  const read = React.useCallback(() => {
    const storage = browserStorage()
    setFlags({
      dismissed: readDismissed(storage, userId),
      playgroundOpened: readPlaygroundOpened(storage),
    })
  }, [userId])

  React.useEffect(() => {
    read()
    const onStorage = (event: StorageEvent) => {
      // `key === null` is a `clear()`, which changes both.
      if (
        event.key === null ||
        event.key === dismissalKey(userId) ||
        event.key === PLAYGROUND_STORAGE_KEY
      ) {
        read()
      }
    }
    window.addEventListener('storage', onStorage)
    // `storage` fires in OTHER tabs only. The card and its reopen control
    // live in the same tab, so a click on one has to tell the other by hand.
    window.addEventListener(CHANGED_EVENT, read)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(CHANGED_EVENT, read)
    }
  }, [read, userId])

  const setDismissed = React.useCallback(
    (dismissed: boolean) => {
      writeDismissed(browserStorage(), userId, dismissed)
      // State follows the click even when the write was refused: the card
      // should go away now, and the cost of a blocked store is that it comes
      // back next visit — not that the button appears to do nothing.
      setFlags((current) => (current ? { ...current, dismissed } : current))
      // Tells the OTHER instance in this tab, which re-reads storage. If the
      // write was refused that re-read says "not dismissed", so this
      // instance keeps its own state while its sibling shows the truth — an
      // edge only reachable with storage blocked, and one where neither
      // answer is wrong enough to justify a second store.
      window.dispatchEvent(new Event(CHANGED_EVENT))
    },
    [userId],
  )

  return { flags, setDismissed }
}

export interface FirstRunChecklistProps {
  /** Scopes the dismissal, so a second person on the same browser starts fresh. */
  userId: string
  favoriteCount: number
  bundleCount: number
  hasPro: boolean
  /** Omit until known. Never pass 0 to mean "not loaded yet". */
  passkeyCount?: number | null
  collectionCount?: number | null
  licenseKey?: { issued: boolean; used: boolean } | null
  /**
   * What a dismissed list draws. `link` (default) is the one-line way back;
   * `nothing` draws no DOM at all and leaves the way back to
   * <FirstRunChecklistReopen>.
   */
  whenDismissed?: 'link' | 'nothing'
  className?: string
}

/**
 * The state -> result step, shared by the card and the reopen control so
 * they cannot disagree about whether there is anything left to show.
 */
function useChecklist(
  props: Pick<
    FirstRunChecklistProps,
    'userId' | 'favoriteCount' | 'bundleCount' | 'hasPro' | 'passkeyCount' | 'collectionCount' | 'licenseKey'
  >,
) {
  const { flags, setDismissed } = useBrowserFlags(props.userId)
  const { count: copiedCount } = useCopyHistory()
  const { isCustomized: brandCustomized } = useBrandColor()

  const state: ChecklistState = {
    copiedCount,
    favoriteCount: props.favoriteCount,
    bundleCount: props.bundleCount,
    playgroundOpened: flags?.playgroundOpened ?? false,
    brandCustomized,
    hasPro: props.hasPro,
    passkeyCount: props.passkeyCount,
    collectionCount: props.collectionCount,
    licenseKey: props.licenseKey,
  }

  const result = computeChecklist(state)
  return { result, mounted: flags !== null, dismissed: flags?.dismissed ?? false, setDismissed }
}

/* ------------------------------------------------------------------ *
 *  The card
 * ------------------------------------------------------------------ */

export function FirstRunChecklist({
  whenDismissed = 'link',
  className,
  ...props
}: FirstRunChecklistProps) {
  const headingId = React.useId()
  const { result, mounted, dismissed, setDismissed } = useChecklist(props)

  if (!mounted) return null

  const view = checklistView(result, dismissed)
  if (view === 'hidden') return null

  if (view === 'collapsed') {
    if (whenDismissed === 'nothing') return null
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        Getting started: {result.doneCount} of {result.total} done.{' '}
        <button
          type="button"
          onClick={() => setDismissed(false)}
          className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
        >
          Show checklist
        </button>
      </p>
    )
  }

  return (
    <section
      aria-labelledby={headingId}
      className={cn('rounded-xl border border-border/60 bg-card/60 p-5 sm:p-6', className)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id={headingId} className="text-lg font-semibold tracking-tight">
            Getting started
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.doneCount} of {result.total} done. Each step ticks itself off — there is
            nothing to mark by hand.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss the getting-started checklist"
          className="-me-1 -mt-1 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
      </div>

      <ProgressBar result={result} />

      <ol className="mt-5 space-y-3">
        {result.steps.map((step) => (
          <li key={step.id} className="flex items-start gap-3">
            {step.done ? (
              <Check
                aria-hidden
                className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-primary/15 p-0.5 text-primary"
              />
            ) : (
              <Circle aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground/60" />
            )}
            <div className="min-w-0">
              {step.done ? (
                <p className="text-sm font-medium text-muted-foreground">
                  {step.title}
                  <span className="sr-only"> — done</span>
                </p>
              ) : (
                <Link
                  href={step.href}
                  className="text-sm font-medium text-foreground underline-offset-2 hover:text-primary hover:underline"
                >
                  {step.title}
                </Link>
              )}
              {step.done ? null : (
                <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

/**
 * A meter, not a decoration: `role="progressbar"` with real values, so the
 * "2 of 6" in the sentence above is also available as a number to assistive
 * tech. No animation of its own, which also settles reduced motion.
 */
function ProgressBar({ result }: { result: ChecklistResult }) {
  const percent = result.total === 0 ? 0 : Math.round((result.doneCount / result.total) * 100)
  return (
    <div
      role="progressbar"
      aria-label="Getting-started progress"
      aria-valuemin={0}
      aria-valuemax={result.total}
      aria-valuenow={result.doneCount}
      className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"
    >
      <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
    </div>
  )
}

/* ------------------------------------------------------------------ *
 *  The way back, for a page that keeps it somewhere else
 * ------------------------------------------------------------------ */

/**
 * "Show the checklist again", as a bare button that renders only when there
 * is something to bring back: dismissed, with steps left. Pair it with
 * `<FirstRunChecklist whenDismissed="nothing" />` — the two share the
 * dismissal key, so this one reopens that one, in this tab and in others.
 *
 * Takes the same props because it has to answer the same question the card
 * does ("are there steps left?") from the same inputs.
 */
export function FirstRunChecklistReopen({
  className,
  ...props
}: Omit<FirstRunChecklistProps, 'whenDismissed'>) {
  const { result, mounted, dismissed, setDismissed } = useChecklist(props)

  if (!mounted || checklistView(result, dismissed) !== 'collapsed') return null

  return (
    <button
      type="button"
      onClick={() => setDismissed(false)}
      className={cn(
        'text-sm font-medium text-primary underline underline-offset-2 hover:text-primary/80',
        className,
      )}
    >
      Show getting-started checklist
    </button>
  )
}
