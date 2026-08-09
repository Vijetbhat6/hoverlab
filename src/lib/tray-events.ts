/**
 * The window events that open the bundle and compare drawers.
 *
 * Both drawers are mounted once, by <SiteHeader>. Anything that wants to
 * open one — a card's "Bundle" button, the command palette, a detail page —
 * dispatches instead of holding its own copy of the drawer. That pattern
 * already existed for the command palette; this file just gives it a name
 * and stops the six surfaces that each mounted their own <BundleDrawer>
 * from disagreeing about which one is open.
 *
 * Deliberately plain window events rather than context: the drawers need to
 * be reachable from server-rendered subtrees and from the keyboard handler
 * in <SiteHeader>, and a provider would have to wrap the whole app to do
 * the same job.
 */

export const TRAY_EVENTS = {
  bundle: 'hoverlab:open-bundle',
  compare: 'hoverlab:open-compare',
} as const

/** Open the bundle drawer from anywhere. No-op during SSR. */
export function openBundleTray(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(TRAY_EVENTS.bundle))
}

/** Open the compare drawer from anywhere. No-op during SSR. */
export function openCompareTray(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(TRAY_EVENTS.compare))
}

/**
 * True when the event target is somewhere the user is typing.
 *
 * Every surface that bound a single-letter shortcut wrote its own copy of
 * this, and the playground's copy was the only one that also covered the
 * CSS editor. Single-letter shortcuts are unusable without it — `b` would
 * open the bundle drawer in the middle of a word.
 */
export function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false
  const tag = t.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    t.isContentEditable
  )
}
