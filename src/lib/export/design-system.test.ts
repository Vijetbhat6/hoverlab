import { test } from 'node:test'
import assert from 'node:assert/strict'

import tokens from '@/lib/generated-dna.json'
import { SHAPE_PRESETS } from '@/lib/theme-shape'
import { DEFAULT_BRAND_COLOR } from '@/lib/brand-presets'
import { buildDesignSystem, type DesignSystemFile } from './design-system'

/**
 * These guard the shape of the export, and the one bug class a string
 * template is prone to: a file that reads plausibly and that no tool
 * consumes. The compile-level proof (that Tailwind v4 really turns the
 * `@theme` block into `bg-primary`) is a manual check, recorded with the
 * change; what is here is what can be asserted without a bundler.
 */

const EXPECTED_PATHS = [
  'tokens.css',
  'tailwind-theme.css',
  'tailwind-theme.v3.ts',
  'tokens.light.json',
  'tokens.dark.json',
  'style-dictionary.config.mjs',
  'figma-variables.json',
  'push-figma-variables.mjs',
  'hoverlab.config.json',
  'README.md',
]

const colorKeys = tokens.colorKeys as string[]

/** The file with every block comment removed: what a parser would act on. */
function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '')
}

function fileNamed(files: DesignSystemFile[], path: string): DesignSystemFile {
  const file = files.find((f) => f.path === path)
  assert.ok(file, `expected ${path} in the export`)
  return file
}

test('the export serves both Tailwind generations, in a fixed order', () => {
  const { files } = buildDesignSystem()
  assert.deepEqual(
    files.map((f) => f.path),
    EXPECTED_PATHS,
  )
  // The v3-era name is gone: it no longer says which major it is for.
  assert.equal(
    files.some((f) => f.path === 'tailwind-theme.ts'),
    false,
  )
})

test('every file declares a language the panel and API can rely on', () => {
  const { files } = buildDesignSystem()
  assert.equal(fileNamed(files, 'tailwind-theme.css').language, 'css')
  assert.equal(fileNamed(files, 'tailwind-theme.v3.ts').language, 'ts')
})

