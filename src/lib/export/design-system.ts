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
 * THE FILES, and each exists because a different tool needs the same
 * facts in a different shape:
 *
 *   tokens.css          the browser. Drop-in replacement for the
 *                       `:root`/`.dark` blocks of any Hoverlab template.
 *   tailwind-theme.css  the build, Tailwind v4. v4 has no config file, so
 *                       the mapping onto class names is a CSS `@theme`
 *                       block — `bg-primary` is meaningless without it.
 *   tailwind-theme.v3.ts  the same mapping for Tailwind v3, which is a
 *                       `theme.extend` object in tailwind.config. Both are
 *                       served because both majors are in the wild: a v4
 *                       project has nowhere to merge a config object, and a
 *                       v3 project cannot read an `@theme` block.
 *   tokens.<mode>.json  the designer and the pipeline. W3C DTCG, one file
 *                       per mode: colour, radius steps, spacing and the type
 *                       ramp. What Figma's variable plugins and Style
 *                       Dictionary both read, so the palette in the file is
 *                       the palette in the code rather than a screenshot.
 *   style-dictionary.config.mjs
 *                       builds both DTCG files into CSS and JS, for a team
 *                       that feeds other platforms from the same source.
 *   figma-variables.json  the same tokens as one Figma collection with Light
 *                       and Dark modes — the REST Variables API body, which
 *                       is the only route to real modes. Enterprise-plan
 *                       Figma only; push-figma-variables.mjs sends it.
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
  DEFAULT_THEME_SHAPE,
  describeShape,
  shapeCss,
  shapeEquals,
  shapeThemeVars,
  type ThemeShape,
} from '@/lib/theme-shape'
import {
  buildDtcg,
  buildFigmaPushScript,
  buildFigmaVariables,
  buildStyleDictionaryConfig,
  type TokenDocumentInput,
} from '@/lib/export/design-tokens'
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
  /**
   * Border radius as a CSS length, if the customer overrides the default.
   *
   * Superseded by `shape.radiusRem` and kept because the API route has
   * accepted it since this file was written. When both are given the shape
   * wins, because it is the one a UI can produce.
   */
  radius?: string
  /**
   * Corner radius, spacing density and type scale.
   *
   * The non-colour half of a design system. Two products with the same
   * accent and different radii, gutters and type scales do not look alike,
   * and until this option the export moved one axis — hue — and called the
   * result a design system. See `lib/theme-shape.ts`.
   */
  shape?: ThemeShape
}

/**
 * A brand name, made safe to sit inside a block comment.
 *
 * The name is caller-supplied and is interpolated into the header comment of
 * three source files. A name containing the comment terminator would end the
 * comment early and leave the rest of it as live CSS or TypeScript.
 */
