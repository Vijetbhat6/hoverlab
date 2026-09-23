/**
 * Forcing a state and reading back whether the browser painted a difference.
 *
 * Shared by the fixture test (`scripts/test-figma-states.mts`) and the crawler
 * (`scripts/build-figma-states.mts`) so the mechanism that is PROVEN is the
 * mechanism that is USED. Playwright is a type-only import here: this file
 * takes a page and a CDP session and never launches anything.
 *
 * ── HOW EACH STATE IS FORCED ────────────────────────────────────────────
 *
 *   hover / focus / active   Chrome DevTools Protocol `CSS.forcePseudoState`.
 *                            No real pointer, no real key: a real press
 *                            closes popovers, and a real focus can scroll.
 *   disabled                 `disabled` on native controls, aria-disabled on
 *                            role controls (plus Radix's `data-disabled`).
 *   error                    aria-invalid="true" and data-invalid.
 *   loading                  aria-busy="true" and data-loading="true".
 *   empty                    text inputs cleared through the NATIVE value
 *                            setter (so React sees the change), leaf text
 *                            blanked with `emptyText`.
 *   long-text                leaf text stretched with `longName`/`expandText`
 *                            from the stress module (imported read-only).
 *
 * ── HOW COVERAGE IS DECIDED ─────────────────────────────────────────────
 *
 * From COMPUTED STYLES, never from the SVG the tracer draws. The tracer may
 * ignore a box-shadow ring, and a ring the tracer misses is still a ring.
 * For every interactive element (and up to three wrappers above it, since
 * `focus-within` rings are painted by the wrapper) a census of visible
 * properties is taken before and after; the state is styled when any of them
 * differs. Content states use geometry instead, see `judgeContent`.
 *
 * Transitions are switched off first, so "after" is the end state and not a
 * frame from the middle of a 150ms colour fade.
 */

import type { CDPSession, Page } from 'playwright'

import { expandText, emptyText, longName } from '../stress/pseudo.ts'
import type { ControlCensus, StateId } from './states.ts'

export const CONTROL_SELECTOR = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  '[role=button]',
  '[role=tab]',
  '[role=switch]',
  '[role=checkbox]',
  '[role=radio]',
  '[role=combobox]',
  '[role=slider]',
  '[tabindex]',
].join(', ')

/** The computed properties a keyboard or mouse user can see change. */
export const CENSUS_PROPS = [
  'outline-style',
  'outline-width',
  'outline-color',
  'outline-offset',
  'box-shadow',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'background-color',
  'color',
  'opacity',
  'transform',
  'text-decoration-line',
  'filter',
] as const

export type Props = Record<string, string>

export interface CensusRow {
  index: number
  label: string
  tag: string
  /** Rendered, not aria-hidden, not tabindex=-1 on a non-control. */
  visible: boolean
  /** Natively disabled or aria-disabled: cannot take focus. */
  disabled: boolean
  own: Props
  /** Up to three wrappers, innermost first, never the scope itself. */
  wrap: Props[]
}

export interface Geometry {
  width: number
  height: number
  /** Elements that spill sideways out of their own box with nothing clipping them. */
  leaks: number
  /** The whole page scrolls sideways. */
  pageOverflow: boolean
  textNodes: number
  textInputs: number
  formControls: number
  controls: number
}

export interface Applied {
  /** False when there was nothing to force the state on. */
  applicable: boolean
  note?: string
}

export interface Prepared {
  page: Page
  cdp: CDPSession
  scope: string
  controls: number
}

// ── Setup ──────────────────────────────────────────────────────────────────

