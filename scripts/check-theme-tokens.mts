/**
 * Prove the theme tokens resolve — in both themes, and after a theme change.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────
 *
 * `globals.css` derives its finished colours from a handful of input
 * variables, and CSS has a uniquely quiet way of getting that wrong: a
 * declaration whose value is invalid at computed-value time is not an error,
 * it is *dropped*. The property falls back to whatever it inherited, the page
 * renders, nothing logs, and tsc, eslint and every test in this repo stay
 * green while a component is the wrong colour or invisible.
 *
 * This catalog has been bitten by exactly that twice already:
 *
 *   - `hsl(var(--primary))` where `--primary` is an `oklch()` colour. Five
 *     blocks carried it for months, and ten more declarations were found in
 *     `globals.css` itself a fortnight later.
 *   - `text-destructive-foreground` naming a token that did not exist. A
 *     class naming an undefined variable generates no rule at all.
 *
 * The theme studio adds a third opportunity — `calc()` inside `oklch()` for
 * the neutral chroma — plus a fourth that is subtler and cost an afternoon:
 * the `@theme inline` block SUBSTITUTES its values into the utilities
 * Tailwind generates rather than referencing the variable, so
 * `--font-sans: var(--font-geist-sans)` bakes Geist into every rule and
 * overriding `--font-sans` at runtime changes a variable nothing reads. The
 * inspector showed the new value; the page stayed in Geist.
 *
 * ── WHY IT COMPILES ITS OWN CSS RATHER THAN READING THE DEV SERVER ──────
 *
 * Because the dev server caches the compiled stylesheet, sometimes across a
 * restart, and because in this repo it usually belongs to another session
 * and is neither safe to restart nor trustworthy to read. Compiling the same
 * input here takes under a second, so the thing under test is the stylesheet
 * in the repository rather than whatever a long-running process happens to
 * be holding.
 *
 * It uses the `tailwindcss` package this repo already depends on rather than
 * `@tailwindcss/cli`, which is not installed — shelling out to `npx` would
 * make a correctness check depend on a network fetch, and on Windows under
 * Node 24 spawning `npx.cmd` without a shell fails outright.
 *
 * ── WHAT IT ASSERTS ─────────────────────────────────────────────────────
 *
 *   1. Every token resolves to something in light AND in dark. The two are
 *      checked separately because the base hues swap roles between them, so
 *      a mistake in the dark block is invisible from the light one.
 *   2. Dark actually overrides light. A `.dark` rule that stopped matching
 *      would otherwise look like a passing test.
 *   3. Every movable token moves when the inputs change.
 *   4. The RENDERED font follows the font token, not just the token.
 *
 * Not in `prebuild`: it needs a browser, like `test:blocks` and
 * `shot-blocks`, and prebuild runs on a Vercel builder. Run it after
 * touching `globals.css`.
 *
 *   npx tsx scripts/check-theme-tokens.mts
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from 'playwright'
import { compile } from 'tailwindcss'

const HERE = dirname(fileURLToPath(import.meta.url))
const INPUT = join(HERE, '..', 'src', 'app', 'globals.css')

/** Every token the theme studio is supposed to be able to move. */
const TOKENS = [
  '--background',
  '--foreground',
  '--card',
  '--muted',
  '--muted-foreground',
  '--border',
  '--field',
  '--primary',
  '--accent',
  '--ring',
  '--radius',
  '--app-font-sans',
]

/**
 * --card is a fixed sRGB white and does not follow the base hue. At
 * lightness 1 any chroma is out of gamut anyway, and
 * `lib/templates/palettes.ts` makes the same call for the same reason.
 */
const FIXED = new Set(['--card'])

/** The Terminal preset: cool base, mono type, square corners. */
const OVERRIDES: Record<string, string> = {
  '--brand-hue': '155',
  '--brand-chroma': '0.16',
  '--brand-light-l': '0.45',
  '--base-warm-hue': '250',
  '--base-cool-hue': '250',
  '--base-chroma': '1.6',
  '--app-font-sans': 'ui-monospace, monospace',
  '--radius': '0rem',
}

/**
 * Resolve an `@import` to a file on disk.
 *
 * Node's resolver is no use for two of the three cases here.
 * `require.resolve('tailwindcss')` returns the JavaScript entry, and handing
 * that to a CSS parser fails with `Invalid declaration: "use strict"`; and
 * `tw-animate-css` declares only a `style` export condition, so Node refuses
 * even `tw-animate-css/package.json` with ERR_PACKAGE_PATH_NOT_EXPORTED.
 *
 * So the directory is found by walking up for `node_modules/<id>`, and the
 * stylesheet inside it by reading the manifest's `style` condition and
 * falling back to the conventional names. Ten lines, and it works for a
 * CSS-only package that has deliberately closed its exports map.
 */
