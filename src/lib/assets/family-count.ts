/**
 * How many assets each family actually contains, derived from the sets
 * themselves rather than typed out.
 *
 * ── WHY IT IS NOT IN app/assets/page.tsx ────────────────────────────────
 *
 * It was, as an `export const`, and `app/assets/[family]/page.tsx` imported it
 * with `import { FAMILY_COUNT } from '../page'`. Next allows a page module to
 * export only its own known keys — `default`, `metadata`, `generateMetadata`,
 * `generateStaticParams` and friends — and type-checks that with an
 * `{ [x: string]: never }` constraint on everything else, so the arrangement
 * failed `tsc` and would have failed `next build`:
 *
 *   Property 'FAMILY_COUNT' is incompatible with index signature.
 *   Type 'Record<string, { total: number; shape: string; }>' is not
 *   assignable to type 'never'.
 *
 * One route reaching into another route's module is the underlying mistake;
 * the export rule is just where it surfaces. Shared data belongs in `lib`,
 * which is also where every set it counts already lives.
 */

import {
  ICON_GEOMETRY,
  ICON_MOTIONS,
  animatedIconCount,
} from '@/lib/assets/animated-icons'
import { AVATAR_SET, AVATAR_STYLES } from '@/lib/assets/avatars'
import { LOGO_SET } from '@/lib/assets/logos'
import { SCENES } from '@/lib/assets/illustrations'

export interface FamilyCount {
  total: number
  /** How the total is arrived at, for the card's second line. */
  shape: string
}

export const FAMILY_COUNT: Record<string, FamilyCount> = {
  'animated-icons': {
    total: animatedIconCount(),
    shape: `${ICON_GEOMETRY.length} icons × ${ICON_MOTIONS.length} motions`,
  },
  // The shape never restates the total — the card already renders it, and
  // "372 · 372 in the grid" is what happens when it does.
  avatars: {
    total: AVATAR_SET.length,
    shape: `${AVATAR_STYLES.length} styles × ${AVATAR_SET.length / AVATAR_STYLES.length} names, and unlimited by seed`,
  },
  logos: { total: LOGO_SET.length, shape: `30 invented brands × 6 mark families` },
  illustrations: {
    total: SCENES.length,
    shape: 'isometric scenes, each one file for light and dark',
  },
}

/** Every asset across every family. */
export const ASSET_TOTAL = Object.values(FAMILY_COUNT).reduce((n, f) => n + f.total, 0)
