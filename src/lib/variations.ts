/**
 * Public variations — the seven alternate looks published under every effect.
 *
 * ── WHAT THIS REPLACES ──────────────────────────────────────────────────
 *
 * `hooks/use-remixes.ts` + `components/my-remixes-rail.tsx` shipped a remix
 * rail that was private in both senses: it read localStorage, and it was
 * mounted on no page at all, so nobody had ever seen it. A saved remix that
 * only its author can see is a bookmark. The value of a remix is that the
 * next person to land on "css shimmer skeleton loader" from a search result
 * sees seven finished looks of it instead of four sliders and an invitation
 * to experiment.
 *
 * So the rail is public now: server-rendered on all 1,047 effect pages,
 * statically generated with them, and readable with JavaScript switched off.
 * The private lane survives underneath it — see the rail component — because
 * a visitor's own saved remixes are still worth showing them.
 *
 * ── WHY THE AUTHOR IS "HOVERLAB" AND NOT A NAME ─────────────────────────
 *
 * Every variation carries authorship, and today every one of them is ours.
 * Seven per effect is 7,329 variations, and there is exactly one way to get
 * 7,329 attributed remixes on the day the feature ships: invent the people.
 * This repo has done a version of that already — `scripts/check-claims.mts`
 * exists because the landing page once carried six testimonials from people
 * who did not exist — and `lib/showcase.ts` argues the general case at
 * length. A fabricated byline is worse here than on a testimonial, because a
 * byline on a code snippet is also a licence claim about who owns it.
 *
 * The honest version is the one that shipped: the recipes below are ours, we
 * say so, and `COMMUNITY_VARIATIONS` is the empty array that real people's
 * remixes land in. It is empty and the rendering path that displays it is
 * finished, which is the same trade `lib/showcase.ts` makes — the first real
 * entry needs somewhere to go that is not a JSX edit under deadline.
 *
 * A community entry displaces a house one rather than extending the rail, so
 * the promise "seven under every effect" holds either way and the house
 * recipes recede as real ones arrive.
 *
 * ── WHY THE SEVEN ARE DRAWN, NOT LISTED ─────────────────────────────────
 *
 * Seven hand-picked recipes applied uniformly to 1,047 effects would be the
 * preset chip row with a new heading: the same seven names under every
 * effect on the site, which a reader spots on their second page. Instead
 * there are seven *families*, each with a pool, and each effect draws one
 * recipe per family seeded by its own id. Same effect, same seven, forever;
 * different effect, different seven.
 *
 * The count is structural rather than a magic number — it is
 * `FAMILIES.length`, and the families are a closed union, so widening the
 * rail means naming a new kind of variation rather than padding.
 */

import {
  DEFAULT_CUSTOMIZATION,
  PRESETS,
  type CustomizationOptions,
} from './customize'
import { seedFromString, seededShuffle } from './shuffle'
import { isShaderRenderer, type EffectRenderer } from './shaders/shader-types'

/* ============================================================
 *  Authorship
 * ========================================================== */

/**
 * Who made a variation.
 *
 * A union rather than a nullable name field, so "ours" is a value the type
 * system knows about instead of an absence that renders as a blank byline.
 */
export type VariationAuthor =
  | { kind: 'house' }
  /**
   * A real person. Every field is required, for the reasons `lib/showcase.ts`
   * sets out about its own entries:
   *
   *   profile     A public URL a stranger can open. A byline nobody can
   *               check is decoration, and it is the only thing standing
   *               between this rail and the invented-testimonials problem.
   *   permission  How we came to be allowed to publish it, in a sentence.
   *               Free text rather than a boolean because "submitted it
   *               through the form" and "we found it in a CodePen" are both
   *               answers with very different consequences, and `true`
   *               records neither.
   *   addedOn     ISO date. These rot: profiles go dead, people ask to be
   *               removed, and an attribution we can no longer support is a
   *               false statement we made.
   */
  | {
      kind: 'person'
      name: string
      profile: string
      permission: string
      addedOn: string
    }

const HOUSE: VariationAuthor = { kind: 'house' }

