/**
 * The token documents: the same design system as W3C DTCG, as a Figma
 * Variables payload, and as a Style Dictionary config.
 *
 * `design-system.ts` owns the brand → palette derivation and the CSS files.
 * This owns the three formats a *tool* consumes. They are split because they
 * answer different questions: the CSS files say "what does the browser read",
 * these say "what does a design tool or a token pipeline read", and only the
 * second group has an external spec to be wrong against.
 *
 * It takes already-resolved tokens rather than a brand, and it does not import
 * `design-system.ts`. That direction matters: `design-system.ts` calls this,
 * and a cycle would make the two impossible to test apart.
 *
 * ── WHAT THE TOKENS ARE ─────────────────────────────────────────────────
 *
 *   color.<name>        the eighteen semantic colours, per mode, as hex
 *   radius.<step>       default plus the four steps `rounded-sm…xl` resolve to
 *   spacing.base        Tailwind v4's `--spacing`, which every p-*, gap-* and
 *                       size-* utility multiplies
 *   fontSize.<step>     the `text-*` ramp, xs → 6xl
 *   lineHeight.<step>   its paired line heights
 *
 * The last three are new. DTCG used to carry colour and one radius, which is
 * the half of a design system that a hue slider moves; density and type scale
 * are the other half, and a Figma file without them has the right colours on
 * the wrong-sized boxes.
 *
 * Dimensions stay in `rem` in DTCG (the unit the CSS uses, so a Style
 * Dictionary build reproduces the stylesheet) and become `px` in Figma, whose
 * FLOAT variables have no unit and are read as pixels by every frame.
 */

/** One colour, resolved. Structural, so `ResolvedToken` satisfies it. */
export interface TokenColor {
  name: string
  hex: string
  /** The OKLCH this came from, when it came from the brand. */
  oklch: string | null
}

export interface TokenDocumentInput {
  /** What to call this design system. */
  name: string
  light: TokenColor[]
  dark: TokenColor[]
  /**
   * Corner radius as a CSS length. Given separately from `shapeVars` because
   * a legacy caller can pass a radius the shape does not know about.
   */
  radius: string
  /**
   * The shape's variables — `shapeThemeVars()` — `--spacing`, `--text-*` and
   * `--text-*--line-height`. The complete set, not the omit-the-default set,
   * because a token file that silently omits a default is a token file that
   * cannot be diffed against a previous export.
   */
  shapeVars: Record<string, string>
}

export type Mode = 'light' | 'dark'

/* ------------------------------------------------------------------ *
 *  Dimensions
 * ------------------------------------------------------------------ */

/** `"0.75rem"` → 0.75. Anything that is not a rem length is null. */
function remOf(length: string): number | null {
  const match = /^(-?\d*\.?\d+)rem$/.exec(length.trim())
  return match ? Number(match[1]) : null
}

function rem(value: number): string {
  return `${Number(value.toFixed(4))}rem`
}

interface Dimension {
  /** DTCG path: `['fontSize', 'xs']`. */
  path: [string, string]
  value: string
  description?: string
}

/**
 * The non-colour tokens, in a stable order.
 *
 * Radius steps are computed here rather than left as `calc()`: DTCG and Figma
 * both want a finished number, and the CSS `@theme` block that says
 * `calc(var(--radius) - 4px)` is one this has to agree with, which
 * `design-tokens.test.ts` checks. Clamped at zero, because a Sharp shape has
 * a 2px radius and `rounded-sm` at −2px is not a thing either tool can hold.
 */
