import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { readLock, recordInstall, removeFromLock, LOCK_NAME } from '../src/lockfile.mjs'

async function scratch() {
  return mkdtemp(path.join(tmpdir(), 'hoverlab-lock-'))
}

test('a missing lockfile reads as empty rather than throwing', async () => {
  const dir = await scratch()
  try {
    const lock = await readLock(dir)
    assert.deepEqual(lock.artifacts, {})
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('a corrupt lockfile reads as empty rather than failing an install', async () => {
  // A bad merge should never stop `hoverlab add` from working — the
  // lockfile is an optimisation on a feature nobody invoked at that moment.
  const dir = await scratch()
  try {
    await writeFile(path.join(dir, LOCK_NAME), '{ not json at all', 'utf8')
    const lock = await readLock(dir)
    assert.deepEqual(lock.artifacts, {})
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('an install is recorded with a project-relative posix path', async () => {
  const dir = await scratch()
  try {
    await recordInstall(
      {
        id: 'pricing-tiers',
        level: 'block',
        revision: 'ea0093dc9292',
        files: [path.join(dir, 'components', 'pricing-tiers.tsx')],
      },
      dir,
    )

    const lock = await readLock(dir)
    const entry = lock.artifacts['pricing-tiers']

    assert.equal(entry.revision, 'ea0093dc9292')
    assert.equal(entry.level, 'block')
    // Posix separators, so a lockfile committed on Windows reads on CI.
    assert.deepEqual(entry.files, ['components/pricing-tiers.tsx'])
    assert.match(entry.installedAt, /^\d{4}-\d{2}-\d{2}$/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('nothing is recorded without a revision', async () => {
  // A deployment older than /api/v1/revisions returns no fingerprint.
  // Writing the entry anyway would report the artifact as changed forever.
  const dir = await scratch()
  try {
    const result = await recordInstall(
      { id: 'hero-split', level: 'block', revision: undefined, files: [] },
      dir,
    )
    assert.equal(result, null)
    const lock = await readLock(dir)
    assert.deepEqual(lock.artifacts, {})
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('a file outside the project is not recorded', async () => {
  // `--dir ../../elsewhere` is legal; recording an escaping relative path
  // would put another project's layout into a committed file.
  const dir = await scratch()
  try {
    await recordInstall(
      {
        id: 'x',
        level: 'block',
        revision: 'aaaaaaaaaaaa',
        files: [path.join(dir, '..', 'outside.tsx')],
      },
      dir,
    )
    const lock = await readLock(dir)
    assert.deepEqual(lock.artifacts['x'].files, [])
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('the written file has sorted keys and a trailing newline', async () => {
  // It is committed and reviewed in a pull request, so its diff has to be
  // readable and stable.
  const dir = await scratch()
  try {
    await recordInstall({ id: 'zebra', level: 'block', revision: 'b'.repeat(12) }, dir)
    await recordInstall({ id: 'alpha', level: 'block', revision: 'a'.repeat(12) }, dir)

    const raw = await readFile(path.join(dir, LOCK_NAME), 'utf8')
    assert.ok(raw.endsWith('\n'))
    assert.ok(raw.indexOf('alpha') < raw.indexOf('zebra'))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('removing an id reports whether it was there', async () => {
  const dir = await scratch()
  try {
    await recordInstall({ id: 'a', level: 'block', revision: 'a'.repeat(12) }, dir)
    assert.equal(await removeFromLock('a', dir), true)
    assert.equal(await removeFromLock('a', dir), false)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
