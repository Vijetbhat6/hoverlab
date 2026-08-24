/**
 * Design system export — the whole token set, in your brand, as files.
 *
 * This is the Pro feature that is genuinely Pro-shaped, and it is worth
 * saying why the rest of the catalog is not. Every effect, block and page
 * here is a copyable artifact: the licence is the thing being sold, and a
 * determined person can take the source. This is different in kind. The
 * output does not exist until a customer supplies a brand, it is derived
 * per-customer, and it is the difference between "here are 835 effects"
 * and "here is your design system, and 835 effects that already match it".
 *
 * It is also the direct counter to UI8's Design DNA. Theirs emits a
 * description of a Figma file that an agent then has to rebuild by hand.
 * This emits the tokens AND the artifacts already speak them, because both
 * come from the same `globals.css` every scaffolded project ships with.
 *
 * FOUR FILES, and each exists because a different tool needs the same
 * facts in a different shape:
 *
 *   tokens.css          the browser. Drop-in replacement for the
 *                       `:root`/`.dark` blocks of any Hoverlab template.
 *   tailwind theme      the build. Maps the variables onto class names —
 *                       `bg-primary` is meaningless without it.
 *   tokens.<mode>.json  the designer. W3C DTCG, one file per mode — what
 *                       Figma's variable import reads, so the palette in
 *                       the file is the palette in the code rather than a
 *                       screenshot of it.
 *   hoverlab.config     the agent and the CLI. Machine-readable, so
 *                       `hoverlab add` and an MCP client can emit code in
 *                       the brand without being told the numbers again.
 *
 * COLOUR SPACES. The brand is OKLCH — that is the space the sliders work
 * in, because it is the one where "same lightness, different hue" is true.
 * The token file that templates ship is HSL channels. `lib/dna.ts` states
 * both and declines to convert, which is right for a document a human
 * reads; it is wrong for a file a build consumes, because a stylesheet
 * mixing `oklch()` and `hsl(var(--x))` for the same token is a stylesheet
 * that fails differently in two browsers. So this converts, using the
 * gamut-aware helpers in `lib/color-tools.ts`, and emits the OKLCH source
 * alongside as a comment so nothing is lost.
 *
 * Isomorphic and dependency-free, like `lib/export/index.ts`: the route
 * handler, the CLI and a browser click handler all call the same builder.
 */

import tokens from '@/lib/generated-dna.json'
import {
  oklchToRgb,
  rgbToHsl,
  rgbToHex,
  oklchInSrgbGamut,
  type OKLCH,
} from '@/lib/color-tools'
import { DEFAULT_BRAND_COLOR, type BrandColor } from '@/lib/brand-presets'

/* ------------------------------------------------------------------ *
 *  Deriving a palette from a brand
 * ------------------------------------------------------------------ */

/**
 * How the three brand-driven tokens are derived, mirroring `globals.css`.
 *
 * Kept as data rather than three functions so the CSS and this file can be
 * checked against each other by reading them side by side. If one changes,
 * the other is one edit away and obviously so.
 *
 * `accent` is the brand at a tenth of its chroma: a brand system that asks
 * for an independently chosen accent gets two answers that fight. `dark`
 * pulls chroma back to 0.9, because a saturated hue reads hotter against a
 * dark ground.
 */
const DERIVATION = {
  light: {
    primary: (b: BrandColor): OKLCH => ({ l: b.lightL, c: b.chroma, h: b.hue }),
    ring: (b: BrandColor): OKLCH => ({ l: b.lightL, c: b.chroma, h: b.hue }),
    accent: (b: BrandColor): OKLCH => ({ l: 0.94, c: b.chroma * 0.1, h: b.hue }),
  },
  dark: {
    primary: (b: BrandColor): OKLCH => ({ l: b.darkL, c: b.chroma * 0.9, h: b.hue }),
    ring: (b: BrandColor): OKLCH => ({ l: b.darkL, c: b.chroma * 0.9, h: b.hue }),
    accent: (b: BrandColor): OKLCH => ({ l: 0.26, c: b.chroma * 0.1, h: b.hue }),
  },
} as const

export type Theme = 'light' | 'dark'

/** The tokens a brand actually moves. Everything else is theme furniture. */
export const BRAND_TOKENS = ['primary', 'ring', 'accent'] as const
export type BrandToken = (typeof BRAND_TOKENS)[number]