function dimensions(input: TokenDocumentInput): Dimension[] {
  const out: Dimension[] = []

  const radius = remOf(input.radius)
  out.push({ path: ['radius', 'default'], value: input.radius })
  if (radius !== null) {
    const step = (name: string, offsetPx: number, note: string) =>
      out.push({
        path: ['radius', name],
        value: rem(Math.max(0, radius + offsetPx / 16)),
        description: note,
      })
    step('sm', -4, 'rounded-sm — the default radius minus 4px')
    step('md', -2, 'rounded-md — the default radius minus 2px')
    step('lg', 0, 'rounded-lg — the default radius')
    step('xl', 4, 'rounded-xl — the default radius plus 4px')
  }

  const spacing = input.shapeVars['--spacing']
  if (spacing) {
    out.push({
      path: ['spacing', 'base'],
      value: spacing,
      description: 'The unit every p-*, m-*, gap-* and size-* utility multiplies',
    })
  }

  // `--text-xs` and `--text-xs--line-height`, in the order the ramp declares
  // them. Object insertion order is the ramp's own, so the output is stable.
  for (const [key, value] of Object.entries(input.shapeVars)) {
    const line = /^--text-(.+)--line-height$/.exec(key)
    if (line?.[1]) {
      out.push({ path: ['lineHeight', line[1]], value })
      continue
    }
    const size = /^--text-(.+)$/.exec(key)
    if (size?.[1]) out.push({ path: ['fontSize', size[1]], value })
  }

  return out
}

/* ------------------------------------------------------------------ *
 *  W3C DTCG
 * ------------------------------------------------------------------ */

/**
 * One mode as a W3C Design Tokens document.
 *
 * ONE FILE PER MODE. DTCG has no settled syntax for modes, so every tool
 * invented its own and none agree. A file that is unambiguously "the light
 * theme" imports everywhere; a file with a clever mode syntax imports into
 * whichever tool inspired it. Figma's own export resolves it the same way.
 * (The Figma Variables file below is where both modes share one collection.)
 *
 * The colour `$value` is a hex string rather than DTCG 1.0's object form
 * (`{ colorSpace, components }`). Hex is what every shipping importer accepts
 * and what Style Dictionary reads today; the object form can only be tried
 * against tools that read it, and those are still arriving.
 */
export function buildDtcg(input: TokenDocumentInput, mode: Mode): string {
  const colors: Record<string, unknown> = { $type: 'color' }
  for (const token of input[mode]) {
    colors[token.name] = {
      $value: token.hex,
      // The OKLCH the brand tokens came from, so "where did this green come
      // from" is answerable inside the design tool.
      ...(token.oklch ? { $description: `Brand-derived — ${token.oklch}` } : {}),
    }
  }

  const groups: Record<string, Record<string, unknown>> = {}
  for (const dimension of dimensions(input)) {
    const [group, key] = dimension.path
    groups[group] ??= { $type: 'dimension' }
    groups[group][key] = {
      $value: dimension.value,
      ...(dimension.description ? { $description: dimension.description } : {}),
    }
  }

  return `${JSON.stringify(
    {
      $description: `${input.name} — Hoverlab design tokens (${mode})`,
      color: colors,
      ...groups,
    },
    null,
    2,
  )}\n`
}

/* ------------------------------------------------------------------ *
 *  Figma Variables
 * ------------------------------------------------------------------ */

/** `"#2f9e8f"` → Figma's 0–1 float channels. */
function hexToFigma(hex: string): { r: number; g: number; b: number; a: number } {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const channel = (offset: number) => Number((parseInt(full.slice(offset, offset + 2), 16) / 255).toFixed(4))
  return { r: channel(0), g: channel(2), b: channel(4), a: 1 }
}

