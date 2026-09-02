/**
 * Per-template colour palettes.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────
 *
 * Every template shipped the same indigo. That is defensible for a catalog
 * of *app* shells — a dashboard and an admin panel genuinely are the same
 * product with different routes — and indefensible for landing pages, which
 * are the one artefact whose whole job is to not look like everyone else's.
 * Two landing templates in the same accent are one landing template with a
 * different running order, and the grid says so at a glance.
 *
 * ── WHY IT IS A MODULE AND NOT FOUR CSS FILES ───────────────────────────
 *
 * `build-artifact-sources.mjs` already lets `files/<id>/app/globals.css`
 * beat the shared copy, so four hand-written CSS files would work — for the
 * *download*. The on-site preview would stay indigo, because the route
 * switcher renders live React against Hoverlab's own tokens and never reads
 * the template's stylesheet at all. Anyone browsing /templates would see
 * four identical thumbnails and four different zips, which is worse than
 * not having done it.
 *
 * So the palette is data, in one place, rendered two ways: `paletteCss`
 * writes the stylesheet that lands in the project, and `paletteVars` writes
 * the inline custom properties that scope the same colours onto a preview.
 * Neither can drift from the other, because there is nothing to keep in
 * step.
 *
 * ── FORMAT: BARE HSL CHANNELS ───────────────────────────────────────────
 *
 * `"265 80% 52%"`, not `hsl(265 80% 52%)`, matching
 * `files/_shared/app/globals.css`. Templates are Tailwind v3 projects where
 * `bg-primary/10` expands to `hsl(var(--primary) / 0.1)`, and a variable
 * that carries its own function wrapper cannot take the alpha suffix. The
 * preview wrapper pays a tiny tax for that — it has to add the `hsl(...)`
 * back — which is the right way round, since the generated project is the
 * thing a customer keeps.
 *
 * ── RADIUS IS PART OF THE PALETTE ───────────────────────────────────────
 *
 * Hue alone does not separate two products; `lib/theme-shape.ts` makes the
 * same argument at length. Corner radius is the cheapest of its three axes
 * to carry here — one token, no Tailwind config change — so each palette
 * sets it. Sharp corners on the developer tool and 16px on the consumer app
 * do as much work as the colour does.
 *
 * DATA-FREE and dependency-free, so client components can import it.
 */

/** Bare HSL channel triples, keyed by token name without the `--`. */
export type TokenMap = Record<string, string>

export interface TemplatePalette {
  id: string
  /** Shown on the template card and the detail page. */
  name: string
  /** One sentence on what this palette reads as. */
  note: string
  /** Overrides `:root`. */
  light: TokenMap
  /** Overrides `.dark`. */
  dark: TokenMap
  /** Base corner radius, in rem. */
  radiusRem: number
}

/**
 * Tokens shared by every palette.
 *
 * Only the ones no palette varies: the sRGB-fixed white and the two input
 * aliases. Anything a palette might reasonably want to move is spelled out
 * per palette instead, because a half-inherited colour scheme is the kind
 * of thing that looks fine until one template changes its background and
 * three tokens quietly stop matching it.
 */
const RADIUS_DEFAULT = 0.75

