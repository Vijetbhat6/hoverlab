/**
 * Tests for `remove` planning and for `doctor`.
 *
 * `planRemoval` is the half of `remove` that can hurt someone, so the cases
 * here are the ways a delete goes wrong: an edited file, a file another
 * artifact shares, a file the user's own code imports, a hand-edited lockfile
 * carrying `../`. Each must be KEPT, and the test for each fails if the file
 * would have been removed.
 */

import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { fileDigest } from '../src/lockfile.mjs'
import { planRemoval } from '../src/remove.mjs'
import { runDoctor } from '../src/doctor.mjs'

let base
before(async () => {
  base = await mkdtemp(path.join(tmpdir(), 'hoverlab-remove-'))
})
after(() => rm(base, { recursive: true, force: true }))

async function project(name, files) {
  const dir = path.join(base, name)
  await mkdir(dir, { recursive: true })
  for (const [relative, content] of Object.entries(files)) {
    const file = path.join(dir, relative)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, typeof content === 'string' ? content : JSON.stringify(content), 'utf8')
  }
  return dir
}

const entryFor = (files) => ({
  level: 'block',
  files: Object.keys(files),
  hashes: Object.fromEntries(Object.entries(files).map(([f, text]) => [f, fileDigest(text)])),
})

const names = (list) => list.map((item) => path.basename(item.file ?? item))

describe('planRemoval', () => {
  test('removes an untouched file', async () => {
    const files = { 'components/a.tsx': 'export const A = 1' }
    const cwd = await project('plain', files)
    const plan = await planRemoval({ id: 'a', entry: entryFor(files), artifacts: { a: entryFor(files) }, cwd })
    assert.deepEqual(names(plan.remove), ['a.tsx'])
    assert.deepEqual(plan.keep, [])
  })

  test('keeps a file edited since install', async () => {
    const original = { 'components/a.tsx': 'export const A = 1' }
    const cwd = await project('edited', { 'components/a.tsx': 'export const A = 2 // mine' })
    const plan = await planRemoval({ id: 'a', entry: entryFor(original), artifacts: { a: entryFor(original) }, cwd })
    assert.deepEqual(plan.remove, [])
    assert.equal(plan.keep[0].why, 'edited')
  })

  test('keeps a file with no recorded hash, because untouched cannot be shown', async () => {
    const cwd = await project('unhashed', { 'components/a.tsx': 'x' })
    const plan = await planRemoval({
      id: 'a',
      entry: { files: ['components/a.tsx'], hashes: {} },
      artifacts: { a: { files: ['components/a.tsx'] } },
      cwd,
    })
    assert.equal(plan.keep[0].why, 'unhashed')
  })

  test('keeps a file another installed artifact also lists, even with --force', async () => {
    // A page brings its blocks. Removing the page must not take a block that
    // was also installed on its own.
    const shared = { 'components/pricing.tsx': 'export const P = 1' }
    const page = { 'app/page.tsx': 'export default 1', ...shared }
    const cwd = await project('shared', page)
    const artifacts = { 'landing-page': entryFor(page), pricing: entryFor(shared) }
    for (const force of [false, true]) {
      const plan = await planRemoval({ id: 'landing-page', entry: artifacts['landing-page'], artifacts, cwd, force })
      assert.deepEqual(names(plan.remove), ['page.tsx'])
      assert.equal(plan.keep[0].why, 'shared')
    }
  })

  test('keeps a file the rest of the project imports', async () => {
    const files = { 'components/hero.tsx': 'export const Hero = 1' }
    const cwd = await project('in-use', {
      ...files,
      'app/home.tsx': "import { Hero } from '@/components/hero'",
    })
    const plan = await planRemoval({ id: 'hero', entry: entryFor(files), artifacts: { hero: entryFor(files) }, cwd })
    assert.deepEqual(plan.remove, [])
    assert.equal(plan.keep[0].why, 'in use')
    assert.match(plan.keep[0].detail, /app\/home\.tsx/)
  })

  test('a similar name is not a reference', async () => {
    // `enterprise-pricing-tiers` must not make `pricing-tiers` look in use.
    const files = { 'components/pricing-tiers.tsx': 'x' }
    const cwd = await project('lookalike', {
      ...files,
      'app/home.tsx': "import { X } from '@/components/enterprise-pricing-tiers'",
    })
    const plan = await planRemoval({ id: 'p', entry: entryFor(files), artifacts: { p: entryFor(files) }, cwd })
    assert.deepEqual(names(plan.remove), ['pricing-tiers.tsx'])
  })

  test('files removed together do not block each other', async () => {
    const files = {
      'app/landing.tsx': "import { Hero } from '@/components/hero'",
      'components/hero.tsx': 'export const Hero = 1',
    }
    const cwd = await project('together', files)
    const plan = await planRemoval({ id: 'landing', entry: entryFor(files), artifacts: { landing: entryFor(files) }, cwd })
    assert.deepEqual(names(plan.remove).sort(), ['hero.tsx', 'landing.tsx'])
  })

  test('an edited page that still imports a block keeps that block in use', async () => {
    const original = {
      'app/landing.tsx': "import { Hero } from '@/components/hero'",
      'components/hero.tsx': 'export const Hero = 1',
    }
    const cwd = await project('edited-importer', {
      'app/landing.tsx': "import { Hero } from '@/components/hero' // customised",
      'components/hero.tsx': 'export const Hero = 1',
    })
    const plan = await planRemoval({ id: 'landing', entry: entryFor(original), artifacts: { landing: entryFor(original) }, cwd })
    assert.deepEqual(plan.remove, [])
    assert.deepEqual(plan.keep.map((k) => k.why).sort(), ['edited', 'in use'])
  })

  test('--force removes edited and in-use files', async () => {
    const original = { 'components/a.tsx': 'x' }
    const cwd = await project('forced', {
      'components/a.tsx': 'edited',
      'app/b.tsx': "import a from '../components/a'",
    })
    const plan = await planRemoval({ id: 'a', entry: entryFor(original), artifacts: { a: entryFor(original) }, cwd, force: true })
    assert.deepEqual(names(plan.remove), ['a.tsx'])
  })

  test('a lockfile path that leaves the project never reaches an unlink', async () => {
    const cwd = await project('escape', { 'components/a.tsx': 'x' })
    const plan = await planRemoval({
      id: 'a',
      entry: { files: ['../../etc/passwd', '/etc/passwd', 'C:/Windows/win.ini'], hashes: {} },
      artifacts: {},
      cwd,
      force: true,
    })
    assert.deepEqual(plan.remove, [])
    assert.equal(plan.unsafe.length, 3)
  })

  test('a file already gone is reported, not an error', async () => {
    const files = { 'components/gone.tsx': 'x' }
    const cwd = await project('gone', {})
    const plan = await planRemoval({ id: 'g', entry: entryFor(files), artifacts: { g: entryFor(files) }, cwd })
    assert.deepEqual(names(plan.missing), ['gone.tsx'])
    assert.deepEqual(plan.remove, [])
  })
})