/**
 * The body of `POST /v1/files/:file_key/variables`.
 *
 * WHAT THIS IS. Figma's REST Variables API takes exactly this shape — four
 * arrays that create collections, modes, variables and the value of each
 * variable in each mode, tied together by temporary ids the caller invents.
 * It is the one place a Light/Dark pair lives in a *single* collection, which
 * is the thing per-mode DTCG files cannot express and a designer actually
 * wants: one `color/primary` variable that flips when the frame's mode does.
 *
 * WHAT IT COSTS. Writing variables through the REST API needs a full seat on
 * an Enterprise-plan Figma org and a token with the `file_variables:write`
 * scope. That is Figma's restriction, not ours, and it is why the DTCG files
 * remain the route for everyone else — this file is the better output for
 * the people who can use it, not a replacement for the portable one.
 *
 * TWO COLLECTIONS. Colour has two modes; radius, spacing and type do not vary
 * by mode and would be a second identical column if they shared it. A single
 * mode called "Default" is the Figma convention for that.
 *
 * Names use `/`, which Figma renders as folders: `color/primary`,
 * `fontSize/xs`.
 */
export function buildFigmaVariables(input: TokenDocumentInput): string {
  const colorCollection = 'collection_color'
  const shapeCollection = 'collection_shape'
  const modeLight = 'mode_light'
  const modeDark = 'mode_dark'
  const modeDefault = 'mode_default'

  const variables: Array<Record<string, unknown>> = []
  const values: Array<Record<string, unknown>> = []

  const darkByName = new Map(input.dark.map((token) => [token.name, token]))
  for (const token of input.light) {
    const id = `var_color_${token.name}`
    variables.push({
      action: 'CREATE',
      id,
      name: `color/${token.name}`,
      variableCollectionId: colorCollection,
      resolvedType: 'COLOR',
      ...(token.oklch ? { description: `Brand-derived — ${token.oklch}` } : {}),
    })
    values.push({ variableId: id, modeId: modeLight, value: hexToFigma(token.hex) })
    // A token present in light and absent in dark falls back to its light
    // value: a variable with no value in one of its modes renders as nothing.
    values.push({
      variableId: id,
      modeId: modeDark,
      value: hexToFigma((darkByName.get(token.name) ?? token).hex),
    })
  }

  for (const dimension of dimensions(input)) {
    const rems = remOf(dimension.value)
    if (rems === null) continue
    const id = `var_${dimension.path.join('_')}`
    variables.push({
      action: 'CREATE',
      id,
      name: dimension.path.join('/'),
      variableCollectionId: shapeCollection,
      resolvedType: 'FLOAT',
      ...(dimension.description ? { description: dimension.description } : {}),
    })
    values.push({
      variableId: id,
      modeId: modeDefault,
      value: Number((rems * 16).toFixed(2)),
    })
  }

  return `${JSON.stringify(
    {
      variableCollections: [
        {
          action: 'CREATE',
          id: colorCollection,
          name: `${input.name} — Color`,
          initialModeId: modeLight,
        },
        {
          action: 'CREATE',
          id: shapeCollection,
          name: `${input.name} — Shape`,
          initialModeId: modeDefault,
        },
      ],
      // The initial mode of a new collection is created for you under the
      // temporary id given above; an UPDATE is how it gets its name.
      variableModes: [
        { action: 'UPDATE', id: modeLight, variableCollectionId: colorCollection, name: 'Light' },
        { action: 'CREATE', id: modeDark, variableCollectionId: colorCollection, name: 'Dark' },
        { action: 'UPDATE', id: modeDefault, variableCollectionId: shapeCollection, name: 'Default' },
      ],
      variables,
      variableModeValues: values,
    },
    null,
    2,
  )}\n`
}

/**
 * A script that sends `figma-variables.json` to a file.
 *
 * Kept as a file rather than a paragraph of curl because the two things that
 * go wrong — a token in shell history, a file key copied with its query
 * string — are both easier to prevent in twenty lines than to warn about.
 * Node 18+, no dependencies.
 */
