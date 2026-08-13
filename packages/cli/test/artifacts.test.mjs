/**
 * Tests for the multi-file half of the CLI — the parts that decide *where*
 * a block, page or template lands and what is safe to write.
 *
 * These matter more than the effect equivalents. An effect is one file with
 * a name the CLI chooses; a block arrives with a path it insists on, and a
 * template arrives with thirty-four of them. Getting the root wrong
 * scatters files beside the right ones; getting the safety checks wrong
 * writes outside the destination entirely.
 *
 * The network is never touched: `initTemplate` and `addArtifact` are driven
 * through a stubbed `fetch`, which is also the only way to test what the
 * CLI does with a *hostile* response — the whole reason `safeRelativePath`
 * exists, since HOVERLAB_API_URL lets a user point this at any host.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { detectArtifactRoot, detectReactSupport, missingDeps } from '../src/detect.mjs'
import { safeRelativePath, WriteError } from '../src/write.mjs'
import { initTemplate } from '../src/scaffold.mjs'

/** Build a throwaway project directory. */
async function scaffold({ pkg = {}, dirs = [] } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'hoverlab-test-'))
  await writeFile(path.join(root, 'package.json'), JSON.stringify(pkg), 'utf8')
  for (const dir of dirs) await mkdir(path.join(root, dir), { recursive: true })
  return root
}

/** Swap in a fetch that answers every request with `body`. Returns a restore fn. */
function stubFetch(body, { status = 200 } = {}) {
  const original = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  })
  return () => {
    globalThis.fetch = original
  }
}

/* ------------------------------------------------------------------ *
 *  Path safety
 * ------------------------------------------------------------------ */

test('safeRelativePath keeps real paths and rejects escapes', () => {
  assert.equal(safeRelativePath('components/product-grid.tsx'), 'components/product-grid.tsx')
  assert.equal(safeRelativePath('app/products/[slug]/page.tsx'), 'app/products/[slug]/page.tsx')
  // Backslashes normalise — a Windows-shaped path from the API is still a
  // path, and rejecting it would break the CLI for nobody's benefit.
  assert.equal(safeRelativePath('components\\cart.tsx'), 'components/cart.tsx')
  assert.equal(safeRelativePath('./app/page.tsx'), 'app/page.tsx')

  // Anything that could land outside the destination is refused outright
  // rather than repaired: a repaired path installs a file nobody asked for.
  for (const hostile of [
    '../../.bashrc',
    'components/../../etc/passwd',
    '/etc/passwd',
    'C:/Windows/system32/drivers/etc/hosts',
    '..',
    '',
    null,
    undefined,
  ]) {
    assert.equal(safeRelativePath(hostile), null, `should reject ${JSON.stringify(hostile)}`)
  }
})

/* ------------------------------------------------------------------ *
 *  Where multi-file artifacts are rooted
 * ------------------------------------------------------------------ */

test('artifact root follows the src/ convention when the project uses it', async () => {
  const withSrc = await scaffold({ dirs: ['src/app'] })
  const detected = await detectArtifactRoot(withSrc)
  assert.equal(detected.root, path.join(withSrc, 'src'))

  const flat = await scaffold({ dirs: ['app'] })
  assert.equal((await detectArtifactRoot(flat)).root, flat)
})

test('artifact root is found from a nested directory, not the cwd', async () => {
  const root = await scaffold({ dirs: ['src/components', 'src/components/ui'] })
  const detected = await detectArtifactRoot(path.join(root, 'src', 'components', 'ui'))
  assert.equal(detected.root, path.join(root, 'src'))
})

test('react support is detected, and named when absent', async () => {
  const next = await scaffold({ pkg: { dependencies: { next: '^15.0.0' } } })
  assert.equal((await detectReactSupport(next)).react, true)

  const nuxt = await scaffold({ pkg: { dependencies: { nuxt: '^3.0.0' } } })
  const result = await detectReactSupport(nuxt)
  assert.equal(result.react, false)
  assert.match(result.reason, /Vue/)
})

test('missingDeps ignores what the project already has', async () => {
  const root = await scaffold({
    pkg: { dependencies: { 'lucide-react': '^0.4.0' }, devDependencies: { clsx: '^2.0.0' } },
  })
  assert.deepEqual(await missingDeps(['lucide-react', 'clsx'], root), [])
  assert.deepEqual(await missingDeps(['lucide-react', 'zod'], root), ['zod'])
  assert.deepEqual(await missingDeps([], root), [])
})

/* ------------------------------------------------------------------ *
 *  init
 * ------------------------------------------------------------------ */

