import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  SANDBOX_DEPENDENCIES,
  SANDBOX_DEV_DEPENDENCIES,
  exportedComponent,
  reactSandboxFiles,
  sandboxThemeCss,
  stackblitzHtmlForm,
  stackblitzReactForm,
  type ReactSandboxInput,
} from './stackblitz'

/**
 * The failure this file exists to prevent is a sandbox that opens, installs,
 * compiles and looks wrong — a project on a different React major, or one
 * whose Tailwind cannot read `@theme inline` and therefore emits no colours
 * at all. None of that throws anywhere; it just renders a block that is not
 * the block, in front of someone deciding whether to buy.
 */

const INPUT: ReactSandboxInput = {
  id: 'hero-split',
  name: 'Hero Split',
  description: 'Copy on the left, a product panel on the right.',
  files: [
    {
      path: 'components/hero-split.tsx',
      source: 'export function HeroSplit() {\n  return <section />\n}\n',
    },
  ],
  componentName: 'HeroSplit',
  entryPath: 'components/hero-split.tsx',
  sourceUrl: 'https://example.test/block/hero-split',
}

/* ------------------------------------------------------------------ *
 *  Versions
 * ------------------------------------------------------------------ */

function majorOf(range: string): string {
  const match = /(\d+)/.exec(range)
  assert.ok(match, `no major version in "${range}"`)
  return match[1]
}

test('sandbox dependencies sit on the same majors as the app', () => {
  const pkg = JSON.parse(
    readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
  ) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }

  const installed = { ...pkg.devDependencies, ...pkg.dependencies }

  for (const [name, range] of Object.entries({
    ...SANDBOX_DEPENDENCIES,
    ...SANDBOX_DEV_DEPENDENCIES,
  })) {
    const app = installed[name]
    // Vite and the React plugin are StackBlitz-only — this app is on Next,
    // so there is nothing to compare them against.
    if (!app) continue

    assert.equal(
      majorOf(range),
      majorOf(app),
      `${name}: sandbox pins ${range}, package.json has ${app}. A sandbox on a ` +
        `different major does not demonstrate this catalog.`,
    )
  }
})

/* ------------------------------------------------------------------ *
 *  The theme layer
 * ------------------------------------------------------------------ */

