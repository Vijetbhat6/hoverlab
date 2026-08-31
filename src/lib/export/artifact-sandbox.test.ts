import { test } from 'node:test'
import assert from 'node:assert/strict'

import { BLOCKS } from '@/lib/blocks/blocks'
import { PAGES } from '@/lib/pages/pages'
import { SANDBOX_DEPENDENCIES, reactSandboxFiles } from './stackblitz'
import { buildArtifactSandbox, isSandboxLevel } from './artifact-sandbox'

/**
 * The thing worth testing here is resolution, and it is worth testing over
 * the whole catalog rather than one example.
 *
 * A sandbox that cannot resolve an import does not fail on our machines. It
 * fails in a StackBlitz tab, thirty seconds after someone clicked, in front
 * of a person who was evaluating whether to buy — and it fails for exactly
 * the artifacts nobody happened to spot-check. So every block and every
 * page is assembled here and every import in the assembled project is
 * checked against the files that project actually contains.
 */

/** `import … from 'x'` and `export … from 'x'`, specifier only. */
function specifiersIn(source: string): string[] {
  const out: string[] = []
  for (const [, spec] of source.matchAll(/(?:^|\n)\s*(?:import|export)[^'"\n]*from\s*['"]([^'"]+)['"]/g)) {
    out.push(spec)
  }
  // Side-effect imports: `import './styles.css'`.
  for (const [, spec] of source.matchAll(/(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g)) {
    out.push(spec)
  }
  return out
}

/** Resolve a specifier the way the project's vite config would. */
function resolves(spec: string, fromPath: string, files: Record<string, string>): boolean {
  // Bare specifiers are npm packages — checked separately.
  if (!spec.startsWith('.') && !spec.startsWith('@/')) return true

  let target: string
  if (spec.startsWith('@/')) {
    target = `src/${spec.slice(2)}`
  } else {
    const dir = fromPath.split('/').slice(0, -1)
    for (const part of spec.split('/')) {
      if (part === '.') continue
      else if (part === '..') dir.pop()
      else dir.push(part)
    }
    target = dir.join('/')
  }

  return ['', '.tsx', '.ts', '.css', '/index.tsx', '/index.ts'].some(
    (ext) => files[`${target}${ext}`] !== undefined,
  )
}

const ALLOWED_PACKAGES = new Set([
  ...Object.keys(SANDBOX_DEPENDENCIES),
  'react/jsx-runtime',
  'react-dom/client',
  'node:url',
  'vite',
  '@vitejs/plugin-react',
  '@tailwindcss/vite',
])

function checkProject(level: 'block' | 'page', id: string) {
  const built = buildArtifactSandbox(level, id, 'https://example.test')
  assert.ok(built, `${level}/${id} produced no sandbox`)

  // Rebuild the file map — the form holds the same content, but reading it
  // back out of `project[files][…]` keys would be testing the encoding.
  const files: Record<string, string> = {}
  for (const [key, value] of Object.entries(built.form.fields)) {
    const match = /^project\[files]\[(.+)]$/.exec(key)
    if (match) files[match[1]] = value
  }

  assert.ok(files[built.openFile], `${level}/${id} opens on a file it does not ship`)

  for (const [path, source] of Object.entries(files)) {
    if (!/\.(tsx?|css)$/.test(path)) continue

    for (const spec of specifiersIn(source)) {
      if (spec.startsWith('.') || spec.startsWith('@/')) {
        assert.ok(
          resolves(spec, path, files),
          `${level}/${id}: ${path} imports "${spec}", which the project does not contain`,
        )
      } else {
        const pkg = spec.startsWith('@')
          ? spec.split('/').slice(0, 2).join('/')
          : spec.split('/')[0]
        assert.ok(
          ALLOWED_PACKAGES.has(spec) || ALLOWED_PACKAGES.has(pkg),
          `${level}/${id}: ${path} imports "${spec}", which package.json does not install`,
        )
      }
    }
  }
}

test('every block assembles into a project that resolves', () => {
  for (const block of BLOCKS) checkProject('block', block.id)
})

test('every page ships the blocks it composes', () => {
  for (const page of PAGES) checkProject('page', page.id)
})

test('a page project is bigger than the page file alone', () => {
  // The regression this guards is `composedOf` silently going empty: the
  // project would still build, still resolve nothing, and fail only in the
  // tab. Pages compose at least a couple of blocks by definition.
  const built = buildArtifactSandbox('page', PAGES[0].id, 'https://example.test')
  assert.ok(built)

  const sources = Object.keys(built.form.fields).filter((key) =>
    key.startsWith('project[files][src/components/'),
  )
  assert.ok(sources.length >= 2, `${PAGES[0].id} shipped ${sources.length} component files`)
})

test('templates are not a sandbox level', () => {
  // Six of the seven are the Pro product and a sandbox is a full file dump.
  assert.equal(isSandboxLevel('template'), false)
  assert.equal(isSandboxLevel('block'), true)
  assert.equal(isSandboxLevel('page'), true)
})

test('an unknown id yields nothing rather than an empty project', () => {
  assert.equal(buildArtifactSandbox('block', 'no-such-block'), null)
  assert.equal(buildArtifactSandbox('page', 'no-such-page'), null)
})

test('the scaffold does not overwrite an artifact file', () => {
  // `src/App.tsx` is ours and `src/components/…` is theirs. A block whose
  // path collided with the scaffold would be silently replaced by it.
  const collision = reactSandboxFiles({
    id: 'x',
    name: 'X',
    description: 'x',
    componentName: 'X',
    entryPath: 'components/x.tsx',
    files: [{ path: 'components/x.tsx', source: 'export function X() {}' }],
  })
  assert.equal(collision['src/components/x.tsx'], 'export function X() {}')
  assert.match(collision['src/App.tsx'], /export default function App/)
})
