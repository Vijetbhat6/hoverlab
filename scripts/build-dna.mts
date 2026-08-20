// Extract the design tokens a template ships with, for Design DNA.
//
// The token values live in exactly one place — the `globals.css` that every
// scaffolded project gets — and that file is the authority. Re-typing the
// numbers into a TypeScript object would create a second authority that
// drifts the first time someone tunes a colour, and the whole point of a
// DNA export is that it describes what you actually get.
//
// So this parses that file at build time. Same reason as build-skills.mts:
// a serverless deploy only ships files Next's tracer can see, and reading
// `src/lib/templates/files/...` at request time is not that.
//
// Run: npm run build:dna

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const cssPath = join(here, '..', 'src', 'lib', 'templates', 'files', '_shared', 'app', 'globals.css')
const out = join(here, '..', 'src', 'lib', 'generated-dna.json')

const css = readFileSync(cssPath, 'utf8')

/**
 * Pull `--name: value;` pairs out of one block.
 *
 * Scoped by selector rather than read from the whole file: `:root` is the
 * light theme and `.dark` is the dark one, and a flat scan would collapse
 * them into whichever appeared last — producing a "light" palette made of
 * dark values, which is precisely the bug this export exists to prevent
 * downstream.
 */
function tokensIn(selector: string): Record<string, string> {
  // Match the selector, then take everything to the closing brace of its
  // own block. Declarations only — no nesting inside these two blocks.
  const pattern = new RegExp(`${selector}\\s*\\{([^}]*)\\}`)
  const match = css.match(pattern)
  if (!match) throw new Error(`build-dna: no "${selector}" block in globals.css`)

  const tokens: Record<string, string> = {}
  for (const line of match[1]!.split('\n')) {
    const kv = line.match(/^\s*--([a-z-]+)\s*:\s*([^;]+);/)
    if (kv) tokens[kv[1]!] = kv[2]!.trim()
  }
  return tokens
}

const light = tokensIn(':root')
const dark = tokensIn('\\.dark')

if (!light.primary || !dark.primary) {
  throw new Error('build-dna: expected a --primary token in both themes')
}

// Radius is declared once, in the light block, and inherited by dark.
const radius = light.radius ?? '0.5rem'

// Every colour token, in the order a reader wants them: grounds, then
// surfaces, then the accent, then the utilitarian ones. Derived from the
// light theme's keys so a token added to globals.css shows up here without
// this file being edited, with the known ones ordered first.
const PREFERRED = [
  'background', 'foreground',
  'card', 'card-foreground',
  'popover', 'popover-foreground',
  'primary', 'primary-foreground',
  'secondary', 'secondary-foreground',
  'muted', 'muted-foreground',
  'accent', 'accent-foreground',
  'destructive', 'destructive-foreground',
  'border', 'input', 'ring',
]

const colorKeys = [
  ...PREFERRED.filter((key) => key in light),
  ...Object.keys(light).filter((key) => key !== 'radius' && !PREFERRED.includes(key)),
]

writeFileSync(
  out,
  `${JSON.stringify(
    {
      // Bare HSL channels, exactly as the CSS declares them — that format is
      // load-bearing, since it is what lets Tailwind compose an alpha suffix
      // (`bg-primary/10`). Anything consuming this has to know that, so the
      // note travels with the data.
      format: 'hsl-channels',
      radius,
      colorKeys,
      light,
      dark,
    },
    null,
    2,
  )}\n`,
)

console.log(`build-dna: ${colorKeys.length} colour tokens × 2 themes → src/lib/generated-dna.json`)