export interface ResolvedToken {
  /** `"primary"`, `"card-foreground"`, … */
  name: string
  /** HSL channels, the format the token file uses: `"174 62% 38%"`. */
  hsl: string
  /** `"#2f9e8f"`, for tools that will not parse channels. */
  hex: string
  /** The OKLCH this came from, when it came from the brand. */
  oklch: string | null
  /**
   * True when the requested OKLCH sits outside sRGB and was clipped.
   *
   * Surfaced rather than silently corrected: a customer whose brand is a
   * fluorescent orange should be told the hex is an approximation, not
   * handed one that quietly disagrees with the colour they picked.
   */
  clipped: boolean
}

/** `{ l, c, h }` → `"oklch(0.55 0.2 160)"`, rounded for a stylesheet. */
function oklchString({ l, c, h }: OKLCH): string {
  const round = (n: number, places: number) =>
    Number(n.toFixed(places)).toString()
  return `oklch(${round(l, 4)} ${round(c, 4)} ${round(h, 2)})`
}

/** An OKLCH colour as the HSL channels the token format uses. */
function oklchToChannels(color: OKLCH): { hsl: string; hex: string } {
  const rgb = oklchToRgb(color)
  const { h, s, l } = rgbToHsl(rgb)
  return {
    hsl: `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`,
    hex: rgbToHex(rgb),
  }
}

/** HSL channels straight from the token file, plus a hex for convenience. */
function channelsToHex(channels: string): string {
  const [h, s, l] = channels.split(/\s+/)
  const parse = (v: string | undefined) => Number.parseFloat(v ?? '0') || 0
  // `hslToRgb` lives in color-tools but takes numbers; going through it
  // keeps one implementation of the conversion rather than two.
  const rgb = hslChannelsToRgb(parse(h), parse(s), parse(l))
  return rgbToHex(rgb)
}

/** Minimal HSL→RGB, matching `color-tools.hslToRgb` semantics. */
function hslChannelsToRgb(h: number, s: number, l: number) {
  const sat = s / 100
  const light = l / 100
  const c = (1 - Math.abs(2 * light - 1)) * sat
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = light - c / 2
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x]
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

/**
 * Every token for one theme, with the brand applied.
 *
 * The base values come from `generated-dna.json`, which is parsed out of
 * the `globals.css` templates ship — so an export can never describe a
 * palette the templates do not actually use.
 */
export function resolveTokens(brand: BrandColor, theme: Theme): ResolvedToken[] {
  const base = theme === 'light' ? tokens.light : tokens.dark
  const derive = DERIVATION[theme]

  return (tokens.colorKeys as string[]).flatMap((name): ResolvedToken[] => {
    const brandToken = (BRAND_TOKENS as readonly string[]).includes(name)
      ? (name as BrandToken)
      : null

    if (brandToken) {
      const color = derive[brandToken](brand)
      const { hsl, hex } = oklchToChannels(color)
      return [
        {
          name,
          hsl,
          hex,
          oklch: oklchString(color),
          clipped: !oklchInSrgbGamut(color),
        },
      ]
    }

    const channels = base[name as keyof typeof base]
    if (!channels) return []
    return [
      { name, hsl: channels, hex: channelsToHex(channels), oklch: null, clipped: false },
    ]
  })
}

/* ------------------------------------------------------------------ *
 *  The files
 * ------------------------------------------------------------------ */

export interface DesignSystemFile {
  path: string
  language: string
  code: string
}

export interface DesignSystemExport {
  /** Human name for the brand, as given. */
  name: string
  brand: BrandColor
  files: DesignSystemFile[]
  /** Tokens whose colour had to be clipped into sRGB. */
  warnings: string[]
}

export interface DesignSystemOptions {
  /** What to call this brand in comments and in the Figma collection. */
  name?: string
  /** Border radius, if the customer overrides the default. */
  radius?: string
}

function cssBlock(selector: string, resolved: ResolvedToken[], radius?: string): string {
  const lines = resolved.map((token) => {
    // The OKLCH original as a trailing comment on the three derived tokens.
    // Someone re-deriving the palette later needs the source values, and a
    // hex is a lossy record of an OKLCH decision.
    const note = token.oklch ? `  /* ${token.oklch}${token.clipped ? ' — clipped to sRGB' : ''} */` : ''
    return `  --${token.name}: ${token.hsl};${note}`
  })
  if (radius) lines.unshift(`  --radius: ${radius};`)
  return `${selector} {\n${lines.join('\n')}\n}`
}

