/**
 * The heading scale, as data.
 *
 * `globals.css` defines three heading roles — `.type-display`, `.type-hub`
 * and `.type-page` — with explicit sizes, line heights and tracking. That
 * is a real scale backed by a real stylesheet, and until this module it
 * existed only as CSS: the Figma sheet said in its own comment that "there
 * is no type-scale token in this design system", which was true when it was
 * written and stopped being true when those three classes landed.
 *
 * ── What is here, and what is deliberately not ──
 *
 * The three heading roles, and nothing else. Body, small and caption sizes
 * genuinely are Tailwind defaults chosen at the call site — there is no
 * stylesheet here that backs a body scale, and putting one on a designer's
 * canvas would be inventing a claim rather than exporting one. The old
 * comment was right about that half and wrong about the other.
 *
 * ── Why both ends of the clamp ──
 *
 * The sizes are `clamp()`ed rather than stepped at breakpoints, so a
 * heading grows smoothly instead of jumping two sizes at 640px. A single
 * number would therefore be a lie in one direction or the other: quote the
 * maximum and a designer draws a phone screen at 72px, quote the minimum
 * and they draw the desktop hero two sizes too small. Both ends travel, and
 * the surface that renders them says which is which.
 *
 * ── Why a hand-written table is safe here ──
 *
 * It is not derived, and it is not trusted either: `type-scale.test.ts`
 * parses `globals.css` and asserts every number below matches what the
 * stylesheet actually declares. Editing the CSS without editing this fails
 * the suite, which is the same guarantee a build step would give without a
 * build step — and this is five rows of three numbers, not a catalog.
 */

/** One heading role. Sizes in px; the CSS declares them in rem at 16px. */
export interface TypeRole {
  /** The class name in `globals.css`, without the dot. */
  className: string
  /** What it is for, in the words the stylesheet's own comment uses. */
  role: string
  /** Smallest rendered size, the lower bound of the clamp. */
  minPx: number
  /** Largest rendered size, the upper bound of the clamp. */
  maxPx: number
  lineHeight: number
  /** Tracking in em, negative on every role here. */
  letterSpacing: number
  fontWeight: number
}

/**
 * The scale, largest first — which is both the visual order a specimen
 * sheet wants and the order the stylesheet declares them in.
 */
export const TYPE_SCALE: TypeRole[] = [
  {
    className: 'type-display',
    role: 'The landing hero. One per site.',
    minPx: 44,
    maxPx: 72,
    lineHeight: 1.04,
    letterSpacing: -0.032,
    fontWeight: 800,
  },
  {
    className: 'type-hub',
    role: 'A catalog index: /browse, /library, /blocks.',
    minPx: 36,
    maxPx: 48,
    lineHeight: 1.1,
    letterSpacing: -0.026,
    fontWeight: 800,
  },
  {
    className: 'type-page',
    role: 'An item: one effect, one block, one tool.',
    minPx: 28,
    maxPx: 36,
    lineHeight: 1.16,
    letterSpacing: -0.02,
    fontWeight: 800,
  },
]

/** `-0.032` → `"-0.032em"`, for a label a designer can retype into Figma. */
export function formatTracking(em: number): string {
  return `${em}em`
}

/** `44, 72` → `"44 → 72px"`. The fluid range, said as a range. */
export function formatRange(minPx: number, maxPx: number): string {
  return `${minPx} → ${maxPx}px`
}