function resolveStylesheet(id: string, base: string): string {
  if (id.endsWith('.css')) {
    return isAbsolute(id) ? id : join(base, id)
  }

  let dir = base
  for (;;) {
    const candidate = join(dir, 'node_modules', id)
    if (existsSync(candidate)) {
      const manifest = join(candidate, 'package.json')
      if (existsSync(manifest)) {
        const pkg = JSON.parse(readFileSync(manifest, 'utf8')) as {
          exports?: { '.'?: { style?: string } | string }
          style?: string
          main?: string
        }
        const entry = pkg.exports?.['.']
        const declared =
          (typeof entry === 'object' ? entry.style : undefined) ?? pkg.style ?? pkg.main
        if (declared?.endsWith('.css')) return join(candidate, declared)
      }
      for (const name of ['index.css', 'dist/index.css']) {
        const file = join(candidate, name)
        if (existsSync(file)) return file
      }
    }
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  throw new Error(`check-theme-tokens: cannot resolve the stylesheet "${id}"`)
}

let css: string
try {
  /*
    No candidates are scanned on purpose. This checks the token layer — the
    `:root` and `.dark` blocks and the variables `@theme` emits — not the
    utilities, so there is nothing to scan and scanning would only make it
    slower and dependent on the app's file tree.
  */
  const compiled = await compile(readFileSync(INPUT, 'utf8'), {
    base: dirname(INPUT),
    loadStylesheet: async (id, base) => {
      const path = resolveStylesheet(id, base)
      return { path, base: dirname(path), content: readFileSync(path, 'utf8') }
    },
  })
  css = compiled.build([])
} catch (error) {
  console.error('check-theme-tokens: could not compile globals.css.')
  console.error(String(error))
  process.exit(1)
}
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } })
await page.setContent('<!doctype html><html lang="en"><head></head><body><p>Aa</p></body></html>')
await page.addStyleTag({ content: css })
/*
  next/font declares these on <html> in the real app. Stubbed so the harness
  measures the theme wiring rather than the absence of a webfont — without
  them `--app-font-sans` resolves to nothing here and every assertion below
  fails for a reason that is not a bug.
*/
await page.addStyleTag({
  content:
    ':root{--font-geist-sans:"StubSans";--font-jetbrains-mono:"StubMono";' +
    '--font-space-grotesk:"StubGrotesk";--font-source-serif:"StubSerif";}',
})

async function snapshot() {
  return page.evaluate((tokens: string[]) => {
    const style = getComputedStyle(document.documentElement)
    const out: Record<string, string> = {}
    for (const token of tokens) out[token] = style.getPropertyValue(token).trim()
    return { tokens: out, bodyFont: getComputedStyle(document.body).fontFamily }
  }, TOKENS)
}

const problems: string[] = []
const empty = (snap: Awaited<ReturnType<typeof snapshot>>) =>
  Object.entries(snap.tokens)
    .filter(([, value]) => value === '')
    .map(([name]) => name)

const light = await snapshot()
if (empty(light).length) {
  problems.push(
    `light: ${empty(light).join(', ')} computed to nothing. An invalid value is ` +
      'dropped silently — nothing renders in that colour.',
  )
}

await page.evaluate(() => document.documentElement.classList.add('dark'))
const dark = await snapshot()
if (empty(dark).length) {
  problems.push(`dark: ${empty(dark).join(', ')} computed to nothing.`)
}
const notOverridden = TOKENS.filter(
  (token) =>
    !FIXED.has(token) &&
    token !== '--radius' &&
    token !== '--app-font-sans' &&
    light.tokens[token] === dark.tokens[token],
)
if (notOverridden.length) {
  problems.push(`the .dark block does not override: ${notOverridden.join(', ')}`)
}
await page.evaluate(() => document.documentElement.classList.remove('dark'))

await page.evaluate((overrides: Record<string, string>) => {
  for (const [name, value] of Object.entries(overrides)) {
    document.documentElement.style.setProperty(name, value)
  }
}, OVERRIDES)

const themed = await snapshot()
if (empty(themed).length) {
  problems.push(`after theming: ${empty(themed).join(', ')} computed to nothing.`)
}
const unmoved = TOKENS.filter(
  (token) => !FIXED.has(token) && light.tokens[token] === themed.tokens[token],
)
if (unmoved.length) {
  problems.push(`these did not move when the inputs changed: ${unmoved.join(', ')}`)
}
if (themed.bodyFont === light.bodyFont) {
  problems.push(
    'the font token moved but the rendered body font did not. `@theme inline` has ' +
      'baked a family into the generated utilities again — see the note in globals.css.',
  )
}

await browser.close()

if (problems.length) {
  console.error('\ncheck-theme-tokens: the theme wiring is broken.\n')
  for (const problem of problems) console.error(`  ${problem}`)
  console.error('')
  process.exit(1)
}

console.log(
  `check-theme-tokens: ${TOKENS.length} tokens resolve in light and dark, ` +
    `${TOKENS.length - FIXED.size} move with the inputs, and the rendered font follows.`,
)
