/**
 * The stress conditions a block, page or primitive is tested under.
 *
 * ── WHAT THIS IS FOR ────────────────────────────────────────────────────
 *
 * Every catalog in this category is demoed on its happy path: English
 * copy, a laptop viewport, light theme, a tidy name and a round number.
 * Real products meet German button labels, a 320px reflow, a user who set
 * their text to 200%, Windows high-contrast, a vestibular disorder, Arabic,
 * a name that is 60 characters with no spaces, and a database row with
 * nothing in it. This file is the list of those conditions, in one place,
 * so that four things agree about them: the harness that measures, the
 * frame that applies them, the page that shows them side by side, and the
 * gate that keeps the report honest.
 *
 * ── SIX FAMILIES, ELEVEN CONDITIONS ─────────────────────────────────────
 *
 * The public claim is "verified under six stresses". Those six are the
 * FAMILIES; a family can hold more than one condition because they are not
 * the same experiment (German grows text, Japanese removes the spaces).
 * A family passes only when all of its conditions pass, and the copy that
 * makes the claim has to count families, not conditions, or it is quietly
 * a different sentence.
 *
 * ── ONE DEFINITION, TWO CONSUMERS ───────────────────────────────────────
 *
 * The frame (`?stress=<id>` on /preview/...) applies a condition in the
 * browser, and the harness loads that same URL. There is deliberately no
 * second implementation inside the harness: a viewer who opens the frame
 * sees exactly what was measured. Two implementations would agree until
 * the day one of them was edited.
 *
 * `STRESS_VERSION` is bumped when a condition or a check changes meaning.
 * The gate treats a report written under an older version as stale, because
 * "passed the old test" is not evidence about the new one.
 */

export const STRESS_VERSION = 1

export type StressLevel = 'primitive' | 'block' | 'page'

export const STRESS_LEVELS: readonly StressLevel[] = ['primitive', 'block', 'page']

export type StressFamilyId =
  | 'pseudo-locale'
  | 'text-scale'
  | 'forced-colors'
  | 'reduced-motion'
  | 'direction-theme'
  | 'data-extremes'

export type StressId =
  | 'expand'
  | 'cjk'
  | 'text-200'
  | 'reflow-400'
  | 'forced-colors'
  | 'reduced-motion'
  | 'rtl'
  | 'dark'
  | 'long-names'
  | 'empty-data'
  | 'huge-numbers'

/** What the frame does to the text of the artifact. */
export type TextTransform = 'expand' | 'cjk' | 'long-names' | 'empty-data' | 'huge-numbers'

/**
 * The run every condition is compared against.
 *
 *   `base`      1024 wide, LTR, light: the shared "laptop" reference.
 *   `base-640`  the same at 640, the width a 200% text setting behaves as.
 *   `base-320`  the same at 320, the width 400% zoom behaves as.
 *
 * A condition is judged on what it ADDS relative to its baseline, never on
 * absolute state. A carousel that overflows its own clip box at 1024 is not
 * a German-text defect, and a report that blames it for one teaches nobody
 * to read the report.
 */
export type BaselineId = 'base' | 'base-640' | 'base-320'

export interface Viewport {
  width: number
  height: number
}

export interface StressFamily {
  id: StressFamilyId
  label: string
  /** Why a designer should care, in one sentence. */
  why: string
}

export interface Stress {
  id: StressId
  family: StressFamilyId
  label: string
  /** What is done to the artifact, plainly. */
  summary: string
  /** The WCAG criterion this maps to, where there is one. */
  wcag?: string
  viewport: Viewport
  theme: 'light' | 'dark'
  dir: 'ltr' | 'rtl'
  /** Root font size as a percentage; 100 is the browser default. */
  rootFontPercent: number
  transform?: TextTransform
  /** Browser media emulation. Only the harness can do these. */
  forcedColors?: boolean
  reducedMotion?: boolean
  baseline: BaselineId | null
  /**
   * Can the frame reproduce this in a page? Forced-colors and
   * reduced-motion are media features a page cannot switch on itself, so
   * they are measured by the harness and shown as a result, not a frame.
   */
  live: boolean
}

export const DESKTOP: Viewport = { width: 1024, height: 768 }

export const STRESS_FAMILIES: readonly StressFamily[] = [
  {
    id: 'pseudo-locale',
    label: 'Pseudo-localisation',
    why: 'German runs about a third longer than English, and Japanese has no spaces to wrap on.',
  },
  {
    id: 'text-scale',
    label: 'Text scale and reflow',
    why: 'People set their text to 200% and zoom to 400%; content must neither clip nor scroll sideways.',
  },
  {
    id: 'forced-colors',
    label: 'Forced colors',
    why: 'Windows high-contrast throws away background colours, so anything drawn with one alone disappears.',
  },
  {
    id: 'reduced-motion',
    label: 'Reduced motion',
    why: 'An endless animation is the trigger the preference exists to remove.',
  },
  {
    id: 'direction-theme',
    label: 'RTL and dark',
    why: 'Right-to-left readers and dark-theme users are both the majority somewhere.',
  },
  {
    id: 'data-extremes',
    label: 'Data extremes',
    why: 'A 60-character surname, a row with nothing in it and a number with ten digits are all normal data.',
  },
]

const base = {
  viewport: DESKTOP,
  theme: 'light' as const,
  dir: 'ltr' as const,
  rootFontPercent: 100,
}