function buildTokensCss(
  brand: BrandColor,
  name: string,
  radius: string,
): string {
  const light = resolveTokens(brand, 'light')
  const dark = resolveTokens(brand, 'dark')

  return `/**
 * ${name} — design tokens
 *
 * Generated by Hoverlab from your brand colour. Replaces the \`:root\` and
 * \`.dark\` blocks in a Hoverlab template's app/globals.css; every effect,
 * block and page in the catalog styles itself through these names, so
 * changing a value here moves all of them at once.
 *
 * Brand: oklch L ${brand.lightL} (light) / ${brand.darkL} (dark),
 *        chroma ${brand.chroma}, hue ${brand.hue}.
 *
 * Values are HSL channels rather than finished colours because that is
 * what \`hsl(var(--primary))\` in the Tailwind theme expects. The OKLCH each
 * brand-derived token came from is in the comment beside it.
 */

${cssBlock(':root', light, radius)}

${cssBlock('.dark', dark)}
`
}

function buildTailwindTheme(name: string): string {
  const colorEntries = (tokens.colorKeys as string[])
    .map((key) => `        '${key}': 'hsl(var(--${key}))',`)
    .join('\n')

  return `/**
 * ${name} — Tailwind theme
 *
 * Maps the CSS variables in tokens.css onto class names. Without this file
 * \`bg-primary\` is not a class and the tokens do nothing — the two are a
 * pair, and neither works alone.
 *
 * Merge \`theme.extend\` into your existing config rather than replacing it.
 */
import type { Config } from 'tailwindcss'

const theme = {
  extend: {
    colors: {
${colorEntries}
    },
    borderRadius: {
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
    },
  },
} satisfies Config['theme']

export default theme
`
}

/**
 * One theme as a W3C Design Tokens (DTCG) document.
 *
 * This replaced a shape invented here — a `{ name, modes, variables[] }`
 * object with `valuesByMode` — which read plausibly and which no tool on
 * earth consumes. It was labelled "Figma's Variables import format" and
 * was not that; a designer following the README would have got as far as
 * looking for the import button.
 *
 * DTCG is the format that is actually accepted. Every current Figma import
 * plugin (Variables JSON Import, Tokens Studio, TokensBrücke, styleframe)
 * reads it, and Figma's own native variable import — announced for
 * November 2026 against the stable DTCG 1.0 spec — reads it too, by
 * dragging the file in.
 *
 * ONE FILE PER MODE, rather than one file carrying both. DTCG has no
 * settled syntax for modes, so every tool invented its own and none of
 * them agree. Figma's native export resolves it the same way this does:
 * multiple modes come out as a zip with one JSON file per mode. A file
 * that is unambiguously "the light theme" imports everywhere; a file with
 * a clever mode syntax imports into whichever tool inspired it.
 *
 * Hex rather than the HSL channels the CSS uses. Figma has no
 * HSL-channel variable type, so "174 62% 38%" would import as a string
 * variable — a note to a human rather than a colour a rectangle can use.
 *
 * The `$value` is a hex string rather than DTCG 1.0's object colour form
 * (`{ colorSpace, components, alpha }`). That is a deliberate bet on what
 * is verifiable: hex is what every shipping importer accepts today, and
 * the object form can only be tested against an importer that does not
 * exist yet. Revisit when Figma's native import ships and can be tried.
 */
function buildDtcgTokens(
  brand: BrandColor,
  name: string,
  theme: Theme,
  radius: string,
): string {
  const colors: Record<string, unknown> = { $type: 'color' }

  for (const token of resolveTokens(brand, theme)) {
    colors[token.name] = {
      $value: token.hex,
      // The OKLCH the brand tokens came from, carried across. A designer
      // asking "where did this green come from" gets an answer inside
      // Figma rather than having to come back to the export.
      ...(token.oklch ? { $description: `Brand-derived — ${token.oklch}` } : {}),
    }
  }

  return `${JSON.stringify(
    {
      $description: `${name} — Hoverlab design tokens (${theme})`,
      // Top-level keys become collection names in the importers that make
      // collections, so they are named for what they are rather than for
      // this product.
      color: colors,
      radius: {
        $type: 'dimension',
        default: { $value: radius },
      },
    },
    null,
    2,
  )}
`
}

/**
 * The config the CLI and MCP server read.
 *
 * This is the file that makes the export more than four static documents:
 * with it in a project root, `hoverlab add` can emit an artifact already
 * in the customer's brand rather than in ours. It carries the brand as
 * four numbers — the OKLCH source, not the derived hex — because a client
 * that wants to re-derive at a different lightness needs the decision, not
 * its output.
 */
function buildConfig(brand: BrandColor, name: string, radius: string): string {
  return `${JSON.stringify(
    {
      $schema: 'https://hoverlab.dev/schema/hoverlab.config.json',
      brand: { name, ...brand },
      radius,
      tokens: './tokens.css',
    },
    null,
    2,
  )}\n`
}