/** Once per page load: transitions off, controls tagged, CDP domains on. */
export async function prepare(
  page: Page,
  cdp: CDPSession,
  scope: string,
): Promise<Prepared> {
  const controls = await page.evaluate(
    ({ scope, selector }) => {
      const root = document.querySelector(scope)
      if (!root) return -1
      const style = document.createElement('style')
      style.setAttribute('data-hl-states', '')
      style.textContent =
        '*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important}'
      document.head.appendChild(style)

      const nativeControl =
        'button,a[href],input,select,textarea,[role=button],[role=tab],[role=switch],[role=checkbox],[role=radio],[role=combobox],[role=slider]'
      let n = 0
      for (const el of Array.from(root.querySelectorAll<HTMLElement>(selector))) {
        // A tabindex=-1 container is a programmatic focus target, not a control.
        if (el.getAttribute('tabindex') === '-1' && !el.matches(nativeControl)) continue
        if (el.closest('[aria-hidden="true"]')) continue
        if (el.getAttribute('type') === 'hidden') continue
        el.setAttribute('data-hl-c', String(n))
        n++
        let up: HTMLElement | null = el.parentElement
        for (let depth = 0; depth < 3 && up && up !== root; depth++, up = up.parentElement) {
          up.setAttribute('data-hl-w', '')
        }
      }
      return n
    },
    { scope, selector: CONTROL_SELECTOR },
  )
  if (controls < 0) throw new Error(`scope not found: ${scope}`)
  await cdp.send('DOM.enable')
  await cdp.send('CSS.enable')
  return { page, cdp, scope, controls }
}

// ── Census ─────────────────────────────────────────────────────────────────

export async function census(p: Prepared): Promise<CensusRow[]> {
  return p.page.evaluate(
    ({ scope, props }) => {
      const root = document.querySelector(scope)
      if (!root) return []
      const read = (el: Element): Record<string, string> => {
        const cs = getComputedStyle(el)
        const out: Record<string, string> = {}
        for (const name of props) out[name] = cs.getPropertyValue(name)
        return out
      }
      const label = (el: HTMLElement): string => {
        const tag = el.tagName.toLowerCase()
        const role = el.getAttribute('role')
        const kind = role ?? (tag === 'input' ? `input[type=${(el as HTMLInputElement).type}]` : tag)
        const raw =
          el.getAttribute('aria-label') ??
          (el.textContent ?? '').replace(/\s+/g, ' ').trim() ??
          ''
        const name = (raw || el.getAttribute('placeholder') || el.getAttribute('name') || '').slice(0, 28)
        return name ? `${kind} "${name}"` : kind
      }
      const rows: unknown[] = []
      for (const el of Array.from(root.querySelectorAll<HTMLElement>('[data-hl-c]'))) {
        const rect = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        const visible =
          rect.width > 0 && rect.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'
        const wrap: Record<string, string>[] = []
        let up: HTMLElement | null = el.parentElement
        for (let depth = 0; depth < 3 && up && up !== root; depth++, up = up.parentElement) {
          wrap.push(read(up))
        }
        rows.push({
          index: Number(el.getAttribute('data-hl-c')),
          label: label(el),
          tag: el.tagName.toLowerCase(),
          visible,
          disabled:
            (el as HTMLButtonElement).disabled === true ||
            el.getAttribute('aria-disabled') === 'true',
          own: read(el),
          wrap,
        })
      }
      return rows
    },
    { scope: p.scope, props: [...CENSUS_PROPS] },
  ) as Promise<CensusRow[]>
}

/** Names of the properties that differ between two property maps. */
export function changedProps(a: Props, b: Props): string[] {
  return Object.keys(a).filter((k) => a[k] !== b[k])
}

export interface ControlDiff {
  index: number
  label: string
  own: string[]
  wrap: string[]
  styled: boolean
}

/** Per-control diff of two censuses taken on the same tagged page. */
export function diffCensus(before: readonly CensusRow[], after: readonly CensusRow[]): ControlDiff[] {
  const byIndex = new Map(after.map((r) => [r.index, r]))
  const out: ControlDiff[] = []
  for (const b of before) {
    const a = byIndex.get(b.index)
    if (!a) continue
    const own = changedProps(b.own, a.own)
    const wrap = b.wrap.flatMap((w, i) => (a.wrap[i] ? changedProps(w, a.wrap[i]) : []))
    out.push({ index: b.index, label: b.label, own, wrap, styled: own.length > 0 || wrap.length > 0 })
  }
  return out
}

// ── Forcing ────────────────────────────────────────────────────────────────

interface PseudoGroup {
  selector: string
  classes: string[]
}

/**
 * One `DOM.getDocument`, one pass. Requesting the document a second time
 * throws away the node bindings the forced states hang on, so every group is
 * resolved from the same document and a node in two groups gets the union.
 */
