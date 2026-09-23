/**
 * The first-run checklist, as a pure function of state the app already has.
 *
 * ── WHAT THIS IS FOR ────────────────────────────────────────────────────
 *
 * A signed-in account on /account is mostly a plan card and a licence
 * certificate. A person who has just created a free account sees neither
 * of those as their next step: they see numbers (0 favourites, 0 in the
 * bundle) with no sentence about what those are for. This is the sentence,
 * as a short list, where each line completes itself the moment the thing it
 * names is true — nobody ticks a box.
 *
 * ── THE RULE THAT SHAPES EVERYTHING BELOW ───────────────────────────────
 *
 * A step exists only if it can be VERIFIED from state that is already
 * loaded. That rules out, on purpose:
 *
 *   "Run `npx hoverlab add` once."  The CLI is anonymous — it sends no
 *                                   identity, and `reportInstall` counts
 *                                   artifacts, not people. There is nothing
 *                                   to read that says THIS account did it,
 *                                   so a step for it could only ever be
 *                                   ticked by hand, and a checklist that
 *                                   asks you to tick things is a to-do list
 *                                   wearing a progress bar. The one honest
 *                                   proxy is below: a licence key that has
 *                                   authenticated a request.
 *   Anything fetched for the       Every fetch on /account is a paid
 *   checklist's own sake.           function call. This module adds none.
 *                                   It takes what the page and its cards
 *                                   already hold, and a step whose input
 *                                   was not supplied is OMITTED rather than
 *                                   shown as pending — see "unknown" below.
 *
 * ── WHERE EACH STEP READS FROM ──────────────────────────────────────────
 *
 * This table is the doc block the component's contract rests on; the same
 * strings are exported as `reads` on each step so a test can insist none is
 * blank.
 *
 *   copy        `hoverlab:copy-history` in localStorage, through the existing
 *               `useCopyHistory()` hook. The last five things copied on THIS
 *               browser. It is device-local, and the history can be cleared
 *               from the copy menu, so the step can un-complete — which is
 *               the truth about the state, not a bug in the list.
 *   favorite    `useFavorites().count` — localStorage, synced to the account.
 *               The /account page already calls the hook for its own tile.
 *   bundle      `useBundle().count` — the same arrangement.
 *   playground  The `cssfx:playground` localStorage key. The playground
 *               writes it ~0.5s after it first mounts (debounced autosave),
 *               so its presence means the page was opened and held open long
 *               enough to save, on this browser. Nothing else writes it.
 *   brand       `useBrandColor().isCustomized` — `hoverlab:brand-color` in
 *               localStorage, written when a colour is explicitly chosen.
 *   passkey     `passkeyCount`, from <PasskeysCard>'s own list request.
 *               Server truth. Omitted until the card has loaded.
 *   collection  `collectionCount`, from the collections store. Pro only —
 *               collections are the one store with no local mode — and
 *               omitted for everyone else rather than pointing a free
 *               account at a paywall as its "next step".
 *   key         `licenseKey.issued`, from <LicenseKeyCard>'s own request.
 *               Pro only, and only once that card has loaded.
 *   key-used    `licenseKey.used` — the key's `lastUsedAt`, which the server
 *               writes on any successful key verification. The only
 *               server-side evidence that the CLI or an agent has acted on
 *               this account's behalf. Only offered once a key exists.
 *
 * "Unknown" (`null` or absent) is deliberately not "zero". A passkey count
 * that has not loaded yet must not read as "no passkeys, here is a step" —
 * that is a wrong claim shown for a beat and then retracted, which is how
 * a checklist teaches people to ignore it. So unknown removes the step; it
 * appears when the count arrives, and it appears pending or done correctly.
 *
 * ── WHAT IT NEVER DOES ──────────────────────────────────────────────────
 *
 * It never gates anything. Every step links to something that is already
 * free to open (or, for the Pro steps, already yours). Dismissing it hides
 * a card and changes nothing else. No step is a purchase.
 *
 * Isomorphic and dependency-free: no React, no `window`, no clock. The
 * component in `components/onboarding` owns the browser; this owns the
 * answers.
 */

/* ------------------------------------------------------------------ *
 *  State in
 * ------------------------------------------------------------------ */