export const STRESSES: readonly Stress[] = [
  {
    ...base,
    id: 'expand',
    family: 'pseudo-locale',
    label: 'German-length text',
    summary:
      'Every string is lengthened by the IBM expansion table (short strings double, long ones grow about 30%) and accented.',
    transform: 'expand',
    baseline: 'base',
    live: true,
  },
  {
    ...base,
    id: 'cjk',
    family: 'pseudo-locale',
    label: 'Japanese text',
    summary:
      'Words are replaced by CJK characters with no spaces, so lines wrap between any two characters.',
    transform: 'cjk',
    baseline: 'base',
    live: true,
  },
  {
    ...base,
    id: 'text-200',
    family: 'text-scale',
    label: '200% text size',
    summary:
      'Root text size doubled at a 640px window, which is how a 1280px window behaves with text set to 200%.',
    wcag: '1.4.4 Resize Text',
    viewport: { width: 640, height: 768 },
    rootFontPercent: 200,
    baseline: 'base-640',
    live: true,
  },
  {
    ...base,
    id: 'reflow-400',
    family: 'text-scale',
    label: '400% zoom reflow',
    summary: 'A 320px-wide window: the page must not need to scroll sideways.',
    wcag: '1.4.10 Reflow',
    viewport: { width: 320, height: 640 },
    baseline: null,
    live: true,
  },
  {
    ...base,
    id: 'forced-colors',
    family: 'forced-colors',
    label: 'Forced colors',
    summary:
      'Windows high-contrast emulation. Shapes and control boundaries drawn with a background colour alone are lost.',
    wcag: '1.4.11 Non-text Contrast',
    forcedColors: true,
    baseline: 'base',
    live: false,
  },
  {
    ...base,
    id: 'reduced-motion',
    family: 'reduced-motion',
    label: 'Reduced motion',
    summary:
      'prefers-reduced-motion is on and the site’s own global override is off, so the artifact’s own handling is what runs.',
    wcag: '2.3.3 Animation from Interactions',
    reducedMotion: true,
    baseline: 'base',
    live: false,
  },
  {
    ...base,
    id: 'rtl',
    family: 'direction-theme',
    label: 'Right-to-left',
    summary: 'The document direction is rtl, as it is for Arabic, Hebrew, Persian and Urdu.',
    dir: 'rtl',
    baseline: 'base',
    live: true,
  },
  {
    ...base,
    id: 'dark',
    family: 'direction-theme',
    label: 'Dark theme',
    summary: 'The dark palette, checked for text that no longer meets contrast.',
    wcag: '1.4.3 Contrast (Minimum)',
    theme: 'dark',
    baseline: 'base',
    live: true,
  },
  {
    ...base,
    id: 'long-names',
    family: 'data-extremes',
    label: 'Very long names',
    summary: 'Short data strings gain a 36-character word with no break opportunity.',
    transform: 'long-names',
    baseline: 'base',
    live: true,
  },
  {
    ...base,
    id: 'empty-data',
    family: 'data-extremes',
    label: 'Empty data',
    summary:
      'Data text is blanked, as when a field is missing. Checked for headings and fields left with no accessible content.',
    transform: 'empty-data',
    baseline: 'base',
    live: true,
  },
  {
    ...base,
    id: 'huge-numbers',
    family: 'data-extremes',
    label: 'Huge numbers',
    summary: 'Every number gains six more digits with separators: $4,200 becomes $4,200,000,000.',
    transform: 'huge-numbers',
    baseline: 'base',
    live: true,
  },
]

export const STRESS_BY_ID: Readonly<Record<StressId, Stress>> = Object.fromEntries(
  STRESSES.map((stress) => [stress.id, stress]),
) as Record<StressId, Stress>

export const FAMILY_BY_ID: Readonly<Record<StressFamilyId, StressFamily>> = Object.fromEntries(
  STRESS_FAMILIES.map((family) => [family.id, family]),
) as Record<StressFamilyId, StressFamily>

export function stressesInFamily(family: StressFamilyId): Stress[] {
  return STRESSES.filter((stress) => stress.family === family)
}

/** The query value the frame reads. `base` is the untouched reference run. */
export type FrameStress = StressId | 'base' | 'base-640' | 'base-320'

/**
 * The shape of each baseline run, so the harness and the viewer construct
 * the same reference. A baseline is a viewport and nothing else.
 */
export const BASELINE_VIEWPORT: Readonly<Record<BaselineId, Viewport>> = {
  base: DESKTOP,
  'base-640': { width: 640, height: 768 },
  'base-320': { width: 320, height: 640 },
}

export function isFrameStress(value: string | null): value is FrameStress {
  if (!value) return false
  return value in STRESS_BY_ID || value in BASELINE_VIEWPORT
}

export function framePath(level: StressLevel, slug: string, stress: FrameStress): string {
  const dir = stress === 'rtl' ? '&dir=rtl' : ''
  return `/preview/${level}/${slug}?stress=${stress}${dir}`
}

/** Key a result is filed under, shared by the harness, report and page. */
export function artifactKey(level: StressLevel, id: string): string {
  return `${level}:${id}`
}

export function isStressLevel(value: string): value is StressLevel {
  return (STRESS_LEVELS as readonly string[]).includes(value)
}