const TEMPLATE_BODY = {
  version: 'v1',
  level: 'template',
  artifact: {
    id: 'demo-template',
    name: 'Demo Template',
    level: 'template',
    category: 'Marketing',
    description: 'A stub.',
    tags: [],
    featured: false,
    tier: 'free',
    url: 'https://hoverlab.dev/template/demo-template',
    deps: ['lucide-react'],
    composedOf: [],
    fileCount: 3,
    routes: [{ path: '/', pageId: 'demo-page', file: 'app/page.tsx', label: 'Home' }],
  },
  files: [
    { path: 'app/page.tsx', lang: 'tsx', source: 'export default function Page() {}\n' },
    { path: '.gitignore', lang: 'md', source: 'node_modules\n' },
    { path: 'components/nested/deep.tsx', lang: 'tsx', source: 'export const Deep = 1\n' },
  ],
  deps: ['lucide-react'],
  notes: [],
  included: [],
}

test('init writes the whole tree into a directory named after the template', async () => {
  const restore = stubFetch(TEMPLATE_BODY)
  try {
    const cwd = await mkdtemp(path.join(tmpdir(), 'hoverlab-init-'))
    const result = await initTemplate({ id: 'demo-template', cwd })

    assert.equal(result.directory, path.join(cwd, 'demo-template'))
    assert.deepEqual(result.files.sort(), [
      '.gitignore',
      'app/page.tsx',
      'components/nested/deep.tsx',
    ])
    // Nested directories are created, not flattened.
    assert.equal(
      await readFile(path.join(result.directory, 'components', 'nested', 'deep.tsx'), 'utf8'),
      'export const Deep = 1\n',
    )
  } finally {
    restore()
  }
})

test('init refuses a non-empty directory unless forced', async () => {
  const restore = stubFetch(TEMPLATE_BODY)
  try {
    const cwd = await mkdtemp(path.join(tmpdir(), 'hoverlab-init-'))
    const target = path.join(cwd, 'occupied')
    await mkdir(target, { recursive: true })
    await writeFile(path.join(target, 'important.txt'), 'do not lose me', 'utf8')

    await assert.rejects(
      () => initTemplate({ id: 'demo-template', directory: 'occupied', cwd }),
      (error) => error instanceof WriteError && /not empty/.test(error.message),
    )
    // And nothing was written on the way to refusing.
    assert.deepEqual(await readdir(target), ['important.txt'])

    await initTemplate({ id: 'demo-template', directory: 'occupied', cwd, force: true })
    assert.equal(await readFile(path.join(target, 'important.txt'), 'utf8'), 'do not lose me')
    assert.equal((await readdir(target)).includes('app'), true)
  } finally {
    restore()
  }
})

test('init treats a directory holding only .git as empty', async () => {
  const restore = stubFetch(TEMPLATE_BODY)
  try {
    const cwd = await mkdtemp(path.join(tmpdir(), 'hoverlab-init-'))
    const target = path.join(cwd, 'fresh-repo')
    await mkdir(path.join(target, '.git'), { recursive: true })

    // `git init && npx hoverlab init x .` is a normal thing to do, and
    // refusing it because git left a directory behind would be a bad joke.
    const result = await initTemplate({ id: 'demo-template', directory: 'fresh-repo', cwd })
    assert.equal(result.files.length, 3)
  } finally {
    restore()
  }
})

test('init drops files whose paths could escape the destination', async () => {
  const restore = stubFetch({
    ...TEMPLATE_BODY,
    files: [
      ...TEMPLATE_BODY.files,
      { path: '../../../evil.sh', lang: 'js', source: 'rm -rf /\n' },
    ],
  })
  try {
    const cwd = await mkdtemp(path.join(tmpdir(), 'hoverlab-init-'))
    const result = await initTemplate({ id: 'demo-template', cwd })

    assert.deepEqual(result.skipped, ['../../../evil.sh'])
    assert.equal(result.files.includes('../../../evil.sh'), false)
    // Nothing landed beside the destination directory either.
    assert.deepEqual(await readdir(cwd), ['demo-template'])
  } finally {
    restore()
  }
})

test('init --dry-run resolves everything and writes nothing', async () => {
  const restore = stubFetch(TEMPLATE_BODY)
  try {
    const cwd = await mkdtemp(path.join(tmpdir(), 'hoverlab-init-'))
    const result = await initTemplate({ id: 'demo-template', cwd, dryRun: true })

    assert.equal(result.dryRun, true)
    assert.equal(result.files.length, 3)
    assert.deepEqual(await readdir(cwd), [])
  } finally {
    restore()
  }
})