export const TEMPLATE_PALETTES: TemplatePalette[] = [
  {
    id: 'ultraviolet',
    name: 'Ultraviolet',
    note: 'Saturated violet on a cool near-white. Reads as pre-launch, consumer, slightly loud — which is what a waitlist wants.',
    radiusRem: 1,
    light: {
      background: '270 40% 99%',
      foreground: '265 45% 9%',
      card: '0 0% 100%',
      'card-foreground': '265 45% 9%',
      popover: '0 0% 100%',
      'popover-foreground': '265 45% 9%',
      primary: '265 80% 52%',
      'primary-foreground': '0 0% 100%',
      secondary: '265 40% 96%',
      'secondary-foreground': '265 40% 20%',
      muted: '265 30% 96%',
      'muted-foreground': '265 12% 42%',
      accent: '288 60% 95%',
      'accent-foreground': '288 50% 22%',
      destructive: '0 72% 48%',
      'destructive-foreground': '0 0% 100%',
      border: '265 25% 90%',
      input: '265 25% 90%',
      ring: '265 80% 52%',
    },
    dark: {
      background: '265 40% 5%',
      foreground: '265 15% 97%',
      card: '265 32% 8%',
      'card-foreground': '265 15% 97%',
      popover: '265 32% 8%',
      'popover-foreground': '265 15% 97%',
      primary: '265 90% 76%',
      'primary-foreground': '265 45% 8%',
      secondary: '265 25% 15%',
      'secondary-foreground': '265 15% 97%',
      muted: '265 25% 15%',
      'muted-foreground': '265 12% 68%',
      accent: '288 30% 18%',
      'accent-foreground': '288 40% 92%',
      destructive: '0 62% 52%',
      'destructive-foreground': '0 0% 100%',
      border: '265 22% 19%',
      input: '265 22% 19%',
      ring: '265 90% 76%',
    },
  },

  {
    id: 'graphite',
    name: 'Graphite',
    note: 'Near-black buttons, cool grey neutrals, one green terminal accent. Square-ish corners. The palette developer tools converge on because it stays out of the way of code.',
    radiusRem: 0.25,
    light: {
      background: '220 20% 98%',
      foreground: '220 30% 10%',
      card: '0 0% 100%',
      'card-foreground': '220 30% 10%',
      popover: '0 0% 100%',
      'popover-foreground': '220 30% 10%',
      // Near-black rather than a hue. A dev tool's primary button is not a
      // brand moment, and every accent it does spend goes on the terminal
      // green below.
      primary: '220 30% 18%',
      'primary-foreground': '220 20% 98%',
      secondary: '220 16% 94%',
      'secondary-foreground': '220 30% 16%',
      muted: '220 16% 95%',
      'muted-foreground': '220 12% 42%',
      accent: '158 60% 92%',
      'accent-foreground': '158 70% 16%',
      destructive: '0 70% 45%',
      'destructive-foreground': '0 0% 100%',
      border: '220 14% 89%',
      input: '220 14% 89%',
      ring: '220 30% 18%',
    },
    dark: {
      background: '220 26% 6%',
      foreground: '220 14% 96%',
      card: '220 22% 9%',
      'card-foreground': '220 14% 96%',
      popover: '220 22% 9%',
      'popover-foreground': '220 14% 96%',
      // Inverted, not hue-shifted: the light theme's primary is the darkest
      // thing on the page, so the dark theme's is the lightest. Picking a
      // colour here instead would make the two themes look like different
      // products.
      primary: '220 14% 96%',
      'primary-foreground': '220 30% 10%',
      secondary: '220 18% 15%',
      'secondary-foreground': '220 14% 96%',
      muted: '220 18% 15%',
      'muted-foreground': '220 10% 66%',
      accent: '158 40% 16%',
      'accent-foreground': '158 60% 82%',
      destructive: '0 62% 52%',
      'destructive-foreground': '0 0% 100%',
      border: '220 16% 18%',
      input: '220 16% 18%',
      ring: '220 14% 96%',
    },
  },

  {
    id: 'signal',
    name: 'Signal',
    note: 'Deep emerald with a teal accent and 16px corners. Consumer-app friendly without going pastel.',
    radiusRem: 1,
    light: {
      background: '150 30% 99%',
      foreground: '165 40% 8%',
      card: '0 0% 100%',
      'card-foreground': '165 40% 8%',
      popover: '0 0% 100%',
      'popover-foreground': '165 40% 8%',
      // 24% rather than the 30% this started at. Green is the hue where
      // white-on-fill fails soonest: at 30% it measured 4.21:1 against the
      // 4.5:1 floor, and the same colour as link text on `--muted` was
      // 3.82:1. See palettes.test.ts, which is what caught it.
      primary: '162 88% 24%',
      'primary-foreground': '0 0% 100%',
      secondary: '155 30% 95%',
      'secondary-foreground': '165 40% 18%',
      muted: '155 25% 95%',
      'muted-foreground': '165 12% 40%',
      accent: '175 55% 93%',
      'accent-foreground': '175 60% 16%',
      destructive: '0 72% 47%',
      'destructive-foreground': '0 0% 100%',
      border: '155 20% 89%',
      input: '155 20% 89%',
      ring: '162 88% 24%',
    },
    dark: {
      background: '165 35% 5%',
      foreground: '150 15% 97%',
      card: '165 28% 8%',
      'card-foreground': '150 15% 97%',
      popover: '165 28% 8%',
      'popover-foreground': '150 15% 97%',
      primary: '158 75% 55%',
      'primary-foreground': '165 45% 6%',
      secondary: '165 20% 14%',
      'secondary-foreground': '150 15% 97%',
      muted: '165 20% 14%',
      'muted-foreground': '155 10% 66%',
      accent: '175 30% 17%',
      'accent-foreground': '175 50% 85%',
      destructive: '0 62% 52%',
      'destructive-foreground': '0 0% 100%',
      border: '165 18% 18%',
      input: '165 18% 18%',
      ring: '158 75% 55%',
    },
  },

  {
    id: 'sandstone',
    name: 'Sandstone',
    note: 'Terracotta on warm paper neutrals, tight corners. The one palette here with no blue in it anywhere — which is most of why it reads as a studio rather than a product.',
    radiusRem: 0.375,
    light: {
      background: '40 35% 98%',
      foreground: '25 25% 12%',
      // Warmer than the background rather than pure white, so cards lift
      // off the paper without introducing the only neutral surface in the
      // palette.
      card: '40 40% 99%',
      'card-foreground': '25 25% 12%',
      popover: '40 40% 99%',
      'popover-foreground': '25 25% 12%',
      primary: '18 72% 38%',
      'primary-foreground': '40 40% 99%',
      secondary: '38 30% 93%',
      'secondary-foreground': '25 30% 20%',
      muted: '38 25% 94%',
      'muted-foreground': '28 12% 40%',
      accent: '30 50% 92%',
      'accent-foreground': '22 45% 22%',
      destructive: '0 70% 45%',
      'destructive-foreground': '0 0% 100%',
      border: '36 22% 88%',
      input: '36 22% 88%',
      ring: '18 72% 38%',
    },
    dark: {
      background: '25 25% 6%',
      foreground: '40 20% 96%',
      card: '25 22% 9%',
      'card-foreground': '40 20% 96%',
      popover: '25 22% 9%',
      'popover-foreground': '40 20% 96%',
      primary: '20 80% 62%',
      'primary-foreground': '25 35% 8%',
      secondary: '28 16% 16%',
      'secondary-foreground': '40 20% 96%',
      muted: '28 16% 16%',
      'muted-foreground': '34 12% 66%',
      accent: '30 25% 18%',
      'accent-foreground': '32 45% 86%',
      destructive: '0 62% 52%',
      'destructive-foreground': '0 0% 100%',
      border: '28 15% 19%',
      input: '28 15% 19%',
      ring: '20 80% 62%',
    },
  },

  /* ------------------------------------------------------------------ *
   *  Second wave
   * ------------------------------------------------------------------ *
   *
   * WHY THERE IS NO AMBER OR YELLOW ONE, WHICH WAS THE FIRST PLAN.
   *
   * `--primary` has to survive two jobs: a fill under `--primary-foreground`,
   * and *text* on `--background`, `--card` and `--muted` — blocks use
   * `text-primary` for links and chips as freely as `bg-primary` for
   * buttons. That pins it to a middling-to-dark lightness, and an amber dark
   * enough to read as body text on white has stopped being amber and become
   * brown. The honest options were a brown pretending to be amber, or a
   * palette that fails its own test file. Neither is a palette, so the slot
   * went to Moss instead.
   *
   * The same constraint is why every hue below sits between L 22% and 36% in
   * light mode. It is not a house style; it is the range where a colour can
   * be both a button and a link.
   */

  {
    id: 'harbour',
    name: 'Harbour',
    note: 'Deep teal on a cool near-white. Calm and clinical without going grey — the register a business you let into your house wants.',
    radiusRem: 0.625,
    light: {
      background: '190 40% 99%',
      foreground: '200 40% 9%',
      card: '0 0% 100%',
      'card-foreground': '200 40% 9%',
      popover: '0 0% 100%',
      'popover-foreground': '200 40% 9%',
      primary: '192 88% 26%',
      'primary-foreground': '0 0% 100%',
      secondary: '190 35% 95%',
      'secondary-foreground': '200 40% 18%',
      muted: '190 28% 95%',
      'muted-foreground': '200 12% 40%',
      accent: '172 50% 92%',
      'accent-foreground': '180 60% 15%',
      destructive: '0 72% 47%',
      'destructive-foreground': '0 0% 100%',
      border: '190 22% 88%',
      input: '190 22% 88%',
      ring: '192 88% 26%',
    },
    dark: {
      background: '200 38% 5%',
      foreground: '190 15% 97%',
      card: '200 30% 8%',
      'card-foreground': '190 15% 97%',
      popover: '200 30% 8%',
      'popover-foreground': '190 15% 97%',
      primary: '188 75% 55%',
      'primary-foreground': '200 45% 6%',
      secondary: '200 22% 14%',
      'secondary-foreground': '190 15% 97%',
      muted: '200 22% 14%',
      'muted-foreground': '195 10% 66%',
      accent: '172 30% 17%',
      'accent-foreground': '172 50% 85%',
      destructive: '0 62% 52%',
      'destructive-foreground': '0 0% 100%',
      border: '200 18% 18%',
      input: '200 18% 18%',
      ring: '188 75% 55%',
    },
  },

  {
    id: 'moss',
    name: 'Moss',
    note: 'Dark olive on a warm off-white. Reads as made rather than manufactured, which is the whole difference between a marketplace and a shop.',
    radiusRem: 0.5,
    light: {
      background: '80 30% 98%',
      foreground: '100 30% 9%',
      card: '80 35% 99%',
      'card-foreground': '100 30% 9%',
      popover: '80 35% 99%',
      'popover-foreground': '100 30% 9%',
      // Olive, not emerald — 95° rather than Signal's 162°. Close enough on
      // a colour wheel to be worth saying out loud, far enough apart that
      // the two cards never read as the same template.
      primary: '95 70% 22%',
      'primary-foreground': '80 35% 99%',
      secondary: '85 25% 93%',
      'secondary-foreground': '100 30% 18%',
      muted: '85 22% 94%',
      'muted-foreground': '95 12% 38%',
      accent: '70 45% 90%',
      'accent-foreground': '90 50% 16%',
      destructive: '0 70% 45%',
      'destructive-foreground': '0 0% 100%',
      border: '85 20% 87%',
      input: '85 20% 87%',
      ring: '95 70% 22%',
    },
    dark: {
      background: '100 25% 5%',
      foreground: '80 18% 96%',
      card: '100 20% 8%',
      'card-foreground': '80 18% 96%',
      popover: '100 20% 8%',
      'popover-foreground': '80 18% 96%',
      primary: '90 60% 58%',
      'primary-foreground': '100 35% 7%',
      secondary: '95 16% 15%',
      'secondary-foreground': '80 18% 96%',
      muted: '95 16% 15%',
      'muted-foreground': '88 10% 66%',
      accent: '70 25% 18%',
      'accent-foreground': '75 45% 84%',
      destructive: '0 62% 52%',
      'destructive-foreground': '0 0% 100%',
      border: '95 14% 19%',
      input: '95 14% 19%',
      ring: '90 60% 58%',
    },
  },

  {
    id: 'claret',
    name: 'Claret',
    note: 'Burgundy on a barely-warm white, with square corners. The palette of institutions rather than products — banks, law firms, the kind of software bought in a boardroom.',
    radiusRem: 0.25,
    light: {
      background: '350 25% 99%',
      foreground: '345 30% 10%',
      card: '0 0% 100%',
      'card-foreground': '345 30% 10%',
      popover: '0 0% 100%',
      'popover-foreground': '345 30% 10%',
      primary: '348 75% 33%',
      'primary-foreground': '0 0% 100%',
      secondary: '348 25% 95%',
      'secondary-foreground': '345 35% 18%',
      muted: '348 18% 95%',
      'muted-foreground': '345 10% 40%',
      accent: '330 40% 93%',
      'accent-foreground': '335 45% 20%',
      // Shifted to 14° — an orange-red — rather than the 0–6° every other
      // palette uses. This is the one palette whose primary is itself in the
      // red family, and a destructive button that is merely a lighter
      // burgundy is a destructive button nobody reads as a warning.
      destructive: '14 78% 40%',
      'destructive-foreground': '0 0% 100%',
      border: '345 18% 89%',
      input: '345 18% 89%',
      ring: '348 75% 33%',
    },
    dark: {
      background: '345 30% 5%',
      foreground: '350 15% 97%',
      card: '345 24% 8%',
      'card-foreground': '350 15% 97%',
      popover: '345 24% 8%',
      'popover-foreground': '350 15% 97%',
      primary: '348 80% 68%',
      'primary-foreground': '345 40% 7%',
      secondary: '345 18% 15%',
      'secondary-foreground': '350 15% 97%',
      muted: '345 18% 15%',
      'muted-foreground': '348 10% 67%',
      accent: '330 22% 18%',
      'accent-foreground': '330 40% 87%',
      destructive: '14 75% 44%',
      'destructive-foreground': '0 0% 100%',
      border: '345 16% 19%',
      input: '345 16% 19%',
      ring: '348 80% 68%',
    },
  },

  {
    id: 'cobalt',
    name: 'Cobalt',
    note: 'The blue everything infrastructure is, done properly rather than by default — high chroma at 212°, with a lighter azure accent to keep it off the navy end.',
    radiusRem: 0.75,
    light: {
      background: '210 40% 99%',
      foreground: '215 45% 10%',
      card: '0 0% 100%',
      'card-foreground': '215 45% 10%',
      popover: '0 0% 100%',
      'popover-foreground': '215 45% 10%',
      // Graphite's neutrals also sit around 220°, which sounds like a clash
      // and is not one: that palette runs 14–30% saturation and reads as
      // grey, this one runs 90% and reads as blue. Hue alone does not
      // decide what a colour looks like.
      primary: '212 90% 36%',
      'primary-foreground': '0 0% 100%',
      secondary: '210 35% 95%',
      'secondary-foreground': '215 40% 18%',
      muted: '210 28% 95%',
      'muted-foreground': '215 12% 42%',
      accent: '198 60% 92%',
      'accent-foreground': '205 60% 18%',
      destructive: '0 72% 47%',
      'destructive-foreground': '0 0% 100%',
      border: '210 24% 89%',
      input: '210 24% 89%',
      ring: '212 90% 36%',
    },
    dark: {
      background: '215 42% 5%',
      foreground: '210 15% 97%',
      card: '215 34% 8%',
      'card-foreground': '210 15% 97%',
      popover: '215 34% 8%',
      'popover-foreground': '210 15% 97%',
      primary: '208 90% 66%',
      'primary-foreground': '215 50% 7%',
      secondary: '215 26% 15%',
      'secondary-foreground': '210 15% 97%',
      muted: '215 26% 15%',
      'muted-foreground': '212 12% 67%',
      accent: '198 32% 18%',
      'accent-foreground': '198 55% 86%',
      destructive: '0 62% 52%',
      'destructive-foreground': '0 0% 100%',
      border: '215 22% 19%',
      input: '215 22% 19%',
      ring: '208 90% 66%',
    },
  },

  {
    id: 'plum',
    name: 'Plum',
    note: 'Magenta-plum with 20px corners — the softest shape in the set. Personal and a little expensive, for a product that is one person rather than a company.',
    radiusRem: 1.25,
    light: {
      background: '310 35% 99%',
      foreground: '312 35% 10%',
      card: '0 0% 100%',
      'card-foreground': '312 35% 10%',
      popover: '0 0% 100%',
      'popover-foreground': '312 35% 10%',
      primary: '312 72% 36%',
      'primary-foreground': '0 0% 100%',
      secondary: '312 32% 96%',
      'secondary-foreground': '312 35% 20%',
      muted: '312 24% 96%',
      'muted-foreground': '312 10% 42%',
      accent: '286 45% 94%',
      'accent-foreground': '290 45% 22%',
      destructive: '0 72% 47%',
      'destructive-foreground': '0 0% 100%',
      border: '312 22% 90%',
      input: '312 22% 90%',
      ring: '312 72% 36%',
    },
    dark: {
      background: '312 34% 5%',
      foreground: '310 15% 97%',
      card: '312 28% 8%',
      'card-foreground': '310 15% 97%',
      popover: '312 28% 8%',
      'popover-foreground': '310 15% 97%',
      primary: '310 80% 72%',
      'primary-foreground': '312 42% 7%',
      secondary: '312 22% 15%',
      'secondary-foreground': '310 15% 97%',
      muted: '312 22% 15%',
      'muted-foreground': '312 10% 68%',
      accent: '286 26% 18%',
      'accent-foreground': '288 45% 88%',
      destructive: '0 62% 52%',
      'destructive-foreground': '0 0% 100%',
      border: '312 20% 19%',
      input: '312 20% 19%',
      ring: '310 80% 72%',
    },
  },
]