/** The byline as it renders. */
export function authorLabel(author: VariationAuthor): string {
  return author.kind === 'house' ? 'Hoverlab' : author.name
}

/** Where the byline links, or null when there is nowhere honest to point. */
export function authorHref(author: VariationAuthor): string | null {
  return author.kind === 'house' ? null : author.profile
}

/* ============================================================
 *  Families
 * ========================================================== */

/**
 * The seven kinds of variation. Closed union on purpose: this is what makes
 * the rail's length a fact about the design rather than a number someone
 * picked, and it means a new family cannot be added without also giving it a
 * label and a pool, both of which are `Record`s keyed by this type.
 */
export type VariationFamily =
  | 'warm'
  | 'cool'
  | 'muted'
  | 'electric'
  | 'tempo'
  | 'proportion'
  | 'signature'

export const FAMILIES: readonly VariationFamily[] = [
  'warm',
  'cool',
  'muted',
  'electric',
  'tempo',
  'proportion',
  'signature',
]

/** How many variations every effect publishes. */
export const VARIATIONS_PER_EFFECT = FAMILIES.length

/** Short chip text. Lowercase because it sits next to a name, not above it. */
export const FAMILY_LABEL: Record<VariationFamily, string> = {
  warm: 'warm',
  cool: 'cool',
  muted: 'muted',
  electric: 'electric',
  tempo: 'tempo',
  proportion: 'proportion',
  signature: 'signature',
}

/* ============================================================
 *  The recipe pools
 * ========================================================== */

interface Recipe {
  /** Unique across every pool — it is half of a variation's DOM id. */
  id: string
  name: string
  /** One sentence, in the imperative, describing the transform. */
  blurb: string
  opts: CustomizationOptions
}

/**
 * Every recipe is a real point in the customize panel's own coordinate
 * space: hue in steps of 5 within ±180, saturation in steps of 5 within
 * ±100, scale in steps of 0.05 within 0.5–1.5, speed in steps of 0.25 within
 * 0.25–3. That is not decoration — it means "open in the customizer" lands
 * on a slider position the reader can then nudge, rather than a value the
 * sliders snap away from on first touch. `variations.test.ts` enforces it.
 *
 * None of them is a no-op, and none of them duplicates a `PRESETS` chip: the
 * preset row and this rail sit on the same page, and a variation that is
 * secretly the Monochrome button is a wasted seventh of the rail. Also
 * enforced.
 *
 * `saturation` stops at -85 rather than -100 for a reason worth keeping: at
 * -100 there is no colour left for `hue` to rotate, so every fully
 * desaturated recipe collapses onto the same output no matter what else it
 * says. Full greyscale is the Monochrome preset's job.
 *
 * ── `speed` IS A DURATION MULTIPLIER, SO IT RUNS BACKWARDS ──────────────
 *
 * `customizeCss` multiplies every duration by `speed`, which means a HIGHER
 * number is a SLOWER animation: `speed: 3` turns a 0.9s spin into 2.7s. The
 * slider is nonetheless labelled "Speed", so the whole vocabulary inverts at
 * this boundary, and the first draft of this file got every tempo recipe
 * wrong in the same direction — "Sprint, three times the speed" shipping an
 * animation three times as slow, on 1,047 pages, with a name asserting the
 * opposite. Nothing caught it: the values are in range, on-step, distinct,
 * and round-trip through the URL perfectly. It was visible only in a browser,
 * in a computed `animation-duration`.
 *
 * So `variations.test.ts` runs each speed-bearing recipe through the real
 * engine and asserts the resulting duration, rather than asserting anything
 * about the number written here. Read the blurb as the specification and the
 * `speed` value as the implementation of it.
 */