async function forcePseudo(p: Prepared, groups: PseudoGroup[]): Promise<number> {
  const { root } = await p.cdp.send('DOM.getDocument', { depth: -1 })
  const scope = await p.cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: p.scope })
  if (!scope.nodeId) return 0
  const forced = new Map<number, Set<string>>()
  for (const g of groups) {
    const { nodeIds } = await p.cdp.send('DOM.querySelectorAll', {
      nodeId: scope.nodeId,
      selector: g.selector,
    })
    for (const nodeId of nodeIds) {
      const set = forced.get(nodeId) ?? new Set<string>()
      for (const c of g.classes) set.add(c)
      forced.set(nodeId, set)
    }
  }
  for (const [nodeId, classes] of forced) {
    await p.cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [...classes] })
  }
  return forced.size
}

/** Put the page into `state`. Untouched for `default`. */
export async function applyState(p: Prepared, state: StateId): Promise<Applied> {
  switch (state) {
    case 'default':
      return { applicable: true }

    case 'hover':
    case 'active': {
      if (p.controls === 0) return { applicable: false, note: 'no interactive element' }
      await forcePseudo(p, [{ selector: '[data-hl-c]', classes: [state] }])
      return { applicable: true }
    }

    case 'focus': {
      if (p.controls === 0) return { applicable: false, note: 'no interactive element' }
      // A ring painted by the wrapper (`:focus-within`) is still a focus ring.
      await forcePseudo(p, [
        { selector: '[data-hl-c]', classes: ['focus', 'focus-visible'] },
        { selector: '[data-hl-w]', classes: ['focus-within'] },
      ])
      return { applicable: true }
    }

    case 'disabled': {
      const n = await p.page.evaluate((scope) => {
        let count = 0
        const root = document.querySelector(scope)
        for (const el of Array.from(root?.querySelectorAll<HTMLElement>('[data-hl-c]') ?? [])) {
          if ('disabled' in el && el.matches('button,input,select,textarea')) {
            ;(el as HTMLButtonElement).disabled = true
          } else {
            el.setAttribute('aria-disabled', 'true')
          }
          el.setAttribute('data-disabled', '')
          count++
        }
        return count
      }, p.scope)
      return n > 0 ? { applicable: true } : { applicable: false, note: 'no interactive element' }
    }

    case 'loading': {
      const n = await p.page.evaluate((scope) => {
        let count = 0
        const root = document.querySelector(scope)
        for (const el of Array.from(root?.querySelectorAll<HTMLElement>('[data-hl-c]') ?? [])) {
          el.setAttribute('aria-busy', 'true')
          el.setAttribute('data-loading', 'true')
          count++
        }
        return count
      }, p.scope)
      return n > 0 ? { applicable: true } : { applicable: false, note: 'no interactive element' }
    }

    case 'error': {
      const n = await p.page.evaluate((scope) => {
        let count = 0
        const root = document.querySelector(scope)
        const formish =
          'input:not([type=hidden]),select,textarea,[role=combobox],[role=checkbox],[role=radio],[role=switch],[role=slider],[role=textbox]'
        for (const el of Array.from(root?.querySelectorAll<HTMLElement>('[data-hl-c]') ?? [])) {
          if (!el.matches(formish)) continue
          el.setAttribute('aria-invalid', 'true')
          el.setAttribute('data-invalid', 'true')
          count++
        }
        return count
      }, p.scope)
      return n > 0 ? { applicable: true } : { applicable: false, note: 'no form control' }
    }

    case 'empty':
    case 'long-text':
      return applyContent(p, state)
  }
}


