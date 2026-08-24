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

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(
  OUT,
  `${JSON.stringify({ light, dark }, null, 2)}\n`,
  'utf8',
)

console.log(
  `registry tokens: ${Object.keys(light).length} light, ${Object.keys(dark).length} dark -> ${OUT.replace(root, '.')}`,
)
