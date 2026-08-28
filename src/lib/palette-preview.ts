/**
 * A palette, turned into the token set the whole catalog is styled against.
 *
 * The live-palette tools that exist ask you for four colours and then show
 * them to you as four rectangles next to a paragraph of lorem ipsum. The
 * question a palette actually has to answer is not "do these look nice
 * together" — it is "what happens to a pricing table, a nav bar and a
 * dashboard when I use them", and no amount of swatch is that.
 *
 * So the job of this module is the boring middle step: from four decisions
 * (a background, a text colour, a brand and an accent) derive the twenty-odd
 * semantic tokens every block in the catalog reads — `--card`, `--muted`,
 * `--border`, `--ring`, and both foregrounds of every pair — for light and
 * for dark, and then check the contrast of the pairs that carry text before
 * anyone ships them.
 *
 * All the colour maths is OKLCH, for the same reason the token generator's
 * is: HSL's lightness is a coordinate rather than a perception, so "20%
 * lighter" in HSL is a different amount of lighter for a yellow than for a
 * blue, and a ramp built that way goes muddy in the greens. In OKLCH one
 * lightness step means the same thing at every hue, which is the only way a
 * derivation like this can be written once and be right for any input.
 */

import {
  contrastRatio,
  hexToRgb,
  normalizeHex,
  oklchToRgb,
  rgbToHex,
  rgbToOklch,
  type OKLCH,
} from './color-tools'

/* ============================================================
 *  Input
 * ============================================================ */

export interface PaletteInput {
  /** The page's own surface. */
  background: string
  /** Body text. */
  foreground: string
  /** Buttons, links, focus rings — the colour the product is remembered by. */
  primary: string
  /** The second voice: highlights, badges, secondary emphasis. */
  accent: string
  /** Corner radius in rem — part of a theme, and blocks read it. */
  radius: number
}

export const DEFAULT_PALETTE: PaletteInput = {
  background: '#ffffff',
  foreground: '#0f172a',
  primary: '#4f46e5',
  accent: '#0ea5e9',
  radius: 0.625,
}

/* ============================================================
 *  Colour helpers
 * ============================================================ */

/** A hex through to OKLCH, with a neutral fallback for unparseable input. */
export function hexToOklch(hex: string): OKLCH {
  const rgb = hexToRgb(normalizeHex(hex) ?? '#000000')
  if (!rgb) return { l: 0, c: 0, h: 0 }
  return rgbToOklch(rgb)
}

/** OKLCH back to a hex, clamped into sRGB. */
export function oklchToHex(color: OKLCH): string {
  return rgbToHex(oklchToRgb(color))
}

