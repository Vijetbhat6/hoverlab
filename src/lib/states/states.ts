/**
 * The state matrix for primitives.
 *
 * A Figma component set is built from variants, and a variant is a component
 * whose NAME is `Property=Value` (several properties are comma separated:
 * `State=Hover, Theme=Light`). Figma reads that name when the user selects
 * frames and runs "Combine as Variants". So what this repo can honestly
 * ship is not a variant set but variant-READY frames: one frame per state,
 * named exactly the way Figma wants to read it.
 *
 * This module is pure. No DOM, no Playwright, no filesystem, so the crawler,
 * the build gate and the /states page all agree on the same vocabulary, and
 * a test can pin it.
 *
 * ── THE ONE RULE THAT MATTERS ───────────────────────────────────────────
 *
 * A state is "styled" only if the browser's COMPUTED style of some element
 * changed when the state was forced. Not "the SVG differed": the tracer may
 * ignore a box-shadow ring, and a focus ring that the tracer misses is still
 * a focus ring. And not "the state exists": a button with no `:focus-visible`
 * rule has a state that is forced and looks identical, which for keyboard
 * users is a WCAG 2.4.7 failure, and that is exactly what `focusDefects`
 * exists to name.
 */

export type StateId =
  | 'default'
  | 'hover'
  | 'focus'
  | 'active'
  | 'disabled'
  | 'loading'
  | 'error'
  | 'empty'
  | 'long-text'

/** How the crawler puts the page into the state. */
export type ForceMethod =
  /** Chrome DevTools Protocol `CSS.forcePseudoState`: no real pointer or key. */
  | 'pseudo'
  /** Attributes the primitive's own CSS can key on (`disabled`, `aria-*`). */
  | 'attribute'
  /** The DOM's data is rewritten (inputs cleared, text blanked or stretched). */
  | 'content'
  /** Nothing is forced. */
  | 'none'

export interface StateDef {
  id: StateId
  label: string
  /** `Property=Value`, the token Figma reads out of a component name. */
  figmaName: string
  method: ForceMethod
  /** One plain sentence: what the crawler actually does. */
  how: string
  /** The states that need something to act on (a control, an input, text). */
  needs: 'controls' | 'inputs' | 'text' | 'anything'
}

/** The Figma property every frame is named under. */
export const STATE_PROPERTY = 'State'

function def(
  id: StateId,
  label: string,
  method: ForceMethod,
  needs: StateDef['needs'],
  how: string,
): StateDef {
  return {
    id,
    label,
    figmaName: `${STATE_PROPERTY}=${figmaValue(label)}`,
    method,
    how,
    needs,
  }
}

/** `Long text` -> `Long text`; Figma allows spaces in values, not `=` or `,`. */
export function figmaValue(raw: string): string {
  return raw.replace(/[=,]/g, ' ').replace(/\s+/g, ' ').trim()
}

export const STATES: readonly StateDef[] = [
  def('default', 'Default', 'none', 'anything', 'Nothing is forced. The frame the kit already ships.'),
  def(
    'hover',
    'Hover',
    'pseudo',
    'controls',
    'CDP CSS.forcePseudoState hover on every interactive element at once.',
  ),
  def(
    'focus',
    'Focus',
    'pseudo',
    'controls',
    'CDP CSS.forcePseudoState focus and focus-visible on every interactive element at once.',
  ),
  def(
    'active',
    'Active',
    'pseudo',
    'controls',
    'CDP CSS.forcePseudoState active on every interactive element at once.',
  ),
  def(
    'disabled',
    'Disabled',
    'attribute',
    'controls',
    'disabled on native controls, aria-disabled="true" on role controls.',
  ),
  def(
    'loading',
    'Loading',
    'attribute',
    'controls',
    'aria-busy="true" and data-loading="true". Only primitives whose CSS keys on those can show it.',
  ),
  def('error', 'Error', 'attribute', 'inputs', 'aria-invalid="true" and data-invalid on form controls.'),
  def(
    'empty',
    'Empty',
    'content',
    'anything',
    'Text inputs cleared with the native value setter; leaf text replaced by the empty string.',
  ),
  def(
    'long-text',
    'Long text',
    'content',
    'text',
    'Short names get a 36-letter unbroken word; longer text grows by the IBM expansion allowance (1.3x to 3x).',
  ),
] as const

export const STATE_IDS: readonly StateId[] = STATES.map((s) => s.id)

export const STATE_BY_ID: Readonly<Record<StateId, StateDef>> = Object.fromEntries(
  STATES.map((s) => [s.id, s]),
) as Record<StateId, StateDef>

/** Every state except the untouched one. Those are the ones that get a verdict. */
export const NON_DEFAULT_STATES: readonly StateDef[] = STATES.filter((s) => s.id !== 'default')

export function isStateId(x: unknown): x is StateId {
  return typeof x === 'string' && Object.hasOwn(STATE_BY_ID, x)
}

// ── Figma variant naming ───────────────────────────────────────────────────

/**
 * The name Figma turns into variant properties.
 *
 *   variantName('hover')                         -> 'State=Hover'
 *   variantName('hover', { Size: 'Large' })      -> 'State=Hover, Size=Large'
 *
 * Extra properties keep insertion order after `State`. Names and values are
 * cleaned so they cannot break the `Property=Value, Property=Value` grammar:
 * `=` and `,` are the two characters Figma splits on.
 */
