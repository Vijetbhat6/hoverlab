/**
 * Lift the design tokens out of globals.css into JSON for the shadcn registry.
 *
 * `/registry.json` publishes a `registry:base` item — the shadcn v4 payload
 * that installs a whole design system in one go: CSS variables, radius, base
 * colour. Those values already exist, once, in src/app/globals.css, and the
 * one thing this file must never become is a second copy of them. A registry
 * whose tokens have quietly drifted from the site's is worse than no registry
 * at all: `npx shadcn add @hoverlab/hero-split` would install a block styled
 * for colours the catalog no longer uses, and nothing would report it.
 *
 * So the tokens are extracted, not restated. This script reads the `:root`
 * and `.dark` blocks, strips the explanatory comments (globals.css carries a
 * lot of them — several tokens have a paragraph of contrast arithmetic
 * attached), and writes:
 *
 *   src/lib/registry/generated-tokens.json   { light: {...}, dark: {...} }
 *
 * Keys are written WITHOUT the leading `--`, which is the shape shadcn's
 * `cssVars` expects.
 *
 * Run via `npm run build:registry` (wired into prebuild).
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CSS = resolve(root, 'src/app/globals.css')
const OUT = resolve(root, 'src/lib/registry/generated-tokens.json')

/**
 * The second consumer, added with the StackBlitz export.
 *
 *   src/lib/export/generated-theme-map.json   { "color-primary": "var(--primary)", … }
 *
 * `:root` alone is not a theme. Tailwind v4 only turns `--primary` into the
 * class `bg-primary` because the `@theme inline` block maps one onto the
 * other, so a sandbox that shipped the token values and not the mapping
 * would compile every block against colours no utility could reach — the
 * same silent-invisible failure the oklch tokens already cause once.
 *
 * Extracted rather than restated, for the reason in the header: a hand-kept
 * copy of a forty-line mapping drifts the first time a token is added, and
 * nothing would report it.
 */
const OUT_THEME = resolve(root, 'src/lib/export/generated-theme-map.json')

/**
 * Pull one brace-delimited block out of the stylesheet by its selector.
 *
 * Two things this has to get right, both of which it got wrong first time:
 *
 * The selector is anchored to the start of a line. A plain substring search
 * for `.dark` matches inside `@custom-variant dark (&:is(.dark *))` on line
 * 4, and the next `{` after that is `@theme inline {` — so the "dark theme"
 * came back as Tailwind's forty-odd `--color-*` aliases. It looked plausible
 * and was entirely wrong.
 *
 * And the closing brace is found by depth counting, not by the first `}`:
 * several token blocks carry explanatory comments, and a brace inside one
 * would truncate a lazy match silently.
 */
function blockFor(css, selector) {
  const anchored = new RegExp(`^${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{`, 'm')
  const match = anchored.exec(css)
  if (!match) throw new Error(`globals.css has no top-level ${selector} block`)

  const open = css.indexOf('{', match.index)

  let depth = 0
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}') {
      depth--
      if (depth === 0) return css.slice(open + 1, i)
    }
  }
  throw new Error(`${selector} block is unterminated`)
}

/** Custom properties in a block, as { name: value } with `--` stripped. */
function tokensIn(block) {
  // Comments first. globals.css documents the contrast reasoning behind
  // several tokens inline, and those paragraphs contain colons and
  // semicolons that would otherwise parse as declarations.
  const clean = block.replace(/\/\*[\s\S]*?\*\//g, '')

  const out = {}
  for (const [, name, value] of clean.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    out[name] = value.trim().replace(/\s+/g, ' ')
  }
  return out
}

const css = readFileSync(CSS, 'utf8')

const light = tokensIn(blockFor(css, ':root'))
const dark = tokensIn(blockFor(css, '.dark'))

if (Object.keys(light).length === 0) throw new Error(':root parsed to zero tokens')
if (Object.keys(dark).length === 0) throw new Error('.dark parsed to zero tokens')

/*
 * Every token defined in dark must exist in light.
 *
 * A dark-only token means the light theme falls through to whatever the
 * consuming project already had, which is exactly the kind of half-applied
 * theme that makes an installed block look almost right. Caught here rather
 * than in someone else's app.
 */
const orphans = Object.keys(dark).filter((k) => !(k in light))
if (orphans.length) {
  throw new Error(`tokens defined in .dark but not :root — ${orphans.join(', ')}`)
}

/*
 * The `@theme inline` mapping, for the same reason and with the same guard.
 *
 * Anchoring matters here too: `@theme` appears inside `@custom-variant` on
 * line 4 in some Tailwind setups, and an unanchored match would return the
 * wrong block exactly the way `.dark` did.
 */
const theme = tokensIn(blockFor(css, '@theme inline'))
if (Object.keys(theme).length === 0) throw new Error('@theme inline parsed to zero entries')

/*
 * Every colour token must be reachable from a utility class.
 *
 * A `--foo` in `:root` with no `--color-foo` in `@theme inline` is a token
 * no block can use: `bg-foo` generates no rule, so the property falls back
 * and the component renders invisible rather than wrong. That is the
 * failure mode five shipped blocks carried for months, and it is cheap to
 * catch here — but only for colours. Non-colour tokens (`--radius`, the
 * four `--brand-*` numbers the palette is derived from, `--shadow-*`) are
 * consumed through `var()` in CSS and are correctly absent from the map.
 */
const NON_COLOUR = /^(radius|brand-|shadow|font-|spacing|ease|duration|header-)/
const unmapped = Object.keys(light).filter(
  (name) => !NON_COLOUR.test(name) && !(`color-${name}` in theme),
)
if (unmapped.length) {
  throw new Error(
    `tokens in :root with no --color-* entry in @theme inline — ${unmapped.join(', ')}. ` +
      `Add the mapping or the utility class silently generates nothing.`,
  )
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(
  OUT,
  `${JSON.stringify({ light, dark }, null, 2)}\n`,
  'utf8',
)

mkdirSync(dirname(OUT_THEME), { recursive: true })
writeFileSync(OUT_THEME, `${JSON.stringify(theme, null, 2)}\n`, 'utf8')

console.log(
  `registry tokens: ${Object.keys(light).length} light, ${Object.keys(dark).length} dark, ` +
    `${Object.keys(theme).length} theme entries -> ${OUT.replace(root, '.')}`,
)