function buildReadme(name: string, warnings: string[]): string {
  return `# ${name} — design system

Four files, generated from your brand colour.

| File | What reads it |
| ---- | ------------- |
| \`tokens.css\` | the browser — replaces the \`:root\`/\`.dark\` blocks in \`app/globals.css\` |
| \`tailwind-theme.ts\` | the build — merge \`theme.extend\` into your Tailwind config |
| \`tokens.light.json\` / \`tokens.dark.json\` | Figma, and any other design-token tool |
| \`hoverlab.config.json\` | the CLI and MCP server — put it in your project root |

## The two that are a pair

\`tokens.css\` and \`tailwind-theme.ts\` do nothing on their own. The first
declares \`--primary\`; the second is what makes \`bg-primary\` a class that
resolves to it. Install both or neither.

## Getting the tokens into Figma

The two \`tokens.*.json\` files are [W3C Design Tokens](https://www.designtokens.org/)
documents — one per mode, which is how Figma itself splits them.

Figma's **native** variable import is announced for November 2026: drag the
files in, one per mode. Until then any of the community importers read the
same files — *Variables JSON Import*, *Tokens Studio*, *TokensBrücke*.

Import \`tokens.light.json\` into a collection, then \`tokens.dark.json\` into a
second mode on that same collection. Importing into an existing collection
updates the variables rather than duplicating them, so re-exporting after a
brand change is a re-import, not a cleanup.

## Then

\`\`\`
npx hoverlab add pricing-tiers
\`\`\`

With \`hoverlab.config.json\` in the project root, the CLI installs into your
brand rather than ours.

Blocks, pages and templates need nothing from it — they style themselves
through the tokens above, so they follow \`tokens.css\` the moment you drop it
in. Effects are the exception: they are hand-written CSS with literal colours
in them, which is the one rung tokens cannot reach, so the CLI hue-rotates
them towards your brand. That is an approximation, and a good one for the
common case of an accent-coloured component. For an exact rewrite of a single
effect, use the AI recolour on the site.
${
  warnings.length
    ? `\n## Note\n\n${warnings.map((w) => `- ${w}`).join('\n')}\n`
    : ''
}`
}

/**
 * Build the whole export.
 *
 * One call, four files, no I/O — the caller decides whether they become a
 * zip, a clipboard payload or a directory.
 */
export function buildDesignSystem(
  brand: BrandColor = DEFAULT_BRAND_COLOR,
  options: DesignSystemOptions = {},
): DesignSystemExport {
  const name = options.name?.trim() || 'Brand'
  const radius = options.radius?.trim() || tokens.radius

  /*
   * One warning about the brand, not one per token.
   *
   * A chroma outside sRGB clips every token derived from it, so the
   * per-token form said the same thing four times and read like four
   * problems. It is one decision with one fix, and naming the affected
   * tokens in a single sentence is both shorter and more useful.
   *
   * Worth being precise about what this is: the brand is not wrong and the
   * site renders it correctly on a wide-gamut display. It is the HSL
   * channel format — which is what Hoverlab templates ship, so it is what
   * this exports — that cannot hold it. The OKLCH original is in the
   * comment beside every clipped value.
   */
  const clipped = [...resolveTokens(brand, 'light'), ...resolveTokens(brand, 'dark')].filter(
    (token) => token.clipped,
  )
  const warnings = clipped.length
    ? [
        `Chroma ${brand.chroma} is outside sRGB, so ${[...new Set(clipped.map((t) => `--${t.name}`))].join(', ')} were clipped in the exported hex and HSL values. The exact OKLCH is in a comment beside each one; lower the chroma a little for an exact match in every browser.`,
      ]
    : []

  return {
    name,
    brand,
    warnings,
    files: [
      { path: 'tokens.css', language: 'css', code: buildTokensCss(brand, name, radius) },
      {
        path: 'tailwind-theme.ts',
        language: 'ts',
        code: buildTailwindTheme(name),
      },
      {
        path: 'tokens.light.json',
        language: 'json',
        code: buildDtcgTokens(brand, name, 'light', radius),
      },
      {
        path: 'tokens.dark.json',
        language: 'json',
        code: buildDtcgTokens(brand, name, 'dark', radius),
      },
      {
        path: 'hoverlab.config.json',
        language: 'json',
        code: buildConfig(brand, name, radius),
      },
      { path: 'README.md', language: 'md', code: buildReadme(name, warnings) },
    ],
  }
}