const BY_ID = new Map(TEMPLATE_PALETTES.map((p) => [p.id, p]))

/** Look up a palette by id. Returns undefined for unknown ids. */
export function getPalette(id: string | undefined): TemplatePalette | undefined {
  return id ? BY_ID.get(id) : undefined
}

/* ------------------------------------------------------------------ *
 *  Rendering 1 — the stylesheet that ships in the project
 * ------------------------------------------------------------------ */

function declarations(tokens: TokenMap, indent: string): string {
  return Object.entries(tokens)
    .map(([name, value]) => `${indent}--${name}: ${value};`)
    .join('\n')
}

/**
 * The complete `app/globals.css` for a palette.
 *
 * A complete file, not a patch, because the build script's merge is
 * per-path: `files/<id>/app/globals.css` *replaces* the shared copy rather
 * than cascading after it. Emitting only the overrides would ship a project
 * whose `@tailwind` directives and reduced-motion backstop had vanished.
 */
export function paletteCss(palette: TemplatePalette): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

/**
 * Design tokens — the ${palette.name} palette.
 *
 * ${palette.note}
 *
 * This file is the reason a pasted block looks right. Every block and page
 * styles itself with semantic classes — \`bg-card\`, \`text-muted-foreground\`,
 * \`border-border\` — rather than literal colours, so they inherit whatever
 * you define here instead of fighting it. Change a value below and every
 * section in the project moves with it. Change the hue on \`--primary\` and
 * \`--ring\` together and you have rebranded the site.
 *
 * Values are bare HSL channels, not \`hsl(...)\` calls. That is what lets
 * Tailwind compose them with an alpha suffix: \`bg-primary/10\` expands to
 * \`hsl(var(--primary) / 0.1)\`, which is impossible if the variable already
 * carries its own function wrapper.
 *
 * Every foreground/background pair below clears WCAG AA (4.5:1) in both
 * themes. If you retune one, check the pair rather than trusting the eye —
 * mid-lightness accents are the ones that fail.
 */