export interface ChecklistState {
  /** `useCopyHistory().count` — 0 to 5, this browser. */
  copiedCount: number
  /** `useFavorites().count`. */
  favoriteCount: number
  /** `useBundle().count`. */
  bundleCount: number
  /** Whether `cssfx:playground` exists in this browser's localStorage. */
  playgroundOpened: boolean
  /** `useBrandColor().isCustomized`. */
  brandCustomized: boolean
  /** `entitlements.canUseProFeatures`. False while unknown — see the Pro steps. */
  hasPro: boolean
  /** Passkeys on the account. `null`/absent until the card has loaded. */
  passkeyCount?: number | null
  /** Collections owned. `null`/absent until known; ignored unless `hasPro`. */
  collectionCount?: number | null
  /**
   * The licence key's public record. `null`/absent until known; ignored
   * unless `hasPro`. `issued` is "a key exists", `used` is "`lastUsedAt` is
   * set".
   */
  licenseKey?: { issued: boolean; used: boolean } | null
}

/* ------------------------------------------------------------------ *
 *  The steps
 * ------------------------------------------------------------------ */

export type ChecklistStepId =
  | 'copy'
  | 'favorite'
  | 'bundle'
  | 'playground'
  | 'brand'
  | 'passkey'
  | 'key'
  | 'key-used'
  | 'collection'

export interface ChecklistStep {
  id: ChecklistStepId
  title: string
  /** One sentence: why, and what completes it. */
  description: string
  /** Where the step sends you. Site-relative. */
  href: string
  done: boolean
  /** Where this step's truth comes from. See the table above. */
  reads: string
}

interface StepDefinition {
  id: ChecklistStepId
  title: string
  description: string
  href: string
  reads: string
  /** Is the step verifiable, and relevant, for this state? */
  applies: (state: ChecklistState) => boolean
  done: (state: ChecklistState) => boolean
}

const known = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/**
 * In the order a first session goes, not the order things are built.
 *
 * The three that need nothing but a click come first; the account-level
 * ones (a passkey, a key) are later because nobody has a reason to secure
 * an account before they have used it; the Pro-only ones close the list
 * because they only exist for a person who has already bought.
 */
const STEPS: readonly StepDefinition[] = [
  {
    id: 'copy',
    title: 'Copy something from the catalog',
    description: 'Open any effect, block or page and copy its source. Free, and no account needed.',
    href: '/browse',
    reads: 'hoverlab:copy-history (localStorage) via useCopyHistory()',
    applies: () => true,
    done: (s) => s.copiedCount > 0,
  },
  {
    id: 'favorite',
    title: 'Save a favourite',
    description: 'Tap the heart on anything you might want again. It syncs to this account.',
    href: '/browse',
    reads: 'useFavorites().count (localStorage, synced to the account)',
    applies: () => true,
    done: (s) => s.favoriteCount > 0,
  },
  {
    id: 'bundle',
    title: 'Add an effect to your bundle',
    description: 'A bundle exports several effects together as one file.',
    href: '/library',
    reads: 'useBundle().count (localStorage, synced to the account)',
    applies: () => true,
    done: (s) => s.bundleCount > 0,
  },
  {
    id: 'playground',
    title: 'Try the playground',
    description: 'Paste your own HTML and CSS and tune it live. Completes once the page has been open long enough to autosave.',
    href: '/playground',
    reads: 'cssfx:playground (localStorage), written by the playground page',
    applies: () => true,
    done: (s) => s.playgroundOpened,
  },
  {
    id: 'brand',
    title: 'Set your brand colour',
    description: 'Every preview on the site repaints in it, and it carries into exported files.',
    href: '/design-system',
    reads: 'hoverlab:brand-color (localStorage) via useBrandColor()',
    applies: () => true,
    done: (s) => s.brandCustomized,
  },
  {
    id: 'passkey',
    title: 'Add a passkey',
    description: 'Sign in with your device instead of a password. Optional, and removable.',
    href: '/account#passkeys',
    reads: 'passkeyCount, from <PasskeysCard>’s own request',
    applies: (s) => known(s.passkeyCount),
    done: (s) => (s.passkeyCount ?? 0) > 0,
  },
  {
    id: 'key',
    title: 'Create a licence key',
    description: 'One key lets the CLI and your editor agent scaffold Pro templates.',
    href: '/account#licence-key',
    reads: 'licenseKey.issued, from <LicenseKeyCard>’s own request (Pro only)',
    applies: (s) => s.hasPro && s.licenseKey != null,
    done: (s) => s.licenseKey?.issued === true,
  },
  {
    id: 'key-used',
    title: 'Use your key from the CLI',
    description:
      'Run npx hoverlab login with your key, then scaffold a Pro template. Completes when the server sees the key used.',
    href: '/docs/cli',
    reads: 'licenseKey.used = the key’s lastUsedAt, written on any verified request (Pro only)',
    applies: (s) => s.hasPro && s.licenseKey?.issued === true,
    done: (s) => s.licenseKey?.used === true,
  },
  {
    id: 'collection',
    title: 'Make a collection',
    description: 'A named list of effects, blocks, pages and templates you keep coming back to.',
    href: '/collections',
    reads: 'collectionCount, from the collections store (Pro only)',
    applies: (s) => s.hasPro && known(s.collectionCount),
    done: (s) => (s.collectionCount ?? 0) > 0,
  },
]

