/**
 * Apply a stress condition to the live document.
 *
 * Browser-only. The frame calls this after hydration, and the harness never
 * calls it directly: it loads `?stress=<id>` and lets the frame do the work,
 * so what was measured is exactly what a viewer sees.
 *
 * ── WHAT IS TRANSFORMED, AND WHAT IS NOT ────────────────────────────────
 *
 * Text nodes inside `<main>` only. Code, pre, kbd and samp are skipped
 * because their content is not language (a stress that "translated" a shell
 * command would report a defect that no user could ever meet), and so are
 * scripts, styles and form values.
 *
 * The data stresses (long names, empty data) are narrower still. They leave
 * controls and static labels alone (a button that says "Save" is copy, not
 * a database row) and act on the leaf text that stands in for data: card
 * titles, names, table cells, list items.
 */

import type { Stress, StressId } from './conditions'
import { cjkText, emptyText, expandText, hugeNumbers, longName } from './pseudo'

/** Text that is not natural language, or not visible copy at all. */
const NEVER = 'script, style, noscript, code, pre, kbd, samp, textarea, svg, [data-stress-ignore]'

/**
 * Static UI copy: labels and controls. The data stresses do not touch it.
 * So are h1 and h2, which name a page or a section rather than a record: a
 * blanked hero headline is a test artefact, a blanked card title (h3 and
 * below) is a database row with a missing field.
 * Links are here too, because a link in a card is far more often "Read
 * more" than a user's name, and blanking it would report a defect that is
 * really a test artefact.
 */
const STATIC_COPY =
  'button, a, label, legend, th, summary, option, nav, header, footer, h1, h2, [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="switch"], [role="checkbox"], [role="radio"], [role="link"]'

type NodeRule = (text: string, parent: Element) => string

const RULES: Partial<Record<NonNullable<Stress['transform']>, NodeRule>> = {
  expand: (text) => expandText(text),
  cjk: (text) => cjkText(text),
  'huge-numbers': (text) => hugeNumbers(text),
  'long-names': (text, parent) => (parent.closest(STATIC_COPY) ? text : longName(text)),
  'empty-data': (text, parent) => (parent.closest(STATIC_COPY) ? text : emptyText(text)),
}

/** Text nodes only count as data if they are the leaf of their element. */
function isLeafText(node: Text): boolean {
  const parent = node.parentElement
  return !!parent && parent.children.length === 0
}

function transformText(root: Element, transform: NonNullable<Stress['transform']>): number {
  const rule = RULES[transform]
  if (!rule) return 0

  const dataOnly = transform === 'long-names' || transform === 'empty-data'
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  for (let node = walker.nextNode(); node; node = walker.nextNode()) nodes.push(node as Text)

  let changed = 0
  for (const node of nodes) {
    const parent = node.parentElement
    if (!parent || parent.closest(NEVER)) continue
    if (dataOnly && !isLeafText(node)) continue
    const before = node.nodeValue ?? ''
    if (before.trim() === '') continue
    const after = rule(before, parent)
    if (after !== before) {
      node.nodeValue = after
      changed += 1
    }
  }
  return changed
}

/**
 * Force the theme class. next-themes owns it and re-asserts it on its own
 * schedule, so the class is watched and put back if it drifts. The matrix
 * has to show the same theme in every frame regardless of the viewer's own
 * setting, or "dark" would be a stress only for people already in light.
 */
function forceTheme(theme: Stress['theme']): () => void {
  const html = document.documentElement
  const set = () => {
    const wanted = theme === 'dark'
    if (html.classList.contains('dark') !== wanted) html.classList.toggle('dark', wanted)
    if (html.classList.contains('light') === wanted) html.classList.toggle('light', !wanted)
    // Written only on a real change: this callback is triggered by `style`
    // mutations, so an unconditional write would re-trigger itself.
    if (html.style.colorScheme !== theme) html.style.colorScheme = theme
  }
  set()
  const observer = new MutationObserver(set)
  observer.observe(html, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

export interface AppliedStress {
  /** Text nodes rewritten, so the harness can tell "nothing to stress" from "passed". */
  changed: number
  dispose: () => void
}

/**
 * Apply `stress` to the document. `stressId` is `base`, `base-640` or
 * `base-320` for the untouched reference runs, which still force the theme
 * so the baseline does not depend on the viewer's own.
 */
export function applyStress(stressId: StressId | 'base' | 'base-640' | 'base-320', stress: Stress | null): AppliedStress {
  const disposers: Array<() => void> = []
  const html = document.documentElement
  const main = document.querySelector('main')

  disposers.push(forceTheme(stress?.theme ?? 'light'))

  if (stress && stress.rootFontPercent !== 100) {
    html.style.fontSize = `${stress.rootFontPercent}%`
  }

  if (stress?.dir === 'rtl') {
    main?.setAttribute('dir', 'rtl')
  }

  let changed = 0
  if (stress?.transform && main) changed = transformText(main, stress.transform)

  html.dataset.stressApplied = stressId

  return {
    changed,
    dispose: () => {
      for (const dispose of disposers) dispose()
      html.style.fontSize = ''
      delete html.dataset.stressApplied
    },
  }
}