@layer base {
  :root {
${declarations(palette.light, '    ')}

    --radius: ${palette.radiusRem}rem;
  }

  .dark {
${declarations(palette.dark, '    ')}
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground antialiased;
  }

  /**
   * Global motion opt-out.
   *
   * Blocks guard their own animations with Tailwind's \`motion-safe:\`, but
   * third-party CSS and anything you add later will not. This is the
   * backstop: it neutralises every animation and transition on the page
   * for users who have asked the OS for reduced motion, rather than
   * relying on each author to remember.
   */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}
`
}

/* ------------------------------------------------------------------ *
 *  Rendering 2 — inline custom properties for the on-site preview
 * ------------------------------------------------------------------ */

/**
 * The palette as inline CSS custom properties, for scoping onto a preview.
 *
 * Two differences from the stylesheet above, both forced by the host:
 *
 *   1. `hsl(...)` is added back. Hoverlab is Tailwind v4, where
 *      `@theme inline` maps `--color-primary` straight to `var(--primary)`
 *      and expects a whole colour. Handing it bare channels would produce
 *      `color: 265 80% 52%`, which is not a colour and renders as
 *      inherited black.
 *
 *   2. Only the light map is emitted. A `.dark` selector cannot be
 *      expressed inline, and the preview already sits inside whichever
 *      theme the visitor picked, so this returns the theme-appropriate set
 *      and the caller says which.
 *
 * The `--radius` is included: it is what makes Graphite's square corners
 * visible in the thumbnail rather than only in the download.
 */
export function paletteVars(
  palette: TemplatePalette,
  theme: 'light' | 'dark' = 'light',
): Record<string, string> {
  const tokens = theme === 'dark' ? palette.dark : palette.light

  const vars: Record<string, string> = {}
  for (const [name, value] of Object.entries(tokens)) {
    vars[`--${name}`] = `hsl(${value})`
  }
  vars['--radius'] = `${palette.radiusRem}rem`
  return vars
}

/**
 * The class name a palette's preview scope uses. Stable, so the stylesheet
 * and the wrapper cannot disagree about it.
 */
export function paletteClassName(palette: TemplatePalette): string {
  return `palette-${palette.id}`
}

/**
 * A scoped stylesheet that recolours everything inside one element.
 *
 * WHY A `<style>` RULE AND NOT AN INLINE `style` ATTRIBUTE. Inline custom
 * properties are one set of values, and this site has two themes chosen at
 * runtime. `.dark` lives on `<html>`, far above any wrapper we control, so
 * the only way to answer both from the server is a rule per theme — which
 * also means the preview is correct on first paint rather than after a
 * hydration pass, and switching the site theme recolours it for free.
 *
 * The specificity is deliberately flat: one class, and `.dark` + one class.
 * Anything inside sets its colours from `var(--primary)` and friends, so
 * these do not need to out-specify component styles — they only need to
 * out-specify `:root`, which any class does.
 */
export function paletteScopeCss(palette: TemplatePalette): string {
  const scope = `.${paletteClassName(palette)}`

  const block = (selector: string, theme: 'light' | 'dark') => {
    const body = Object.entries(paletteVars(palette, theme))
      .map(([name, value]) => `  ${name}: ${value};`)
      .join('\n')
    return `${selector} {\n${body}\n}`
  }

  return [block(scope, 'light'), block(`.dark ${scope}`, 'dark')].join('\n\n')
}

/**
 * A single CSS colour for a swatch — the primary, in light theme.
 *
 * Cards show this rather than the whole palette. A row of six chips is a
 * colour-scheme editor; one chip is a label, which is all a grid needs to
 * say "these two are not the same template".
 */
export function paletteSwatch(palette: TemplatePalette): string {
  return `hsl(${palette.light.primary})`
}

/** Default radius, for templates with no palette of their own. */
export const DEFAULT_RADIUS_REM = RADIUS_DEFAULT
