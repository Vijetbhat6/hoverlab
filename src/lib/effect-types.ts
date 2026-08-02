/**
 * Shared effect types + the category list.
 *
 * This module is deliberately DATA-FREE so client bundles can import
 * `CATEGORIES` and the types without pulling in the 1.6 MB generated
 * catalog. See effect-index.ts for the client-safe metadata index.
 */

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
  | "Timelines & Steps";

export interface Effect {
  id: string;
  name: string;
  category: EffectCategory;
  description: string;
  /** Markup needed for the live preview (use the same class names as in CSS). */
  html: string;
  /** The CSS source the user can copy. */
  css: string;
  /** Tailwind class to center / pad the preview area per effect. */
  previewClass?: string;
  /** Render the preview with a dark surface (some effects only look right on dark). */
  darkSurface?: boolean;
  /** Style tags for filtering / discovery. */
  tags?: string[];
  /** True for curated / hand-picked effects (shown when "Featured" filter is on). */
  featured?: boolean;
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
 */
export function categorySlug(category: EffectCategory): string {
  return category
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const BY_SLUG = new Map<string, EffectCategory>(
  CATEGORIES.map((c) => [categorySlug(c), c]),
);

/** Resolve a URL slug back to its category, or undefined if unknown. */
export function categoryFromSlug(slug: string): EffectCategory | undefined {
  return BY_SLUG.get(slug.toLowerCase());
}