test('the theme sheet carries the mapping, not just the values', () => {
  const css = sandboxThemeCss()

  // Without `@theme inline` no token reaches a utility class and every
  // block renders in fallback colours.
  assert.match(css, /@theme inline \{/)
  assert.match(css, /--color-primary: var\(--primary\);/)

  // And without the values the mapping points at nothing.
  assert.match(css, /^:root \{$/m)
  assert.match(css, /^\.dark \{$/m)
  assert.match(css, /--primary: oklch\(/)

  // `dark:` is a variant this app defines by hand; Tailwind's default is
  // the media query, which a class toggle would never trigger.
  assert.match(css, /@custom-variant dark/)
})

test('the fonts next/font injects have real fallbacks', () => {
  const css = sandboxThemeCss()

  // `--font-sans: var(--font-geist-sans)` comes over verbatim from
  // globals.css, where next/font defines the target. Nothing defines it in
  // a Vite project, so the sheet has to.
  assert.match(css, /--font-geist-sans: ui-sans-serif/)
  assert.match(css, /--font-jetbrains-mono: ui-monospace/)
})

/* ------------------------------------------------------------------ *
 *  Project shape
 * ------------------------------------------------------------------ */

test('the project is complete and the artifact is unmodified', () => {
  const files = reactSandboxFiles(INPUT)

  for (const required of [
    'package.json',
    'vite.config.ts',
    'tsconfig.json',
    'index.html',
    'src/main.tsx',
    'src/App.tsx',
    'src/styles.css',
    'src/components/hero-split.tsx',
  ]) {
    assert.ok(files[required], `project is missing ${required}`)
  }

  // The artifact travels byte-for-byte. A sandbox that reformatted the
  // source would be demonstrating something the reader cannot install.
  assert.equal(files['src/components/hero-split.tsx'], INPUT.files[0].source)
})

test('the entry component is imported by the name it is exported under', () => {
  const app = reactSandboxFiles(INPUT)['src/App.tsx']
  assert.match(app, /import \{ HeroSplit \} from '\.\/components\/hero-split'/)
  assert.match(app, /<HeroSplit \/>/)
})

test('package.json parses and pins both dependency sets', () => {
  const pkg = JSON.parse(reactSandboxFiles(INPUT)['package.json']) as {
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
    scripts: Record<string, string>
  }

  assert.equal(pkg.dependencies.react, SANDBOX_DEPENDENCIES.react)
  assert.equal(pkg.devDependencies.vite, SANDBOX_DEV_DEPENDENCIES.vite)
  // StackBlitz's `node` template runs `dev` — without it the project opens
  // to a terminal and no preview.
  assert.ok(pkg.scripts.dev)
})

test('tsconfig and vite agree about the @ alias', () => {
  const files = reactSandboxFiles(INPUT)
  assert.match(files['vite.config.ts'], /'@': fileURLToPath/)

  const tsconfig = JSON.parse(files['tsconfig.json']) as {
    compilerOptions: { paths: Record<string, string[]> }
  }
  assert.deepEqual(tsconfig.compilerOptions.paths['@/*'], ['./src/*'])
})

/* ------------------------------------------------------------------ *
 *  The form
 * ------------------------------------------------------------------ */

test('every project file becomes a POST field', () => {
  const form = stackblitzReactForm(INPUT)
  const files = reactSandboxFiles(INPUT)

  assert.equal(form.action.startsWith('https://stackblitz.com/run'), true)
  for (const path of Object.keys(files)) {
    assert.equal(
      form.fields[`project[files][${path}]`],
      files[path],
      `${path} did not survive into the form`,
    )
  }
  assert.equal(form.fields['project[template]'], 'node')
})

test('the form opens on the artifact, not on the scaffolding', () => {
  const form = stackblitzReactForm(INPUT)
  assert.match(form.action, /file=src%2Fcomponents%2Fhero-split\.tsx/)
})

test('the html variant links its stylesheet and ships both files', () => {
  const form = stackblitzHtmlForm({
    name: 'Glow Button',
    description: 'A button that glows.',
    html: '<button class="glow">Hover</button>',
    css: '.glow { color: red; }',
  })

  assert.equal(form.fields['project[template]'], 'html')
  assert.match(form.fields['project[files][index.html]'], /<link rel="stylesheet" href="style\.css"/)
  assert.match(form.fields['project[files][index.html]'], /<button class="glow">/)
  assert.equal(form.fields['project[files][style.css]'], '.glow { color: red; }')
})

/* ------------------------------------------------------------------ *
 *  Component-name recovery
 * ------------------------------------------------------------------ */

test('the exported component is read from the source, not the filename', () => {
  assert.deepEqual(exportedComponent('export function HeroSplit() {}'), {
    name: 'HeroSplit',
    isDefault: false,
  })
  assert.deepEqual(exportedComponent('export const PricingTiers = () => null'), {
    name: 'PricingTiers',
    isDefault: false,
  })

  // A leading doc comment is the normal case in this catalog.
  assert.deepEqual(exportedComponent('/**\n * <Thing>\n */\n\nexport function Thing() {}'), {
    name: 'Thing',
    isDefault: false,
  })
})

test('a page is recognised as a default export', () => {
  // Pages are routes in the template they came from, so Next requires the
  // default. Importing one as a named export compiles and then renders
  // `undefined is not a component` at runtime.
  assert.deepEqual(exportedComponent('export default function SaasLandingPage() {}'), {
    name: 'SaasLandingPage',
    isDefault: true,
  })
})

test('the wrapper imports a default export without braces', () => {
  const app = reactSandboxFiles({
    ...INPUT,
    id: 'saas-landing-page',
    componentName: 'SaasLandingPage',
    entryIsDefault: true,
    entryPath: 'app/saas-landing-page.tsx',
    files: [{ path: 'app/saas-landing-page.tsx', source: 'export default function X() {}' }],
  })['src/App.tsx']

  assert.match(app, /import SaasLandingPage from '\.\/app\/saas-landing-page'/)
  assert.doesNotMatch(app, /import \{ SaasLandingPage \}/)
})

test('component recovery gives up rather than guessing', () => {
  // Lowercase is a helper, not a component; an interface is not either.
  assert.equal(exportedComponent('export function helper() {}'), null)
  assert.equal(exportedComponent('export interface Props {}'), null)
  // Not exported at all.
  assert.equal(exportedComponent('function Hidden() {}'), null)
})
