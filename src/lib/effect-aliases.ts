import GENERATED_ALIASES from './generated-effect-aliases.json'

/**
 * Retired effect ids -> the id that replaced them.
 *
 * Two sources merge here:
 *
 * 1. GENERATED_ALIASES — written by scripts/generate-effects.mjs's thinning
 *    pass. The catalog used to stamp every design across color/size/speed
 *    tokens (51 solid buttons differing only in hue); thinning keeps one
 *    canonical member per design family and maps every retired colorway id
 *    to its survivor. ~6,900 entries, regenerated with the catalog.
 *
 * 2. RENAMED (below, hand-written) — ids retired by display-name renames.
 *    Effect ids are derived from the display name, so renaming an effect
 *    moves its URL. Two families were renamed after they turned out to
 *    share display names with older, unrelated families:
 *
 *   Isometric Stack -> Exploded Stack   (v5 3d-iso, clashed with m3-iso)
 *   Checkout Stepper -> Wizard Stepper  (v5 step-wizard, clashed with tl-step)
 *
 * Both were regenerated with the same class names and the same sequence
 * numbers, so only the slug portion of the id changed. /effect/[slug] checks
 * this map before giving up and permanently redirects, which keeps inbound
 * links and any accumulated ranking pointed at the live page.
 *
 * Only add entries here for ids that ONCE SHIPPED. An id that never went out
 * has no links to preserve and just costs a redirect lookup forever.
 */
const RENAMED: Readonly<Record<string, string>> = {
  'sunset-isometric-stack-8397': 'sunset-exploded-stack-8397',
  'ocean-isometric-stack-8399': 'ocean-exploded-stack-8399',
  'forest-isometric-stack-8401': 'forest-exploded-stack-8401',
  'berry-isometric-stack-8403': 'berry-exploded-stack-8403',
  'citrus-isometric-stack-8405': 'citrus-exploded-stack-8405',
  'flamingo-isometric-stack-8407': 'flamingo-exploded-stack-8407',
  'mint-isometric-stack-8409': 'mint-exploded-stack-8409',
  'twilight-isometric-stack-8411': 'twilight-exploded-stack-8411',
  'coral-isometric-stack-8413': 'coral-exploded-stack-8413',
  'lagoon-isometric-stack-8415': 'lagoon-exploded-stack-8415',
  'fire-isometric-stack-8417': 'fire-exploded-stack-8417',
  'galaxy-isometric-stack-8419': 'galaxy-exploded-stack-8419',
  'sunset-checkout-stepper-8517': 'sunset-wizard-stepper-8517',
  'ocean-checkout-stepper-8519': 'ocean-wizard-stepper-8519',
  'forest-checkout-stepper-8521': 'forest-wizard-stepper-8521',
  'berry-checkout-stepper-8523': 'berry-wizard-stepper-8523',
  'citrus-checkout-stepper-8525': 'citrus-wizard-stepper-8525',
  'flamingo-checkout-stepper-8527': 'flamingo-wizard-stepper-8527',
  'mint-checkout-stepper-8529': 'mint-wizard-stepper-8529',
  'twilight-checkout-stepper-8531': 'twilight-wizard-stepper-8531',
  'coral-checkout-stepper-8533': 'coral-wizard-stepper-8533',
  'lagoon-checkout-stepper-8535': 'lagoon-wizard-stepper-8535',
  'fire-checkout-stepper-8537': 'fire-wizard-stepper-8537',
  'galaxy-checkout-stepper-8539': 'galaxy-wizard-stepper-8539',
}

/*
 * Merge and flatten chains. A hand-written rename can point at an id the
 * thinning pass later retired (sunset-isometric-stack -> sunset-exploded-
 * stack -> ocean-exploded-stack), and the [slug] page does exactly one
 * lookup before redirecting. Resolving here means every retired id reaches
 * its live page in a single 308 instead of a redirect hop per link in the
 * chain.
 */
const MERGED: Record<string, string> = { ...GENERATED_ALIASES, ...RENAMED }

export const EFFECT_ID_ALIASES: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(MERGED).map(([from, to]) => {
    let target = to
    const seen = new Set([from])
    while (MERGED[target] && !seen.has(target)) {
      seen.add(target)
      target = MERGED[target]
    }
    return [from, target]
  }),
)