function inComment(name: string): string {
  return name.replace(/\*\//g, '* /')
}

function cssBlock(selector: string,resolved: ResolvedToken[], radius?: string): string {
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
  shape: ThemeShape,
): string {
  const light = resolveTokens(brand, 'light')
  const dark = resolveTokens(brand, 'dark')

  return `/**
 * ${inComment(name)} — design tokens
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
${shapeCss(shape) ? `\n/* ${describeShape(shape)} */\n${shapeCss(shape)}` : ''}`
}

/**
 * The Tailwind v4 theme: a CSS `@theme inline` block, no config file.
 *
 * WHY `hsl(var(--x))` AND NOT A BARE `var(--x)`. This project's own
 * `globals.css` maps `--color-primary: var(--primary)`, and that is correct
 * there because its `--primary` holds a finished colour. The exported
 * tokens.css holds HSL *channels* (`174 62% 38%`), which are not a colour on
 * their own — `background-color: var(--primary)` would be invalid and the
 * declaration would silently drop. So the export wraps them.
 *
 * WHY `inline`. Without it Tailwind emits `--color-primary` as a theme
 * variable and the utility reads that; with it the utility carries
 * `hsl(var(--primary))` directly, so `.dark` swapping `--primary` reaches
 * every utility without a second indirection to keep in step. It is also the
 * same mode the project's own `globals.css` uses, so the two read alike.
 *
 * WHAT IS NOT MAPPED, AND WHY. `shapeCss` also emits `--spacing` and the
 * `--text-*` ramp. Those are already Tailwind v4 theme variables under
 * their native names, and tokens.css declares them in its own `@theme`
 * block, so mapping them again here would be a second copy that could
 * drift. `--radius` is the one shape token that is *not* a v4 namespace
 * (v4 reads `--radius-*`), which is why it is mapped below and they are not.
 */
function buildTailwindV4Theme(name: string): string {
  const colorLines = (tokens.colorKeys as string[])
    .map((key) => `  --color-${key}: hsl(var(--${key}));`)
    .join('\n')

  return `/**
 * ${inComment(name)} — Tailwind CSS v4 theme
 *
 * For Tailwind v4, which has no config file: the theme is CSS. This maps the
 * variables in tokens.css onto class names. Without it \`bg-primary\` is not a
 * class and the tokens do nothing — the two are a pair, and neither works
 * alone.
 *
 * Import all three from your main stylesheet, in this order:
 *
 *   @import "tailwindcss";
 *   @import "./tokens.css";
 *   @import "./tailwind-theme.css";
 *
 * They are all \`@import\` rules, and CSS requires those to come before any
 * other rule, so put them at the very top of the file, above anything else
 * you have written.
 *
 * On Tailwind v3? Use tailwind-theme.v3.ts instead — v3 reads a JS config,
 * not this file. Check the \`tailwindcss\` version in your package.json.
 *
 * Colours are wrapped in hsl() because tokens.css holds HSL channels
 * (\`174 62% 38%\`), not finished colours.
 *
 * Not mapped here: --spacing and the --text-* ramp. They are already native
 * Tailwind v4 theme variables, and tokens.css sets them in its own @theme
 * block when you change the shape.
 */

/* Class-based dark mode, matching the \`.dark\` block in tokens.css. Delete
   this line if your project already declares a dark variant. */
@custom-variant dark (&:is(.dark *));

@theme inline {
${colorLines}

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
`
}

/** The Tailwind v3 theme: an object to merge into tailwind.config. */
function buildTailwindV3Theme(name: string): string {
  const colorEntries = (tokens.colorKeys as string[])
    .map((key) => `        '${key}': 'hsl(var(--${key}))',`)
    .join('\n')

  return `/**
 * ${inComment(name)} — Tailwind CSS v3 theme
 *
 * For Tailwind v3 (a tailwind.config.* file). On Tailwind v4 use
 * tailwind-theme.css instead — v4 has no config file to merge this into.
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
 * The config the CLI and MCP server read.
 *
 * This is the file that makes the export more than a set of static documents:
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

Generated from your brand colour. Which Tailwind file you use depends on your
Tailwind version — you need one of the two, not both.

| File | What reads it |
| ---- | ------------- |
| \`tokens.css\` | the browser — replaces the \`:root\`/\`.dark\` blocks in \`app/globals.css\` |
| \`tailwind-theme.css\` | the build, **Tailwind v4** — a CSS \`@theme\` block you import |
| \`tailwind-theme.v3.ts\` | the build, **Tailwind v3** — merge \`theme.extend\` into \`tailwind.config\` |
| \`tokens.light.json\` / \`tokens.dark.json\` | Figma plugins, Style Dictionary, any DTCG tool |
| \`style-dictionary.config.mjs\` | builds the two DTCG files into CSS and JS |
| \`figma-variables.json\` / \`push-figma-variables.mjs\` | one Figma collection with Light and Dark modes (Enterprise plan) |
| \`hoverlab.config.json\` | the CLI and MCP server — put it in your project root |

## Which Tailwind are you on?

Look at the \`tailwindcss\` version in your \`package.json\`. \`4.x\` (or newer) is
v4; \`3.x\` is v3. A \`tailwind.config.js\` / \`tailwind.config.ts\` file is a good
hint that you are on v3 — v4 projects usually have none, because v4 is
configured in CSS.

### Tailwind v4 — \`tailwind-theme.css\`

There is no config file to edit. Import the files from your main stylesheet
(the one that already has \`@import "tailwindcss"\`), in this order:

\`\`\`css
@import "tailwindcss";
@import "./tokens.css";
@import "./tailwind-theme.css";
\`\`\`

Keep every \`@import\` at the top of the file: CSS ignores an \`@import\` that
comes after any other rule. If you already have a \`.dark\` variant declared,
delete the \`@custom-variant dark\` line from \`tailwind-theme.css\`.

### Tailwind v3 — \`tailwind-theme.v3.ts\`

Import it into your \`tailwind.config\` and merge its \`extend\` keys into your
existing \`theme.extend\` rather than replacing it:

\`\`\`ts
import brand from './tailwind-theme.v3'

export default {
  theme: {
    extend: {
      colors: { ...brand.extend.colors },
      borderRadius: { ...brand.extend.borderRadius },
    },
  },
}
\`\`\`

## The two that are a pair

\`tokens.css\` and your Tailwind file do nothing on their own. The first
declares \`--primary\`; the second is what makes \`bg-primary\` a class that
resolves to it. Install both or neither.

## Getting the tokens into Figma

Two routes. Which one you have depends on your Figma plan.

**Any plan — the DTCG files.** \`tokens.light.json\` and \`tokens.dark.json\` are
[W3C Design Tokens](https://www.designtokens.org/) documents, one per mode.
Figma's native variable import is announced for November 2026; until then the
community importers read the same files — *Variables JSON Import*, *Tokens
Studio*, *TokensBrücke*.

Import \`tokens.light.json\` into a collection, then \`tokens.dark.json\` into a
second mode on that same collection. Importing into an existing collection
updates the variables rather than duplicating them, so re-exporting after a
brand change is a re-import, not a cleanup.

**Enterprise plan — \`figma-variables.json\`.** This is the body of Figma's
Variables REST API, and it is the one output where Light and Dark already live
in a single collection, so \`color/primary\` flips with the frame's mode and
there is nothing to line up by hand. Radius, spacing and type come in a second
"Shape" collection.

\`\`\`
FIGMA_TOKEN=figd_… node push-figma-variables.mjs <file-key-or-url>
\`\`\`

The token needs the \`file_variables:write\` scope and a full seat on an
Enterprise-plan organisation; that is Figma's rule for its Variables API. The
script creates new collections each time, so delete an earlier run's first.

## Style Dictionary

\`\`\`
npm i -D style-dictionary
npx style-dictionary build --config style-dictionary.config.mjs
\`\`\`

Writes \`build/css/light.css\` (\`:root\`), \`build/css/dark.css\` (\`.dark\`) and a
JS module per mode. Variable names follow the token paths, so they differ from
\`tokens.css\`; a web project that only wants CSS should use \`tokens.css\`.

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
 * One call, every file, no I/O — the caller decides whether they become a
 * zip, a clipboard payload or a directory.
 */
export function buildDesignSystem(
  brand: BrandColor = DEFAULT_BRAND_COLOR,
  options: DesignSystemOptions = {},
): DesignSystemExport {
  const name = options.name?.trim() || 'Brand'
  const shape = options.shape ?? DEFAULT_THEME_SHAPE

  /*
   * The shape's radius wins over the legacy `radius` string.
   *
   * Both exist because `radius` predates the shape and the API route has
   * accepted it since the file was written. A caller sending both is
   * almost certainly a UI that sets the shape and an older field it forgot
   * to drop, so the richer one is authoritative — and the default shape
   * leaves `radius` in charge, which keeps every existing caller working.
   */
  const radius = shapeEquals(shape, DEFAULT_THEME_SHAPE)
    ? options.radius?.trim() || tokens.radius
    : `${shape.radiusRem}rem`

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

  const tokenInput: TokenDocumentInput = {
    name,
    light: resolveTokens(brand, 'light'),
    dark: resolveTokens(brand, 'dark'),
    radius,
    shapeVars: shapeThemeVars(shape),
  }

  return {
    name,
    brand,
    warnings,
    files: [
      {
        path: 'tokens.css',
        language: 'css',
        code: buildTokensCss(brand, name, radius, shape),
      },
      {
        path: 'tailwind-theme.css',
        language: 'css',
        code: buildTailwindV4Theme(name),
      },
      {
        path: 'tailwind-theme.v3.ts',
        language: 'ts',
        code: buildTailwindV3Theme(name),
      },
      {
        path: 'tokens.light.json',
        language: 'json',
        code: buildDtcg(tokenInput, 'light'),
      },
      {
        path: 'tokens.dark.json',
        language: 'json',
        code: buildDtcg(tokenInput, 'dark'),
      },
      {
        path: 'style-dictionary.config.mjs',
        language: 'js',
        code: buildStyleDictionaryConfig(name),
      },
      {
        path: 'figma-variables.json',
        language: 'json',
        code: buildFigmaVariables(tokenInput),
      },
      {
        path: 'push-figma-variables.mjs',
        language: 'js',
        code: buildFigmaPushScript(),
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