async function applyContent(p: Prepared, state: 'empty' | 'long-text'): Promise<Applied> {
  // Inputs first: the `input` event may re-render a component, and re-rendering
  // must happen before leaf text is rewritten so React cannot put it back.
  const values = await p.page.evaluate((scope) => {
    const root = document.querySelector(scope)
    const out: string[] = []
    for (const el of Array.from(root?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea') ?? [])) {
      const t = (el as HTMLInputElement).type
      if (el.tagName === 'INPUT' && !['text', 'search', 'email', 'url', 'tel', 'password', ''].includes(t)) {
        out.push('\u0000skip')
      } else {
        out.push(el.value)
      }
    }
    return out
  }, p.scope)

  const nextValues = values.map((v) => {
    if (v === '\u0000skip') return v
    if (state === 'empty') return ''
    return v === '' ? v : expandText(v)
  })
  await p.page.evaluate(
    ({ scope, next }) => {
      const root = document.querySelector(scope)
      const els = Array.from(root?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea') ?? [])
      els.forEach((el, i) => {
        if (next[i] === '\u0000skip') return
        const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
        setter?.call(el, next[i])
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
      })
    },
    { scope: p.scope, next: nextValues },
  )
  await p.page.waitForTimeout(80)

  const texts = await p.page.evaluate((scope) => {
    const root = document.querySelector(scope)
    const out: string[] = []
    if (!root) return out
    const skip = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'OPTION', 'TEXTAREA', 'TITLE'])
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let node: Node | null = walker.nextNode()
    while (node) {
      const parent = node.parentElement
      const t = node.nodeValue ?? ''
      if (t.trim() && parent && !skip.has(parent.tagName) && !parent.closest('svg,[aria-hidden="true"]')) {
        out.push(t)
        parent.setAttribute('data-hl-t', 'y')
      } else out.push('\u0000skip')
      node = walker.nextNode()
    }
    return out
  }, p.scope)

  const nextTexts = texts.map((t) => {
    if (t === '\u0000skip') return t
    if (state === 'empty') return emptyText(t)
    const named = longName(t)
    return named !== t ? named : expandText(t)
  })
  await p.page.evaluate(
    ({ scope, next }) => {
      const root = document.querySelector(scope)
      if (!root) return
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      let node: Node | null = walker.nextNode()
      let i = 0
      while (node) {
        if (next[i] !== '\u0000skip') node.nodeValue = next[i]
        i++
        node = walker.nextNode()
      }
    },
    { scope: p.scope, next: nextTexts },
  )

  const anyText = texts.some((t) => t !== '\u0000skip')
  const anyInput = nextValues.some((v) => v !== '\u0000skip')
  if (state === 'empty' && !anyText && !anyInput) return { applicable: false, note: 'no text or input' }
  if (state === 'long-text' && !anyText && !anyInput) return { applicable: false, note: 'no text' }
  return { applicable: true }
}

// ── Judging ────────────────────────────────────────────────────────────────

export async function geometry(p: Prepared): Promise<Geometry> {
  return p.page.evaluate((scope) => {
    const root = document.querySelector(scope) as HTMLElement | null
    if (!root) return { width: 0, height: 0, leaks: 0, pageOverflow: false, textNodes: 0, textInputs: 0, formControls: 0, controls: 0 }
    const box = root.getBoundingClientRect()
    let leaks = 0
    // The box that matters is the union of what actually renders inside the
    // scope. The scope's own box includes padding and margins that stay put
    // when every word disappears.
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    const all = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))]
    for (const el of all) {
      const r = el.getBoundingClientRect()
      if (el !== root && r.width > 0 && r.height > 0) {
        minX = Math.min(minX, r.left)
        minY = Math.min(minY, r.top)
        maxX = Math.max(maxX, r.right)
        maxY = Math.max(maxY, r.bottom)
      }
      // Text spilling out of its own box: overflow left visible, and the
      // content is wider than the box that is supposed to hold it.
      const cs = getComputedStyle(el)
      if (cs.overflowX === 'visible' && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1) {
        leaks++
        continue
      }
      if (el === root || r.width === 0 || r.height === 0) continue
      if (r.right <= box.right + 1 && r.left >= box.left - 1) continue
      // Clipped or scrolled by an ancestor (scope included): not a leak.
      let clipped = false
      for (let up: HTMLElement | null = el.parentElement; up; up = up.parentElement) {
        if (getComputedStyle(up).overflowX !== 'visible') {
          clipped = true
          break
        }
        if (up === root) break
      }
      if (!clipped) leaks++
    }
    const de = document.documentElement
    const text = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let textNodes = 0
    for (let n = text.nextNode(); n; n = text.nextNode()) if ((n.nodeValue ?? '').trim()) textNodes++
    return {
      width: maxX > minX ? maxX - minX : 0,
      height: maxY > minY ? maxY - minY : 0,
      leaks,
      pageOverflow: de.scrollWidth > de.clientWidth + 1,
      textNodes,
      textInputs: root.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=range]),textarea').length,
      formControls: root.querySelectorAll('input,select,textarea,[role=combobox],[role=checkbox],[role=radio],[role=switch],[role=slider]').length,
      controls: root.querySelectorAll('[data-hl-c]').length,
    }
  }, p.scope)
}

