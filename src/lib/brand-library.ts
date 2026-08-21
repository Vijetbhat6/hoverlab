/**
 * Saved brand presets — the Pro half of the brand colour system.
 *
 * `brand-presets.ts` holds the ten curated palettes and the maths. This
 * holds the ones a customer names and keeps: "Northwind blue", "Acme
 * orange", the colour a client signed off on in March.
 *
 * The split is where the pricing line "custom brand color presets" actually
 * lands, and it is drawn so that nothing free gets taken away:
 *
 *   free   the ten curated presets, and the hue/chroma/lightness sliders.
 *          Recolouring the app is how you evaluate an effect against your
 *          own palette, so it stays free — a catalog you cannot preview in
 *          your own colours is a worse catalog, not a better funnel.
 *
 *   Pro    naming a colour and keeping it. A brand library is a thing you
 *          accumulate over client projects, it belongs to an account rather
 *          than a browser, and — like collections — it is server-held state,
 *          so the gate on it is real rather than decorative.
 *
 * Isomorphic and data-free: the route handler, the Firestore layer and the
 * client hook all validate through `sanitizeSavedBrand` so they cannot
 * disagree about what a saved preset is.
 */

import { coerceBrandColor, type BrandColor } from '@/lib/brand-presets'

/** Bounds one PUT rather than rationing the feature. */
export const BRAND_LIBRARY_LIMITS = {
  /** Saved presets per account. */
  perAccount: 50,
  /** Characters in a preset name. */
  nameLength: 60,
} as const

/** One brand colour a customer named and kept. */
export interface SavedBrand extends BrandColor {
  /** Stable client-generated id, and the Firestore document key. */
  id: string
  name: string
  /** ISO 8601. */
  createdAt: string
}

/**
 * Normalize an untrusted saved preset, or reject it.
 *
 * The colour goes through `coerceBrandColor`, which clamps rather than
 * rejects — an out-of-gamut chroma becomes a legal one instead of losing
 * the preset. Only a missing id, a missing name or a colour with no usable
 * channels at all is fatal.
 */
export function sanitizeSavedBrand(raw: unknown): SavedBrand | null {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, unknown>

  const id = typeof v.id === 'string' ? v.id.trim().slice(0, 64) : ''
  const name =
    typeof v.name === 'string'
      ? v.name.trim().slice(0, BRAND_LIBRARY_LIMITS.nameLength)
      : ''
  if (!id || !name) return null

  const color = coerceBrandColor(v)
  if (!color) return null

  const createdAt =
    typeof v.createdAt === 'string' && !Number.isNaN(Date.parse(v.createdAt))
      ? v.createdAt
      : new Date().toISOString()

  return { ...color, id, name, createdAt }
}

/** Newest first — the order the picker lists them in. */
export function sortSavedBrands(brands: SavedBrand[]): SavedBrand[] {
  return [...brands].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  )
}

/** The swatch colour for a saved preset, in light mode. */
export function savedBrandSwatch(brand: BrandColor): string {
  return `oklch(${brand.lightL} ${brand.chroma} ${brand.hue})`
}

/**
 * A fresh preset id. Same reasoning as `newCollectionId` — `randomUUID`
 * where it exists, a timestamp-plus-noise fallback for insecure origins.
 */
export function newBrandId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