describe('doctor', () => {
  const run = (cwd) => runDoctor({ cwd, offline: true })
  const byId = (result, id) => result.checks.find((c) => c.id === id)

  test('no package.json is a failure and stops there', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'hoverlab-empty-'))
    try {
      const result = await run(dir)
      assert.equal(byId(result, 'project').status, 'fail')
      assert.ok(result.summary.fail >= 1)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  test('a healthy v4 project has nothing to look at', async () => {
    const cwd = await project('healthy', {
      'package.json': { dependencies: { react: '^19', tailwindcss: '^4', 'lucide-react': '^0.4' } },
      'node_modules/tailwindcss/package.json': { version: '4.1.0' },
      'tsconfig.json': { compilerOptions: { paths: { '@/*': ['./src/*'] } } },
      'src/app/globals.css':
        '@import "tailwindcss";\n@theme inline { --color-primary: var(--primary); }\n:root { --primary: oklch(0.5 0.2 160); }',
    })
    const result = await run(cwd)
    assert.equal(result.summary.fail, 0)
    assert.equal(result.summary.warn, 0, JSON.stringify(result.checks.filter((c) => c.status === 'warn')))
    assert.equal(byId(result, 'colors').status, 'pass')
    assert.equal(byId(result, 'alias').status, 'pass')
  })

  test('unmapped colours and a missing alias are warnings with a fix, not failures', async () => {
    const cwd = await project('unmapped', {
      'package.json': { dependencies: { react: '^19', tailwindcss: '^4' } },
      'src/app/globals.css': '@import "tailwindcss";',
    })
    const result = await run(cwd)
    assert.equal(result.summary.fail, 0)
    for (const id of ['colors', 'alias']) {
      const item = byId(result, id)
      assert.equal(item.status, 'warn', id)
      assert.ok(item.fix, `${id} has no fix line`)
    }
  })

  test('the v3 fix points at the v3 theme file', async () => {
    const cwd = await project('v3', {
      'package.json': { dependencies: { react: '^19', tailwindcss: '~3.4.0' } },
      'tailwind.config.js': 'module.exports = {}',
    })
    assert.match(byId(await run(cwd), 'colors').fix, /tailwind-theme\.v3\.ts/)
  })

  test('a project without React is a warning, because effects still work there', async () => {
    const cwd = await project('vue', { 'package.json': { dependencies: { vue: '^3' } } })
    const result = await run(cwd)
    assert.equal(byId(result, 'react').status, 'warn')
    assert.equal(result.summary.fail, 0)
  })

  test('blocks installed without lucide-react are called out', async () => {
    const cwd = await project('no-lucide', {
      'package.json': { dependencies: { react: '^19', tailwindcss: '^4' } },
      'hoverlab.lock.json': {
        lockfileVersion: 1,
        artifacts: { pricing: { level: 'block', revision: 'x', files: ['components/pricing.tsx'], hashes: {} } },
      },
      'components/pricing.tsx': 'x',
    })
    assert.equal(byId(await run(cwd), 'lucide').status, 'warn')
  })

  test('an install whose files were deleted by hand is flagged', async () => {
    const cwd = await project('deleted', {
      'package.json': { dependencies: { react: '^19' } },
      'hoverlab.lock.json': {
        lockfileVersion: 1,
        artifacts: { hero: { level: 'block', revision: 'x', files: ['components/hero.tsx'], hashes: {} } },
      },
    })
    assert.equal(byId(await run(cwd), 'installed').status, 'warn')
  })

  test('every check has a status the printer knows', async () => {
    const cwd = await project('shape', { 'package.json': {} })
    for (const item of (await run(cwd)).checks) {
      assert.ok(['pass', 'warn', 'fail', 'info'].includes(item.status), item.id)
      assert.ok(item.title, item.id)
    }
  })
})
