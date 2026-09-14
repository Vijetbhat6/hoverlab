/**
 * Permalink spec for /tools/typography — the type scale.
 *
 * `?pair=fraunces-inter&base=18&scale=1.333`
 *
 * Ten fields, and a permalink that is usually two, because `toolQuery`
 * writes only what differs from the default. That asymmetry is the point:
 * the state is large because the tool is thorough, and the URL is small
 * because almost nobody changes the paragraph spacing.
 *
 * This is the one tool in the set with no colour in it, so `swatches`
 * returns nothing and the gallery card falls back to setting its own label
 * in the pairing it names — which is a better preview of a type scale than
 * a row of squares would have been anyway.
 */

import { FONT_PAIRINGS } from '@/lib/font-pairings'
import { num, oneOf, type ToolPermalink } from '@/lib/tools/permalink'

export interface TypoState {
  pairId: string
  baseSize: number // px
  scale: number
  headingWeight: number
  bodyWeight: number
  headingLineHeight: number
  bodyLineHeight: number
  headingLetterSpacing: number // em
  bodyLetterSpacing: number // em
  paragraphSpacing: number // em
}

export const TYPO_DEFAULTS: TypoState = {
  pairId: 'playfair-source',
  baseSize: 16,
  scale: 1.25,
  headingWeight: 700,
  bodyWeight: 400,
  headingLineHeight: 1.15,
  bodyLineHeight: 1.6,
  headingLetterSpacing: -0.02,
  bodyLetterSpacing: 0,
  paragraphSpacing: 1.4,
}

/**
 * The pairing ids, read off the list rather than written down again.
 *
 * A second hand-maintained copy of these would rot the first time somebody
 * added a pairing — the dropdown would offer it and the permalink would
 * reject it, which is the least debuggable kind of broken link.
 */
const PAIR_IDS = FONT_PAIRINGS.map((p) => p.id)

/** The common name of a scale ratio, where it has one. */
const RATIO_NAME: Record<string, string> = {
  '1.125': 'Major Second',
  '1.2': 'Minor Third',
  '1.25': 'Major Third',
  '1.333': 'Perfect Fourth',
  '1.414': 'Augmented Fourth',
  '1.5': 'Perfect Fifth',
  '1.618': 'Golden Ratio',
}

/** The six steps of the scale, in px, largest first. */
export function typeScaleSteps(state: TypoState): number[] {
  return [4, 3, 2, 1, 0, -1].map(
    (step) => Math.round(state.baseSize * state.scale ** step * 100) / 100,
  )
}

export const TYPOGRAPHY_PERMALINK: ToolPermalink<TypoState> = {
  href: '/tools/typography',
  defaults: TYPO_DEFAULTS,
  fields: {
    pairId: { param: 'pair', codec: oneOf(PAIR_IDS) },
    baseSize: { param: 'base', codec: num(8, 32, 2) },
    scale: { param: 'scale', codec: num(1, 2, 3) },
    headingWeight: { param: 'hw', codec: num(100, 900, 0) },
    bodyWeight: { param: 'bw', codec: num(100, 900, 0) },
    headingLineHeight: { param: 'hlh', codec: num(0.8, 2.5, 2) },
    bodyLineHeight: { param: 'blh', codec: num(0.8, 2.5, 2) },
    headingLetterSpacing: { param: 'hls', codec: num(-0.2, 0.5, 3) },
    bodyLetterSpacing: { param: 'bls', codec: num(-0.2, 0.5, 3) },
    paragraphSpacing: { param: 'psp', codec: num(0, 4, 2) },
  },

  describe(state) {
    const pair = FONT_PAIRINGS.find((p) => p.id === state.pairId) ?? FONT_PAIRINGS[0]!
    const ratioName = RATIO_NAME[String(state.scale)]
    const ratio = ratioName ? `${state.scale} ${ratioName}` : String(state.scale)
    const steps = typeScaleSteps(state)
    return {
      title: `${pair.name} at ${state.baseSize}px, ${ratio} — type scale — Hoverlab`,
      description: `A ${ratio} type scale on a ${state.baseSize}px base, set in ${pair.name}: ${steps
        .map((s) => `${s}px`)
        .join(' · ')}. Open it to retune the ratio and line heights, and copy the CSS custom properties, the Tailwind scale or the next/font setup.`,
    }
  },

  // No colour in a type scale. The gallery card reads this as "set the
  // label in the pairing instead", which previews the thing being linked to
  // far better than a swatch row could.
  swatches: () => [],

  gallery: [
    {
      slug: 'playfair-major-third',
      name: 'Playfair + Source Sans, Major Third',
      note: 'The default. A serif display over a workhorse sans, at the ratio most editorial sites land on.',
      state: {},
    },
    {
      slug: 'inter-minor-third',
      name: 'Inter, Minor Third',
      note: 'One family, 1.2. The tightest scale that still separates six levels — a product UI, not a landing page.',
      state: { pairId: 'inter-inter', scale: 1.2 },
    },
    {
      slug: 'fraunces-perfect-fourth',
      name: 'Fraunces + Inter, Perfect Fourth',
      note: '1.333 on an 18px base. Big jumps, short pages, loud headings.',
      state: { pairId: 'fraunces-inter', baseSize: 18, scale: 1.333 },
    },
    {
      slug: 'golden-ratio-editorial',
      name: 'Merriweather + Inter, Golden Ratio',
      note: '1.618 with a 1.75 body leading — a long-read setting, where the body has to breathe more than the headings.',
      state: {
        pairId: 'merriweather-inter',
        scale: 1.618,
        bodyLineHeight: 1.75,
        paragraphSpacing: 1.6,
      },
    },
    {
      slug: 'space-grotesk-technical',
      name: 'Space Grotesk + IBM Plex, Major Second',
      note: '1.125 — barely a scale. For dense technical pages where hierarchy comes from weight, not size.',
      state: { pairId: 'space-grotesk-ibm', scale: 1.125, headingWeight: 600 },
    },
    {
      slug: 'dm-serif-display',
      name: 'DM Serif + DM Sans, Perfect Fifth',
      note: '1.5 with tight heading tracking. A marketing scale: three sizes that matter and three that never appear.',
      state: { pairId: 'dm-serif-dm-sans', scale: 1.5, headingLetterSpacing: -0.03 },
    },
    {
      slug: 'poppins-friendly',
      name: 'Poppins + Roboto, Major Third',
      note: 'Geometric headings on a neutral body, loosened line heights. Reads as approachable rather than serious.',
      state: { pairId: 'poppins-roboto', headingLineHeight: 1.25, bodyLineHeight: 1.7 },
    },
    {
      slug: 'jetbrains-docs',
      name: 'JetBrains Mono + Inter, Minor Third',
      note: 'Monospace headings over a sans body — a documentation scale, at a 15px base.',
      state: { pairId: 'jetbrains-inter', baseSize: 15, scale: 1.2, headingWeight: 800 },
    },
    {
      slug: 'cormorant-luxury',
      name: 'Cormorant + Mulish, Golden Ratio',
      note: 'A high-contrast display serif at 1.618 with positive body tracking. The fashion-editorial setting.',
      state: {
        pairId: 'cormorant-mulish',
        scale: 1.618,
        headingWeight: 600,
        bodyLetterSpacing: 0.02,
      },
    },
    {
      slug: 'lora-augmented-fourth',
      name: 'Lora + Work Sans, Augmented Fourth',
      note: '1.414 on a 17px base — the awkward ratio, and the one that gives six genuinely distinct steps.',
      state: { pairId: 'lora-worksans', baseSize: 17, scale: 1.414 },
    },
  ],
}
