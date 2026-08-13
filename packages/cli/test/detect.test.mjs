/**
 * Tests for the parts of the CLI that make decisions without the network:
 * framework detection and output-directory selection. These are the pieces
 * that silently do the wrong thing when they break — a bad guess writes a
 * .vue file into a React project and the user only finds out at build time.
 *
 * Run with `npm test` (uses the built-in node:test runner — no dev
 * dependency, matching the package's zero-dependency stance).
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { detectFramework, detectOutputDir, findProjectRoot } from '../src/detect.mjs'

/** Build a throwaway project directory with the given package.json + dirs. */
async function scaffold({ pkg = {}, dirs = [], files = {} } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'hoverlab-test-'))
  await writeFile(path.join(root, 'package.json'), JSON.stringify(pkg), 'utf8')
  for (const dir of dirs) {
    await mkdir(path.join(root, dir), { recursive: true })
  }
  for (const [name, contents] of Object.entries(files)) {
    await writeFile(path.join(root, name), contents, 'utf8')
  }
  return root
}

test('detects each framework from dependencies', async () => {
  const cases = [
    [{ dependencies: { react: '^19.0.0' } }, 'react'],
    [{ dependencies: { next: '^16.0.0' } }, 'react'],
    [{ dependencies: { vue: '^3.4.0' } }, 'vue'],
    [{ dependencies: { nuxt: '^3.0.0' } }, 'vue'],
    [{ dependencies: { svelte: '^5.0.0' } }, 'svelte'],
    [{ devDependencies: { '@sveltejs/kit': '^2.0.0' } }, 'svelte'],
    [{ dependencies: { tailwindcss: '^4.0.0' } }, 'tailwind'],
    [{ dependencies: {} }, 'css'],
  ]

  for (const [pkg, expected] of cases) {
    const root = await scaffold({ pkg })
    const { framework } = await detectFramework(root)
    assert.equal(framework, expected, `expected ${expected} for ${JSON.stringify(pkg)}`)
  }
})

test('styled-components wins over react when both are present', async () => {
  // A project with both is telling you which one it prefers for styling.
  const root = await scaffold({
    pkg: { dependencies: { react: '^19.0.0', 'styled-components': '^6.0.0' } },
  })
  const { framework } = await detectFramework(root)
  assert.equal(framework, 'styled-components')
})

test('a component framework wins over tailwind', async () => {
  // A Vue app that uses Tailwind still wants a .vue file.
  const root = await scaffold({
    pkg: { dependencies: { vue: '^3.4.0', tailwindcss: '^4.0.0' } },
  })
  const { framework } = await detectFramework(root)
  assert.equal(framework, 'vue')
})

test('falls back to a tailwind config file when there is no dependency', async () => {
  const root = await scaffold({
    pkg: { dependencies: {} },
    files: { 'tailwind.config.ts': 'export default {}' },
  })
  const { framework, reason } = await detectFramework(root)
  assert.equal(framework, 'tailwind')
  assert.match(reason, /tailwind\.config\.ts/)
})

test('component output prefers an existing components directory', async () => {
  const root = await scaffold({
    pkg: { dependencies: { react: '^19.0.0' } },
    dirs: ['src/components'],
  })
  const dir = await detectOutputDir('react', root)
  assert.equal(dir, path.join(root, 'src/components', 'hoverlab'))
})

test('css output does not get buried in components/', async () => {
  const root = await scaffold({ pkg: {}, dirs: ['src/components', 'src/styles'] })
  const dir = await detectOutputDir('css', root)
  assert.equal(dir, path.join(root, 'src/styles', 'hoverlab'))
})

test('output falls back to a top-level hoverlab/ when nothing matches', async () => {
  const root = await scaffold({ pkg: { dependencies: { react: '^19.0.0' } } })
  const dir = await detectOutputDir('react', root)
  assert.equal(dir, path.join(root, 'hoverlab'))
})

test('project root is found from a nested directory', async () => {
  const root = await scaffold({ pkg: {}, dirs: ['src/components/deep'] })
  const found = await findProjectRoot(path.join(root, 'src/components/deep'))
  assert.equal(found, root)
})

test('detection degrades gracefully on unreadable package.json', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'hoverlab-test-'))
  await writeFile(path.join(root, 'package.json'), '{ not json', 'utf8')
  const { framework } = await detectFramework(root)
  assert.equal(framework, 'css')
})