test('the v4 theme is a real @theme block with the dark variant', () => {
  const css = fileNamed(buildDesignSystem().files, 'tailwind-theme.css').code
  assert.match(css, /^@custom-variant dark \(&:is\(\.dark \*\)\);$/m)
  assert.match(css, /^@theme inline \{$/m)
  // No config-file vocabulary in the CSS file.
  assert.doesNotMatch(css, /theme\.extend|satisfies Config|import type/)
})

test('every colour key is mapped, wrapped in hsl() because tokens.css holds channels', () => {
  const css = fileNamed(buildDesignSystem().files, 'tailwind-theme.css').code
  assert.ok(colorKeys.length > 0)
  for (const key of colorKeys) {
    assert.ok(
      css.includes(`  --color-${key}: hsl(var(--${key}));`),
      `missing --color-${key}`,
    )
  }
  // The site's own globals.css maps a bare var(), which is right for its
  // finished colours and wrong for channels. Nothing here may do that.
  assert.doesNotMatch(css, /--color-[\w-]+: var\(/)
})

test('the mapped variables exist in tokens.css, in both themes', () => {
  const { files } = buildDesignSystem()
  const tokensCss = fileNamed(files, 'tokens.css').code
  const [rootBlock, darkBlock] = [
    tokensCss.slice(tokensCss.indexOf(':root {'), tokensCss.indexOf('.dark {')),
    tokensCss.slice(tokensCss.indexOf('.dark {')),
  ]
  for (const key of colorKeys) {
    assert.match(rootBlock, new RegExp(`^  --${key}: `, 'm'), `:root has no --${key}`)
    assert.match(darkBlock, new RegExp(`^  --${key}: `, 'm'), `.dark has no --${key}`)
  }
})

test('the radius scale is derived from --radius', () => {
  const css = fileNamed(buildDesignSystem().files, 'tailwind-theme.css').code
  assert.match(css, /--radius-sm: calc\(var\(--radius\) - 4px\);/)
  assert.match(css, /--radius-md: calc\(var\(--radius\) - 2px\);/)
  assert.match(css, /--radius-lg: var\(--radius\);/)
  assert.match(css, /--radius-xl: calc\(var\(--radius\) \+ 4px\);/)
})

test('the v4 header states the import order and what it is for', () => {
  const css = fileNamed(buildDesignSystem().files, 'tailwind-theme.css').code
  assert.match(css, /Tailwind CSS v4/)
  const order = [
    '@import "tailwindcss";',
    '@import "./tokens.css";',
    '@import "./tailwind-theme.css";',
  ].map((line) => css.indexOf(line))
  assert.ok(order.every((i) => i >= 0), 'all three imports are named')
  assert.deepEqual(order, [...order].sort((a, b) => a - b), 'in that order')
  assert.match(css, /tailwind-theme\.v3\.ts/, 'points v3 projects at the other file')
})

test('the v3 file is still a theme.extend object, and says it is for v3', () => {
  const ts = fileNamed(buildDesignSystem().files, 'tailwind-theme.v3.ts').code
  assert.match(ts, /Tailwind CSS v3/)
  assert.match(ts, /tailwind-theme\.css/, 'points v4 projects at the other file')
  assert.match(ts, /import type \{ Config \} from 'tailwindcss'/)
  assert.match(ts, /satisfies Config\['theme'\]/)
  assert.match(ts, /export default theme/)
  for (const key of colorKeys) {
    assert.ok(ts.includes(`'${key}': 'hsl(var(--${key}))',`), `v3 file missing ${key}`)
  }
  assert.match(ts, /lg: 'var\(--radius\)'/)
  assert.match(ts, /md: 'calc\(var\(--radius\) - 2px\)'/)
  assert.match(ts, /sm: 'calc\(var\(--radius\) - 4px\)'/)
})

test('the README explains both files and how to tell which you are on', () => {
  const { files } = buildDesignSystem()
  const readme = fileNamed(files, 'README.md').code
  assert.match(readme, /tailwind-theme\.css/)
  assert.match(readme, /tailwind-theme\.v3\.ts/)
  assert.match(readme, /package\.json/)
  assert.match(readme, /tailwind\.config/)
  assert.match(readme, /@import "\.\/tokens\.css";\n@import "\.\/tailwind-theme\.css";/)
  // No hand-typed count to go stale ("Four files" was already wrong twice).
  assert.doesNotMatch(readme, /\b(?:two|three|four|five|six|seven|eight|\d+) files\b/i)
  // Every file the export ships is named in it.
  for (const path of EXPECTED_PATHS.filter((p) => p !== 'README.md')) {
    assert.ok(readme.includes(path), `README omits ${path}`)
  }
})

test('nothing in any file is the string "undefined" or "NaN"', () => {
  for (const shape of SHAPE_PRESETS) {
    const { files } = buildDesignSystem(DEFAULT_BRAND_COLOR, { name: 'Northwind', shape })
    for (const file of files) {
      assert.doesNotMatch(file.code, /\bundefined\b/, `${file.path} (${shape.id})`)
      assert.doesNotMatch(file.code, /\bNaN\b/, `${file.path} (${shape.id})`)
    }
  }
})

test('the v4 theme does not change with the shape, tokens.css carries it', () => {
  // --spacing and --text-* are native v4 theme variables that tokens.css
  // emits in its own @theme block; restating them here would be a second
  // copy that could drift.
  const soft = SHAPE_PRESETS.find((p) => p.id === 'soft')!
  const base = buildDesignSystem(DEFAULT_BRAND_COLOR, { name: 'X' }).files
  const shaped = buildDesignSystem(DEFAULT_BRAND_COLOR, { name: 'X', shape: soft }).files
  assert.equal(
    fileNamed(shaped, 'tailwind-theme.css').code,
    fileNamed(base, 'tailwind-theme.css').code,
  )
  const tokensCss = fileNamed(shaped, 'tokens.css').code
  assert.match(tokensCss, /@theme \{/)
  assert.match(tokensCss, /--spacing:/)
  assert.match(tokensCss, /--text-base:/)
  assert.doesNotMatch(
    stripComments(fileNamed(shaped, 'tailwind-theme.css').code),
    /--spacing|--text-/,
  )
})

test('a brand name cannot close the header comment early', () => {
  const { files } = buildDesignSystem(DEFAULT_BRAND_COLOR, {
    name: 'Evil */ body { display: none } /*',
  })
  for (const path of ['tokens.css', 'tailwind-theme.css', 'tailwind-theme.v3.ts']) {
    const code = fileNamed(files, path).code
    // Whatever survives comment-stripping is what a parser would act on.
    assert.ok(
      !stripComments(code).includes('display: none'),
      `${path} leaks the name out of its comment`,
    )
  }
})