const RECIPES: Record<VariationFamily, readonly Recipe[]> = {
  warm: [
    {
      id: 'ember',
      name: 'Ember',
      blurb: 'Rotates the palette warm and pushes the intensity up.',
      opts: { hue: 20, saturation: 30, scale: 1, speed: 1 },
    },
    {
      id: 'terracotta',
      name: 'Terracotta',
      blurb: 'A long warm rotation, left at its natural intensity.',
      opts: { hue: 30, saturation: 5, scale: 1, speed: 1 },
    },
    {
      id: 'amber',
      name: 'Amber',
      blurb: 'A short warm nudge with the saturation well up.',
      opts: { hue: 10, saturation: 45, scale: 1, speed: 1 },
    },
    {
      id: 'clay',
      name: 'Clay',
      blurb: 'Warm and deliberately dusty — colour rotated, intensity down.',
      opts: { hue: 35, saturation: -15, scale: 1, speed: 1 },
    },
    {
      id: 'marigold',
      name: 'Marigold',
      blurb: 'The furthest warm rotation, held at a strong saturation.',
      opts: { hue: 45, saturation: 25, scale: 1, speed: 1 },
    },
  ],
  cool: [
    {
      id: 'glacier',
      name: 'Glacier',
      blurb: 'A long cool rotation with barely any added intensity.',
      opts: { hue: -60, saturation: 10, scale: 1, speed: 1 },
    },
    {
      id: 'indigo',
      name: 'Indigo',
      blurb: 'Cool rotation, saturation up — deep rather than icy.',
      opts: { hue: -35, saturation: 30, scale: 1, speed: 1 },
    },
    {
      id: 'tidepool',
      name: 'Tidepool',
      blurb: 'The furthest cool rotation, toward greens and cyans.',
      opts: { hue: -80, saturation: 20, scale: 1, speed: 1 },
    },
    {
      id: 'slate',
      name: 'Slate',
      blurb: 'Cool and muted at once: rotated, then pulled back.',
      opts: { hue: -50, saturation: -25, scale: 1, speed: 1 },
    },
    {
      id: 'nocturne',
      name: 'Nocturne',
      blurb: 'A short cool rotation with the intensity pushed hard.',
      opts: { hue: -25, saturation: 40, scale: 1, speed: 1 },
    },
  ],
  muted: [
    {
      id: 'linen',
      name: 'Linen',
      blurb: 'Drops the saturation most of the way without touching hue.',
      opts: { hue: 0, saturation: -45, scale: 1, speed: 1 },
    },
    {
      id: 'graphite',
      name: 'Graphite',
      blurb: 'Nearly colourless, with just enough hue left to read.',
      opts: { hue: 0, saturation: -75, scale: 1, speed: 1 },
    },
    {
      id: 'newsprint',
      name: 'Newsprint',
      blurb: 'The flattest this gets while still being a colour.',
      opts: { hue: 0, saturation: -85, scale: 1, speed: 1 },
    },
    {
      id: 'dusk',
      name: 'Dusk',
      blurb: 'Muted and rotated cool — washed out toward evening.',
      opts: { hue: -15, saturation: -55, scale: 1, speed: 1 },
    },
    {
      id: 'chalk',
      name: 'Chalk',
      blurb: 'Muted and rotated warm — washed out toward paper.',
      opts: { hue: 15, saturation: -65, scale: 1, speed: 1 },
    },
  ],
  electric: [
    {
      id: 'voltage',
      name: 'Voltage',
      blurb: 'A small rotation and a large amount of saturation.',
      opts: { hue: -20, saturation: 70, scale: 1, speed: 1 },
    },
    {
      id: 'flare',
      name: 'Flare',
      blurb: 'Rotated well past warm and lit up.',
      opts: { hue: 60, saturation: 65, scale: 1, speed: 1 },
    },
    {
      id: 'acid',
      name: 'Acid',
      blurb: 'A quarter-turn of the wheel, saturated hard.',
      opts: { hue: 100, saturation: 60, scale: 1, speed: 1 },
    },
    {
      id: 'ultraviolet',
      name: 'Ultraviolet',
      blurb: 'Two-thirds of the wheel the other way, still vivid.',
      opts: { hue: -120, saturation: 55, scale: 1, speed: 1 },
    },
    {
      id: 'hot-wire',
      name: 'Hot Wire',
      blurb: 'The most saturated recipe here, on a long rotation.',
      opts: { hue: 150, saturation: 75, scale: 1, speed: 1 },
    },
  ],
  tempo: [
    {
      id: 'half-time',
      name: 'Half Time',
      blurb: 'Every animation takes twice as long. Colour untouched.',
      opts: { hue: 0, saturation: 0, scale: 1, speed: 2 },
    },
    {
      id: 'slow-burn',
      name: 'Slow Burn',
      blurb: 'Three times as long — ambience rather than feedback.',
      opts: { hue: 0, saturation: 0, scale: 1, speed: 3 },
    },
    {
      id: 'brisk',
      name: 'Brisk',
      blurb: 'A quarter quicker, which is often what a hover state wants.',
      opts: { hue: 0, saturation: 0, scale: 1, speed: 0.75 },
    },
    {
      id: 'double-time',
      name: 'Double Time',
      blurb: 'Twice as fast, same everything else.',
      opts: { hue: 0, saturation: 0, scale: 1, speed: 0.5 },
    },
    {
      id: 'sprint',
      name: 'Sprint',
      blurb: 'Four times as fast. The quickest this goes.',
      opts: { hue: 0, saturation: 0, scale: 1, speed: 0.25 },
    },
  ],
  proportion: [
    {
      id: 'compact',
      name: 'Compact',
      blurb: 'Three-quarter size, for dense UI. Colour and timing untouched.',
      opts: { hue: 0, saturation: 0, scale: 0.75, speed: 1 },
    },
    {
      id: 'petite',
      name: 'Petite',
      blurb: 'The smallest this scales to and still reads.',
      opts: { hue: 0, saturation: 0, scale: 0.6, speed: 1 },
    },
    {
      id: 'roomy',
      name: 'Roomy',
      blurb: 'A quarter larger, for a surface with space to spare.',
      opts: { hue: 0, saturation: 0, scale: 1.25, speed: 1 },
    },
    {
      id: 'oversized',
      name: 'Oversized',
      blurb: 'Half again as large — a hero treatment of the same effect.',
      opts: { hue: 0, saturation: 0, scale: 1.5, speed: 1 },
    },
    {
      id: 'trim',
      name: 'Trim',
      blurb: 'A modest tightening, the one that rarely breaks a layout.',
      opts: { hue: 0, saturation: 0, scale: 0.85, speed: 1 },
    },
  ],
  signature: [
    {
      id: 'neon-night',
      name: 'Neon Night',
      blurb: 'Cool, saturated, slightly larger and noticeably quicker.',
      opts: { hue: -30, saturation: 60, scale: 1.1, speed: 0.75 },
    },
    {
      id: 'faded-poster',
      name: 'Faded Poster',
      blurb: 'Warm, washed out, oversized and slowed down.',
      opts: { hue: 25, saturation: -40, scale: 1.15, speed: 1.5 },
    },
    {
      id: 'arcade',
      name: 'Arcade',
      blurb: 'A hard rotation, vivid, small and twice as fast.',
      opts: { hue: 120, saturation: 50, scale: 0.85, speed: 0.5 },
    },
    {
      id: 'silk',
      name: 'Silk',
      blurb: 'Cool, restrained, a touch larger and at half speed.',
      opts: { hue: -70, saturation: -20, scale: 1.05, speed: 2 },
    },
    {
      id: 'brutal',
      name: 'Brutal',
      blurb: 'Almost colourless, considerably larger, deliberately slow.',
      opts: { hue: 0, saturation: -85, scale: 1.35, speed: 2 },
    },
    {
      id: 'candy',
      name: 'Candy',
      blurb: 'Rotated warm past yellow, vivid, compact and a little quick.',
      opts: { hue: 75, saturation: 35, scale: 0.9, speed: 0.75 },
    },
  ],
}

