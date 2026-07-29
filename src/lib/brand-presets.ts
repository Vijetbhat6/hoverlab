/**
 * Brand color system — presets + types
 * ------------------------------------
 * A "brand color" is a single OKLCH hue + chroma pair plus separate
 * lightness values for light and dark mode. The use-brand-color hook
 * applies these as CSS custom properties (--brand-hue, --brand-chroma,
 * --brand-light-l, --brand-dark-l) on <html>; globals.css then derives
 * --primary, --ring, and --accent from them. This means a single state
 * change recolors the entire app consistently.
 */

/** A complete brand color definition. All fields required. */
export interface BrandColor {
  /** OKLCH hue 0-360 */
  hue: number;
  /** OKLCH chroma 0-0.32 (higher = more saturated) */
  chroma: number;
  /** OKLCH L for primary in light mode (0-1) */
  lightL: number;
  /** OKLCH L for primary in dark mode (0-1) */
  darkL: number;
}

/** A named preset the user can pick from in the UI. */
export interface BrandPreset extends BrandColor {
  id: string;
  name: string;
  /** CSS color string for the swatch in the picker UI */
  swatch: string;
}

/** The default brand color (matches the original emerald/teal theme). */
export const DEFAULT_BRAND_COLOR: BrandColor = {
  hue: 160,
  chroma: 0.2,
  lightL: 0.55,
  darkL: 0.7,
};

/** Curated preset palettes. Hue values chosen for visual distinction. */
export const BRAND_PRESETS: BrandPreset[] = [
  {
    id: "emerald",
    name: "Emerald",
    hue: 160,
    chroma: 0.2,
    lightL: 0.55,
    darkL: 0.7,
    swatch: "oklch(0.55 0.2 160)",
  },
  {
    id: "indigo",
    name: "Indigo",
    hue: 265,
    chroma: 0.2,
    lightL: 0.5,
    darkL: 0.68,
    swatch: "oklch(0.5 0.2 265)",
  },
  {
    id: "rose",
    name: "Rose",
    hue: 12,
    chroma: 0.22,
    lightL: 0.58,
    darkL: 0.7,
    swatch: "oklch(0.58 0.22 12)",
  },
  {
    id: "amber",
    name: "Amber",
    hue: 70,
    chroma: 0.18,
    lightL: 0.62,
    darkL: 0.75,
    swatch: "oklch(0.62 0.18 70)",
  },
  {
    id: "cyan",
    name: "Cyan",
    hue: 210,
    chroma: 0.17,
    lightL: 0.6,
    darkL: 0.72,
    swatch: "oklch(0.6 0.17 210)",
  },
  {
    id: "violet",
    name: "Violet",
    hue: 300,
    chroma: 0.2,
    lightL: 0.55,
    darkL: 0.7,
    swatch: "oklch(0.55 0.2 300)",
  },
  {
    id: "lime",
    name: "Lime",
    hue: 130,
    chroma: 0.19,
    lightL: 0.6,
    darkL: 0.75,
    swatch: "oklch(0.6 0.19 130)",
  },
  {
    id: "orange",
    name: "Orange",
    hue: 45,
    chroma: 0.19,
    lightL: 0.62,
    darkL: 0.73,
    swatch: "oklch(0.62 0.19 45)",
  },
  {
    id: "magenta",
    name: "Magenta",
    hue: 340,
    chroma: 0.22,
    lightL: 0.58,
    darkL: 0.7,
    swatch: "oklch(0.58 0.22 340)",
  },
  {
    id: "sky",
    name: "Sky",
    hue: 235,
    chroma: 0.16,
    lightL: 0.55,
    darkL: 0.7,
    swatch: "oklch(0.55 0.16 235)",
  },
  {
    id: "crimson",
    name: "Crimson",
    hue: 25,
    chroma: 0.24,
    lightL: 0.55,
    darkL: 0.66,
    swatch: "oklch(0.55 0.24 25)",
  },
  {
    id: "teal",
    name: "Teal",
    hue: 190,
    chroma: 0.13,
    lightL: 0.55,
    darkL: 0.7,
    swatch: "oklch(0.55 0.13 190)",
  },
];

/** Clamp a number to [min, max]. */
export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Normalize a hue to [0, 360). */
export function normalizeHue(h: number): number {
  const wrapped = ((h % 360) + 360) % 360;
  return wrapped;
}

/**
 * Validate and coerce an unknown value into a BrandColor, or return null
 * if it cannot be salvaged. Used by the hook when reading localStorage.
 */
export function coerceBrandColor(raw: unknown): BrandColor | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  const hue = typeof v.hue === "number" ? normalizeHue(v.hue) : null;
  const chroma = typeof v.chroma === "number" ? clamp(v.chroma, 0, 0.32) : null;
  const lightL =
    typeof v.lightL === "number" ? clamp(v.lightL, 0.1, 0.95) : null;
  const darkL = typeof v.darkL === "number" ? clamp(v.darkL, 0.1, 0.95) : null;
  if (hue === null || chroma === null || lightL === null || darkL === null) {
    return null;
  }
  return { hue, chroma, lightL, darkL };
}

/** True if two brand colors are equal (within floating-point tolerance). */
export function brandEquals(a: BrandColor, b: BrandColor): boolean {
  return (
    Math.abs(a.hue - b.hue) < 0.5 &&
    Math.abs(a.chroma - b.chroma) < 0.001 &&
    Math.abs(a.lightL - b.lightL) < 0.001 &&
    Math.abs(a.darkL - b.darkL) < 0.001
  );
}

/** Find a preset whose color matches the given BrandColor, or null. */
export function findMatchingPreset(c: BrandColor): BrandPreset | null {
  return BRAND_PRESETS.find((p) => brandEquals(p, c)) ?? null;
}

/**
 * Apply a brand color to the document by setting CSS custom properties
 * on the root element. Safe to call on the server (no-op).
 */
export function applyBrandColorToDocument(c: BrandColor): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--brand-hue", String(c.hue));
  root.style.setProperty("--brand-chroma", String(c.chroma));
  root.style.setProperty("--brand-light-l", String(c.lightL));
  root.style.setProperty("--brand-dark-l", String(c.darkL));
}

/** Remove all brand color overrides, restoring the CSS defaults. */
export function clearBrandColorFromDocument(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.removeProperty("--brand-hue");
  root.style.removeProperty("--brand-chroma");
  root.style.removeProperty("--brand-light-l");
  root.style.removeProperty("--brand-dark-l");
}