/** Every step id, in list order — for tests and for documentation. */
export const CHECKLIST_STEP_IDS: readonly ChecklistStepId[] = STEPS.map((step) => step.id)

/** Where each step reads its truth from, keyed by id. */
export const CHECKLIST_SOURCES: Readonly<Record<ChecklistStepId, string>> = Object.fromEntries(
  STEPS.map((step) => [step.id, step.reads]),
) as Record<ChecklistStepId, string>

/* ------------------------------------------------------------------ *
 *  Answers out
 * ------------------------------------------------------------------ */

export interface ChecklistResult {
  /** The steps that apply to this state, in order, each with its verdict. */
  steps: ChecklistStep[]
  doneCount: number
  total: number
  /**
   * True when there is nothing left to do — including when nothing at all
   * could be verified, because a checklist with no verifiable steps has no
   * business being on screen.
   */
  complete: boolean
  /** The first step still pending, for a single call to action. */
  next: ChecklistStep | null
}

export function computeChecklist(state: ChecklistState): ChecklistResult {
  const steps: ChecklistStep[] = STEPS.filter((step) => step.applies(state)).map((step) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    href: step.href,
    reads: step.reads,
    done: step.done(state),
  }))

  const doneCount = steps.filter((step) => step.done).length

  return {
    steps,
    doneCount,
    total: steps.length,
    complete: doneCount === steps.length,
    next: steps.find((step) => !step.done) ?? null,
  }
}

/**
 * What the component should draw.
 *
 *   hidden     everything is done, so there is nothing to show — and nothing
 *              to bring back, because a finished list has no "show again".
 *   collapsed  dismissed with work remaining: a single quiet line whose
 *              only job is to be the way back. Without it, one mis-click
 *              would remove the feature for good.
 *   open       the card.
 *
 * Completion outranks dismissal: a dismissed list that then finishes stays
 * hidden rather than reappearing as a collapsed line about nothing.
 */
export type ChecklistView = 'hidden' | 'collapsed' | 'open'

export function checklistView(result: ChecklistResult, dismissed: boolean): ChecklistView {
  if (result.complete) return 'hidden'
  return dismissed ? 'collapsed' : 'open'
}

/* ------------------------------------------------------------------ *
 *  Dismissal
 * ------------------------------------------------------------------ */

/**
 * The slice of `Storage` this needs, so a test can hand in a fake — and so a
 * `null` can stand for "there is no storage here" (server render, a browser
 * with site data blocked), which every function below tolerates.
 */
export type ChecklistStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/**
 * Keyed by user, not global: a shared machine where a second person signs in
 * should not inherit the first person's "I have seen this". The id is not a
 * secret and is already visible in this browser's other keys.
 */
export function dismissalKey(userId: string): string {
  return `hoverlab:first-run-checklist:${userId}`
}

/** True only when storage says so. Anything else — absent, throwing — is "not dismissed". */
export function readDismissed(storage: ChecklistStorage | null, userId: string): boolean {
  if (!storage) return false
  try {
    return storage.getItem(dismissalKey(userId)) === 'dismissed'
  } catch {
    return false
  }
}

/**
 * Returns whether the write took. A blocked or full store means the
 * dismissal will not survive a reload; the component still hides the card
 * for this visit (its own state), and the honest cost is that it returns.
 */
export function writeDismissed(
  storage: ChecklistStorage | null,
  userId: string,
  dismissed: boolean,
): boolean {
  if (!storage) return false
  try {
    if (dismissed) storage.setItem(dismissalKey(userId), 'dismissed')
    else storage.removeItem(dismissalKey(userId))
    return true
  } catch {
    return false
  }
}

/** The key the playground writes. Asserted against its source in the tests. */
export const PLAYGROUND_STORAGE_KEY = 'cssfx:playground'

/** Has the playground saved anything in this browser? Absent or blocked storage is "no". */
export function readPlaygroundOpened(storage: ChecklistStorage | null): boolean {
  if (!storage) return false
  try {
    return storage.getItem(PLAYGROUND_STORAGE_KEY) !== null
  } catch {
    return false
  }
}