/**
 * Verdict for an interactive state: did ANY tagged element (or its wrappers)
 * change a visible computed property?
 */
export function judgeInteractive(before: readonly CensusRow[], after: readonly CensusRow[]): boolean {
  return diffCensus(before, after).some((d) => d.styled)
}

/**
 * Verdict for a content state. Heuristic, and said so on /states.
 *
 *   long-text  handled when nothing sticks out sideways that no ancestor
 *              clips, and the page does not gain a horizontal scrollbar.
 *   empty      handled when the box does not collapse to under 40% of its
 *              area (a placeholder or an empty-state affordance is holding
 *              it open) or when some control changed its computed style.
 */
export function judgeContent(
  state: 'empty' | 'long-text',
  before: Geometry,
  after: Geometry,
  styleChanged: boolean,
): boolean {
  if (state === 'long-text') {
    const newLeaks = after.leaks - before.leaks
    return newLeaks <= 0 && !(after.pageOverflow && !before.pageOverflow)
  }
  if (styleChanged) return true
  const a0 = before.width * before.height
  const a1 = after.width * after.height
  return a0 === 0 ? true : a1 / a0 >= 0.4
}

export interface StateResult {
  applicable: boolean
  /** null when not applicable. */
  styled: boolean | null
  controls: ControlDiff[]
  /** The census taken before the state was forced (visibility, disabled). */
  rows: CensusRow[]
  /** The scope's shape before the state was forced. */
  geometry: Geometry
  note?: string
}

/**
 * The whole per-state pass on an ALREADY prepared, freshly loaded page:
 * census, force, wait for style recalc, census, judge.
 *
 * `held` runs while the state is still forced, which is where the crawler
 * presses "Copy for Figma": the tracer reads computed styles, so it has to
 * run before anything lets go of the state.
 */
export async function measureState(
  p: Prepared,
  state: StateId,
  held?: () => Promise<void>,
): Promise<StateResult> {
  const before = await census(p)
  const geoBefore = await geometry(p)
  const applied = await applyState(p, state)
  if (!applied.applicable) {
    return { applicable: false, styled: null, controls: [], rows: before, geometry: geoBefore, note: applied.note }
  }
  await p.page.waitForTimeout(60)
  const after = await census(p)
  if (held) await held()
  const controls = diffCensus(before, after)
  const styleChanged = controls.some((c) => c.styled)
  if (state === 'empty' || state === 'long-text') {
    const geoAfter = await geometry(p)
    return {
      applicable: true,
      styled: judgeContent(state, geoBefore, geoAfter, styleChanged),
      controls,
      rows: before,
      geometry: geoBefore,
    }
  }
  return { applicable: true, styled: styleChanged, controls, rows: before, geometry: geoBefore }
}

/** Controls as the pure `focusDefects` finder wants them. */
export function toControlCensus(
  focus: readonly ControlDiff[],
  hover: readonly ControlDiff[],
  active: readonly ControlDiff[],
  rows: readonly CensusRow[],
): ControlCensus[] {
  const h = new Map(hover.map((d) => [d.index, d.styled]))
  const a = new Map(active.map((d) => [d.index, d.styled]))
  const meta = new Map(rows.map((r) => [r.index, r]))
  return focus.map((d) => {
    const m = meta.get(d.index)
    return {
      label: d.label,
      focusStyled: d.styled,
      hoverStyled: h.get(d.index),
      activeStyled: a.get(d.index),
      // A disabled control cannot take focus, so it owes no ring.
      hidden: !(m?.visible ?? true) || (m?.disabled ?? false),
    }
  })
}
