/**
 * Primitive taxonomy and types — the rung between effects and blocks.
 *
 * A primitive is one control: the thing a form is assembled from, not the
 * form. Where a block answers "what goes in this part of the page", a
 * primitive answers "what goes in this part of the form".
 *
 * WHY THIS TIER EXISTS AND WHAT IT IS NOT
 *
 * It is not a component library. shadcn/ui already installed a Button, an
 * Input and a Select into the visitor's project, and shipping a second one
 * would be worse than shipping none. What is missing is everything
 * *around* those: a button group with the rounding and border-collapsing
 * right, an input with an addon on each side, a field that puts a label, a
 * hint, an error and the aria wiring in one place, a segmented control, a
 * verification code input that handles paste. Every one of those is
 * rebuilt by hand in nearly every project, badly, and none of them are in
 * anybody's base library.
 *
 * That is also why these depend on nothing. A primitive that imports
 * `@/components/ui/button` only works in a project that has shadcn set up
 * exactly the way this repo does; a primitive that is plain HTML and
 * Tailwind works everywhere, including inside a shadcn project, and can be
 * edited by whoever pastes it. `lucide-react` is the single exception, for
 * the ones that genuinely need a glyph.
 *
 * DATA-FREE, like `effect-types.ts` and `block-types.ts`: the taxonomy and
 * the types travel to the client without the sources coming with them.
 */

import type { Artifact, ArtifactFile } from '../artifact-types'
import { toSlug } from '../artifact-types'

/* ------------------------------------------------------------------ *
 *  Categories
 * ------------------------------------------------------------------ */

/**
 * Eight groups, ordered by how often the thing is missing from a real app.
 *
 * That ordering is the brief this tier was built from, and it is worth
 * keeping visible: the list is not "every small component", it is the
 * components teams rebuild because nothing ships them.
 */
export type PrimitiveCategory =
  /** Buttons and the groupings of buttons nobody's base library ships. */
  | 'Actions'
  /** The parts of a form that are not the input itself. */
  | 'Form Controls'
  /** Choosing one of several — the controls that are not a <select>. */
  | 'Selection'
  /** Small pieces of labelled state. */
  | 'Status & Labels'
  /** Progress through something that has steps. */
  | 'Navigation & Steps'
  /** People, and the ways they are drawn. */
  | 'Identity'
  /** Colour, image and media, where the control has to show its value. */
  | 'Pickers & Media'
  /**
   * Dates, times and the spans between them.
   *
   * Split out of `Pickers & Media` rather than left in it, because a date
   * control is not a picker that happens to hold a date. A colour picker is
   * a surface with a value on it; a month grid is a keyboard contract, a
   * locale, a range, and a set of days somebody else has already booked.
   * Filing them together buried the calendar under the swatches.
   */
  | 'Date & Time'
  /** Structure that is too small to be a block. */
  | 'Structure'
  /**
   * Chrome to put a screenshot — or a live interface — inside.
   *
   * The one group here that is not a control, stated rather than smuggled in
   * under `Pickers & Media`. It belongs in this tier on the tier's *other*
   * test: a device frame is a small component every team rebuilds because
   * nobody ships one, and what gets shipped instead is a PNG with a fixed
   * image slot. A frame that takes `children` can hold the running product,
   * which is the case the PNG cannot serve at all.
   */
  | 'Frames & Mocks'

export const PRIMITIVE_CATEGORIES: PrimitiveCategory[] = [
  'Actions',
  'Form Controls',
  'Selection',
  'Status & Labels',
  'Navigation & Steps',
  'Identity',
  'Pickers & Media',
  'Date & Time',
  'Structure',
  'Frames & Mocks',
]

/* ------------------------------------------------------------------ *
 *  The Primitive type
 * ------------------------------------------------------------------ */

/**
 * A primitive is an `Artifact` that previews as a real React render.
 *
 * Structurally identical to `Block` — `previewComponent` and `files` both
 * required, `html` and `css` both forbidden — and deliberately so. The two
 * tiers differ in what they contain, not in how they are built, and giving
 * the smaller one its own mechanism would have meant a second copy of the
 * source-inlining build, the registry pattern and the index split.
 */
export interface Primitive
  extends Omit<
    Artifact,
    'level' | 'category' | 'html' | 'css' | 'files' | 'tags' | 'deps'
  > {
  level: 'primitive'
  category: PrimitiveCategory
  previewComponent: string
  files: ArtifactFile[]
  tags: string[]
  /**
   * Required, unlike on the base, for the reason it is required on a block:
   * an empty list is a real answer and an absent one is an oversight. Here
   * it is also close to the point of the tier — most of these are `[]`, and
   * the card says so.
   */
  deps: string[]
  /**
   * Tailwind height class for this primitive's card thumbnail.
   *
   * Blocks needed this for the exceptions — a navbar is not as tall as a
   * pricing section. Primitives need it more often than not: a KBD chip and
   * a tree view are an order of magnitude apart, and cropping both to one
   * height wastes most of the card for one and beheads the other.
   */
  thumbHeight?: string
  html?: never
  css?: never
}

/**
 * A primitive without its `files` — what the client-side index carries.
 * Same split, and same reason, as `BlockMeta`.
 */
export interface PrimitiveMeta extends Omit<Primitive, 'files' | 'html' | 'css'> {
  /** Line count of the primitive's source, shown on the card. */
  lines: number
}

/* ------------------------------------------------------------------ *
 *  Slugs
 * ------------------------------------------------------------------ */

/** `"Status & Labels"` → `"status-labels"`. */
export function primitiveCategorySlug(category: PrimitiveCategory): string {
  return toSlug(category)
}

const BY_SLUG = new Map<string, PrimitiveCategory>(
  PRIMITIVE_CATEGORIES.map((c) => [primitiveCategorySlug(c), c]),
)

/** Resolve a URL slug back to its category, or undefined if unknown. */
export function primitiveCategoryFromSlug(
  slug: string,
): PrimitiveCategory | undefined {
  return BY_SLUG.get(slug.toLowerCase())
}