/** `oklch(L C H)`, at the precision CSS actually needs. */
export function formatOklchToken({ l, c, h }: OKLCH): string {
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/**
 * Blend two colours in OKLCH by `amount` of the second.
 *
 * Hue is interpolated the short way round the wheel, which matters when a
 * blend crosses 0°: a naive average of 350° and 10° is 180°, i.e. the exact
 * opposite colour, and it shows up as a muted surface that is inexplicably
 * green on a red-tinted theme.
 */
export function mixOklch(from: OKLCH, to: OKLCH, amount: number): OKLCH {
  const t = clamp01(amount)
  let deltaH = to.h - from.h
  if (deltaH > 180) deltaH -= 360
  if (deltaH < -180) deltaH += 360
  return {
    l: from.l + (to.l - from.l) * t,
    c: from.c + (to.c - from.c) * t,
    h: (from.h + deltaH * t + 360) % 360,
  }
}

/**
 * Black or white, whichever is legible on this colour.
 *
 * Not a lightness threshold — those are wrong exactly where it matters, on
 * the mid-tone blues and greens that are most people's brand colour. The
 * ratio is measured both ways and the winner is used, so a button label is
 * chosen by the same rule the accessibility check will later apply to it.
 */
export function readableOn(background: string): string {
  const onWhite = contrastRatio('#ffffff', background) ?? 1
  const onBlack = contrastRatio('#0a0a0a', background) ?? 1
  return onWhite >= onBlack ? '#ffffff' : '#0a0a0a'
}

/* ============================================================
 *  Derivation
 * ============================================================ */

export interface DerivedToken {
  /** The CSS custom property, e.g. `--muted-foreground`. */
  name: string
  /** The value as it will be written to CSS. */
  value: string
  /** The same colour as a hex, for swatches and contrast maths. */
  hex: string
}

export interface TokenSet {
  scheme: 'light' | 'dark'
  tokens: DerivedToken[]
  /** Name → hex, for the contrast audit and the inline style. */
  byName: Record<string, string>
}

/**
 * The dark scheme's anchors.
 *
 * A palette is chosen in one scheme and has to work in both, and the naive
 * answer — invert the lightness — produces a dark mode where the background
 * is pure black and the brand colour is unreadable. These are the shadcn dark
 * anchors the whole catalog was designed against; the palette contributes hue
 * and chroma, and the ladder stays where every block already expects it. A
 * generator that shifted this ladder would emit tokens that technically work
 * and make every block look subtly wrong.
 */
const DARK_ANCHORS = {
  background: 0.145,
  card: 0.205,
  muted: 0.269,
  mutedForeground: 0.708,
  foreground: 0.985,
  /** Brand colours have to come up in the dark to stay legible. */
  primary: 0.72,
}

/**
 * Build one scheme's tokens from the palette.
 *
 * The light scheme uses the input colours as given — that is what "preview my
 * palette" has to mean, or the tool is showing you something you did not
 * choose. The dark scheme keeps every hue and chroma and re-seats the
 * lightnesses on the anchors above.
 */
export function deriveTokens(input: PaletteInput, scheme: 'light' | 'dark'): TokenSet {
  const bg = hexToOklch(input.background)
  const fg = hexToOklch(input.foreground)
  const primary = hexToOklch(input.primary)
  const accent = hexToOklch(input.accent)

  /*
    The neutral hue is taken from the background, not from the brand.

    Tinting the greys toward the brand is the trick that makes a theme feel
    designed rather than assembled, and doing it from the *background* is what
    keeps the tint consistent when someone picks a warm off-white and a cold
    blue brand — the surfaces stay a family, and only the brand stands out.
  */
  const neutralHue = bg.c > 0.002 ? bg.h : fg.h
  const neutralChroma = Math.min(0.01, Math.max(bg.c, fg.c * 0.15))
  const neutral = (l: number, c = neutralChroma): OKLCH => ({ l, c, h: neutralHue })

  const dark = scheme === 'dark'

  const surfaces = dark
    ? {
        background: neutral(DARK_ANCHORS.background),
        card: neutral(DARK_ANCHORS.card),
        muted: neutral(DARK_ANCHORS.muted),
        mutedForeground: neutral(DARK_ANCHORS.mutedForeground),
        foreground: neutral(DARK_ANCHORS.foreground),
        // Borders in the dark are lighter than the surface, not darker.
        border: neutral(DARK_ANCHORS.muted + 0.04),
      }
    : {
        background: bg,
        /*
          A card is not the page. On a white background shadcn leaves them
          identical and relies on the border; on a tinted one the card has to
          lift, or every card boundary disappears. Lifting *away* from the
          text keeps that working whichever direction the theme runs.
        */
        card: { ...bg, l: clamp01(bg.l + (fg.l > bg.l ? -0.025 : 0.025)) },
        muted: mixOklch(bg, fg, 0.05),
        mutedForeground: mixOklch(bg, fg, 0.62),
        foreground: fg,
        border: mixOklch(bg, fg, 0.13),
      }

  const primaryColor = dark ? { ...primary, l: DARK_ANCHORS.primary } : primary

  /*
    `--accent` is not the accent colour, and this is the trap in every theme
    generator that emits one.

    In the shadcn convention this token is a *surface* — it is what a menu
    item, a ghost button and a table row turn when you hover them, and 18
    files in this repo alone read it that way. Writing a saturated brand
    colour into it gives you a UI where every hover flashes fluorescent. So
    the accent input contributes its hue and a trace of its chroma to a
    surface that sits one step off the background, which is what the token
    actually means, and the vivid version of it stays where a highlight
    belongs: in the palette you picked, on the swatch, and nowhere near a
    hover state.
  */
  const accentSurface: OKLCH = dark
    ? { l: 0.26, c: Math.min(accent.c, 0.05), h: accent.h }
    : { l: 0.94, c: Math.min(accent.c, 0.04), h: accent.h }

  const primaryHex = oklchToHex(primaryColor)
  const accentHex = oklchToHex(accentSurface)

  // Destructive is not derived. Red means one thing, and a palette that
  // recoloured "delete" to match the brand would be a palette that hid it.
  const destructive: OKLCH = dark
    ? { l: 0.704, c: 0.191, h: 22.2 }
    : { l: 0.577, c: 0.245, h: 27.3 }

  const entries: Array<[string, OKLCH | string]> = [
    ['--background', surfaces.background],
    ['--foreground', surfaces.foreground],
    ['--card', surfaces.card],
    ['--card-foreground', surfaces.foreground],
    ['--popover', surfaces.card],
    ['--popover-foreground', surfaces.foreground],
    ['--primary', primaryColor],
    ['--primary-foreground', readableOn(primaryHex)],
    ['--secondary', surfaces.muted],
    ['--secondary-foreground', surfaces.foreground],
    ['--muted', surfaces.muted],
    ['--muted-foreground', surfaces.mutedForeground],
    ['--accent', accentSurface],
    ['--accent-foreground', readableOn(accentHex)],
    ['--destructive', destructive],
    ['--destructive-foreground', readableOn(oklchToHex(destructive))],
    ['--border', surfaces.border],
    ['--input', surfaces.border],
    // The focus ring is the brand, always. It is the one token where a
    // deliberate choice is worse than consistency: a ring that differs from
    // the button it is on reads as a rendering bug.
    ['--ring', primaryColor],
  ]

  const tokens: DerivedToken[] = entries.map(([name, value]) => {
    if (typeof value === 'string') {
      // Already a hex — the foregrounds picked by contrast.
      const oklch = hexToOklch(value)
      return { name, value: formatOklchToken(oklch), hex: value }
    }
    return { name, value: formatOklchToken(value), hex: oklchToHex(value) }
  })

  const byName: Record<string, string> = {}
  for (const token of tokens) byName[token.name] = token.hex

  return { scheme, tokens, byName }
}

/* ============================================================
 *  Contrast audit
 * ============================================================ */

export interface ContrastCheck {
  /** What this pair is, in the words of the thing on screen. */
  label: string
  foreground: string
  background: string
  ratio: number
  /** The ratio this pair has to clear, and why it is that number. */
  required: number
  requirement: string
  passes: boolean
  /**
   * Reported, but not counted as a failure.
   *
   * 1.4.11 applies to boundaries that carry meaning — the edge of an input,
   * the outline of a focused control — and not to the hairline around a
   * decorative card. Almost no real theme's `--border` clears 3:1 against its
   * own background, shadcn's own default included, so scoring it as a
   * failure would put a permanent red mark on every palette and teach people
   * to ignore the panel. It is worth showing and not worth failing.
   */
  advisory?: boolean
}

/**
 * The pairs that carry meaning, checked at the level they owe.
 *
 * Not every token pair: the ones a WCAG failure actually harms. Body text and
 * secondary text owe 4.5:1; a button label owes 4.5:1 against its own fill; a
 * border that separates a control from the page owes 3:1 as a non-text
 * element. Reporting all 400 combinations would bury the six that matter.
 *
 * This runs against the *derived* tokens rather than the input colours, which
 * is the point — `--muted-foreground` is where a palette usually fails, and
 * nobody picks it by hand.
 */
export function auditContrast(set: TokenSet): ContrastCheck[] {
  const t = set.byName

  const pairs: Array<Omit<ContrastCheck, 'ratio' | 'passes'>> = [
    {
      label: 'Body text on the page',
      foreground: t['--foreground'],
      background: t['--background'],
      required: 4.5,
      requirement: 'AA for body text',
    },
    {
      label: 'Body text on a card',
      foreground: t['--card-foreground'],
      background: t['--card'],
      required: 4.5,
      requirement: 'AA for body text',
    },
    {
      label: 'Secondary text',
      foreground: t['--muted-foreground'],
      background: t['--background'],
      required: 4.5,
      requirement: 'AA — muted is where palettes fail',
    },
    {
      label: 'Primary button label',
      foreground: t['--primary-foreground'],
      background: t['--primary'],
      required: 4.5,
      requirement: 'AA for the text on the button',
    },
    {
      label: 'Text on a hovered row',
      foreground: t['--accent-foreground'],
      background: t['--accent'],
      required: 4.5,
      requirement: 'AA — a menu item stays readable while you hover it',
    },
    {
      label: 'Link and focus colour on the page',
      foreground: t['--primary'],
      background: t['--background'],
      required: 4.5,
      requirement: 'AA — a link is text, whatever else it is',
    },
    {
      label: 'Destructive button label',
      foreground: t['--destructive-foreground'],
      background: t['--destructive'],
      required: 4.5,
      requirement: 'AA — the one button you must not misread',
    },
    {
      label: 'Borders against the page',
      foreground: t['--border'],
      background: t['--background'],
      required: 3,
      requirement: '1.4.11 — non-text contrast, where a boundary carries meaning',
      advisory: true,
    },
  ]

  return pairs.map((pair) => {
    const ratio = contrastRatio(pair.foreground, pair.background) ?? 1
    return {
      ...pair,
      ratio: Math.round(ratio * 100) / 100,
      passes: ratio >= pair.required,
    }
  })
}

/* ============================================================
 *  Output
 * ============================================================ */

/**
 * The tokens as the custom properties that repaint a preview subtree.
 *
 * Returned as a plain record rather than a `React.CSSProperties` so this
 * module stays free of React — it is imported by the Node test runner, and a
 * type-only import that exists for one cast is a dependency the tests would
 * have to carry. The component casts it at the point of use, which is also
 * the only place TypeScript's dislike of custom properties in style objects
 * has to be dealt with.
 */
export function tokensToStyle(set: TokenSet, radius: number): Record<string, string> {
  const style: Record<string, string> = { '--radius': `${radius}rem` }
  for (const token of set.tokens) style[token.name] = token.value
  return style
}

/**
 * The globals.css block.
 *
 * Emitted in the shadcn convention — `:root` for light, `.dark` for dark —
 * because that is what the catalog assumes, what `npx shadcn add` writes, and
 * what most Tailwind projects already have a place for. A palette exported in
 * any other shape is a palette you then have to translate by hand.
 */
export function paletteToCss(input: PaletteInput): string {
  const light = deriveTokens(input, 'light')
  const dark = deriveTokens(input, 'dark')

  const lines = (set: TokenSet) =>
    set.tokens.map((token) => `  ${token.name}: ${token.value};`).join('\n')

  return `/* Generated by Hoverlab — hoverlab.dev/tools/palette-preview
   Every effect, block and page in the catalog is styled against these
   names, so pasting this over your existing token block repaints all of
   them at once. */

:root {
  --radius: ${input.radius}rem;
${lines(light)}
}

.dark {
${lines(dark)}
}`
}

/**
 * The palette as the four decisions that produced it.
 *
 * Small enough to live in a URL, which is what makes a palette shareable
 * without an account — the tool state hook keeps a local copy for the person
 * who made it, and this is the copy they send to someone else.
 */
export function encodePalette(input: PaletteInput): string {
  const strip = (hex: string) => (normalizeHex(hex) ?? '#000000').slice(1)
  return [
    strip(input.background),
    strip(input.foreground),
    strip(input.primary),
    strip(input.accent),
    input.radius.toFixed(3),
  ].join('-')
}

/** The inverse. Returns null rather than a half-decoded palette. */
export function decodePalette(encoded: string): PaletteInput | null {
  const parts = encoded.split('-')
  if (parts.length !== 5) return null
  const hexes = parts.slice(0, 4).map((part) => normalizeHex(`#${part}`))
  if (hexes.some((hex) => hex === null)) return null
  const radius = Number(parts[4])
  if (!Number.isFinite(radius) || radius < 0 || radius > 4) return null
  return {
    background: hexes[0]!,
    foreground: hexes[1]!,
    primary: hexes[2]!,
    accent: hexes[3]!,
    radius,
  }
}

/* ============================================================
 *  Starting points
 * ============================================================ */

export interface PalettePreset extends PaletteInput {
  id: string
  name: string
  /** What this palette is for — the reason to pick it over the next one. */
  note: string
}

/**
 * Palettes worth starting from.
 *
 * Chosen to be structurally different rather than pretty: a near-white with a
 * cool brand, a warm off-white, a high-chroma pair that is one step from
 * failing AA, and a dark-first palette whose light scheme is the derived one.
 * Between them they exercise every branch of the derivation above, which is
 * also why they are the fastest way to see whether it is working.
 */
export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: 'indigo',
    name: 'Indigo on white',
    note: 'The default SaaS palette. Safe, and the baseline everything else is judged against.',
    background: '#ffffff',
    foreground: '#0f172a',
    primary: '#4f46e5',
    accent: '#0ea5e9',
    radius: 0.625,
  },
  {
    id: 'warm',
    name: 'Warm paper',
    note: 'An off-white with a real hue in it, so the greys are derived warm rather than neutral.',
    background: '#fdfaf4',
    foreground: '#2b2118',
    primary: '#b45309',
    accent: '#0f766e',
    radius: 0.75,
  },
  {
    id: 'forest',
    name: 'Forest',
    note: 'A high-chroma green brand — the case where the button label flips from white to near-black.',
    background: '#f7faf8',
    foreground: '#0b2418',
    primary: '#15803d',
    accent: '#ca8a04',
    radius: 0.5,
  },
  {
    id: 'midnight',
    name: 'Midnight',
    note: 'Picked in the dark. The light scheme below it is entirely derived, which is the harder direction.',
    background: '#0b1120',
    foreground: '#e2e8f0',
    primary: '#38bdf8',
    accent: '#f472b6',
    radius: 1,
  },
]