/** Every recipe in the file, for the tests and for `recipeById`. */
export const ALL_RECIPES: readonly Recipe[] = FAMILIES.flatMap((f) => RECIPES[f])

/* ============================================================
 *  Community variations
 * ========================================================== */

/**
 * Variations published by people who are not us.
 *
 * Empty, and that is the honest state rather than a gap. See the header: the
 * alternative to an empty array here is 7,329 invented bylines. An entry
 * arrives when a real person sends one and says we may publish it, at which
 * point it displaces a house recipe on that effect's rail.
 *
 * The type is `Extract<..., 'person'>` so an entry here cannot be filed
 * under the house byline — if it is in this array, somebody made it, and the
 * compiler will ask who, where to find them, and on what basis we are
 * printing their name.
 */
export interface CommunityVariation {
  /** Which effect it varies. Must exist in the catalog — `check:variations`. */
  effectId: string
  /** Unique within its effect. */
  id: string
  name: string
  blurb: string
  opts: CustomizationOptions
  author: Extract<VariationAuthor, { kind: 'person' }>
}

export const COMMUNITY_VARIATIONS: readonly CommunityVariation[] = []

/* ============================================================
 *  Resolution
 * ========================================================== */

export interface Variation {
  /** Unique within the effect; used for React keys and DOM ids. */
  id: string
  name: string
  blurb: string
  opts: CustomizationOptions
  author: VariationAuthor
  /**
   * Absent on a community variation. Somebody else's remix is not one of our
   * seven kinds, and filing it under the nearest family would be us
   * describing their work.
   */
  family?: VariationFamily
}