export function buildFigmaPushScript(): string {
  return `#!/usr/bin/env node
/**
 * Send figma-variables.json to a Figma file.
 *
 *   FIGMA_TOKEN=figd_… node push-figma-variables.mjs <file-key-or-url>
 *
 * Needs a full seat on an Enterprise-plan Figma organisation and a personal
 * access token with the file_variables:write scope — Figma's restriction on
 * its Variables API, not this script's. On any other plan, import the two
 * tokens.*.json files with a DTCG variables plugin instead.
 *
 * Creates new collections every time it runs; it does not update ones a
 * previous run made. Delete the old collections in Figma first, or run it
 * against a fresh file.
 */
import { readFile } from 'node:fs/promises'

const token = process.env.FIGMA_TOKEN
const target = process.argv[2]
if (!token || !target) {
  console.error('Usage: FIGMA_TOKEN=figd_… node push-figma-variables.mjs <file-key-or-url>')
  process.exit(1)
}

// Accepts the key or a pasted URL: figma.com/design/<key>/Name?node-id=…
const key = /figma\\.com\\/(?:file|design)\\/([A-Za-z0-9]+)/.exec(target)?.[1] ?? target

const body = await readFile(new URL('./figma-variables.json', import.meta.url), 'utf8')
const response = await fetch(\`https://api.figma.com/v1/files/\${key}/variables\`, {
  method: 'POST',
  headers: { 'X-Figma-Token': token, 'Content-Type': 'application/json' },
  body,
})

const result = await response.json().catch(() => ({}))
if (!response.ok || result.error) {
  console.error(\`Figma said \${response.status}: \${result.message ?? JSON.stringify(result)}\`)
  process.exit(1)
}
console.log('Done. Open the file and look for the "Color" and "Shape" variable collections.')
`
}

/* ------------------------------------------------------------------ *
 *  Style Dictionary
 * ------------------------------------------------------------------ */

/**
 * A Style Dictionary config that builds both modes.
 *
 * Style Dictionary reads the DTCG files as they are; what it cannot know is
 * that they are two modes of one system, which is the part a team otherwise
 * writes themselves and gets subtly wrong (both files into one build, the
 * second silently overwriting the first). This is that part, written once.
 *
 * WHAT IT BUILDS. CSS custom properties — `:root` for light, `.dark` for dark
 * — and an ES module per mode. The variable names follow the token paths
 * (`--color-primary`, `--fontSize-xs`), which is Style Dictionary's own
 * convention and is *not* the naming of tokens.css. That is on purpose: this
 * is for a pipeline that also feeds iOS, Android or a JS theme object, where
 * `color.primary` is the shared name. A web project that only wants the CSS
 * should use tokens.css, which is already in the shape Tailwind reads.
 *
 * Written for Style Dictionary 4 and 5, which share this API.
 */
export function buildStyleDictionaryConfig(name: string): string {
  const safe = name.replace(/\*\//g, '* /')
  return `/**
 * ${safe} — Style Dictionary config
 *
 *   npm i -D style-dictionary
 *   npx style-dictionary build --config style-dictionary.config.mjs
 *
 * Builds tokens.light.json and tokens.dark.json into ./build/:
 *
 *   build/css/light.css   :root { --color-primary: #…; }
 *   build/css/dark.css    .dark { --color-primary: #…; }
 *   build/js/light.js     export default { color: { primary: '#…' }, … }
 *   build/js/dark.js
 *
 * The variable names follow the token paths, which is not how tokens.css
 * names them. For a web project that only wants CSS, use tokens.css; this is
 * for a pipeline that also feeds other platforms from the same source.
 */
import StyleDictionary from 'style-dictionary'

const modes = [
  { mode: 'light', selector: ':root' },
  { mode: 'dark', selector: '.dark' },
]

for (const { mode, selector } of modes) {
  const sd = new StyleDictionary({
    source: [\`tokens.\${mode}.json\`],
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath: 'build/css/',
        files: [
          {
            destination: \`\${mode}.css\`,
            format: 'css/variables',
            options: { selector },
          },
        ],
      },
      js: {
        transformGroup: 'js',
        buildPath: 'build/js/',
        files: [{ destination: \`\${mode}.js\`, format: 'javascript/es6' }],
      },
    },
  })
  await sd.buildAllPlatforms()
}
`
}
