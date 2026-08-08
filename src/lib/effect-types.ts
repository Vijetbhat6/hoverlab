/**
 * Shared effect types + the category list.
 *
 * This module is deliberately DATA-FREE so client bundles can import
 * `CATEGORIES` and the types without pulling in the 1.6 MB generated
 * catalog. See effect-index.ts for the client-safe metadata index.
 *
 * `Effect` is the bottom rung of the ladder described in `artifact-types.ts`
 * — it is an `Artifact` narrowed to `level: 'effect'`, with `html` and `css`
 * promoted from optional to required, because an effect with no markup is
 * nothing at all. Everything shared with blocks, pages and templates lives
 * on the base.
 */

import type { Artifact } from './artifact-types'
import { toSlug } from './artifact-types'

export type EffectCategory =
  | "Buttons"
  | "Loaders"
  | "Cards"
  | "Text"
  | "Backgrounds"
  | "Inputs & Hover"
  | "Navigation & Menus"
  | "Dividers & Separators"
  | "Badges & Tags"
  | "Toggles & Switches"
  | "Tooltips & Popovers"
  | "Skeletons & Shimmers"
  | "Entrance Animations"
  | "Borders & Outlines"
  | "Progress & Meters"
  | "Avatars & Images"
  | "Modals & Overlays"
  | "Alerts & Toasts"
  | "Accordions & Tabs"
  | "3D & Perspective"
  | "Glow & Neon"
  | "Patterns & Textures"
  | "Masks & Clip Paths"
  | "Charts & Data"
  | "Timelines & Steps"
  | "Tables & Data Grids"
  | "Forms & Validation"
  | "Scroll & Sticky"
  | "Sliders & Carousels"
  | "Icons & Shapes"
  | "Micro-interactions"
  | "Filters & Blend Modes";

export interface Effect
  extends Omit<Artifact, "level" | "category" | "html" | "css"> {
  /**
   * Absent on every stored record — the 4,300-row generated catalog and the
   * hand-written literal both predate the field, and `levelOf()` defaults to
   * `'effect'`. Narrowed here so an effect can never claim another level.
   */
  level?: "effect";
  category: EffectCategory;
  /** Markup needed for the live preview (use the same class names as in CSS). */
  html: string;
  /** The CSS source the user can copy. */
  css: string;
}

export const CATEGORIES: EffectCategory[] = [
  "Buttons",
  "Loaders",
  "Cards",
  "Text",
  "Backgrounds",
  "Inputs & Hover",
  "Navigation & Menus",
  "Dividers & Separators",
  "Badges & Tags",
  "Toggles & Switches",
  "Tooltips & Popovers",
  "Skeletons & Shimmers",
  "Entrance Animations",
  "Borders & Outlines",
  "Progress & Meters",
  "Avatars & Images",
  "Modals & Overlays",
  "Alerts & Toasts",
  "Accordions & Tabs",
  "3D & Perspective",
  "Glow & Neon",
  "Patterns & Textures",
  "Masks & Clip Paths",
  "Charts & Data",
  "Timelines & Steps",
  "Tables & Data Grids",
  "Forms & Validation",
  "Scroll & Sticky",
  "Sliders & Carousels",
  "Icons & Shapes",
  "Micro-interactions",
  "Filters & Blend Modes",
];

/* ------------------------------------------------------------------ *
 *  Category slugs
 * ------------------------------------------------------------------ */

/**
 * URL slug for a category — `"Inputs & Hover"` → `"inputs-hover"`.
 *
 * Category names carry `&` and spaces, which are legal but ugly in a path
 * and force encoding in every link. The slug is derived rather than stored
 * so adding a category to CATEGORIES is the only edit a new category needs.
 *
 * Delegates to the shared `toSlug` so effect and block categories slugify by
 * the same rule — `/category/inputs-hover` and `/blocks/forms-inputs` should
 * never diverge in how they handle `&`.
 */
export function categorySlug(category: EffectCategory): string {
  return toSlug(category);
}

const BY_SLUG = new Map<string, EffectCategory>(
  CATEGORIES.map((c) => [categorySlug(c), c]),
);

/** Resolve a URL slug back to its category, or undefined if unknown. */
export function categoryFromSlug(slug: string): EffectCategory | undefined {
  return BY_SLUG.get(slug.toLowerCase());
}