/**
 * The seven variations published under `effectId`, in display order.
 *
 * Deterministic in the strict sense the static build needs: pure in its
 * argument, stable across processes and engines, and identical between the
 * build that generated the HTML and the browser that hydrates it.
 *
 * Each family draws from its own seed — `<effectId>:<family>` rather than a
 * running counter off one seed — so that adding a community variation
 * displaces one house recipe and leaves the other six exactly as they were.
 * With a shared counter, one new entry would silently reshuffle the whole
 * rail, changing six permalinks people may have already shared.
 */
export function variationsFor(effectId: string): Variation[] {
  const community: Variation[] = COMMUNITY_VARIATIONS.filter(
    (v) => v.effectId === effectId,
  )
    .slice(0, VARIATIONS_PER_EFFECT)
    .map((v) => ({
      id: v.id,
      name: v.name,
      blurb: v.blurb,
      opts: v.opts,
      author: v.author,
    }))

  const slots = VARIATIONS_PER_EFFECT - community.length

  // Which families get dropped when community entries take slots is itself
  // seeded, so it is not always 'signature' that loses.
  const order = seededShuffle(FAMILIES, seedFromString(effectId))

  const house: Variation[] = order.slice(0, slots).map((family) => {
    const pool = RECIPES[family]
    const recipe = seededShuffle(pool, seedFromString(`${effectId}:${family}`))[0]
    return {
      id: recipe.id,
      name: recipe.name,
      blurb: recipe.blurb,
      opts: recipe.opts,
      author: HOUSE,
      family,
    }
  })

  return [...community, ...house]
}

/**
 * Whether an effect can honestly publish variations at all.
 *
 * False for the 15 `webgl` and `canvas` effects, and the reason is not that
 * they look bad in the rail — it is that the rail would be lying.
 *
 * A shader effect paints from a GLSL program in `lib/shaders`. Its `css` is a
 * gradient shown until the first frame and permanently if WebGL is
 * unavailable, and `customizeCss` is a string transform over CSS: it cannot
 * reach the program. So the seven cards under Aurora Veil would be seven
 * recolourings of a fallback that a visitor with a working GPU never sees,
 * sold under a heading that says they are variations of the effect, and the
 * CSS each Copy button handed over would visibly do nothing when pasted.
 *
 * The rail renders nothing on those pages instead. Seven honest cards on 1,111
 * effects beats 7,329 on 1,126 where fifteen pages' worth are not true.
 *
 * (They were also blank, because the fallback is `width: 100%` inside a
 * preview box sized by its content. That was the symptom that found this; it
 * is not the reason.)
 */
export function supportsVariations(renderer: EffectRenderer | undefined): boolean {
  return !isShaderRenderer(renderer)
}

/** True when `opts` is one of the `PRESETS` chips or the untouched default. */
export function isPresetOrDefault(opts: CustomizationOptions): boolean {
  const same = (a: CustomizationOptions, b: CustomizationOptions) =>
    a.hue === b.hue &&
    a.saturation === b.saturation &&
    a.scale === b.scale &&
    a.speed === b.speed
  if (same(opts, DEFAULT_CUSTOMIZATION)) return true
  return PRESETS.some((p) => same(p.opts, opts))
}