export function variantName(state: StateId, extra: Readonly<Record<string, string>> = {}): string {
  const parts = [STATE_BY_ID[state].figmaName]
  for (const [k, v] of Object.entries(extra)) {
    const key = figmaValue(k)
    const val = figmaValue(v)
    if (!key || !val) continue
    if (key === STATE_PROPERTY) continue
    parts.push(`${key}=${val}`)
  }
  return parts.join(', ')
}

/** Inverse of `variantName`: `'State=Hover, Size=Large'` -> `{ State: 'Hover', Size: 'Large' }`. */
export function parseVariantName(name: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const part of name.split(',')) {
    const i = part.indexOf('=')
    if (i < 1) continue
    const k = part.slice(0, i).trim()
    const v = part.slice(i + 1).trim()
    if (k && v) out[k] = v
  }
  return out
}

/** The state a frame name encodes, or null if it is not one of ours. */
export function stateOfName(name: string): StateId | null {
  const value = parseVariantName(name)[STATE_PROPERTY]
  if (!value) return null
  return STATES.find((s) => figmaValue(s.label) === value)?.id ?? null
}

// ── Coverage ───────────────────────────────────────────────────────────────

/**
 * `styled`      some element's computed style changed when the state was forced.
 * `not-styled`  the state could be forced and nothing changed: a real gap.
 * `n/a`         there was nothing to force it on (no control, no input, no
 *               text), or the primitive has no such state.
 */
export type Verdict = 'styled' | 'not-styled' | 'n/a'

export const VERDICTS: readonly Verdict[] = ['styled', 'not-styled', 'n/a']

export function isVerdict(x: unknown): x is Verdict {
  return x === 'styled' || x === 'not-styled' || x === 'n/a'
}

/**
 * One state's verdict from its raw result.
 *
 *   true       -> 'styled'
 *   false      -> 'not-styled'
 *   null/undef -> 'n/a'   (nothing to force it on)
 *
 * `applicable: false` wins over everything: a state with no target is n/a even
 * if a stray difference was measured.
 */
export function verdictOf(styled: boolean | null | undefined, applicable = true): Verdict {
  if (!applicable) return 'n/a'
  if (styled === null || styled === undefined) return 'n/a'
  return styled ? 'styled' : 'not-styled'
}

/** Per-state raw results in, per-state verdicts out. Missing states are n/a. `default` is always n/a. */
export function verdictsOf(
  results: Partial<Record<StateId, boolean | null>>,
): Record<StateId, Verdict> {
  const out = {} as Record<StateId, Verdict>
  for (const s of STATES) {
    out[s.id] = s.id === 'default' ? 'n/a' : verdictOf(results[s.id])
  }
  return out
}

export type CoverageMap = Readonly<Record<string, Readonly<Partial<Record<StateId, Verdict>>>>>

export interface StateTally {
  styled: number
  notStyled: number
  na: number
  /** styled + notStyled: the primitives the state applied to at all. */
  applicable: number
}

export interface CoverageSummary {
  primitives: number
  perState: Record<StateId, StateTally>
}

/** Counts per state across primitives. `default` is not tallied as anything but n/a. */
export function summarize(coverage: CoverageMap): CoverageSummary {
  const perState = {} as Record<StateId, StateTally>
  for (const s of STATES) perState[s.id] = { styled: 0, notStyled: 0, na: 0, applicable: 0 }
  const ids = Object.keys(coverage)
  for (const id of ids) {
    for (const s of STATES) {
      const v = coverage[id]?.[s.id] ?? 'n/a'
      const t = perState[s.id]
      if (v === 'styled') t.styled++
      else if (v === 'not-styled') t.notStyled++
      else t.na++
    }
  }
  for (const s of STATES) perState[s.id].applicable = perState[s.id].styled + perState[s.id].notStyled
  return { primitives: ids.length, perState }
}

// ── Focus defects (WCAG 2.4.7 Focus Visible) ──────────────────────────────

/** What the crawler knows about one interactive element. */
export interface ControlCensus {
  /** A short, human-readable handle: `button "Save"`, `input[type=text]`. */
  label: string
  /** True when the element (or a wrapper painting its ring) changed on focus. */
  focusStyled: boolean
  hoverStyled?: boolean
  activeStyled?: boolean
  /** Elements the page itself hides do not need an indicator. */
  hidden?: boolean
}

export interface FocusDefect {
  primitive: string
  control: string
}

/**
 * Controls with NO visible focus indicator. A keyboard user who tabs onto one
 * cannot see where they are: WCAG 2.4.7. Hidden controls are skipped, and a
 * control is a defect only when it is clearly not styled (`focusStyled ===
 * false`), never when the measurement is simply absent.
 */
export function focusDefects(
  controlsByPrimitive: Readonly<Record<string, readonly ControlCensus[]>>,
): FocusDefect[] {
  const out: FocusDefect[] = []
  for (const id of Object.keys(controlsByPrimitive).sort()) {
    for (const c of controlsByPrimitive[id]) {
      if (c.hidden) continue
      if (c.focusStyled === false) out.push({ primitive: id, control: c.label })
    }
  }
  return out
}

/** Group defects by primitive id, keeping input order within each. */
export function groupDefects(defects: readonly FocusDefect[]): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const d of defects) (out[d.primitive] ??= []).push(d.control)
  return out
}
