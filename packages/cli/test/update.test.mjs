import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { fileDigest, readLock, recordInstall } from '../src/lockfile.mjs'

/**
 * `hoverlab update` rests entirely on one claim: that the lockfile can tell
 * a file nobody has touched from one somebody edited. If the hashes are
 * wrong in either direction the command either refuses every update or
 * silently destroys someone's work, so this covers the hashing rather than
 * the printing.
 */

async function scratch() {
  return mkdtemp(path.join(tmpdir(), 'hoverlab-update-'))
}

test('fileDigest is stable, content-addressed, and sensitive to one byte', () => {
  assert.equal(fileDigest('a'), fileDigest('a'))
  assert.notEqual(fileDigest('a'), fileDigest('b'))
  assert.match(fileDigest('a'), /^sha256:[0-9a-f]{64}$/)
})

test('fileDigest distinguishes a trailing newline, which a formatter adds', () => {
  // The case that decides whether "format on save" counts as a local edit.
  // It should: the file on disk is genuinely not what we wrote.
  assert.notEqual(fileDigest('.btn {}\n'), fileDigest('.btn {}'))
})

test('recordInstall hashes what is on disk, not what we meant to write', async () => {
  const dir = await scratch()
  try {
    await mkdir(path.join(dir, 'ui'), { recursive: true })
    const file = path.join(dir, 'ui', 'btn.css')
    await writeFile(file, '.btn { color: red }\n', 'utf8')

    await recordInstall(
      { id: 'btn', level: 'effect', revision: 'r1', framework: 'css', files: [file] },
      dir,
    )

    const lock = await readLock(dir)
    const entry = lock.artifacts.btn
    assert.deepEqual(entry.files, ['ui/btn.css'])
    assert.equal(entry.framework, 'css')
    assert.equal(entry.hashes['ui/btn.css'], fileDigest(await readFile(file, 'utf8')))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('an edited file no longer matches its recorded hash — the whole safety check', async () => {
  const dir = await scratch()
  try {
    const file = path.join(dir, 'btn.css')
    await writeFile(file, '.btn { color: red }\n', 'utf8')
    await recordInstall({ id: 'btn', level: 'effect', revision: 'r1', files: [file] }, dir)

    const before = (await readLock(dir)).artifacts.btn.hashes['btn.css']
    assert.equal(fileDigest(await readFile(file, 'utf8')), before, 'untouched file still matches')

    await writeFile(file, '.btn { color: red } /* mine */\n', 'utf8')
    assert.notEqual(
      fileDigest(await readFile(file, 'utf8')),
      before,
      'an edit must be detectable, or update would overwrite it',
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('no framework is recorded for tiers that do not have one', async () => {
  const dir = await scratch()
  try {
    const file = path.join(dir, 'hero.tsx')
    await writeFile(file, 'export default null\n', 'utf8')
    await recordInstall({ id: 'hero', level: 'block', revision: 'r1', files: [file] }, dir)

    const entry = (await readLock(dir)).artifacts.hero
    assert.equal('framework' in entry, false)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('a file that cannot be read is recorded without a hash, not skipped entirely', async () => {
  // `update` treats a missing hash as "cannot prove this is untouched" and
  // declines to write it, so losing the hash has to be safe rather than
  // silently permissive.
  const dir = await scratch()
  try {
    const real = path.join(dir, 'a.css')
    await writeFile(real, 'x\n', 'utf8')
    const missing = path.join(dir, 'gone.css')

    await recordInstall(
      { id: 'x', level: 'effect', revision: 'r1', files: [real, missing] },
      dir,
    )

    const entry = (await readLock(dir)).artifacts.x
    assert.deepEqual(entry.files.sort(), ['a.css', 'gone.css'])
    assert.equal(typeof entry.hashes['a.css'], 'string')
    assert.equal(entry.hashes['gone.css'], undefined)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('paths outside the project are still refused, hashes or not', async () => {
  const dir = await scratch()
  try {
    const outside = path.join(dir, '..', 'escape.css')
    await writeFile(path.join(dir, 'ok.css'), 'x\n', 'utf8')
    await recordInstall(
      { id: 'x', level: 'effect', revision: 'r1', files: [path.join(dir, 'ok.css'), outside] },
      dir,
    )
    const entry = (await readLock(dir)).artifacts.x
    assert.deepEqual(entry.files, ['ok.css'])
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
